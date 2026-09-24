-- Read-only verification after supabase_presentation_people.sql and seed.sql.
select grade, role, count(*) as people,
  count(*) filter (where week_start = public.current_biolearn_week() and weekly_pvp_score > 0) as current_week_pvp_ranked,
  min(total_score) as min_total_score,
  max(total_score) as max_total_score
from public.presentation_people
where batch_id = 'thesis-presentation-2026-09'
group by grade, role order by grade, role;

select count(*) as total_people,
  count(*) filter (where role = 'student') as students,
  count(*) filter (where role = 'teacher') as teachers,
  count(distinct display_name) as unique_names,
  count(*) filter (where role = 'student' and weekly_pvp_score <> pvp_wins * 100) as inconsistent_pvp_rows
from public.presentation_people
where batch_id = 'thesis-presentation-2026-09';

select count(*) as sample_activity_rows
from public.presentation_activity a
join public.presentation_people p on p.id = a.person_id
where p.batch_id = 'thesis-presentation-2026-09';

select count(*) as auth_collisions
from public.presentation_people p
join auth.users u on u.id = p.id
where p.batch_id = 'thesis-presentation-2026-09';
