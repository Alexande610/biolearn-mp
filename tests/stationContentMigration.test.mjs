import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const student = '00000000-0000-4000-8000-000000000002';
const ordinaryStudent = '00000000-0000-4000-8000-000000000003';
// Supabase already provides pgcrypto. PGlite does not bundle that extension,
// while its core still provides gen_random_uuid(), so omit only this setup line.
const migration = (await fs.readFile('supabase_station_content_v2.sql', 'utf8'))
  .replace('create extension if not exists pgcrypto;', '');
const pilotRelease = await fs.readFile('generated/station-releases/g6-st1-2026.1.sql', 'utf8');
const station2Release = await fs.readFile('generated/station-releases/g6-st2-2026.1.sql', 'utf8');
const station3Release = await fs.readFile('generated/station-releases/g6-st3-2026.1.sql', 'utf8');
const grade7Station1Release = await fs.readFile('generated/station-releases/g7-st1-2026.1.sql', 'utf8');
const grade7Station2Release = await fs.readFile('generated/station-releases/g7-st2-2026.1.sql', 'utf8');
const grade7Station3Release = await fs.readFile('generated/station-releases/g7-st3-2026.1.sql', 'utf8');
const grade8Releases = await Promise.all([1, 2, 3].map((station) => fs.readFile(`generated/station-releases/g8-st${station}-2026.1.sql`, 'utf8')));
const cutover = await fs.readFile('supabase_station_content_v2_cutover.sql', 'utf8');
const adminEditMigration = await fs.readFile('supabase_station_content_v2_admin_edit.sql', 'utf8');
const gameplayFixMigration = await fs.readFile('supabase_station_content_v2_gameplay_fix.sql', 'utf8');
const matchRetryMigration = await fs.readFile('supabase_station_content_v2_match_retry_fix.sql', 'utf8');
const hintReviewMigration = await fs.readFile('generated/station-releases/g6-st1-hints-review.sql', 'utf8');
const allHintsReviewMigration = await fs.readFile('generated/station-releases/station-hints-review.sql', 'utf8');

test('hint review runs as one SQL Editor statement so the temporary table survives', () => {
  for (const sql of [hintReviewMigration, allHintsReviewMigration]) {
    assert.match(sql, /^do \$station_hints\$/m);
    assert.doesNotMatch(sql, /^begin;\s*$/m);
    assert.doesNotMatch(sql, /^create temporary table station_hint_review_values/m);
  }
});

test('pilot hint SQL contains only the selected station', () => {
  assert.match(hintReviewMigration, /g6-st1-2026\.1/);
  assert.doesNotMatch(hintReviewMigration, /g6-st2-2026\.1/);
  assert.match(allHintsReviewMigration, /g12-st3-2026\.1/);
});

async function restorePlaceholderHints(db, releaseId) {
  await db.query(`update station_content_items
    set public_content = jsonb_set(public_content, '{hint}', to_jsonb('Dựa vào kiến thức của ải ' || day_index || '.'))
    where release_id = $1 and game_type <> 'quiz'`, [releaseId]);
}

