-- Read-only checks for the deployed inbox. No intention text or credentials.
select
  to_regclass('public.intentions') is not null as intentions_exist,
  to_regclass('public.community_totals') is not null as totals_exist,
  to_regclass('public.intercessor_credentials') is not null as recovery_exists,
  to_regclass('public.intention_contacts') is null as mail_contacts_retired,
  to_regclass('public.email_jobs') is null as mail_queue_retired;

select c.relname as table_name,c.relrowsecurity as rls_enabled,
  has_table_privilege('anon',c.oid,'SELECT') as anonymous_can_select,
  has_table_privilege('authenticated',c.oid,'INSERT') as client_can_insert,
  has_table_privilege('authenticated',c.oid,'UPDATE') as client_can_update,
  has_table_privilege('authenticated',c.oid,'DELETE') as client_can_delete
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('intentions','members','community_totals','intercessor_credentials','request_limits');

select p.proname,
  has_function_privilege('anon',p.oid,'EXECUTE') as anonymous_can_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as client_can_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') as server_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('create_intention','open_intention','register_intercessor','reserve_recovery','finish_recovery','check_request_limit','cleanup_personal_data');

select tablename,policyname,roles,cmd,qual from pg_policies
where schemaname='public' and tablename in ('intentions','members','community_totals');

select jobname,schedule,active from cron.job where jobname in ('misterio-mail','misterio-retention');
