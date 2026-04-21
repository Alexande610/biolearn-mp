-- CẬP NHẬT CẤU TRÚC BẢNG PROFILES ĐỂ HỖ TRỢ ĐẦY ĐỦ TÍNH NĂNG
-- Chạy đoạn mã này trong SQL Editor của Supabase

-- 1. Thêm các cột cho hệ thống Năng lượng (Energy)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS energy INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS max_energy INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS energy_last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Thêm các cột cho Điểm số và Bảng xếp hạng
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

-- 3. Thêm các cột cho Mini Game và Nhiệm vụ
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mini_game_claims_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_mini_game_claim TIMESTAMP WITH TIME ZONE;

-- 4. Thêm các cột dạng JSONB cho dữ liệu linh hoạt (giống MongoDB)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_missions JSONB DEFAULT '{"mission1Completed": false, "mission2Completed": false, "mission3Completed": false, "lastReset": null}'::jsonb,
ADD COLUMN IF NOT EXISTS unlocked_chapters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- 5. Tạo bảng PVP Queue (để ghép trận realtime)
CREATE TABLE IF NOT EXISTS public.pvp_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  class_id INTEGER NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật Realtime cho bảng pvp_queues
ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_queues;

-- BẬT RLS CHO PVP_QUEUES
ALTER TABLE public.pvp_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép mọi người xem hàng chờ" ON public.pvp_queues FOR SELECT USING (true);
CREATE POLICY "Cho phép người dùng join hàng chờ" ON public.pvp_queues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cho phép người dùng rời hàng chờ" ON public.pvp_queues FOR DELETE USING (auth.uid() = user_id);
