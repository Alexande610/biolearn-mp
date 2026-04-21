-- ==========================================
-- SETUP FULL CHO PVP REALTIME NEXTGEN - PHASE 2
-- ==========================================

-- 1. CẬP NHẬT BẢNG PROFILES (Thêm Thể lực và Dữ liệu mở rộng)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_stamina INTEGER DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_stamina_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_missions JSONB DEFAULT '{"mission1Progress":0, "mission1Completed":false, "mission2Progress":0, "mission2Completed":false, "mission3Progress":0, "mission3Completed":false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '["adventurer-1", "adventurer-2", "adventurer-3", "adventurer-4", "adventurer-5"]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_score INTEGER DEFAULT 0;
-- Kích hoạt Realtime cho bảng hàng chờ ghép trận
ALTER TABLE public.pvp_queues REPLICA IDENTITY FULL;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.pvp_queues;

-- 2. TẠO BẢNG QUESTIONS (Ngân hàng câu hỏi)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id INTEGER NOT NULL, -- 6, 7, 8, 9, 10, 11, 12
    content TEXT NOT NULL,
    options JSONB NOT NULL, -- ["A", "B", "C", "D"]
    correct_option INTEGER NOT NULL, -- 0-3
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2b. TẠO BẢNG LESSON_QUESTIONS (Lưu trữ bài học Map - Chi tiết)
CREATE TABLE IF NOT EXISTS public.lesson_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    level INTEGER DEFAULT 0,
    title TEXT,
    description TEXT,
    theory TEXT,
    game JSONB NOT NULL, -- Mảng các câu hỏi quiz, matching, ordering cho bài học
    boss_questions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, chapter_id, lesson_id, level)
);

-- Bật quyền truy cập cho bảng Bài học
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.lesson_questions;
CREATE POLICY "Public Access" ON public.lesson_questions FOR ALL USING (true) WITH CHECK (true);

-- 3. TẠO BẢNG PVP_QUEUES (Hàng chờ ghép trận)
CREATE TABLE IF NOT EXISTS public.pvp_queues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    class_id INTEGER NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    match_room_id TEXT, -- Cột tín hiệu phòng
    match_opponent_id UUID, -- Cột tín hiệu đối thủ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật quyền cho hàng chờ để người chơi tìm thấy nhau
ALTER TABLE public.pvp_queues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for pvp_queues" ON public.pvp_queues;
CREATE POLICY "Enable all access for pvp_queues" ON public.pvp_queues FOR ALL USING (true) WITH CHECK (true);

-- 4. TẠO BẢNG PVP_MATCHES (Lịch sử trận đấu)
CREATE TABLE IF NOT EXISTS public.pvp_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    player1_id UUID REFERENCES public.profiles(id),
    player2_id UUID REFERENCES public.profiles(id),
    winner_id UUID REFERENCES public.profiles(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    class_id INTEGER,
    status TEXT DEFAULT 'finished',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẬT RLS (ROW LEVEL SECURITY)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_queues ENABLE ROW LEVEL SECURITY;

-- 6. THIẾT LẬP CHÍNH SÁCH BẢO MẬT (POLICIES)
-- Câu hỏi: Ai cũng có thể đọc
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);

-- Hàng chờ PvP: Ai cũng có thể đọc/thêm/xóa
DROP POLICY IF EXISTS "Anyone can select queues" ON public.pvp_queues;
CREATE POLICY "Anyone can select queues" ON public.pvp_queues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert queues" ON public.pvp_queues;
CREATE POLICY "Anyone can insert queues" ON public.pvp_queues FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete queues" ON public.pvp_queues;
CREATE POLICY "Anyone can delete queues" ON public.pvp_queues FOR DELETE USING (true);

-- Lịch sử trận đấu: Ai cũng có thể đọc và thêm mới
DROP POLICY IF EXISTS "Anyone can read matches" ON public.pvp_matches;
CREATE POLICY "Anyone can read matches" ON public.pvp_matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert matches" ON public.pvp_matches;
CREATE POLICY "Anyone can insert matches" ON public.pvp_matches FOR INSERT WITH CHECK (true);

-- 7. CẬP NHẬT TRIGGER TẠO PROFILE (Cho tài khoản mới khởi tạo 20 thể lực)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, stamina, max_stamina, last_stamina_update)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    20,
    20,
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo Trigger cũ được làm mới
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. CẬP NHẬT DỮ LIỆU CHO CÁC USER CŨ (Bổ sung thể lực nếu đang trống)
UPDATE public.profiles 
SET 
  stamina = COALESCE(stamina, 20), 
  max_stamina = COALESCE(max_stamina, 20),
  last_stamina_update = COALESCE(last_stamina_update, NOW()),
  daily_missions = COALESCE(daily_missions, '{"mission1Progress":0, "mission1Completed":false, "mission2Progress":0, "mission2Completed":false, "mission3Progress":0, "mission3Completed":false}'::jsonb),
  inventory = COALESCE(inventory, '["adventurer-1", "adventurer-2", "adventurer-3", "adventurer-4", "adventurer-5"]'::jsonb)
WHERE stamina IS NULL OR daily_missions IS NULL;

