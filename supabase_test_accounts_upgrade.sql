-- BioLearn test-account controls.
-- Safe to run repeatedly after supabase_achievements_upgrade.sql.

begin;

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

-- Only the dedicated student account receives test capabilities.
update public.profiles
set is_test_account = (email = 'student.test@biolearn.vn')
where email in ('student.test@biolearn.vn', 'teacher.test@biolearn.vn');

update public.profiles
set role = 'student'
where email = 'student.test@biolearn.vn';

update public.profiles
set role = 'teacher', is_test_account = false
where email = 'teacher.test@biolearn.vn';

-- Give the dedicated student tester every catalog achievement, including
-- calendar and future achievements. Existing ownership is preserved.
insert into public.user_achievements(user_id, achievement_id, unlock_source)
select p.id, c.id, 'test-account'
from public.profiles p
cross join public.achievement_catalog c
where p.email = 'student.test@biolearn.vn'
on conflict (user_id, achievement_id) do nothing;

create or replace function public.sync_my_achievements()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := timezone('Asia/Ho_Chi_Minh', now())::date;
  v_progress jsonb;
  v_is_test_account boolean := false;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select class_progress, coalesce(is_test_account, false)
  into v_progress, v_is_test_account
  from public.profiles
  where id = v_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_is_test_account then
    insert into public.user_achievements(user_id, achievement_id, unlock_source)
    select v_user_id, c.id, 'test-account'
    from public.achievement_catalog c
    on conflict (user_id, achievement_id) do nothing;
    return;
  end if;

  perform public.award_map_achievements_for_user(v_user_id, v_progress);

  insert into public.user_achievements(user_id, achievement_id, unlock_source)
  select v_user_id, c.id, format('calendar-%s', to_char(v_today, 'MM-DD'))
  from public.achievement_catalog c
  where c.is_active
    and c.unlock_kind = 'calendar_day'
    and c.unlock_month = extract(month from v_today)::integer
    and c.unlock_day = extract(day from v_today)::integer
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.sync_my_achievements() from public, anon;
grant execute on function public.sync_my_achievements() to authenticated;

commit;

-- Verification (read-only): the student count should equal the active catalog
-- size; the teacher remains false with no test grants.
select
  p.email,
  p.role,
  p.is_test_account,
  count(ua.achievement_id) filter (where ua.unlock_source = 'test-account') as test_achievements
from public.profiles p
left join public.user_achievements ua on ua.user_id = p.id
where p.email in ('student.test@biolearn.vn', 'teacher.test@biolearn.vn')
group by p.id, p.email, p.role, p.is_test_account
order by p.email;
