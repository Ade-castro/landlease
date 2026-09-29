-- Run in Supabase SQL Editor after listings.sql.
-- Replace YOUR_LOGIN_EMAIL_HERE with the email of your own Landlease account.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('mukundwib1@gmail.com')
on conflict do nothing;

create or replace function public.is_landlease_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_landlease_admin() from public, anon;
grant execute on function public.is_landlease_admin() to authenticated;

create policy "Admins can view listings for review"
on public.listings for select to authenticated
using (public.is_landlease_admin());

create or replace function public.review_landlease_listing(p_id bigint, p_decision text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_landlease_admin() then
    raise exception 'Only an administrator can review listings';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision';
  end if;
  update public.listings
  set verification_status = p_decision
  where id = p_id and verification_status = 'pending';
  if not found then
    raise exception 'Pending listing not found';
  end if;
end;
$$;
revoke all on function public.review_landlease_listing(bigint, text) from public, anon;
grant execute on function public.review_landlease_listing(bigint, text) to authenticated;
