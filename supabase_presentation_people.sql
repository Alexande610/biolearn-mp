-- Read-only presentation records for the existing production screens.
-- These rows are never authentication identities, reward recipients or PvP opponents.
begin;

create table if not exists public.presentation_people (
  id uuid primary key,
  batch_id text not null,
  display_name text not null,
  avatar_url text,
  role text not null check (role in ('student', 'teacher')),
  grade integer not null check (grade between 6 and 12),
  total_score integer not null default 0 check (total_score >= 0),
  week_start date,
  weekly_map_score integer not null default 0 check (weekly_map_score >= 0),
  weekly_pvp_score integer not null default 0 check (weekly_pvp_score >= 0),
  pvp_wins integer not null default 0 check (pvp_wins >= 0),
  pvp_losses integer not null default 0 check (pvp_losses >= 0),
  completed_lessons integer not null default 0 check (completed_lessons >= 0),
  created_at timestamptz not null,
  last_active_at timestamptz,
  constraint presentation_teacher_scores_check check (
    role = 'student' or (
      total_score = 0 and weekly_map_score = 0 and weekly_pvp_score = 0
      and pvp_wins = 0 and pvp_losses = 0 and completed_lessons = 0
    )
  )
);

create index if not exists presentation_people_batch_idx on public.presentation_people(batch_id);
create index if not exists presentation_people_rank_idx on public.presentation_people(role, total_score desc);

create table if not exists public.presentation_activity (
  person_id uuid not null references public.presentation_people(id) on delete cascade,
  metric_date date not null,
  feature text not null check (feature in ('learning_map','biology_3d','quiz','pvp','missions','mini_game')),
  primary key (person_id, metric_date, feature)
);
create index if not exists presentation_activity_date_idx on public.presentation_activity(metric_date);

alter table public.presentation_people enable row level security;
alter table public.presentation_activity enable row level security;

drop policy if exists presentation_people_authenticated_read on public.presentation_people;
create policy presentation_people_authenticated_read on public.presentation_people
  for select to authenticated using (true);
drop policy if exists presentation_activity_admin_read on public.presentation_activity;
create policy presentation_activity_admin_read on public.presentation_activity
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

revoke all on public.presentation_people from anon, authenticated;
revoke all on public.presentation_activity from anon, authenticated;
grant select on public.presentation_people to authenticated;
grant select on public.presentation_activity to authenticated;

commit;
