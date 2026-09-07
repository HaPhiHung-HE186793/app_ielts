-- Public key/heartbeat only. The VAPID private key never enters PostgreSQL or Vite.
create table public.reminder_service (
  id boolean primary key default true check (id),
  public_key text not null check (public_key ~ '^[A-Za-z0-9_-]{87}$'),
  heartbeat_at timestamptz not null default now()
);
create table public.reminder_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 1,
  enabled boolean not null default false,
  settings jsonb not null,
  subscription jsonb,
  next_at timestamptz,
  last_status text not null default 'never',
  updated_at timestamptz not null default now()
);
create unique index reminder_endpoint_unique on public.reminder_devices ((subscription->>'endpoint')) where subscription is not null;
create index reminder_due on public.reminder_devices (next_at) where enabled;
create table public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.reminder_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null,
  local_day date not null,
  due_at timestamptz not null,
  status text not null default 'claimed',
  created_at timestamptz not null default now(),
  unique(device_id, local_day)
);
alter table public.reminder_service enable row level security;
alter table public.reminder_devices enable row level security;
alter table public.reminder_deliveries enable row level security;
revoke all on public.reminder_service, public.reminder_devices, public.reminder_deliveries from public, anon, authenticated;
grant select on public.reminder_service, public.reminder_devices, public.reminder_deliveries to authenticated;
grant all on public.reminder_service, public.reminder_devices, public.reminder_deliveries to service_role;
create policy "Read reminder service" on public.reminder_service for select to authenticated using (true);
create policy "Read own reminder device" on public.reminder_devices for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own reminder receipts" on public.reminder_deliveries for select to authenticated using ((select auth.uid()) = user_id);

create function public.reminder_quiet(p_at timestamptz, p_settings jsonb)
returns boolean language plpgsql stable set search_path = '' as $$
declare t time; a time; b time;
begin
  if not (p_settings->>'quietEnabled')::boolean then return false; end if;
  t := (p_at at time zone (p_settings->>'timezone'))::time;
  a := (p_settings->>'quietStart')::time; b := (p_settings->>'quietEnd')::time;
  return case when a < b then t >= a and t < b else t >= a or t < b end;
end; $$;

create function public.reminder_next(p_after timestamptz, p_settings jsonb)
returns timestamptz language plpgsql stable set search_path = '' as $$
declare d date; candidate timestamptz; n integer; zone text := p_settings->>'timezone';
begin
  for n in 0..8 loop
    d := (p_after at time zone zone)::date + n;
    if not (p_settings->'days' @> to_jsonb(extract(isodow from d)::int)) then continue; end if;
    candidate := (d + (p_settings->>'time')::time) at time zone zone;
    -- A nonexistent spring-forward wall time must not silently move the reminder.
    if (candidate at time zone zone)::time <> (p_settings->>'time')::time then continue; end if;
    if candidate > p_after and not public.reminder_quiet(candidate, p_settings) then return candidate; end if;
  end loop;
  return null;
end; $$;

create function public.save_reminder(p_owner uuid, p_id uuid, p_revision integer, p_enabled boolean, p_settings jsonb, p_subscription jsonb default null, p_public_key text default null)
returns public.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current public.reminder_devices; next_time timestamptz; field text;
begin
  if auth.uid() is null or auth.uid() <> p_owner or p_id is null then raise exception 'Not authorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 701));
  select * into current from public.reminder_devices where id = p_id for update;
  if found and (current.user_id <> p_owner or current.revision <> p_revision) then raise exception 'Reminder changed; reload'; end if;
  if not found and p_revision <> 0 then raise exception 'Reminder changed; reload'; end if;
  if current.id is null and (select count(*) from public.reminder_devices where user_id = p_owner) >= 5 then raise exception 'Device limit reached'; end if;
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
  next_time := public.reminder_next(clock_timestamp(), p_settings);
  if next_time is null then raise exception 'Choose a time outside quiet hours'; end if;
  if p_enabled then
    if not exists (select 1 from public.reminder_service where public_key = p_public_key) then raise exception 'Reminder service not configured'; end if;
    if p_subscription is null or jsonb_typeof(p_subscription) <> 'object'
       or (p_subscription->>'endpoint') !~ '^https://(fcm.googleapis.com|updates.push.services.mozilla.com|web.push.apple.com)/[A-Za-z0-9_/:.=-]+$'
       or length(p_subscription->>'endpoint') > 2048
       or coalesce(p_subscription->'keys'->>'p256dh','') !~ '^[A-Za-z0-9_-]{87}$'
       or coalesce(p_subscription->'keys'->>'auth','') !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'Invalid push subscription'; end if;
  end if;
  insert into public.reminder_devices(id,user_id,revision,enabled,settings,subscription,next_at)
  values(p_id,p_owner,1,p_enabled,p_settings,case when p_enabled then p_subscription else null end,case when p_enabled then next_time else null end)
  on conflict(id) do update set revision = reminder_devices.revision + 1, enabled = p_enabled, settings = p_settings,
    subscription = case when p_enabled then p_subscription else null end, next_at = case when p_enabled then next_time else null end,
    last_status = 'never', updated_at = clock_timestamp()
  returning * into current;
  return current;
