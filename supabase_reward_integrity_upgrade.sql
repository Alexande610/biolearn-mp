-- BioLearn reward integrity and progression upgrade.
-- Run once in the Supabase SQL editor after supabase_unified_migration.sql.

begin;

create or replace function public.xp_threshold_for_level(p_level integer)
returns integer
language sql
immutable
strict
as $$
  select case
    when p_level <= 1 then 0
    when p_level >= 30 then 232000
    else 250 * (p_level - 1) * (p_level + 2)
  end;
$$;

create or replace function public.level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_xp integer := greatest(coalesce(p_xp, 0), 0);
  v_level integer := 1;
begin
  while v_level < 30 and v_xp >= public.xp_threshold_for_level(v_level + 1) loop
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

alter table public.profiles add column if not exists pvp_cooldown_until timestamptz;
alter table public.profiles add column if not exists pvp_abandons integer not null default 0;
alter table public.profiles add column if not exists bosses_defeated integer not null default 0;

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_key text not null,
  xp_gain integer not null default 0 check (xp_gain >= 0),
  coin_gain integer not null default 0 check (coin_gain >= 0),
  map_score_gain integer not null default 0 check (map_score_gain >= 0),
  pvp_score_gain integer not null default 0 check (pvp_score_gain >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, event_type, event_key)
);

create table if not exists public.pvp_class_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id integer not null check (class_id between 6 and 12),
  score integer not null default 0 check (score >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  completed_matches integer not null default 0 check (completed_matches >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id)
);

alter table public.pvp_matches add column if not exists finished_at timestamptz;
alter table public.pvp_matches add column if not exists rewarded_at timestamptz;
alter table public.pvp_matches add column if not exists quitter_id uuid references public.profiles(id);
alter table public.pvp_matches add column if not exists questions_played integer not null default 0;

-- Preserve old duplicate history, but prevent new duplicates after retaining one row per room.
delete from public.pvp_matches a
using public.pvp_matches b
where a.room_id = b.room_id
  and (a.created_at, a.ctid) > (b.created_at, b.ctid);

create unique index if not exists pvp_matches_room_id_unique on public.pvp_matches(room_id);

alter table public.reward_ledger enable row level security;
alter table public.pvp_class_scores enable row level security;

drop policy if exists reward_ledger_read_own on public.reward_ledger;
create policy reward_ledger_read_own on public.reward_ledger
for select using (auth.uid() = user_id);

drop policy if exists pvp_class_scores_read_all on public.pvp_class_scores;
create policy pvp_class_scores_read_all on public.pvp_class_scores
for select using (true);

create or replace function public.claim_map_reward(
  p_event_key text,
  p_class_id integer,
  p_reward_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_score integer;
  v_coins integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_event_key), '') = '' then raise exception 'Invalid event key'; end if;
  if p_class_id not between 6 and 12 then raise exception 'Invalid class'; end if;

  case p_reward_code
    when 'normal' then v_score := 30; v_coins := 30;
    when 'skip' then v_score := 500; v_coins := 500;
    when 'boss_1' then v_score := 100; v_coins := 100;
    when 'boss_2' then v_score := 150; v_coins := 150;
    when 'boss_3' then v_score := 200; v_coins := 200;
    else raise exception 'Invalid reward code';
  end case;

  insert into public.reward_ledger(user_id, event_type, event_key, coin_gain, map_score_gain)
  values (v_user_id, 'map', p_event_key, v_coins, v_score)
  on conflict do nothing;

  if not found then
    return jsonb_build_object('awarded', false, 'reason', 'already_claimed');
  end if;

  update public.profiles
  set coins = coalesce(coins, 0) + v_coins,
      total_score = coalesce(total_score, 0) + v_score,
      weekly_score = coalesce(weekly_score, 0) + v_score,
      levels_completed = coalesce(levels_completed, 0) + 1,
      bosses_defeated = coalesce(bosses_defeated, 0) + case when p_reward_code like 'boss_%' then 1 else 0 end,
      last_class_id = p_class_id::text,
      last_active_at = now(),
      updated_at = now()
  where id = v_user_id;

  perform public.internal_update_mission_and_streak(v_user_id, 1, 1, false);
  perform public.internal_update_mission_and_streak(v_user_id, 2, 1, false);

  return jsonb_build_object('awarded', true, 'score', v_score, 'coins', v_coins, 'xp', 0);
