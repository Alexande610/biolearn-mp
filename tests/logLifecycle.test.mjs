import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const student = '00000000-0000-4000-8000-000000000002';
const teacher = '00000000-0000-4000-8000-000000000003';
const migration = await fs.readFile('supabase_log_lifecycle_upgrade.sql','utf8');
const oldMigration = await fs.readFile('supabase_observability_upgrade.sql','utf8');
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.profiles(id uuid primary key,role text);
    insert into public.profiles values('${admin}','admin'),('${student}','student'),('${teacher}','teacher');
    create table public.system_logs(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),action text not null,details jsonb default '{}',created_at timestamptz default now());
    grant usage on schema public,auth to authenticated,anon;
    grant select,update on profiles to authenticated;
    grant all on system_logs to authenticated,anon;`);
  await db.exec(oldMigration);
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);`);
  return db;
}
async function report(db, version='release-1', env='development', severity='error', message='example') {
  const { rows } = await db.query("select public.report_client_error($1,'test_error',$2,$3::jsonb,'/admin',$4) as result",
    [severity,message,JSON.stringify({environment:env,stack:'test user@example.org Bearer fake-token'}),version]);
  assert.equal(rows[0].result.accepted,true);
  return rows[0].result;
}
async function issue(db) { return (await db.query('select * from public.system_issues order by last_seen_at desc')).rows[0]; }
async function resolve(db, current, version='release-2') {
  return db.query("select public.set_system_issue_status($1,$2,'resolved','Đã sửa và kiểm tra lại',$3,'Kiểm thử tái hiện và hồi quy đều đạt')",[current.id,current.revision,version]);
}

test('migration backfills without deleting logs, is rerunnable, and counts UPSERT exactly once', async () => {
  const db=await setup();
  try {
    await report(db,'dev');
    await db.exec(migration);
    const first=await issue(db);
    assert.equal(Number(first.occurrence_count),1);
    await db.exec(migration);
    assert.equal(Number((await issue(db)).occurrence_count),1);
    await report(db,'dev');
    const rows=(await db.query('select occurrence_count,issue_id,details from system_logs')).rows;
    assert.equal(rows.length,1);
    assert.equal(rows[0].occurrence_count,2);
    assert.equal(Number((await issue(db)).occurrence_count),2);
    assert.equal(rows[0].issue_id,first.id);
    assert.ok(!JSON.stringify(rows[0].details).includes('user@example.org'));
    assert.ok(!JSON.stringify(rows[0].details).includes('fake-token'));
  } finally { await db.close(); }
});

test('resolution requires evidence, rejects stale revision, audits and classifies recurrence',async () => {
  const db=await setup();
  try {
    await db.exec(migration); await report(db);
    const initial=await issue(db);
    await assert.rejects(db.query("select set_system_issue_status($1,$2,'resolved','fixed','dev','')",[initial.id,initial.revision]),/verification_required/);
    await report(db);
    await assert.rejects(resolve(db,initial),/issue_changed_refresh_required/);
    await resolve(db,await issue(db));
    assert.equal((await issue(db)).status,'resolved');
    await report(db,'release-1');
    assert.equal((await issue(db)).status,'verifying');
    await resolve(db,await issue(db));
    await report(db,'release-2');
    assert.equal((await issue(db)).status,'reopened');
    assert.equal((await db.query('select count(*) from system_issue_events')).rows[0].count,4);
    await report(db,'release-2','production');
    assert.equal((await db.query('select count(*) from system_issues')).rows[0].count,2);
  } finally { await db.close(); }
});

test('student/teacher and self-assigned admin cannot read or resolve issues; direct writes denied',async () => {
  const db=await setup();
  try {
    await db.exec(migration); await report(db);
    const current=await issue(db);
    for(const user of [student,teacher]) {
      await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`);
      assert.equal((await db.query('select * from system_issues')).rows.length,0);
      await assert.rejects(resolve(db,current),/admin_required/);
      await assert.rejects(db.exec('select prune_system_observability()'),/admin_required/);
      await assert.rejects(db.exec("update system_issues set status='resolved'"),/permission denied/);
      await assert.rejects(db.exec('truncate system_logs'),/permission denied/);
      await assert.rejects(db.query("update profiles set role='admin' where id=$1",[user]),/admin_role_change_requires_administrator/);
      await db.exec('reset role');
    }
    await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false); update profiles set role='admin' where id='${student}'; set role authenticated; select set_config('request.jwt.claim.sub','${student}',false);`);
    assert.equal((await db.query('select is_system_log_admin() as allowed')).rows[0].allowed,false);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`);
    await resolve(db,current);
    assert.equal((await db.query('select * from system_issue_events')).rows.length,1);
  } finally { await db.close(); }
});

test('retention is paused by default, preserves open issues and audit, honors 30/120 days',async () => {
  const db=await setup();
  try {
    await db.exec(migration);
    await db.exec('begin');
    for(const [severity,age,label] of [['error',29,'young'],['error',30,'edge'],['error',31,'old'],['critical',119,'young'],['critical',120,'edge'],['critical',121,'old'],['security',121,'old']]) {
      const message = `${severity}-${label}`;
      await report(db,'release-1','development',severity,message);
      // Fixture aging must not simulate a new occurrence.
      await db.query('update system_logs set last_seen_at=now()-make_interval(days=>$1) where message=$2',[age,message]);
    }
    const first=await issue(db); await resolve(db,first);
    assert.equal((await db.query('select prune_system_observability() as result')).rows[0].result.paused,true);
    assert.equal((await db.query('select count(*) from system_logs')).rows[0].count,7);
    await db.exec('update system_log_retention_config set enabled=true');
    const result=(await db.query('select prune_system_observability() as result')).rows[0].result;
    assert.equal(result.logs,3);
    assert.equal((await db.query('select count(*) from system_issues')).rows[0].count,7);
    assert.equal((await db.query('select count(*) from system_issue_events')).rows[0].count,1);
    assert.equal((await db.query('select count(*) from system_log_retention_runs')).rows[0].count,1);
    await db.exec('commit');
  } finally { await db.close(); }
});
