-- Station content V2: additive, versioned and safe for a shared production project.
-- This migration does not delete or rename station_questions and does not change
-- existing station_progress rows. Run the companion cutover migration only after
-- the V2 client has been deployed and verified.

begin;

create extension if not exists pgcrypto;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

create table if not exists public.station_catalog (
  grade integer not null check (grade between 6 and 12),
  station_id text primary key,
  station_order integer not null check (station_order between 1 and 4),
  name text not null check (length(trim(name)) > 0),
  subtitle text not null default '',
  days_count integer not null default 10 check (days_count = 10),
  start_day integer not null,
  is_future boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (grade, station_order),
  unique (grade, station_id),
  check (station_id = case when is_future then 'g' || grade || '_future' else 'g' || grade || '_st' || station_order end),
  check (start_day = ((station_order - 1) * 10) + 1)
);

create table if not exists public.station_content_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (length(trim(version)) > 0),
  grade integer not null check (grade between 6 and 12),
  station_id text not null,
  title text not null check (length(trim(title)) > 0),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  notes text not null default '',
  created_by uuid not null default auth.uid() references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (grade, station_id) references public.station_catalog(grade, station_id),
  unique (id, grade, station_id)
);

create table if not exists public.station_content_items (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.station_content_releases(id) on delete cascade,
  grade integer not null check (grade between 6 and 12),
  station_id text not null,
  day_index integer not null check (day_index between 1 and 10),
  game_index integer not null check (game_index between 1 and 5),
  game_type text not null check (game_type in ('quiz', 'match', 'fill', 'category', 'dragdrop')),
  title text not null check (length(trim(title)) > 0),
  learning_objective text not null check (length(trim(learning_objective)) > 0),
  public_content jsonb not null check (jsonb_typeof(public_content) = 'object'),
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'object'),
  source_refs jsonb not null check (jsonb_typeof(source_refs) = 'array' and jsonb_array_length(source_refs) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (release_id, grade, station_id)
    references public.station_content_releases(id, grade, station_id) on delete cascade,
  unique (release_id, day_index, game_index),
  unique (release_id, day_index, game_type)
);

create or replace function public.guard_published_station_content()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_release_id uuid := coalesce(new.release_id, old.release_id);
  v_status text;
begin
  select status into v_status from public.station_content_releases where id = v_release_id;
  if v_status in ('published', 'archived') then
    raise exception 'published_release_content_is_immutable';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists station_content_items_immutable on public.station_content_items;
create trigger station_content_items_immutable
before insert or update or delete on public.station_content_items
for each row execute function public.guard_published_station_content();

create table if not exists public.station_content_publications (
  grade integer not null check (grade between 6 and 12),
  station_id text not null,
  release_id uuid not null unique references public.station_content_releases(id),
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now(),
  primary key (grade, station_id),
  foreign key (grade, station_id) references public.station_catalog(grade, station_id)
);

create table if not exists public.station_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  release_id uuid not null references public.station_content_releases(id),
  grade integer not null check (grade between 6 and 12),
  station_id text not null,
  day_index integer not null check (day_index between 1 and 10),
  game_order uuid[] not null check (cardinality(game_order) = 5),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  correct_count integer not null default 0 check (correct_count between 0 and 5),
  stars integer not null default 0 check (stars between 0 and 3),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.station_attempt_answers (
  attempt_id uuid not null references public.station_attempts(id) on delete cascade,
  item_id uuid not null references public.station_content_items(id),
  attempt_no integer not null check (attempt_no in (1, 2)),
  submitted_answer jsonb not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (attempt_id, item_id, attempt_no)
);

create table if not exists public.station_attempt_results (
  attempt_id uuid not null references public.station_attempts(id) on delete cascade,
  item_id uuid not null references public.station_content_items(id),
  is_correct boolean not null,
  resolved_at timestamptz not null default now(),
  primary key (attempt_id, item_id)
);

alter table public.station_catalog enable row level security;
alter table public.station_content_releases enable row level security;
alter table public.station_content_items enable row level security;
alter table public.station_content_publications enable row level security;
alter table public.station_attempts enable row level security;
alter table public.station_attempt_answers enable row level security;
alter table public.station_attempt_results enable row level security;

revoke all on public.station_content_releases, public.station_content_items,
  public.station_content_publications, public.station_attempts,
  public.station_attempt_answers, public.station_attempt_results
from public, anon, authenticated;

grant select on public.station_catalog to anon, authenticated;
grant select, insert, update, delete on public.station_content_releases, public.station_content_items to authenticated;
grant select on public.station_attempts, public.station_attempt_answers, public.station_attempt_results to authenticated;

