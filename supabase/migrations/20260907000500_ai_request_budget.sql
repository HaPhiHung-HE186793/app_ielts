-- AI writes are service-only. The HTTP server must verify the bearer token before passing owner.
create table public.ai_budgets (
  id uuid primary key,
  enabled boolean not null default false,
  limit_micro_usd bigint not null default 0 check (limit_micro_usd between 0 and 10000000),
  accounted_micro_usd bigint not null default 0 check (accounted_micro_usd >= 0)
);
create table public.ai_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  budget_id uuid not null references public.ai_budgets(id) on delete cascade,
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
create index ai_requests_budget_time on public.ai_requests(budget_id,created_at);
alter table public.ai_budgets enable row level security;
alter table public.ai_requests enable row level security;
revoke all on public.ai_budgets,public.ai_requests from public,anon,authenticated;
grant all on public.ai_budgets,public.ai_requests to service_role;
grant select on public.ai_requests to authenticated;
create policy "Read own AI request" on public.ai_requests for select to authenticated using ((select auth.uid()) = user_id);

create function public.configure_ai_budget(p_id uuid,p_enabled boolean,p_limit bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or p_enabled is null or p_limit is null or p_limit not between 0 and 10000000 then raise exception 'Invalid budget configuration'; end if;
  insert into public.ai_budgets(id,enabled,limit_micro_usd) values(p_id,p_enabled,p_limit)
  on conflict(id) do update set enabled = p_enabled,limit_micro_usd = p_limit;
  -- Never reset accounted spend on a restart or after account deletion.
end; $$;

create function public.reserve_ai_request(p_budget uuid,p_owner uuid,p_request uuid,p_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare budget public.ai_budgets; previous public.ai_requests; utc_start timestamptz;
begin
  if p_owner is null or p_request is null or p_budget is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request identity'; end if;
  select * into budget from public.ai_budgets where id = p_budget for update;
  if not found then return jsonb_build_object('status','unavailable'); end if;
  update public.ai_requests set status = 'unknown',error_code = 'timeout',finished_at = clock_timestamp()
    where budget_id = p_budget and status = 'pending' and created_at < clock_timestamp() - interval '2 minutes';
  select * into previous from public.ai_requests where user_id = p_owner and request_id = p_request for update;
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
  if (select count(*) from public.ai_requests where budget_id = p_budget and user_id = p_owner and created_at >= utc_start) >= 10
     or exists (select 1 from public.ai_requests where budget_id = p_budget and user_id = p_owner and created_at > clock_timestamp() - interval '20 seconds') then return jsonb_build_object('status','quota'); end if;
  if (select count(*) from public.ai_requests where budget_id = p_budget and status = 'pending') >= 2
     or exists (select 1 from public.ai_requests where budget_id = p_budget and user_id = p_owner and status = 'pending') then return jsonb_build_object('status','busy'); end if;
  insert into public.ai_requests(user_id,request_id,budget_id,payload_hash) values(p_owner,p_request,p_budget,p_hash);
  update public.ai_budgets set accounted_micro_usd = accounted_micro_usd + 10000 where id = p_budget;
  return jsonb_build_object('status','reserved');
end; $$;

create function public.finish_ai_request(p_budget uuid,p_owner uuid,p_request uuid,p_response jsonb,p_error text,p_cost bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare receipt public.ai_requests; cost bigint;
begin
  if p_cost is not null and (p_cost < 0 or p_cost > 100000000) then raise exception 'Invalid cost'; end if;
  if p_response is not null and (jsonb_typeof(p_response) <> 'object' or octet_length(p_response::text) > 16000
    or coalesce(p_response->>'ownerId','') <> p_owner::text or coalesce(p_response->>'requestId','') <> p_request::text) then raise exception 'Invalid response identity'; end if;
  if p_response is null and (p_error is null or p_error not in ('timeout','provider_error','invalid_feedback','invalid')) then raise exception 'Invalid failure'; end if;
  perform 1 from public.ai_budgets where id = p_budget for update;
  if not found then return false; end if;
  select * into receipt from public.ai_requests where budget_id = p_budget and user_id = p_owner and request_id = p_request for update;
  if not found or receipt.status <> 'pending' then return false; end if;
  cost := coalesce(p_cost,receipt.reserved_micro_usd);
  update public.ai_budgets set accounted_micro_usd = accounted_micro_usd - receipt.reserved_micro_usd + cost,
    enabled = case when cost > receipt.reserved_micro_usd then false else enabled end where id = p_budget;
  update public.ai_requests set status = case when p_response is null then 'failed' else 'completed' end,
    response = p_response,error_code = p_error,accounted_micro_usd = cost,finished_at = clock_timestamp()
    where user_id = p_owner and request_id = p_request;
  return true;
end; $$;

create function public.purge_ai_responses(p_budget uuid)
returns void language sql security definer set search_path = '' as $$
  update public.ai_requests set response = null where budget_id = p_budget and response is not null and finished_at <= clock_timestamp() - interval '24 hours';
$$;

revoke all on function public.configure_ai_budget(uuid,boolean,bigint),public.reserve_ai_request(uuid,uuid,uuid,text),
  public.finish_ai_request(uuid,uuid,uuid,jsonb,text,bigint),public.purge_ai_responses(uuid) from public,anon,authenticated;
grant execute on function public.configure_ai_budget(uuid,boolean,bigint),public.reserve_ai_request(uuid,uuid,uuid,text),
  public.finish_ai_request(uuid,uuid,uuid,jsonb,text,bigint),public.purge_ai_responses(uuid) to service_role;
