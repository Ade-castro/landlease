-- Run this read-only query after platform-upgrade.sql. Every result should be true.
select 'Private document bucket' as check_name, exists(select 1 from storage.buckets where id='verification-documents' and not public) as passed
union all select 'Browser cannot mark payment paid',not has_function_privilege('authenticated','public.record_verified_lease_payment(uuid,text,numeric,text)','execute')
union all select 'Anonymous cannot sign contracts',not has_function_privilege('anon','public.sign_landlease_contract(uuid,text,boolean)','execute')
union all select 'Browser cannot edit contract records',not has_table_privilege('authenticated','public.landlease_contracts','update')
union all select 'Browser cannot edit payment records',not has_table_privilege('authenticated','public.lease_payment_orders','update')
union all select 'Browser cannot alter audit records',not has_table_privilege('authenticated','public.landlease_audit_log','insert,update,delete')
union all select 'Core upgrade tables use RLS',not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('platform_requests','soil_reports','landlease_contracts','lease_payment_orders','landlease_notifications','landlease_audit_log') and not c.relrowsecurity);
