-- READ ONLY. Run in the correct project's SQL Editor and export each result.
-- Contains no migration, cleanup, role change, or user data values.
begin transaction read only;
select current_database(), current_user, version();
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('system_logs','profiles','system_log_ingest_limits',
                    'pvp_live_matches','feature_metrics_daily')
order by table_name, ordinal_position;
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public'
and tablename in ('profiles','system_logs','pvp_live_matches','quiz_rooms');
select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema='public' and table_name in ('profiles','system_logs')
order by table_name, grantee, privilege_type;
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema='public' and table_name='profiles'
and column_name in ('role','xp','coins','class_progress');
select c.relname, t.tgname, pg_get_triggerdef(t.oid), pg_get_functiondef(t.tgfoid)
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','system_logs') and not t.tgisinternal;
select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef,
       p.proacl, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
('report_client_error','prune_system_observability','claim_map_reward','finalize_pvp_match');
select indexname, indexdef from pg_indexes
where schemaname='public' and tablename='system_logs';
select extname, extversion from pg_extension where extname in ('pg_cron','pg_net');
-- Run only after confirming columns above exist. No messages, users or secrets exported.
select severity, count(*) as rows, sum(occurrence_count) as accepted_occurrences,
       count(*) filter (where resolved_at is null) as unresolved,
       count(*) filter (where last_seen_at < now() -
         case when severity in ('critical','security') then interval '90 days' else interval '30 days' end) as eligible_under_current_policy
from public.system_logs group by severity;
commit;
-- If pg_cron is installed, inspect its schedule separately without running jobs:
-- select jobid, schedule, active from cron.job;
-- Inspect command locally before sharing: a job command may contain credentials.
