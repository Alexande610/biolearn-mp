-- BioLearn: additive log lifecycle. Does NOT delete logs or enable retention.
-- Run only after preflight + backup. Existing ingestion signature is retained.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '90s';
lock table public.system_logs in share row exclusive mode;

create table if not exists public.system_log_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.system_log_admins enable row level security;
revoke all on public.system_log_admins from public, anon, authenticated;
-- Snapshot existing administrators; a mutable profile.role alone cannot grant
-- log-management rights. Future administrators must be provisioned by the DBA.
insert into public.system_log_admins(user_id)
select id from public.profiles where role='admin'
and not exists(select 1 from public.system_log_admins) on conflict do nothing;

create or replace function public.is_system_log_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists (
  select 1 from public.system_log_admins a join public.profiles p on p.id=a.user_id
  where a.user_id=auth.uid() and p.role='admin'
) $$;
revoke all on function public.is_system_log_admin() from public, anon, authenticated;
grant execute on function public.is_system_log_admin() to authenticated;

-- Existing profile policies permit updates to one's own row, including role.
-- Protect administrator transitions without changing student/teacher workflows.
create or replace function public.guard_profile_admin_role()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_sensitive boolean;
begin
  if tg_op='INSERT' then v_sensitive:=new.role='admin';
  else v_sensitive:=new.role is distinct from old.role and (new.role='admin' or old.role='admin'); end if;
  if v_sensitive and not public.is_system_log_admin()
     and coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and not (session_user in ('postgres','supabase_admin') and auth.uid() is null) then
    raise exception 'admin_role_change_requires_administrator' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function public.guard_profile_admin_role() from public,anon,authenticated;
drop trigger if exists profiles_guard_admin_role on public.profiles;
create trigger profiles_guard_admin_role before insert or update of role on public.profiles
for each row execute function public.guard_profile_admin_role();
revoke truncate,references,trigger on public.profiles from anon,authenticated;

create table if not exists public.system_issues (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  environment text not null check(environment in ('development','staging','production','legacy')),
  action text not null,
  message text not null default '',
  route text,
  severity text not null check(severity in ('warning','error','critical','security')),
  status text not null default 'open' check(status in ('open','investigating','verifying','resolved','reopened')),
  occurrence_count bigint not null default 0 check(occurrence_count>=0),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  last_app_version text,
  revision bigint not null default 1,
  resolved_at timestamptz,
  resolved_by uuid,
  fixed_version text,
  resolution_note text,
  verification_evidence text,
  unique(fingerprint,environment)
);
create index if not exists system_issues_feed_idx on public.system_issues(last_seen_at desc,id);
create index if not exists system_issues_status_idx on public.system_issues(status,last_seen_at desc);
create table if not exists public.system_issue_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.system_issues(id) on delete restrict,
  created_at timestamptz not null default now(),
  actor_id uuid,
  event_type text not null,
  previous_status text,
  new_status text not null,
  app_version text,
  note text,
  evidence text
);
create index if not exists system_issue_events_feed_idx on public.system_issue_events(issue_id,created_at desc);
alter table public.system_logs add column if not exists issue_id uuid references public.system_issues(id) on delete restrict;
create index if not exists system_logs_issue_idx on public.system_logs(issue_id,last_seen_at desc);

alter table public.system_issues enable row level security;
alter table public.system_issue_events enable row level security;
revoke all on public.system_issues, public.system_issue_events from public, anon, authenticated;
grant select on public.system_issues, public.system_issue_events to authenticated;
drop policy if exists system_issues_admin_read on public.system_issues;
create policy system_issues_admin_read on public.system_issues for select to authenticated using(public.is_system_log_admin());
drop policy if exists system_issue_events_admin_read on public.system_issue_events;
create policy system_issue_events_admin_read on public.system_issue_events for select to authenticated using(public.is_system_log_admin());
drop policy if exists system_logs_admin_read on public.system_logs;
create policy system_logs_admin_read on public.system_logs for select to authenticated using(public.is_system_log_admin());
-- RLS does not protect TRUNCATE; direct client mutations are unnecessary.
revoke insert,update,delete,truncate,references,trigger on public.system_logs from anon,authenticated;