-- 9. HÀM CẬP NHẬT PHẦN THƯỞNG (REWARD_PVP)
CREATE OR REPLACE FUNCTION public.reward_pvp(
  target_user_id UUID,
  add_xp INTEGER,
  add_coins INTEGER,
  add_rank INTEGER
) 
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    xp = xp + add_xp,
    coins = coins + add_coins,
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. XÓA DỮ LIỆU CŨ VÀ NẠP 105 CÂU HỎI MỚI (15 CÂU MỖI LỚP)
TRUNCATE public.questions;

INSERT INTO public.questions (class_id, content, options, correct_option, explanation) VALUES
-- LỚP 6 (KHTN 6)
(6, 'Đối tượng nghiên cứu của Khoa học tự nhiên là gì?', '["Các sự vật, hiện tượng tự nhiên", "Các phép toán số học", "Lịch sử loài người", "Ngôn ngữ học"]', 0, 'KHTN tập trung vào việc khám phá các quy luật, sự vật và hiện tượng xảy ra trong thế giới tự nhiên.'),
(6, 'Lĩnh vực nào sau đây nghiên cứu về các sinh vật và sự sống?', '["Vật lí học", "Hóa học", "Sinh học", "Thiên văn học"]', 2, 'Sinh học (Biology) là lĩnh vực chuyên ngành nghiên cứu về các vật sống, cấu tạo và hoạt động của chúng.'),
(6, 'Vật nào sau đây được coi là vật sống?', '["Hòn đá", "Con mèo", "Chiếc xe đạp", "Quyển sách"]', 1, 'Con mèo có các đặc trưng của sự sống như trao đổi chất, lớn lên và sinh sản.'),
(6, 'Kính lúp cầm tay có tác dụng chính là gì?', '["Nhìn các ngôi sao", "Quan sát các vật nhỏ", "Đo nhiệt độ", "Đo chiều dài"]', 1, 'Kính lúp giúp phóng đại hình ảnh của các vật nhỏ để mắt thường dễ quan sát hơn.'),
(6, 'Thành phần nào của tế bào được coi là "trung tâm điều khiển" mọi hoạt động?', '["Màng tế bào", "Chất tế bào", "Nhân tế bào", "Thành tế bào"]', 2, 'Nhân tế bào chứa vật chất di truyền và điều khiển mọi hoạt động sống của tế bào.'),
(6, 'Tế bào thực vật khác tế bào động vật cơ bản ở thành phần nào?', '["Có nhân tế bào", "Có màng tế bào", "Có lục lạp và thành tế bào", "Có chất tế bào"]', 2, 'Thực vật có thành tế bào bằng cellulose để giữ khung và lục lạp để quang hợp, động vật không có.'),
(6, 'Đơn vị cấu trúc cơ bản của mọi cơ thể sinh vật là gì?', '["Nguyên tử", "Phân tử", "Tế bào", "Mô"]', 2, 'Mọi sinh vật đều được cấu tạo từ đơn vị nhỏ nhất thực hiện đầy đủ chức năng sống là tế bào.'),
(6, 'Vi khuẩn là nhóm sinh vật thuộc loại tế bào nào?', '["Tế bào nhân thực", "Tế bào nhân sơ", "Tế bào không có nhân", "Tế bào đa bào"]', 1, 'Vi khuẩn chưa có màng nhân bao bọc vật chất di truyền nên gọi là tế bào nhân sơ.'),
(6, 'Nấm men được con người ứng dụng phổ biến trong việc gì?', '["Làm phân bón", "Sản xuất bánh mì, bia", "Sản xuất chất dẻo", "Chữa bệnh sốt rét"]', 1, 'Nấm men có khả năng lên men đường tạo ra khí CO2 giúp bột bánh mì nở.'),
(6, 'Cơ quan sinh sản của thực vật hạt kín (có hoa) là?', '["Rễ", "Thân", "Lá", "Hoa"]', 3, 'Hoa là cơ quan chuyên hóa cho chức năng sinh sản hữu tính ở thực vật có hoa.'),
(6, 'Nhóm động vật nào sau đây thuộc nhóm động vật có xương sống?', '["Giun đất", "Châu chấu", "Cá chép", "Ốc sên"]', 2, 'Cá chép có bộ xương trong với cột sống chạy dọc cơ thể.'),
(6, 'Virus có đặc điểm cấu tạo cơ bản nào?', '["Có màng nhân rõ rệt", "Gồm nhiều tế bào", "Chưa có cấu tạo tế bào", "Có lục lạp"]', 2, 'Virus chỉ gồm vỏ protein và lõi vật chất di truyền, chưa có cấu tạo tế bào hoàn chỉnh.'),
(6, 'Đa dạng sinh học là gì?', '["Chỉ là số lượng cá thể trong một loài", "Sự phong phú về loài, nguồn gene và hệ sinh thái", "Số lượng các vườn quốc gia", "Chỉ là sự đa dạng về thực vật"]', 1, 'Đa dạng sinh học bao gồm sự phong phú ở 3 cấp độ: gene, loài và hệ sinh thái.'),
(6, 'Biện pháp nào giúp bảo vệ đa dạng sinh học hiệu quả nhất?', '["Săn bắt động vật quý hiếm", "Trồng rừng và bảo vệ rừng", "Xả thải ra sông ngòi", "Phá rừng làm nương rẫy"]', 1, 'Rừng là môi trường sống của đa số loài, bảo vệ rừng giúp duy trì nơi sinh sống và nguồn thức ăn cho chúng.'),
(6, 'Bệnh nào sau đây do virus gây ra ở người?', '["Bệnh kiết lị", "Bệnh sốt xuất huyết", "Bệnh nấm da", "Bệnh giun sán"]', 1, 'Sốt xuất huyết do virus Dengue gây ra qua vật trung gian là muỗi vằn.'),

