import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('weekly refresh replaces only presentation activity and populates all seven PvP classes', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create table public.profiles(id uuid primary key, role text, total_score integer);
      insert into public.profiles values ('00000000-0000-4000-a000-000000000001', 'student', 999);
      create function public.current_biolearn_week() returns date language sql stable as
        $$ select date '2026-09-28' $$;`);
    await db.exec(await readFile(new URL('../supabase_presentation_people.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../generated/presentation-people/seed.sql', import.meta.url), 'utf8'));
    await db.exec(`update public.presentation_people set week_start = date '2026-09-21'`);
    const refresh = await readFile(new URL('../generated/presentation-people/refresh-week-2026-09-28.sql', import.meta.url), 'utf8');
    await db.exec(refresh);
    const grades = await db.query(`select grade, count(*) filter (where role='student' and weekly_pvp_score>0) as ranked
      from public.presentation_people group by grade order by grade`);
    assert.deepEqual(grades.rows.map(row => Number(row.ranked)), [12, 12, 12, 12, 12, 12, 12]);
    const batch = await db.query(`select count(*) as people,
      count(*) filter (where week_start=date '2026-09-28') as current_week,
      count(*) filter (where weekly_pvp_score<>pvp_wins*100 or weekly_map_score+weekly_pvp_score>total_score) as inconsistent
      from public.presentation_people`);
    assert.deepEqual([Number(batch.rows[0].people), Number(batch.rows[0].current_week), Number(batch.rows[0].inconsistent)], [109, 109, 0]);
    const activity = await db.query('select count(*) as n from public.presentation_activity');
    assert.equal(Number(activity.rows[0].n), 175);
    const real = await db.query('select total_score from public.profiles');
    assert.equal(real.rows[0].total_score, 999);
    await db.exec(refresh);
    const again = await db.query('select count(*) as n from public.presentation_activity');
    assert.equal(Number(again.rows[0].n), 175);
    await db.exec(`create or replace function public.current_biolearn_week() returns date language sql stable as
      $$ select date '2026-10-05' $$;`);
    await assert.rejects(db.exec(refresh), /Wrong BioLearn week/);
    await db.exec('rollback');
    const afterRejectedRun = await db.query('select count(*) as n from public.presentation_activity');
    assert.equal(Number(afterRejectedRun.rows[0].n), 175);
  } finally {
    await db.close();
  }
});