end; $$;

create function public.snooze_reminder(p_owner uuid, p_id uuid, p_revision integer)
returns public.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current public.reminder_devices; next_time timestamptz;
begin
  if auth.uid() is null or auth.uid() <> p_owner then raise exception 'Not authorized'; end if;
  select * into current from public.reminder_devices where id = p_id and user_id = p_owner for update;
  if not found or current.revision <> p_revision or not current.enabled then raise exception 'Reminder changed; reload'; end if;
  next_time := greatest(current.next_at, clock_timestamp()) + interval '30 minutes';
  next_time := date_trunc('minute', next_time);
  while public.reminder_quiet(next_time, current.settings) loop next_time := next_time + interval '1 minute'; end loop;
  if next_time > clock_timestamp() + interval '14 days' then raise exception 'Snooze limit reached'; end if;
  update public.reminder_devices set next_at = next_time, revision = revision + 1, updated_at = clock_timestamp() where id = p_id returning * into current;
  return current;
end; $$;

-- Service-only clock argument makes timezone/boundary cases testable without changing OS time.
create function public.claim_reminders(p_now timestamptz default clock_timestamp())
returns setof public.reminder_deliveries language plpgsql security definer set search_path = '' as $$
declare device public.reminder_devices; receipt public.reminder_deliveries;
begin
  for device in select * from public.reminder_devices where enabled and next_at <= p_now order by next_at limit 20 for update skip locked loop
    if p_now - device.next_at <= interval '1 minute' and not public.reminder_quiet(p_now, device.settings) then
      insert into public.reminder_deliveries(device_id,user_id,revision,local_day,due_at)
        values(device.id,device.user_id,device.revision,(p_now at time zone (device.settings->>'timezone'))::date,device.next_at)
        on conflict(device_id,local_day) do nothing returning * into receipt;
      if found then return next receipt; end if;
    end if;
    update public.reminder_devices set next_at = public.reminder_next(p_now, device.settings), last_status = 'scheduled' where id = device.id;
  end loop;
end; $$;

create function public.prepare_reminder(p_delivery uuid, p_now timestamptz default clock_timestamp())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare receipt public.reminder_deliveries; device public.reminder_devices;
begin
  select * into receipt from public.reminder_deliveries where id = p_delivery for update;
  if not found or receipt.status <> 'claimed' then return null; end if;
  select * into device from public.reminder_devices where id = receipt.device_id for update;
  if not found or not device.enabled or device.revision <> receipt.revision or p_now > receipt.due_at + interval '1 minute' or public.reminder_quiet(p_now, device.settings) then
    update public.reminder_deliveries set status = 'cancelled' where id = p_delivery; return null;
  end if;
  update public.reminder_deliveries set status = 'attempting' where id = p_delivery;
  return jsonb_build_object('id',receipt.id,'deviceId',device.id,'revision',device.revision,'day',receipt.local_day,
    'subscription',device.subscription,'expiresAt',extract(epoch from (receipt.due_at + interval '1 minute')) * 1000);
end; $$;

create function public.finish_reminder(p_delivery uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare receipt public.reminder_deliveries;
begin
  if p_status not in ('accepted','failed','expired') then raise exception 'Invalid delivery result'; end if;
  update public.reminder_deliveries set status = p_status where id = p_delivery and status = 'attempting' returning * into receipt;
  if not found then return; end if;
  update public.reminder_devices set last_status = p_status,
    enabled = case when p_status = 'expired' then false else enabled end,
    subscription = case when p_status = 'expired' then null else subscription end,
    next_at = case when p_status = 'expired' then null else next_at end
    where id = receipt.device_id and revision = receipt.revision;
end; $$;

revoke all on function public.reminder_quiet(timestamptz,jsonb), public.reminder_next(timestamptz,jsonb),
  public.save_reminder(uuid,uuid,integer,boolean,jsonb,jsonb,text), public.snooze_reminder(uuid,uuid,integer),
  public.claim_reminders(timestamptz),public.prepare_reminder(uuid,timestamptz),public.finish_reminder(uuid,text) from public, anon, authenticated;
grant execute on function public.save_reminder(uuid,uuid,integer,boolean,jsonb,jsonb,text),public.snooze_reminder(uuid,uuid,integer) to authenticated;
grant execute on function public.reminder_quiet(timestamptz,jsonb),public.reminder_next(timestamptz,jsonb),public.claim_reminders(timestamptz),
  public.prepare_reminder(uuid,timestamptz),public.finish_reminder(uuid,text) to service_role;
