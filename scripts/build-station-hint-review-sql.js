import fs from 'node:fs';
import path from 'node:path';
import { isPlaceholderStationHint } from '../src/utils/stationHints.js';
import { publicAndAnswer } from '../src/utils/stationRelease.js';

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const rows = [];
for (const gradeDir of fs.readdirSync('content/stations').sort()) {
  for (const name of fs.readdirSync(path.join('content/stations', gradeDir)).filter((entry) => entry.endsWith('.json')).sort()) {
    const document = JSON.parse(fs.readFileSync(path.join('content/stations', gradeDir, name), 'utf8'));
    for (const stage of document.stages) {
      for (const game of stage.games) {
        if (game.type === 'quiz') continue;
        if (isPlaceholderStationHint(game.data.hint)) throw new Error(`${name}: gợi ý mẫu chưa được thay.`);
        const expected = publicAndAnswer(game).publicContent;
        delete expected.hint;
        rows.push(`  (${literal(document.releaseVersion)}, ${stage.dayIndex}, ${literal(game.type)}, ${literal(game.data.hint)}, ${literal(JSON.stringify(expected))}::jsonb)`);
      }
    }
  }
}
if (rows.length !== 840) throw new Error(`Cần đúng 840 gợi ý, hiện có ${rows.length}.`);

const sql = `-- Hint-only review. Run after the V2 base migration. Do not auto-publish.
-- Draft/review releases: replace only unchanged placeholder hints.
-- Published releases: clone current database content to a new review version,
-- preserving admin edits, answers, source references, and the live publication.
begin;
create temporary table station_hint_review_values (
  base_version text not null,
  day_index integer not null,
  game_type text not null,
  hint text not null,
  expected_content jsonb not null,
  primary key(base_version, day_index, game_type)
) on commit drop;
insert into station_hint_review_values values
${rows.join(',\n')};

do $station_hints$
declare
  v_base record;
  v_new_id uuid;
  v_admin_id uuid;
  v_changed integer;
begin
  select id into v_admin_id from public.profiles where role = 'admin' order by id limit 1;
  if v_admin_id is null then raise exception 'station_hint_review_requires_admin_profile'; end if;
  for v_base in
    select r.* from public.station_content_releases r
    join (select distinct base_version from station_hint_review_values) h on h.base_version = r.version
    order by r.grade, r.station_id
  loop
    if (select count(*) from public.station_content_items where release_id = v_base.id) <> 50 then
      raise exception 'station_hint_review_requires_complete_release: %', v_base.version;
    end if;
    if v_base.status in ('draft', 'review') then
      update public.station_content_items i
      set public_content = jsonb_set(i.public_content, '{hint}', to_jsonb(h.hint), true), updated_at = now()
      from station_hint_review_values h
      where i.release_id = v_base.id and h.base_version = v_base.version
        and h.day_index = i.day_index and h.game_type = i.game_type
        and i.public_content - 'hint' = h.expected_content
        and i.public_content->>'hint' in (
          'Dựa vào kiến thức của ải ' || i.day_index || '.',
          'Dựa vào nội dung của ải ' || i.day_index || '.'
        );
      get diagnostics v_changed = row_count;
      if v_changed > 0 then
        update public.station_content_releases set status = 'review', updated_at = now()
        where id = v_base.id;
      end if;
      raise notice '%: % hints replaced; status review if changed', v_base.version, v_changed;
    elsif v_base.status = 'published' then
      if exists (select 1 from public.station_content_releases where version = v_base.version || '-hints.1') then
        raise notice '%: review clone already exists, skipped', v_base.version;
        continue;
      end if;
      insert into public.station_content_releases(version, grade, station_id, title, status, notes, created_by)
      values(v_base.version || '-hints.1', v_base.grade, v_base.station_id, v_base.title,
             'review', v_base.notes || ' | Rà gợi ý theo nội dung; chưa phát hành.', v_admin_id)
      returning id into v_new_id;
      insert into public.station_content_items(
        release_id, grade, station_id, day_index, game_index, game_type,
        title, learning_objective, public_content, answer_key, source_refs
      )
      select v_new_id, i.grade, i.station_id, i.day_index, i.game_index, i.game_type,
             i.title, i.learning_objective,
             case when h.hint is not null and i.public_content - 'hint' = h.expected_content
               and i.public_content->>'hint' in (
               'Dựa vào kiến thức của ải ' || i.day_index || '.',
               'Dựa vào nội dung của ải ' || i.day_index || '.'
             ) then jsonb_set(i.public_content, '{hint}', to_jsonb(h.hint), true)
               else i.public_content end,
             i.answer_key, i.source_refs
      from public.station_content_items i
      left join station_hint_review_values h
        on h.base_version = v_base.version and h.day_index = i.day_index and h.game_type = i.game_type
      where i.release_id = v_base.id;
      raise notice '%: review clone created as %; publication unchanged', v_base.version, v_base.version || '-hints.1';
    end if;
  end loop;
end;
$station_hints$;
commit;
`;

const output = 'generated/station-releases/station-hints-review.sql';
fs.writeFileSync(output, sql);
console.log(`Đã tạo ${output}: ${rows.length} gợi ý, không tự phát hành.`);