create or replace function public.redact_system_log_text(p_text text,p_limit integer default 1800)
returns text language sql immutable set search_path=public as $$
select left(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
  coalesce(p_text,''),
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','<email>','g'),
  '(?i)bearer\s+[A-Za-z0-9._~+/=-]+','Bearer <redacted>','g'),
  'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}','<jwt>','g'),
  '[A-Za-z0-9_-]{40,}','<secret>','g'),greatest(0,least(p_limit,4000)))
$$;
revoke all on function public.redact_system_log_text(text,integer) from public,anon,authenticated;

create or replace function public.capture_system_issue()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_environment text;
  v_issue public.system_issues%rowtype;
  v_status text;
  v_delta bigint;
begin
  -- A state-only edit/backfill is not a new error occurrence.
  if tg_op='UPDATE' and new.last_seen_at is not distinct from old.last_seen_at
     and new.occurrence_count is not distinct from old.occurrence_count then return new; end if;
  v_environment := new.details->>'environment';
  if v_environment is null or v_environment not in ('development','staging','production','legacy') then
    v_environment := case when new.app_version='dev' then 'development' else 'legacy' end;
  end if;
  v_delta := case when tg_op='INSERT' then greatest(new.occurrence_count,1)
    else greatest(new.occurrence_count-old.occurrence_count,0) end;
  insert into public.system_issues(fingerprint,environment,action,message,route,severity,first_seen_at,last_seen_at,last_app_version)
  values(new.fingerprint,v_environment,new.action,new.message,new.route,new.severity,new.first_seen_at,new.last_seen_at,new.app_version)
  on conflict(fingerprint,environment) do nothing;
  select * into v_issue from public.system_issues
  where fingerprint=new.fingerprint and environment=v_environment for update;
  v_status := v_issue.status;
  if v_status='resolved' then
    -- Different/unknown versions need verification; they are not proof that
    -- the verified release regressed. Preserve the resolution in audit history.
    v_status := case when new.app_version=v_issue.fixed_version then 'reopened' else 'verifying' end;
    insert into public.system_issue_events(issue_id,event_type,previous_status,new_status,app_version,note)
    values(v_issue.id,case when v_status='reopened' then 'recurrence' else 'version_review' end,
      v_issue.status,v_status,new.app_version,
      case when v_status='reopened' then 'Lỗi xuất hiện lại trên phiên bản đã xác minh.' else 'Có lỗi từ phiên bản khác hoặc chưa xác định; cần đối chiếu với bản đã sửa.' end);
  end if;
  update public.system_issues set
    status=v_status, occurrence_count=occurrence_count+v_delta,
    first_seen_at=least(first_seen_at,new.first_seen_at),last_seen_at=greatest(last_seen_at,new.last_seen_at),
    last_app_version=new.app_version,message=new.message,route=new.route,
    severity=case when array_position(array['warning','error','critical','security'],new.severity)
      >array_position(array['warning','error','critical','security'],severity) then new.severity else severity end,
    revision=revision+1,resolved_at=case when v_status='resolved' then resolved_at else null end
  where id=v_issue.id;
  -- AFTER INSERT/UPDATE: an UPSERT must count the final row once, not its
  -- speculative BEFORE INSERT plus the conflict UPDATE.
  update public.system_logs set issue_id=v_issue.id where id=new.id and issue_id is distinct from v_issue.id;
  return new;
end $$;
revoke all on function public.capture_system_issue() from public,anon,authenticated;
drop trigger if exists system_logs_capture_issue on public.system_logs;
create trigger system_logs_capture_issue after insert or update on public.system_logs
for each row execute function public.capture_system_issue();

