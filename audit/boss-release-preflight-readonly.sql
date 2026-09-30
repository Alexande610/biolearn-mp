-- Read-only release inspection. Run in Supabase SQL Editor and return its result.
-- No personal learner rows or environment credentials are returned.
select jsonb_build_object(
  'lessons',(select jsonb_agg(to_jsonb(t)) from (
    select l.class_id,l.chapter_id,l.lesson_id,l.enabled,l.reviewed,l.test_only,l.security_ready,
      l.encounter_chance,l.battle_seconds,count(q.id) question_count
    from public.boss_lessons l left join public.boss_questions q
      on (q.class_id,q.chapter_id,q.lesson_id)=(l.class_id,l.chapter_id,l.lesson_id)
    group by l.class_id,l.chapter_id,l.lesson_id order by l.chapter_id,l.lesson_id
  ) t),
  'profile_update_privileges',(select jsonb_agg(jsonb_build_object('column',c,
    'authenticated_can_update',has_column_privilege('authenticated','public.profiles',c,'UPDATE')))
    from unnest(array['xp','coins','level','bosses_defeated','class_progress']) c),
  'profile_triggers',(select jsonb_agg(jsonb_build_object('trigger',pg_get_triggerdef(t.oid),
    'function',pg_get_functiondef(t.tgfoid))) from pg_trigger t
    where t.tgrelid='public.profiles'::regclass and not t.tgisinternal),
  'reward_functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid)))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
      and p.proname in ('claim_map_reward','boss_v2_claim_map_reward_legacy','boss_prepare_stage','boss_finish_stage')),
  'private_legacy_callable',case when to_regprocedure('public.boss_v2_claim_map_reward_legacy(text,integer,text)') is null
    then null else has_function_privilege('authenticated','public.boss_v2_claim_map_reward_legacy(text,integer,text)','EXECUTE') end
) as boss_release_preflight;
