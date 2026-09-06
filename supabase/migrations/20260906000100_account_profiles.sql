-- DATA-001 stores only the account name. Study events remain local until DATA-002.
create table public.account_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  created_at timestamptz not null default now()
);

alter table public.account_profiles enable row level security;
revoke all on public.account_profiles from public, anon, authenticated;
grant select, delete on public.account_profiles to authenticated;
grant insert (id, display_name), update (id, display_name) on public.account_profiles to authenticated;
grant all on public.account_profiles to service_role;

create policy "Read own account profile"
  on public.account_profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Create own account profile"
  on public.account_profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Update own account profile"
  on public.account_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Delete own account profile"
  on public.account_profiles for delete to authenticated
  using ((select auth.uid()) = id);
