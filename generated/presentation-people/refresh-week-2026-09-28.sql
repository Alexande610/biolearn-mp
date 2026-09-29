-- Refresh only the existing presentation batch for the BioLearn week of 2026-09-28.
-- Never writes to auth.users, profiles, weekly_scores, pvp_class_scores or reward tables.
-- Run the whole file in the production Supabase SQL Editor during this week only.
begin;

do $$
begin
  if public.current_biolearn_week() <> date '2026-09-28' then
    raise exception 'Wrong BioLearn week: expected 2026-09-28, got %', public.current_biolearn_week();
  end if;
  if (select count(*) from public.presentation_people where batch_id = 'thesis-presentation-2026-09') <> 109 then
    raise exception 'Expected exactly 109 presentation profiles in the original batch';
  end if;
  if exists (select 1 from public.presentation_people where batch_id <> 'thesis-presentation-2026-09') then
    raise exception 'Another presentation batch exists; review it before refreshing';
  end if;
end $$;

-- Old presentation activity is replaced within this transaction. The profiles remain.
delete from public.presentation_activity a
using public.presentation_people p
where a.person_id = p.id and p.batch_id = 'thesis-presentation-2026-09';

with ranked as (
  select p.id, p.role, p.grade, p.total_score,
    row_number() over (partition by p.grade order by p.total_score desc, p.id) as grade_rank,
    decode(md5(p.id::text || public.current_biolearn_week()::text), 'hex') as hash_bytes
  from public.presentation_people p
  where p.batch_id = 'thesis-presentation-2026-09'
), scores as (
  select id, role, grade_rank, total_score,
    get_byte(hash_bytes, 0) as activity_seed,
    case when role = 'student' and grade_rank <= 12
      then 1 + get_byte(hash_bytes, 2) % 9 else 0 end as wins,
    case when role = 'student' and grade_rank <= 12
      then get_byte(hash_bytes, 3) % 6 else 0 end as losses,
    case when role = 'student' and grade_rank <= 12
      then 100 + (get_byte(hash_bytes, 0) * 13 + get_byte(hash_bytes, 1) * 7) % 1050
      else 0 end as map_score
  from ranked
)
update public.presentation_people p
set week_start = public.current_biolearn_week(),
    weekly_pvp_score = s.wins * 100,
    weekly_map_score = case when s.role = 'student' and s.grade_rank <= 12
      then least(s.map_score, greatest(0, s.total_score - s.wins * 100)) else 0 end,
    pvp_wins = s.wins,
    pvp_losses = s.losses,
    last_active_at = case when s.role = 'student' and s.grade_rank <= 12
      then now() - make_interval(days => s.activity_seed % ((now() at time zone 'Asia/Ho_Chi_Minh')::date - public.current_biolearn_week() + 1))
      when s.role = 'teacher' then now() - interval '1 day'
      else p.last_active_at end
from scores s
where p.id = s.id;

-- One PvP event for each ranked student, plus varied study activity on a recent day.
insert into public.presentation_activity (person_id, metric_date, feature)
select p.id, (p.last_active_at at time zone 'Asia/Ho_Chi_Minh')::date, 'pvp'
from public.presentation_people p
where p.batch_id = 'thesis-presentation-2026-09' and p.role = 'student' and p.weekly_pvp_score > 0;

insert into public.presentation_activity (person_id, metric_date, feature)
select p.id, (p.last_active_at at time zone 'Asia/Ho_Chi_Minh')::date,
  (array['learning_map','biology_3d','quiz','missions','mini_game'])[
    1 + get_byte(decode(md5(p.id::text || public.current_biolearn_week()::text), 'hex'), 4) % 5
  ]
from public.presentation_people p
where p.batch_id = 'thesis-presentation-2026-09' and p.role = 'student' and p.weekly_pvp_score > 0;

insert into public.presentation_activity (person_id, metric_date, feature)
select p.id, (p.last_active_at at time zone 'Asia/Ho_Chi_Minh')::date, 'quiz'
from public.presentation_people p
where p.batch_id = 'thesis-presentation-2026-09' and p.role = 'teacher';

do $$
begin
  if (select count(*) from public.presentation_people where batch_id = 'thesis-presentation-2026-09') <> 109 then
    raise exception 'Presentation profile count changed unexpectedly';
  end if;
  if exists (
    select grade from public.presentation_people
    where batch_id = 'thesis-presentation-2026-09' and role = 'student'
    group by grade having count(*) filter (
      where week_start = public.current_biolearn_week() and weekly_pvp_score > 0
    ) <> 12
  ) then
    raise exception 'A grade does not have exactly 12 ranked presentation students';
  end if;
  if exists (
    select 1 from public.presentation_people
    where batch_id = 'thesis-presentation-2026-09'
      and (weekly_pvp_score <> pvp_wins * 100
        or weekly_map_score + weekly_pvp_score > total_score)
  ) then
    raise exception 'Presentation score consistency check failed';
  end if;
end $$;

commit;

select public.current_biolearn_week() as week_start, grade, role,
  count(*) as people,
  count(*) filter (where weekly_pvp_score > 0) as pvp_ranked,
  count(*) filter (where weekly_map_score + weekly_pvp_score > 0) as weekly_ranked,
  min(weekly_map_score + weekly_pvp_score) filter (where role = 'student' and weekly_pvp_score > 0) as min_weekly_score,
  max(weekly_map_score + weekly_pvp_score) filter (where role = 'student' and weekly_pvp_score > 0) as max_weekly_score
from public.presentation_people
where batch_id = 'thesis-presentation-2026-09'
group by grade, role order by grade, role;
