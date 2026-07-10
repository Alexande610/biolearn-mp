-- NextGen BioLearn unified Supabase migration
-- Run this in Supabase SQL Editor on a fresh or existing project.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  username text unique,
  display_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'teacher', 'admin')),
  xp integer default 0,
  level integer default 1,
  coins integer default 0,
  total_score integer default 0,
  weekly_score integer default 0,
  pvp_score integer default 0,
  wins integer default 0,
  losses integer default 0,
  pvp_wins integer default 0,
  stamina integer default 20,
  max_stamina integer default 20,
  last_stamina_update timestamptz default now(),
  energy integer default 20,
  max_energy integer default 20,
  energy_last_update timestamptz default now(),
  mini_game_claims_today integer default 0,
  last_mini_game_claim timestamptz,
  daily_missions jsonb default '{}'::jsonb,
  unlocked_chapters jsonb default '[]'::jsonb,
  inventory jsonb default '["adventurer-1","adventurer-2","adventurer-3","adventurer-4","adventurer-5"]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  class_progress jsonb default '{}'::jsonb,
  levels_completed integer default 0,
  login_streak integer default 0,
  highest_streak integer default 0,
  last_streak_date date,
  last_active_at timestamptz,
  last_class_id text,
  is_locked boolean default false,
  lock_reason text,
  locked_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists pvp_score integer default 0;
alter table public.profiles add column if not exists pvp_wins integer default 0;
alter table public.profiles add column if not exists stamina integer default 20;
alter table public.profiles add column if not exists max_stamina integer default 20;
alter table public.profiles add column if not exists last_stamina_update timestamptz default now();
alter table public.profiles add column if not exists energy integer default 20;
alter table public.profiles add column if not exists max_energy integer default 20;
alter table public.profiles add column if not exists energy_last_update timestamptz default now();
alter table public.profiles add column if not exists mini_game_claims_today integer default 0;
alter table public.profiles add column if not exists last_mini_game_claim timestamptz;
alter table public.profiles add column if not exists class_progress jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists unlocked_chapters jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists is_locked boolean default false;
alter table public.profiles add column if not exists lock_reason text;
alter table public.profiles add column if not exists locked_at timestamptz;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles alter column last_active_at type timestamptz using last_active_at::timestamptz;
alter table public.profiles add column if not exists last_class_id text;
alter table public.profiles add column if not exists highest_streak integer default 0;

create table if not exists public.lesson_questions (
  id uuid default gen_random_uuid() primary key,
  class_id integer not null,
  chapter_id integer not null,
  lesson_id integer not null,
  level integer default 0,
  title text,
  description text,
  theory text,
  game jsonb not null default '[]'::jsonb,
  boss_questions jsonb,
  created_at timestamptz default now(),
  unique(class_id, chapter_id, lesson_id, level)
);

create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  class_id integer not null,
  content text not null,
  options jsonb not null,
  correct_option integer not null,
  explanation text,
  created_at timestamptz default now()
);

create table if not exists public.quiz_rooms (
  id uuid default gen_random_uuid() primary key,
  room_code varchar(10) unique not null,
  teacher_id uuid references public.profiles(id) not null,
  title text default 'Phòng thi đấu Sinh học',
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  current_question_index integer default 0,
  questions jsonb default '[]'::jsonb,
  participants jsonb default '[]'::jsonb,
  settings jsonb default '{"timePerQuestion":20}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.pvp_queues (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  class_id integer not null,
  display_name text,
  avatar_url text,
  match_room_id text,
  match_opponent_id uuid,
  joined_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.pvp_queues add column if not exists match_room_id text;
alter table public.pvp_queues add column if not exists match_opponent_id uuid;
alter table public.pvp_queues add column if not exists display_name text;
alter table public.pvp_queues add column if not exists avatar_url text;
alter table public.pvp_queues add column if not exists joined_at timestamptz default now();
alter table public.pvp_queues add column if not exists created_at timestamptz default now();

create table if not exists public.pvp_matches (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  player1_id uuid references public.profiles(id),
  player2_id uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  player1_score integer default 0,
  player2_score integer default 0,
  class_id integer,
  status text default 'finished',
  created_at timestamptz default now()
);

create table if not exists public.teacher_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_code text,
  code_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_rooms enable row level security;
alter table public.pvp_queues enable row level security;
alter table public.pvp_matches enable row level security;
alter table public.teacher_requests enable row level security;
alter table public.system_logs enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "lesson_questions_read_all" on public.lesson_questions;
create policy "lesson_questions_read_all" on public.lesson_questions for select using (true);

drop policy if exists "questions_read_all" on public.questions;
create policy "questions_read_all" on public.questions for select using (true);

drop policy if exists "quiz_rooms_select_all" on public.quiz_rooms;
create policy "quiz_rooms_select_all" on public.quiz_rooms for select using (true);

drop policy if exists "quiz_rooms_update_all" on public.quiz_rooms;
create policy "quiz_rooms_update_all" on public.quiz_rooms for update using (true);

drop policy if exists "quiz_rooms_insert_teacher" on public.quiz_rooms;
create policy "quiz_rooms_insert_teacher" on public.quiz_rooms for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  )
);

