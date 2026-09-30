-- Boss V2, additive migration. OFF by default. No old progress or rewards modified.
-- Requires profiles, lesson_questions, reward_ledger, level_from_xp from inspected DB.
begin;

create table if not exists public.boss_lessons (
  class_id integer not null check(class_id=6), chapter_id integer not null,
  lesson_id integer not null, title text not null, version text not null,
  enabled boolean not null default false, reviewed boolean not null default false,
  test_only boolean not null default true, security_ready boolean not null default false,
  encounter_chance numeric not null default .35 check(encounter_chance between 0 and 1),
  battle_seconds integer not null default 480 check(battle_seconds between 180 and 1200),
  primary key(class_id,chapter_id,lesson_id)
);
create table if not exists public.boss_questions (
  id text primary key, class_id integer not null, chapter_id integer not null, lesson_id integer not null,
  question text not null, options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options)>=2),
  correct_answer integer not null check(correct_answer>=0), hint text not null, explanation text not null,
  version text not null,
  foreign key(class_id,chapter_id,lesson_id) references public.boss_lessons,
  check(correct_answer<jsonb_array_length(options))
);
create table if not exists public.boss_lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id integer not null, chapter_id integer not null, lesson_id integer not null,
  status text not null default 'eligible' check(status in ('eligible','won','missed')),
  checked_levels integer[] not null default '{}', final_stage_ended boolean not null default false,
  primary key(user_id,class_id,chapter_id,lesson_id),
  foreign key(class_id,chapter_id,lesson_id) references public.boss_lessons
);
create table if not exists public.boss_stage_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  class_id integer not null, chapter_id integer not null, lesson_id integer not null,
  level integer not null check(level between 0 and 9), started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz, encounter_id uuid,
  foreign key(class_id,chapter_id,lesson_id) references public.boss_lessons
);
create table if not exists public.boss_encounters (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  class_id integer not null, chapter_id integer not null, lesson_id integer not null,
  source_level integer not null check(source_level between 0 and 9),
  detected_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null,
  status text not null default 'offered' check(status in ('offered','active','won','failed','expired')),
  started_at timestamptz, deadline timestamptz, last_tick timestamptz,
  world_time numeric not null default 0, processed_events integer not null default 0,
  last_jump numeric not null default -100, hearts integer not null default 3 check(hearts between 0 and 3),
  boss_hp integer not null default 100 check(boss_hp between 0 and 100), shield boolean not null default false,
  hints integer not null default 0 check(hints between 0 and 3), question_ids text[] not null default '{}',
  cursor integer not null default 0, pending_question text, hint_used boolean not null default false,
  last_feedback jsonb, result_reason text, reward jsonb,
  foreign key(user_id,class_id,chapter_id,lesson_id) references public.boss_lesson_progress
);
create unique index if not exists boss_one_live_encounter on public.boss_encounters
  (user_id,class_id,chapter_id,lesson_id) where status in ('offered','active');
create index if not exists boss_session_user on public.boss_stage_sessions(user_id,started_at);
create table if not exists public.boss_answer_events (
  encounter_id uuid not null references public.boss_encounters(id) on delete cascade,
  question_id text not null references public.boss_questions(id), selected integer not null,
  correct boolean not null, answered_at timestamptz not null default clock_timestamp(),
  primary key(encounter_id,question_id)
);

-- Private data is reachable only through the explicitly granted RPCs below.
alter table public.boss_lessons enable row level security;
alter table public.boss_questions enable row level security;
alter table public.boss_lesson_progress enable row level security;
alter table public.boss_stage_sessions enable row level security;
alter table public.boss_encounters enable row level security;
alter table public.boss_answer_events enable row level security;
revoke all on public.boss_lessons,public.boss_questions,public.boss_lesson_progress,
  public.boss_stage_sessions,public.boss_encounters,public.boss_answer_events from public,anon,authenticated;

