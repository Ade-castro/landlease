-- Run after visits.sql. Records preliminary lease terms, not a signed contract.
create table if not exists public.lease_negotiations (
  id bigint generated always as identity primary key,
  visit_id bigint not null unique references public.visit_requests(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  terms text not null,
  tenant_message text,
  status text not null check (status in ('sent', 'countered', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '72 hours')
);
create index if not exists lease_negotiations_owner_idx on public.lease_negotiations(owner_id);
alter table public.lease_negotiations enable row level security;
revoke all on public.lease_negotiations from anon, authenticated;
grant select on public.lease_negotiations to authenticated;
create policy "Participants read lease negotiations" on public.lease_negotiations
for select to authenticated
using ((select auth.uid()) = tenant_id or (select auth.uid()) = owner_id);

-- A confirmed visit stays confirmed while lease terms are being negotiated.
create or replace function public.keep_confirmed_visit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'confirmed' and new.status <> 'confirmed' then
    raise exception 'A confirmed visit cannot be requested again';
  end if;
  return new;
end;
$$;
create trigger keep_confirmed_visit_status
before update on public.visit_requests for each row
execute function public.keep_confirmed_visit();

create or replace function public.send_lease_terms(p_visit_id bigint, p_terms text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_visit public.visit_requests%rowtype; v_row public.lease_negotiations%rowtype;
  v_id bigint; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if length(trim(coalesce(p_terms, ''))) < 20 or length(p_terms) > 5000 then
    raise exception 'Enter the rent, lease period, and conditions (20 to 5000 characters)';
  end if;
  select * into v_visit from public.visit_requests where id = p_visit_id;
  if not found or v_visit.owner_id <> v_user or v_visit.status <> 'confirmed' then
    raise exception 'Only the landowner can send terms after a confirmed visit';
  end if;
  if not exists (select 1 from public.listings where id = v_visit.listing_id and verification_status = 'approved') then
    raise exception 'The listing must be approved';
  end if;
  select * into v_row from public.lease_negotiations where visit_id = p_visit_id for update;
  if not found then
    insert into public.lease_negotiations
      (visit_id, listing_id, tenant_id, owner_id, terms, status)
    values (p_visit_id, v_visit.listing_id, v_visit.tenant_id, v_visit.owner_id, trim(p_terms), 'sent')
    returning id into v_id;
  else
    if now() >= v_row.expires_at or v_row.status <> 'countered' then
      raise exception 'Terms can only be revised after a tenant requests changes, before the deadline';
    end if;
    update public.lease_negotiations set terms = trim(p_terms), tenant_message = null,
      status = 'sent', updated_at = now() where id = v_row.id;
    v_id := v_row.id;
  end if;
  return v_id;
end;
$$;

create or replace function public.respond_lease_terms(p_id bigint, p_action text, p_message text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.lease_negotiations%rowtype;
begin
  select * into v_row from public.lease_negotiations where id = p_id for update;
  if not found or auth.uid() is distinct from v_row.tenant_id then
    raise exception 'Only the tenant can respond to these terms';
  end if;
  if now() >= v_row.expires_at then raise exception 'The 72-hour response window has expired'; end if;
  if v_row.status <> 'sent' then raise exception 'These terms are not awaiting a response'; end if;
  if p_action = 'accept' then
    update public.lease_negotiations set status = 'accepted', updated_at = now() where id = p_id;
  elsif p_action = 'decline' then
    update public.lease_negotiations set status = 'declined', updated_at = now() where id = p_id;
  elsif p_action = 'counter' then
    if length(trim(coalesce(p_message, ''))) < 10 or length(p_message) > 5000 then
      raise exception 'Describe your requested changes (10 to 5000 characters)';
    end if;
    update public.lease_negotiations set status = 'countered',
      tenant_message = trim(p_message), updated_at = now() where id = p_id;
  else raise exception 'Invalid response'; end if;
end;
$$;
revoke all on function public.send_lease_terms(bigint, text) from public, anon;
revoke all on function public.respond_lease_terms(bigint, text, text) from public, anon;
grant execute on function public.send_lease_terms(bigint, text) to authenticated;
grant execute on function public.respond_lease_terms(bigint, text, text) to authenticated;