drop policy if exists "pvp_queues_all_authenticated" on public.pvp_queues;
create policy "pvp_queues_all_authenticated" on public.pvp_queues for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "pvp_matches_read_all" on public.pvp_matches;
create policy "pvp_matches_read_all" on public.pvp_matches for select using (true);

drop policy if exists "pvp_matches_insert_authenticated" on public.pvp_matches;
create policy "pvp_matches_insert_authenticated" on public.pvp_matches for insert with check (auth.uid() is not null);

drop policy if exists "teacher_requests_admin_all" on public.teacher_requests;
create policy "teacher_requests_admin_all" on public.teacher_requests for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "teacher_requests_insert_authenticated" on public.teacher_requests;
create policy "teacher_requests_insert_authenticated" on public.teacher_requests for insert with check (auth.uid() is not null);

drop policy if exists "system_logs_admin_read" on public.system_logs;
create policy "system_logs_admin_read" on public.system_logs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_upload" on storage.objects;
create policy "avatars_authenticated_upload" on storage.objects
for insert with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatars_authenticated_update" on storage.objects;
create policy "avatars_authenticated_update" on storage.objects
for update using (bucket_id = 'avatars' and auth.uid() is not null)
with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatars_authenticated_delete" on storage.objects;
create policy "avatars_authenticated_delete" on storage.objects
for delete using (bucket_id = 'avatars' and auth.uid() is not null);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, stamina, max_stamina, energy, max_energy, last_stamina_update)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    20,
    20,
    20,
    20,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
alter function public.handle_new_user() set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop function if exists public.internal_update_mission_and_streak(uuid, integer, integer, boolean);
create or replace function public.internal_update_mission_and_streak(
  p_user_id uuid,
  p_mission_id integer,
  p_progress_gain integer,
  p_is_absolute boolean default false
)
returns jsonb as $$
declare
  _res_missions jsonb;
  _res_last_active timestamptz;
  _res_last_streak date;
  _res_streak integer;
  _res_new_missions jsonb;
  _res_prog_key text;
  _res_comp_key text;
  _res_current_prog integer;
  _res_target integer;
  _res_is_new_day boolean;
  _res_is_new_week boolean;
  _res_today date;
