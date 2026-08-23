-- BioLearn Teacher + Quiz Migration V2 (2026-08-21).
-- QUAN TRỌNG: trong Supabase SQL Editor hãy bỏ mọi vùng đang bôi chọn,
-- nhấn Ctrl+A để chọn TOÀN BỘ file này rồi bấm Run. Không chạy từ giữa một function.

begin;

-- 1) Vòng đời yêu cầu Giáo viên: pending -> approved -> registered | rejected.
create table if not exists public.teacher_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  email text not null,
  status text not null default 'pending',
  approved_code text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teacher_requests add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.teacher_requests add column if not exists username text;
alter table public.teacher_requests add column if not exists email text;
alter table public.teacher_requests add column if not exists status text default 'pending';
alter table public.teacher_requests add column if not exists approved_code text;
alter table public.teacher_requests add column if not exists code_expires_at timestamptz;
alter table public.teacher_requests add column if not exists created_at timestamptz default now();
alter table public.teacher_requests add column if not exists updated_at timestamptz default now();
alter table public.teacher_requests add column if not exists consumed_at timestamptz;
alter table public.teacher_requests add column if not exists decision_at timestamptz;
alter table public.teacher_requests add column if not exists decision_by uuid references public.profiles(id) on delete set null;

alter table public.teacher_requests drop constraint if exists teacher_requests_status_check;
alter table public.teacher_requests add constraint teacher_requests_status_check
  check (status in ('pending', 'approved', 'registered', 'rejected'));

-- Sửa dữ liệu cũ do phiên bản trước đã xóa mã sau sign-up.
-- Nếu đã có user_id: giữ một mã audit nội bộ, chuyển sang registered và không hiển thị ở Admin.
update public.teacher_requests
   set approved_code = 'LEGACY_' || upper(substr(replace(id::text, '-', ''), 1, 12)),
       status = 'registered', consumed_at = coalesce(consumed_at, updated_at, now())
 where status = 'approved' and approved_code is null and user_id is not null;
-- Nếu chưa có user_id thì không thể phục hồi mã gốc: trả về pending để Admin duyệt/gửi mã mới.
update public.teacher_requests
   set status = 'pending', code_expires_at = null
 where status = 'approved' and approved_code is null and user_id is null;

-- Chỉ giữ yêu cầu mở mới nhất của mỗi email; bản cũ vẫn được lưu làm lịch sử rejected.
with ranked as (
  select id, row_number() over (partition by lower(email) order by created_at desc) as rn
  from public.teacher_requests where status in ('pending', 'approved')
)
update public.teacher_requests tr
   set status = 'rejected', approved_code = null, code_expires_at = null,
       decision_at = coalesce(decision_at, now())
  from ranked where tr.id = ranked.id and ranked.rn > 1;

