-- Landlease specification upgrade. Run once in Supabase SQL Editor.
-- Requires the previous profiles/listings/visits/negotiations/witnesses migrations.
-- Safe to rerun. Existing listings and accounts are preserved.
begin;
do $$ begin
 if to_regclass('public.profiles') is null or to_regclass('public.listings') is null or to_regclass('public.lease_negotiations') is null or to_regclass('public.lease_witnesses') is null then raise exception 'Install the existing Landlease account, listing, negotiation and witness SQL first';end if;
end $$;
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
create or replace function public.is_landlease_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
revoke all on function public.is_landlease_admin() from public, anon;
grant execute on function public.is_landlease_admin() to authenticated;

create table if not exists public.platform_requests (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('identity','land_proof','soil_test','plan','service','dispute','review')),
 user_id uuid not null references public.profiles(id), listing_id bigint references public.listings(id),
 payload jsonb not null default '{}', status text not null default 'submitted',
 admin_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists platform_pending_document_idx on public.platform_requests(user_id,kind,coalesce(listing_id,0)) where kind in('identity','land_proof') and status='submitted';
create index if not exists platform_requests_user_idx on public.platform_requests(user_id,kind);
alter table public.platform_requests enable row level security;
revoke all on public.platform_requests from anon,authenticated;
grant select on public.platform_requests to authenticated;
drop policy if exists platform_request_read on public.platform_requests;
create policy platform_request_read on public.platform_requests for select to authenticated
 using(user_id=auth.uid() or public.is_landlease_admin() or (kind='service' and status='approved'));

create or replace view public.service_directory as select id,payload->>'title' as title,payload->>'category' as category,payload->>'description' as description,payload->>'contact' as contact,payload->>'price' as price,created_at from public.platform_requests where kind='service' and status='approved' and payload->>'public_contact_consent'='true';
revoke all on public.service_directory from public;
grant select on public.service_directory to anon,authenticated;

create table if not exists public.soil_reports (
 listing_id bigint primary key references public.listings(id) on delete cascade,
 laboratory text not null, report_date date not null, summary text not null, ph numeric check(ph between 0 and 14),
 created_at timestamptz not null default now()
);
alter table public.soil_reports enable row level security;
revoke all on public.soil_reports from anon,authenticated;
grant select on public.soil_reports to anon,authenticated;
drop policy if exists soil_report_read on public.soil_reports;
create policy soil_report_read on public.soil_reports for select to anon,authenticated using(
 exists(select 1 from public.listings l where l.id=listing_id and (l.verification_status='approved' or l.owner_id=auth.uid()))
);
drop policy if exists soil_admin_read on public.soil_reports;
create policy soil_admin_read on public.soil_reports for select to authenticated using(public.is_landlease_admin());

create table if not exists public.landlease_contracts (
 id uuid primary key default gen_random_uuid(), negotiation_id bigint unique not null references public.lease_negotiations(id),
 listing_id bigint not null references public.listings(id), owner_id uuid not null references public.profiles(id), tenant_id uuid not null references public.profiles(id),
 body text not null, amount numeric(12,2) not null check(amount>0 and amount<=1000000), currency text not null default 'USD' check(currency='USD'),
 start_date date not null,end_date date not null,tenure text not null,witnesses jsonb not null,
 owner_name text,tenant_name text,owner_signed_at timestamptz,tenant_signed_at timestamptz,
 status text not null default 'awaiting_signatures' check(status in ('awaiting_signatures','ready_for_payment','active')),
 created_at timestamptz not null default now(),check(end_date>start_date),check(owner_id<>tenant_id)
);
alter table public.landlease_contracts enable row level security;
revoke all on public.landlease_contracts from anon,authenticated;
grant select on public.landlease_contracts to authenticated;
drop policy if exists contract_read on public.landlease_contracts;
create policy contract_read on public.landlease_contracts for select to authenticated using(auth.uid() in(owner_id,tenant_id) or public.is_landlease_admin());

create table if not exists public.lease_payment_orders (
 id uuid primary key default gen_random_uuid(),contract_id uuid unique not null references public.landlease_contracts(id),
 tenant_id uuid not null references public.profiles(id),owner_id uuid not null references public.profiles(id),
 amount numeric(12,2) not null, commission numeric(12,2) not null,landowner_amount numeric(12,2) not null,currency text not null default 'USD',
 status text not null default 'gateway_not_configured' check(status in ('gateway_not_configured','pending','paid','failed')),
 provider_reference text unique,paid_at timestamptz,created_at timestamptz not null default now(),
 check(commission=round(amount*0.03,2)),check(landowner_amount=amount-commission)
);
alter table public.lease_payment_orders enable row level security;
revoke all on public.lease_payment_orders from anon,authenticated;
grant select on public.lease_payment_orders to authenticated;
drop policy if exists payment_read on public.lease_payment_orders;
create policy payment_read on public.lease_payment_orders for select to authenticated using(auth.uid() in(owner_id,tenant_id) or public.is_landlease_admin());

