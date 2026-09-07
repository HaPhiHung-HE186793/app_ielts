-- Consistent device -> receipt lock order, including completion and duplicate claims.
create or replace function public.prepare_reminder(p_delivery uuid, p_now timestamptz default clock_timestamp())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare receipt public.reminder_deliveries; device public.reminder_devices;
begin
  select * into receipt from public.reminder_deliveries where id = p_delivery;
  if not found then return null; end if;
  select * into device from public.reminder_devices where id = receipt.device_id for update;
  if not found then return null; end if;
  select * into receipt from public.reminder_deliveries where id = p_delivery for update;
  if not found or receipt.status <> 'claimed' then return null; end if;
  if not device.enabled or device.revision <> receipt.revision or p_now > receipt.due_at + interval '1 minute' or public.reminder_quiet(p_now, device.settings) then
    update public.reminder_deliveries set status = 'cancelled' where id = p_delivery; return null;
  end if;
  update public.reminder_deliveries set status = 'attempting' where id = p_delivery;
  return jsonb_build_object('id',receipt.id,'deviceId',device.id,'revision',device.revision,'day',receipt.local_day,
    'subscription',device.subscription,'expiresAt',extract(epoch from (receipt.due_at + interval '1 minute')) * 1000);
end; $$;

create or replace function public.finish_reminder(p_delivery uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare receipt public.reminder_deliveries;
begin
  if p_status is null or p_status not in ('accepted','failed','expired') then raise exception 'Invalid delivery result'; end if;
  select * into receipt from public.reminder_deliveries where id = p_delivery;
  if not found then return; end if;
  perform 1 from public.reminder_devices where id = receipt.device_id for update;
  update public.reminder_deliveries set status = p_status where id = p_delivery and status = 'attempting' returning * into receipt;
  if not found then return; end if;
  update public.reminder_devices set last_status = p_status,
    enabled = case when p_status = 'expired' then false else enabled end,
    subscription = case when p_status = 'expired' then null else subscription end,
    next_at = case when p_status = 'expired' then null else next_at end
    where id = receipt.device_id and revision = receipt.revision;
end; $$;