-- LỚP 7 (KHTN 7)
(7, 'Hạt nào trong nguyên tử mang điện tích dương?', '["Electron", "Neutron", "Proton", "Hạt nhân"]', 2, 'Proton mang điện tích dương, nằm trong hạt nhân nguyên tử.'),
(7, 'Hóa trị của một nguyên tố được xác định bởi?', '["Khối lượng nguyên tử", "Số lượng neutron", "Khả năng liên kết của nguyên tử đó", "Kích thước nguyên tử"]', 2, 'Hóa trị là con số biểu thị khả năng liên kết của nguyên tử này với nguyên tử khác.'),
(7, 'Phân tử nước (H2O) gồm những nguyên tử nào?', '["2 Hidro, 1 Oxi", "1 Hidro, 2 Oxi", "1 Hidro, 1 Oxi", "2 Hidro, 2 Oxi"]', 0, 'Mỗi phân tử nước được tạo thành từ 2 nguyên tử Hidro và 1 nguyên tử Oxi.'),
(7, 'Quá trình quang hợp ở thực vật diễn ra chủ yếu ở bào quan nào?', '["Ty thể", "Lục lạp", "Ribosome", "Nhân"]', 1, 'Lục lạp chứa diệp lục có khả năng hấp thụ năng lượng ánh sáng để quang hợp.'),
(7, 'Sản phẩm chính của quá trình quang hợp là gì?', '["Khí Oxy và Cacbonic", "Nước và Oxy", "Chất hữu cơ và Oxy", "Năng lượng nhiệt"]', 2, 'Thực vật sử dụng CO2 và nước để tạo ra đường (Glicose) và giải phóng O2.'),
(7, 'Hô hấp tế bào giải phóng năng lượng dưới dạng nào cho cơ thể sử dụng?', '["Nhiệt năng", "Quang năng", "ATP", "Hóa năng dự trữ"]', 2, 'ATP (Adenosine Triphosphate) là dạng năng lượng trực tiếp cho các hoạt động sống của tế bào.'),
(7, 'Cơ quan nào của lá giúp trao đổi khí và thoát hơi nước?', '["Gân lá", "Thịt lá", "Khí khổng", "Lông hút"]', 2, 'Khí khổng có thể đóng mở để điều tiết sự ra vào của khí O2, CO2 và hơi nước.'),
(7, 'Vai trò chính của nước đối với cơ thể sinh vật là?', '["Cung cấp năng lượng chính", "Dung môi hòa tan nhiều chất", "Chỉ giúp cơ thể mát mẻ", "Làm khung xương"]', 1, 'Nước là dung môi trung tâm cho mọi phản ứng hóa sinh diễn ra trong cơ thể.'),
(7, 'Hiện tượng cây đậu hướng về phía có ánh sáng gọi là gì?', '["Hướng sáng", "Hướng nước", "Hướng tiếp xúc", "Hướng hóa"]', 0, 'Đây là phản ứng cảm ứng của thực vật giúp lá đón nhận tối đa ánh sáng mặt trời.'),
(7, 'Tập tính nhện giăng tơ được gọi là loại tập tính nào?', '["Tập tính học được", "Tập tính bẩm sinh", "Tập tính hỗn hợp", "Tập tính xã hội"]', 1, 'Nhện sinh ra đã có khả năng giăng tơ mà không cần qua học tập.'),
(7, 'Sinh trưởng ở sinh vật là gì?', '["Sự biến đổi về cấu trúc", "Sự tăng lên về kích thước và khối lượng", "Sự chết đi của tế bào", "Sự thay đổi màu sắc"]', 1, 'Sinh trưởng là quá trình tăng kích thước cơ thể do sự tăng số lượng và kích thước tế bào.'),
(7, 'Phát triển ở sinh vật bao gồm những quá trình nào?', '["Chỉ là sinh trưởng", "Sinh trưởng, phân hóa tế bào và phát sinh hình thái", "Chỉ là sự già đi", "Sự di cư"]', 1, 'Phát triển là khái niệm rộng hơn sinh trưởng, bao gồm cả sự thay đổi chất lượng và chức năng các cơ quan.'),
(7, 'Con người thường nhân giống cây bằng cách chiết cành vì?', '["Cây sẽ sống lâu hơn", "Giữ được đặc tính tốt của cây mẹ và nhanh cho quả", "Tạo ra nhiều biến dị mới", "Cây sẽ cao hơn"]', 1, 'Chiết cành là sinh sản vô tính, giúp duy trì nguyên vẹn đặc tính quý của cây mẹ.'),
(7, 'Hoa là cơ quan thực hiện chức năng gì?', '["Vận chuyển nước", "Quang hợp", "Sinh sản hữu tính", "Nâng đỡ cây"]', 2, 'Hoa chứa nhị và nhụy để thực hiện quá trình thụ phấn và thụ tinh tạo hạt.'),
(7, 'Tập tính một số loài chim di cư khi mùa đông đến là hành vi bẩm sinh hay học được?', '["Học được hoàn toàn", "Bẩm sinh", "Do con người dạy", "Ngẫu nhiên"]', 1, 'Di cư là hành vi mang tính bản năng, bẩm sinh để thích nghi với điều kiện môi trường.'),