end;
$$;

create or replace function public.claim_daily_mission_reward(p_mission_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_completed boolean;
  v_claimed boolean;
  v_coins integer;
  v_xp integer;
  v_level integer;
  v_key text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_mission_id not between 1 and 3 then raise exception 'Invalid mission'; end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  v_key := 'mission' || p_mission_id;
  v_completed := coalesce((v_profile.daily_missions ->> (v_key || 'Completed'))::boolean, false);
  v_claimed := coalesce((v_profile.daily_missions ->> (v_key || 'Claimed'))::boolean, false);
  if not v_completed then raise exception 'Mission is not complete'; end if;
  if v_claimed then return jsonb_build_object('awarded', false, 'reason', 'already_claimed'); end if;

  v_level := public.level_from_xp(v_profile.xp);
  v_coins := p_mission_id * 50;
  v_xp := p_mission_id * 50 + (v_level - 1) * 50;

  update public.profiles
  set coins = coalesce(coins, 0) + v_coins,
      xp = coalesce(xp, 0) + v_xp,
      level = public.level_from_xp(coalesce(xp, 0) + v_xp),
      daily_missions = jsonb_set(coalesce(daily_missions, '{}'::jsonb), array[v_key || 'Claimed'], 'true'::jsonb, true),
      updated_at = now()
  where id = v_user_id;

  insert into public.reward_ledger(user_id, event_type, event_key, xp_gain, coin_gain)
  values (v_user_id, 'daily_mission', current_date::text || ':' || p_mission_id, v_xp, v_coins)
  on conflict do nothing;

  return jsonb_build_object('awarded', true, 'coins', v_coins, 'xp', v_xp, 'level', public.level_from_xp(coalesce(v_profile.xp, 0) + v_xp));
end;
$$;

create or replace function public.claim_station_reward(
  p_station_id text,
  p_day_index integer,
  p_stars integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_claimed integer := 0;
  v_new_stars integer := least(3, greatest(0, coalesce(p_stars, 0)));
  v_gain integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_station_id), '') = '' or p_day_index < 1 then raise exception 'Invalid station day'; end if;

  select coalesce(claimed_stars, 0) into v_old_claimed
  from public.station_progress
  where user_id = v_user_id and station_id = p_station_id and day_index = p_day_index
  for update;
  v_old_claimed := coalesce(v_old_claimed, 0);
  v_gain := greatest(0, v_new_stars - v_old_claimed) * 75;

  insert into public.station_progress(user_id, station_id, day_index, stars, claimed_stars, updated_at)
  values (v_user_id, p_station_id, p_day_index, v_new_stars, v_new_stars, now())
  on conflict (user_id, station_id, day_index) do update
  set stars = greatest(public.station_progress.stars, excluded.stars),
      claimed_stars = greatest(public.station_progress.claimed_stars, excluded.claimed_stars),
      updated_at = now();

  if v_gain > 0 then
    insert into public.reward_ledger(user_id, event_type, event_key, xp_gain, coin_gain)
    values (v_user_id, 'station', p_station_id || ':' || p_day_index || ':' || v_new_stars, v_gain, v_gain)
    on conflict do nothing;
    if found then
      update public.profiles
      set xp = coalesce(xp, 0) + v_gain,
          coins = coalesce(coins, 0) + v_gain,
          level = public.level_from_xp(coalesce(xp, 0) + v_gain),
          updated_at = now()
      where id = v_user_id;
    else
      v_gain := 0;
    end if;
  end if;

  return jsonb_build_object('awarded', v_gain > 0, 'xp', v_gain, 'coins', v_gain, 'claimed_stars', greatest(v_old_claimed, v_new_stars));
end;
$$;