test('generated SQL uses a portable PL/pgSQL declaration block', () => {
  assert.match(pilotRelease, /do \$station_release\$\r?\ndeclare\r?\n\s+v_release_id uuid;/);
  assert.doesNotMatch(pilotRelease, /declare v_/);
  assert.doesNotMatch(pilotRelease, /\bor not exists\s*\(/i);
});

test('admin can edit a V2 draft item, which moves to review and blocks reimport', async () => {
  const db = await setup();
  try {
    await db.exec(pilotRelease);
    await db.exec(adminEditMigration);
    await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
    const release = (await db.query("select id from station_content_releases where version = 'g6-st1-2026.1'")).rows[0];
    const item = (await db.query('select id, updated_at, title, learning_objective, public_content, answer_key, source_refs from station_content_items where release_id = $1 and day_index = 1 and game_index = 1', [release.id])).rows[0];
    const content = { title: 'Câu hỏi đã sửa', learning_objective: item.learning_objective,
      public_content: item.public_content, answer_key: item.answer_key, source_refs: item.source_refs };
    await db.query('select admin_update_station_content_item($1,$2,$3,$4::jsonb)',
      [release.id, item.id, item.updated_at, JSON.stringify(content)]);
    const result = (await db.query('select status from station_content_releases where id = $1', [release.id])).rows[0];
    assert.equal(result.status, 'review');
    assert.equal((await db.query('select title from station_content_items where id = $1', [item.id])).rows[0].title, 'Câu hỏi đã sửa');
    await assert.rejects(db.exec(pilotRelease), /release_version_is_immutable/);
    await db.exec('rollback;');
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false);`);
    await assert.rejects(db.query('select admin_update_station_content_item($1,$2,$3,$4::jsonb)',
      [release.id, item.id, item.updated_at, JSON.stringify(content)]), /admin_required/);
  } finally { await db.close(); }
});

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table public.profiles(id uuid primary key, role text not null,
      is_test_account boolean not null default false);
    insert into public.profiles values
      ('${admin}', 'admin', false),
      ('${student}', 'student', true),
      ('${ordinaryStudent}', 'student', false);
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

test('V2 matching checks each pair before green feedback and category reports wrong placements', async () => {
  const db = await setup();
  try {
    await db.exec(gameplayFixMigration);
    const releaseId = await createCompleteRelease(db, 'g6-st1-feedback');
    await db.query('select admin_publish_station_release($1)', [releaseId]);
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false); set role authenticated;`);
    const started = (await db.query("select start_station_attempt(6, 'g6_st1', 1) as result")).rows[0].result;
    const match = started.games.find(game => game.type === 'match');
    const wrong = (await db.query('select check_station_match_pair($1,$2,$3,$4) as result',
      [started.attempt_id, match.id, 'Màng tế bào', 'Chứa vật chất di truyền'])).rows[0].result;
    assert.deepEqual(wrong, { correct: false });
    const right = (await db.query('select check_station_match_pair($1,$2,$3,$4) as result',
      [started.attempt_id, match.id, 'Màng tế bào', 'Bao bọc tế bào'])).rows[0].result;
    assert.deepEqual(right, { correct: true });
    assert.equal(JSON.stringify(right).includes('Chứa vật chất di truyền'), false);

    const category = started.games.find(game => game.type === 'category');
    const answer = fiveGames.find(([type]) => type === 'category')[2].value;
    const wrongAnswer = answer.map((item, index) => index === 0 ? { ...item, catIndex: 1 } : item);
    const first = (await db.query('select submit_station_answer($1,$2,$3::jsonb) as result',
      [started.attempt_id, category.id, JSON.stringify({ value: wrongAnswer })])).rows[0].result;
    assert.equal(first.resolved, false);
    assert.equal(first.feedback.find(item => item.name === 'Vi khuẩn').correct, false);
    assert.equal(first.feedback.find(item => item.name === 'Tế bào thực vật').correct, true);
    assert.equal(first.answer_reveal, null);
  } finally { await db.close(); }
});

test('V2 matching lets a student finish after every distinct wrong pairing', async () => {
  const db = await setup();
  try {
    await db.exec(gameplayFixMigration);
    await db.exec(matchRetryMigration);
    const releaseId = await createCompleteRelease(db, 'g6-st1-match-retry');
    await db.query('select admin_publish_station_release($1)', [releaseId]);
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false); set role authenticated;`);
    const started = (await db.query("select start_station_attempt(6, 'g6_st1', 1) as result")).rows[0].result;
    const match = started.games.find(game => game.type === 'match');
    const check = async (left, right) => (await db.query(
      'select check_station_match_pair($1,$2,$3,$4) as result',
      [started.attempt_id, match.id, left, right],
    )).rows[0].result;
    assert.deepEqual(await check('Màng tế bào', 'Chứa vật chất di truyền'), { correct: false });
    assert.deepEqual(await check('Nhân', 'Bao bọc tế bào'), { correct: false });
    assert.deepEqual(await check('Nhân', 'Bao bọc tế bào'), { correct: false });
    assert.deepEqual(await check('Màng tế bào', 'Bao bọc tế bào'), { correct: true });
    assert.deepEqual(await check('Nhân', 'Chứa vật chất di truyền'), { correct: true });
    await assert.rejects(check('Khác', 'Bao bọc tế bào'), /invalid_match_pair/);
    await db.exec(`select set_config('request.jwt.claim.sub', '${ordinaryStudent}', false);`);
    await assert.rejects(check('Màng tế bào', 'Bao bọc tế bào'), /attempt_not_found/);
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false);`);
    const submitted = (await db.query('select submit_station_answer($1,$2,$3::jsonb) as result',
      [started.attempt_id, match.id, JSON.stringify({ value: fiveGames[1][2].value })])).rows[0].result;
    assert.equal(submitted.resolved, true);
  } finally { await db.close(); }
});

