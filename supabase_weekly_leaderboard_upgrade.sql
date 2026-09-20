-- BioLearn weekly leaderboard upgrade.
-- Safe to run after supabase_reward_integrity_upgrade.sql.
-- Existing accumulated weekly/PvP scores are preserved as the opening balance
-- of the current BioLearn week. No profile, match, score, or reward row is deleted.

begin;

create or replace function public.current_biolearn_week()
returns date
language sql
stable
as $$
  select date_trunc('week', timezone('Asia/Ho_Chi_Minh', now()))::date;
$$;

create table if not exists public.weekly_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null default public.current_biolearn_week(),
  map_score integer not null default 0 check (map_score >= 0),
  pvp_score integer not null default 0 check (pvp_score >= 0),
  weekly_score integer generated always as (map_score + pvp_score) stored,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create index if not exists weekly_scores_rank_idx
  on public.weekly_scores (week_start, weekly_score desc);

alter table public.weekly_scores enable row level security;

drop policy if exists weekly_scores_read_all on public.weekly_scores;
create policy weekly_scores_read_all on public.weekly_scores
for select using (true);

grant select on table public.weekly_scores to authenticated;
grant select on table public.pvp_class_scores to authenticated;

-- Convert the class PvP table from an all-time row into one row per BioLearn week.
alter table public.pvp_class_scores
  add column if not exists week_start date;

update public.pvp_class_scores
set week_start = public.current_biolearn_week()
where week_start is null;

alter table public.pvp_class_scores
  alter column week_start set default public.current_biolearn_week(),
  alter column week_start set not null;

alter table public.pvp_class_scores
  drop constraint if exists pvp_class_scores_pkey;

alter table public.pvp_class_scores
  add constraint pvp_class_scores_pkey primary key (user_id, class_id, week_start);

create index if not exists pvp_class_scores_rank_idx
  on public.pvp_class_scores (week_start, class_id, score desc);

-- Preserve the visible accumulated value when the system moves to week-aware data.
-- PvP is capped at weekly_score during this one-time conversion so the displayed
-- weekly total cannot increase merely because of the migration.
insert into public.weekly_scores (user_id, week_start, map_score, pvp_score)
select
  p.id,
  public.current_biolearn_week(),
  greatest(coalesce(p.weekly_score, 0) - least(coalesce(pc.pvp_score, 0), coalesce(p.weekly_score, 0)), 0),
  least(coalesce(pc.pvp_score, 0), coalesce(p.weekly_score, 0))
from public.profiles p
left join (
  select user_id, sum(score)::integer as pvp_score
  from public.pvp_class_scores
  where week_start = public.current_biolearn_week()
  group by user_id
) pc on pc.user_id = p.id
where coalesce(p.weekly_score, 0) > 0
on conflict (user_id, week_start) do nothing;

create or replace function public.get_my_weekly_score()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select ws.weekly_score
    from public.weekly_scores ws
    where ws.user_id = auth.uid()
      and ws.week_start = public.current_biolearn_week()
  ), 0);
$$;

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
  v_weekly_score integer;
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

  insert into public.weekly_scores(user_id, week_start, map_score)
  values (v_user_id, public.current_biolearn_week(), v_score)
  on conflict (user_id, week_start) do update
  set map_score = public.weekly_scores.map_score + excluded.map_score,
      updated_at = now()
  returning weekly_score into v_weekly_score;

  update public.profiles
  set coins = coalesce(coins, 0) + v_coins,
      total_score = coalesce(total_score, 0) + v_score,
      weekly_score = v_weekly_score,
      levels_completed = coalesce(levels_completed, 0) + 1,
      bosses_defeated = coalesce(bosses_defeated, 0) + case when p_reward_code like 'boss_%' then 1 else 0 end,
      last_class_id = p_class_id::text,
      last_active_at = now(),
      updated_at = now()
  where id = v_user_id;

  perform public.internal_update_mission_and_streak(v_user_id, 1, 1, false);
  perform public.internal_update_mission_and_streak(v_user_id, 2, 1, false);

  return jsonb_build_object('awarded', true, 'score', v_score, 'coins', v_coins, 'xp', 0, 'weekly_score', v_weekly_score);
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
  v_weekly_score integer;
  v_week_start date := public.current_biolearn_week();
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
    and created_at >= timezone('Asia/Ho_Chi_Minh', now())::date
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

  insert into public.weekly_scores(user_id, week_start, pvp_score)
  values (v_winner, v_week_start, 100)
  on conflict (user_id, week_start) do update
  set pvp_score = public.weekly_scores.pvp_score + excluded.pvp_score,
      updated_at = now()
  returning weekly_score into v_weekly_score;

  update public.profiles
  set xp = coalesce(xp, 0) + 100,
      coins = coalesce(coins, 0) + 50,
      pvp_score = coalesce(pvp_score, 0) + 100,
      weekly_score = v_weekly_score,
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

  insert into public.pvp_class_scores(user_id, class_id, week_start, score, wins, completed_matches)
  values (v_winner, p_class_id, v_week_start, 100, 1, 1)
  on conflict (user_id, class_id, week_start) do update
  set score = public.pvp_class_scores.score + 100,
      wins = public.pvp_class_scores.wins + 1,
      completed_matches = public.pvp_class_scores.completed_matches + 1,
      updated_at = now();

  insert into public.pvp_class_scores(user_id, class_id, week_start, losses, completed_matches)
  values (v_loser, p_class_id, v_week_start, 1, 1)
  on conflict (user_id, class_id, week_start) do update
  set losses = public.pvp_class_scores.losses + 1,
      completed_matches = public.pvp_class_scores.completed_matches + 1,
      updated_at = now();

  return jsonb_build_object(
    'awarded', true,
    'winner_id', v_winner,
    'xp', 100,
    'coins', 50,
    'pvp_score', 100,
    'weekly_score', v_weekly_score
  );
end;
$$;

revoke all on function public.current_biolearn_week() from public;
revoke all on function public.get_my_weekly_score() from public;
revoke all on function public.claim_map_reward(text, integer, text) from public;
revoke all on function public.finalize_pvp_match(text, uuid, uuid, integer, integer, integer, integer) from public;

grant execute on function public.current_biolearn_week() to authenticated;
grant execute on function public.get_my_weekly_score() to authenticated;
grant execute on function public.claim_map_reward(text, integer, text) to authenticated;
grant execute on function public.finalize_pvp_match(text, uuid, uuid, integer, integer, integer, integer) to authenticated;

commit;