-- LỚP 8 (KHTN 8)
(8, 'Biến đổi hóa học khác biến đổi vật lí ở điểm cơ bản nào?', '["Thay đổi màu sắc", "Thay đổi trạng thái", "Tạo ra chất mới", "Thay đổi kích thước"]', 2, 'Biến đổi hóa học luôn kèm theo sự hình thành chất mới với tính chất mới.'),
(8, 'Hiện tượng nào sau đây là phản ứng tỏa nhiệt?', '["Băng tan", "Nước sôi", "Đốt cháy than đá", "Hòa tan đường vào nước"]', 2, 'Các phản ứng cháy thường giải phóng một lượng nhiệt lớn ra môi trường.'),
(8, 'Mol là lượng chất chứa bao nhiêu hạt vi mô (nguyên tử hoặc phân tử)?', '["6,022 x 10^23", "6,022 x 10^22", "6,022 x 10^24", "1,022 x 10^23"]', 0, 'Số Avogadro (N) bằng khoảng 6,022 x 10^23 hạt/mol.'),
(8, 'Dung dịch Acid làm quỳ tím chuyển sang màu gì?', '["Xanh", "Đỏ", "Vàng", "Không đổi màu"]', 1, 'Acid có khả năng làm đổi màu chất chỉ thị quỳ tím thành đỏ.'),
(8, 'Dung dịch Base làm quỳ tím chuyển sang màu gì?', '["Xanh", "Đỏ", "Hồng", "Tím"]', 0, 'Base (Kiềm) làm quỳ tím chuyển thành màu xanh.'),
(8, 'Hệ xương người trưởng thành được chia làm mấy phần chính?', '["2 phần", "3 phần", "4 phần", "5 phần"]', 1, 'Gồm xương đầu, xương thân (cột sống, lồng ngực) và xương chi (tay, chân).'),
(8, 'Chức năng quan trọng nhất của hệ cơ đối với cơ thể là?', '["Bảo vệ nhân", "Vận chuyển máu", "Vận động và duy trì tư thế", "Tiêu hóa thức ăn"]', 2, 'Cơ co dãn giúp xương cử động, tạo nên sự vận động của cơ thể.'),
(8, 'Dịch vị trong dạ dày người chứa enzyme gì để tiêu hóa protein?', '["Amylase", "Lipase", "Pepsin", "Maltase"]', 2, 'Pepsin hoạt động trong môi trường acid của dạ dày để cắt nhỏ protein.'),
(8, 'Máu gồm những thành phần chính nào?', '["Huyết tương và các tế bào máu", "Nước và muối khoáng", "Hồng cầu và bạch cầu", "Tiểu cầu và huyết tương"]', 0, 'Máu có khoảng 55% huyết tương và 45% các tế bào máu (hồng cầu, bạch cầu, tiểu cầu).'),
(8, 'Người có nhóm máu O có thể truyền máu cho người thuộc nhóm máu nào?', '["Chỉ nhóm O", "Chỉ nhóm AB", "Tất cả các nhóm máu", "Không truyền được cho ai"]', 2, 'Nhóm máu O là nhóm máu chuyên cho vì không có kháng nguyên trên bề mặt hồng cầu.'),
(8, 'Cơ quan nào là nơi diễn ra sự trao đổi khí chính ở người?', '["Mũi", "Khí quản", "Phổi", "Thanh quản"]', 2, 'Phổi với hàng triệu phế nang là nơi O2 đi vào máu và CO2 đi ra khỏi máu.'),
(8, 'Tuyến nội tiết nào được gọi là "tuyến chỉ huy" của hệ nội tiết?', '["Tuyến giáp", "Tuyến tụy", "Tuyến yên", "Tuyến trên thận"]', 2, 'Tuyến yên tiết ra các hormone điều khiển hoạt động của nhiều tuyến nội tiết khác.'),
(8, 'Cơ quan thụ cảm thị giác của con người nằm ở đâu?', '["Tai", "Mũi", "Mắt", "Lưỡi"]', 2, 'Các tế bào thụ cảm ánh sáng nằm ở võng mạc của mắt.'),
(8, 'Hệ sinh thái đầy đủ bao gồm những thành phần nào?', '["Cây cối và động vật", "Quần xã sinh vật và sinh cảnh", "Đất và nước", "Con người và máy móc"]', 1, 'Hệ sinh thái là sự kết hợp giữa các sinh vật (quần xã) và môi trường sống của chúng (sinh cảnh).'),
(8, 'Nguyên nhân gây ô nhiễm môi trường không khí phổ biến hiện nay?', '["Trồng cây xanh", "Khí thải từ phương tiện giao thông và nhà máy", "Sử dụng năng lượng mặt trời", "Quét dọn rác thải"]', 1, 'Các hoạt động công nghiệp và giao thông thải ra nhiều bụi, khí độc như CO, SO2, NOx.'),

