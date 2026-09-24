-- Read-only inventory for the 21 biology stations. Safe to rerun in Supabase SQL Editor.
-- A complete release has 50 items, 10 days and 5 game types.
with expected as (
  select grade, 'g' || grade || '_st' || station_number as station_id
  from generate_series(6, 12) as grades(grade)
  cross join generate_series(1, 3) as stations(station_number)
)
select e.grade, e.station_id, r.version, r.status,
       count(i.id) as item_count,
       count(distinct i.day_index) as day_count,
       count(distinct i.game_type) as game_type_count,
       count(i.id) filter (
         where i.game_type <> 'quiz'
           and i.public_content->>'hint' ~ '^Dựa vào (kiến thức|nội dung) của ải [0-9]+[.]$'
       ) as placeholder_hint_count,
       coalesce(bool_or(p.release_id = r.id), false) as live_for_students
from expected e
left join public.station_content_releases r
  on r.grade = e.grade and r.station_id = e.station_id
left join public.station_content_items i on i.release_id = r.id
left join public.station_content_publications p
  on p.grade = e.grade and p.station_id = e.station_id
group by e.grade, e.station_id, r.id, r.version, r.status, r.created_at
order by e.grade, e.station_id, r.created_at;
