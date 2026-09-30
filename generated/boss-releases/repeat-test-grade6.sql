-- Existing Boss V2 databases: repeatable encounters exclusively for test-only lessons and test accounts.
-- Never grants real XP/coins. Normal student/live rules remain unchanged.
begin;
alter table public.boss_lessons add column if not exists test_repeat_enabled boolean not null default false;
create or replace function public.boss_internal_snapshot(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e boss_encounters%rowtype; q boss_questions%rowtype; final boolean; l boss_lessons%rowtype;
begin
  select * into e from boss_encounters where id=p_id;
  if not found then return null; end if;
  select final_stage_ended into final from boss_lesson_progress where user_id=e.user_id
    and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
  select * into l from boss_lessons where class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
  select * into q from boss_questions where id=e.pending_question;
  return jsonb_build_object('id',e.id,'classId',e.class_id,'chapterId',e.chapter_id,'lessonId',e.lesson_id,
    'title',l.title,'preview',l.test_only,
    'repeatTest',l.test_only and l.test_repeat_enabled and coalesce((select is_test_account from profiles where id=e.user_id),false),'battleSeconds',l.battle_seconds,'status',e.status,'expiresAt',e.expires_at,'deadline',e.deadline,'serverNow',clock_timestamp(),
    'finalChance',final,'hearts',e.hearts,'bossHp',e.boss_hp,'shield',e.shield,'hints',e.hints,
    'worldTime',e.world_time,
    'courseEvents',coalesce((select jsonb_agg(v order by (v->>'at')::numeric) from jsonb_array_elements(e.course) v
      where (v->>'at')::numeric>e.world_time-.4 and (v->>'at')::numeric<=e.world_time+6),'[]'::jsonb),
    'nextWeaponAt',(select min((v->>'at')::numeric) from jsonb_array_elements(e.course) v
      where v->>'kind'='weapon' and (v->>'at')::numeric>e.world_time),
    'lastJump',e.last_jump,'cursor',e.cursor,'feedback',e.last_feedback,
    'reason',e.result_reason,'reward',e.reward,
    'question',case when q.id is not null then jsonb_build_object('id',q.id,'question',q.question,'options',q.options,
      'hint',case when e.hint_used then q.hint else null end) else null end);
end $$;

create or replace function public.boss_prepare_stage(p_class_id integer,p_chapter_id integer,p_lesson_id integer,p_level integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p profiles%rowtype; id_value uuid; completed jsonb; prev_chapter integer; prev_lesson integer; repeat_test boolean;
begin
  if not boss_internal_access(p_class_id,p_chapter_id,p_lesson_id) then return jsonb_build_object('enabled',false); end if;
  if p_level not between 0 and 9 then raise exception 'invalid_stage'; end if;
  select * into p from profiles where id=auth.uid();
  select l.test_only and l.test_repeat_enabled and coalesce(p.is_test_account,false) into repeat_test
    from boss_lessons l where l.class_id=p_class_id and l.chapter_id=p_chapter_id and l.lesson_id=p_lesson_id;
  if not repeat_test and boss_internal_complete(p.class_progress,p_chapter_id,p_lesson_id) then return jsonb_build_object('enabled',false); end if;
  if not exists(select 1 from lesson_questions where class_id=p_class_id and chapter_id=p_chapter_id
    and lesson_id=p_lesson_id and level=p_level and stage_type='lesson') then raise exception 'stage_missing'; end if;
  completed:=coalesce(p.class_progress->'6'->'completedLevels','[]'::jsonb);
  if not repeat_test and not (p_chapter_id=1 and p_lesson_id=1 and p_level=0)
    and not completed @> jsonb_build_array(p_chapter_id::text||'_review_0') then
    if p_level>0 then
      if not completed @> jsonb_build_array(p_chapter_id::text||'_'||p_lesson_id::text||'_'||(p_level-1)::text)
        then raise exception 'stage_locked'; end if;
    else
      prev_chapter:=case when p_lesson_id=4 then 1 when p_lesson_id=6 then 2 else p_chapter_id end;
      prev_lesson:=p_lesson_id-1;
      if not (completed @> jsonb_build_array(prev_chapter::text||'_'||prev_lesson::text||'_9')
        or completed @> jsonb_build_array(prev_chapter::text||'_review_0')
        or (p_lesson_id in (4,6) and completed @> jsonb_build_array(prev_chapter::text||'_99_1')))
        then raise exception 'stage_locked'; end if;
    end if;
  end if;
  insert into boss_stage_sessions(user_id,class_id,chapter_id,lesson_id,level)
    values(auth.uid(),p_class_id,p_chapter_id,p_lesson_id,p_level) returning id into id_value;
  return jsonb_build_object('enabled',true,'stageSessionId',id_value);
end $$;

create or replace function public.boss_finish_stage(p_stage_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s boss_stage_sessions%rowtype; p boss_lesson_progress%rowtype; e boss_encounters%rowtype;
  id_value uuid; chance numeric; repeat_test boolean;
begin
  select * into s from boss_stage_sessions where id=p_stage_session_id and user_id=auth.uid();
  if not found then raise exception 'stage_session_invalid'; end if;
  if not boss_internal_access(s.class_id,s.chapter_id,s.lesson_id) then return jsonb_build_object('enabled',false); end if;
  -- Legacy normal games still report their completion callback. No answer-perfect condition.
  -- This ticket is not a cryptographic proof of playing; live rollout requires the stage proof cutover.
  if s.started_at<clock_timestamp()-interval '2 hours' and s.completed_at is null then raise exception 'stage_session_expired'; end if;
  insert into boss_lesson_progress(user_id,class_id,chapter_id,lesson_id)
    values(s.user_id,s.class_id,s.chapter_id,s.lesson_id) on conflict do nothing;
  select * into p from boss_lesson_progress where user_id=s.user_id and class_id=s.class_id
    and chapter_id=s.chapter_id and lesson_id=s.lesson_id for update;
  select * into s from boss_stage_sessions where id=p_stage_session_id for update;
  select * into e from boss_encounters where user_id=s.user_id and class_id=s.class_id
    and chapter_id=s.chapter_id and lesson_id=s.lesson_id and status in ('offered','active') limit 1;
  if e.id is not null then perform boss_internal_sync(e.id); end if;
  if s.completed_at is not null then return jsonb_build_object('encounter',boss_internal_snapshot(s.encounter_id)); end if;
  update boss_stage_sessions set completed_at=clock_timestamp() where id=s.id;
  select * into p from boss_lesson_progress where user_id=s.user_id and class_id=s.class_id
    and chapter_id=s.chapter_id and lesson_id=s.lesson_id;
  select l.test_only and l.test_repeat_enabled and coalesce(u.is_test_account,false) into repeat_test
    from boss_lessons l join profiles u on u.id=s.user_id
    where l.class_id=s.class_id and l.chapter_id=s.chapter_id and l.lesson_id=s.lesson_id;
  if repeat_test then
    update boss_lesson_progress set status='eligible',final_stage_ended=false
      where user_id=s.user_id and class_id=s.class_id and chapter_id=s.chapter_id and lesson_id=s.lesson_id;
  end if;
  if not repeat_test and (p.status<>'eligible' or s.level=any(p.checked_levels)) then return jsonb_build_object('encounter',null); end if;
  if not repeat_test then
  update boss_lesson_progress set checked_levels=array_append(checked_levels,s.level),
    final_stage_ended=final_stage_ended or s.level=9 where user_id=p.user_id and class_id=p.class_id
    and chapter_id=p.chapter_id and lesson_id=p.lesson_id;
  end if;
  select * into e from boss_encounters where user_id=s.user_id and class_id=s.class_id
    and chapter_id=s.chapter_id and lesson_id=s.lesson_id and status in ('offered','active') limit 1;
  id_value:=e.id;
  if id_value is null then
    select encounter_chance into chance from boss_lessons where class_id=s.class_id and chapter_id=s.chapter_id and lesson_id=s.lesson_id;
    if repeat_test or random()<chance then
      insert into boss_encounters(user_id,class_id,chapter_id,lesson_id,source_level,expires_at)
        values(s.user_id,s.class_id,s.chapter_id,s.lesson_id,s.level,clock_timestamp()+interval '5 minutes') returning id into id_value;
    elsif s.level=9 then
      update boss_lesson_progress set status='missed' where user_id=p.user_id and class_id=p.class_id and chapter_id=p.chapter_id and lesson_id=p.lesson_id;
    end if;
  end if;
  update boss_stage_sessions set encounter_id=id_value where id=s.id;
  return jsonb_build_object('encounter',boss_internal_snapshot(id_value));
end $$;
revoke all on function public.boss_internal_snapshot(uuid) from public,anon,authenticated;
revoke all on function public.boss_prepare_stage(integer,integer,integer,integer),public.boss_finish_stage(uuid) from public,anon;
grant execute on function public.boss_prepare_stage(integer,integer,integer,integer),public.boss_finish_stage(uuid) to authenticated;
do $$ begin
 if (select count(*) from boss_lessons where class_id=6 and test_only and version='g6-boss-2026.1')<>10
   or exists(select 1 from boss_lessons l where l.class_id=6 and l.test_only and l.version='g6-boss-2026.1'
     and (select count(*) from boss_questions q where (q.class_id,q.chapter_id,q.lesson_id)=(l.class_id,l.chapter_id,l.lesson_id) and q.version=l.version)<15)
 then raise exception 'repeat_test_requires_10_complete_test_only_lessons'; end if;
end $$;
update boss_lessons set enabled=true,test_repeat_enabled=true,encounter_chance=.35,battle_seconds=480
where class_id=6 and test_only and version='g6-boss-2026.1';
commit;
-- Stop repeat testing without deleting any progress:
-- update boss_lessons set test_repeat_enabled=false where class_id=6;
