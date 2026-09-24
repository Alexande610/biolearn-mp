import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mergeRankings, presentationWeekScore } from '../src/lib/presentationPeople.js';
import { summarizeAdminProfiles } from '../src/lib/adminProfileMetrics.js';

test('presentation SQL creates 109 isolated people, valid rankings and exact cleanup', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create table public.profiles(id uuid primary key, role text);
      insert into public.profiles values ('00000000-0000-4000-a000-000000000001', 'student');
      create function public.current_biolearn_week() returns date language sql stable as
        $$ select date_trunc('week', now())::date $$;`);
    await db.exec(await readFile(new URL('../supabase_presentation_people.sql', import.meta.url), 'utf8'));
    const seed = await readFile(new URL('../generated/presentation-people/seed.sql', import.meta.url), 'utf8');
    await db.exec(seed);
    let result = await db.query(`select grade, count(*) filter (where role='student') as students,
      count(*) filter (where role='teacher') as teachers,
      count(*) filter (where weekly_pvp_score > 0) as pvp_ranked
      from public.presentation_people group by grade order by grade`);
    assert.deepEqual(result.rows.map(row => [Number(row.students), Number(row.teachers), Number(row.pvp_ranked)]),
      [[15, 1, 12], [15, 1, 12], [15, 1, 12], [15, 1, 12], [14, 1, 12], [14, 1, 12], [14, 1, 12]]);
    result = await db.query('select count(*) as n from public.presentation_activity');
    assert.equal(Number(result.rows[0].n), 432);
    result = await db.query('select count(distinct display_name) as n from public.presentation_people');
    assert.equal(Number(result.rows[0].n), 109);
    await db.exec(seed);
    result = await db.query('select count(*) as n from public.presentation_people');
    assert.equal(Number(result.rows[0].n), 109);
    await db.exec(await readFile(new URL('../generated/presentation-people/cleanup.sql', import.meta.url), 'utf8'));
    result = await db.query('select count(*) as n from public.presentation_people');
    assert.equal(Number(result.rows[0].n), 0);
    result = await db.query('select count(*) as n from public.profiles');
    assert.equal(Number(result.rows[0].n), 1);
  } finally {
    await db.close();
  }
});

test('ranking merge and admin averages preserve real rows and exclude teachers from scores', () => {
  const real = [{ id: 'real', total_score: 1200 }];
  const sample = [{ id: 'sample', total_score: 1500, is_presentation_data: true }];
  assert.deepEqual(mergeRankings(real, sample, 'total_score', 2).map(row => row.id), ['sample', 'real']);
  assert.equal(presentationWeekScore({ role: 'student', week_start: '2026-09-21', weekly_map_score: 80, weekly_pvp_score: 100 }, '2026-09-21'), 180);
  assert.equal(presentationWeekScore({ role: 'student', week_start: '2026-09-21', weekly_map_score: 80 }, '2026-09-28'), 0);
  const stats = summarizeAdminProfiles([
    { role: 'student', total_score: 100, class_progress: { 6: { completedLevels: ['1', '2'] } } },
    { role: 'student', total_score: 300, completed_lessons: 5, is_presentation_data: true },
    { role: 'teacher', total_score: 9000 }
  ]);
  assert.equal(stats.students, 2);
  assert.equal(stats.teachers, 1);
  assert.equal(stats.averageScore, 200);
  assert.equal(stats.totalLessonsCompleted, 7);
});
