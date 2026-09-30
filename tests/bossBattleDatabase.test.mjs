import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const migration=await fs.readFile('supabase_boss_battle_v2.sql','utf8');
const seed=await fs.readFile('generated/boss-releases/g6-boss-2026.1-draft.sql','utf8');
const arenaUpgrade=await fs.readFile('generated/boss-releases/upgrade-arena-v2.sql','utf8');
const student='00000000-0000-4000-8000-000000000002';
const other='00000000-0000-4000-8000-000000000003';
async function setup() {
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table profiles(id uuid primary key,role text,is_locked boolean default false,is_test_account boolean default false,
 class_progress jsonb default '{}',xp int default 0,coins int default 0,level int default 1,bosses_defeated int default 0,updated_at timestamptz);
 create table lesson_questions(class_id int,chapter_id int,lesson_id int,level int,stage_type text);
 create table reward_ledger(user_id uuid,event_type text,event_key text,xp_gain int,coin_gain int,
 unique(user_id,event_type,event_key));
 create function level_from_xp(int) returns int language sql as $$ select 1+$1/1000 $$;
 insert into profiles(id,role,is_test_account) values('${student}','student',true),('${other}','student',false);
 insert into lesson_questions select 6,1,1,n,'lesson' from generate_series(0,9)n;
 grant usage on schema public,auth to authenticated;`);
 await db.exec(migration); await db.exec(seed);
 await db.exec(`select set_config('request.jwt.claim.sub','${student}',false)`);
 return db;
}
const rpc=async(db,sql,args=[]) => (await db.query(sql,args)).rows[0].result;
async function offer(db,level=0) {
 await db.exec(`update boss_lessons set enabled=true,reviewed=true,encounter_chance=1;
 update profiles set class_progress='{"6":{"completedLevels":["1_1_0","1_1_1","1_1_2","1_1_3","1_1_4","1_1_5","1_1_6","1_1_7","1_1_8"]}}' where id='${student}';`);
 const ticket=await rpc(db,'select boss_prepare_stage(6,1,1,$1) result',[level]);
 await db.query(`update boss_stage_sessions set started_at=clock_timestamp()-interval '11 seconds' where id=$1`,[ticket.stageSessionId]);
 const result=await rpc(db,'select boss_finish_stage($1) result',[ticket.stageSessionId]);
 return {ticket,encounter:result.encounter};
}
async function weapon(db,id) {
 // Advance only the fixture to the next weapon event; production uses server time.
 const next=(await db.query(`select (v->>'at')::numeric t,n::integer n from boss_encounters e,
 jsonb_array_elements(e.course) with ordinality as c(v,n)
 where e.id=$1 and n>e.processed_events and v->>'kind'='weapon' order by n limit 1`,[id])).rows[0];
 await db.query(`update boss_encounters set world_time=$2,processed_events=$3,
 last_tick=clock_timestamp()-interval '.2 seconds' where id=$1`,[id,Number(next.t)-.1,next.n-1]);
 return rpc(db,"select boss_action($1,'tick') result",[id]);
}

test('additive migration and draft seed are rerunnable and default OFF',async()=>{
 const db=await setup(); try {
  await db.exec(migration);await db.exec(seed);
  assert.equal((await db.query('select count(*) n from boss_questions')).rows[0].n,150);
  assert.equal((await db.query('select count(*) n from boss_lessons where enabled')).rows[0].n,0);
  assert.equal((await rpc(db,'select boss_prepare_stage(6,1,1,0) result')).enabled,false);
 }finally{await db.close();}
});
test('single offer, five-minute expiry and no repeated draw for a completed stage',async()=>{
 const db=await setup();try{
  const {ticket,encounter}=await offer(db);
  assert.equal(Math.round((Date.parse(encounter.expiresAt)-Date.parse(encounter.serverNow))/1000),300);
  const again=await rpc(db,'select boss_finish_stage($1) result',[ticket.stageSessionId]);
  assert.equal(again.encounter.id,encounter.id);
  await db.query(`update boss_encounters set expires_at=clock_timestamp()-interval '1 second' where id=$1`,[encounter.id]);
  assert.equal((await rpc(db,'select boss_start_encounter($1) result',[encounter.id])).status,'expired');
  const ticket2=await rpc(db,'select boss_prepare_stage(6,1,1,0) result');
  await db.query(`update boss_stage_sessions set started_at=clock_timestamp()-interval '11 seconds' where id=$1`,[ticket2.stageSessionId]);
  assert.equal((await rpc(db,'select boss_finish_stage($1) result',[ticket2.stageSessionId])).encounter,null);
 }finally{await db.close();}
});
test('a legitimate fast completion is not blocked by an arbitrary minimum duration',async()=>{
 const db=await setup();try{
  await db.exec('update boss_lessons set enabled=true,encounter_chance=1');
  const ticket=await rpc(db,'select boss_prepare_stage(6,1,1,0) result');
  assert.equal((await rpc(db,'select boss_finish_stage($1) result',[ticket.stageSessionId])).encounter.status,'offered');
 }finally{await db.close();}
});
test('wrong answers bypass shield; duplicate answer cannot remove a second heart',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db); await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  const view=await weapon(db,encounter.id);
  assert.ok(view.question);assert.equal(view.question.correctAnswer,undefined);
  await db.query('update boss_encounters set shield=true where id=$1',[encounter.id]);
  const correct=(await db.query('select correct_answer from boss_questions where id=$1',[view.question.id])).rows[0].correct_answer;
  const wrong=(correct+1)%3;
  const result=await rpc(db,"select boss_action($1,'answer',$2,$3) result",[encounter.id,view.question.id,wrong]);
  assert.equal(result.hearts,2);assert.equal(result.shield,true);assert.equal(result.bossHp,100);
  assert.equal((await rpc(db,"select boss_action($1,'answer',$2,$3) result",[encounter.id,view.question.id,wrong])).hearts,2);
 }finally{await db.close();}
});
test('ten correct hits produce one atomic live reward and never alter normal progress',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db);
  await db.exec('update boss_lessons set test_only=false,security_ready=true');
  const before=(await db.query('select class_progress from profiles where id=$1',[student])).rows[0].class_progress;
  await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  let result;
  for(let n=0;n<10;n++){
   const view=await weapon(db,encounter.id);
   const a=(await db.query('select correct_answer from boss_questions where id=$1',[view.question.id])).rows[0].correct_answer;
   result=await rpc(db,"select boss_action($1,'answer',$2,$3) result",[encounter.id,view.question.id,a]);
   assert.equal(result.bossHp,100-(n+1)*10);
  }
  assert.equal(result.status,'won');assert.equal(result.reward.awarded,true);
  await rpc(db,"select boss_action($1,'tick') result",[encounter.id]);
  const p=(await db.query('select xp,coins,bosses_defeated,class_progress from profiles where id=$1',[student])).rows[0];
  assert.equal(p.xp,1000);assert.equal(p.coins,500);assert.equal(p.bosses_defeated,1);assert.deepEqual(p.class_progress,before);
  assert.equal((await db.query('select count(*) n from reward_ledger')).rows[0].n,1);
 }finally{await db.close();}
});
test('final chance loss closes the lesson, early loss can reappear at a different stage',async()=>{
 for(const level of [0,9]){
  const db=await setup();try{
   const {encounter}=await offer(db,level);await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
   await rpc(db,"select boss_action($1,'abandon') result",[encounter.id]);
   const p=(await db.query('select status from boss_lesson_progress')).rows[0];
   assert.equal(p.status,level===9?'missed':'eligible');
   if(level===0){const next=await offer(db,1);assert.ok(next.encounter);assert.notEqual(next.encounter.id,encounter.id);}
  }finally{await db.close();}
 }
});
test('server hazards consume shield, potion caps at three, battle timeout loses without rewards',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db);await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  await db.query(`update boss_encounters set course='[{"at":2,"kind":"shield"},{"at":4,"kind":"obstacle"},{"at":10,"kind":"potion"}]',last_tick=clock_timestamp()-interval '4.1 seconds' where id=$1`,[encounter.id]);
  const hit=await rpc(db,"select boss_action($1,'tick') result",[encounter.id]);
  assert.equal(hit.hearts,3);assert.equal(hit.shield,false);
  await db.query(`update boss_encounters set world_time=8,processed_events=2,last_tick=clock_timestamp()-interval '2.1 seconds' where id=$1`,[encounter.id]);
  assert.equal((await rpc(db,"select boss_action($1,'tick') result",[encounter.id])).hearts,3);
  await db.query(`update boss_encounters set deadline=clock_timestamp()-interval '1 second' where id=$1`,[encounter.id]);
  assert.equal((await rpc(db,"select boss_action($1,'tick') result",[encounter.id])).status,'failed');
  assert.equal((await db.query('select count(*) n from reward_ledger')).rows[0].n,0);
 }finally{await db.close();}
});
test('RLS denies direct private reads/writes and other users cannot act on the encounter',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${other}',false)`);
  await assert.rejects(db.query('select * from boss_questions'),/permission denied/);
  await assert.rejects(db.query("update boss_encounters set boss_hp=0"),/permission denied/);
  await assert.rejects(db.query('select boss_start_encounter($1)',[encounter.id]),/encounter_unavailable/);
 }finally{await db.close();}
});
test('preview mode never grants real currency and completed old lessons cannot obtain tickets',async()=>{
 const db=await setup();try{
  await db.exec("update boss_lessons set enabled=true,reviewed=true; update profiles set class_progress='{\"6\":{\"completedLevels\":[\"1_review_0\"]}}'");
  assert.equal((await rpc(db,'select boss_prepare_stage(6,1,1,0) result')).enabled,false);
  const {encounter}=await offer(db);
  await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  let result;
  for(let n=0;n<10;n++){
   const v=await weapon(db,encounter.id);const a=(await db.query('select correct_answer from boss_questions where id=$1',[v.question.id])).rows[0].correct_answer;
   result=await rpc(db,"select boss_action($1,'answer',$2,$3) result",[encounter.id,v.question.id,a]);
  }
  assert.equal(result.reward.preview,true);assert.equal(result.reward.awarded,false);
  assert.equal((await db.query('select count(*) n from reward_ledger')).rows[0].n,0);
 }finally{await db.close();}
});

