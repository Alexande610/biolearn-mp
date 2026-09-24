import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const BATCH = 'thesis-presentation-2026-09';
const outDir = new URL('../generated/presentation-people/', import.meta.url);
const grades = [6, 7, 8, 9, 10, 11, 12];
const family = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middle = ['Minh', 'Hải', 'Thanh', 'Ngọc', 'Gia', 'Quốc', 'Bảo', 'Khánh', 'Thiên', 'Phương', 'Anh', 'Đức', 'Thảo', 'Nhật'];
const given = ['An', 'Bình', 'Châu', 'Duy', 'Hà', 'Hân', 'Huy', 'Khang', 'Lâm', 'Linh', 'Mai', 'Nam', 'Nhi', 'Phúc', 'Quân', 'Thư', 'Trang', 'Vy', 'Yến'];
const avatar = ['adventurer-1.png', 'adventurer-5.png', 'avataaars-1.png', 'avataaars-2.png', 'avataaars-3.png', 'avataaars-4.png', 'avataaars-5.png'];
const features = ['learning_map', 'biology_3d', 'quiz', 'pvp', 'missions', 'mini_game'];
const quote = value => `'${String(value).replaceAll("'", "''")}'`;

function uuid(key) {
  const hex = createHash('sha256').update(`${BATCH}:${key}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}
function mix(n) {
  let x = (n * 1664525 + 1013904223) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822519) >>> 0;
  return x;
}

const persons = [];
const activities = [];
const usedNames = new Set();
for (const grade of grades) {
  const count = grade <= 9 ? 15 : 14;
  for (let index = 0; index < count; index++) {
    const key = grade * 100 + index;
    const id = uuid(`student-${key}`);
    const weeklyActive = index < 12;
    const wins = weeklyActive ? 1 + (mix(key + 31) % 8) : 0;
    const losses = weeklyActive ? mix(key + 91) % 6 : 0;
    const map = weeklyActive ? 70 + (mix(key + 17) % 980) : 0;
    const pvp = wins * 100;
    const total = index === 12 ? 80 + mix(key + 7) % 230 : 800 + (mix(key + 7) % 8600) + map + pvp;
    const completed = index === 12 ? mix(key + 53) % 2 : 2 + (mix(key + 53) % 38);
    const lastOffset = index === 12 ? grade % 2 : weeklyActive ? mix(key + 72) % 5 : 10 + mix(key + 12) % 35;
    const surname = family[mix(key + 1) % family.length];
    let name;
    for (let attempt = 0; attempt < middle.length * given.length; attempt++) {
      name = `${surname} ${middle[(mix(key + 2) + Math.floor(attempt / given.length)) % middle.length]} ${given[(mix(key + 3) + attempt) % given.length]}`;
      if (!usedNames.has(name)) break;
    }
    if (usedNames.has(name)) throw new Error('Could not create unique presentation names');
    usedNames.add(name);
    persons.push({ id, name, role: 'student', grade, total, map, pvp, wins, losses, completed,
      createdOffset: index === 12 ? 1 + grade % 3 : 25 + mix(key + 15) % 155,
      lastOffset, avatar: avatar[mix(key + 5) % avatar.length] });
    const days = new Set([lastOffset]);
    if (weeklyActive) {
      for (let n = 1; n <= 3; n++) days.add(Math.min(25, lastOffset + n * (1 + mix(key + n) % 3)));
    } else if (lastOffset < 24) days.add(lastOffset + 5);
    for (const day of days) {
      const primary = features[mix(key + day) % features.length];
      activities.push({ id, day, feature: primary });
      if (weeklyActive && day < 8 && mix(key + day + 100) % 3 === 0) {
        const secondary = features[(features.indexOf(primary) + 2) % features.length];
        activities.push({ id, day, feature: secondary });
      }
    }
  }
  const id = uuid(`teacher-${grade}`);
  const key = grade * 1000;
  let teacherName = `${family[grade]} ${middle[grade]} ${given[grade]}`;
  if (usedNames.has(teacherName)) teacherName = `${family[grade]} ${middle[grade + 1]} ${given[grade]}`;
  if (usedNames.has(teacherName)) throw new Error('Could not create unique teacher name');
  usedNames.add(teacherName);
  persons.push({ id, name: teacherName, role: 'teacher', grade,
    total: 0, map: 0, pvp: 0, wins: 0, losses: 0, completed: 0,
    createdOffset: 90 + grade * 7, lastOffset: grade % 3, avatar: avatar[grade % avatar.length] });
  activities.push({ id, day: grade % 3, feature: 'quiz' });
}

const personRows = persons.map(p => `  (${quote(p.id)}, ${quote(BATCH)}, ${quote(p.name)}, ${quote(p.avatar)}, ${quote(p.role)}, ${p.grade}, ${p.total}, public.current_biolearn_week(), ${p.map}, ${p.pvp}, ${p.wins}, ${p.losses}, ${p.completed}, now() - interval '${p.createdOffset} days', now() - interval '${p.lastOffset} days')`);
const activityRows = activities.map(a => `  (${quote(a.id)}, (now() at time zone 'Asia/Ho_Chi_Minh')::date - ${a.day}, ${quote(a.feature)})`);

const sql = `-- Generated presentation records: ${persons.length} people (${persons.filter(p => p.role === 'student').length} students, 7 teachers).
-- Run supabase_presentation_people.sql first. This script upserts only batch ${BATCH}.
begin;
insert into public.presentation_people
  (id,batch_id,display_name,avatar_url,role,grade,total_score,week_start,weekly_map_score,weekly_pvp_score,pvp_wins,pvp_losses,completed_lessons,created_at,last_active_at)
values
${personRows.join(',\n')}
on conflict (id) do update set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  total_score = excluded.total_score,
  week_start = excluded.week_start,
  weekly_map_score = excluded.weekly_map_score,
  weekly_pvp_score = excluded.weekly_pvp_score,
  pvp_wins = excluded.pvp_wins,
  pvp_losses = excluded.pvp_losses,
  completed_lessons = excluded.completed_lessons,
  last_active_at = excluded.last_active_at
where public.presentation_people.batch_id = ${quote(BATCH)};
insert into public.presentation_activity (person_id,metric_date,feature)
values
${activityRows.join(',\n')}
on conflict do nothing;
do $$
begin
  if (select count(*) from public.presentation_people where batch_id = ${quote(BATCH)}) <> 109 then
    raise exception 'Presentation batch count mismatch';
  end if;
  if exists (select 1 from public.presentation_people where batch_id = ${quote(BATCH)} and role = 'student' and weekly_pvp_score <> pvp_wins * 100) then
    raise exception 'Presentation PvP score mismatch';
  end if;
end $$;
commit;

select grade, role, count(*) as people, count(*) filter (where weekly_pvp_score > 0) as pvp_ranked
from public.presentation_people where batch_id = ${quote(BATCH)} group by grade, role order by grade, role;
`;

const cleanup = `-- Removes only presentation records from this batch. Real profiles and scores are untouched.
begin;
delete from public.presentation_people where batch_id = ${quote(BATCH)};
commit;
select count(*) as remaining from public.presentation_people where batch_id = ${quote(BATCH)};
`;
await mkdir(outDir, { recursive: true });
await writeFile(new URL('seed.sql', outDir), sql, 'utf8');
await writeFile(new URL('cleanup.sql', outDir), cleanup, 'utf8');
console.log(`Generated ${persons.length} presentation people and ${activities.length} activity rows.`);