-- LỚP 9 (KHTN 9 - SINH HỌC)
(9, 'Mendel đã sử dụng đối tượng nào cho các thí nghiệm di truyền của mình?', '["Ruồi giấm", "Đậu Hà Lan", "Chuột bạch", "Cây ngô"]', 1, 'Đậu Hà Lan có các cặp tính trạng tương phản rõ rệt và dễ thụ phấn nhân tạo.'),
(9, 'Allele là gì?', '["Một loại tế bào", "Các trạng thái khác nhau của cùng một gene", "Một cấu trúc của NST", "Một phân tử protein"]', 1, 'Allele là các dạng biến dị của một gene nằm ở cùng một vị trí trên cặp NST tương đồng.'),
(9, 'Mục đích chính của phép lai phân tích là gì?', '["Tạo ra giống mới", "Kiểm tra kiểu gene của cá thể mang tính trạng trội", "Tăng sức sống cho đời con", "Xác định số lượng con lai"]', 1, 'Bằng cách lai với cá thể đồng hợp lặn, ta biết được cá thể trội là đồng hợp hay dị hợp.'),
(9, 'Cấu tạo hóa học của Nhiễm sắc thể (NST) bao gồm?', '["Chỉ DNA", "DNA và Protein loại Histone", "DNA và RNA", "RNA và Protein"]', 1, 'DNA quấn quanh các khối protein Histone tạo nên cấu sợi nhiễm sắc.'),
(9, 'Ở người bình thường, số lượng NST trong một tế bào sinh dưỡng là?', '["23", "46", "44", "48"]', 1, 'Người có 23 cặp NST, tổng cộng là 46 chiếc.'),
(9, 'Phân tử DNA có cấu trúc như thế nào?', '["Mạch đơn thẳng", "Chuỗi xoắn kép gồm hai mạch song song ngược chiều", "Dạng vòng tròn", "Khối cầu"]', 1, 'DNA gồm hai mạch polynucleotide xoắn quanh một trục tưởng tượng theo chiều từ trái sang phải.'),
(9, 'Theo nguyên tắc bổ sung trong DNA, Adenine (A) liên kết với?', '["Guanine (G)", "Cytosine (C)", "Thymine (T)", "Uracil (U)"]', 2, 'A luôn liên kết với T bằng 2 liên kết Hidro.'),
(9, 'Quá trình phiên mã trong tế bào tạo ra sản phẩm gì?', '["DNA con", "Protein", "Các loại RNA (mRNA, tRNA, rRNA)", "Acid amin"]', 2, 'Phiên mã là quá trình truyền thông tin từ DNA sang RNA.'),
(9, 'Quá trình dịch mã (tổng hợp protein) diễn ra ở đâu trong tế bào?', '["Trong nhân", "Tại Ribosome", "Tại Ty thể", "Tại Lưới nội chất trơn"]', 1, 'Ribosome là "nhà máy" lắp ráp các acid amin thành chuỗi polypeptide.'),
(9, 'Đột biến gene là gì?', '["Sự thay đổi số lượng NST", "Những biến đổi trong cấu trúc của gene", "Sự thay đổi kiểu hình do môi trường", "Sự kết hợp các gene bố mẹ"]', 1, 'Đột biến gene bao gồm các dạng: mất, thêm, thay thế một hoặc một vài cặp nucleotide.'),
(9, 'Tác nhân nào sau đây có thể gây đột biến gene?', '["Tia tử ngoại (UV)", "Hóa chất độc hại", "Sốc nhiệt", "Tất cả các phương án trên"]', 3, 'Các tác nhân vật lí, hóa học và sinh học đều có thể gây sai hỏng cấu trúc DNA.'),
(9, 'Biến dị tổ hợp xuất hiện là do?', '["Đột biến gene", "Sự phân li độc lập và tổ hợp tự do của các gene trong giảm phân và thụ tinh", "Thay đổi môi trường sống", "Sự già đi của tế bào"]', 1, 'Bố mẹ dị hợp tạo ra các giao tử khác nhau, khi thụ tinh tạo ra các kiểu hình mới ở đời con.'),
(9, 'Học thuyết Tiến hóa của Darwin nhấn mạnh vai trò của nhân tố nào?', '["Đột biến", "Chọn lọc tự nhiên", "Cách li địa lí", "Di cư"]', 1, 'Chọn lọc tự nhiên giữ lại những cá thể có biến dị thích nghi và đào thải những cá thể kém thích nghi.'),
(9, 'Bằng chứng nào được coi là bằng chứng trực tiếp cho sự tiến hóa?', '["Cơ quan tương đồng", "Cơ quan thoái hóa", "Hóa thạch", "Tương đồng về DNA"]', 2, 'Hóa thạch là di tích của sinh vật để lại trong các lớp đất đá, phản ánh lịch sử phát triển của sinh giới.'),
(9, 'Một nhóm cá thể cùng loài, sống trong một khoảng không gian và thời gian xác định, có khả năng sinh sản gọi là?', '["Quần xã", "Quần thể", "Hệ sinh thái", "Sinh quyển"]', 1, 'Đây là định nghĩa cơ bản của một quần thể sinh vật.'),

