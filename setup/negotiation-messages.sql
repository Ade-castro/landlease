-- Run after negotiations.sql. Messages are visible only to the two negotiation participants.
create table if not exists public.negotiation_messages (
  id bigint generated always as identity primary key,
  negotiation_id bigint not null references public.lease_negotiations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists negotiation_messages_thread_idx
on public.negotiation_messages(negotiation_id, created_at);
alter table public.negotiation_messages enable row level security;
revoke all on public.negotiation_messages from anon, authenticated;
grant select, insert (negotiation_id, sender_id, body) on public.negotiation_messages to authenticated;
grant usage, select on sequence public.negotiation_messages_id_seq to authenticated;

create policy "Participants read negotiation messages"
on public.negotiation_messages for select to authenticated using (
  exists (select 1 from public.lease_negotiations n
    where n.id = negotiation_id and (select auth.uid()) in (n.owner_id, n.tenant_id))
);
create policy "Participants send negotiation messages"
on public.negotiation_messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and
  exists (select 1 from public.lease_negotiations n
    where n.id = negotiation_id and (select auth.uid()) in (n.owner_id, n.tenant_id))
);
