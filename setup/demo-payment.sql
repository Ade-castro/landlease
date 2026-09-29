-- TEMPORARY, EXPLICITLY OPT-IN. Run this in the Supabase SQL Editor after platform-upgrade.sql
-- to let a signed-in tenant simulate paying a real (non-demo) lease, so the account flow can
-- be tested end to end before a licensed payment gateway is connected.
--
-- This does NOT weaken record_verified_lease_payment()'s lock to service_role. No browser or
-- API caller can reach it directly. simulate_demo_payment() is a separate, narrower function:
-- it checks the caller really is the tenant on that order, then calls
-- record_verified_lease_payment() as an internal SQL call from inside a security-definer
-- function it owns - which Postgres allows regardless of the REST-level grant, the same way
-- any function can call another function it has execute rights on as its owning role.
-- Every payment made this way is tagged with a "DEMO-" reference so it is unmistakable from a
-- genuine future gateway-confirmed payment.
--
-- To turn this off later: update public.landlease_settings set value='false' where key='demo_payments_enabled';
-- To remove it entirely: drop function public.simulate_demo_payment(uuid); drop table public.landlease_settings;
begin;

create table if not exists public.landlease_settings (key text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.landlease_settings enable row level security;
revoke all on public.landlease_settings from anon, authenticated;
-- No grants to anon/authenticated at all - only editable via the SQL Editor (or a service-role client).

create or replace function public.simulate_demo_payment(p_order_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare r public.lease_payment_orders%rowtype; v_enabled boolean; v_reference text;
begin
  select (value = 'true') into v_enabled from public.landlease_settings where key = 'demo_payments_enabled';
  if not coalesce(v_enabled, false) then raise exception 'Demo payments are disabled. Run: update public.landlease_settings set value=''true'' where key=''demo_payments_enabled'';'; end if;
  select * into r from public.lease_payment_orders where id = p_order_id for update;
  if not found or auth.uid() is distinct from r.tenant_id then raise exception 'Only the tenant on this order can simulate payment'; end if;
  if r.status = 'paid' then raise exception 'This order is already paid'; end if;
  v_reference := 'DEMO-' || substr(p_order_id::text, 1, 8) || '-' || extract(epoch from now())::bigint::text;
  perform public.record_verified_lease_payment(p_order_id, v_reference, r.amount, r.currency);
  return v_reference;
end;$$;
revoke all on function public.simulate_demo_payment(uuid) from public, anon;
grant execute on function public.simulate_demo_payment(uuid) to authenticated;

insert into public.landlease_settings(key, value) values ('demo_payments_enabled', 'true')
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
