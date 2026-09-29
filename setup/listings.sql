-- Run in Supabase SQL Editor after profiles.sql.
-- Owners can submit plots. Only approved plots are public.
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  area text not null,
  size text not null,
  crop text not null,
  category text not null check (category in ('Vegetables', 'Grains', 'Orchards')),
  tags text[] not null default '{}',
  price text not null,
  detail text not null default '',
  image text not null default '',
  description text not null default '',
  history text not null default '',
  soil text not null default '',
  boundary text not null default '',
  proof_declared boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_public_idx on public.listings(created_at desc)
  where verification_status = 'approved';
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert (owner_id, name, area, size, crop, category, tags, price, detail,
  image, description, history, soil, boundary, proof_declared)
  on public.listings to authenticated;
grant update (name, area, size, crop, category, tags, price, detail,
  image, description, history, soil, boundary, proof_declared)
  on public.listings to authenticated;
grant delete on public.listings to authenticated;
grant usage, select on sequence public.listings_id_seq to authenticated;

create policy "Approved listings or own listings are visible"
  on public.listings for select to anon, authenticated
  using (verification_status = 'approved' or (select auth.uid()) = owner_id);
create policy "Landowners submit their own listings"
  on public.listings for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and proof_declared
    and exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'landowner')
  );
create policy "Owners edit their listings"
  on public.listings for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners remove their listings"
  on public.listings for delete to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.reset_listing_review_on_edit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'verification_status') is distinct from
     (to_jsonb(old) - 'verification_status') then
    new.verification_status := 'pending';
  end if;
  return new;
end;
$$;
drop trigger if exists on_landlease_listing_edited on public.listings;
create trigger on_landlease_listing_edited
before update on public.listings for each row
execute function public.reset_listing_review_on_edit();

-- Admin review, performed by the project owner in SQL Editor for now:
-- update public.listings set verification_status = 'approved' where id = 1;