-- LỚP 10 (SINH HỌC 10)
(10, 'Cấp độ tổ chức sống thấp nhất thực hiện được đầy đủ các chức năng của sự sống là?', '["Phân tử", "Bào quan", "Tế bào", "Mô"]', 2, 'Tế bào là đơn vị cơ bản của sự sống.'),
(10, 'Đặc điểm nào sau đây KHÔNG phải là đặc trưng cơ bản của các cấp độ tổ chức sống?', '["Trao đổi chất và chuyển hóa năng lượng", "Sinh trưởng và phát triển", "Đứng yên tuyệt đối", "Di truyền và biến dị"]', 2, 'Mọi cấp độ tổ chức sống luôn vận động và biến đổi.'),
(10, 'Tế bào nhân sơ (Prokaryote) có đặc điểm nổi bật nào?', '["Có màng nhân bao bọc vật chất di truyền", "Chưa có màng nhân, chỉ có vùng nhân", "Có hệ thống nội màng phức tạp", "Có nhiều bào quan có màng bao bọc"]', 1, 'Đây là đặc điểm phân biệt quan trọng nhất giữa nhân sơ và nhân thực.'),
(10, 'Bào quan nào được ví là "nhà máy năng lượng" của tế bào thực hiện hô hấp?', '["Bộ máy Golgi", "Lưới nội chất", "Ty thể", "Lục lạp"]', 2, 'Ty thể oxy hóa các chất hữu cơ để tạo ra ATP.'),
(10, 'Lưới nội chất hạt có chức năng chính là gì?', '["Tổng hợp Lipid", "Tổng hợp Protein", "Giải độc cho tế bào", "Vận chuyển nước"]', 1, 'Do có các hạt Ribosome đính trên bề mặt nên nó chuyên tổng hợp protein.'),
(10, 'Màng sinh chất của tế bào được cấu tạo chính từ thành phần nào?', '["Protein và Carbohydrate", "Phospholipid kép và Protein", "Cellulose và Pectin", "Lipid và Acid nucleic"]', 1, 'Mô hình khảm động của màng gồm khung phospholipid và các phân tử protein len lỏi.'),
(10, 'Vận chuyển thụ động là hình thức khuếch tán chất tan từ?', '["Nơi nồng độ thấp đến nơi nồng độ cao", "Nơi nồng độ cao đến nơi nồng độ thấp", "Cần tiêu tốn năng lượng ATP", "Không qua màng"]', 1, 'Vận chuyển thụ động tuân theo quy luật khuếch tán, không cần năng lượng.'),
(10, 'Tại sao vận chuyển chủ động lại cần năng lượng ATP?', '["Vì chất đi cùng chiều gradient nồng độ", "Vì chất đi ngược chiều gradient nồng độ", "Vì chất quá nhỏ", "Vì màng quá dày"]', 1, 'Để "bơm" các chất từ nơi loãng sang nơi đặc, tế bào phải sử dụng năng lượng.'),
(10, 'Chu kì tế bào gồm các giai đoạn nào?', '["Kì đầu, kì giữa, kì sau, kì cuối", "Kì trung gian và quá trình phân bào", "Chỉ gồm nguyên phân", "Chỉ gồm kì trung gian"]', 1, 'Kì trung gian chuẩn bị vật chất, phân bào (M) thực hiện chia tế bào.'),
(10, 'Kết quả của quá trình nguyên phân từ 1 tế bào mẹ (2n) tạo ra?', '["2 tế bào con có bộ NST n", "2 tế bào con có bộ NST 2n giống mẹ", "4 tế bào con có bộ NST n", "4 tế bào con có bộ NST 2n"]', 1, 'Nguyên phân duy trì ổn định bộ NST của loài qua các thế hệ tế bào.'),
(10, 'Ý nghĩa quan trọng nhất của giảm phân là gì?', '["Tạo ra nhiều tế bào con nhất", "Tạo ra các giao tử có bộ NST giảm đi một nửa", "Giúp cơ thể lớn nhanh", "Thay thế các tế bào già"]', 1, 'Sự giảm số lượng NST giúp phục hồi bộ NST 2n sau khi thụ tinh.'),
(10, 'Enzyme là gì?', '["Một loại chất béo", "Chất xúc tác sinh học có bản chất là protein", "Vật chất di truyền", "Sản phẩm của quá trình bài tiết"]', 1, 'Enzyme giúp các phản ứng hóa sinh trong cơ thể xảy ra nhanh chóng ở điều kiện bình thường.'),
(10, 'Vi khuẩn sinh sản chủ yếu bằng hình thức nào?', '["Nảy chồi", "Bào tử", "Phân đôi", "Sinh sản hữu tính"]', 2, 'Tế bào vi khuẩn chỉ cần nhân đôi DNA rồi thắt màng để chia thành 2 tế bào mới.'),
(10, 'Virus được coi là gì?', '["Cơ thể đa bào phức tạp", "Thực thể chưa có cấu tạo tế bào", "Một loại vi khuẩn đặc biệt", "Sinh vật tự dưỡng"]', 1, 'Virus sống ký sinh bắt buộc inside cells khác và không thể tự trao đổi chất.'),
(10, 'Sử dụng vi sinh vật để sản xuất sữa chua là ứng dụng của quá trình nào?', '["Lên men Lactic", "Lên men Ethylic", "Quang hợp", "Phân giải Protein"]', 0, 'Vi khuẩn Lactic chuyển hóa đường thành acid lactic làm sữa đông tụ và có vị chua.'),