create or replace function public.sanitize_system_log()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_context jsonb := '{}'::jsonb; v_key text; v_environment text;
begin
  if tg_op='UPDATE' and new.last_seen_at is not distinct from old.last_seen_at
    and new.occurrence_count is not distinct from old.occurrence_count then return new; end if;
  v_environment:=new.details->>'environment';
  if v_environment is null or v_environment not in ('development','staging','production','legacy') then
    v_environment:=case when new.app_version='dev' then 'development' else 'legacy' end;
  end if;
  foreach v_key in array array['error_name','component','operation','source','status_code','supabase_code','browser','online','correlation_id','stack'] loop
    if new.details ? v_key then v_context:=v_context||jsonb_build_object(v_key,
      public.redact_system_log_text(new.details->>v_key,case when v_key='stack' then 1800 else 180 end)); end if;
  end loop;
  new.details:=v_context||jsonb_build_object('environment',v_environment);
  new.message:=public.redact_system_log_text(new.message,600);
  return new;
end $$;
revoke all on function public.sanitize_system_log() from public,anon,authenticated;
drop trigger if exists system_logs_sanitize on public.system_logs;
create trigger system_logs_sanitize before insert or update on public.system_logs
for each row execute function public.sanitize_system_log();

-- Backfill only unlinked rows. Historical absence is not evidence of a fix.
with source as (
  select *,case when details->>'environment' in ('development','staging','production','legacy') then details->>'environment'
    when app_version='dev' then 'development' else 'legacy' end as env
  from public.system_logs where issue_id is null
), grouped as (
  select fingerprint,env,min(first_seen_at) first_seen,max(last_seen_at) last_seen,sum(occurrence_count) occurrences,
    (array_agg(action order by last_seen_at desc,id))[1] action,
    (array_agg(message order by last_seen_at desc,id))[1] message,
    (array_agg(route order by last_seen_at desc,id))[1] route,
    (array_agg(app_version order by last_seen_at desc,id))[1] app_version,
    (array_agg(severity order by array_position(array['warning','error','critical','security'],severity) desc))[1] severity
  from source group by fingerprint,env
)
insert into public.system_issues(fingerprint,environment,action,message,route,severity,occurrence_count,first_seen_at,last_seen_at,last_app_version)
select fingerprint,env,action,public.redact_system_log_text(message,600),route,severity,occurrences,first_seen,last_seen,app_version from grouped
on conflict(fingerprint,environment) do nothing;
update public.system_logs l set issue_id=i.id
from public.system_issues i where l.issue_id is null and l.fingerprint=i.fingerprint
and i.environment=case when l.details->>'environment' in ('development','staging','production','legacy') then l.details->>'environment'
when l.app_version='dev' then 'development' else 'legacy' end;

create or replace function public.set_system_issue_status(
  p_issue_id uuid,p_expected_revision bigint,p_status text,
  p_note text,p_fixed_version text default null,p_evidence text default null
) returns public.system_issues language plpgsql security definer set search_path=public as $$
declare v_issue public.system_issues%rowtype;
begin
  if not public.is_system_log_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if p_status is null or p_status not in ('open','investigating','verifying','resolved') then raise exception 'invalid_status'; end if;
  if length(trim(coalesce(p_note,'')))<5 then raise exception 'note_required'; end if;
  if p_status='resolved' and (length(trim(coalesce(p_fixed_version,'')))<3 or length(trim(p_fixed_version))>40
    or lower(trim(p_fixed_version)) in ('dev','unknown','latest')
    or length(trim(coalesce(p_evidence,'')))<10) then raise exception 'verification_required'; end if;
  select * into v_issue from public.system_issues where id=p_issue_id for update;
  if not found then raise exception 'issue_not_found'; end if;
  if v_issue.revision is distinct from p_expected_revision then raise exception 'issue_changed_refresh_required' using errcode='40001'; end if;
  insert into public.system_issue_events(issue_id,actor_id,event_type,previous_status,new_status,app_version,note,evidence)
  values(v_issue.id,auth.uid(),'status_changed',v_issue.status,p_status,left(trim(p_fixed_version),40),
    public.redact_system_log_text(p_note,2000),public.redact_system_log_text(p_evidence,3000));
  update public.system_issues set status=p_status,revision=revision+1,
    resolved_at=case when p_status='resolved' then now() else null end,
    resolved_by=case when p_status='resolved' then auth.uid() else null end,
    fixed_version=case when p_status='resolved' then left(trim(p_fixed_version),40) else fixed_version end,
    resolution_note=public.redact_system_log_text(p_note,2000),
    verification_evidence=case when p_status='resolved' then public.redact_system_log_text(p_evidence,3000) else verification_evidence end
  where id=v_issue.id returning * into v_issue;
  return v_issue;
