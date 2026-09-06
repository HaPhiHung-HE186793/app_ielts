-- Keep immutable receipts and changed records, without copying all past learning on each keystroke.
-- Upgrade any existing receipts without losing their data or retry identity.
alter table public.study_commits add column payload_hash text;
alter table public.study_commits add column changes jsonb;
update public.study_commits
  set payload_hash = encode(sha256(convert_to(state::text, 'UTF8')), 'hex'),
      changes = jsonb_build_object('legacySnapshot', state);
alter table public.study_commits alter column payload_hash set not null;
alter table public.study_commits alter column changes set not null;
alter table public.study_commits add constraint study_commit_hash_length check (length(payload_hash) = 64);
alter table public.study_commits drop column state;

create or replace function public.commit_study(p_owner uuid, p_mutation uuid, p_expected_revision bigint, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_row public.study_snapshots%rowtype;
  receipt public.study_commits%rowtype;
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
  insert into public.study_snapshots(user_id, state) values (actor, empty_state) on conflict (user_id) do nothing;
  select * into current_row from public.study_snapshots where user_id = actor for update;
  select * into receipt from public.study_commits where user_id = actor and mutation_id = p_mutation;
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
  insert into public.study_commits(user_id, mutation_id, base_revision, revision, payload_hash, changes)
    values (actor, p_mutation, p_expected_revision, current_row.revision + 1, submitted_hash, changes);
  update public.study_snapshots set state = p_state, revision = current_row.revision + 1, updated_at = now() where user_id = actor;
  return jsonb_build_object('status', 'applied', 'revision', current_row.revision + 1);
end;
$$;
revoke all on function public.commit_study(uuid, uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.commit_study(uuid, uuid, bigint, jsonb) to authenticated;