test('hint review changes only untouched draft hints and preserves admin-edited content', async () => {
  const db = await setup();
  try {
    await db.exec(pilotRelease);
    const release = (await db.query("select id from station_content_releases where version = 'g6-st1-2026.1'")).rows[0];
    await restorePlaceholderHints(db, release.id);
    await db.query(`update station_content_items
      set public_content = jsonb_set(public_content, '{sentence}', '"Câu đã chỉnh trên admin [blank]."'::jsonb)
      where release_id = $1 and day_index = 1 and game_type = 'fill'`, [release.id]);
    await db.exec(hintReviewMigration);
    const items = (await db.query('select game_type, public_content from station_content_items where release_id = $1 and day_index = 1', [release.id])).rows;
    assert.equal(items.find(item => item.game_type === 'fill').public_content.hint, 'Dựa vào kiến thức của ải 1.');
    assert.match(items.find(item => item.game_type === 'match').public_content.hint, /Thị kính/);
    assert.equal((await db.query('select status from station_content_releases where id = $1', [release.id])).rows[0].status, 'review');
    await db.exec(hintReviewMigration);
    assert.equal((await db.query('select count(*) as n from station_content_releases')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('hint review clones a published release without changing its live content', async () => {
  const db = await setup();
  try {
    await db.exec(pilotRelease);
    await db.exec(`select set_config('request.jwt.claim.sub', '${admin}', false);`);
    const original = (await db.query("select id from station_content_releases where version = 'g6-st1-2026.1'")).rows[0];
    await restorePlaceholderHints(db, original.id);
    await db.query('select admin_publish_station_release($1)', [original.id]);
    await db.exec(hintReviewMigration);
    const clone = (await db.query("select id, status from station_content_releases where version = 'g6-st1-2026.1-hints.1'")).rows[0];
    assert.equal(clone.status, 'review');
    assert.equal((await db.query('select release_id from station_content_publications where grade = 6 and station_id = $1', ['g6_st1'])).rows[0].release_id, original.id);
    assert.equal((await db.query('select public_content->>\'hint\' as hint from station_content_items where release_id = $1 and day_index = 1 and game_type = $2', [original.id, 'match'])).rows[0].hint, 'Dựa vào kiến thức của ải 1.');
    assert.match((await db.query('select public_content->>\'hint\' as hint from station_content_items where release_id = $1 and day_index = 1 and game_type = $2', [clone.id, 'match'])).rows[0].hint, /Thị kính/);
    assert.equal((await db.query('select count(*) as n from station_content_items where release_id = $1', [clone.id])).rows[0].n, 50);
  } finally { await db.close(); }
});

test('test account can demo locked day without progress or reward; ordinary student cannot', async () => {
  const db = await setup();
  try {
    await db.exec(gameplayFixMigration);
    const releaseId = await createCompleteRelease(db, 'g6-st1-demo');
    await db.query('select admin_publish_station_release($1)', [releaseId]);
    await db.exec(`select set_config('request.jwt.claim.sub', '${ordinaryStudent}', false); set role authenticated;`);
    await assert.rejects(db.query("select start_station_demo_attempt(6, 'g6_st1', 2)"), /demo_test_account_required/);
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false);`);
    await assert.rejects(db.query("select start_station_attempt(6, 'g6_st1', 2)"), /previous_day_required/);
    const started = (await db.query("select start_station_demo_attempt(6, 'g6_st1', 2) as result")).rows[0].result;
    assert.equal(started.is_demo, true);
    assert.equal(started.games.length, 5);
    let completion;
    for (const game of started.games) {
      const answer = fiveGames.find(([type]) => type === game.type)[2].value;
      completion = (await db.query('select submit_station_answer($1,$2,$3::jsonb) as result',
        [started.attempt_id, game.id, JSON.stringify({ value: answer })])).rows[0].result;
    }
    assert.equal(completion.stage_complete, true);
    assert.equal(completion.stars, 3);
    assert.deepEqual(completion.reward, {});
    assert.equal(Number((await db.query('select count(*) from station_progress where user_id=$1', [student])).rows[0].count), 0);
  } finally { await db.close(); }
});

test('unpublished V2 station reports publication absence before checking day-two progress', async () => {
  const db = await setup();
  try {
    await db.exec(gameplayFixMigration);
    await db.exec(`select set_config('request.jwt.claim.sub', '${ordinaryStudent}', false); set role authenticated;`);
    await assert.rejects(db.query("select start_station_attempt(6, 'g6_st1', 2)"), /station_content_not_published/);
  } finally { await db.close(); }
});

test('all five V2 games keep two server attempts and only real completion unlocks day two', async () => {
  const db = await setup();
  try {
    await db.exec(gameplayFixMigration);
    const releaseId = await createCompleteRelease(db, 'g6-st1-all-games');
    await db.query('select admin_publish_station_release($1)', [releaseId]);
    await db.exec(`select set_config('request.jwt.claim.sub', '${ordinaryStudent}', false); set role authenticated;`);
    await assert.rejects(db.query("select start_station_attempt(6, 'g6_st1', 2)"), /previous_day_required/);
    const started = (await db.query("select start_station_attempt(6, 'g6_st1', 1) as result")).rows[0].result;
    const wrongAnswers = {
      quiz: 'Mô',
      match: [{ left: 'Màng tế bào', right: 'Chứa vật chất di truyền' }, { left: 'Nhân', right: 'Bao bọc tế bào' }],
      fill: 'Sai',
      category: [{ name: 'Vi khuẩn', catIndex: 1 }, { name: 'Tế bào thực vật', catIndex: 1 }, { name: 'Tế bào động vật', catIndex: 1 }],
      dragdrop: 'phân chia',
    };
    let completion;
    for (const game of started.games) {
      const first = (await db.query('select submit_station_answer($1,$2,$3::jsonb) as result',
        [started.attempt_id, game.id, JSON.stringify({ value: wrongAnswers[game.type] })])).rows[0].result;
      assert.equal(first.attempt_no, 1, game.type);
      assert.equal(first.can_retry, true, game.type);
      assert.equal(first.answer_reveal, null, game.type);
      const correct = fiveGames.find(([type]) => type === game.type)[2].value;
      completion = (await db.query('select submit_station_answer($1,$2,$3::jsonb) as result',
        [started.attempt_id, game.id, JSON.stringify({ value: correct })])).rows[0].result;
      assert.equal(completion.attempt_no, 2, game.type);
      assert.equal(completion.correct, true, game.type);
    }
    assert.equal(completion.stage_complete, true);
    assert.equal(completion.stars, 3);
    assert.equal(completion.reward.awarded, true);
    assert.equal((await db.query('select stars from station_progress where user_id=$1 and station_id=$2 and day_index=1',
      [ordinaryStudent, 'g6_st1'])).rows[0].stars, 3);
    const dayTwo = (await db.query("select start_station_attempt(6, 'g6_st1', 2) as result")).rows[0].result;
    assert.equal(dayTwo.games.length, 5);
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

test('generated pilot can be imported from Supabase SQL Editor without a JWT', async () => {
  const db = await setup();
  try {
    assert.equal((await db.query('select auth.uid() as id')).rows[0].id, null);
    await db.exec(pilotRelease);
    const release = (await db.query(
      "select status, created_by from station_content_releases where version='g6-st1-2026.1'",
    )).rows[0];
    assert.equal(release.status, 'draft');
    assert.equal(release.created_by, admin);
    assert.equal(Number((await db.query(
      "select count(*) from station_content_items i join station_content_releases r on r.id=i.release_id where r.version='g6-st1-2026.1'",
    )).rows[0].count), 50);
  } finally { await db.close(); }
});

test('grade 6 station 2 imports 50 draft items from SQL Editor', async () => {
  const db = await setup();
  try {
    await db.exec(station2Release);
    const release = (await db.query(
      "select id, status, created_by from station_content_releases where version='g6-st2-2026.1'",
    )).rows[0];
    assert.equal(release.status, 'draft');
    assert.equal(release.created_by, admin);
    assert.equal(Number((await db.query(
      'select count(*) from station_content_items where release_id=$1', [release.id],
    )).rows[0].count), 50);
  } finally { await db.close(); }
});

test('grade 6 station 3 imports 50 draft items from SQL Editor', async () => {
  const db = await setup();
  try {
    await db.exec(station3Release);
    const release = (await db.query(
      "select id, status, created_by from station_content_releases where version='g6-st3-2026.1'",
    )).rows[0];
    assert.equal(release.status, 'draft');
    assert.equal(release.created_by, admin);
    assert.equal(Number((await db.query(
      'select count(*) from station_content_items where release_id=$1', [release.id],
    )).rows[0].count), 50);
  } finally { await db.close(); }
});

test('grade 7 station 1 imports 50 draft items from SQL Editor', async () => {
  const db = await setup();
  try {
    await db.exec(grade7Station1Release);
    const release = (await db.query(
      "select id, grade, station_id, status, created_by from station_content_releases where version='g7-st1-2026.1'",
    )).rows[0];
    assert.equal(release.grade, 7);
    assert.equal(release.station_id, 'g7_st1');
    assert.equal(release.status, 'draft');
    assert.equal(release.created_by, admin);
    assert.equal(Number((await db.query(
      'select count(*) from station_content_items where release_id=$1', [release.id],
    )).rows[0].count), 50);
  } finally { await db.close(); }
});

for (const [stationId, version, sql] of [
  ['g7_st2', 'g7-st2-2026.1', grade7Station2Release],
  ['g7_st3', 'g7-st3-2026.1', grade7Station3Release],
]) {
  test(`${stationId} imports 50 draft items from SQL Editor`, async () => {
    const db = await setup();
    try {
      await db.exec(sql);
      const release = (await db.query(
        'select id, grade, station_id, status, created_by from station_content_releases where version=$1', [version],
      )).rows[0];
      assert.equal(release.grade, 7);
      assert.equal(release.station_id, stationId);
      assert.equal(release.status, 'draft');
      assert.equal(release.created_by, admin);
      assert.equal(Number((await db.query(
        'select count(*) from station_content_items where release_id=$1', [release.id],
      )).rows[0].count), 50);
    } finally { await db.close(); }
  });
}

for (const [index, sql] of grade8Releases.entries()) {
  const station = index + 1;
  test(`g8_st${station} imports 50 draft items from SQL Editor`, async () => {
    const db = await setup();
    try {
      await db.exec(sql);
      const version = `g8-st${station}-2026.1`;
      const release = (await db.query(
        'select id, grade, station_id, status, created_by from station_content_releases where version=$1', [version],
      )).rows[0];
      assert.equal(release.grade, 8);
      assert.equal(release.station_id, `g8_st${station}`);
      assert.equal(release.status, 'draft');
      assert.equal(release.created_by, admin);
      assert.equal(Number((await db.query(
        'select count(*) from station_content_items where release_id=$1', [release.id],
      )).rows[0].count), 50);
    } finally { await db.close(); }
  });
}

test('all grade 9–12 draft SQL files import as complete releases', async () => {
  const db = await setup();
  try {
    for (let grade = 9; grade <= 12; grade += 1) {
      for (let station = 1; station <= 3; station += 1) {
        const version = `g${grade}-st${station}-2026.1`;
        const sql = await fs.readFile(`generated/station-releases/${version}.sql`, 'utf8');
        await db.exec(sql);
        const result = (await db.query(`
          select r.grade, r.station_id, r.status, r.created_by,
            count(i.id)::integer as item_count,
            count(distinct i.day_index)::integer as day_count
          from station_content_releases r
          join station_content_items i on i.release_id = r.id
          where r.version = $1
          group by r.id
        `, [version])).rows[0];
        assert.equal(result.grade, grade);
        assert.equal(result.station_id, `g${grade}_st${station}`);
        assert.equal(result.status, 'draft');
        assert.equal(result.created_by, admin);
        assert.equal(result.item_count, 50);
        assert.equal(result.day_count, 10);
      }
    }
  } finally { await db.close(); }
});

test('SQL Editor import stops cleanly when no admin profile exists', async () => {
  const db = await setup();
  try {
    await db.query('delete from profiles where id=$1', [admin]);
    await assert.rejects(db.exec(pilotRelease), /station_release_import_requires_admin_profile/);
    await db.exec('rollback');
    assert.equal(Number((await db.query(
      "select count(*) from station_content_releases where version='g6-st1-2026.1'",
    )).rows[0].count), 0);
    assert.equal(Number((await db.query('select count(*) from station_content_items')).rows[0].count), 0);
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