create or replace function public.boss_internal_access(p_class integer,p_chapter integer,p_lesson integer)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from boss_lessons l join profiles p on p.id=auth.uid()
    where l.class_id=p_class and l.chapter_id=p_chapter and l.lesson_id=p_lesson
      and p.role='student' and not coalesce(p.is_locked,false) and l.enabled and (l.reviewed or l.test_only)
      and ((l.test_only and coalesce(p.is_test_account,false)) or (not l.test_only and l.security_ready)))
$$;

create or replace function public.boss_internal_complete(p_progress jsonb,p_chapter integer,p_lesson integer)
returns boolean language sql immutable as $$
  select coalesce(p_progress->'6'->'completedLevels','[]'::jsonb) @> jsonb_build_array(p_chapter::text||'_review_0')
    or not exists(select 1 from generate_series(0,9) n where not
      coalesce(p_progress->'6'->'completedLevels','[]'::jsonb) @>
      jsonb_build_array(p_chapter::text||'_'||p_lesson::text||'_'||n::text))
$$;

-- Persist a server-generated course. Existing active courses retain their legacy timing.
alter table public.boss_encounters add column if not exists course jsonb not null default '[]'::jsonb;

alter table public.boss_lessons add column if not exists test_repeat_enabled boolean not null default false;

-- Lock the per-lesson record BEFORE the encounter in every state-changing RPC.
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