-- LỚP 11 (SINH HỌC 11)
(11, 'Thực vật hấp thụ nước từ đất chủ yếu qua bộ phận nào?', '["Bề mặt lá", "Tế bào lông hút ở rễ", "Thân cây", "Chóp rễ"]', 1, 'Lông hút tạo bề mặt tiếp xúc lớn giúp hấp thụ nước và khoáng hiệu quả.'),
(11, 'Mạch gỗ (Xylem) vận chuyển chủ yếu những chất nào?', '["Chất hữu cơ tổng hợp từ lá", "Nước và ion khoáng từ rễ lên lá", "Hormone thực vật", "Khí Oxy"]', 1, 'Mạch gỗ là dòng đi lên, vận chuyển nguyên liệu cho quá trình quang hợp.'),
(11, 'Quá trình thoát hơi nước ở thực vật diễn ra chủ yếu qua?', '["Thân cây", "Rễ cây", "Khí khổng ở lá", "Hoa và quả"]', 2, 'Thoát hơi nước tạo lực kéo giúp nước di chuyển từ rễ lên đỉnh cây.'),
(11, 'Nguyên tố nào sau đây là nguyên tố khoáng đại lượng thiết yếu cho thực vật?', '["Sắt (Fe)", "Đồng (Cu)", "Nitơ (N)", "Mangan (Mn)"]', 2, 'N, P, K là các nguyên tố cây cần số lượng lớn để cấu tạo nên các đại phân tử.'),
(11, 'Ở thực vật CAM (như xương rồng), khí khổng mở vào lúc nào?', '["Ban ngày", "Ban đêm", "Lúc trời nắng gắt", "Khi không có gió"]', 1, 'Đây là cơ chế thích nghi để tránh mất nước quá mức trong điều kiện sa mạc nóng bỏng.'),
(11, 'Sắc tố nào trực tiếp tham gia chuyển hóa quang năng thành hóa năng trong quang hợp?', '["Diệp lục b", "Carotenoid", "Diệp lục a ở trung tâm phản ứng", "Xanthophyll"]', 2, 'Chỉ có diệp lục a mới có khả năng kích phát electron để tạo năng lượng hóa học.'),
(11, 'Động vật nhai lại (như bò) có dạ dày gồm mấy ngăn?', '["1 ngăn", "2 ngăn", "3 ngăn", "4 ngăn"]', 3, 'Gồm dạ cỏ, dạ tổ ong, dạ lá sách và dạ múi khế giúp tiêu hóa hiệu quả cỏ.'),
(11, 'Hệ tuần hoàn hở có đặc điểm nào sau đây?', '["Máu luôn chảy trong mạch kín", "Máu chảy trong động mạch và tràn vào khoang cơ thể", "Không có tim", "Tốc độ dòng máu rất nhanh"]', 1, 'Có ở côn trùng, thân mềm... nơi máu tiếp xúc trực tiếp với các tế bào.'),
(11, 'Trong hệ tuần hoàn người, huyết áp thấp nhất ở đâu?', '["Động mạch chủ", "Mao mạch", "Tĩnh mạch chủ", "Động mạch phổi"]', 2, 'Huyết áp giảm dần từ động mạch đến mao mạch và thấp nhất ở tĩnh mạch.'),
(11, 'Một cung phản xạ đầy đủ gồm mấy thành phần?', '["3 thành phần", "4 thành phần", "5 thành phần", "6 thành phần"]', 2, 'Gồm: Thụ thể, Thần kinh cảm giác, Trung ương thần kinh, Thần kinh vận động, Cơ quan phản ứng.'),
(11, 'Hormone thực vật nào có vai trò kích thích sự kéo dài tế bào và hướng sáng?', '["Auxin (IAA)", "Gibberellin", "Abscisic acid", "Ethylene"]', 0, 'Auxin tập trung nhiều ở phía tối làm tế bào phía đó dài ra nhanh hơn, khiến cây cong về phía sáng.'),
(11, 'Hiện tượng thực vật ra hoa phụ thuộc vào độ dài thực tế của ngày và đêm gọi là?', '["Quang hợp", "Quang chu kì", "Tự dưỡng", "Nhịp sinh học"]', 1, 'Dựa vào quang chu kì, người ta chia làm cây ngày ngắn, cây ngày dài và cây trung tính.'),
(11, 'Sự thụ tinh ở thực vật hạt kín được gọi là thụ tinh kép vì?', '["Có hai tinh trùng cùng thụ tinh cho trứng", "Một tinh trùng thụ tinh với trứng, một tinh trùng thụ tinh với nhân cực", "Có hai hoa cùng thụ phấn", "Hạt có hai lá mầm"]', 1, 'Quá trình này tạo ra hợp tử (2n) và nội nhũ (3n) cung cấp dinh dưỡng cho phôi.'),
(11, 'Hệ thần kinh dạng chuỗi hạch có ở nhóm động vật nào?', '["Thủy tức", "Giun đất, côn trùng", "Cá, chim", "Cầu gai"]', 1, 'Các tế bào thần kinh tập trung thành các hạch nằm dọc theo cơ thể.'),
(11, 'Hormone nào sau đây gây ra sự chín ở quả?', '["Cytokinin", "Auxin", "Ethylene", "Gibberellin"]', 2, 'Ethylene là một loại khí tự nhiên được sản sinh khi quả bắt đầu chín.'),

