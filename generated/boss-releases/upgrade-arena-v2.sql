-- For databases that already applied the original Boss V2 migration.
-- Additive: no progress, rewards, flags or active encounters reset.
begin;
alter table public.boss_encounters add column if not exists course jsonb not null default '[]'::jsonb;
create or replace function public.boss_internal_sync(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare e boss_encounters%rowtype; n integer; t numeric; target numeric; hit boolean; kind text;
begin
  select * into e from boss_encounters where id=p_id for update;
  if not found then return; end if;
  if e.status='offered' and clock_timestamp()>=e.expires_at then
    update boss_encounters set status='expired',result_reason='offer_expired' where id=e.id;
    update boss_lesson_progress set status=case when final_stage_ended then 'missed' else status end
      where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
    return;
  end if;
  if e.status<>'active' then return; end if;
  if clock_timestamp()>=e.deadline then
    e.status:='failed'; e.result_reason:='time_expired';
  elsif e.pending_question is null then
    target:=e.world_time+greatest(0,extract(epoch from clock_timestamp()-e.last_tick));
    -- Preserve already-started legacy encounters during the additive upgrade.
    if jsonb_array_length(e.course)=0 then
      select jsonb_agg(jsonb_build_object('at',i*2,'kind',case
        when i%6=0 then 'weapon' when i%6=2 then 'obstacle' when i%6=4 then 'projectile'
        when i%18=1 then 'shield' when i%6=3 then 'hint' when i%12=5 then 'potion' else 'empty' end) order by i)
      into e.course from generate_series(1,240) i;
    end if;
    for n in (e.processed_events+1)..jsonb_array_length(e.course) loop
      t:=(e.course->(n-1)->>'at')::numeric;
      if t>target then exit; end if;
      e.processed_events:=n; kind:=e.course->(n-1)->>'kind';
      if kind in ('obstacle','projectile') then
        hit:=not (t-e.last_jump between 0 and 1.15);
        if hit then
          if e.shield then e.shield:=false; e.last_feedback:=jsonb_build_object('kind','shield_block');
          else e.hearts:=greatest(0,e.hearts-1); e.last_feedback:=jsonb_build_object('kind','hazard_hit'); end if;
        end if;
      elsif kind='shield' then e.shield:=true;
      elsif kind='hint' then e.hints:=least(3,e.hints+1);
      elsif kind='potion' then e.hearts:=least(3,e.hearts+1);
      elsif kind='weapon' then
        if e.cursor>=cardinality(e.question_ids) then
          e.status:='failed'; e.result_reason:='questions_exhausted';
        else e.pending_question:=e.question_ids[e.cursor+1]; e.hint_used:=false; end if;
        target:=t; exit;
      end if;
      if e.hearts=0 then e.status:='failed'; e.result_reason:='no_hearts'; target:=t; exit; end if;
    end loop;
    e.world_time:=target;
  end if;
  update boss_encounters set status=e.status,world_time=e.world_time,processed_events=e.processed_events,
    course=e.course,hearts=e.hearts,shield=e.shield,hints=e.hints,pending_question=e.pending_question,
    hint_used=e.hint_used,result_reason=e.result_reason,last_feedback=e.last_feedback,last_tick=clock_timestamp() where id=e.id;
  if e.status='failed' then
    update boss_lesson_progress set status=case when final_stage_ended then 'missed' else status end
      where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
  end if;
end $$;

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
    'title',l.title,'preview',l.test_only,'battleSeconds',l.battle_seconds,'status',e.status,'expiresAt',e.expires_at,'deadline',e.deadline,'serverNow',clock_timestamp(),
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

create or replace function public.boss_start_encounter(p_encounter_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e boss_encounters%rowtype; l boss_lessons%rowtype; ids text[]; course_value jsonb:='[]'::jsonb; i integer; roll numeric; kind text; next_weapon integer;
begin
  select * into e from boss_encounters where id=p_encounter_id and user_id=auth.uid();
  if not found or not boss_internal_access(e.class_id,e.chapter_id,e.lesson_id) then raise exception 'encounter_unavailable'; end if;
  perform 1 from boss_lesson_progress where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id for update;
  perform boss_internal_sync(e.id);
  select * into e from boss_encounters where id=e.id for update;
  if e.status='active' then return boss_internal_snapshot(e.id); end if;
  if e.status<>'offered' then return boss_internal_snapshot(e.id); end if;
  select * into l from boss_lessons where class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
  select array_agg(id) into ids from (select id from boss_questions where class_id=e.class_id
    and chapter_id=e.chapter_id and lesson_id=e.lesson_id and version=l.version order by random()) q;
  if coalesce(cardinality(ids),0)<15 then raise exception 'boss_content_incomplete'; end if;
  -- One event every 1.5 seconds: ~3-5 hazards per weapon interval, versus 2 before.
  -- Non-weapon slots: 60% hazard, 12% hint, 12% potion, 10% shield, 6% empty.
  -- Weapons arrive at random 9-15 second intervals, preventing excessive pickup droughts.
  next_weapon:=6+floor(random()*5)::integer;
  for i in 1..ceil(l.battle_seconds/1.5)::integer loop
    roll:=random();
    kind:=case when i=next_weapon then 'weapon' when roll<.30 then 'obstacle'
      when roll<.60 then 'projectile' when roll<.72 then 'hint'
      when roll<.84 then 'potion' when roll<.94 then 'shield' else 'empty' end;
    course_value:=course_value||jsonb_build_array(jsonb_build_object('at',i*1.5,'kind',kind));
    if i=next_weapon then next_weapon:=i+6+floor(random()*5)::integer; end if;
  end loop;
  update boss_encounters set course=course_value,status='active',started_at=clock_timestamp(),last_tick=clock_timestamp(),
    deadline=clock_timestamp()+make_interval(secs=>l.battle_seconds),question_ids=ids where id=e.id;
  return boss_internal_snapshot(e.id);
end $$;
revoke all on function public.boss_internal_sync(uuid),public.boss_internal_snapshot(uuid) from public,anon,authenticated;
revoke all on function public.boss_start_encounter(uuid) from public,anon;
grant execute on function public.boss_start_encounter(uuid) to authenticated;
commit;