end $$;
revoke all on function public.set_system_issue_status(uuid,bigint,text,text,text,text) from public,anon,authenticated;
grant execute on function public.set_system_issue_status(uuid,bigint,text,text,text,text) to authenticated;

create table if not exists public.system_log_retention_config (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false,
  standard_days integer not null default 30 check(standard_days>=30),
  elevated_days integer not null default 120 check(elevated_days>=90)
);
insert into public.system_log_retention_config(singleton) values(true) on conflict do nothing;
alter table public.system_log_retention_config enable row level security;
revoke all on public.system_log_retention_config from public,anon,authenticated;
grant select on public.system_log_retention_config to authenticated;
drop policy if exists system_log_retention_admin_read on public.system_log_retention_config;
create policy system_log_retention_admin_read on public.system_log_retention_config for select to authenticated using(public.is_system_log_admin());
create table if not exists public.system_log_retention_runs (
  id uuid primary key default gen_random_uuid(),
  executed_at timestamptz not null default now(),
  deleted_logs integer not null
);
alter table public.system_log_retention_runs enable row level security;
revoke all on public.system_log_retention_runs from public,anon,authenticated;
grant select on public.system_log_retention_runs to authenticated;
drop policy if exists system_log_retention_runs_read on public.system_log_retention_runs;
create policy system_log_retention_runs_read on public.system_log_retention_runs for select to authenticated using(public.is_system_log_admin());

create or replace function public.prune_system_observability()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_config public.system_log_retention_config%rowtype; v_count integer;
begin
  if not public.is_system_log_admin()
     and coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and not (session_user in ('postgres','supabase_admin') and auth.uid() is null) then
    raise exception 'admin_required' using errcode='42501';
  end if;
  select * into v_config from public.system_log_retention_config where singleton;
  if not found or not v_config.enabled then return jsonb_build_object('paused',true,'deleted_total',0); end if;
  -- Never remove the only unlinked evidence. Issue and audit history survive.
  with expired as (
    select l.id from public.system_logs l join public.system_issues i on i.id=l.issue_id
    where l.last_seen_at < now()-make_interval(days=>case when l.severity in ('critical','security')
      then v_config.elevated_days else v_config.standard_days end)
    order by l.last_seen_at,l.id limit 1000 for update of l skip locked
  ) delete from public.system_logs l using expired e where l.id=e.id;
  get diagnostics v_count=row_count;
  insert into public.system_log_retention_runs(deleted_logs) values(v_count);
  return jsonb_build_object('paused',false,'deleted_total',v_count,'logs',v_count);
end $$;
revoke all on function public.prune_system_observability() from public,anon,authenticated;
grant execute on function public.prune_system_observability() to authenticated,service_role;

