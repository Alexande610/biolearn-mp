-- BioLearn achievement expansion: Vietnamese observances and secret chat missions.
-- Run after supabase_achievements_upgrade.sql. Safe to run repeatedly.

begin;

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

update public.profiles
set is_test_account = true, role = 'student'
where email = 'student.test@biolearn.vn';

update public.profiles
set is_test_account = false, role = 'teacher'
where email = 'teacher.test@biolearn.vn';

alter table public.achievement_catalog
  add column if not exists unlock_year integer;

alter table public.achievement_catalog
  drop constraint if exists achievement_catalog_unlock_kind_check;

alter table public.achievement_catalog
  add constraint achievement_catalog_unlock_kind_check
  check (unlock_kind in ('map_completion', 'calendar_day', 'exact_date', 'secret_phrase', 'future'));

alter table public.achievement_catalog
  drop constraint if exists achievement_catalog_unlock_year_check;

alter table public.achievement_catalog
  add constraint achievement_catalog_unlock_year_check
  check (unlock_year is null or unlock_year between 2020 and 2200);

insert into public.achievement_catalog
  (id, name, description, image_url, unlock_kind, class_id, unlock_year, unlock_month, unlock_day, sort_order, is_active)
values
  ('vietnamese-womens-day', 'Ngày Phụ nữ Việt Nam 20/10', 'Đăng nhập vào ngày 20 tháng 10.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788873733/Logo_danh_hi%E1%BB%87u_th%C3%A0nh_t%E1%BB%B1u_2010-Photoroom_ukzkp5.png', 'calendar_day', null, null, 10, 20, 11, true),
  ('hoang-sa-sovereignty', 'Hoàng Sa là của Việt Nam', 'Hoàn thành nhiệm vụ bí mật.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788873042/Danh_hi%E1%BB%87u_Ho%C3%A0ng_Sa_ch%E1%BB%A7_quy%E1%BB%81n_Vi%E1%BB%87t_Nam-Photoroom_fzseds.png', 'secret_phrase', null, null, null, null, 12, true),
  ('truong-sa-sovereignty', 'Trường Sa là của Việt Nam', 'Hoàn thành nhiệm vụ bí mật.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788873041/Danh_hi%E1%BB%87u_th%C3%A0nh_t%E1%BB%B1u_Tr%C6%B0%E1%BB%9Dng_Sa-Photoroom_cz0yho.png', 'secret_phrase', null, null, null, null, 13, true),
  ('vietnam-national-day', 'Quốc khánh Việt Nam 2/9', 'Đăng nhập vào ngày 2 tháng 9.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788873040/Danh_hi%E1%BB%87u_%C4%91%E1%BA%B7c_bi%E1%BB%87t_Qu%E1%BB%91c_kh%C3%A1nh_29-Photoroom_twnsgn.png', 'calendar_day', null, null, 9, 2, 14, true),
  ('tet-northern-vietnam', 'Tết miền Bắc Việt Nam', 'Điều kiện mở khóa sẽ được cập nhật sau.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788854905/Danh_hi%E1%BB%87u_Lunar_Year_2027_mi%E1%BB%81n_B%E1%BA%AFc_Vi%E1%BB%87t_Nam-Photoroom_blplmo.png', 'future', null, null, null, null, 15, true),
  ('tet-southern-vietnam', 'Tết miền Nam Việt Nam', 'Điều kiện mở khóa sẽ được cập nhật sau.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788854905/Danh_hi%E1%BB%87u_Lunar_Year_2027_Vi%E1%BB%87t_Nam_1_-Photoroom_umk4wk.png', 'future', null, null, null, null, 16, true),
  ('new-year-2027', 'Năm mới 2027', 'Đăng nhập đúng ngày 1 tháng 1 năm 2027.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788854905/Danh_hi%E1%BB%87u_New_Year_2027-Photoroom_icz4pi.png', 'exact_date', null, 2027, 1, 1, 17, true),
  ('christmas-day', 'Giáng sinh', 'Đăng nhập vào ngày 25 tháng 12.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788854904/Logo_danh_hi%E1%BB%87u_th%C3%A0nh_t%E1%BB%B1u_Noel-Photoroom_dxapv5.png', 'calendar_day', null, null, 12, 25, 18, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  unlock_kind = excluded.unlock_kind,
  class_id = excluded.class_id,
  unlock_year = excluded.unlock_year,
  unlock_month = excluded.unlock_month,
  unlock_day = excluded.unlock_day,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Keep the dedicated student tester synchronized with the whole catalog.
insert into public.user_achievements(user_id, achievement_id, unlock_source)
select p.id, c.id, 'test-account'
from public.profiles p
cross join public.achievement_catalog c
where p.email = 'student.test@biolearn.vn'
  and coalesce(p.is_test_account, false)
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
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  select class_progress, coalesce(is_test_account, false)
  into v_progress, v_is_test_account
  from public.profiles
  where id = v_user_id;

  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  if v_is_test_account then
    insert into public.user_achievements(user_id, achievement_id, unlock_source)
    select v_user_id, c.id, 'test-account'
    from public.achievement_catalog c
    where c.is_active
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

  insert into public.user_achievements(user_id, achievement_id, unlock_source)
  select v_user_id, c.id, format('exact-date-%s', to_char(v_today, 'YYYY-MM-DD'))
  from public.achievement_catalog c
  where c.is_active
    and c.unlock_kind = 'exact_date'
    and c.unlock_year = extract(year from v_today)::integer
    and c.unlock_month = extract(month from v_today)::integer
    and c.unlock_day = extract(day from v_today)::integer
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

create or replace function public.unlock_chat_achievement(p_phrase text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_phrase text;
  v_achievement_id text;
  v_inserted integer := 0;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id and role = 'student'
  ) then
    return jsonb_build_object('matched', false, 'awarded', false);
  end if;

  v_phrase := lower(regexp_replace(trim(coalesce(p_phrase, '')), '[[:space:]]+', ' ', 'g'));

  v_achievement_id := case v_phrase
    when 'hoàng sa là của việt nam' then 'hoang-sa-sovereignty'
    when 'trường sa là của việt nam' then 'truong-sa-sovereignty'
    else null
  end;

  if v_achievement_id is null then
    return jsonb_build_object('matched', false, 'awarded', false);
  end if;

  insert into public.user_achievements(user_id, achievement_id, unlock_source)
  select v_user_id, c.id, 'secret-chat-phrase'
  from public.achievement_catalog c
  where c.id = v_achievement_id and c.is_active
  on conflict (user_id, achievement_id) do nothing;

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'matched', true,
    'awarded', v_inserted = 1,
    'achievement_id', v_achievement_id
  );
end;
$$;

revoke all on function public.sync_my_achievements() from public, anon;
revoke all on function public.unlock_chat_achievement(text) from public, anon;
grant execute on function public.sync_my_achievements() to authenticated;
grant execute on function public.unlock_chat_achievement(text) to authenticated;

commit;

select id, name, unlock_kind, unlock_year, unlock_month, unlock_day, sort_order
from public.achievement_catalog
order by sort_order;
