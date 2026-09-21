import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { toDatabaseRelease } from '../src/utils/stationRelease.js';

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error('Cách dùng: node scripts/build-station-release-sql.js <station.json> <release.sql>');
  process.exit(1);
}

const document = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
const payload = toDatabaseRelease(document);
const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${literal(JSON.stringify(value))}::jsonb`;
const lines = [
  '-- Generated from reviewed JSON. Apply only after supabase_station_content_v2.sql.',
  'begin;',
  'do $station_release$',
  'declare v_release_id uuid;',
  'declare v_release_status text;',
  'begin',
  '  insert into public.station_content_releases(version, grade, station_id, title, status, notes)',
  `  values(${literal(payload.release.version)}, ${payload.release.grade}, ${literal(payload.release.station_id)}, ${literal(payload.release.title)}, 'draft', ${literal(payload.release.notes)})`,
  '  on conflict (version) do update set',
  "    title = case when station_content_releases.status = 'draft' then excluded.title else station_content_releases.title end,",
  "    notes = case when station_content_releases.status = 'draft' then excluded.notes else station_content_releases.notes end,",
  "    updated_at = case when station_content_releases.status = 'draft' then now() else station_content_releases.updated_at end",
  '  returning id into v_release_id;',
  '  select status into v_release_status from public.station_content_releases where id = v_release_id for update;',
  "  if v_release_status <> 'draft' then raise exception 'release_version_is_immutable'; end if;",
  '  delete from public.station_content_items where release_id = v_release_id;',
];
for (const item of payload.items) {
  lines.push(
    '  insert into public.station_content_items(release_id, grade, station_id, day_index, game_index, game_type, title, learning_objective, public_content, answer_key, source_refs)',
    `  values(v_release_id, ${item.grade}, ${literal(item.station_id)}, ${item.day_index}, ${item.game_index}, ${literal(item.game_type)}, ${literal(item.title)}, ${literal(item.learning_objective)}, ${json(item.public_content)}, ${json(item.answer_key)}, ${json(item.source_refs)});`,
  );
}
lines.push('end;', '$station_release$;', 'commit;', '');
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(path.resolve(output), lines.join('\n'));
console.log(`Đã tạo ${output}: ${payload.items.length} trò chơi ở trạng thái nháp.`);
