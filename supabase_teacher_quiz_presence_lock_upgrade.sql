-- BioLearn - Presence + khóa phòng trực tuyến (2026-08-26)
-- Chạy TOÀN BỘ file này SAU supabase_teacher_quiz_reopen_shuffle_upgrade.sql.
-- Không xóa phòng, lượt chơi hoặc câu trả lời cũ.

alter table public.quiz_rooms
  add column if not exists is_locked boolean not null default false;

-- Phòng đã bắt đầu phải luôn khóa người vào mới.
update public.quiz_rooms
set is_locked = true
where room_type = 'live' and status = 'playing';

-- "left" chỉ biểu thị đã rời phiên realtime; bản ghi vẫn được giữ cho lịch sử.
alter table public.quiz_attempts drop constraint if exists quiz_attempts_status_check;
alter table public.quiz_attempts add constraint quiz_attempts_status_check
  check (status in ('joined', 'playing', 'completed', 'left'));

create index if not exists quiz_rooms_active_lock_idx
  on public.quiz_rooms (room_code, is_locked)
  where status in ('waiting', 'playing');

-- RPC trả thêm trạng thái khóa và vẫn chỉ chọn phiên hoạt động mới nhất.
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
    'is_locked', r.is_locked,
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

-- Kiểm tra cuối: cả ba giá trị phải là true.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_rooms' and column_name = 'is_locked'
  ) as room_lock_ready,
  exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'quiz_attempts_status_check'
      and check_clause like '%left%'
  ) as attempt_left_ready,
  to_regprocedure('public.get_quiz_room_for_player(text)') is not null as player_rpc_ready;