test('random course is persisted, denser, shared with rendering and not rerolled by reload or start',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db);const first=await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  const course=(await db.query('select course from boss_encounters where id=$1',[encounter.id])).rows[0].course;
  assert.equal(course.length,320);assert.ok(first.nextWeaponAt>=9&&first.nextWeaponAt<=15);
  assert.deepEqual(first.courseEvents,course.slice(0,4));
  const allowed=new Set(['obstacle','projectile','hint','potion','shield','empty','weapon']);
  course.forEach((event,i)=>{assert.equal(event.at,(i+1)*1.5);assert.ok(allowed.has(event.kind));});
  let previousWeapon=0;
  course.filter(e=>e.kind==='weapon').forEach(e=>{assert.ok(e.at-previousWeapon>=9&&e.at-previousWeapon<=15);previousWeapon=e.at;});
  const again=await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  assert.equal(again.deadline,first.deadline);
  await rpc(db,'select boss_get_encounter(6,1,1) result');
  assert.deepEqual((await db.query('select course from boss_encounters where id=$1',[encounter.id])).rows[0].course,course);
  await rpc(db,"select boss_action($1,'abandon') result",[encounter.id]);
  const second=await offer(db,1);await rpc(db,'select boss_start_encounter($1) result',[second.encounter.id]);
  const next=(await db.query('select course from boss_encounters where id=$1',[second.encounter.id])).rows[0].course;
  assert.notDeepEqual(next,course);
 }finally{await db.close();}
});

