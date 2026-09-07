-- Allow service-only checks to touch exactly their own test device.
drop function public.claim_reminders(timestamptz);
create function public.claim_reminders(p_now timestamptz default clock_timestamp(), p_device uuid default null)
returns setof public.reminder_deliveries language plpgsql security definer set search_path = '' as $$
declare device public.reminder_devices; receipt public.reminder_deliveries;
begin
  for device in select * from public.reminder_devices
    where enabled and next_at <= p_now and (p_device is null or id = p_device)
    order by next_at limit 20 for update skip locked loop
    if p_now - device.next_at <= interval '1 minute' and not public.reminder_quiet(p_now, device.settings) then
      insert into public.reminder_deliveries(device_id,user_id,revision,local_day,due_at)
        values(device.id,device.user_id,device.revision,(p_now at time zone (device.settings->>'timezone'))::date,device.next_at)
        on conflict(device_id,local_day) do nothing returning * into receipt;
      if found then return next receipt; end if;
    end if;
    update public.reminder_devices set next_at = public.reminder_next(p_now, device.settings), last_status = 'scheduled' where id = device.id;
  end loop;
end; $$;
revoke all on function public.claim_reminders(timestamptz,uuid) from public, anon, authenticated;
grant execute on function public.claim_reminders(timestamptz,uuid) to service_role;
