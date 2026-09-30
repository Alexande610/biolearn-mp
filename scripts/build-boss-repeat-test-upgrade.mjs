import fs from 'node:fs';
const path='supabase_boss_battle_v2.sql';
let sql=fs.readFileSync(path,'utf8');
if(!sql.includes('add column if not exists test_repeat_enabled')){
 sql=sql.replace('-- Lock the per-lesson record',`alter table public.boss_lessons add column if not exists test_repeat_enabled boolean not null default false;

-- Lock the per-lesson record`);
 sql=sql.replace("'title',l.title,'preview',l.test_only,",`'title',l.title,'preview',l.test_only,
    'repeatTest',l.test_only and l.test_repeat_enabled and coalesce((select is_test_account from profiles where id=e.user_id),false),`);
 sql=sql.replace('prev_lesson integer;','prev_lesson integer; repeat_test boolean;');
 sql=sql.replace('  if boss_internal_complete(p.class_progress,p_chapter_id,p_lesson_id) then',`  select l.test_only and l.test_repeat_enabled and coalesce(p.is_test_account,false) into repeat_test
    from boss_lessons l where l.class_id=p_class_id and l.chapter_id=p_chapter_id and l.lesson_id=p_lesson_id;
  if not repeat_test and boss_internal_complete(p.class_progress,p_chapter_id,p_lesson_id) then`);
 sql=sql.replace('  if not (p_chapter_id=1 and p_lesson_id=1 and p_level=0)', '  if not repeat_test and not (p_chapter_id=1 and p_lesson_id=1 and p_level=0)');
 sql=sql.replace('id_value uuid; chance numeric;','id_value uuid; chance numeric; repeat_test boolean;');
 sql=sql.replace("  if p.status<>'eligible' or s.level=any(p.checked_levels) then",`  select l.test_only and l.test_repeat_enabled and coalesce(u.is_test_account,false) into repeat_test
    from boss_lessons l join profiles u on u.id=s.user_id
    where l.class_id=s.class_id and l.chapter_id=s.chapter_id and l.lesson_id=s.lesson_id;
  if repeat_test then
    update boss_lesson_progress set status='eligible',final_stage_ended=false
      where user_id=s.user_id and class_id=s.class_id and chapter_id=s.chapter_id and lesson_id=s.lesson_id;
  end if;
  if not repeat_test and (p.status<>'eligible' or s.level=any(p.checked_levels)) then`);
 sql=sql.replace('  update boss_lesson_progress set checked_levels=array_append(checked_levels,s.level),', '  if not repeat_test then\n  update boss_lesson_progress set checked_levels=array_append(checked_levels,s.level),');
 sql=sql.replace('    and chapter_id=p.chapter_id and lesson_id=p.lesson_id;\n  select * into e from boss_encounters', '    and chapter_id=p.chapter_id and lesson_id=p.lesson_id;\n  end if;\n  select * into e from boss_encounters');
 sql=sql.replace('    if random()<chance then','    if repeat_test or random()<chance then');
 fs.writeFileSync(path,sql);
}
const parts=['boss_internal_snapshot','boss_prepare_stage','boss_finish_stage'].map(name=>{
 const begin=sql.indexOf(`create or replace function public.${name}(`);const end=sql.indexOf('end $$;',begin)+7;
 if(begin<0||end<7)throw Error(name);return sql.slice(begin,end);
});
fs.writeFileSync('generated/boss-releases/repeat-test-grade6.sql',`-- Existing Boss V2 databases: repeatable encounters exclusively for test-only lessons and test accounts.
-- Never grants real XP/coins. Normal student/live rules remain unchanged.
begin;
alter table public.boss_lessons add column if not exists test_repeat_enabled boolean not null default false;
${parts.join('\n\n')}
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
`);
