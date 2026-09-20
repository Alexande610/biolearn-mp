-- Run after supabase_log_lifecycle_upgrade.sql.
-- Standard logs are retained for 30 days. Security/critical logs are retained
-- for 120 days so their retention is longer than 90 days.

begin;

create extension if not exists pg_cron with schema pg_catalog;

update public.system_log_retention_config
set enabled = true,
    standard_days = 30,
    elevated_days = 120
where singleton;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'biolearn-system-log-retention'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end $$;

select cron.schedule(
  'biolearn-system-log-retention',
  '17 3 * * *',
  'select public.prune_system_observability();'
);

commit;
