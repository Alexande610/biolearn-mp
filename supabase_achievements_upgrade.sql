-- BioLearn achievements: ownership, automatic unlocks, and equipped badge.
-- Safe to run repeatedly after the existing unified/reward migrations.

begin;

create table if not exists public.achievement_catalog (
  id text primary key,
  name text not null,
  description text not null,
  image_url text,
  unlock_kind text not null check (unlock_kind in ('map_completion', 'calendar_day', 'future')),
  class_id integer check (class_id between 6 and 12),
  unlock_month integer check (unlock_month between 1 and 12),
  unlock_day integer check (unlock_day between 1 and 31),
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.achievement_catalog
  (id, name, description, image_url, unlock_kind, class_id, unlock_month, unlock_day, sort_order, is_active)
values
  ('map-class-6',  'Nhà thám hiểm Sinh học 6',  'Hoàn thành 100% map Sinh học lớp 6.',  'https://res.cloudinary.com/de513yqvf/image/upload/v1788840350/Danh_hi%E1%BB%87u_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_6-Photoroom_b7dno9.png', 'map_completion', 6,  null, null, 1, true),
  ('map-class-7',  'Nhà thám hiểm Sinh học 7',  'Hoàn thành 100% map Sinh học lớp 7.',  'https://res.cloudinary.com/de513yqvf/image/upload/v1788840352/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_map_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_7-Photoroom_nwzkqp.png', 'map_completion', 7,  null, null, 2, true),
  ('map-class-8',  'Nhà thám hiểm Sinh học 8',  'Hoàn thành 100% map Sinh học lớp 8.',  'https://res.cloudinary.com/de513yqvf/image/upload/v1788840351/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_8-Photoroom_u6xnpl.png', 'map_completion', 8,  null, null, 3, true),
  ('map-class-9',  'Nhà thám hiểm Sinh học 9',  'Hoàn thành 100% map Sinh học lớp 9.',  'https://res.cloudinary.com/de513yqvf/image/upload/v1788798439/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_9_dpjx99.png', 'map_completion', 9,  null, null, 4, true),
  ('map-class-10', 'Nhà thám hiểm Sinh học 10', 'Hoàn thành 100% map Sinh học lớp 10.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840350/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_10-Photoroom_izdsaz.png', 'map_completion', 10, null, null, 5, true),
  ('map-class-11', 'Nhà thám hiểm Sinh học 11', 'Hoàn thành 100% map Sinh học lớp 11.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840554/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_11-Photoroom_c38ohx.png', 'map_completion', 11, null, null, 6, true),
  ('map-class-12', 'Nhà thám hiểm Sinh học 12', 'Hoàn thành 100% map Sinh học lớp 12.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840551/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_12-Photoroom_rowlas.png', 'map_completion', 12, null, null, 7, true),
  ('bio-diversity-day', 'Ngày Quốc tế Đa dạng Sinh học', 'Đăng nhập vào ngày 22 tháng 5.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840352/Danh_hi%E1%BB%87u_Ng%C3%A0y_Qu%E1%BB%91c_t%E1%BA%BF_%C4%90a_d%E1%BA%A1ng_Sinh_h%E1%BB%8Dc-Photoroom_kez1kj.png', 'calendar_day', null, 5, 22, 8, true),
  ('teachers-day', 'Ngày Nhà giáo Việt Nam', 'Đăng nhập vào ngày 20 tháng 11.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840351/Danh_hi%E1%BB%87u_%C4%91%E1%BA%B7c_bi%E1%BB%87t_2011-Photoroom_avbelo.png', 'calendar_day', null, 11, 20, 9, true),
  ('one-year', 'Kỷ niệm một năm', 'Điều kiện mở khóa sẽ được cập nhật sau.', 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840356/Danh_hi%E1%BB%87u_th%C3%A0nh_t%E1%BB%B1u_k%E1%BB%B7_ni%E1%BB%87m_1_n%C4%83m-Photoroom_xh6bku.png', 'future', null, null, null, 10, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  unlock_kind = excluded.unlock_kind,
  class_id = excluded.class_id,
  unlock_month = excluded.unlock_month,
  unlock_day = excluded.unlock_day,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievement_catalog(id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  unlock_source text not null,
  primary key (user_id, achievement_id)
);

create table if not exists public.user_achievement_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  achievement_id text not null,
  equipped_at timestamptz not null default now(),
  foreign key (user_id, achievement_id)
    references public.user_achievements(user_id, achievement_id)
    on delete cascade
);

create index if not exists user_achievements_user_unlocked_idx
  on public.user_achievements(user_id, unlocked_at desc);

alter table public.achievement_catalog enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_achievement_preferences enable row level security;

drop policy if exists achievement_catalog_read on public.achievement_catalog;
create policy achievement_catalog_read
  on public.achievement_catalog for select to authenticated
  using (is_active);

drop policy if exists user_achievements_read_own on public.user_achievements;
create policy user_achievements_read_own
  on public.user_achievements for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_achievement_preferences_read_own on public.user_achievement_preferences;
create policy user_achievement_preferences_read_own
  on public.user_achievement_preferences for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.biolearn_class_completion_percent(
  p_class_progress jsonb,
  p_class_id integer
)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_completed jsonb := coalesce(p_class_progress -> p_class_id::text -> 'completedLevels', '[]'::jsonb);
  v_structure jsonb;
  v_chapter jsonb;
  v_lesson jsonb;
  v_chapter_id integer;
  v_completed_count integer := 0;
  v_total integer := 0;
  v_level integer;
  v_practice integer;
begin
  v_structure := case p_class_id
    when 6 then '[{"id":1,"lessons":[1,2,3]},{"id":2,"lessons":[4,5]},{"id":3,"lessons":[6,7,8,9,10]}]'::jsonb
    when 7 then '[{"id":1,"lessons":[1,2,3]},{"id":2,"lessons":[4,5]}]'::jsonb
    when 8 then '[{"id":1,"lessons":[1,2,3]}]'::jsonb
    when 9 then '[{"id":1,"lessons":[1,2]}]'::jsonb
    when 10 then '[{"id":1,"lessons":[1,2,3]},{"id":2,"lessons":[4,5,6]},{"id":3,"lessons":[7,8,9]},{"id":4,"lessons":[10,11,12]},{"id":5,"lessons":[13,14]},{"id":6,"lessons":[16,17,19]},{"id":7,"lessons":[21,22]},{"id":8,"lessons":[24,25]}]'::jsonb
    when 11 then '[{"id":1,"lessons":[1,2,4,6,8,9,10]},{"id":2,"lessons":[14,15,17,18]},{"id":3,"lessons":[19,20,22]},{"id":4,"lessons":[24,25,27]}]'::jsonb
    when 12 then '[{"id":1,"lessons":[1,2,3,4]},{"id":2,"lessons":[6,7,10,11]},{"id":3,"lessons":[8]},{"id":4,"lessons":[12]}]'::jsonb
    else '[]'::jsonb
  end;

  for v_chapter in select value from jsonb_array_elements(v_structure)
  loop
    v_chapter_id := (v_chapter ->> 'id')::integer;
    v_total := v_total + jsonb_array_length(v_chapter -> 'lessons') * 10 + 2;

    if v_completed ? format('%s_review_0', v_chapter_id) then
      v_completed_count := v_completed_count + jsonb_array_length(v_chapter -> 'lessons') * 10 + 2;
      continue;
    end if;

    for v_lesson in select value from jsonb_array_elements(v_chapter -> 'lessons')
    loop
      for v_level in 0..9 loop
        if v_completed ? format('%s_%s_%s', v_chapter_id, v_lesson #>> '{}', v_level) then
          v_completed_count := v_completed_count + 1;
        end if;
      end loop;
    end loop;

    for v_practice in 0..1 loop
      if v_completed ? format('%s_99_%s', v_chapter_id, v_practice)
         or v_completed ? format('%s_practice_%s', v_chapter_id, v_practice) then
        v_completed_count := v_completed_count + 1;
      end if;
    end loop;
  end loop;

  if v_total = 0 then return 0; end if;
  return least(100, round(v_completed_count * 100.0 / v_total)::integer);
end;
$$;

create or replace function public.award_map_achievements_for_user(
  p_user_id uuid,
  p_class_progress jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class integer;
begin
  for v_class in 6..12 loop
    if public.biolearn_class_completion_percent(p_class_progress, v_class) >= 100 then
      insert into public.user_achievements(user_id, achievement_id, unlock_source)
      values (p_user_id, format('map-class-%s', v_class), format('map-class-%s-complete', v_class))
      on conflict (user_id, achievement_id) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.sync_profile_map_achievements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_map_achievements_for_user(new.id, new.class_progress);
  return new;
end;
$$;

drop trigger if exists profiles_sync_map_achievements on public.profiles;
create trigger profiles_sync_map_achievements
after insert or update of class_progress on public.profiles
for each row execute function public.sync_profile_map_achievements();

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
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select class_progress into v_progress
  from public.profiles
  where id = v_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
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

create or replace function public.equip_my_achievement(p_achievement_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_achievement_id is null then
    delete from public.user_achievement_preferences where user_id = v_user_id;
    return;
  end if;

  if not exists (
    select 1 from public.user_achievements
    where user_id = v_user_id and achievement_id = p_achievement_id
  ) then
    raise exception 'ACHIEVEMENT_NOT_UNLOCKED';
  end if;

  insert into public.user_achievement_preferences(user_id, achievement_id, equipped_at)
  values (v_user_id, p_achievement_id, now())
  on conflict (user_id) do update set
    achievement_id = excluded.achievement_id,
    equipped_at = excluded.equipped_at;
end;
$$;

revoke all on public.achievement_catalog from anon, authenticated;
revoke all on public.user_achievements from anon, authenticated;
revoke all on public.user_achievement_preferences from anon, authenticated;
revoke all on function public.award_map_achievements_for_user(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.sync_profile_map_achievements() from public, anon, authenticated;
revoke all on function public.sync_my_achievements() from public, anon;
revoke all on function public.equip_my_achievement(text) from public, anon;

grant select on public.achievement_catalog to authenticated;
grant select on public.user_achievements to authenticated;
grant select on public.user_achievement_preferences to authenticated;
grant execute on function public.sync_my_achievements() to authenticated;
grant execute on function public.equip_my_achievement(text) to authenticated;

-- Backfill map achievements for existing profiles. Calendar achievements are not backdated.
do $$
declare
  v_profile record;
begin
  for v_profile in select id, class_progress from public.profiles loop
    perform public.award_map_achievements_for_user(v_profile.id, v_profile.class_progress);
  end loop;
end;
$$;

commit;