create or replace function public.boss_get_encounter(p_class_id integer,p_chapter_id integer,p_lesson_id integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare id_value uuid;
begin
  if not boss_internal_access(p_class_id,p_chapter_id,p_lesson_id) then return jsonb_build_object('enabled',false); end if;
  perform 1 from boss_lesson_progress where user_id=auth.uid() and class_id=p_class_id
    and chapter_id=p_chapter_id and lesson_id=p_lesson_id for update;
  select id into id_value from boss_encounters where user_id=auth.uid() and class_id=p_class_id
    and chapter_id=p_chapter_id and lesson_id=p_lesson_id order by detected_at desc limit 1;
  if id_value is not null then perform boss_internal_sync(id_value); end if;
  return jsonb_build_object('enabled',true,'encounter',boss_internal_snapshot(id_value));
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

create or replace function public.boss_action(p_encounter_id uuid,p_action text,p_question_id text default null,p_answer integer default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e boss_encounters%rowtype; q boss_questions%rowtype; correct boolean; l boss_lessons%rowtype; awarded boolean:=false;
begin
  select * into e from boss_encounters where id=p_encounter_id and user_id=auth.uid();
  if not found or not boss_internal_access(e.class_id,e.chapter_id,e.lesson_id) then raise exception 'encounter_unavailable'; end if;
  perform 1 from boss_lesson_progress where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id for update;
  perform boss_internal_sync(e.id);
  select * into e from boss_encounters where id=e.id for update;
  if e.status<>'active' then return boss_internal_snapshot(e.id); end if;
  if p_action='jump' and e.pending_question is null then
    if e.world_time-e.last_jump>=1.3 then update boss_encounters set last_jump=e.world_time where id=e.id; end if;
  elsif p_action='hint' and e.pending_question=p_question_id and not e.hint_used and e.hints>0 then
    update boss_encounters set hints=hints-1,hint_used=true where id=e.id;
  elsif p_action='answer' then
    if e.pending_question is distinct from p_question_id or p_answer is null then return boss_internal_snapshot(e.id); end if;
    select * into q from boss_questions where id=e.pending_question;
    if p_answer<0 or p_answer>=jsonb_array_length(q.options) then raise exception 'invalid_answer'; end if;
    correct:=q.correct_answer=p_answer;
    insert into boss_answer_events(encounter_id,question_id,selected,correct) values(e.id,q.id,p_answer,correct) on conflict do nothing;
    if not found then return boss_internal_snapshot(e.id); end if;
    e.cursor:=e.cursor+1;
    if correct then e.boss_hp:=greatest(0,e.boss_hp-10); else e.hearts:=greatest(0,e.hearts-1); end if;
    if e.boss_hp=0 and e.hearts>0 then
      e.status:='won'; e.result_reason:='boss_defeated';
      select * into l from boss_lessons where class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
      if not l.test_only then
        insert into reward_ledger(user_id,event_type,event_key,xp_gain,coin_gain)
          values(e.user_id,'boss',e.class_id::text||':'||e.chapter_id::text||':'||e.lesson_id::text,1000,500) on conflict do nothing;
        awarded:=found;
        if awarded then update profiles set xp=coalesce(xp,0)+1000,coins=coalesce(coins,0)+500,
          level=level_from_xp(coalesce(xp,0)+1000),bosses_defeated=coalesce(bosses_defeated,0)+1,updated_at=clock_timestamp() where id=e.user_id; end if;
      end if;
      e.reward:=jsonb_build_object('awarded',awarded,'preview',l.test_only,'xp',case when awarded then 1000 else 0 end,'coins',case when awarded then 500 else 0 end);
      update boss_lesson_progress set status='won' where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
    elsif e.hearts=0 or e.cursor>=cardinality(e.question_ids) then
      e.status:='failed'; e.result_reason:=case when e.hearts=0 then 'no_hearts' else 'questions_exhausted' end;
      update boss_lesson_progress set status=case when final_stage_ended then 'missed' else status end
        where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
    end if;
    update boss_encounters set status=e.status,hearts=e.hearts,boss_hp=e.boss_hp,cursor=e.cursor,pending_question=null,
      hint_used=false,last_tick=clock_timestamp(),result_reason=e.result_reason,reward=e.reward,
      last_feedback=jsonb_build_object('kind',case when correct then 'correct' else 'wrong' end,
        'questionId',q.id,'explanation',q.explanation,'correctAnswer',q.correct_answer) where id=e.id;
  elsif p_action='abandon' then
    update boss_encounters set status='failed',result_reason='abandoned' where id=e.id;
    update boss_lesson_progress set status=case when final_stage_ended then 'missed' else status end
      where user_id=e.user_id and class_id=e.class_id and chapter_id=e.chapter_id and lesson_id=e.lesson_id;
  elsif p_action<>'tick' then
    if p_action not in ('hint','jump') then raise exception 'invalid_action'; end if;
  end if;
  return boss_internal_snapshot(e.id);
end $$;

create or replace function public.boss_list_encounters()
returns jsonb language plpgsql security definer set search_path=public as $$
declare e record; result jsonb:='[]'::jsonb;
begin
  for e in select id,class_id,chapter_id,lesson_id from boss_encounters
    where user_id=auth.uid() and status in ('offered','active') order by detected_at loop
    if boss_internal_access(e.class_id,e.chapter_id,e.lesson_id) then
      perform 1 from boss_lesson_progress where user_id=auth.uid() and class_id=e.class_id
        and chapter_id=e.chapter_id and lesson_id=e.lesson_id for update;
      perform boss_internal_sync(e.id);
      if exists(select 1 from boss_encounters where id=e.id and status in ('offered','active')) then
        result:=result||jsonb_build_array(boss_internal_snapshot(e.id));
      end if;
    end if;
  end loop;
  return result;
end $$;

revoke all on function public.boss_list_encounters() from public,anon,authenticated;
grant execute on function public.boss_list_encounters() to authenticated;
revoke all on function public.boss_internal_access(integer,integer,integer),
  public.boss_internal_complete(jsonb,integer,integer),public.boss_internal_sync(uuid),public.boss_internal_snapshot(uuid)
  from public,anon,authenticated;
revoke all on function public.boss_prepare_stage(integer,integer,integer,integer),public.boss_finish_stage(uuid),
  public.boss_get_encounter(integer,integer,integer),public.boss_start_encounter(uuid),public.boss_action(uuid,text,text,integer)
  from public,anon,authenticated;
grant execute on function public.boss_prepare_stage(integer,integer,integer,integer),public.boss_finish_stage(uuid),
  public.boss_get_encounter(integer,integer,integer),public.boss_start_encounter(uuid),public.boss_action(uuid,text,text,integer)
  to authenticated;
commit;
