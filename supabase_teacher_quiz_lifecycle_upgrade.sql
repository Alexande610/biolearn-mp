-- BioLearn Teacher Quiz lifecycle + history upgrade (2026-08-25)
-- Chạy TOÀN BỘ file trong Supabase SQL Editor. File có thể chạy lại an toàn.
-- Nếu từng gặp lỗi "column r.closed_at does not exist", hãy chạy
-- supabase_teacher_quiz_closed_at_repair.sql trước, rồi quay lại chạy file này.

begin;

-- 1) Bổ sung trạng thái bền vững để F5 không làm mất phòng live.
alter table public.quiz_rooms add column if not exists live_state jsonb not null default '{}'::jsonb;
alter table public.quiz_rooms add column if not exists closed_at timestamptz;
alter table public.quiz_rooms add column if not exists close_reason text;
alter table public.quiz_rooms add column if not exists updated_at timestamptz not null default now();

-- Gỡ ràng buộc trạng thái cũ trước khi chuyển finished -> closed.
-- Làm theo thứ tự này để migration vẫn chạy được nếu database cũ từng giới hạn status.
alter table public.quiz_rooms drop constraint if exists quiz_rooms_status_check;

-- Chuẩn hóa dữ liệu cũ: finished được xem là phòng đã đóng nhưng vẫn giữ lịch sử.
update public.quiz_rooms
set status = 'closed',
    closed_at = coalesce(closed_at, ended_at, updated_at, now()),
    close_reason = coalesce(close_reason, 'completed'),
    live_state = case
      when coalesce(live_state, '{}'::jsonb) = '{}'::jsonb
        then jsonb_build_object('phase', 'ended', 'ended_at', coalesce(ended_at, updated_at, now()))
      else live_state
    end
where status = 'finished';

update public.quiz_rooms
set live_state = jsonb_build_object('phase', 'waiting', 'question_index', coalesce(current_question_index, 0))
where room_type = 'live' and status = 'waiting' and coalesce(live_state, '{}'::jsonb) = '{}'::jsonb;

update public.quiz_rooms
set live_state = jsonb_build_object('phase', 'question', 'question_index', coalesce(current_question_index, 0))
where room_type = 'live' and status = 'playing' and coalesce(live_state, '{}'::jsonb) = '{}'::jsonb;

alter table public.quiz_rooms add constraint quiz_rooms_status_check
  check (status in ('waiting', 'playing', 'closed'));

alter table public.quiz_rooms drop constraint if exists quiz_rooms_close_reason_check;
alter table public.quiz_rooms add constraint quiz_rooms_close_reason_check
  check (close_reason is null or close_reason in ('completed', 'teacher_closed', 'expired', 'admin_closed'));

create index if not exists quiz_rooms_teacher_history_idx
  on public.quiz_rooms (teacher_id, created_at desc);
create index if not exists quiz_rooms_teacher_status_idx
  on public.quiz_rooms (teacher_id, status, archived_at);

create or replace function public.touch_quiz_room_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_quiz_room_updated_at on public.quiz_rooms;
create trigger trg_touch_quiz_room_updated_at
before update on public.quiz_rooms
for each row execute function public.touch_quiz_room_updated_at();

-- 2) RPC dành cho học viên: chỉ trả câu hỏi assignment đã loại đáp án;
-- phòng closed vẫn trả metadata tối thiểu để client báo đúng "Phòng đã đóng".
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
  limit 1;
$$;

revoke all on function public.get_quiz_room_for_player(text) from public;
grant execute on function public.get_quiz_room_for_player(text) to authenticated;

-- 3) Hàm đóng phòng nguyên tử. Giữ nguyên questions, attempts và answers để xem lịch sử.
drop function if exists public.close_teacher_quiz_room(uuid, text);
create function public.close_teacher_quiz_room(p_room_id uuid, p_reason text default 'teacher_closed')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.quiz_rooms%rowtype;
  v_participant_count integer;
begin
  select * into v_room
  from public.quiz_rooms
  where id = p_room_id and teacher_id = auth.uid()
  for update;

  if not found then
    raise exception 'Không tìm thấy phòng hoặc bạn không có quyền đóng phòng';
  end if;

  select count(*) into v_participant_count
  from public.quiz_attempts
  where room_id = p_room_id;

  update public.quiz_rooms
  set status = 'closed',
      closed_at = coalesce(closed_at, now()),
      ended_at = coalesce(ended_at, now()),
      close_reason = case when p_reason in ('completed', 'teacher_closed', 'expired', 'admin_closed') then p_reason else 'teacher_closed' end,
      live_state = jsonb_build_object(
        'phase', 'closed',
        'closed_at', now(),
        'reason', case when p_reason in ('completed', 'teacher_closed', 'expired', 'admin_closed') then p_reason else 'teacher_closed' end
      )
  where id = p_room_id;

  return jsonb_build_object(
    'room_id', p_room_id,
    'participant_count', v_participant_count,
    'closed_at', now()
  );
end;
$$;

revoke all on function public.close_teacher_quiz_room(uuid, text) from public;
grant execute on function public.close_teacher_quiz_room(uuid, text) to authenticated;

commit;

select
  to_regclass('public.quiz_rooms') is not null
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_rooms' and column_name = 'live_state'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_rooms' and column_name = 'closed_at'
  )
  and to_regprocedure('public.get_quiz_room_for_player(text)') is not null
  and to_regprocedure('public.close_teacher_quiz_room(uuid,text)') is not null
  as migration_ok;
