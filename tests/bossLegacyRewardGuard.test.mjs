import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await fs.readFile('generated/boss-releases/guard-legacy-boss-rewards.sql','utf8');
test('legacy boss guard blocks old codes and direct alias access while preserving normal and skip',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function public.claim_map_reward(p_event_key text,p_class_id integer,p_reward_code text) returns jsonb
    language sql security definer as $$select jsonb_build_object('key',p_event_key,'class',p_class_id,'code',p_reward_code)$$;
    grant usage on schema public,auth to authenticated;`);
  await db.exec(migration);await db.exec(migration);
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);`);
  for(const code of ['normal','skip']){
   const {rows}=await db.query('select claim_map_reward($1,6,$2) result',['original-key',code]);
   assert.deepEqual(rows[0].result,{key:'original-key',class:6,code});
  }
  for(const code of ['boss_1','boss_2','boss_3','boss_v2',null])
    await assert.rejects(db.query('select claim_map_reward($1,6,$2)',['fake-key',code]),/legacy_boss_reward_disabled/);
  await assert.rejects(db.query("select boss_v2_claim_map_reward_legacy('fake',6,'boss_1')"),/permission denied/);
 }finally{await db.close();}
});
