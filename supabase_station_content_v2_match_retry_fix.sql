-- Apply after supabase_station_content_v2_gameplay_fix.sql.
-- A match has a finite set of valid left/right combinations. The primary key
-- caches repeated checks, so no smaller global attempt cap is needed.
begin;

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

commit;
