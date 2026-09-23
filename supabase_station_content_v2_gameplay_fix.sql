-- Apply after supabase_station_content_v2.sql and before deploying the matching
-- V2 client. Existing releases, answers, progress and rewards remain unchanged.
begin;

alter table public.station_attempts
  add column if not exists is_demo boolean not null default false;

create table if not exists public.station_match_pair_checks (
  attempt_id uuid not null references public.station_attempts(id) on delete cascade,
  item_id uuid not null references public.station_content_items(id),
  left_text text not null,
  right_text text not null,
  is_correct boolean not null,
  checked_at timestamptz not null default now(),
  primary key (attempt_id, item_id, left_text, right_text)
);
alter table public.station_match_pair_checks enable row level security;
revoke all on public.station_match_pair_checks from public, anon, authenticated;

create or replace function public.check_station_match_pair(
  p_attempt_id uuid, p_item_id uuid, p_left text, p_right text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.station_attempts%rowtype;
  v_item public.station_content_items%rowtype;
  v_existing boolean;
  v_is_correct boolean;
  v_count integer;
  v_pair_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select * into v_attempt from public.station_attempts
  where id = p_attempt_id and user_id = auth.uid() for update;
  if not found then raise exception 'attempt_not_found' using errcode = '42501'; end if;
  if v_attempt.status <> 'active' then raise exception 'attempt_is_not_active'; end if;
  if not (p_item_id = any(v_attempt.game_order)) then raise exception 'item_not_in_attempt'; end if;
  if exists (select 1 from public.station_attempt_results
             where attempt_id = p_attempt_id and item_id = p_item_id) then
    raise exception 'game_already_resolved';
  end if;
  select * into v_item from public.station_content_items
  where id = p_item_id and release_id = v_attempt.release_id
    and day_index = v_attempt.day_index and game_type = 'match';
  if not found then raise exception 'match_item_not_found'; end if;
  if not exists (select 1 from jsonb_array_elements_text(v_item.public_content->'leftItems') as left_item(value) where left_item.value = p_left)
    or not exists (select 1 from jsonb_array_elements_text(v_item.public_content->'rightItems') as right_item(value) where right_item.value = p_right) then
    raise exception 'invalid_match_pair';
  end if;

  select is_correct into v_existing from public.station_match_pair_checks
  where attempt_id = p_attempt_id and item_id = p_item_id
    and left_text = p_left and right_text = p_right;
  if found then return jsonb_build_object('correct', v_existing); end if;
  if exists (select 1 from public.station_match_pair_checks
             where attempt_id = p_attempt_id and item_id = p_item_id
               and left_text = p_left and is_correct) then
    raise exception 'match_left_already_resolved';
  end if;
  select count(*) into v_count from public.station_match_pair_checks
  where attempt_id = p_attempt_id and item_id = p_item_id;
  v_pair_count := jsonb_array_length(v_item.public_content->'leftItems');
  if v_count >= v_pair_count * (v_pair_count + 1) / 2 then
    raise exception 'match_pair_check_limit_reached';
  end if;
  select exists (
    select 1 from jsonb_array_elements(v_item.answer_key->'value') pair
    where pair->>'left' = p_left and pair->>'right' = p_right
  ) into v_is_correct;
  insert into public.station_match_pair_checks(attempt_id, item_id, left_text, right_text, is_correct)
  values(p_attempt_id, p_item_id, p_left, p_right, v_is_correct);
  return jsonb_build_object('correct', v_is_correct);
end;
$$;
revoke all on function public.check_station_match_pair(uuid, uuid, text, text) from public, anon;
grant execute on function public.check_station_match_pair(uuid, uuid, text, text) to authenticated;

create or replace function public.start_station_demo_attempt(
  p_grade integer, p_station_id text, p_day_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_release_id uuid;
  v_attempt_id uuid;
  v_order uuid[];
  v_games jsonb;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = v_user and is_test_account) then
    raise exception 'demo_test_account_required' using errcode = '42501';
  end if;
  if p_grade not between 6 and 12 or p_day_index not between 1 and 10 then raise exception 'invalid_station_day'; end if;
  if not exists (select 1 from public.station_catalog c
                 where c.grade = p_grade and c.station_id = p_station_id and not c.is_future) then
    raise exception 'invalid_station';
  end if;
  select p.release_id into v_release_id
  from public.station_content_publications p
  join public.station_content_releases r on r.id = p.release_id and r.status = 'published'
  where p.grade = p_grade and p.station_id = p_station_id;
  if v_release_id is null then raise exception 'station_content_not_published'; end if;
  select array_agg(i.id order by random()) into v_order
  from public.station_content_items i
  where i.release_id = v_release_id and i.day_index = p_day_index;
  if cardinality(v_order) <> 5 then raise exception 'published_stage_is_incomplete'; end if;
  insert into public.station_attempts(user_id, release_id, grade, station_id, day_index, game_order, is_demo)
  values(v_user, v_release_id, p_grade, p_station_id, p_day_index, v_order, true)
  returning id into v_attempt_id;
  select jsonb_agg(jsonb_build_object(
    'id', i.id, 'type', i.game_type, 'title', i.title, 'content', i.public_content
  ) order by array_position(v_order, i.id)) into v_games
  from public.station_content_items i where i.id = any(v_order);
  return jsonb_build_object('attempt_id', v_attempt_id, 'release_id', v_release_id,
                            'is_demo', true, 'games', v_games);
end;
$$;
revoke all on function public.start_station_demo_attempt(integer, text, integer) from public, anon;
grant execute on function public.start_station_demo_attempt(integer, text, integer) to authenticated;

-- An unpublished station must fall back to the legacy path even on day two.
-- Check publication before V2 progression, while keeping the normal gate for
-- stations that already have a published V2 release.
create or replace function public.start_station_attempt(p_grade integer, p_station_id text, p_day_index integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_release_id uuid;
  v_attempt_id uuid;
  v_order uuid[];
  v_games jsonb;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_grade not between 6 and 12 or p_day_index not between 1 and 10 then raise exception 'invalid_station_day'; end if;
  if not exists (select 1 from public.station_catalog c
                 where c.grade = p_grade and c.station_id = p_station_id and not c.is_future) then
    raise exception 'invalid_station';
  end if;
  select p.release_id into v_release_id
  from public.station_content_publications p
  join public.station_content_releases r on r.id = p.release_id and r.status = 'published'
  where p.grade = p_grade and p.station_id = p_station_id;
  if v_release_id is null then raise exception 'station_content_not_published'; end if;
  if p_day_index > 1 and not exists (
    select 1 from public.station_progress sp
    where sp.user_id = v_user and sp.station_id = p_station_id
      and sp.day_index = p_day_index - 1 and sp.stars > 0
  ) then raise exception 'previous_day_required'; end if;
  select array_agg(i.id order by random()) into v_order
  from public.station_content_items i
  where i.release_id = v_release_id and i.day_index = p_day_index;
  if cardinality(v_order) <> 5 then raise exception 'published_stage_is_incomplete'; end if;
  insert into public.station_attempts(user_id, release_id, grade, station_id, day_index, game_order)
  values(v_user, v_release_id, p_grade, p_station_id, p_day_index, v_order)
  returning id into v_attempt_id;
  select jsonb_agg(jsonb_build_object(
    'id', i.id, 'type', i.game_type, 'title', i.title, 'content', i.public_content
  ) order by array_position(v_order, i.id)) into v_games
  from public.station_content_items i where i.id = any(v_order);
  return jsonb_build_object('attempt_id', v_attempt_id, 'release_id', v_release_id, 'games', v_games);
end;
$$;
revoke all on function public.start_station_attempt(integer, text, integer) from public, anon;
grant execute on function public.start_station_attempt(integer, text, integer) to authenticated;

-- submit_station_answer is replaced below to keep its existing scoring rules
-- and skip only the real reward/progress claim for is_demo attempts.
create or replace function public.submit_station_answer(
  p_attempt_id uuid,
  p_item_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.station_attempts%rowtype;
  v_item public.station_content_items%rowtype;
  v_attempt_no integer;
  v_is_correct boolean := false;
  v_resolved boolean := false;
  v_resolved_count integer := 0;
  v_correct_count integer := 0;
  v_stars integer := 0;
  v_reward jsonb := '{}'::jsonb;
  v_feedback jsonb := null;
  v_submitted_text text;
  v_expected_text text;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_answer is null then raise exception 'answer_required'; end if;

  select * into v_attempt from public.station_attempts
  where id = p_attempt_id and user_id = v_user for update;
  if not found then raise exception 'attempt_not_found' using errcode = '42501'; end if;
  if v_attempt.status <> 'active' then raise exception 'attempt_is_not_active'; end if;
  if not (p_item_id = any(v_attempt.game_order)) then raise exception 'item_not_in_attempt'; end if;
  if exists (
    select 1 from public.station_attempt_results r
    where r.attempt_id = p_attempt_id and r.item_id = p_item_id
  ) then raise exception 'game_already_resolved'; end if;

  select * into v_item from public.station_content_items
  where id = p_item_id and release_id = v_attempt.release_id and day_index = v_attempt.day_index;
  if not found then raise exception 'content_item_not_found'; end if;

  select count(*) + 1 into v_attempt_no
  from public.station_attempt_answers a
  where a.attempt_id = p_attempt_id and a.item_id = p_item_id;
  if v_attempt_no > 2 then raise exception 'maximum_attempts_reached'; end if;

  if v_item.game_type in ('quiz', 'fill', 'dragdrop') then
    v_submitted_text := lower(regexp_replace(trim(coalesce(p_answer ->> 'value', '')), '\s+', ' ', 'g'));
    v_expected_text := lower(regexp_replace(trim(coalesce(v_item.answer_key ->> 'value', '')), '\s+', ' ', 'g'));
    v_is_correct := v_submitted_text <> '' and v_submitted_text = v_expected_text;
  elsif v_item.game_type in ('match', 'category') then
    v_is_correct := (p_answer -> 'value') = (v_item.answer_key -> 'value');
  end if;

  insert into public.station_attempt_answers(attempt_id, item_id, attempt_no, submitted_answer, is_correct)
  values(p_attempt_id, p_item_id, v_attempt_no, p_answer, v_is_correct);

  v_resolved := v_is_correct or v_attempt_no = 2;
  if v_item.game_type = 'category' and not v_is_correct and v_attempt_no = 1 then
    select jsonb_agg(jsonb_build_object(
      'name', submitted->>'name',
      'correct', exists (
        select 1 from jsonb_array_elements(v_item.answer_key->'value') expected
        where expected->>'name' = submitted->>'name'
          and expected->>'catIndex' = submitted->>'catIndex'
      )
    )) into v_feedback
    from jsonb_array_elements(p_answer->'value') submitted;
  end if;
  if v_resolved then
    insert into public.station_attempt_results(attempt_id, item_id, is_correct)
    values(p_attempt_id, p_item_id, v_is_correct);
  end if;

  select count(*), count(*) filter (where is_correct)
  into v_resolved_count, v_correct_count
  from public.station_attempt_results r where r.attempt_id = p_attempt_id;

  if v_resolved_count = 5 then
    v_stars := case v_correct_count when 5 then 3 when 4 then 2 when 3 then 1 else 0 end;
    update public.station_attempts
    set status = 'completed', correct_count = v_correct_count, stars = v_stars, completed_at = now()
    where id = p_attempt_id;
    if not v_attempt.is_demo then
      select public.claim_station_reward(v_attempt.station_id, v_attempt.day_index, v_stars) into v_reward;
    end if;
  end if;

  return jsonb_build_object(
    'correct', v_is_correct,
    'attempt_no', v_attempt_no,
    'resolved', v_resolved,
    'can_retry', not v_resolved,
    'explanation', case when v_resolved then v_item.answer_key ->> 'explanation' else null end,
    'answer_reveal', case when v_resolved then v_item.answer_key -> 'value' else null end,
    'stage_complete', v_resolved_count = 5,
    'correct_count', v_correct_count,
    'stars', v_stars,
    'reward', v_reward,
    'feedback', v_feedback
  );
end;
$$;

revoke all on function public.submit_station_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_station_answer(uuid, uuid, jsonb) to authenticated;


commit;