create or replace function public.claim_streak_reward(p_days_required integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_coins integer;
  v_claim_key text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  v_coins := case p_days_required when 3 then 100 when 5 then 200 when 7 then 500 else null end;
  if v_coins is null then raise exception 'Invalid streak milestone'; end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if coalesce(v_profile.login_streak, 0) < p_days_required then raise exception 'Streak milestone is not complete'; end if;
  v_claim_key := 'claimed' || p_days_required || 'Days';
  if coalesce((v_profile.daily_missions ->> v_claim_key)::boolean, false) then
    return jsonb_build_object('awarded', false, 'reason', 'already_claimed');
  end if;

  update public.profiles
  set coins = coalesce(coins, 0) + v_coins,
      daily_missions = jsonb_set(coalesce(daily_missions, '{}'::jsonb), array[v_claim_key], 'true'::jsonb, true),
      updated_at = now()
  where id = v_user_id;

  insert into public.reward_ledger(user_id, event_type, event_key, coin_gain)
  values (v_user_id, 'streak', v_claim_key, v_coins)
  on conflict do nothing;
  return jsonb_build_object('awarded', true, 'coins', v_coins);
end;
$$;

create or replace function public.abandon_pvp_match(
  p_room_id text,
  p_opponent_id uuid,
  p_class_id integer
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_until timestamptz := now() + interval '1 minute';
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_opponent_id is null or p_opponent_id = v_user_id then raise exception 'Invalid opponent'; end if;

  insert into public.pvp_matches(room_id, player1_id, player2_id, winner_id, class_id, status, quitter_id, finished_at)
  values (p_room_id, v_user_id, p_opponent_id, null, p_class_id, 'abandoned', v_user_id, now())
  on conflict (room_id) do update
  set status = 'abandoned', quitter_id = v_user_id, winner_id = null, finished_at = now()
  where public.pvp_matches.rewarded_at is null;

  update public.profiles
  set pvp_cooldown_until = v_until,
      pvp_abandons = coalesce(pvp_abandons, 0) + 1,
      updated_at = now()
  where id = v_user_id;

  return v_until;
end;
$$;

create or replace function public.finalize_pvp_match(
  p_room_id text,
  p_player1_id uuid,
  p_player2_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_class_id integer,
  p_questions_played integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_winner uuid;
  v_loser uuid;
  v_pair_matches integer;
begin
  if v_caller is null or v_caller not in (p_player1_id, p_player2_id) then raise exception 'Not a match participant'; end if;
  if p_player1_id = p_player2_id then raise exception 'Invalid participants'; end if;
  if p_class_id not between 6 and 12 then raise exception 'Invalid class'; end if;
  if p_questions_played < 3 then raise exception 'Match is not eligible for rewards'; end if;
  if exists (
    select 1 from public.profiles
    where id in (p_player1_id, p_player2_id)
      and pvp_cooldown_until > now()
  ) then raise exception 'A participant is in matchmaking cooldown'; end if;
  if p_player1_score = p_player2_score then
    insert into public.pvp_matches(room_id, player1_id, player2_id, player1_score, player2_score, class_id, status, questions_played, finished_at)
    values (p_room_id, p_player1_id, p_player2_id, p_player1_score, p_player2_score, p_class_id, 'draw', p_questions_played, now())
    on conflict (room_id) do nothing;
    return jsonb_build_object('awarded', false, 'result', 'draw');
  end if;

  v_winner := case when p_player1_score > p_player2_score then p_player1_id else p_player2_id end;
  v_loser := case when v_winner = p_player1_id then p_player2_id else p_player1_id end;

  select count(*) into v_pair_matches
  from public.pvp_matches
  where status = 'completed'
    and created_at >= current_date
    and ((player1_id = p_player1_id and player2_id = p_player2_id)
      or (player1_id = p_player2_id and player2_id = p_player1_id));

  if v_pair_matches >= 3 then
    insert into public.pvp_matches(room_id, player1_id, player2_id, winner_id, player1_score, player2_score, class_id, status, questions_played, finished_at)
    values (p_room_id, p_player1_id, p_player2_id, v_winner, p_player1_score, p_player2_score, p_class_id, 'completed_no_reward', p_questions_played, now())
    on conflict (room_id) do nothing;
    return jsonb_build_object('awarded', false, 'reason', 'daily_pair_limit', 'winner_id', v_winner);
  end if;

  insert into public.pvp_matches(room_id, player1_id, player2_id, winner_id, player1_score, player2_score, class_id, status, questions_played, finished_at, rewarded_at)
  values (p_room_id, p_player1_id, p_player2_id, v_winner, p_player1_score, p_player2_score, p_class_id, 'completed', p_questions_played, now(), now())
  on conflict (room_id) do nothing;
  if not found then return jsonb_build_object('awarded', false, 'reason', 'already_processed'); end if;

  insert into public.reward_ledger(user_id, event_type, event_key, xp_gain, coin_gain, pvp_score_gain)
  values (v_winner, 'pvp', p_room_id, 100, 50, 100);

  update public.profiles
  set xp = coalesce(xp, 0) + 100,
      coins = coalesce(coins, 0) + 50,
      pvp_score = coalesce(pvp_score, 0) + 100,
      weekly_score = coalesce(weekly_score, 0) + 100,
      level = public.level_from_xp(coalesce(xp, 0) + 100),
      wins = coalesce(wins, 0) + 1,
      pvp_wins = coalesce(pvp_wins, 0) + 1,
      last_class_id = p_class_id::text,
      updated_at = now()
  where id = v_winner;

  update public.profiles
  set losses = coalesce(losses, 0) + 1,
      last_class_id = p_class_id::text,
      updated_at = now()
  where id = v_loser;

  insert into public.pvp_class_scores(user_id, class_id, score, wins, completed_matches)
  values (v_winner, p_class_id, 100, 1, 1)
  on conflict (user_id, class_id) do update
  set score = public.pvp_class_scores.score + 100,
      wins = public.pvp_class_scores.wins + 1,
      completed_matches = public.pvp_class_scores.completed_matches + 1,
      updated_at = now();

  insert into public.pvp_class_scores(user_id, class_id, losses, completed_matches)
  values (v_loser, p_class_id, 1, 1)
  on conflict (user_id, class_id) do update
  set losses = public.pvp_class_scores.losses + 1,
      completed_matches = public.pvp_class_scores.completed_matches + 1,
      updated_at = now();

  return jsonb_build_object('awarded', true, 'winner_id', v_winner, 'xp', 100, 'coins', 50, 'pvp_score', 100);
end;
$$;

revoke all on function public.claim_map_reward(text, integer, text) from public;
revoke all on function public.claim_daily_mission_reward(integer) from public;
revoke all on function public.abandon_pvp_match(text, uuid, integer) from public;
revoke all on function public.claim_station_reward(text, integer, integer) from public;
revoke all on function public.claim_streak_reward(integer) from public;
revoke all on function public.finalize_pvp_match(text, uuid, uuid, integer, integer, integer, integer) from public;
revoke all on function public.reward_user(uuid, integer, integer, text, text) from public;
revoke all on function public.reward_pvp(uuid, integer, integer, integer) from public;
grant execute on function public.claim_map_reward(text, integer, text) to authenticated;
grant execute on function public.claim_daily_mission_reward(integer) to authenticated;
grant execute on function public.abandon_pvp_match(text, uuid, integer) to authenticated;
grant execute on function public.claim_station_reward(text, integer, integer) to authenticated;
grant execute on function public.claim_streak_reward(integer) to authenticated;
grant execute on function public.finalize_pvp_match(text, uuid, uuid, integer, integer, integer, integer) to authenticated;
revoke execute on function public.reward_user(uuid, integer, integer, text, text) from anon, authenticated;
revoke execute on function public.reward_pvp(uuid, integer, integer, integer) from anon, authenticated;

-- Level is derived only from XP. Existing score columns remain independent.
update public.profiles
set xp = greatest(coalesce(xp, 0), 0),
    level = public.level_from_xp(greatest(coalesce(xp, 0), 0));

commit;
