-- BioLearn - Observability nhe, an toan cho Supabase Free (2026-08-26)
-- Chay TOAN BO file mot lan trong Supabase SQL Editor.
-- Log cu duoc gan fingerprint rieng de tranh xung dot.
-- Cuoi file se don log error/warning qua 30 ngay va critical/security qua 90 ngay.

alter table public.system_logs add column if not exists severity text;
alter table public.system_logs add column if not exists message text;
alter table public.system_logs add column if not exists fingerprint text;
alter table public.system_logs add column if not exists occurrence_count integer;
alter table public.system_logs add column if not exists first_seen_at timestamptz;
alter table public.system_logs add column if not exists last_seen_at timestamptz;
alter table public.system_logs add column if not exists resolved_at timestamptz;
alter table public.system_logs add column if not exists route text;
alter table public.system_logs add column if not exists app_version text;
alter table public.system_logs add column if not exists dedup_date date;

update public.system_logs
set severity = coalesce(severity, 'error'),
    message = coalesce(message, details->>'message', action),
    fingerprint = coalesce(fingerprint, md5(id::text)),
    occurrence_count = greatest(coalesce(occurrence_count, 1), 1),
    first_seen_at = coalesce(first_seen_at, created_at, now()),
    last_seen_at = coalesce(last_seen_at, created_at, now()),
    dedup_date = coalesce(dedup_date, (coalesce(created_at, now()) at time zone 'UTC')::date)
where severity is null
   or message is null
   or fingerprint is null
   or occurrence_count is null
   or first_seen_at is null
   or last_seen_at is null
   or dedup_date is null;

alter table public.system_logs alter column severity set default 'error';
alter table public.system_logs alter column severity set not null;
alter table public.system_logs alter column fingerprint set not null;
alter table public.system_logs alter column occurrence_count set default 1;
alter table public.system_logs alter column occurrence_count set not null;
alter table public.system_logs alter column first_seen_at set default now();
alter table public.system_logs alter column first_seen_at set not null;
alter table public.system_logs alter column last_seen_at set default now();
alter table public.system_logs alter column last_seen_at set not null;
alter table public.system_logs alter column dedup_date set default ((now() at time zone 'Asia/Ho_Chi_Minh')::date);
alter table public.system_logs alter column dedup_date set not null;

alter table public.system_logs drop constraint if exists system_logs_severity_check;
alter table public.system_logs add constraint system_logs_severity_check
  check (severity in ('warning', 'error', 'critical', 'security'));
alter table public.system_logs drop constraint if exists system_logs_occurrence_count_check;
alter table public.system_logs add constraint system_logs_occurrence_count_check
  check (occurrence_count between 1 and 1000000);

create unique index if not exists system_logs_dedup_idx
  on public.system_logs (user_id, fingerprint, dedup_date);
create index if not exists system_logs_admin_feed_idx
  on public.system_logs (last_seen_at desc);
create index if not exists system_logs_unresolved_idx
  on public.system_logs (severity, last_seen_at desc)
  where resolved_at is null;

alter table public.system_logs enable row level security;

-- Mot dong cho moi tai khoan; dung de gioi han toi da 20 bao cao/5 phut.
create table if not exists public.system_log_ingest_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  event_count integer not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now()
);

