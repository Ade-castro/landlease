-- Run after negotiations.sql. Witness nominations are not signatures or identity verification.
create table if not exists public.lease_witnesses (
  negotiation_id bigint not null references public.lease_negotiations(id) on delete cascade,
  party text not null check (party in ('tenant', 'landowner')),
  full_name text not null,
  phone text not null,
  national_id text not null,
  consent_declared boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (negotiation_id, party)
);
alter table public.lease_witnesses enable row level security;
revoke all on public.lease_witnesses from anon, authenticated;
grant select on public.lease_witnesses to authenticated;
create policy "Negotiation participants view witnesses"
on public.lease_witnesses for select to authenticated using (
  exists (select 1 from public.lease_negotiations n
    where n.id = negotiation_id and (select auth.uid()) in (n.tenant_id, n.owner_id))
);

create or replace function public.nominate_lease_witness(
  p_negotiation_id bigint, p_name text, p_phone text, p_national_id text,
  p_consent_declared boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.lease_negotiations%rowtype; v_party text;
begin
  select * into v_row from public.lease_negotiations where id = p_negotiation_id for update;
  if not found or v_row.status <> 'accepted' then
    raise exception 'Accepted terms are required before adding witnesses';
  end if;
  if auth.uid() = v_row.tenant_id then v_party := 'tenant';
  elsif auth.uid() = v_row.owner_id then v_party := 'landowner';
  else raise exception 'Only the tenant or landowner can add a witness'; end if;
  if p_consent_declared is distinct from true then
    raise exception 'Confirm that the witness agreed to share these details';
  end if;
  if length(trim(coalesce(p_name, ''))) < 3 or length(p_name) > 120
     or length(trim(coalesce(p_phone, ''))) < 6 or length(p_phone) > 40
     or length(trim(coalesce(p_national_id, ''))) < 4 or length(p_national_id) > 80 then
    raise exception 'Enter a valid name, phone number, and ID number';
  end if;
  insert into public.lease_witnesses
    (negotiation_id, party, full_name, phone, national_id, consent_declared)
  values (p_negotiation_id, v_party, trim(p_name), trim(p_phone), trim(p_national_id), true)
  on conflict (negotiation_id, party) do update
    set full_name = excluded.full_name, phone = excluded.phone,
        national_id = excluded.national_id, consent_declared = true, updated_at = now();
end;
$$;
revoke all on function public.nominate_lease_witness(bigint, text, text, text, boolean) from public, anon;
grant execute on function public.nominate_lease_witness(bigint, text, text, text, boolean) to authenticated;