begin
  -- Load current data
  select daily_missions, last_active_at, last_streak_date, login_streak
  into _res_missions, _res_last_active, _res_last_streak, _res_streak
  from public.profiles
  where id = p_user_id;

  _res_missions := coalesce(_res_missions, '{}'::jsonb);
  _res_streak := coalesce(_res_streak, 0);
  _res_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- Check new day & new week (weekly reset matches Monday 00:00 AM in Vietnam)
  _res_is_new_day := (_res_last_active is null or (_res_last_active at time zone 'Asia/Ho_Chi_Minh')::date < _res_today);
  _res_is_new_week := (_res_last_active is null or date_trunc('week', _res_last_active at time zone 'Asia/Ho_Chi_Minh') < date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh'));

  -- Handle Weekly Reset (Monday 00:00 AM)
  if _res_is_new_week then
    _res_streak := 0;
    _res_last_streak := null;
    -- Remove claimed milestones
    _res_missions := _res_missions - 'claimed3Days' - 'claimed5Days' - 'claimed7Days';
  end if;

  -- Handle Daily Reset (00:00 AM)
  if _res_is_new_day then
    -- If streak wasn't updated yesterday, reset to 0
    if _res_last_streak is null or _res_last_streak < _res_today - 1 then
      _res_streak := 0;
    end if;
    -- Clear daily missions progress and claim status
    _res_missions := _res_missions 
      - 'mission1Progress' - 'mission1Completed' - 'mission1Claimed'
      - 'mission2Progress' - 'mission2Completed' - 'mission2Claimed'
      - 'mission3Progress' - 'mission3Completed' - 'mission3Claimed';
  end if;

  -- Update Progress for specific mission
  _res_prog_key := 'mission' || p_mission_id || 'Progress';
  _res_comp_key := 'mission' || p_mission_id || 'Completed';
  _res_target := (case when p_mission_id = 1 then 1 when p_mission_id = 2 then 5 when p_mission_id = 3 then 20 else 0 end);

  if p_is_absolute then
    _res_current_prog := p_progress_gain;
  else
    _res_current_prog := coalesce((_res_missions->>_res_prog_key)::integer, 0) + p_progress_gain;
  end if;

  _res_current_prog := least(_res_current_prog, _res_target);
  
  _res_new_missions := _res_missions || jsonb_build_object(
    _res_prog_key, _res_current_prog,
    _res_comp_key, (_res_current_prog >= _res_target)
  );

  -- Check if all 3 missions are completed today for streak progression
  if coalesce((_res_new_missions->>'mission1Completed')::boolean, false) = true 
     and coalesce((_res_new_missions->>'mission2Completed')::boolean, false) = true 
     and coalesce((_res_new_missions->>'mission3Completed')::boolean, false) = true
     and (_res_last_streak is null or _res_last_streak < _res_today) 
  then
    if _res_last_streak = _res_today - 1 then
      _res_streak := _res_streak + 1;
    else
      _res_streak := 1;
    end if;
    _res_last_streak := _res_today;
  end if;

  -- Update Profile
  update public.profiles
  set 
    daily_missions = _res_new_missions,
    login_streak = _res_streak,
    highest_streak = greatest(coalesce(highest_streak, 0), _res_streak),
    last_streak_date = _res_last_streak,
    last_active_at = now(),
    updated_at = now()
  where id = p_user_id;

  return _res_new_missions;
end;
$$ language plpgsql security definer;
alter function public.internal_update_mission_and_streak(uuid, integer, integer, boolean) set search_path = public;

drop function if exists public.update_mission_progress(uuid, integer, integer, boolean);
create or replace function public.update_mission_progress(
  p_user_id uuid,
  p_mission_id integer,
  p_progress_gain integer,
  p_is_absolute boolean default false
)
returns jsonb as $$
begin
  return public.internal_update_mission_and_streak(p_user_id, p_mission_id, p_progress_gain, p_is_absolute);
end;
$$ language plpgsql security definer;
alter function public.update_mission_progress(uuid, integer, integer, boolean) set search_path = public;

drop function if exists public.check_and_reset_missions(uuid);
create or replace function public.check_and_reset_missions(p_user_id uuid)
returns jsonb as $$
declare
  v_last_active timestamptz;
  v_last_streak date;
  v_streak integer;
  v_missions jsonb;
  v_is_new_day boolean;
  v_is_new_week boolean;
  v_today date;
begin
  select last_active_at, last_streak_date, login_streak, daily_missions
  into v_last_active, v_last_streak, v_streak, v_missions
  from public.profiles
  where id = p_user_id;

  if v_last_active is null then
    update public.profiles set last_active_at = now() where id = p_user_id;
    return coalesce(daily_missions, '{}'::jsonb);
  end if;

  v_missions := coalesce(v_missions, '{}'::jsonb);
  v_streak := coalesce(v_streak, 0);
  v_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  v_is_new_day := ((v_last_active at time zone 'Asia/Ho_Chi_Minh')::date < v_today);
  v_is_new_week := (date_trunc('week', v_last_active at time zone 'Asia/Ho_Chi_Minh') < date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh'));

  if v_is_new_week or v_is_new_day then
    if v_is_new_week then
      v_streak := 0;
      v_last_streak := null;
      v_missions := v_missions - 'claimed3Days' - 'claimed5Days' - 'claimed7Days';
    end if;

    if v_is_new_day then
      if v_last_streak is null or v_last_streak < v_today - 1 then
        v_streak := 0;
      end if;
      v_missions := v_missions 
        - 'mission1Progress' - 'mission1Completed' - 'mission1Claimed'
        - 'mission2Progress' - 'mission2Completed' - 'mission2Claimed'
        - 'mission3Progress' - 'mission3Completed' - 'mission3Claimed';
    end if;

    update public.profiles
    set login_streak = v_streak,
        highest_streak = greatest(coalesce(highest_streak, 0), v_streak),
        last_streak_date = v_last_streak,
        daily_missions = v_missions,
        last_active_at = now(),
        updated_at = now()
    where id = p_user_id;
  end if;

  return v_missions;
end;
$$ language plpgsql security definer;
alter function public.check_and_reset_missions(uuid) set search_path = public;

drop function if exists public.reward_user(uuid, integer, integer, text, text);
create or replace function public.reward_user(
  p_user_id uuid,
  p_xp_gain integer,
  p_coin_gain integer,
  p_reward_type text,
  p_class_id text default null
)
returns jsonb as $$
declare
  v_missions jsonb;
begin
  if p_reward_type in ('map', 'pvp') then
    perform public.internal_update_mission_and_streak(p_user_id, 1, 1, false);
    v_missions := public.internal_update_mission_and_streak(p_user_id, 2, 1, false);
  else
    select daily_missions into v_missions from public.profiles where id = p_user_id;
  end if;

  update public.profiles
  set xp = coalesce(xp, 0) + p_xp_gain,
      coins = coalesce(coins, 0) + p_coin_gain,
      weekly_score = coalesce(weekly_score, 0) + case when p_reward_type = 'map' then p_xp_gain else 0 end,
      pvp_score = coalesce(pvp_score, 0) + case when p_reward_type = 'pvp' then p_xp_gain else 0 end,
      total_score = coalesce(total_score, 0) + p_xp_gain,
      level = greatest(coalesce(level, 1), floor((coalesce(total_score, 0) + p_xp_gain) / 1000) + 1),
      levels_completed = coalesce(levels_completed, 0) + case when p_reward_type = 'map' then 1 else 0 end,
      last_class_id = coalesce(p_class_id, last_class_id),
      last_active_at = now(),
      updated_at = now()
  where id = p_user_id;

  return coalesce(v_missions, '{}'::jsonb);
end;
$$ language plpgsql security definer;
alter function public.reward_user(uuid, integer, integer, text, text) set search_path = public;

drop function if exists public.reward_pvp(uuid, integer, integer, integer);
create or replace function public.reward_pvp(
  target_user_id uuid,
  add_xp integer,
  add_coins integer,
  add_rank integer
)
returns void as $$
begin
  update public.profiles
  set xp = coalesce(xp, 0) + add_xp,
      coins = coalesce(coins, 0) + add_coins,
      total_score = coalesce(total_score, 0) + add_xp,
      level = greatest(coalesce(level, 1), floor((coalesce(total_score, 0) + add_xp) / 1000) + 1),
      pvp_score = coalesce(pvp_score, 0) + add_rank,
      pvp_wins = coalesce(pvp_wins, 0) + case when add_xp >= 100 then 1 else 0 end,
      wins = coalesce(wins, 0) + case when add_xp >= 100 then 1 else 0 end,
      last_active_at = now(),
      updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;
alter function public.reward_pvp(uuid, integer, integer, integer) set search_path = public;

alter table public.pvp_queues replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.quiz_rooms;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.pvp_queues;
  exception when duplicate_object then null;
  end;
end $$;

-- Create study_videos table for managing lesson videos
create table if not exists public.study_videos (
  id uuid default gen_random_uuid() primary key,
  class_id integer not null,
  title text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- Disable Row Level Security to allow easy read/write if other tables are identical
alter table public.study_videos disable row level security;

-- In case RLS is forced on by Supabase configuration, create open policies:
drop policy if exists "Allow public read access" on public.study_videos;
create policy "Allow public read access" on public.study_videos for select using (true);

drop policy if exists "Allow all access" on public.study_videos;
create policy "Allow all access" on public.study_videos for all using (true) with check (true);

-- Create user_mails table for mailbox and gifts
create table if not exists public.user_mails (
  id uuid default gen_random_uuid() primary key,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  coins_attached integer default 0,
  is_read boolean default false not null,
  is_claimed boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists user_mails_receiver_idx on public.user_mails(receiver_id);
alter table public.user_mails disable row level security;

-- In case RLS is forced on by Supabase configuration, create open policies:
drop policy if exists "Allow public read access" on public.user_mails;
create policy "Allow public read access" on public.user_mails for select using (true);

drop policy if exists "Allow all access" on public.user_mails;
create policy "Allow all access" on public.user_mails for all using (true) with check (true);
