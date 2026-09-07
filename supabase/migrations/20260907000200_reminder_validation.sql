-- Reject explicit nulls before revision/owner checks; endpoint host dots are literal.
create or replace function public.save_reminder(p_owner uuid, p_id uuid, p_revision integer, p_enabled boolean, p_settings jsonb, p_subscription jsonb default null, p_public_key text default null)
returns public.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current public.reminder_devices; next_time timestamptz; field text;
begin
  if auth.uid() is null or p_owner is null or auth.uid() <> p_owner or p_id is null or p_revision is null or p_revision < 0 or p_enabled is null or p_settings is null then raise exception 'Not authorized'; end if;
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
       or coalesce(p_subscription->>'endpoint','') !~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com)/[A-Za-z0-9_/:.=-]+$'
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

create or replace function public.snooze_reminder(p_owner uuid, p_id uuid, p_revision integer)
returns public.reminder_devices language plpgsql security definer set search_path = '' as $$
declare current public.reminder_devices; next_time timestamptz;
begin
  if auth.uid() is null or p_owner is null or p_revision is null or auth.uid() <> p_owner then raise exception 'Not authorized'; end if;
  select * into current from public.reminder_devices where id = p_id and user_id = p_owner for update;
  if not found or current.revision <> p_revision or not current.enabled then raise exception 'Reminder changed; reload'; end if;
  next_time := greatest(current.next_at, clock_timestamp()) + interval '30 minutes';
  next_time := date_trunc('minute', next_time);
  while public.reminder_quiet(next_time, current.settings) loop next_time := next_time + interval '1 minute'; end loop;
  if next_time > clock_timestamp() + interval '14 days' then raise exception 'Snooze limit reached'; end if;
  update public.reminder_devices set next_at = next_time, revision = revision + 1, updated_at = clock_timestamp() where id = p_id returning * into current;
  return current;
end; $$;