create or replace function public.report_client_error(
  p_severity text,
  p_action text,
  p_message text,
  p_context jsonb default '{}'::jsonb,
  p_route text default null,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_severity text := lower(coalesce(p_severity, 'error'));
  v_action text := left(regexp_replace(coalesce(p_action, 'client_error'), '[^a-zA-Z0-9_.:-]', '_', 'g'), 80);
  v_message text := left(coalesce(p_message, 'Unknown client error'), 600);
  v_route text := left(split_part(coalesce(p_route, ''), '?', 1), 180);
  v_normalized_message text;
  v_fingerprint text;
  v_count integer;
  v_log_id uuid;
  v_occurrence_count integer;
  v_safe_context jsonb;
  v_metric_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if v_user_id is null then
    return jsonb_build_object('accepted', false, 'reason', 'authentication_required');
  end if;

  if v_severity not in ('warning', 'error', 'critical', 'security') then
    v_severity := 'error';
  end if;

  -- Loai email, token Bearer, JWT va chuoi key dai khoi message truoc khi luu.
  v_message := regexp_replace(v_message, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '<email>', 'g');
  v_message := regexp_replace(v_message, '(?i)bearer\s+[A-Za-z0-9._~+/=-]+', 'Bearer <redacted>', 'g');
  v_message := regexp_replace(v_message, 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}', '<jwt>', 'g');
  v_message := regexp_replace(v_message, '[A-Za-z0-9_-]{40,}', '<secret>', 'g');

  v_normalized_message := lower(v_message);
  v_normalized_message := regexp_replace(v_normalized_message,
    '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', '<uuid>', 'gi');
  v_normalized_message := regexp_replace(v_normalized_message, '\m[0-9]{3,}\M', '<number>', 'g');
  v_fingerprint := md5(v_action || '|' || v_normalized_message || '|' || v_route);

  insert into public.system_log_ingest_limits (user_id, window_started_at, event_count, updated_at)
  values (v_user_id, now(), 1, now())
  on conflict (user_id) do update set
    window_started_at = case
      when system_log_ingest_limits.window_started_at < now() - interval '5 minutes' then now()
      else system_log_ingest_limits.window_started_at
    end,
    event_count = case
      when system_log_ingest_limits.window_started_at < now() - interval '5 minutes' then 1
      else system_log_ingest_limits.event_count + 1
    end,
    updated_at = now()
  returning event_count into v_count;

  if v_count > 20 then
    return jsonb_build_object('accepted', false, 'reason', 'rate_limited');
  end if;

  -- Chi nhan cac truong chan doan da cho phep; bo qua moi context tuy y/nhay cam.
  v_safe_context := jsonb_strip_nulls(jsonb_build_object(
    'environment', p_context->>'environment',
    'error_name', left(p_context->>'error_name', 80),
    'component', left(p_context->>'component', 100),
    'operation', left(p_context->>'operation', 100),
    'source', left(p_context->>'source', 80),
    'status_code', left(p_context->>'status_code', 12),
    'supabase_code', left(p_context->>'supabase_code', 60),
    'browser', left(p_context->>'browser', 180),
    'online', left(p_context->>'online', 8),
    'correlation_id', left(p_context->>'correlation_id', 80),
    'stack', left(
      regexp_replace(
        regexp_replace(coalesce(p_context->>'stack', ''), '(?i)bearer\s+[A-Za-z0-9._~+/=-]+', 'Bearer <redacted>', 'g'),
        'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}', '<jwt>', 'g'
      ),
      1800
    )
  ));

  insert into public.system_logs (
    user_id, action, severity, message, details, fingerprint,
    occurrence_count, first_seen_at, last_seen_at, route, app_version, dedup_date
  ) values (
    v_user_id, v_action, v_severity, v_message, v_safe_context, v_fingerprint,
    1, now(), now(), nullif(v_route, ''), left(p_app_version, 40), v_metric_date
  )
  on conflict (user_id, fingerprint, dedup_date) do update set
    occurrence_count = least(public.system_logs.occurrence_count + 1, 1000000),
    last_seen_at = now(),
    severity = case
      when public.system_logs.severity in ('critical', 'security') then public.system_logs.severity
      else excluded.severity
    end,
    message = excluded.message,
    details = excluded.details,
    route = excluded.route,
    app_version = excluded.app_version,
    resolved_at = null
  returning id, occurrence_count into v_log_id, v_occurrence_count;

  return jsonb_build_object(
    'accepted', true,
    'log_id', v_log_id,
    'deduplicated', v_occurrence_count > 1,
    'occurrence_count', v_occurrence_count
  );
end;
$$;


revoke all on function public.report_client_error(text,text,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.report_client_error(text,text,text,jsonb,text,text) to authenticated;
commit;
