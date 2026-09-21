import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const student = '00000000-0000-4000-8000-000000000002';
// Supabase already provides pgcrypto. PGlite does not bundle that extension,
// while its core still provides gen_random_uuid(), so omit only this setup line.
const migration = (await fs.readFile('supabase_station_content_v2.sql', 'utf8'))
  .replace('create extension if not exists pgcrypto;', '');
const pilotRelease = await fs.readFile('generated/station-releases/g6-st1-2026.1.sql', 'utf8');
const cutover = await fs.readFile('supabase_station_content_v2_cutover.sql', 'utf8');

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table public.profiles(id uuid primary key, role text not null);
    insert into public.profiles values
      ('${admin}', 'admin'),
      ('${student}', 'student');
    create table public.station_progress(
      user_id uuid not null references public.profiles(id),
      station_id text not null,
      day_index integer not null,
      stars integer not null default 0,
      claimed_stars integer not null default 0,
      updated_at timestamptz not null default now(),
      primary key(user_id, station_id, day_index)
    );
    create function public.claim_station_reward(p_station_id text, p_day_index integer, p_stars integer)
    returns jsonb language plpgsql security definer as $$
    begin
      insert into public.station_progress(user_id, station_id, day_index, stars, claimed_stars)
      values(auth.uid(), p_station_id, p_day_index, p_stars, p_stars)
      on conflict(user_id, station_id, day_index) do update
      set stars = greatest(station_progress.stars, excluded.stars),
          claimed_stars = greatest(station_progress.claimed_stars, excluded.claimed_stars);
      return jsonb_build_object('awarded', p_stars > 0);
    end;
    $$;
    grant usage on schema public, auth to anon, authenticated;
    grant select on public.profiles, public.station_progress to authenticated;
    grant execute on function public.claim_station_reward(text, integer, integer) to authenticated;
  `);
  await db.exec(migration);
  return db;
}

const fiveGames = [
  ['quiz', { question: 'Đơn vị cơ bản của cơ thể sống là gì?', options: ['Tế bào', 'Mô', 'Cơ quan'], hint: 'Đơn vị nhỏ nhất.' }, { value: 'Tế bào', explanation: 'Tế bào là đơn vị cấu trúc và chức năng cơ bản của cơ thể sống.' }],
  ['match', { leftItems: ['Màng tế bào', 'Nhân'], rightItems: ['Bao bọc tế bào', 'Chứa vật chất di truyền'], hint: 'Dựa vào chức năng.' }, { value: [{ left: 'Màng tế bào', right: 'Bao bọc tế bào' }, { left: 'Nhân', right: 'Chứa vật chất di truyền' }], explanation: 'Mỗi cấu trúc đảm nhiệm một chức năng.' }],
  ['fill', { sentence: '[blank] là đơn vị cơ bản của cơ thể sống.', hint: 'Hai tiếng.' }, { value: 'Tế bào', explanation: 'Đáp án là tế bào.' }],
  ['category', { categories: ['Nhân sơ', 'Nhân thực'], items: ['Vi khuẩn', 'Tế bào thực vật', 'Tế bào động vật'], hint: 'Xét màng nhân.' }, { value: [{ name: 'Vi khuẩn', catIndex: 0 }, { name: 'Tế bào thực vật', catIndex: 1 }, { name: 'Tế bào động vật', catIndex: 1 }], explanation: 'Vi khuẩn là sinh vật nhân sơ.' }],
  ['dragdrop', { textWithBlanks: 'Màng tế bào [blank] tế bào.', bankWords: ['bao bọc', 'phân chia'], hint: 'Vị trí ngoài cùng.' }, { value: 'bao bọc', explanation: 'Màng tế bào bao bọc tế bào.' }],
];

async function createCompleteRelease(db, version = 'g6-st1-test') {
  await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
  const release = (await db.query(
    `insert into station_content_releases(version, grade, station_id, title)
     values($1, 6, 'g6_st1', 'Bản kiểm thử') returning id`,
    [version],
  )).rows[0];
  for (let day = 1; day <= 10; day += 1) {
    for (let index = 0; index < fiveGames.length; index += 1) {
      const [type, publicContent, answerKey] = fiveGames[index];
      await db.query(
        `insert into station_content_items(
          release_id, grade, station_id, day_index, game_index, game_type,
          title, learning_objective, public_content, answer_key, source_refs
        ) values($1, 6, 'g6_st1', $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb)`,
        [release.id, day, index + 1, type, `${type} ngày ${day}`, 'Nhận biết cấu trúc tế bào.', JSON.stringify(publicContent), JSON.stringify(answerKey), JSON.stringify([{ source: 'SGK KHTN 6 KNTT', pages: '76-85' }])],
      );
    }
  }
  return release.id;
}

test('migration is rerunnable and seeds four catalog entries per grade', async () => {
  const db = await setup();
  try {
    assert.equal(Number((await db.query('select count(*) from station_catalog')).rows[0].count), 28);
    await db.exec(migration);
    assert.equal(Number((await db.query('select count(*) from station_catalog')).rows[0].count), 28);
  } finally { await db.close(); }
});

test('publication rejects incomplete releases and publishes a complete release', async () => {
  const db = await setup();
  try {
    await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
    const incomplete = (await db.query(
      "insert into station_content_releases(version, grade, station_id, title) values('incomplete', 6, 'g6_st1', 'Thiếu') returning id",
    )).rows[0];
    await assert.rejects(db.query('select admin_publish_station_release($1)', [incomplete.id]), /release_requires_10_days/);
    const completeId = await createCompleteRelease(db);
    const result = (await db.query('select admin_publish_station_release($1) as result', [completeId])).rows[0].result;
    assert.equal(result.published, true);
    assert.equal((await db.query('select status from station_content_releases where id=$1', [completeId])).rows[0].status, 'published');
  } finally { await db.close(); }
});

test('student receives shuffled public data only and server scores two attempts', async () => {
  const db = await setup();
  try {
    const releaseId = await createCompleteRelease(db, 'g6-st1-play');
    await db.query('select admin_publish_station_release($1)', [releaseId]);
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false); set role authenticated;`);
    const started = (await db.query("select start_station_attempt(6, 'g6_st1', 1) as result")).rows[0].result;
    assert.equal(started.games.length, 5);
    assert.equal(JSON.stringify(started.games).includes('answer_key'), false);
    assert.equal(JSON.stringify(started.games).includes('correctAnswer'), false);

    const quiz = started.games.find((game) => game.type === 'quiz');
    const first = (await db.query('select submit_station_answer($1, $2, $3::jsonb) as result', [started.attempt_id, quiz.id, JSON.stringify({ value: 'Mô' })])).rows[0].result;
    assert.equal(first.correct, false);
    assert.equal(first.can_retry, true);
    assert.equal(first.answer_reveal, null);
    const second = (await db.query('select submit_station_answer($1, $2, $3::jsonb) as result', [started.attempt_id, quiz.id, JSON.stringify({ value: 'Tế bào' })])).rows[0].result;
    assert.equal(second.correct, true);
    assert.equal(second.resolved, true);
    assert.equal(second.answer_reveal, 'Tế bào');
  } finally { await db.close(); }
});