-- Được gọi sau khi auth.signInWithPassword thành công. Hàm không trả approved_code.
drop function if exists public.consume_teacher_approval(text);
create function public.consume_teacher_approval(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_changed integer;
begin
  if auth.uid() is null or lower(coalesce(auth.jwt()->>'email', '')) <> lower(trim(p_email)) then
    raise exception 'Không có quyền xác nhận yêu cầu này';
  end if;

  update public.teacher_requests
     set status = 'registered', user_id = auth.uid(), consumed_at = now(), updated_at = now()
   where id = (
     select id from public.teacher_requests
      where lower(email) = lower(trim(p_email)) and status = 'approved'
      order by created_at desc limit 1
   );
  get diagnostics v_changed = row_count;
  return v_changed = 1;
end;
$$;
revoke all on function public.consume_teacher_approval(text) from public;
grant execute on function public.consume_teacher_approval(text) to authenticated;

-- Client chỉ đọc trạng thái tối thiểu, không bao giờ nhận approved_code.
drop function if exists public.get_teacher_request_status(text);
create function public.get_teacher_request_status(p_email text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case when tr.id is null
    then jsonb_build_object('exists', false)
    else jsonb_build_object('exists', true, 'status', tr.status)
  end
  from (select 1) seed
  left join lateral (
    select id, status from public.teacher_requests
    where lower(email) = lower(trim(p_email))
    order by created_at desc limit 1
  ) tr on true;
$$;
revoke all on function public.get_teacher_request_status(text) from public;
grant execute on function public.get_teacher_request_status(text) to anon, authenticated;

-- So khớp mã ở DB và chỉ trả valid/id; mã thật không xuất hiện trong response.
drop function if exists public.validate_teacher_approval(text, text);
create function public.validate_teacher_approval(p_email text, p_code text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case when tr.id is null
    then jsonb_build_object('valid', false)
    else jsonb_build_object('valid', true, 'request_id', tr.id, 'expires_at', tr.code_expires_at)
  end
  from (select 1) seed
  left join lateral (
    select id, code_expires_at from public.teacher_requests
    where lower(email) = lower(trim(p_email))
      and approved_code = upper(trim(p_code))
      and status = 'approved'
      and code_expires_at > now()
    order by created_at desc limit 1
  ) tr on true;
$$;
revoke all on function public.validate_teacher_approval(text, text) from public;
grant execute on function public.validate_teacher_approval(text, text) to anon, authenticated;

alter table public.teacher_requests enable row level security;
drop policy if exists "allow_public_select_teacher_requests" on public.teacher_requests;
drop policy if exists "allow_all_update_teacher_requests" on public.teacher_requests;
drop policy if exists "allow_anon_insert_teacher_requests" on public.teacher_requests;
drop policy if exists "teacher_requests_admin_select" on public.teacher_requests;
drop policy if exists "teacher_requests_admin_update" on public.teacher_requests;
create policy "allow_anon_insert_teacher_requests" on public.teacher_requests
for insert with check (status = 'pending' and approved_code is null and user_id is null);
create policy "teacher_requests_admin_select" on public.teacher_requests
for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "teacher_requests_admin_update" on public.teacher_requests
for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Chặn nhiều yêu cầu đang hoạt động cho cùng email.
create unique index if not exists teacher_requests_one_open_email
on public.teacher_requests (lower(email)) where status in ('pending', 'approved');

-- 2) Hai loại phòng: live và assignment.
create table if not exists public.quiz_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(10) unique not null,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null default 'Phòng thi đấu Sinh Học',
  status text not null default 'waiting',
  current_question_index integer not null default 0,
  questions jsonb not null default '[]'::jsonb,
  participants jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{"timePerQuestion":20}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.quiz_rooms add column if not exists room_code varchar(10);
alter table public.quiz_rooms add column if not exists teacher_id uuid references public.profiles(id) on delete restrict;
alter table public.quiz_rooms add column if not exists title text default 'Phòng thi đấu Sinh Học';
alter table public.quiz_rooms add column if not exists status text default 'waiting';
alter table public.quiz_rooms add column if not exists current_question_index integer default 0;
alter table public.quiz_rooms add column if not exists questions jsonb default '[]'::jsonb;
alter table public.quiz_rooms add column if not exists participants jsonb default '[]'::jsonb;
alter table public.quiz_rooms add column if not exists settings jsonb default '{"timePerQuestion":20}'::jsonb;
alter table public.quiz_rooms add column if not exists created_at timestamptz default now();
alter table public.quiz_rooms add column if not exists room_type text not null default 'live';
alter table public.quiz_rooms add column if not exists opens_at timestamptz;
alter table public.quiz_rooms add column if not exists closes_at timestamptz;
alter table public.quiz_rooms add column if not exists archived_at timestamptz;
alter table public.quiz_rooms add column if not exists question_time_seconds integer not null default 20;
alter table public.quiz_rooms add column if not exists intermission_seconds integer not null default 5;
alter table public.quiz_rooms add column if not exists started_at timestamptz;
alter table public.quiz_rooms add column if not exists ended_at timestamptz;
alter table public.quiz_rooms add column if not exists updated_at timestamptz not null default now();

alter table public.quiz_rooms drop constraint if exists quiz_rooms_room_type_check;
alter table public.quiz_rooms add constraint quiz_rooms_room_type_check check (room_type in ('live','assignment'));
alter table public.quiz_rooms drop constraint if exists quiz_rooms_question_time_check;
alter table public.quiz_rooms add constraint quiz_rooms_question_time_check check (question_time_seconds between 5 and 180);
alter table public.quiz_rooms drop constraint if exists quiz_rooms_intermission_check;
alter table public.quiz_rooms add constraint quiz_rooms_intermission_check check (intermission_seconds between 3 and 15);
alter table public.quiz_rooms drop constraint if exists quiz_rooms_assignment_window_check;
alter table public.quiz_rooms add constraint quiz_rooms_assignment_window_check check (
  room_type = 'live' or (opens_at is not null and closes_at is not null and closes_at > opens_at and closes_at <= opens_at + interval '7 days')
);

-- Dọn trạng thái live cũ trước khi áp giới hạn: giữ phòng mới nhất, archive các phòng còn lại.
with ranked_live as (
  select id, row_number() over (partition by teacher_id order by created_at desc) as rn
  from public.quiz_rooms
  where room_type = 'live' and archived_at is null and status in ('waiting','playing')
)
update public.quiz_rooms r set archived_at = now()
from ranked_live where r.id = ranked_live.id and ranked_live.rn > 1;

create unique index if not exists quiz_rooms_one_active_live_per_teacher
on public.quiz_rooms(teacher_id)
where room_type = 'live' and archived_at is null and status in ('waiting','playing');

create or replace function public.enforce_assignment_room_limit()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.room_type = 'assignment' and new.archived_at is null and
     (select count(*) from public.quiz_rooms r where r.teacher_id = new.teacher_id
       and r.room_type = 'assignment' and r.archived_at is null and r.id <> new.id) >= 2 then
    raise exception 'Mỗi Giáo viên chỉ được mở tối đa 2 bài quiz giao theo lịch';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_quiz_assignment_limit on public.quiz_rooms;
create trigger trg_quiz_assignment_limit before insert or update of archived_at, room_type on public.quiz_rooms
for each row execute function public.enforce_assignment_room_limit();

-- Không cho client học sinh đọc JSON câu hỏi gốc (trong đó có đáp án).
alter table public.quiz_rooms enable row level security;
drop policy if exists "Cho phép tất cả xem phòng quiz" on public.quiz_rooms;
drop policy if exists "Cho phép tất cả update phòng quiz" on public.quiz_rooms;
drop policy if exists "Chỉ role teacher hoặc admin tạo phòng" on public.quiz_rooms;
drop policy if exists "quiz_rooms_select_all" on public.quiz_rooms;
drop policy if exists "quiz_rooms_update_all" on public.quiz_rooms;
drop policy if exists "quiz_rooms_insert_teacher" on public.quiz_rooms;
drop policy if exists "quiz_rooms_teacher_select" on public.quiz_rooms;
create policy "quiz_rooms_teacher_select" on public.quiz_rooms for select using (teacher_id = auth.uid());
drop policy if exists "quiz_rooms_teacher_update" on public.quiz_rooms;
create policy "quiz_rooms_teacher_update" on public.quiz_rooms for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "quiz_rooms_teacher_insert" on public.quiz_rooms;
create policy "quiz_rooms_teacher_insert" on public.quiz_rooms for insert with check (
  teacher_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('teacher', 'admin')
  )
);

-- Trả metadata phòng và câu hỏi đã loại đáp án; không bao giờ trả correctAnswer/explanation.
drop function if exists public.get_quiz_room_for_player(text);
create function public.get_quiz_room_for_player(p_room_code text)
returns jsonb
language sql security definer set search_path = public stable
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
         'question_time_seconds', r.question_time_seconds,
         'questions', case when r.room_type = 'assignment' then
           coalesce((select jsonb_agg(jsonb_build_object(
             'question', q.value->'question', 'options', q.value->'options'
           ) order by q.ordinality)
           from jsonb_array_elements(r.questions) with ordinality q(value, ordinality)), '[]'::jsonb)
         else '[]'::jsonb end,
         'teacher_name', coalesce(p.display_name, 'Giáo viên')
         )
    from public.quiz_rooms r
    left join public.profiles p on p.id = r.teacher_id
   where upper(r.room_code) = upper(trim(p_room_code))
   limit 1;
