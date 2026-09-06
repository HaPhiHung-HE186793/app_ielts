-- DATA-002: immutable commits + a current snapshot, written only through atomic CAS.
create table public.study_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.study_commits (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  base_revision bigint not null check (base_revision >= 0),
  revision bigint not null check (revision > 0),
  state jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id),
  unique (user_id, revision)
);
alter table public.study_snapshots enable row level security;
alter table public.study_commits enable row level security;
revoke all on public.study_snapshots, public.study_commits from public, anon, authenticated;
grant select on public.study_snapshots, public.study_commits to authenticated;
grant all on public.study_snapshots, public.study_commits to service_role;
create policy "Read own study snapshot" on public.study_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own study commits" on public.study_commits for select to authenticated using ((select auth.uid()) = user_id);

create function public.commit_study(p_owner uuid, p_mutation uuid, p_expected_revision bigint, p_state jsonb)
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
    if receipt.state is distinct from p_state or receipt.base_revision <> p_expected_revision then
      raise exception 'Mutation ID already used for another payload' using errcode = '22023';
    end if;
    return jsonb_build_object('status', 'applied', 'revision', receipt.revision);
  end if;
  if current_row.revision <> p_expected_revision then
    return jsonb_build_object('status', 'conflict', 'revision', current_row.revision, 'state', current_row.state);
  end if;
  insert into public.study_commits(user_id, mutation_id, base_revision, revision, state)
    values (actor, p_mutation, p_expected_revision, current_row.revision + 1, p_state);
  update public.study_snapshots set state = p_state, revision = current_row.revision + 1, updated_at = now() where user_id = actor;
  return jsonb_build_object('status', 'applied', 'revision', current_row.revision + 1);
end;
$$;
revoke all on function public.commit_study(uuid, uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.commit_study(uuid, uuid, bigint, jsonb) to authenticated;