-- LỚP 12 (SINH HỌC 12)
(12, 'Đơn vị mã di truyền nằm trên phân tử mRNA được gọi là?', '["Triplet", "Codon", "Anticodon", "Allele"]', 1, 'Codon là bộ ba nucleotide trên mRNA quy định 1 acid amin.'),
(12, 'Bộ ba nào sau đây có chức năng khởi đầu dịch mã trên mRNA?', '["UAA", "UAG", "UGA", "AUG"]', 3, 'AUG mã hóa cho Methionine và là tín hiệu bắt đầu quá trình dịch mã.'),
(12, 'Quá trình tái bản DNA diễn ra theo những nguyên tắc nào?', '["Bổ sung và bảo toàn", "Bổ sung và bán bảo toàn", "Đa phân và giữ lại", "Tự do và ngẫu nhiên"]', 1, 'Bán bảo toàn nghĩa là trong mỗi DNA con có một mạch là của DNA mẹ.'),
(12, 'Cấu trúc của một Operon Lac ở vi khuẩn E.coli gồm?', '["Gene điều hòa và các gene cấu trúc", "Vùng vận hành, vùng khởi động và nhóm gene cấu trúc", "Gene chỉ huy và gene tổng hợp", "DNA và ARN"]', 1, 'Cấu trúc gồm P (Promoter), O (Operator) và các gene Z, Y, A.'),
(12, 'Đột biến điểm là những biến đổi như thế nào?', '["Thay đổi số lượng cả bộ NST", "Biến đổi liên quan đến 1 cặp nucleotide trong gene", "Mất một đoạn nhiễm sắc thể", "Tạo ra một loài mới"]', 1, 'Gồm thay thế, mất hoặc thêm 1 cặp nucleotide.'),
(12, 'Quy luật phân li của Mendel thực chất nói về sự phân li của?', '["Các tính trạng", "Cặp Allele trong quá trình giảm phân tạo giao tử", "Kiểu hình ở đời con", "Các bào quan"]', 1, 'Mỗi giao tử chỉ chứa một thành viên của cặp gene.'),
(12, 'Tần số hoán vị gene (f) không bao giờ vượt quá bao nhiêu %?', '["25%", "50%", "75%", "100%"]', 1, 'Tần số hoán vị gene dao động từ 0% đến 50%.'),
(12, 'Gene ngoài nhân thường nằm ở những bào quan nào?', '["Ty thể và Lục lạp", "Ribosome và Bộ máy Golgi", "Lưới nội chất", "Nhân"]', 0, 'Ty thể và lục lạp có hệ gene riêng, di truyền theo dòng mẹ.'),
(12, 'Ưu thế lai là hiện tượng gì?', '["Con lai yếu hơn bố mẹ", "Con lai có các đặc điểm vượt trội so với bố mẹ", "Con lai giống hệt mẹ", "Con lai không thể sinh sản"]', 1, 'Hiện tượng này thường rõ nhất ở đời F1 sau đó giảm dần qua các thế hệ.'),
(12, 'Trong công nghệ DNA tái tổ hợp, vật trung gian thường được dùng để chuyển gene là?', '["Vi khuẩn", "Virus", "Plasmid hoặc thể truyền", "Tế bào động vật"]', 2, 'Plasmid là DNA vòng nhỏ trong vi khuẩn có khả năng tự nhân đôi độc lập.'),
(12, 'Cừu Dolly được tạo ra bằng phương pháp nào?', '["Lai hữu tính", "Gây đột biến", "Nhân bản vô tính bằng chuyển nhân tế bào sinh dưỡng", "Cấy truyền phôi"]', 2, 'Đây là động vật đầu tiên được nhân bản từ một tế bào trưởng thành.'),
(12, 'Chọn lọc tự nhiên tác động trực tiếp lên cấp độ nào của sinh vật?', '["Kiểu gene", "Kiểu hình", "DNA", "Acid amin"]', 1, 'Môi trường sàng lọc các đặc điểm biểu hiện ra bên ngoài (kiểu hình) của cá thể.'),
(12, 'Loài mới được hình thành phổ biến nhất bằng con đường nào?', '["Cách li địa lí", "Đột biến số lượng NST", "Lai xa và đa bội hóa", "Thay đổi tập tính"]', 0, 'Sự ngăn cách về mặt địa lí ngăn cản sự trao đổi gene, dẫn đến sự khác biệt dần dần tạo loài mới.'),
(12, 'Nhân tố sinh thái được chia làm mấy nhóm chính?', '["Nhóm đất và nước", "Nhóm vô sinh và hữu sinh", "Nhóm cây và con", "Nhóm nhiệt độ và ánh sáng"]', 1, 'Vô sinh (không sống) và hữu sinh (sinh vật và tác động của con người).'),
(12, 'Tháp sinh thái nào sau đây luôn có dạng chuẩn (đáy rộng, đỉnh hẹp)?', '["Tháp số lượng", "Tháp sinh khối", "Tháp năng lượng", "Tất cả các loại tháp"]', 2, 'Năng lượng luôn bị thất thoát qua các bậc dinh dưỡng nên bậc trên luôn ít năng lượng hơn bậc dưới.');
