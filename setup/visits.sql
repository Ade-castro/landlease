-- Visit requests are shared between the tenant and the listing owner.
-- Run after listings.sql. These are not contracts or payments.
create table if not exists public.visit_requests (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null,
  proposed_at timestamptz,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'declined', 'proposed')),
  created_at timestamptz not null default now(),
  unique (listing_id, tenant_id)
);
create index if not exists visit_requests_owner_idx on public.visit_requests(owner_id, created_at desc);
alter table public.visit_requests enable row level security;
revoke all on public.visit_requests from anon, authenticated;
grant select on public.visit_requests to authenticated;
create policy "Participants see their visit requests"
on public.visit_requests for select to authenticated
using ((select auth.uid()) = tenant_id or (select auth.uid()) = owner_id);

create or replace function public.request_farm_visit(p_listing_id bigint, p_date timestamptz)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_owner uuid; v_id bigint;
begin
  if v_user is null then raise exception 'Sign in to request a visit'; end if;
  if p_date is null or p_date <= now() then raise exception 'Choose a future date'; end if;
  if not exists (select 1 from public.profiles where id = v_user and role = 'tenant') then
    raise exception 'A tenant account is required';
  end if;
  select owner_id into v_owner from public.listings
    where id = p_listing_id and verification_status = 'approved';
  if v_owner is null then raise exception 'This listing is not available for requests'; end if;
  if v_owner = v_user then raise exception 'You cannot request your own listing'; end if;
  insert into public.visit_requests (listing_id, tenant_id, owner_id, requested_at)
  values (p_listing_id, v_user, v_owner, p_date)
  on conflict (listing_id, tenant_id) do update
    set requested_at = excluded.requested_at, proposed_at = null, status = 'requested'
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.respond_farm_visit(p_id bigint, p_action text, p_date timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.visit_requests%rowtype; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_row from public.visit_requests where id = p_id for update;
  if not found then raise exception 'Visit request not found'; end if;
  if v_user = v_row.owner_id then
    if p_action = 'confirm' and v_row.status = 'requested' then
      update public.visit_requests set status = 'confirmed',
        requested_at = coalesce(proposed_at, requested_at), proposed_at = null where id = p_id;
    elsif p_action = 'decline' and v_row.status in ('requested', 'proposed') then
      update public.visit_requests set status = 'declined', proposed_at = null where id = p_id;
    elsif p_action = 'propose' and v_row.status = 'requested' then
      if p_date is null or p_date <= now() then raise exception 'Choose a future date'; end if;
      update public.visit_requests set status = 'proposed', proposed_at = p_date where id = p_id;
    else raise exception 'This response is not allowed'; end if;
  elsif v_user = v_row.tenant_id then
    if p_action = 'accept' and v_row.status = 'proposed' then
      update public.visit_requests set status = 'confirmed',
        requested_at = proposed_at, proposed_at = null where id = p_id;
    elsif p_action = 'decline' and v_row.status = 'proposed' then
      update public.visit_requests set status = 'declined', proposed_at = null where id = p_id;
    else raise exception 'This response is not allowed'; end if;
  else raise exception 'Not a participant'; end if;
end;
$$;

revoke all on function public.request_farm_visit(bigint, timestamptz) from public, anon;
revoke all on function public.respond_farm_visit(bigint, text, timestamptz) from public, anon;
grant execute on function public.request_farm_visit(bigint, timestamptz) to authenticated;
grant execute on function public.respond_farm_visit(bigint, text, timestamptz) to authenticated;
