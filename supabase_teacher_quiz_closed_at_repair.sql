-- BioLearn - sửa lỗi thiếu closed_at trước khi tạo RPC Quiz
-- Chạy TOÀN BỘ file này trong Supabase SQL Editor, không chỉ bôi đen riêng phần CREATE FUNCTION.
-- File không dùng BEGIN/ROLLBACK để các cột đã thêm không bị mất nếu một bước tạo hàm phía sau gặp lỗi.

-- BƯỚC 1: bổ sung và lưu các cột vòng đời trước.
alter table public.quiz_rooms add column if not exists live_state jsonb not null default '{}'::jsonb;
alter table public.quiz_rooms add column if not exists closed_at timestamptz;
alter table public.quiz_rooms add column if not exists close_reason text;
alter table public.quiz_rooms add column if not exists ended_at timestamptz;
alter table public.quiz_rooms add column if not exists updated_at timestamptz not null default now();

-- BƯỚC 2: xác nhận cột thực sự tồn tại. Kết quả phải có đủ 5 dòng.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'quiz_rooms'
  and column_name in ('live_state', 'closed_at', 'close_reason', 'ended_at', 'updated_at')
order by column_name;

-- BƯỚC 3: tạo lại RPC học viên sau khi closed_at đã tồn tại.
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

-- BƯỚC 4: kiểm tra cuối. Hai giá trị phải đều là true.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quiz_rooms'
      and column_name = 'closed_at'
  ) as closed_at_exists,
  to_regprocedure('public.get_quiz_room_for_player(text)') is not null as player_rpc_exists;
