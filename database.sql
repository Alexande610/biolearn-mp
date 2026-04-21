-- CHẠY TOÀN BỘ MÃ SQL NÀY TRONG SUPABASE SQL EDITOR --

-- 1. TẠO BẢNG PROFILES (Lưu trữ thông tin người dùng được đồng bộ từ Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TẠO BẢNG QUIZ_ROOMS (Phòng thi đấu Realtime)
CREATE TABLE IF NOT EXISTS public.quiz_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT DEFAULT 'Phòng thi đấu Sinh Học',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_question_index INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb, -- Lưu mảng: [{ "q": "...", "options": [...], "correct": 0 }]
  participants JSONB DEFAULT '[]'::jsonb, -- Lưu danh sách học sinh: [{ "id": "...", "name": "...", "score": 0 }]
  settings JSONB DEFAULT '{"timePerQuestion": 20}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. BẬT TÍNH NĂNG REALTIME (Quan trọng nhất cho thi đấu!)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 4. BẢO MẬT RLS (Row Level Security) CHO PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép mọi người xem profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Cho phép người dùng tự sửa profile của mình" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger TỰ ĐỘNG tạo profile khi có user đăng ký mới
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn Trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. BẢO MẬT RLS CHO QUIZ_ROOMS
ALTER TABLE public.quiz_rooms ENABLE ROW LEVEL SECURITY;

-- Ai cũng có quyền vào xem / chơi trong phòng
CREATE POLICY "Cho phép tất cả xem phòng quiz" 
ON public.quiz_rooms FOR SELECT USING (true);

-- Cho phép học sinh update điểm số / thêm tên mình vào danh sách participants (cần thiết cho Realtime)
CREATE POLICY "Cho phép tất cả update phòng quiz" 
ON public.quiz_rooms FOR UPDATE USING (true);

-- Chỉ giáo viên mới tạo được phòng
CREATE POLICY "Chỉ role teacher hoặc admin tạo phòng" 
ON public.quiz_rooms FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);
