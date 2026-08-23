-- 1. Đảm bảo bảng teacher_requests tồn tại
create table if not exists public.teacher_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_code text,
  code_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. BẬT ROW LEVEL SECURITY (RLS) THEO CHUẨN AN TOÀN CỦA SUPABASE
alter table public.teacher_requests enable row level security;

-- 3. Tạo các chính sách (Policies) cho phép ứng dụng gửi yêu cầu và kiểm tra mã xác thực:
-- A. Cho phép mọi người (kể cả khách chưa đăng nhập) gửi yêu cầu mã
drop policy if exists "allow_anon_insert_teacher_requests" on public.teacher_requests;
create policy "allow_anon_insert_teacher_requests" on public.teacher_requests
for insert with check (true);

-- B. Cho phép đọc thông tin yêu cầu để kiểm tra trạng thái duyệt mã
drop policy if exists "allow_public_select_teacher_requests" on public.teacher_requests;
create policy "allow_public_select_teacher_requests" on public.teacher_requests
for select using (true);

-- C. Cho phép Admin cập nhật trạng thái duyệt / từ chối
drop policy if exists "allow_all_update_teacher_requests" on public.teacher_requests;
create policy "allow_all_update_teacher_requests" on public.teacher_requests
for update using (true) with check (true);

-- 4. Tạo chỉ mục tìm kiếm theo email
create index if not exists idx_teacher_requests_email on public.teacher_requests(email);

-- 5. Tự động cập nhật vai trò role cho các tài khoản test nếu đã đăng ký trong auth.users
update public.profiles 
set role = 'student' 
where email = 'student.test@biolearn.vn';

update public.profiles 
set role = 'teacher' 
where email = 'teacher.test@biolearn.vn';
