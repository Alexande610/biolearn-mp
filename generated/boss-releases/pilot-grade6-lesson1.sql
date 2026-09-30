-- Optional pilot, AFTER supabase_boss_battle_v2.sql and the draft content seed.
-- Test-account access only. Does not grant real XP/coins or mark content reviewed.
begin;
do $$ begin
  if (select count(*) from public.boss_questions where class_id=6 and chapter_id=1
      and lesson_id=1 and version='g6-boss-2026.1') < 15 then
    raise exception 'boss_content_incomplete';
  end if;
end $$;
update public.boss_lessons set enabled=true,test_only=true,security_ready=false,
  encounter_chance=.35,battle_seconds=480
where class_id=6 and chapter_id=1 and lesson_id=1 and version='g6-boss-2026.1';
commit;
-- To pause this pilot without deleting sessions or progress:
-- update public.boss_lessons set enabled=false where class_id=6 and chapter_id=1 and lesson_id=1;