$$;
revoke all on function public.get_quiz_room_for_player(text) from public;
grant execute on function public.get_quiz_room_for_player(text) to authenticated;

-- 3) Lưu người chơi và từng câu trả lời; không xóa lịch sử khi archive phòng.
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.quiz_rooms(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  display_name text not null,
  avatar_url text,
  status text not null default 'joined' check (status in ('joined','playing','completed')),
  score integer not null default 0,
  correct_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(room_id, student_id)
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete restrict,
  room_id uuid not null references public.quiz_rooms(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  question_index integer not null check (question_index >= 0),
  selected_option integer,
  is_correct boolean not null default false,
  response_ms integer not null check (response_ms >= 0),
  points integer not null default 0 check (points >= 0),
  answered_at timestamptz not null default now(),
  unique(attempt_id, question_index)
);

create index if not exists quiz_attempts_room_idx on public.quiz_attempts(room_id);
create index if not exists quiz_answers_room_question_idx on public.quiz_answers(room_id, question_index);

alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "quiz_attempts_read" on public.quiz_attempts;
create policy "quiz_attempts_read" on public.quiz_attempts for select using (
  student_id = auth.uid() or exists (select 1 from public.quiz_rooms r where r.id = room_id and r.teacher_id = auth.uid())
);
drop policy if exists "quiz_attempts_join" on public.quiz_attempts;
create policy "quiz_attempts_join" on public.quiz_attempts for insert with check (student_id = auth.uid());
drop policy if exists "quiz_attempts_update" on public.quiz_attempts;
create policy "quiz_attempts_update" on public.quiz_attempts for update using (
  student_id = auth.uid() or exists (select 1 from public.quiz_rooms r where r.id = room_id and r.teacher_id = auth.uid())
);

drop policy if exists "quiz_answers_read" on public.quiz_answers;
create policy "quiz_answers_read" on public.quiz_answers for select using (
  student_id = auth.uid() or exists (select 1 from public.quiz_rooms r where r.id = room_id and r.teacher_id = auth.uid())
);
drop policy if exists "quiz_answers_insert" on public.quiz_answers;
create policy "quiz_answers_insert" on public.quiz_answers for insert with check (student_id = auth.uid());
drop policy if exists "quiz_answers_teacher_insert" on public.quiz_answers;
create policy "quiz_answers_teacher_insert" on public.quiz_answers for insert with check (
  exists (select 1 from public.quiz_rooms r where r.id = room_id and r.teacher_id = auth.uid())
);

-- Chấm bài theo lịch tại DB; client chỉ nhận đúng/sai và điểm sau khi đã trả lời.
drop function if exists public.submit_assignment_answer(uuid, integer, integer, integer);
create function public.submit_assignment_answer(
  p_attempt_id uuid, p_question_index integer, p_selected_option integer, p_response_ms integer
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt public.quiz_attempts%rowtype;
  v_room public.quiz_rooms%rowtype;
  v_question jsonb;
  v_correct boolean;
  v_points integer;
  v_total integer;
begin
  select * into v_attempt from public.quiz_attempts where id = p_attempt_id and student_id = auth.uid();
  if not found then raise exception 'Lượt chơi không hợp lệ'; end if;
  select * into v_room from public.quiz_rooms where id = v_attempt.room_id and room_type = 'assignment';
  if not found or v_room.archived_at is not null or now() not between v_room.opens_at and v_room.closes_at then
    raise exception 'Bài quiz không trong thời gian mở';
  end if;
  v_question := v_room.questions -> p_question_index;
  if v_question is null then raise exception 'Câu hỏi không tồn tại'; end if;
  v_correct := p_selected_option = (v_question->>'correctAnswer')::integer;
  v_points := case when v_correct then
    round(500 + 500 * greatest(0, 1 - least(p_response_ms, v_room.question_time_seconds * 1000)::numeric / (v_room.question_time_seconds * 1000)))::integer
    else 0 end;
  insert into public.quiz_answers(attempt_id, room_id, student_id, question_index, selected_option, is_correct, response_ms, points)
  values (p_attempt_id, v_room.id, auth.uid(), p_question_index, p_selected_option, v_correct, greatest(0,p_response_ms), v_points)
  on conflict (attempt_id, question_index) do nothing;
  if not found then raise exception 'Câu này đã được trả lời'; end if;
  update public.quiz_attempts set score = score + v_points,
    correct_count = correct_count + case when v_correct then 1 else 0 end,
    status = 'playing'
  where id = p_attempt_id returning score into v_total;
  return jsonb_build_object(
    'is_correct', v_correct,
    'points', v_points,
    'total_score', v_total
  );
end;
$$;
revoke all on function public.submit_assignment_answer(uuid, integer, integer, integer) from public;
grant execute on function public.submit_assignment_answer(uuid, integer, integer, integer) to authenticated;

commit;

-- Nếu migration thành công, SQL Editor trả về đúng một hàng với migration_ok = true.
select
  to_regclass('public.teacher_requests') is not null
  and to_regclass('public.quiz_rooms') is not null
  and to_regclass('public.quiz_attempts') is not null
  and to_regclass('public.quiz_answers') is not null
  and to_regprocedure('public.consume_teacher_approval(text)') is not null
  and to_regprocedure('public.get_teacher_request_status(text)') is not null
  and to_regprocedure('public.validate_teacher_approval(text,text)') is not null
  and to_regprocedure('public.get_quiz_room_for_player(text)') is not null
  and to_regprocedure('public.submit_assignment_answer(uuid,integer,integer,integer)') is not null
  as migration_ok;
