-- NextGen BioLearn - Script sửa lỗi không thể xóa tài khoản User (Cập nhật phiên bản triệt để)
-- Chạy đoạn mã này trong Supabase SQL Editor (https://supabase.com/dashboard/project/tsmxzqfdumxeoppspdxa/sql/new)

-- 1. Thêm ON DELETE CASCADE cho bảng public.profiles tham chiếu đến auth.users(id)
-- Vì một số dự án cũ có thể tạo bảng profiles mà thiếu ON DELETE CASCADE ở khóa ngoại chính
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. Sửa khóa ngoại bảng public.quiz_rooms (liên kết với profiles) thành ON DELETE CASCADE
ALTER TABLE public.quiz_rooms 
  DROP CONSTRAINT IF EXISTS quiz_rooms_teacher_id_fkey,
  ADD CONSTRAINT quiz_rooms_teacher_id_fkey 
    FOREIGN KEY (teacher_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- 3. Sửa các khóa ngoại bảng public.pvp_matches (liên kết với profiles) thành ON DELETE SET NULL hoặc CASCADE
ALTER TABLE public.pvp_matches
  DROP CONSTRAINT IF EXISTS pvp_matches_player1_id_fkey,
  ADD CONSTRAINT pvp_matches_player1_id_fkey 
    FOREIGN KEY (player1_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

ALTER TABLE public.pvp_matches
  DROP CONSTRAINT IF EXISTS pvp_matches_player2_id_fkey,
  ADD CONSTRAINT pvp_matches_player2_id_fkey 
    FOREIGN KEY (player2_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

ALTER TABLE public.pvp_matches
  DROP CONSTRAINT IF EXISTS pvp_matches_winner_id_fkey,
  ADD CONSTRAINT pvp_matches_winner_id_fkey 
    FOREIGN KEY (winner_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

-- 4. Sửa khóa ngoại bảng public.pvp_queues (liên kết với profiles) thành ON DELETE CASCADE
-- Một số dự án có thể dùng pvp_queues từ file database_update.sql cũ mà thiếu ON DELETE CASCADE
ALTER TABLE public.pvp_queues
  DROP CONSTRAINT IF EXISTS pvp_queues_user_id_fkey,
  ADD CONSTRAINT pvp_queues_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- 5. Đảm bảo các bảng khác như teacher_requests và system_logs cũng có ON DELETE SET NULL hoặc CASCADE phù hợp
ALTER TABLE public.teacher_requests
  DROP CONSTRAINT IF EXISTS teacher_requests_user_id_fkey,
  ADD CONSTRAINT teacher_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.system_logs
  DROP CONSTRAINT IF EXISTS system_logs_user_id_fkey,
  ADD CONSTRAINT system_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
