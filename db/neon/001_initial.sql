-- Neon PostgreSQL: independent port of the eight existing application migrations.
-- Run once in Neon SQL Editor as database owner. No existing Supabase data is modified.
-- A repeated run fails within this transaction; it never drops application data.
BEGIN;
CREATE SCHEMA moi_ngay;
REVOKE ALL ON SCHEMA moi_ngay FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moi_ngay_api') THEN CREATE ROLE moi_ngay_api NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moi_ngay_worker') THEN CREATE ROLE moi_ngay_worker NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moi_ngay_guest') THEN CREATE ROLE moi_ngay_guest NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moi_ngay_runtime') THEN CREATE ROLE moi_ngay_runtime LOGIN; END IF;
END $$;
GRANT moi_ngay_api, moi_ngay_worker TO moi_ngay_runtime;
GRANT USAGE ON SCHEMA moi_ngay TO moi_ngay_api, moi_ngay_worker;
CREATE TABLE moi_ngay.accounts (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE moi_ngay.accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON moi_ngay.accounts FROM PUBLIC;
-- Only the trusted Render API sets this transaction-local context after verifying Neon JWT.
-- There is no SQL/Data API exposed to browser clients.
CREATE FUNCTION moi_ngay.actor_id() RETURNS uuid LANGUAGE sql STABLE
  SET search_path = '' AS $$ SELECT nullif(current_setting('moi_ngay.actor', true), '')::uuid $$;
REVOKE ALL ON FUNCTION moi_ngay.actor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION moi_ngay.actor_id() TO moi_ngay_api, moi_ngay_worker;
CREATE FUNCTION moi_ngay.ensure_account() RETURNS void LANGUAGE sql SECURITY DEFINER
  SET search_path = '' AS $$ INSERT INTO moi_ngay.accounts(id) VALUES (moi_ngay.actor_id()) ON CONFLICT DO NOTHING $$;
REVOKE ALL ON FUNCTION moi_ngay.ensure_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION moi_ngay.ensure_account() TO moi_ngay_api;

-- Source: 20260906000100_account_profiles.sql
-- DATA-001 stores only the account name. Study events remain local until DATA-002.
create table moi_ngay.account_profiles (
  id uuid primary key references moi_ngay.accounts (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  created_at timestamptz not null default now()
);

alter table moi_ngay.account_profiles enable row level security;
revoke all on moi_ngay.account_profiles from public, moi_ngay_guest, moi_ngay_api;
grant select, delete on moi_ngay.account_profiles to moi_ngay_api;
grant insert (id, display_name), update (id, display_name) on moi_ngay.account_profiles to moi_ngay_api;
grant all on moi_ngay.account_profiles to moi_ngay_worker;

create policy "Read own account profile"
  on moi_ngay.account_profiles for select to moi_ngay_api
  using ((select moi_ngay.actor_id()) = id);
create policy "Create own account profile"
  on moi_ngay.account_profiles for insert to moi_ngay_api
  with check ((select moi_ngay.actor_id()) = id);
create policy "Update own account profile"
  on moi_ngay.account_profiles for update to moi_ngay_api
  using ((select moi_ngay.actor_id()) = id)
  with check ((select moi_ngay.actor_id()) = id);
create policy "Delete own account profile"
  on moi_ngay.account_profiles for delete to moi_ngay_api
  using ((select moi_ngay.actor_id()) = id);


-- Source: 20260906000200_study_sync.sql
-- DATA-002: immutable commits + a current snapshot, written only through atomic CAS.
create table moi_ngay.study_snapshots (
  user_id uuid primary key references moi_ngay.accounts(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table moi_ngay.study_commits (
  user_id uuid not null references moi_ngay.accounts(id) on delete cascade,
  mutation_id uuid not null,
  base_revision bigint not null check (base_revision >= 0),
  revision bigint not null check (revision > 0),
  state jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id),
  unique (user_id, revision)
);
alter table moi_ngay.study_snapshots enable row level security;
alter table moi_ngay.study_commits enable row level security;
revoke all on moi_ngay.study_snapshots, moi_ngay.study_commits from public, moi_ngay_guest, moi_ngay_api;
grant select on moi_ngay.study_snapshots, moi_ngay.study_commits to moi_ngay_api;
grant all on moi_ngay.study_snapshots, moi_ngay.study_commits to moi_ngay_worker;
create policy "Read own study snapshot" on moi_ngay.study_snapshots for select to moi_ngay_api using ((select moi_ngay.actor_id()) = user_id);
create policy "Read own study commits" on moi_ngay.study_commits for select to moi_ngay_api using ((select moi_ngay.actor_id()) = user_id);

create function moi_ngay.commit_study(p_owner uuid, p_mutation uuid, p_expected_revision bigint, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := moi_ngay.actor_id();
  current_row moi_ngay.study_snapshots%rowtype;
  receipt moi_ngay.study_commits%rowtype;
  empty_state jsonb := '{"version":3,"profile":null,"draft":null,"plan":null,"activityLog":[],"planHistory":[],"quickLog":[],"completions":[],"reviews":{},"reviewLog":[]}';
  field text;
begin
  -- Definer is necessary: clients cannot bypass CAS with direct table writes.
  if actor is null or p_owner is distinct from actor then
    raise exception 'Not authorized for this study owner' using errcode = '42501';
  end if;
  if p_mutation is null or p_expected_revision is null or p_expected_revision < 0 or p_expected_revision > 9007199254740990
     or p_state is null or jsonb_typeof(p_state) <> 'object'
     or p_state->'version' is distinct from '3'::jsonb
     or octet_length(p_state::text) > 5000000
     or not (p_state ?& array['profile','draft','plan','activityLog','planHistory','quickLog','completions','reviews','reviewLog'])
     or (select count(*) from jsonb_object_keys(p_state)) <> 10
     or jsonb_typeof(p_state->'reviews') <> 'object' then
    raise exception 'Invalid study document' using errcode = '22023';
  end if;
  foreach field in array array['profile','draft','plan'] loop
    if jsonb_typeof(p_state->field) not in ('object', 'null') then
      raise exception 'Invalid study object' using errcode = '22023';
    end if;
  end loop;
  foreach field in array array['activityLog','planHistory','quickLog','completions','reviewLog'] loop
    if jsonb_typeof(p_state->field) <> 'array' then
      raise exception 'Invalid study history' using errcode = '22023';
    end if;
    if jsonb_array_length(p_state->field) > (case when field in ('completions','planHistory') then 20000 else 50000 end) then
      raise exception 'Study history exceeds limit' using errcode = '22023';
    end if;
  end loop;
  insert into moi_ngay.study_snapshots(user_id, state) values (actor, empty_state) on conflict (user_id) do nothing;
  select * into current_row from moi_ngay.study_snapshots where user_id = actor for update;
  select * into receipt from moi_ngay.study_commits where user_id = actor and mutation_id = p_mutation;
  if found then
    if receipt.state is distinct from p_state or receipt.base_revision <> p_expected_revision then
      raise exception 'Mutation ID already used for another payload' using errcode = '22023';
    end if;
    return jsonb_build_object('status', 'applied', 'revision', receipt.revision);
  end if;
  if current_row.revision <> p_expected_revision then
    return jsonb_build_object('status', 'conflict', 'revision', current_row.revision, 'state', current_row.state);
  end if;
  insert into moi_ngay.study_commits(user_id, mutation_id, base_revision, revision, state)
    values (actor, p_mutation, p_expected_revision, current_row.revision + 1, p_state);
  update moi_ngay.study_snapshots set state = p_state, revision = current_row.revision + 1, updated_at = now() where user_id = actor;
  return jsonb_build_object('status', 'applied', 'revision', current_row.revision + 1);
end;
$$;
revoke all on function moi_ngay.commit_study(uuid, uuid, bigint, jsonb) from public, moi_ngay_guest, moi_ngay_api;
grant execute on function moi_ngay.commit_study(uuid, uuid, bigint, jsonb) to moi_ngay_api;


-- Source: 20260906000300_study_commit_changes.sql
-- Keep immutable receipts and changed records, without copying all past learning on each keystroke.
-- Upgrade any existing receipts without losing their data or retry identity.
alter table moi_ngay.study_commits add column payload_hash text;
alter table moi_ngay.study_commits add column changes jsonb;
update moi_ngay.study_commits
  set payload_hash = encode(sha256(convert_to(state::text, 'UTF8')), 'hex'),
      changes = jsonb_build_object('legacySnapshot', state);
alter table moi_ngay.study_commits alter column payload_hash set not null;
alter table moi_ngay.study_commits alter column changes set not null;
alter table moi_ngay.study_commits add constraint study_commit_hash_length check (length(payload_hash) = 64);
alter table moi_ngay.study_commits drop column state;

create or replace function moi_ngay.commit_study(p_owner uuid, p_mutation uuid, p_expected_revision bigint, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := moi_ngay.actor_id();
  current_row moi_ngay.study_snapshots%rowtype;
  receipt moi_ngay.study_commits%rowtype;
  empty_state jsonb := '{"version":3,"profile":null,"draft":null,"plan":null,"activityLog":[],"planHistory":[],"quickLog":[],"completions":[],"reviews":{},"reviewLog":[]}';
  field text;
  submitted_hash text := encode(sha256(convert_to(p_state::text, 'UTF8')), 'hex');
  changes jsonb := '{}';
  before_items jsonb;
  after_items jsonb;
  upserts jsonb;
  removed jsonb;
begin
  -- Definer is necessary: clients cannot bypass CAS with direct table writes.
  if actor is null or p_owner is distinct from actor then
    raise exception 'Not authorized for this study owner' using errcode = '42501';
  end if;
  if p_mutation is null or p_expected_revision is null or p_expected_revision < 0 or p_expected_revision > 9007199254740990
     or p_state is null or jsonb_typeof(p_state) <> 'object'
     or p_state->'version' is distinct from '3'::jsonb
     or octet_length(p_state::text) > 5000000
     or not (p_state ?& array['profile','draft','plan','activityLog','planHistory','quickLog','completions','reviews','reviewLog'])
     or (select count(*) from jsonb_object_keys(p_state)) <> 10
     or jsonb_typeof(p_state->'reviews') <> 'object' then
    raise exception 'Invalid study document' using errcode = '22023';
  end if;
  foreach field in array array['profile','draft','plan'] loop
    if jsonb_typeof(p_state->field) not in ('object', 'null') then
      raise exception 'Invalid study object' using errcode = '22023';
    end if;
  end loop;
  foreach field in array array['activityLog','planHistory','quickLog','completions','reviewLog'] loop
    if jsonb_typeof(p_state->field) <> 'array' then
      raise exception 'Invalid study history' using errcode = '22023';
    end if;
    if jsonb_array_length(p_state->field) > (case when field in ('completions','planHistory') then 20000 else 50000 end) then
      raise exception 'Study history exceeds limit' using errcode = '22023';
    end if;
  end loop;
  insert into moi_ngay.study_snapshots(user_id, state) values (actor, empty_state) on conflict (user_id) do nothing;
  select * into current_row from moi_ngay.study_snapshots where user_id = actor for update;
  select * into receipt from moi_ngay.study_commits where user_id = actor and mutation_id = p_mutation;
  if found then
    if receipt.payload_hash is distinct from submitted_hash or receipt.base_revision <> p_expected_revision then
      raise exception 'Mutation ID already used for another payload' using errcode = '22023';
    end if;
    return jsonb_build_object('status', 'applied', 'revision', receipt.revision);
  end if;
  if current_row.revision <> p_expected_revision then
    return jsonb_build_object('status', 'conflict', 'revision', current_row.revision, 'state', current_row.state);
  end if;
  foreach field in array array['profile','draft','plan','reviews'] loop
    if current_row.state->field is distinct from p_state->field then
      changes := changes || jsonb_build_object(field, p_state->field);
    end if;
  end loop;
  foreach field in array array['activityLog','planHistory','quickLog','completions','reviewLog'] loop
    if exists (select 1 from jsonb_array_elements(p_state->field) item where jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' = '')
       or (select count(*) <> count(distinct item->>'id') from jsonb_array_elements(p_state->field) item) then
      raise exception 'Invalid or duplicate attempt IDs' using errcode = '22023';
    end if;
    select coalesce(jsonb_object_agg(item->>'id', item), '{}'::jsonb)
      into before_items from jsonb_array_elements(current_row.state->field) item;
    select coalesce(jsonb_object_agg(item->>'id', item), '{}'::jsonb)
      into after_items from jsonb_array_elements(p_state->field) item;
    select coalesce(jsonb_agg(value order by key), '[]'::jsonb)
      into upserts from jsonb_each(after_items) where before_items->key is distinct from value;
    select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
      into removed from jsonb_each(before_items) where not (after_items ? key);
    if upserts <> '[]'::jsonb or removed <> '[]'::jsonb then
      changes := changes || jsonb_build_object(field, jsonb_build_object('upsert', upserts, 'removed', removed));
    end if;
  end loop;
  insert into moi_ngay.study_commits(user_id, mutation_id, base_revision, revision, payload_hash, changes)
    values (actor, p_mutation, p_expected_revision, current_row.revision + 1, submitted_hash, changes);
  update moi_ngay.study_snapshots set state = p_state, revision = current_row.revision + 1, updated_at = now() where user_id = actor;
  return jsonb_build_object('status', 'applied', 'revision', current_row.revision + 1);
end;
$$;
revoke all on function moi_ngay.commit_study(uuid, uuid, bigint, jsonb) from public, moi_ngay_guest, moi_ngay_api;
grant execute on function moi_ngay.commit_study(uuid, uuid, bigint, jsonb) to moi_ngay_api;


-- Source: 20260907000100_reminders.sql
-- Public key/heartbeat only. The VAPID private key never enters PostgreSQL or Vite.
create table moi_ngay.reminder_service (
  id boolean primary key default true check (id),
  public_key text not null check (public_key ~ '^[A-Za-z0-9_-]{87}$'),
  heartbeat_at timestamptz not null default now()
);
create table moi_ngay.reminder_devices (
  id uuid primary key,
  user_id uuid not null references moi_ngay.accounts(id) on delete cascade,
  revision integer not null default 1,
  enabled boolean not null default false,
  settings jsonb not null,
  subscription jsonb,
  next_at timestamptz,
  last_status text not null default 'never',
  updated_at timestamptz not null default now()
);
create unique index reminder_endpoint_unique on moi_ngay.reminder_devices ((subscription->>'endpoint')) where subscription is not null;
create index reminder_due on moi_ngay.reminder_devices (next_at) where enabled;
create table moi_ngay.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references moi_ngay.reminder_devices(id) on delete cascade,
  user_id uuid not null references moi_ngay.accounts(id) on delete cascade,
  revision integer not null,
  local_day date not null,
  due_at timestamptz not null,
  status text not null default 'claimed',
  created_at timestamptz not null default now(),
  unique(device_id, local_day)
);
alter table moi_ngay.reminder_service enable row level security;
alter table moi_ngay.reminder_devices enable row level security;
alter table moi_ngay.reminder_deliveries enable row level security;
revoke all on moi_ngay.reminder_service, moi_ngay.reminder_devices, moi_ngay.reminder_deliveries from public, moi_ngay_guest, moi_ngay_api;
grant select on moi_ngay.reminder_service, moi_ngay.reminder_devices, moi_ngay.reminder_deliveries to moi_ngay_api;
grant all on moi_ngay.reminder_service, moi_ngay.reminder_devices, moi_ngay.reminder_deliveries to moi_ngay_worker;
create policy "Read reminder service" on moi_ngay.reminder_service for select to moi_ngay_api using (true);
create policy "Read own reminder device" on moi_ngay.reminder_devices for select to moi_ngay_api using ((select moi_ngay.actor_id()) = user_id);
create policy "Read own reminder receipts" on moi_ngay.reminder_deliveries for select to moi_ngay_api using ((select moi_ngay.actor_id()) = user_id);

create function moi_ngay.reminder_quiet(p_at timestamptz, p_settings jsonb)
returns boolean language plpgsql stable set search_path = '' as $$
declare t time; a time; b time;
begin
  if not (p_settings->>'quietEnabled')::boolean then return false; end if;
  t := (p_at at time zone (p_settings->>'timezone'))::time;
  a := (p_settings->>'quietStart')::time; b := (p_settings->>'quietEnd')::time;
  return case when a < b then t >= a and t < b else t >= a or t < b end;
end; $$;

create function moi_ngay.reminder_next(p_after timestamptz, p_settings jsonb)
returns timestamptz language plpgsql stable set search_path = '' as $$
declare d date; candidate timestamptz; n integer; zone text := p_settings->>'timezone';
begin
  for n in 0..8 loop
    d := (p_after at time zone zone)::date + n;
    if not (p_settings->'days' @> to_jsonb(extract(isodow from d)::int)) then continue; end if;
    candidate := (d + (p_settings->>'time')::time) at time zone zone;
    -- A nonexistent spring-forward wall time must not silently move the reminder.
    if (candidate at time zone zone)::time <> (p_settings->>'time')::time then continue; end if;
    if candidate > p_after and not moi_ngay.reminder_quiet(candidate, p_settings) then return candidate; end if;
  end loop;
  return null;
end; $$;

create function moi_ngay.save_reminder(p_owner uuid, p_id uuid, p_revision integer, p_enabled boolean, p_settings jsonb, p_subscription jsonb default null, p_public_key text default null)
returns moi_ngay.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current moi_ngay.reminder_devices; next_time timestamptz; field text;
begin
  if moi_ngay.actor_id() is null or moi_ngay.actor_id() <> p_owner or p_id is null then raise exception 'Not authorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 701));
  select * into current from moi_ngay.reminder_devices where id = p_id for update;
  if found and (current.user_id <> p_owner or current.revision <> p_revision) then raise exception 'Reminder changed; reload'; end if;
  if not found and p_revision <> 0 then raise exception 'Reminder changed; reload'; end if;
  if current.id is null and (select count(*) from moi_ngay.reminder_devices where user_id = p_owner) >= 5 then raise exception 'Device limit reached'; end if;
  if jsonb_typeof(p_settings) <> 'object' or not (p_settings ?& array['time','timezone','days','quietEnabled','quietStart','quietEnd'])
     or p_settings - array['time','timezone','days','quietEnabled','quietStart','quietEnd'] <> '{}'::jsonb
     or jsonb_typeof(p_settings->'days') <> 'array' or jsonb_array_length(p_settings->'days') not between 1 and 7
     or jsonb_typeof(p_settings->'quietEnabled') <> 'boolean' then raise exception 'Invalid settings'; end if;
  foreach field in array array['time','quietStart','quietEnd'] loop
    if jsonb_typeof(p_settings->field) <> 'string' or (p_settings->>field) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid clock time'; end if;
  end loop;
  if not exists (select 1 from pg_timezone_names where name = p_settings->>'timezone') then raise exception 'Invalid timezone'; end if;
  if exists (select 1 from jsonb_array_elements(p_settings->'days') x where x::text !~ '^[1-7]$')
     or (select count(distinct x) from jsonb_array_elements(p_settings->'days') x) <> jsonb_array_length(p_settings->'days') then raise exception 'Invalid days'; end if;
  if (p_settings->>'quietEnabled')::boolean and p_settings->>'quietStart' = p_settings->>'quietEnd' then raise exception 'Quiet interval must have a start and end'; end if;
  next_time := moi_ngay.reminder_next(clock_timestamp(), p_settings);
  if next_time is null then raise exception 'Choose a time outside quiet hours'; end if;
  if p_enabled then
    if not exists (select 1 from moi_ngay.reminder_service where public_key = p_public_key) then raise exception 'Reminder service not configured'; end if;
    if p_subscription is null or jsonb_typeof(p_subscription) <> 'object'
       or (p_subscription->>'endpoint') !~ '^https://(fcm.googleapis.com|updates.push.services.mozilla.com|web.push.apple.com)/[A-Za-z0-9_/:.=-]+$'
       or length(p_subscription->>'endpoint') > 2048
       or coalesce(p_subscription->'keys'->>'p256dh','') !~ '^[A-Za-z0-9_-]{87}$'
       or coalesce(p_subscription->'keys'->>'auth','') !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'Invalid push subscription'; end if;
  end if;
  insert into moi_ngay.reminder_devices(id,user_id,revision,enabled,settings,subscription,next_at)
  values(p_id,p_owner,1,p_enabled,p_settings,case when p_enabled then p_subscription else null end,case when p_enabled then next_time else null end)
  on conflict(id) do update set revision = reminder_devices.revision + 1, enabled = p_enabled, settings = p_settings,
    subscription = case when p_enabled then p_subscription else null end, next_at = case when p_enabled then next_time else null end,
    last_status = 'never', updated_at = clock_timestamp()
  returning * into current;
  return current;
end; $$;

create function moi_ngay.snooze_reminder(p_owner uuid, p_id uuid, p_revision integer)
returns moi_ngay.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current moi_ngay.reminder_devices; next_time timestamptz;
begin
  if moi_ngay.actor_id() is null or moi_ngay.actor_id() <> p_owner then raise exception 'Not authorized'; end if;
  select * into current from moi_ngay.reminder_devices where id = p_id and user_id = p_owner for update;
  if not found or current.revision <> p_revision or not current.enabled then raise exception 'Reminder changed; reload'; end if;
  next_time := greatest(current.next_at, clock_timestamp()) + interval '30 minutes';
  next_time := date_trunc('minute', next_time);
  while moi_ngay.reminder_quiet(next_time, current.settings) loop next_time := next_time + interval '1 minute'; end loop;
  if next_time > clock_timestamp() + interval '14 days' then raise exception 'Snooze limit reached'; end if;
  update moi_ngay.reminder_devices set next_at = next_time, revision = revision + 1, updated_at = clock_timestamp() where id = p_id returning * into current;
  return current;
end; $$;

-- Service-only clock argument makes timezone/boundary cases testable without changing OS time.
create function moi_ngay.claim_reminders(p_now timestamptz default clock_timestamp())
returns setof moi_ngay.reminder_deliveries language plpgsql security definer set search_path = '' as $$
declare device moi_ngay.reminder_devices; receipt moi_ngay.reminder_deliveries;
begin
  for device in select * from moi_ngay.reminder_devices where enabled and next_at <= p_now order by next_at limit 20 for update skip locked loop
    if p_now - device.next_at <= interval '1 minute' and not moi_ngay.reminder_quiet(p_now, device.settings) then
      insert into moi_ngay.reminder_deliveries(device_id,user_id,revision,local_day,due_at)
        values(device.id,device.user_id,device.revision,(p_now at time zone (device.settings->>'timezone'))::date,device.next_at)
        on conflict(device_id,local_day) do nothing returning * into receipt;
      if found then return next receipt; end if;
    end if;
    update moi_ngay.reminder_devices set next_at = moi_ngay.reminder_next(p_now, device.settings), last_status = 'scheduled' where id = device.id;
  end loop;
end; $$;

create function moi_ngay.prepare_reminder(p_delivery uuid, p_now timestamptz default clock_timestamp())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare receipt moi_ngay.reminder_deliveries; device moi_ngay.reminder_devices;
begin
  select * into receipt from moi_ngay.reminder_deliveries where id = p_delivery for update;
  if not found or receipt.status <> 'claimed' then return null; end if;
  select * into device from moi_ngay.reminder_devices where id = receipt.device_id for update;
  if not found or not device.enabled or device.revision <> receipt.revision or p_now > receipt.due_at + interval '1 minute' or moi_ngay.reminder_quiet(p_now, device.settings) then
    update moi_ngay.reminder_deliveries set status = 'cancelled' where id = p_delivery; return null;
  end if;
  update moi_ngay.reminder_deliveries set status = 'attempting' where id = p_delivery;
  return jsonb_build_object('id',receipt.id,'deviceId',device.id,'revision',device.revision,'day',receipt.local_day,
    'subscription',device.subscription,'expiresAt',extract(epoch from (receipt.due_at + interval '1 minute')) * 1000);
end; $$;

create function moi_ngay.finish_reminder(p_delivery uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare receipt moi_ngay.reminder_deliveries;
begin
  if p_status not in ('accepted','failed','expired') then raise exception 'Invalid delivery result'; end if;
  update moi_ngay.reminder_deliveries set status = p_status where id = p_delivery and status = 'attempting' returning * into receipt;
  if not found then return; end if;
  update moi_ngay.reminder_devices set last_status = p_status,
    enabled = case when p_status = 'expired' then false else enabled end,
    subscription = case when p_status = 'expired' then null else subscription end,
    next_at = case when p_status = 'expired' then null else next_at end
    where id = receipt.device_id and revision = receipt.revision;
end; $$;

revoke all on function moi_ngay.reminder_quiet(timestamptz,jsonb), moi_ngay.reminder_next(timestamptz,jsonb),
  moi_ngay.save_reminder(uuid,uuid,integer,boolean,jsonb,jsonb,text), moi_ngay.snooze_reminder(uuid,uuid,integer),
  moi_ngay.claim_reminders(timestamptz),moi_ngay.prepare_reminder(uuid,timestamptz),moi_ngay.finish_reminder(uuid,text) from public, moi_ngay_guest, moi_ngay_api;
grant execute on function moi_ngay.save_reminder(uuid,uuid,integer,boolean,jsonb,jsonb,text),moi_ngay.snooze_reminder(uuid,uuid,integer) to moi_ngay_api;
grant execute on function moi_ngay.reminder_quiet(timestamptz,jsonb),moi_ngay.reminder_next(timestamptz,jsonb),moi_ngay.claim_reminders(timestamptz),
  moi_ngay.prepare_reminder(uuid,timestamptz),moi_ngay.finish_reminder(uuid,text) to moi_ngay_worker;


-- Source: 20260907000200_reminder_validation.sql
-- Reject explicit nulls before revision/owner checks; endpoint host dots are literal.
create or replace function moi_ngay.save_reminder(p_owner uuid, p_id uuid, p_revision integer, p_enabled boolean, p_settings jsonb, p_subscription jsonb default null, p_public_key text default null)
returns moi_ngay.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current moi_ngay.reminder_devices; next_time timestamptz; field text;
begin
  if moi_ngay.actor_id() is null or p_owner is null or moi_ngay.actor_id() <> p_owner or p_id is null or p_revision is null or p_revision < 0 or p_enabled is null or p_settings is null then raise exception 'Not authorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 701));
  select * into current from moi_ngay.reminder_devices where id = p_id for update;
  if found and (current.user_id <> p_owner or current.revision <> p_revision) then raise exception 'Reminder changed; reload'; end if;
  if not found and p_revision <> 0 then raise exception 'Reminder changed; reload'; end if;
  if current.id is null and (select count(*) from moi_ngay.reminder_devices where user_id = p_owner) >= 5 then raise exception 'Device limit reached'; end if;
  if jsonb_typeof(p_settings) <> 'object' or not (p_settings ?& array['time','timezone','days','quietEnabled','quietStart','quietEnd'])
     or p_settings - array['time','timezone','days','quietEnabled','quietStart','quietEnd'] <> '{}'::jsonb
     or jsonb_typeof(p_settings->'days') <> 'array' or jsonb_array_length(p_settings->'days') not between 1 and 7
     or jsonb_typeof(p_settings->'quietEnabled') <> 'boolean' then raise exception 'Invalid settings'; end if;
  foreach field in array array['time','quietStart','quietEnd'] loop
    if jsonb_typeof(p_settings->field) <> 'string' or (p_settings->>field) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid clock time'; end if;
  end loop;
  if not exists (select 1 from pg_timezone_names where name = p_settings->>'timezone') then raise exception 'Invalid timezone'; end if;
  if exists (select 1 from jsonb_array_elements(p_settings->'days') x where x::text !~ '^[1-7]$')
     or (select count(distinct x) from jsonb_array_elements(p_settings->'days') x) <> jsonb_array_length(p_settings->'days') then raise exception 'Invalid days'; end if;
  if (p_settings->>'quietEnabled')::boolean and p_settings->>'quietStart' = p_settings->>'quietEnd' then raise exception 'Quiet interval must have a start and end'; end if;
  next_time := moi_ngay.reminder_next(clock_timestamp(), p_settings);
  if next_time is null then raise exception 'Choose a time outside quiet hours'; end if;
  if p_enabled then
    if not exists (select 1 from moi_ngay.reminder_service where public_key = p_public_key) then raise exception 'Reminder service not configured'; end if;
    if p_subscription is null or jsonb_typeof(p_subscription) <> 'object'
       or coalesce(p_subscription->>'endpoint','') !~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com)/[A-Za-z0-9_/:.=-]+$'
       or length(p_subscription->>'endpoint') > 2048
       or coalesce(p_subscription->'keys'->>'p256dh','') !~ '^[A-Za-z0-9_-]{87}$'
       or coalesce(p_subscription->'keys'->>'auth','') !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'Invalid push subscription'; end if;
  end if;
  insert into moi_ngay.reminder_devices(id,user_id,revision,enabled,settings,subscription,next_at)
  values(p_id,p_owner,1,p_enabled,p_settings,case when p_enabled then p_subscription else null end,case when p_enabled then next_time else null end)
  on conflict(id) do update set revision = reminder_devices.revision + 1, enabled = p_enabled, settings = p_settings,
    subscription = case when p_enabled then p_subscription else null end, next_at = case when p_enabled then next_time else null end,
    last_status = 'never', updated_at = clock_timestamp()
  returning * into current;
  return current;
end; $$;

create or replace function moi_ngay.snooze_reminder(p_owner uuid, p_id uuid, p_revision integer)
returns moi_ngay.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current moi_ngay.reminder_devices; next_time timestamptz;
begin
  if moi_ngay.actor_id() is null or p_owner is null or p_revision is null or moi_ngay.actor_id() <> p_owner then raise exception 'Not authorized'; end if;
  select * into current from moi_ngay.reminder_devices where id = p_id and user_id = p_owner for update;
  if not found or current.revision <> p_revision or not current.enabled then raise exception 'Reminder changed; reload'; end if;
  next_time := greatest(current.next_at, clock_timestamp()) + interval '30 minutes';
  next_time := date_trunc('minute', next_time);
  while moi_ngay.reminder_quiet(next_time, current.settings) loop next_time := next_time + interval '1 minute'; end loop;
  if next_time > clock_timestamp() + interval '14 days' then raise exception 'Snooze limit reached'; end if;
  update moi_ngay.reminder_devices set next_at = next_time, revision = revision + 1, updated_at = clock_timestamp() where id = p_id returning * into current;
  return current;
end; $$;


-- Source: 20260907000300_reminder_lock_order.sql
-- Consistent device -> receipt lock order, including completion and duplicate claims.
create or replace function moi_ngay.prepare_reminder(p_delivery uuid, p_now timestamptz default clock_timestamp())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare receipt moi_ngay.reminder_deliveries; device moi_ngay.reminder_devices;
begin
  select * into receipt from moi_ngay.reminder_deliveries where id = p_delivery;
  if not found then return null; end if;
  select * into device from moi_ngay.reminder_devices where id = receipt.device_id for update;
  if not found then return null; end if;
  select * into receipt from moi_ngay.reminder_deliveries where id = p_delivery for update;
  if not found or receipt.status <> 'claimed' then return null; end if;
  if not device.enabled or device.revision <> receipt.revision or p_now > receipt.due_at + interval '1 minute' or moi_ngay.reminder_quiet(p_now, device.settings) then
    update moi_ngay.reminder_deliveries set status = 'cancelled' where id = p_delivery; return null;
  end if;
  update moi_ngay.reminder_deliveries set status = 'attempting' where id = p_delivery;
  return jsonb_build_object('id',receipt.id,'deviceId',device.id,'revision',device.revision,'day',receipt.local_day,
    'subscription',device.subscription,'expiresAt',extract(epoch from (receipt.due_at + interval '1 minute')) * 1000);
end; $$;

create or replace function moi_ngay.finish_reminder(p_delivery uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare receipt moi_ngay.reminder_deliveries;
begin
  if p_status is null or p_status not in ('accepted','failed','expired') then raise exception 'Invalid delivery result'; end if;
  select * into receipt from moi_ngay.reminder_deliveries where id = p_delivery;
  if not found then return; end if;
  perform 1 from moi_ngay.reminder_devices where id = receipt.device_id for update;
  update moi_ngay.reminder_deliveries set status = p_status where id = p_delivery and status = 'attempting' returning * into receipt;
  if not found then return; end if;
  update moi_ngay.reminder_devices set last_status = p_status,
    enabled = case when p_status = 'expired' then false else enabled end,
    subscription = case when p_status = 'expired' then null else subscription end,
    next_at = case when p_status = 'expired' then null else next_at end
    where id = receipt.device_id and revision = receipt.revision;
end; $$;


-- Source: 20260907000400_reminder_scoped_probe.sql
-- Allow service-only checks to touch exactly their own test device.
drop function moi_ngay.claim_reminders(timestamptz);
create function moi_ngay.claim_reminders(p_now timestamptz default clock_timestamp(), p_device uuid default null)
returns setof moi_ngay.reminder_deliveries language plpgsql security definer set search_path = '' as $$
declare device moi_ngay.reminder_devices; receipt moi_ngay.reminder_deliveries;
begin
  for device in select * from moi_ngay.reminder_devices
    where enabled and next_at <= p_now and (p_device is null or id = p_device)
    order by next_at limit 20 for update skip locked loop
    if p_now - device.next_at <= interval '1 minute' and not moi_ngay.reminder_quiet(p_now, device.settings) then
      insert into moi_ngay.reminder_deliveries(device_id,user_id,revision,local_day,due_at)
        values(device.id,device.user_id,device.revision,(p_now at time zone (device.settings->>'timezone'))::date,device.next_at)
        on conflict(device_id,local_day) do nothing returning * into receipt;
      if found then return next receipt; end if;
    end if;
    update moi_ngay.reminder_devices set next_at = moi_ngay.reminder_next(p_now, device.settings), last_status = 'scheduled' where id = device.id;
  end loop;
end; $$;
revoke all on function moi_ngay.claim_reminders(timestamptz,uuid) from public, moi_ngay_guest, moi_ngay_api;
grant execute on function moi_ngay.claim_reminders(timestamptz,uuid) to moi_ngay_worker;


-- Source: 20260907000500_ai_request_budget.sql
-- AI writes are service-only. The HTTP server must verify the bearer token before passing owner.
create table moi_ngay.ai_budgets (
  id uuid primary key,
  enabled boolean not null default false,
  limit_micro_usd bigint not null default 0 check (limit_micro_usd between 0 and 10000000),
  accounted_micro_usd bigint not null default 0 check (accounted_micro_usd >= 0)
);
create table moi_ngay.ai_requests (
  user_id uuid not null references moi_ngay.accounts(id) on delete cascade,
  request_id uuid not null,
  budget_id uuid not null references moi_ngay.ai_budgets(id) on delete cascade,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending','completed','failed','unknown')),
  reserved_micro_usd bigint not null default 10000 check (reserved_micro_usd = 10000),
  accounted_micro_usd bigint not null default 10000 check (accounted_micro_usd >= 0),
  response jsonb,
  error_code text,
  created_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  primary key(user_id,request_id)
);
create index ai_requests_budget_time on moi_ngay.ai_requests(budget_id,created_at);
alter table moi_ngay.ai_budgets enable row level security;
alter table moi_ngay.ai_requests enable row level security;
revoke all on moi_ngay.ai_budgets,moi_ngay.ai_requests from public,moi_ngay_guest,moi_ngay_api;
grant all on moi_ngay.ai_budgets,moi_ngay.ai_requests to moi_ngay_worker;
grant select on moi_ngay.ai_requests to moi_ngay_api;
create policy "Read own AI request" on moi_ngay.ai_requests for select to moi_ngay_api using ((select moi_ngay.actor_id()) = user_id);

create function moi_ngay.configure_ai_budget(p_id uuid,p_enabled boolean,p_limit bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or p_enabled is null or p_limit is null or p_limit not between 0 and 10000000 then raise exception 'Invalid budget configuration'; end if;
  insert into moi_ngay.ai_budgets(id,enabled,limit_micro_usd) values(p_id,p_enabled,p_limit)
  on conflict(id) do update set enabled = p_enabled,limit_micro_usd = p_limit;
  -- Never reset accounted spend on a restart or after account deletion.
end; $$;

create function moi_ngay.reserve_ai_request(p_budget uuid,p_owner uuid,p_request uuid,p_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare budget moi_ngay.ai_budgets; previous moi_ngay.ai_requests; utc_start timestamptz;
begin
  if p_owner is null or p_request is null or p_budget is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request identity'; end if;
  select * into budget from moi_ngay.ai_budgets where id = p_budget for update;
  if not found then return jsonb_build_object('status','unavailable'); end if;
  update moi_ngay.ai_requests set status = 'unknown',error_code = 'timeout',finished_at = clock_timestamp()
    where budget_id = p_budget and status = 'pending' and created_at < clock_timestamp() - interval '2 minutes';
  select * into previous from moi_ngay.ai_requests where user_id = p_owner and request_id = p_request for update;
  if found then
    if previous.payload_hash <> p_hash or previous.budget_id <> p_budget then return jsonb_build_object('status','conflict'); end if;
    if previous.status = 'completed' and previous.response is not null and previous.finished_at > clock_timestamp() - interval '24 hours' then
      return jsonb_build_object('status','replay','response',previous.response);
    end if;
    return jsonb_build_object('status',case when previous.status = 'pending' then 'pending' else 'used' end);
  end if;
  if not budget.enabled then return jsonb_build_object('status','unavailable'); end if;
  if budget.accounted_micro_usd + 10000 > budget.limit_micro_usd then return jsonb_build_object('status','budget'); end if;
  utc_start := date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  if (select count(*) from moi_ngay.ai_requests where budget_id = p_budget and user_id = p_owner and created_at >= utc_start) >= 10
     or exists (select 1 from moi_ngay.ai_requests where budget_id = p_budget and user_id = p_owner and created_at > clock_timestamp() - interval '20 seconds') then return jsonb_build_object('status','quota'); end if;
  if (select count(*) from moi_ngay.ai_requests where budget_id = p_budget and status = 'pending') >= 2
     or exists (select 1 from moi_ngay.ai_requests where budget_id = p_budget and user_id = p_owner and status = 'pending') then return jsonb_build_object('status','busy'); end if;
  insert into moi_ngay.ai_requests(user_id,request_id,budget_id,payload_hash) values(p_owner,p_request,p_budget,p_hash);
  update moi_ngay.ai_budgets set accounted_micro_usd = accounted_micro_usd + 10000 where id = p_budget;
  return jsonb_build_object('status','reserved');
end; $$;

create function moi_ngay.finish_ai_request(p_budget uuid,p_owner uuid,p_request uuid,p_response jsonb,p_error text,p_cost bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare receipt moi_ngay.ai_requests; cost bigint;
begin
  if p_cost is not null and (p_cost < 0 or p_cost > 100000000) then raise exception 'Invalid cost'; end if;
  if p_response is not null and (jsonb_typeof(p_response) <> 'object' or octet_length(p_response::text) > 16000
    or coalesce(p_response->>'ownerId','') <> p_owner::text or coalesce(p_response->>'requestId','') <> p_request::text) then raise exception 'Invalid response identity'; end if;
  if p_response is null and (p_error is null or p_error not in ('timeout','provider_error','invalid_feedback','invalid')) then raise exception 'Invalid failure'; end if;
  perform 1 from moi_ngay.ai_budgets where id = p_budget for update;
  if not found then return false; end if;
  select * into receipt from moi_ngay.ai_requests where budget_id = p_budget and user_id = p_owner and request_id = p_request for update;
  if not found or receipt.status <> 'pending' then return false; end if;
  cost := coalesce(p_cost,receipt.reserved_micro_usd);
  update moi_ngay.ai_budgets set accounted_micro_usd = accounted_micro_usd - receipt.reserved_micro_usd + cost,
    enabled = case when cost > receipt.reserved_micro_usd then false else enabled end where id = p_budget;
  update moi_ngay.ai_requests set status = case when p_response is null then 'failed' else 'completed' end,
    response = p_response,error_code = p_error,accounted_micro_usd = cost,finished_at = clock_timestamp()
    where user_id = p_owner and request_id = p_request;
  return true;
end; $$;

create function moi_ngay.purge_ai_responses(p_budget uuid)
returns void language sql security definer set search_path = '' as $$
  update moi_ngay.ai_requests set response = null where budget_id = p_budget and response is not null and finished_at <= clock_timestamp() - interval '24 hours';
$$;

revoke all on function moi_ngay.configure_ai_budget(uuid,boolean,bigint),moi_ngay.reserve_ai_request(uuid,uuid,uuid,text),
  moi_ngay.finish_ai_request(uuid,uuid,uuid,jsonb,text,bigint),moi_ngay.purge_ai_responses(uuid) from public,moi_ngay_guest,moi_ngay_api;
grant execute on function moi_ngay.configure_ai_budget(uuid,boolean,bigint),moi_ngay.reserve_ai_request(uuid,uuid,uuid,text),
  moi_ngay.finish_ai_request(uuid,uuid,uuid,jsonb,text,bigint),moi_ngay.purge_ai_responses(uuid) to moi_ngay_worker;

-- Worker access is explicit; this role is not BYPASSRLS.
CREATE POLICY worker_access ON moi_ngay.account_profiles TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.study_snapshots TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.study_commits TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.reminder_service TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.reminder_devices TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.reminder_deliveries TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.ai_budgets TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_access ON moi_ngay.ai_requests TO moi_ngay_worker USING (true) WITH CHECK (true);
CREATE TABLE moi_ngay.schema_version (version integer PRIMARY KEY CHECK (version = 1));
INSERT INTO moi_ngay.schema_version VALUES (1);
REVOKE ALL ON moi_ngay.schema_version FROM PUBLIC;
GRANT SELECT ON moi_ngay.schema_version TO moi_ngay_api, moi_ngay_worker;
COMMIT;