create table if not exists public.landlease_notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),message text not null,link text not null default '/workspace',
 read_at timestamptz,created_at timestamptz not null default now()
);
alter table public.landlease_notifications enable row level security;
revoke all on public.landlease_notifications from anon,authenticated;
grant select,update(read_at) on public.landlease_notifications to authenticated;
drop policy if exists notification_read on public.landlease_notifications;
create policy notification_read on public.landlease_notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists notification_update on public.landlease_notifications;
create policy notification_update on public.landlease_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table if not exists public.landlease_audit_log (
 id bigint generated always as identity primary key,actor_id uuid,event text not null,entity_id text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
alter table public.landlease_audit_log enable row level security;
revoke all on public.landlease_audit_log from anon,authenticated;
grant select on public.landlease_audit_log to authenticated;
drop policy if exists audit_read on public.landlease_audit_log;
create policy audit_read on public.landlease_audit_log for select to authenticated using(public.is_landlease_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('verification-documents','verification-documents',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists verification_upload on storage.objects;
create policy verification_upload on storage.objects for insert to authenticated with check(bucket_id='verification-documents' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists verification_read on storage.objects;
create policy verification_read on storage.objects for select to authenticated using(bucket_id='verification-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_landlease_admin()));
drop policy if exists verification_delete on storage.objects;
create policy verification_delete on storage.objects for delete to authenticated using(bucket_id='verification-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_landlease_admin()));

create or replace function public.submit_platform_request(p_kind text,p_listing_id bigint,p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_id uuid; v_contract public.landlease_contracts%rowtype;v_listing_id bigint:=p_listing_id;
begin
 if v_uid is null then raise exception 'Sign in first';end if;
 if p_kind is null or p_kind not in('identity','land_proof','soil_test','plan','service','dispute','review') then raise exception 'Invalid request type';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>20000 then raise exception 'Invalid request details';end if;
 if p_kind in('land_proof','soil_test') and not exists(select 1 from public.listings where id=p_listing_id and owner_id=v_uid) then raise exception 'Choose your own real listing';end if;
 if p_kind in('identity','land_proof') then
  if (p_payload->>'consent') is distinct from 'true' or p_payload->>'path' is null or split_part(p_payload->>'path','/',1)<>v_uid::text then raise exception 'Upload your document and give consent';end if;
  if not exists(select 1 from storage.objects where bucket_id='verification-documents' and name=p_payload->>'path') then raise exception 'Document upload not found';end if;
  if exists(select 1 from public.platform_requests where user_id=v_uid and kind=p_kind and status='submitted' and listing_id is not distinct from p_listing_id) then raise exception 'A document is already awaiting review';end if;
 end if;
 if p_kind='soil_test' and length(coalesce(p_payload->>'collection',''))<5 then raise exception 'Enter sample collection instructions';end if;
 if p_kind='service' and (length(coalesce(p_payload->>'title',''))<3 or (p_payload->>'public_contact_consent') is distinct from 'true') then raise exception 'Enter a service name and consent to publish your contact details';end if;
 if p_kind in('dispute','review','plan') then
  select * into v_contract from public.landlease_contracts where id=(p_payload->>'contract_id')::uuid;
  if not found or v_uid not in(v_contract.owner_id,v_contract.tenant_id) then raise exception 'Choose a contract that you are part of';end if;
  if p_kind in('review','plan') and v_contract.status<>'active' then raise exception 'An active paid lease is required';end if;
  if p_kind='review' then v_listing_id:=v_contract.listing_id;end if;
  if p_kind='review' and (coalesce(p_payload->>'rating','')!~'^[1-5]$' or exists(select 1 from public.platform_requests where user_id=v_uid and kind='review' and payload->>'contract_id'=p_payload->>'contract_id')) then raise exception 'One rating from 1 to 5 is allowed per completed transaction';end if;
  if p_kind='dispute' and length(coalesce(p_payload->>'description',''))<10 then raise exception 'Describe the issue';end if;
 end if;
 insert into public.platform_requests(kind,user_id,listing_id,payload) values(p_kind,v_uid,v_listing_id,p_payload) returning id into v_id;
 insert into public.landlease_audit_log(actor_id,event,entity_id,details) values(v_uid,'request_submitted',v_id::text,jsonb_build_object('kind',p_kind));
 return v_id;
end;$$;
revoke all on function public.submit_platform_request(text,bigint,jsonb) from public,anon;
grant execute on function public.submit_platform_request(text,bigint,jsonb) to authenticated;

create or replace function public.review_platform_request(p_id uuid,p_decision text,p_note text,p_report jsonb default '{}')
returns void language plpgsql security definer set search_path='' as $$
declare r public.platform_requests%rowtype;
begin
 if not public.is_landlease_admin() then raise exception 'Admin access required';end if;
 select * into r from public.platform_requests where id=p_id for update;
 if not found or r.status in('approved','rejected','completed','resolved') then raise exception 'Request is already closed or not found';end if;
 if r.kind in('identity','land_proof','service') and p_decision not in('approved','rejected') then raise exception 'Approve or reject this request';end if;
 if r.kind='soil_test' and p_decision not in('scheduled','completed','rejected') then raise exception 'Invalid soil test decision';end if;
 if r.kind='dispute' and p_decision not in('investigating','resolved','rejected') then raise exception 'Invalid dispute decision';end if;
 if r.kind in('plan','review') then raise exception 'This request does not need administrative approval';end if;
 if p_decision is null or length(coalesce(p_note,''))<3 then raise exception 'Enter a decision note';end if;
 if r.kind in('identity','land_proof') then
  if exists(select 1 from storage.objects where bucket_id='verification-documents' and name=r.payload->>'path') then raise exception 'Delete the uploaded document using Storage API before completing review';end if;
  update public.platform_requests set payload=jsonb_build_object('consent',true,'document_deleted_at',now()) where id=p_id;
 end if;
 if r.kind='soil_test' and p_decision='completed' then
  if length(coalesce(p_report->>'laboratory',''))<3 or length(coalesce(p_report->>'summary',''))<10 or p_report->>'report_date' is null then raise exception 'Record the real laboratory, report date and results';end if;
  insert into public.soil_reports(listing_id,laboratory,report_date,summary,ph)
  values(r.listing_id,p_report->>'laboratory',(p_report->>'report_date')::date,p_report->>'summary',nullif(p_report->>'ph','')::numeric)
  on conflict(listing_id) do update set laboratory=excluded.laboratory,report_date=excluded.report_date,summary=excluded.summary,ph=excluded.ph;
 end if;
 update public.platform_requests set status=p_decision,admin_note=left(p_note,2000),updated_at=now() where id=p_id;
 insert into public.landlease_notifications(user_id,message) values(r.user_id,replace(r.kind,'_',' ')||': '||p_decision||'. '||left(p_note,300));
 insert into public.landlease_audit_log(actor_id,event,entity_id,details) values(auth.uid(),'request_reviewed',p_id::text,jsonb_build_object('kind',r.kind,'decision',p_decision));
end;$$;
revoke all on function public.review_platform_request(uuid,text,text,jsonb) from public,anon;
grant execute on function public.review_platform_request(uuid,text,text,jsonb) to authenticated;

-- Publication now requires reviewed identity, land rights, and an actual soil report.
create or replace function public.review_landlease_listing(p_id bigint,p_decision text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.listings%rowtype;
begin
 if not public.is_landlease_admin() then raise exception 'Admin access required';end if;
 if p_decision is null or p_decision not in('approved','rejected') then raise exception 'Invalid decision';end if;
 select * into r from public.listings where id=p_id for update;
 if not found or r.verification_status<>'pending' then raise exception 'Pending listing not found';end if;
 if p_decision='approved' and (not exists(select 1 from public.platform_requests where user_id=r.owner_id and kind='identity' and status='approved')
 or not exists(select 1 from public.platform_requests where listing_id=p_id and kind='land_proof' and status='approved')
 or not exists(select 1 from public.soil_reports where listing_id=p_id)) then raise exception 'Reviewed identity, reviewed land rights and a laboratory soil report are required';end if;
 update public.listings set verification_status=p_decision where id=p_id;
 insert into public.landlease_audit_log(actor_id,event,entity_id,details) values(auth.uid(),'listing_reviewed',p_id::text,jsonb_build_object('decision',p_decision));
 insert into public.landlease_notifications(user_id,message,link) values(r.owner_id,'Listing '||r.name||': '||p_decision,'/host');
end;$$;
revoke all on function public.review_landlease_listing(bigint,text) from public,anon;
grant execute on function public.review_landlease_listing(bigint,text) to authenticated;
drop policy if exists "Admins can view listings for review" on public.listings;
create policy "Admins can view listings for review" on public.listings for select to authenticated using(public.is_landlease_admin());

create or replace function public.create_landlease_contract(p_negotiation_id bigint,p_body text,p_amount numeric,p_start date,p_end date,p_tenure text)
returns uuid language plpgsql security definer set search_path='' as $$
declare n public.lease_negotiations%rowtype;v_id uuid;v_witnesses jsonb;
begin
 select * into n from public.lease_negotiations where id=p_negotiation_id for update;
 if not found or n.owner_id is distinct from auth.uid() or n.status<>'accepted' then raise exception 'Only the landowner can prepare an agreement after accepted terms';end if;
 if exists(select 1 from public.landlease_contracts where negotiation_id=n.id) then raise exception 'An agreement already exists; it cannot be silently replaced';end if;
 if not exists(select 1 from public.platform_requests where user_id=n.owner_id and kind='identity' and status='approved') or not exists(select 1 from public.platform_requests where user_id=n.tenant_id and kind='identity' and status='approved') then raise exception 'Both parties must complete identity review';end if;
 if not exists(select 1 from public.listings where id=n.listing_id and verification_status='approved') then raise exception 'Listing must be approved';end if;
 select jsonb_agg(jsonb_build_object('party',party,'name',full_name,'phone',phone,'id_last_four',right(national_id,4))) into v_witnesses from public.lease_witnesses where negotiation_id=n.id;
 if jsonb_array_length(coalesce(v_witnesses,'[]'))<>2 then raise exception 'Both witnesses must be nominated';end if;
 if p_body is null or length(trim(p_body))<100 or length(p_body)>20000 or p_amount is null or p_amount<=0 or p_start is null or p_end is null or p_end<=p_start or p_tenure not in('private','state','communal') then raise exception 'Enter full agreement text, land tenure, total lease value and valid dates';end if;
 insert into public.landlease_contracts(negotiation_id,listing_id,owner_id,tenant_id,body,amount,start_date,end_date,tenure,witnesses)
 values(n.id,n.listing_id,n.owner_id,n.tenant_id,trim(p_body)||E'\n\nAccepted proposal (fixed):\n'||n.terms,p_amount,p_start,p_end,p_tenure,v_witnesses) returning id into v_id;
 insert into public.landlease_audit_log(actor_id,event,entity_id) values(auth.uid(),'contract_created',v_id::text);
 insert into public.landlease_notifications(user_id,message,link) values(n.tenant_id,'A lease agreement is ready for review.','/contract/'||v_id::text);
 return v_id;
end;$$;
revoke all on function public.create_landlease_contract(bigint,text,numeric,date,date,text) from public,anon;
grant execute on function public.create_landlease_contract(bigint,text,numeric,date,date,text) to authenticated;

create or replace function public.sign_landlease_contract(p_id uuid,p_name text,p_consent boolean)
returns void language plpgsql security definer set search_path='' as $$
declare r public.landlease_contracts%rowtype;other_uid uuid;
begin
 select * into r from public.landlease_contracts where id=p_id for update;
 if not found or auth.uid() is null or auth.uid() not in(r.owner_id,r.tenant_id) then raise exception 'Only the contract parties can accept this agreement';end if;
 if r.status<>'awaiting_signatures' or p_consent is distinct from true or length(trim(coalesce(p_name,'')))<3 then raise exception 'Read the agreement, enter your full name and consent';end if;
 if auth.uid()=r.owner_id then
  if r.owner_signed_at is not null then raise exception 'You have already signed';end if;
  update public.landlease_contracts set owner_name=trim(p_name),owner_signed_at=now() where id=p_id; other_uid:=r.tenant_id;
 else
  if r.tenant_signed_at is not null then raise exception 'You have already signed';end if;
  update public.landlease_contracts set tenant_name=trim(p_name),tenant_signed_at=now() where id=p_id;other_uid:=r.owner_id;
 end if;
 update public.landlease_contracts set status='ready_for_payment' where id=p_id and owner_signed_at is not null and tenant_signed_at is not null;
 insert into public.landlease_audit_log(actor_id,event,entity_id,details) values(auth.uid(),'contract_accepted',p_id::text,jsonb_build_object('name',trim(p_name),'consent',true,'agreement_version',1));
 insert into public.landlease_notifications(user_id,message,link) values(other_uid,'The other party accepted the lease agreement.','/contract/'||p_id::text);
end;$$;
revoke all on function public.sign_landlease_contract(uuid,text,boolean) from public,anon;
grant execute on function public.sign_landlease_contract(uuid,text,boolean) to authenticated;

create or replace function public.create_lease_payment_order(p_contract_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.landlease_contracts%rowtype;v_id uuid;
begin
 select * into r from public.landlease_contracts where id=p_contract_id for update;
 if not found or auth.uid() is distinct from r.tenant_id or r.status not in('ready_for_payment','active') or r.owner_signed_at is null or r.tenant_signed_at is null then raise exception 'Only the tenant can prepare payment after both signatures';end if;
 insert into public.lease_payment_orders(contract_id,tenant_id,owner_id,amount,commission,landowner_amount)
 values(r.id,r.tenant_id,r.owner_id,r.amount,round(r.amount*0.03,2),r.amount-round(r.amount*0.03,2)) on conflict(contract_id) do nothing;
 select id into v_id from public.lease_payment_orders where contract_id=r.id;
 return v_id;
end;$$;
revoke all on function public.create_lease_payment_order(uuid) from public,anon;
grant execute on function public.create_lease_payment_order(uuid) to authenticated;

-- Called ONLY by the trusted backend after gateway signature verification and matching settlement confirmation.
-- No browser, normal user, or admin UI can mark a payment paid.
create or replace function public.record_verified_lease_payment(p_order_id uuid,p_reference text,p_amount numeric,p_currency text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.lease_payment_orders%rowtype;
begin
 select * into r from public.lease_payment_orders where id=p_order_id for update;
 if not found or r.amount is distinct from p_amount or r.currency is distinct from p_currency or length(coalesce(p_reference,''))<3 then raise exception 'Payment amount, currency or reference mismatch';end if;
 if r.status='paid' then
  if r.provider_reference=p_reference then return;end if;raise exception 'Payment already settled with another reference';
 end if;
 update public.lease_payment_orders set status='paid',provider_reference=p_reference,paid_at=now() where id=p_order_id;
 update public.landlease_contracts set status='active' where id=r.contract_id and owner_signed_at is not null and tenant_signed_at is not null;
 insert into public.landlease_audit_log(event,entity_id,details) values('payment_confirmed',p_order_id::text,jsonb_build_object('reference',p_reference,'amount',p_amount));
 insert into public.landlease_notifications(user_id,message,link) values(r.tenant_id,'Payment confirmed. Your lease is active.','/contract/'||r.contract_id::text),(r.owner_id,'Payment confirmed for your lease.','/contract/'||r.contract_id::text);
end;$$;
revoke all on function public.record_verified_lease_payment(uuid,text,numeric,text) from public,anon,authenticated;
grant execute on function public.record_verified_lease_payment(uuid,text,numeric,text) to service_role;
create or replace function public.landlease_event_notice() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; route text;
begin
 recipient := case when auth.uid()=new.owner_id then new.tenant_id else new.owner_id end;
 route := '/my-visits';
 if tg_table_name='visit_requests' then
  route := case when recipient=new.owner_id then '/host' else '/my-visits' end;
 else route := '/negotiation/'||new.visit_id::text;
 end if;
 insert into public.landlease_notifications(user_id,message,link) values(recipient,case when tg_table_name='visit_requests' then 'Farm visit: ' else 'Lease terms: ' end||new.status,route);
 return new;
end;$$;
revoke all on function public.landlease_event_notice() from public,anon,authenticated;
drop trigger if exists landlease_visit_notice on public.visit_requests;
create trigger landlease_visit_notice after insert or update of status on public.visit_requests for each row execute function public.landlease_event_notice();
drop trigger if exists landlease_terms_notice on public.lease_negotiations;
create trigger landlease_terms_notice after insert or update of status on public.lease_negotiations for each row execute function public.landlease_event_notice();
create or replace view public.public_lease_reviews as
 select r.id,r.listing_id,r.payload->>'rating' as rating,left(r.payload->>'comment',2000) as comment,r.created_at
 from public.platform_requests r join public.landlease_contracts c on c.id::text=r.payload->>'contract_id'
 where r.kind='review' and c.status='active' and r.user_id in(c.owner_id,c.tenant_id);
revoke all on public.public_lease_reviews from public;
grant select on public.public_lease_reviews to anon,authenticated;
notify pgrst,'reload schema';
commit;