test('a student cannot read answer keys directly', async () => {
  const db = await setup();
  try {
    await createCompleteRelease(db, 'g6-st1-rls');
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false); set role authenticated;`);
    assert.equal((await db.query('select * from station_content_items')).rows.length, 0);
    const updated = await db.query("update station_content_releases set title='x' returning id");
    assert.equal(updated.rows.length, 0);
  } finally { await db.close(); }
});

test('generated pilot imports 50 draft items and published content is immutable', async () => {
  const db = await setup();
  try {
    await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
    await db.exec(pilotRelease);
    const release = (await db.query("select id, status from station_content_releases where version='g6-st1-2026.1'")).rows[0];
    assert.equal(release.status, 'draft');
    assert.equal(Number((await db.query('select count(*) from station_content_items where release_id=$1', [release.id])).rows[0].count), 50);
    await db.query('select admin_publish_station_release($1)', [release.id]);
    await assert.rejects(
      db.query("update station_content_items set title='Sửa trái phép' where release_id=$1", [release.id]),
      /published_release_content_is_immutable/,
    );
    await assert.rejects(db.exec(pilotRelease), /release_version_is_immutable/);
  } finally { await db.close(); }
});

test('legacy cutover is blocked until every active station is published', async () => {
  const db = await setup();
  try {
    await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
    await db.exec(pilotRelease);
    const release = (await db.query("select id from station_content_releases where version='g6-st1-2026.1'")).rows[0];
    await db.query('select admin_publish_station_release($1)', [release.id]);
    await assert.rejects(db.exec(cutover), /cutover_blocked_missing_complete_publications: 20/);
  } finally { await db.close(); }
});
