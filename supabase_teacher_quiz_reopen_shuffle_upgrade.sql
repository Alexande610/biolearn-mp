-- BioLearn - room revision/reopen + per-student shuffle upgrade (2026-08-26)
-- Chạy TOÀN BỘ file này SAU các migration Teacher Quiz trước đó.
-- Migration không xóa phòng, attempts hoặc answers cũ.

-- Bảo đảm migration có thể chạy an toàn cả khi bản sửa closed_at trước đó chưa chạy hết.
alter table public.quiz_rooms add column if not exists closed_at timestamptz;
alter table public.quiz_rooms add column if not exists close_reason text;

-- 1) Mỗi lần mở lại là một bản ghi/ID mới trong cùng một chuỗi phòng.
alter table public.quiz_rooms add column if not exists room_series_id uuid;
alter table public.quiz_rooms add column if not exists reopened_from_id uuid;
alter table public.quiz_rooms add column if not exists revision integer not null default 1;

update public.quiz_rooms set room_series_id = id where room_series_id is null;

alter table public.quiz_rooms alter column room_series_id set not null;
alter table public.quiz_rooms drop constraint if exists quiz_rooms_room_series_fk;
alter table public.quiz_rooms add constraint quiz_rooms_room_series_fk
  foreign key (room_series_id) references public.quiz_rooms(id) on delete restrict;
alter table public.quiz_rooms drop constraint if exists quiz_rooms_reopened_from_fk;
alter table public.quiz_rooms add constraint quiz_rooms_reopened_from_fk
  foreign key (reopened_from_id) references public.quiz_rooms(id) on delete restrict;
alter table public.quiz_rooms drop constraint if exists quiz_rooms_revision_check;
alter table public.quiz_rooms add constraint quiz_rooms_revision_check check (revision >= 1);

create or replace function public.prepare_reopened_quiz_room()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parent_series uuid;
  v_next_revision integer;
begin
  if new.reopened_from_id is not null then
    select coalesce(room_series_id, id)
      into v_parent_series
    from public.quiz_rooms
    where id = new.reopened_from_id and teacher_id = new.teacher_id;

    if v_parent_series is null then
      raise exception 'Phòng nguồn không tồn tại hoặc không thuộc Giáo viên hiện tại';
    end if;

    new.room_series_id := v_parent_series;
    select coalesce(max(revision), 0) + 1
      into v_next_revision
    from public.quiz_rooms
    where room_series_id = v_parent_series;
    new.revision := v_next_revision;
  elsif new.room_series_id is null then
    new.room_series_id := new.id;
    new.revision := 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prepare_reopened_quiz_room on public.quiz_rooms;
create trigger trg_prepare_reopened_quiz_room
before insert on public.quiz_rooms
for each row execute function public.prepare_reopened_quiz_room();

-- Room code được phép lặp trong lịch sử, nhưng chỉ có một phiên hoạt động cho cùng mã.
alter table public.quiz_rooms drop constraint if exists quiz_rooms_room_code_key;
drop index if exists public.quiz_rooms_room_code_key;
create unique index if not exists quiz_rooms_one_active_room_code
  on public.quiz_rooms (upper(room_code))
  where status in ('waiting', 'playing');
create index if not exists quiz_rooms_series_revision_idx
  on public.quiz_rooms (room_series_id, revision desc);
create unique index if not exists quiz_rooms_unique_series_revision
  on public.quiz_rooms (room_series_id, revision);

-- Giới hạn 2 Quiz theo lịch chỉ tính các phiên đang hoạt động;
-- phòng đã đóng vẫn được giữ trong lịch sử và không chặn thao tác mở lại.
create or replace function public.enforce_assignment_room_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.room_type = 'assignment'
     and new.archived_at is null
     and new.status in ('waiting', 'playing')
     and (
       select count(*) from public.quiz_rooms r
       where r.teacher_id = new.teacher_id
         and r.room_type = 'assignment'
         and r.archived_at is null
         and r.status in ('waiting', 'playing')
         and r.id <> new.id
     ) >= 2 then
    raise exception 'Mỗi Giáo viên chỉ được mở tối đa 2 bài quiz giao theo lịch';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_quiz_assignment_limit on public.quiz_rooms;
create trigger trg_quiz_assignment_limit
before insert or update of archived_at, room_type, status on public.quiz_rooms
for each row execute function public.enforce_assignment_room_limit();

-- 2) Lưu đúng thứ tự cá nhân hóa mà từng học viên đã nhận.
alter table public.quiz_attempts add column if not exists question_order jsonb not null default '[]'::jsonb;
alter table public.quiz_attempts add column if not exists option_orders jsonb not null default '{}'::jsonb;

-- 3) RPC luôn chọn phiên đang hoạt động mới nhất của mã phòng.
-- Chỉ trả câu hỏi đã loại correctAnswer/explanation.
drop function if exists public.get_quiz_room_for_player(text);
create function public.get_quiz_room_for_player(p_room_code text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', r.id,
    'room_code', r.room_code,
    'title', r.title,
    'status', r.status,
    'room_type', r.room_type,
    'opens_at', r.opens_at,
    'closes_at', r.closes_at,
    'archived_at', r.archived_at,
    'closed_at', r.closed_at,
    'close_reason', r.close_reason,
    'question_time_seconds', r.question_time_seconds,
    'room_series_id', r.room_series_id,
    'revision', r.revision,
    'settings', jsonb_build_object(
      'shuffleQuestions', coalesce(r.settings->'shuffleQuestions', 'false'::jsonb),
      'shuffleAnswers', coalesce(r.settings->'shuffleAnswers', 'false'::jsonb)
    ),
    'questions', case
      when r.room_type = 'assignment' and r.status in ('waiting', 'playing') then
        coalesce((
          select jsonb_agg(jsonb_build_object(
            'question', q.value->'question',
            'options', q.value->'options'
          ) order by q.ordinality)
          from jsonb_array_elements(r.questions) with ordinality q(value, ordinality)
        ), '[]'::jsonb)
      else '[]'::jsonb
    end,
    'teacher_name', coalesce(p.display_name, 'Giáo viên')
  )
  from public.quiz_rooms r
  left join public.profiles p on p.id = r.teacher_id
  where upper(r.room_code) = upper(trim(p_room_code))
  order by
    case when r.status in ('waiting', 'playing') then 0 else 1 end,
    r.created_at desc,
    r.revision desc
  limit 1;
$$;

revoke all on function public.get_quiz_room_for_player(text) from public;
grant execute on function public.get_quiz_room_for_player(text) to authenticated;

-- 4) Kiểm tra cuối. Tất cả giá trị phải là true.
select
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quiz_rooms' and column_name = 'room_series_id') as room_series_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quiz_rooms' and column_name = 'reopened_from_id') as reopen_link_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quiz_attempts' and column_name = 'question_order') as question_order_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quiz_attempts' and column_name = 'option_orders') as option_orders_ready,
  to_regprocedure('public.get_quiz_room_for_player(text)') is not null as player_rpc_ready;
