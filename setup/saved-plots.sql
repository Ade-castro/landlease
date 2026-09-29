-- Run in Supabase SQL Editor after listings.sql.
create table if not exists public.saved_plots (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.saved_plots enable row level security;
revoke all on public.saved_plots from anon, authenticated;
grant select, insert, delete on public.saved_plots to authenticated;
create policy "Users see their own saved plots" on public.saved_plots
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users save approved plots" on public.saved_plots
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.listings l where l.id = listing_id and l.verification_status = 'approved')
);
create policy "Users remove their own saved plots" on public.saved_plots
for delete to authenticated using ((select auth.uid()) = user_id);