drop policy if exists station_catalog_public_read on public.station_catalog;
create policy station_catalog_public_read on public.station_catalog
for select to anon, authenticated using (true);

drop policy if exists station_catalog_admin_write on public.station_catalog;
create policy station_catalog_admin_write on public.station_catalog
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists station_releases_admin_all on public.station_content_releases;
create policy station_releases_admin_all on public.station_content_releases
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists station_items_admin_all on public.station_content_items;
create policy station_items_admin_all on public.station_content_items
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists station_attempts_own_read on public.station_attempts;
create policy station_attempts_own_read on public.station_attempts
for select to authenticated using (user_id = auth.uid());

drop policy if exists station_attempt_answers_own_read on public.station_attempt_answers;
create policy station_attempt_answers_own_read on public.station_attempt_answers
for select to authenticated using (
  exists (select 1 from public.station_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

drop policy if exists station_attempt_results_own_read on public.station_attempt_results;
create policy station_attempt_results_own_read on public.station_attempt_results
for select to authenticated using (
  exists (select 1 from public.station_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

insert into public.station_catalog(grade, station_id, station_order, name, subtitle, days_count, start_day, is_future)
values
  (6,'g6_st1',1,'Trạm 1: Kính Hiển Vi & Tế Bào','Kính hiển vi quang học, tế bào và các thành phần của tế bào',10,1,false),
  (6,'g6_st2',2,'Trạm 2: Từ Tế Bào Đến Cơ Thể','Cơ thể đơn bào, đa bào, mô, cơ quan và hệ cơ quan',10,11,false),
  (6,'g6_st3',3,'Trạm 3: Đa Dạng Thế Giới Sống','Phân loại, virus, vi khuẩn, nguyên sinh vật, nấm, thực vật và động vật',10,21,false),
  (6,'g6_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (7,'g7_st1',1,'Trạm 1: Quang Hợp & Dinh Dưỡng Thực Vật','Quang hợp, nước, chất dinh dưỡng và vận chuyển ở thực vật',10,1,false),
  (7,'g7_st2',2,'Trạm 2: Hô Hấp & Trao Đổi Ở Sinh Vật','Hô hấp tế bào, trao đổi khí và dinh dưỡng ở động vật',10,11,false),
  (7,'g7_st3',3,'Trạm 3: Cảm Ứng, Sinh Trưởng & Sinh Sản','Cảm ứng, tập tính, sinh trưởng, phát triển và sinh sản',10,21,false),
  (7,'g7_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (8,'g8_st1',1,'Trạm 1: Vận Động, Dinh Dưỡng & Tuần Hoàn','Khái quát cơ thể người, vận động, tiêu hoá, máu và tuần hoàn',10,1,false),
  (8,'g8_st2',2,'Trạm 2: Điều Hoà Cơ Thể Người','Hô hấp, bài tiết, nội môi, thần kinh, nội tiết, da và sinh sản',10,11,false),
  (8,'g8_st3',3,'Trạm 3: Sinh Vật & Môi Trường','Quần thể, quần xã, hệ sinh thái, sinh quyển và bảo vệ môi trường',10,21,false),
  (8,'g8_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (9,'g9_st1',1,'Trạm 1: Mendel, Nucleic Acid & Gene','Di truyền học, quy luật Mendel, DNA, RNA và biểu hiện gene',10,1,false),
  (9,'g9_st2',2,'Trạm 2: Gene, Nhiễm Sắc Thể & Di Truyền Người','Đột biến, phân bào, giới tính, liên kết gene và công nghệ di truyền',10,11,false),
  (9,'g9_st3',3,'Trạm 3: Tiến Hoá','Chọn lọc, cơ chế tiến hoá và sự phát sinh, phát triển của sự sống',10,21,false),
  (9,'g9_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (10,'g10_st1',1,'Trạm 1: Thành Phần Hoá Học & Cấu Trúc Tế Bào','Nước, phân tử sinh học, tế bào nhân sơ và tế bào nhân thực',10,1,false),
  (10,'g10_st2',2,'Trạm 2: Trao Đổi & Chuyển Hoá Trong Tế Bào','Màng tế bào, truyền tin, enzyme và chuyển hoá năng lượng',10,11,false),
  (10,'g10_st3',3,'Trạm 3: Phân Bào, Vi Sinh Vật & Virus','Chu kì tế bào, công nghệ tế bào, vi sinh vật và virus',10,21,false),
  (10,'g10_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (11,'g11_st1',1,'Trạm 1: Trao Đổi Chất & Chuyển Hoá Năng Lượng','Trao đổi ở thực vật và động vật, miễn dịch và cân bằng nội môi',10,1,false),
  (11,'g11_st2',2,'Trạm 2: Cảm Ứng, Sinh Trưởng & Phát Triển','Cảm ứng, tập tính, sinh trưởng và phát triển ở sinh vật',10,11,false),
  (11,'g11_st3',3,'Trạm 3: Sinh Sản & Tích Hợp Sinh Lí','Sinh sản, mối liên hệ giữa các quá trình sinh lí và ngành nghề',10,21,false),
  (11,'g11_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true),
  (12,'g12_st1',1,'Trạm 1: Di Truyền Phân Tử & Nhiễm Sắc Thể','DNA, gene, biểu hiện gene, Mendel và di truyền nhiễm sắc thể',10,1,false),
  (12,'g12_st2',2,'Trạm 2: Di Truyền Mở Rộng & Tiến Hoá','Di truyền ngoài nhân, quần thể, chọn lọc và tiến hoá',10,11,false),
  (12,'g12_st3',3,'Trạm 3: Sinh Thái, Bảo Tồn & Phát Triển Bền Vững','Quần thể, quần xã, hệ sinh thái, bảo tồn và phát triển bền vững',10,21,false),
  (12,'g12_future',4,'Trạm Khai Phá - Sắp Ra Mắt','Vùng biển tri thức nâng cao đang được xây dựng...',10,31,true)
on conflict (station_id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  updated_at = now();

create or replace function public.admin_publish_station_release(p_release_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.station_content_releases%rowtype;
  v_bad_days integer;
begin
  if not public.is_app_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select * into v_release from public.station_content_releases
  where id = p_release_id for update;
  if not found then raise exception 'release_not_found'; end if;

  select count(*) into v_bad_days
  from generate_series(1, 10) day_no
  where (select count(*) from public.station_content_items i where i.release_id = p_release_id and i.day_index = day_no) <> 5
     or (select count(distinct i.game_type) from public.station_content_items i where i.release_id = p_release_id and i.day_index = day_no) <> 5;
  if v_bad_days > 0 then raise exception 'release_requires_10_days_with_5_unique_games_each'; end if;

  update public.station_content_releases r
  set status = 'archived', updated_at = now()
  where r.id in (
    select p.release_id from public.station_content_publications p
    where p.grade = v_release.grade and p.station_id = v_release.station_id
  ) and r.id <> p_release_id;

  insert into public.station_content_publications(grade, station_id, release_id, published_by, published_at)
  values(v_release.grade, v_release.station_id, p_release_id, auth.uid(), now())
  on conflict (grade, station_id) do update
  set release_id = excluded.release_id, published_by = excluded.published_by, published_at = excluded.published_at;

  update public.station_content_releases
  set status = 'published', reviewed_by = auth.uid(), published_at = now(), updated_at = now()
  where id = p_release_id;

  return jsonb_build_object('published', true, 'release_id', p_release_id, 'version', v_release.version);
end;
$$;

revoke all on function public.admin_publish_station_release(uuid) from public, anon;
grant execute on function public.admin_publish_station_release(uuid) to authenticated;

create or replace function public.start_station_attempt(p_grade integer, p_station_id text, p_day_index integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_release_id uuid;
  v_attempt_id uuid;
  v_order uuid[];
  v_games jsonb;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_grade not between 6 and 12 or p_day_index not between 1 and 10 then raise exception 'invalid_station_day'; end if;

  if not exists (
    select 1 from public.station_catalog c
    where c.grade = p_grade and c.station_id = p_station_id and not c.is_future
  ) then raise exception 'invalid_station'; end if;

  if p_day_index > 1 and not exists (
    select 1 from public.station_progress sp
    where sp.user_id = v_user and sp.station_id = p_station_id
      and sp.day_index = p_day_index - 1 and sp.stars > 0
  ) then raise exception 'previous_day_required'; end if;

  select p.release_id into v_release_id
  from public.station_content_publications p
  join public.station_content_releases r on r.id = p.release_id and r.status = 'published'
  where p.grade = p_grade and p.station_id = p_station_id;
  if v_release_id is null then raise exception 'station_content_not_published'; end if;

  select array_agg(i.id order by random()) into v_order
  from public.station_content_items i
  where i.release_id = v_release_id and i.day_index = p_day_index;
  if cardinality(v_order) <> 5 then raise exception 'published_stage_is_incomplete'; end if;

  insert into public.station_attempts(user_id, release_id, grade, station_id, day_index, game_order)
  values(v_user, v_release_id, p_grade, p_station_id, p_day_index, v_order)
  returning id into v_attempt_id;

  select jsonb_agg(jsonb_build_object(
    'id', i.id,
    'type', i.game_type,
    'title', i.title,
    'content', i.public_content
  ) order by array_position(v_order, i.id)) into v_games
  from public.station_content_items i where i.id = any(v_order);

  return jsonb_build_object('attempt_id', v_attempt_id, 'release_id', v_release_id, 'games', v_games);
end;
$$;

revoke all on function public.start_station_attempt(integer, text, integer) from public, anon;
grant execute on function public.start_station_attempt(integer, text, integer) to authenticated;

create or replace function public.submit_station_answer(
  p_attempt_id uuid,
  p_item_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.station_attempts%rowtype;
  v_item public.station_content_items%rowtype;
  v_attempt_no integer;
  v_is_correct boolean := false;
  v_resolved boolean := false;
  v_resolved_count integer := 0;
  v_correct_count integer := 0;
  v_stars integer := 0;
  v_reward jsonb := '{}'::jsonb;
  v_submitted_text text;
  v_expected_text text;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_answer is null then raise exception 'answer_required'; end if;

  select * into v_attempt from public.station_attempts
  where id = p_attempt_id and user_id = v_user for update;
  if not found then raise exception 'attempt_not_found' using errcode = '42501'; end if;
  if v_attempt.status <> 'active' then raise exception 'attempt_is_not_active'; end if;
  if not (p_item_id = any(v_attempt.game_order)) then raise exception 'item_not_in_attempt'; end if;
  if exists (
    select 1 from public.station_attempt_results r
    where r.attempt_id = p_attempt_id and r.item_id = p_item_id
  ) then raise exception 'game_already_resolved'; end if;

  select * into v_item from public.station_content_items
  where id = p_item_id and release_id = v_attempt.release_id and day_index = v_attempt.day_index;
  if not found then raise exception 'content_item_not_found'; end if;

  select count(*) + 1 into v_attempt_no
  from public.station_attempt_answers a
  where a.attempt_id = p_attempt_id and a.item_id = p_item_id;
  if v_attempt_no > 2 then raise exception 'maximum_attempts_reached'; end if;

  if v_item.game_type in ('quiz', 'fill', 'dragdrop') then
    v_submitted_text := lower(regexp_replace(trim(coalesce(p_answer ->> 'value', '')), '\s+', ' ', 'g'));
    v_expected_text := lower(regexp_replace(trim(coalesce(v_item.answer_key ->> 'value', '')), '\s+', ' ', 'g'));
    v_is_correct := v_submitted_text <> '' and v_submitted_text = v_expected_text;
  elsif v_item.game_type in ('match', 'category') then
    v_is_correct := (p_answer -> 'value') = (v_item.answer_key -> 'value');
  end if;

  insert into public.station_attempt_answers(attempt_id, item_id, attempt_no, submitted_answer, is_correct)
  values(p_attempt_id, p_item_id, v_attempt_no, p_answer, v_is_correct);

  v_resolved := v_is_correct or v_attempt_no = 2;
  if v_resolved then
    insert into public.station_attempt_results(attempt_id, item_id, is_correct)
    values(p_attempt_id, p_item_id, v_is_correct);
  end if;

  select count(*), count(*) filter (where is_correct)
  into v_resolved_count, v_correct_count
  from public.station_attempt_results r where r.attempt_id = p_attempt_id;

  if v_resolved_count = 5 then
    v_stars := case v_correct_count when 5 then 3 when 4 then 2 when 3 then 1 else 0 end;
    update public.station_attempts
    set status = 'completed', correct_count = v_correct_count, stars = v_stars, completed_at = now()
    where id = p_attempt_id;
    select public.claim_station_reward(v_attempt.station_id, v_attempt.day_index, v_stars) into v_reward;
  end if;

  return jsonb_build_object(
    'correct', v_is_correct,
    'attempt_no', v_attempt_no,
    'resolved', v_resolved,
    'can_retry', not v_resolved,
    'explanation', case when v_resolved then v_item.answer_key ->> 'explanation' else null end,
    'answer_reveal', case when v_resolved then v_item.answer_key -> 'value' else null end,
    'stage_complete', v_resolved_count = 5,
    'correct_count', v_correct_count,
    'stars', v_stars,
    'reward', v_reward
  );
end;
$$;

revoke all on function public.submit_station_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_station_answer(uuid, uuid, jsonb) to authenticated;

commit;