test('additive arena upgrade is rerunnable and preserves active course, deadline, flags and progress',async()=>{
 const db=await setup();try{
  const {encounter}=await offer(db);await rpc(db,'select boss_start_encounter($1) result',[encounter.id]);
  const before=(await db.query('select course,deadline,hearts from boss_encounters where id=$1',[encounter.id])).rows[0];
  const progress=(await db.query('select * from boss_lesson_progress')).rows;
  await db.exec(arenaUpgrade);await db.exec(arenaUpgrade);
  assert.deepEqual((await db.query('select course,deadline,hearts from boss_encounters where id=$1',[encounter.id])).rows[0],before);
  assert.deepEqual((await db.query('select * from boss_lesson_progress')).rows,progress);
  assert.equal((await db.query('select security_ready from boss_lessons limit 1')).rows[0].security_ready,false);
  // Simulate a running encounter created by the original schema: preserve its old 2s schedule.
  await db.query("update boss_encounters set course='[]',world_time=4,processed_events=2,last_tick=clock_timestamp() where id=$1",[encounter.id]);
  const old=await rpc(db,"select boss_action($1,'tick') result",[encounter.id]);
  assert.equal(old.nextWeaponAt,12);assert.deepEqual(old.courseEvents.map(e=>e.kind),['obstacle','hint','projectile','potion']);
 }finally{await db.close();}
});