-- Du lieu thong ke da tong hop; system_logs khong con bi dung lam analytics.
create table if not exists public.daily_active_users (
  metric_date date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  user_id uuid not null references public.profiles(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (metric_date, user_id)
);

create table if not exists public.feature_daily_users (
  metric_date date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  feature text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (metric_date, feature, user_id),
  constraint feature_daily_users_feature_check check (
    feature in ('learning_map', 'biology_3d', 'quiz', 'pvp', 'missions', 'mini_game', 'admin', 'profile', 'other')
  )
);

create table if not exists public.feature_metrics_daily (
  metric_date date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  feature text not null,
  unique_users integer not null default 0 check (unique_users >= 0),
  updated_at timestamptz not null default now(),
  primary key (metric_date, feature),
  constraint feature_metrics_daily_feature_check check (
    feature in ('learning_map', 'biology_3d', 'quiz', 'pvp', 'missions', 'mini_game', 'admin', 'profile', 'other')
  )
);

create index if not exists daily_active_users_date_idx on public.daily_active_users (metric_date desc);
create index if not exists feature_metrics_daily_date_idx on public.feature_metrics_daily (metric_date desc, feature);

alter table public.system_log_ingest_limits enable row level security;
alter table public.daily_active_users enable row level security;
alter table public.feature_daily_users enable row level security;
alter table public.feature_metrics_daily enable row level security;

drop policy if exists "daily_active_users_admin_read" on public.daily_active_users;
create policy "daily_active_users_admin_read" on public.daily_active_users for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "feature_metrics_daily_admin_read" on public.feature_metrics_daily;
create policy "feature_metrics_daily_admin_read" on public.feature_metrics_daily for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Khong tao INSERT policy cho client. Tat ca ghi du lieu phai qua RPC ben duoi.
drop policy if exists "system_logs_insert_authenticated" on public.system_logs;

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

create or replace function public.record_daily_feature_usage(p_feature text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_feature text := lower(coalesce(p_feature, 'other'));
  v_inserted integer := 0;
  v_metric_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if v_user_id is null then return false; end if;
  if v_feature not in ('learning_map', 'biology_3d', 'quiz', 'pvp', 'missions', 'mini_game', 'admin', 'profile', 'other') then
    v_feature := 'other';
  end if;

  insert into public.daily_active_users (metric_date, user_id)
  values (v_metric_date, v_user_id)
  on conflict do nothing;

  insert into public.feature_daily_users (metric_date, feature, user_id)
  values (v_metric_date, v_feature, v_user_id)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    insert into public.feature_metrics_daily (metric_date, feature, unique_users, updated_at)
    values (v_metric_date, v_feature, 1, now())
    on conflict (metric_date, feature) do update set
      unique_users = public.feature_metrics_daily.unique_users + 1,
      updated_at = now();
  end if;
  return true;
end;
$$;

create or replace function public.prune_system_observability()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_logs integer := 0;
  v_markers integer := 0;
  v_daily integer := 0;
  v_metrics integer := 0;
  v_total integer := 0;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  delete from public.system_logs
  where (severity in ('warning', 'error') and last_seen_at < now() - interval '30 days')
     or (severity in ('critical', 'security') and last_seen_at < now() - interval '90 days');
  get diagnostics v_logs = row_count;

  delete from public.feature_daily_users where metric_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date - 35;
  get diagnostics v_markers = row_count;
  delete from public.daily_active_users where metric_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date - 120;
  get diagnostics v_daily = row_count;
  delete from public.feature_metrics_daily where metric_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date - 400;
  get diagnostics v_metrics = row_count;

  v_total := v_logs + v_markers + v_daily + v_metrics;
  return jsonb_build_object(
    'deleted_total', v_total,
    'logs', v_logs,
    'feature_markers', v_markers,
    'daily_users', v_daily,
    'feature_metrics', v_metrics
  );
end;
$$;

revoke all on function public.report_client_error(text, text, text, jsonb, text, text) from public;
revoke all on function public.record_daily_feature_usage(text) from public;
revoke all on function public.prune_system_observability() from public;
grant execute on function public.report_client_error(text, text, text, jsonb, text, text) to authenticated;
grant execute on function public.record_daily_feature_usage(text) to authenticated;
grant execute on function public.prune_system_observability() to authenticated;

-- Don rac cu ngay khi migration hoan tat (khong anh huong log moi).
delete from public.system_logs
where (severity in ('warning', 'error') and last_seen_at < now() - interval '30 days')
   or (severity in ('critical', 'security') and last_seen_at < now() - interval '90 days');

-- Tat ca gia tri can la true.
select
  to_regprocedure('public.report_client_error(text,text,text,jsonb,text,text)') is not null as error_rpc_ready,
  to_regprocedure('public.record_daily_feature_usage(text)') is not null as metrics_rpc_ready,
  to_regprocedure('public.prune_system_observability()') is not null as retention_rpc_ready,
  to_regclass('public.feature_metrics_daily') is not null as feature_metrics_ready,
  to_regclass('public.daily_active_users') is not null as daily_users_ready;
