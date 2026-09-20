# NextGen BioLearn - Nền tảng Học tập Sinh học Trực quan & Trò chơi hóa (Gamification)

## 📌 1. TỔNG QUAN HỆ THỐNG DỰ ÁN
**NextGen BioLearn** (`biolearn-mp`) là nền tảng ứng dụng web học tập Sinh học hiện đại dành cho học sinh phổ thông từ **Lớp 6 đến Lớp 12** bám sát Chương trình Giáo dục Phổ thông mới (bộ sách *Kết nối tri thức với cuộc sống*). Hệ thống ứng dụng toàn diện phương pháp **Trò chơi hóa (Gamification)** kết hợp đồ họa **3D tương tác thời gian thực**, **Đấu trường PvP trực tuyến**, **Phòng thi trực tiếp dành cho Giáo viên**, **Trạm thám hiểm sinh học (Station Expedition)** và **Trợ lý Trí tuệ nhân tạo (AI Biology Tutor)** giúp học sinh tiếp thu kiến thức một cách trực quan, chủ động và say mê.

### Kiến trúc tổng thể hệ thống:
- **Client (Frontend)**: Xây dựng trên nền tảng **React 19** + **Vite 8** + **React Router v7**, tích hợp **Tailwind CSS v4**, **Framer Motion** cho hoạt họa cao cấp, **Three.js** / **React Three Fiber** cho không gian mô phỏng 3D, **Mol* (Molstar)** cho đồ họa cấu trúc đại phân tử sinh học chuyên sâu (PDB) và **`@jvmr/pptx-to-html`** cho trình chiếu Slide bài giảng tương tác.
- **Serverless & BaaS (Backend)**: Nền tảng **Supabase** làm Backend-as-a-Service (BaaS) xử lý Authentication, Postgres Database với hệ thống Row Level Security (RLS), Realtime WebSockets Presence/Broadcast channels cho đấu trường PvP và phòng thi giáo viên, cùng Cloud Storage bucket `avatars`.
- **AI Engine**: Tích hợp trực tiếp Google GenAI SDK (`@google/genai`) vận hành mô hình trí tuệ nhân tạo Google Gemini hỗ trợ giải đáp kiến thức Sinh học, phân tích ngữ cảnh câu hỏi và gợi ý ôn tập theo thời gian thực.
- **Integration & Observability**: Tích hợp **EmailJS** gửi email thông báo tự động (Mã phê duyệt giáo viên 60 phút, phục hồi mật khẩu, hỗ trợ tài khoản) và hệ thống Telemetry/Observability nội bộ ghi nhận nhật ký vận hành `system_logs`, đo lường chỉ số DAU và hiệu suất tính năng.

---

## 🛠️ 2. DANH MỤC CÔNG NGHỆ & THƯ VIỆN SỬ DỤNG (TECH STACK)

### Core Frontend & UI Framework:
- **React 19** (`react@^19.2.4`, `react-dom@^19.2.4`): Thư viện dựng giao diện người dùng mới nhất với hiệu năng tối ưu.
- **Vite 8** (`vite@^8.0.4`): Build tool và Development Server siêu tốc.
- **React Router v7** (`react-router-dom@^7.14.1`): Quản lý luồng điều hướng và routing phía client.
- **Tailwind CSS v4** (`@tailwindcss/vite@^4.2.2`, `tailwindcss@^4.2.2`): Framework CSS thiết kế giao diện Liquid Glassmorphism hiện đại.
- **Framer Motion** (`framer-motion@^13.2.0`): Thư viện tạo hiệu ứng chuyển động và tương tác vi mô (micro-interactions) cao cấp.
- **Lucide React** (`lucide-react@^1.8.0`): Bộ biểu tượng chuẩn UI/UX trực quan.
- **PPTX to HTML** (`@jvmr/pptx-to-html@^1.0.1`): Render Slide bài giảng PowerPoint (.pptx) trực tiếp trên trình duyệt web.
- **Sass / PostCSS / Autoprefixer** (`sass@^1.83.4`, `postcss@^8.5.10`, `autoprefixer@^10.5.0`): Công cụ tiền xử lý CSS.

### Đồ họa 3D & Mô phỏng Đại phân tử Sinh học:
- **Three.js** (`three@^0.184.0`): Thư viện đồ họa 3D WebGL lõi.
- **React Three Fiber** (`@react-three/fiber@^9.6.0`): Wrapper React cho Three.js dựng cảnh quan 3D dạng declarative.
- **React Three Drei** (`@react-three/drei@^10.7.7`): Bộ helper mở rộng cho React Three Fiber (OrbitControls, Canvas, Html, Float, Center, Light, ...).
- **Molstar** (`molstar@5.6.1`): Thư viện đồ họa cấu trúc sinh học chuyên sâu dùng nạp và kết xuất dữ liệu phân tử chuẩn RCSB PDB.

### Backend, Database & Dịch vụ Tích hợp:
- **Supabase JS Client** (`@supabase/supabase-js@^2.103.3`): Client giao tiếp chính thức với Supabase BaaS (Auth, Postgres, Realtime, Storage).
- **Google GenAI** (`@google/genai@^1.50.1`): SDK kết nối Google Gemini AI.
- **EmailJS** (`@emailjs/browser@^4.4.1`): Dịch vụ gửi email tự động hóa từ client.
- **Firebase** (`firebase@^12.12.0`): Dịch vụ nền tảng bổ trợ.
- **Vercel Analytics** (`@vercel/analytics@^2.0.1`): Đo lường chỉ số truy cập người dùng.
- **Axios** (`axios@^1.15.0`): HTTP Client gửi yêu cầu RESTful API.

---

## 🔐 3. PHÂN QUYỀN NGƯỜI DÙNG & CƠ CHẾ BẢO MẬT (ROLE & ACCESS CONTROL)

Hệ thống quản lý 4 nhóm quyền truy cập chính:

1. **Khách / Người dùng vãng lai (`guest`)**:
   - Khám phá Trang giới thiệu Landing Page (`LandingPage.jsx`).
   - Truy cập Trung tâm Hướng dẫn & Tài nguyên (`LandingResourcePage.jsx`) gồm: Hướng dẫn sử dụng (`/guide`), Bộ câu hỏi thường gặp (`/faq`), Chính sách bảo mật & Điều khoản (`/privacy`).
   - Đăng nhập (`LoginPage.jsx`), Đăng ký tài khoản mới (`RegisterPage.jsx`) hoặc Đăng nhập nhanh thông qua Google OAuth 2.0.
   - Gửi yêu cầu khôi phục/đặt lại mật khẩu qua email.

2. **Học sinh (`student`)**:
   - **Bảng điều khiển (HomePage)**: Theo dõi tiến độ khối lớp, thanh chỉ số nhân vật (Cấp độ, XP, Xu vàng, Thể lực 20/20, Chuỗi ngày đăng nhập Streak), Hòm thư cá nhân (Mailbox) với cơ chế tự động dọn dẹp sau 7 ngày, Danh hiệu đang trang bị (Equipped Badge), Lối tắt truy cập Phòng thí nghiệm ảo và Video cổng vũ trụ Cloudinary.
   - **Bản đồ học tập (MapPage)**: Lộ trình bài học Lớp 6 đến Lớp 12 theo đường zíc-zắc, 10 màn chơi/bài, 2 màn thực hành (P1, P2)/chương, thử thách Học vượt chương (Skip Challenge), chỉ báo thể loại câu hỏi (Trắc nghiệm, Ghép cặp, Điền từ) và nút nổi định vị vị trí nhân vật (Target FAB).
   - **Màn chơi tương tác (GamePlayPage)**: Trải nghiệm 5 dạng thử thách (Trắc nghiệm 4 lựa chọn, Đúng/Sai, Điền khuyết, Ghép đôi khái niệm, Mini-game 3D tích hợp), cơ chế tính chuỗi đúng combo, trừ thể lực khi sai, xem modal Lý thuyết bài học, phát âm thanh hiệu ứng SFX và đồng bộ phần thưởng an toàn qua RPC `reward_user`.
   - **Trận chiến Đấu Trùm (BossBattlePage)**: Trận đấu Canvas 2D Runner kết hợp câu hỏi trắc nghiệm độ khó cao, thanh máu Boss, hiệu ứng ngọn lửa 3D `BurningFlame` và phần thưởng giá trị.
   - **Mini-Game hồi phục Thể lực (MiniGamePage)**: Trò chơi lật 28 thẻ bài ghi nhớ thuật ngữ Sinh học để nạp lại năng lượng (giới hạn tối đa 2 lần nhận thưởng/ngày).
   - **Phòng thí nghiệm ảo 3D (SimulationsPage)**: 17 Game mô phỏng 3D Sinh học chuyên sâu hỗ trợ trình phát toàn màn hình, nhạc nền không gian "Microscopic Voyage", cơ chế Lazy Loading và lớp bảo vệ WebGL ErrorBoundary.
   - **Mô hình Sinh học 3D (Biology3DPage)**: Trung tâm tương tác 9 mô hình 3D Visualizer và cấu trúc đại phân tử chuẩn RCSB PDB Molstar.
   - **Trạm thám hiểm (StationExpeditionPage)**: Lộ trình khám phá 10 ngày tương tác, chọn thú cưng đồng hành (Rùa, Ốc sên, Khủng long), 5 dạng game thử thách, hệ thống gợi ý 2 tầng và đánh giá tối đa 30 sao/trạm.
   - **Đấu trường PvP 1v1 Realtime (BattlePage & BattlePvPPage)**: Ghép trận tự động qua Realtime Presence, thi đấu thời gian thực qua Realtime Broadcast (`battle:${roomId}`), đồng bộ đếm ngược, thanh máu, câu hỏi, phân định thắng/thua, xếp hạng ELO và hỗ trợ kết nối lại khi rớt mạng (`pvp_live_matches`).
   - **Bảng xếp hạng (LeaderboardPage)**: Xem Bảng xếp hạng Toàn cầu, Bảng xếp hạng Tuần (`weekly_scores`), Điểm PvP ELO; hỗ trợ tìm kiếm học sinh, xem bộ sưu tập Danh hiệu/Thành tựu và loại trừ tài khoản kiểm thử (`is_test_account`).
   - **Nhiệm vụ (MissionPage)**: Hệ thống nhiệm vụ hàng ngày và hàng tuần (Điểm danh, Hoàn thành bài học, Thắng trận PvP) với cơ chế tự động làm mới lúc 00:00 qua RPC `check_and_reset_missions`.
   - **Hồ sơ cá nhân (ProfilePage)**: Quản lý thông tin tài khoản, đổi tên hiển thị, chọn avatar có sẵn hoặc tải ảnh cá nhân lên Supabase Storage bucket `avatars`, xem chi tiết tỷ lệ thắng/thua, lịch sử bài học và chọn trang bị Danh hiệu/Thành tựu.
   - **Phòng thi của Giáo viên (StudentQuizRoomPage)**: Tham gia phòng thi trực tuyến hoặc phòng thi theo lịch của Giáo viên thông qua Mã PIN 6 chữ số, nhận câu hỏi đồng bộ và xem kết quả xếp hạng trực tiếp.
   - **Trợ lý AI Sinh học (`ChatboxAI.jsx`)**: Tương tác trực tiếp với Trợ lý Gemini AI hỗ trợ giải thích hiện tượng sinh học, gợi ý giải bài tập và tự động nhận diện danh tính người dùng.

3. **Giáo viên (`teacher`)**:
   - Truy cập Cổng thông tin Giáo viên toàn diện (`TeacherPage.jsx`).
   - **Bảng tổng quan (Dashboard)**: Thống kê số lượng phòng thi đã tạo, tổng số lượt làm bài của học sinh và danh sách các phòng thi đang mở.
   - **Bộ tạo đề thi thông minh (Universal Quiz Parser V2)**: Tải lên tệp Word (`.docx`), tệp văn bản (`.txt`) hoặc Dán trực tiếp văn bản thô. Thuật toán tự động nhận diện cấu trúc câu hỏi, bóc tách phương án A-B-C-D, xác định đáp án đúng và lời giải thích.
   - **Quản lý phòng thi (Quiz Rooms)**: Khởi tạo phòng thi dạng Trực tiếp (Live Host Control) hoặc Theo lịch hẹn giờ mở/đóng (`quiz_rooms`). Tự động phát sinh mã PIN ngẫu nhiên 6 chữ số.
   - **Sảnh điều khiển phòng thi trực tiếp (Live Control Room)**: Theo dõi danh sách học sinh tham gia theo thời gian thực (Realtime Presence), Bắt đầu thi, Chuyển câu hỏi tiếp theo, Tạm dừng, Công bố đáp án đúng, Hiển thị Bảng xếp hạng live và Đóng phòng thi (`closed_at`).
   - **Chế độ mở lại phiên thi (Revision Mode)**: Cho phép mở lại bài thi cho lượt học sinh mới mà vẫn giữ nguyên mã phòng 6 số, bảo tồn lịch sử thi cũ, hỗ trợ xáo trộn thứ tự câu hỏi (`reopen_shuffle`) và khóa hiện diện (`presence_lock`).
   - **Phân tích sư phạm & Xuất báo cáo**: Biểu đồ phân tích tỷ lệ đúng/sai từng câu hỏi, phân bố điểm số học sinh và xuất kết quả chi tiết ra tệp Excel CSV mã hóa UTF-8 BOM chuẩn tiếng Việt.

4. **Quản trị viên (`admin`)**:
   - **Bảng điều khiển trung tâm (`AdminPage.jsx`)**: Thống kê tổng số tài khoản, biểu đồ phân bố vai trò, đếm số người dùng online thời gian thực trong 3 phút gần nhất (`system-online-users`), duyệt đơn đăng ký Giáo viên và gửi email chứa mã phê duyệt 60 phút qua EmailJS.
   - **Quản lý người dùng (`AdminUsersPage.jsx`)**: Tìm kiếm, lọc vai trò (Student, Teacher, Admin), Khóa/Mở khóa tài khoản kèm lý do bắt buộc (`lock_reason`) và thời điểm khóa (`locked_at`), Đặt lại chỉ số tiến độ (Reset stats), Xóa tài khoản triệt để (Cascade deletion), đánh dấu tài khoản kiểm thử (`is_test_account`) và gửi email thông báo cá nhân trực tiếp qua EmailJS.
   - **Nhật ký & Giám sát hệ thống (`AdminLogsPage.jsx`)**: Giám sát vận hành (Observability Telemetry), lọc mức độ log (INFO, WARN, ERROR, CRITICAL), xem dấu vết lỗi crash runtime client và xuất báo cáo nhật ký.
   - **Báo cáo & Phân tích chuyên sâu (`AdminReportsPage.jsx`)**: Đo lường chỉ số người dùng hoạt động theo ngày (DAU `daily_active_users`), thống kê lượt tương tác từng tính năng (`feature_metrics_daily`, `feature_daily_users`), bài học phổ biến và phân tích tỷ lệ giữ chân học sinh.
   - **CMS Trạm thám hiểm (`AdminStationPage.jsx`)**: Quản lý nội dung câu hỏi Trạm thám hiểm cho 7 khối lớp (Lớp 6 đến 12) x 3–4 trạm/lớp x 10 ngày/trạm, cấu hình 5 dạng mini-game, dữ liệu gợi ý (hint) và giải thích chuyên sâu (explanation).
   - **CMS Quản lý Nội dung 3D (`AdminContentPage.jsx`)**: Quản trị bật/tắt (khóa bảo trì hoặc mở lại) đối với từng Game mô phỏng 3D (17 game) và từng Mô hình 3D (9 mô hình) thông qua bảng `content_controls`.
   - **CMS Quản trị Bản đồ học tập (`AdminMapPage.jsx`)**: Quản lý chi tiết từng Khối lớp, Chương, Bài học, Màn học (Lesson), Màn thực hành (Practice) và Thử thách Học vượt (Skip Challenge); biên tập trực tiếp JSON câu hỏi, lý thuyết và trạng thái khóa màn chơi.
   - **CMS Quản trị Chương trình học (`MorePage.jsx` & `/admin/lessons`)**: Duyệt và chỉnh sửa toàn bộ dữ liệu câu hỏi, nội dung lý thuyết, cấu trúc cấp độ bài học của cả 7 khối lớp (Lớp 6 đến Lớp 12).

### Cơ chế Bảo mật & Quản lý Trạng thái Hệ thống:
- **Row Level Security (RLS)**: Chính sách kiểm soát truy cập mức hàng được áp dụng triệt để trên toàn bộ 26 bảng Postgres trong Supabase.
- **Tự động kích hoạt Profile**: Trigger `handle_new_user()` tự động khởi tạo bản ghi dữ liệu tại bảng `profiles` khi người dùng đăng ký mới thành công qua Supabase Auth.
- **Tự động Phục hồi Thể lực (Stamina Regeneration)**: Tự động cộng +1 Thể lực sau mỗi 5 phút (tối đa 20 điểm) dựa trên mốc thời gian `last_stamina_update`.
- **Tự động Cập nhật Chuỗi Đăng nhập (Login Streak)**: Thuật toán tự động xác định ngày học liên tục dựa trên mốc `last_active_at` và `last_streak_date`.
- **Bảo toàn Phần thưởng (Reward Integrity)**: Kiểm soát nghiêm ngặt việc cộng điểm thưởng XP, Xu và Cấp độ thông qua bảng sổ cái `reward_ledger`, ngăn chặn hành vi gian lận và nhận thưởng trùng lặp.
- **Khóa tài khoản Toàn màn hình (Account Lock Overlay)**: Khi tài khoản bị đánh dấu `is_locked = true`, ứng dụng kích hoạt màn hình chặn truy cập màu đỏ thẫm hiển thị lý do khóa chi tiết, thời gian khóa, số tổng đài hotline `(+84) 83 8667 369` và email hỗ trợ `support@biolearn.com`.
- **Phân loại Tài khoản Kiểm thử (Test Account Isolation)**: Đánh dấu cờ `is_test_account` để tự động loại trừ các tài khoản thử nghiệm của nhà phát triển khỏi Bảng xếp hạng học sinh công khai.

---

## 🖥️ 4. DANH MỤC 28 TRANG GIAO DIỆN & MÔ-ĐUN CHỨC NĂNG FRONTEND

Dưới đây là bảng tổng hợp đầy đủ **28 trang giao diện** đang hoạt động trong hệ thống:

| STT | Tên tệp component | Tuyến đường (Route) | Phân quyền truy cập | Chức năng chi tiết |
|---|---|---|---|---|
| 1 | `LandingPage.jsx` | `/` | Công cộng (Public) | Trang giới thiệu tổng quan sản phẩm, Hero section, các phân khu tính năng nổi bật, xem trước khối lớp và nút CTA. |
| 2 | `LandingResourcePage.jsx` | `/guide`, `/faq`, `/privacy` | Công cộng (Public) | Trang tài nguyên thông tin: Hướng dẫn sử dụng hệ thống (`/guide`), Câu hỏi thường gặp (`/faq`), Chính sách bảo mật & Điều khoản (`/privacy`). |
| 3 | `LoginPage.jsx` | `/login` | Công cộng (Public) | Đăng nhập bằng Email/Mật khẩu hoặc Google OAuth 2.0. Hỗ trợ modal khôi phục và đặt lại mật khẩu qua email. |
| 4 | `RegisterPage.jsx` | `/register` | Công cộng (Public) | Đăng ký tài khoản mới, lựa chọn vai trò mong muốn (Học sinh hoặc Giáo viên). |
| 5 | `HomePage.jsx` | `/home` | Học sinh (`student`) | Dashboard chính: Danh mục khối lớp 6–12, thông số nhân vật (XP, Xu, Thể lực, Streak, Level, Rank), Danh hiệu trang bị, Hòm thư, Video cổng vũ trụ Cloudinary. |
| 6 | `ClassSelectPage.jsx` | `/class-select` | Học sinh (`student`) | Giao diện lựa chọn Khối lớp trực quan (Lớp 6 đến Lớp 12) kèm tỷ lệ % tiến độ hoàn thành tương ứng. |
| 7 | `MapPage.jsx` | `/map/:classId` | Học sinh (`student`) | Bản đồ đường dẫn học tập zíc-zắc theo Chương và Bài học. 10 màn chơi/bài, 2 màn thực hành/chương, thử thách Học vượt, huy hiệu thể loại game, nút Target FAB định vị. |
| 8 | `GamePlayPage.jsx` | `/play/:classId/:chapterId/:lessonId` | Học sinh (`student`) | Màn hình làm bài học tương tác: 5 dạng câu hỏi (Trắc nghiệm, Đúng/Sai, Điền khuyết, Ghép đôi, 3D), tính chuỗi combo, âm thanh SFX, RPC cộng thưởng an toàn. |
| 9 | `BossBattlePage.jsx` | `/boss/:classId/:chapterId/:lessonId` | Học sinh (`student`) | Trận Đấu Trùm cuối chương: Canvas 2D Runner + câu hỏi thách thức, thanh máu Boss HP, hiệu ứng ngọn lửa 3D `BurningFlame`, phần thưởng vượt trội. |
| 10 | `MiniGamePage.jsx` | `/minigame/:classId` | Học sinh (`student`) | Trò chơi lật 28 thẻ bài ghi nhớ thuật ngữ Sinh học để khôi phục điểm Thể lực (tối đa 2 lần nhận thưởng/ngày). |
| 11 | `SimulationsPage.jsx` | `/simulations` | Học sinh (`student`) | Kho 17 Game mô phỏng 3D Sinh học tương tác: Lọc theo khối lớp 6–12, trình phát toàn màn hình, nhạc nền "Microscopic Voyage", bắt lỗi WebGL ErrorBoundary. |
| 12 | `Biology3DPage.jsx` | `/biology3d` | Học sinh (`student`) | Trung tâm tương tác 9 Mô hình 3D Visualizer & Trình xem cấu trúc đại phân tử chuẩn RCSB PDB Molstar. |
| 13 | `StationExpeditionPage.jsx` | `/stations` | Học sinh / Admin | Chế độ Học theo Trạm thám hiểm: Bản đồ 10 ngày, chọn thú cưng đồng hành (Rùa, Ốc sên, Khủng long), 5 dạng game thử thách, gợi ý 2 tầng, tối đa 30 sao/trạm. |
| 14 | `BattlePage.jsx` | `/battle` | Học sinh (`student`) | Sảnh chờ Đấu trường PvP 1v1: Tìm trận tự động qua Realtime Presence, hiển thị danh sách người chơi online, gửi lời mời thách đấu, chọn Đấu Hạng hoặc Đấu Nhanh. |
| 15 | `BattlePvPPage.jsx` | `/battle-pvp` | Học sinh (`student`) | Trận đấu PvP 1v1 Realtime trực tiếp qua Realtime Broadcast: Đồng bộ đếm ngược, câu hỏi, thanh máu, điểm số hai bên, phân định thắng/thua, cộng/trừ ELO và hỗ trợ kết nối lại. |
| 16 | `LeaderboardPage.jsx` | `/leaderboard` | Học sinh (`student`) | Bảng xếp hạng Toàn cầu, Bảng xếp hạng Tuần (`weekly_scores`), Bảng điểm PvP ELO; tìm kiếm học sinh, xem bộ sưu tập Danh hiệu/Huy hiệu, loại trừ tài khoản kiểm thử. |
| 17 | `MissionPage.jsx` | `/missions` | Học sinh (`student`) | Hệ thống Nhiệm vụ Hàng ngày & Hàng tuần (Điểm danh, Làm bài học, Thắng PvP); theo dõi tiến độ thực tế, nhận thưởng Xu/XP và tự động làm mới lúc 00:00. |
| 18 | `ProfilePage.jsx` | `/profile` | Học sinh (`student`) | Hồ sơ cá nhân: Đổi tên hiển thị, thay đổi avatar hoặc upload ảnh cá nhân lên Supabase Storage `avatars`, thống kê thắng/thua, lịch sử bài học và chọn trang bị Danh hiệu. |
| 19 | `StudentQuizRoomPage.jsx` | `/quiz-room` | Học sinh (`student`) | Giao diện Học sinh tham gia Phòng thi của Giáo viên qua mã PIN 6 số: Sảnh chờ realtime, nhận câu hỏi đồng bộ từ giáo viên, làm bài đếm ngược và xem xếp hạng live. |
| 20 | `TeacherPage.jsx` | `/teacher` | Giáo viên (`teacher`) | Cổng thông tin Giáo viên: Quản lý phòng thi (Trực tiếp hoặc Theo lịch), bộ bóc tách đề thi Universal Quiz Parser V2 (.docx, .txt, paste), sảnh điều khiển live, mở lại phiên thi, xuất Excel CSV UTF-8 BOM. |
| 21 | `AdminPage.jsx` | `/admin` | Quản trị viên (`admin`) | Dashboard Quản trị tổng thể: Thống kê số lượng user, đếm số user online realtime trong 3 phút gần nhất, duyệt yêu cầu nâng cấp Giáo viên và gửi email mã xác thực 60 phút. |
| 22 | `AdminUsersPage.jsx` | `/admin/users` | Quản trị viên (`admin`) | Quản lý người dùng toàn hệ thống: Tìm kiếm, lọc vai trò, Khóa/Mở khóa tài khoản kèm lý do bắt buộc, Reset tiến độ học tập, Xóa tài khoản triệt để, cờ test account và gửi email cá nhân. |
| 23 | `AdminLogsPage.jsx` | `/admin/logs` | Quản trị viên (`admin`) | Nhật ký Hệ thống & Giám sát (Observability/Telemetry): Xem log real-time, lọc cấp độ (INFO, WARN, ERROR, CRITICAL), xem vết lỗi crash runtime client và xuất log. |
| 24 | `AdminReportsPage.jsx` | `/admin/reports` | Quản trị viên (`admin`) | Báo cáo & Phân tích chuyên sâu: Biểu đồ DAU, thống kê tương tác tính năng `feature_metrics_daily`, bài học phổ biến, tỷ lệ làm bài đúng/sai. |
| 25 | `AdminStationPage.jsx` | `/admin/stations` | Quản trị viên (`admin`) | CMS Quản trị Trạm thám hiểm: Biên tập câu hỏi 7 khối lớp x 3–4 trạm x 10 ngày, quản lý 5 dạng mini-game, dữ liệu gợi ý (hint) và giải thích chuyên sâu (explanation). |
| 26 | `AdminContentPage.jsx` | `/admin/content` | Quản trị viên (`admin`) | CMS Quản trị Nội dung 3D: Bật/tắt trạng thái khóa bảo trì cho 17 Game mô phỏng 3D và 9 Mô hình 3D Sinh học thông qua bảng `content_controls`. |
| 27 | `AdminMapPage.jsx` | `/admin/map` | Quản trị viên (`admin`) | CMS Quản trị Bản đồ học tập: Quản lý chi tiết từng Khối lớp, Chương, Bài học, Màn học, Màn thực hành, Thử thách Học vượt; biên tập trực tiếp JSON câu hỏi và trạng thái khóa màn. |
| 28 | `MorePage.jsx` | `/more` & `/admin/lessons` | Học sinh / Admin | CMS Quản trị Nội dung Chương trình học: Duyệt và chỉnh sửa dữ liệu câu hỏi, lý thuyết, cấu trúc cấp độ bài học của cả 7 khối lớp (Lớp 6 đến Lớp 12). |

---

## 🧬 5. DANH MỤC 9 MÔ HÌNH 3D VISUALIZER & CẤU TRÚC PHÂN TỬ

Tọa lạc trong thư mục `src/components/biology3d/`, cung cấp công cụ tương tác đồ họa không gian 3 chiều:

1. **`AnimalCell.jsx`**: Mô hình Tế bào Động vật 3D tương tác. Cho phép xoay, thu phóng và bóc tách quan sát các bào quan: Nhân tế bào (Nucleus), Ti thể (Mitochondria), Lưới nội chất (ER), Bộ máy Golgi, Lysosome, Ribosome, Màng tế bào.
2. **`PlantCell.jsx`**: Mô hình Tế bào Thực vật 3D tương tác. Khảo sát chi tiết Lục lạp (Chloroplast), Không bào lớn trung tâm (Vacuole), Thành tế bào cellulose (Cell Wall), Nhân và Ti thể.
3. **`DNAHelix.jsx`**: Mô hình Chuỗi xoắn kép DNA 3D chuyển động quay tự nhiên, trực quan hóa các liên kết hydrogen giữa các cặp base nitơ bổ sung (Adenine - Thymine, Guanine - Cytosine).
4. **`HumanBody.jsx`**: Mô hình Hệ cơ quan Cơ thể người 3D (Não bộ, Tim, Phổi, Hệ tiêu hóa, Thận, Gan) tích hợp thông tin giải phẫu học chi tiết.
5. **`MicroscopeView.jsx`**: Kính hiển vi Ảo 3D. Mô phỏng thao tác điều chỉnh ốc sơ cấp, ốc vi cấp, thay đổi vật kính (4x, 10x, 40x, 100x) và nạp các mẫu tiêu bản quan sát (Biểu bì hành tây, Tế bào máu, Nhu mô lá, Vi khuẩn).
6. **`MolstarViewer.jsx`**: Trình xem cấu trúc đại phân tử sinh học chuyên sâu tích hợp thư viện **Mol* (Molstar)**. Cho phép nạp dữ liệu phân tử chuẩn RCSB PDB với nhiều chế độ kết xuất (Cartoon, Spacefill, Ball and Stick, Molecular Surface).
7. **`ProteinViewer.jsx`**: Mô hình hiển thị cấu trúc không gian 3 chiều của phân tử Protein dựng bằng Three.js.
8. **`VirusViewer.jsx`**: Mô hình 3D Cấu trúc Virus (Thể thực khuẩn Bacteriophage, Virus Corona) hiển thị chi tiết vỏ Capsid, gai Glycoprotein và lõi Axit Nucleic.
9. **`Photosynthesis.jsx`**: Mô hình 3D Mô phỏng Cơ chế Quang hợp ở thực vật (Pha sáng trên màng thylakoid và Pha tối / Chu trình Calvin trong chất nền stroma của lục lạp).

---

## 🎮 6. DANH MỤC 17 MINI-GAME SINH HỌC 3D TƯƠNG TÁC

Tọa lạc trong thư mục `src/components/games/`, được tích hợp công nghệ Three.js / React Three Fiber hỗ trợ học tập thực nghiệm:

1. **`MicroorganismGame3D.jsx` (Lớp 6)**: Game 3D Vi sinh vật. Quan sát vi khuẩn, virus, nấm men dưới kính hiển vi tương tác.
2. **`CellAssemblyGame3D.jsx` (Lớp 6)**: Game 3D Lắp ghép Tế bào. Kéo thả và định vị chính xác các bào quan vào mô hình tế bào động vật và thực vật 3D.
3. **`EcosystemGame3D.jsx` (Lớp 6)**: Game 3D Hệ sinh thái. Xây dựng và điều tiết chuỗi thức ăn, lưới thức ăn sinh thái giữa các nhóm sinh vật.
4. **`PlantStructureGame3D.jsx` (Lớp 7)**: Game 3D Cấu tạo Thực vật. Khám phá mô hình giải phẫu rễ, thân, lá, hoa, quả của cây xanh.
5. **`InvertebrateGame3D.jsx` (Lớp 7)**: Game 3D Phân loại Động vật. Phân loại và nhận diện đặc điểm cấu tạo của động vật có xương sống và không xương sống.
6. **`OxygenJourneyGame3D.jsx` (Lớp 8)**: Game 3D Hành trình Oxy. Mô phỏng đường đi của phân tử O₂ và CO₂ từ phế nang phổi qua tim đến tế bào mô.
7. **`DigestiveGame3D.jsx` (Lớp 8)**: Game 3D Hệ Tiêu hóa. Tái hiện hành trình thức ăn và cơ chế tác động enzym tiêu hóa từ khoang miệng đến ruột già.
8. **`NervousSystemGame3D.jsx` (Lớp 8)**: Game 3D Hệ Thần kinh. Khám phá cấu trúc não bộ, tế bào nơ-ron và cơ chế truyền xung qua cung phản xạ.
9. **`DNABuilderGame3D.jsx` (Lớp 9)**: Game 3D Xây dựng ADN. Thực hành ghép các cặp base A-T, G-C theo nguyên tắc bổ sung tạo chuỗi xoắn kép.
10. **`MendelGame3D.jsx` (Lớp 9)**: Game 3D Lai giống Mendel. Mô phỏng các thí nghiệm lai giống một và hai cặp tính trạng trên bảng Punnett tương tác.
11. **`MitosisGame3D.jsx` (Lớp 10)**: Game 3D Nguyên phân. Điều khiển và quan sát hành vi của nhiễm sắc thể qua 4 kỳ phân bào nguyên phân.
12. **`PhotosynthesisGame3D.jsx` (Lớp 10)**: Game 3D Quang hợp. Mô phỏng cơ chế thu nhận photon ánh sáng, chuỗi truyền điện tử và chu trình Calvin trong lục lạp.
13. **`EnzymeGame3D.jsx` (Lớp 10)**: Game 3D Enzyme & Chuyển hóa. Tương tác mô hình ổ khóa - chìa khóa giữa trung tâm hoạt động của enzyme và cơ chất.
14. **`HomeostasisGame3D.jsx` (Lớp 11)**: Game 3D Cân bằng Nội môi. Điều chỉnh cơ chế sinh lý duy trì ổn định thân nhiệt, áp suất thẩm thấu và đường huyết.
15. **`PlantTransportGame3D.jsx` (Lớp 11)**: Game 3D Vận chuyển Thực vật. Khảo sát động lực dòng mạch gỗ, dòng mạch rây và thoát hơi nước qua khí khổng.
16. **`EvolutionGame3D.jsx` (Lớp 12)**: Game 3D Tiến hóa & Chọn lọc Tự nhiên. Mô phỏng học thuyết Darwin, biến động tần số alen và quá trình hình thành loài.
17. **`MutationGame3D.jsx` (Lớp 12)**: Game 3D Đột biến Gen & Nhiễm sắc thể. Tương tác các tác nhân lý hóa gây đột biến điểm và đột biến cấu trúc nhiễm sắc thể.

---

## 🤖 7. TRỢ LÝ AI & DỊCH VỤ TÍCH HỢP NỔI BẬT

### Trợ lý AI Sinh học (`ChatboxAI.jsx`)
- **Động cơ AI**: Sử dụng SDK chính thức `@google/genai` kết hợp mô hình Google Gemini.
- **Tính năng**:
  - Giải thích khái niệm Sinh học, hướng dẫn giải bài tập từ Lớp 6 đến Lớp 12.
  - Phân tích ngữ cảnh bài học hiện tại để đề xuất câu hỏi ôn tập tương ứng.
  - Định dạng hiển thị Markdown phong phú (Bảng biểu so sánh, danh sách, khối công thức, mã màu).
  - Tự động nhận diện thông tin người dùng (tên hiển thị, lớp học hiện tại) để cá nhân hóa lời thoại.

### Dịch vụ Email Thông báo (`lib/email.js`)
- Tích hợp **EmailJS** gửi email tự động khi:
  - Quản trị viên duyệt đơn đăng ký của Giáo viên, gửi mã phê duyệt kích hoạt có thời hạn 60 phút.
  - Quản trị viên từ chối đơn yêu cầu nâng cấp kèm lý do cụ thể.
  - Quản trị viên gửi email thông báo cá nhân trực tiếp từ giao diện Admin.
  - Người dùng gửi yêu cầu trợ giúp mở khóa tài khoản bị khóa.

### Hệ thống Giám sát & Đo lường (Observability - `lib/observability.js`)
- Tự động thu thập dữ liệu Telemetry (Tần suất sử dụng tính năng `recordFeatureUsage`, vết lỗi runtime, thời gian phản hồi) và lưu trữ trực tiếp vào bảng `system_logs` trên Supabase Database.

---

## 🗄️ 8. CƠ SỞ DỮ LIỆU SUPABASE (CHÍNH XÁC 26 BẢNG DỮ LIỆU)

Chi tiết cấu trúc các cột, khóa chính, khóa ngoại và chỉ mục xem tại [DATABASE.md](file:///c:/TailieucuaMintPhut/NextGen/DATABASE.md). Danh sách **26 bảng dữ liệu** nằm trong schema `public`:

1. **`profiles`**: Quản lý thông tin tài khoản, cấp độ, tài nguyên (XP, xu vàng, thể lực 20/20), chuỗi streak, trạng thái khóa tài khoản (`is_locked`, `lock_reason`, `locked_at`) và cờ tài khoản kiểm thử (`is_test_account`).
2. **`lesson_questions`**: Nội dung bài học, lý thuyết, đề thi trắc nghiệm và cấu hình mini-game tích hợp theo khối lớp (6–12), chương, bài học và cấp độ.
3. **`questions`**: Ngân hàng câu hỏi trắc nghiệm dùng chung cho Đấu trường PvP và Đấu Hạng.
4. **`quiz_rooms`**: Quản lý thông tin, mã PIN 6 số và vòng đời trạng thái Phòng thi trực tuyến hoặc Theo lịch của Giáo viên (`closed_at`, `presence_lock`, `reopen_shuffle`).
5. **`quiz_attempts`**: Ghi nhận chi tiết từng lượt tham gia dự thi của học sinh trong Phòng thi Giáo viên.
6. **`quiz_answers`**: Lưu chi tiết câu trả lời từng câu hỏi (phương án chọn, đúng/sai, thời gian phản hồi ms).
7. **`pvp_queues`**: Hàng chờ ghép trận đấu Đấu trường PvP 1v1 Realtime giữa các học sinh.
8. **`pvp_matches`**: Lưu trữ nhật ký và kết quả lịch sử các trận đấu PvP 1v1 đã hoàn tất.
9. **`pvp_live_matches`**: Lưu trữ trạng thái trận đấu PvP trực tiếp phục vụ cơ chế kết nối lại phòng đấu khi học sinh gặp sự cố mạng gián đoạn.
10. **`pvp_class_scores`**: Quản lý điểm số xếp hạng phân loại riêng theo từng khối lớp cho Đấu trường PvP.
11. **`teacher_requests`**: Quản lý đơn yêu cầu nâng cấp quyền tài khoản Giáo viên gửi tới Quản trị viên duyệt kèm mã xác thực 60 phút.
12. **`system_logs`**: Nhật ký giám sát vận hành hệ thống (Observability Telemetry Logs) và ghi vết lỗi runtime phía client.
13. **`station_questions`**: Nội dung câu hỏi, dạng mini-game, đáp án, gợi ý (hint) và giải thích chi tiết (explanation) cho Trạm thám hiểm.
14. **`station_progress`**: Lưu trữ tiến độ hoàn thành vượt Ải Ngày và mở khóa các Trạm thám hiểm của học sinh (đánh giá sao 1–3 sao).
15. **`study_videos`**: Quản lý danh mục các video bài giảng Sinh học bổ trợ theo từng khối lớp.
16. **`user_mails`**: Hòm thư cá nhân nhận quà tặng (xu vàng, thông báo hệ thống) với cơ chế tự hủy sau 7 ngày.
17. **`daily_active_users`**: Thống kê số lượng người dùng hoạt động theo từng ngày (DAU Metric).
18. **`feature_daily_users`**: Thống kê số lượng người dùng duy nhất trải nghiệm từng tính năng theo ngày.
19. **`feature_metrics_daily`**: Thống kê tổng số lượt tương tác/sử dụng của từng tính năng theo ngày.
20. **`system_log_ingest_limits`**: Cấu hình giới hạn tốc độ nạp log hệ thống để bảo vệ cơ sở dữ liệu.
21. **`content_controls`**: Quản lý trạng thái khóa bảo trì hoặc mở hoạt động cho Game mô phỏng 3D, Mô hình 3D và các màn chơi bản đồ.
22. **`achievement_catalog`**: Danh mục toàn bộ danh hiệu, huy hiệu và thành tựu học tập toàn hệ thống.
23. **`user_achievements`**: Ghi nhận các thành tựu mà từng học sinh đã mở khóa thành công kèm mốc thời gian.
24. **`user_achievement_preferences`**: Quản lý danh hiệu/huy hiệu mà học sinh đang chọn trang bị (`equipped_achievement_id`) hiển thị trên Header và Bảng xếp hạng.
25. **`weekly_scores`**: Lưu trữ điểm số tích lũy theo chu kỳ tuần (`week_key`, `year`, `week_number`) phục vụ Bảng xếp hạng Tuần.
26. **`reward_ledger`**: Sổ cái kiểm toán phần thưởng (Reward Integrity), ghi nhận lịch sử cộng thưởng (XP, Xu, Cấp độ) chống gian lận và chống nhận thưởng lặp lại.

---

## 📂 9. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```text
NextGen/
├── .env                                    # Biến môi trường local (Supabase URL, Anon Key, Google GenAI Key)
├── eslint.config.js                        # Cấu hình ESLint 9 cho JavaScript/React
├── index.html                              # File HTML entry point dự án
├── package.json                            # Khai báo Dependencies & NPM Scripts
├── postcss.config.mjs                      # Cấu hình PostCSS / Tailwind CSS
├── vite.config.js                          # Cấu hình Vite bundler & Alias
├── README.md                               # Tài liệu mô tả toàn diện hệ sinh thái NextGen BioLearn
├── DATABASE.md                             # Tài liệu kỹ thuật chi tiết 26 Bảng Cơ sở dữ liệu Supabase
├── database.sql                            # SQL khởi tạo cơ bản ban đầu
├── supabase_unified_migration.sql          # SQL tổng hợp schema chính thức
├── supabase_admin_content_controls_upgrade.sql # SQL nâng cấp bảng content_controls
├── supabase_admin_map_management_upgrade.sql   # SQL nâng cấp quản lý bản đồ học tập
├── supabase_achievements_upgrade.sql       # SQL nâng cấp hệ thống danh hiệu/thành tựu
├── supabase_achievements_expansion.sql     # SQL mở rộng danh mục thành tựu
├── supabase_reward_integrity_upgrade.sql   # SQL sổ cái kiểm toán phần thưởng reward_ledger
├── supabase_pvp_reconnect_upgrade.sql      # SQL cơ chế kết nối lại pvp_live_matches
├── supabase_weekly_leaderboard_upgrade.sql # SQL hệ thống bảng xếp hạng tuần weekly_scores
├── supabase_teacher_quiz_upgrade.sql       # SQL nâng cấp cổng phòng thi giáo viên
├── supabase_test_accounts_upgrade.sql      # SQL quản lý tài khoản kiểm thử is_test_account
├── supabase_observability_upgrade.sql      # SQL nâng cấp telemetry & nhật ký vận hành
│
├── src/                                    # Mã nguồn ứng dụng Frontend
│   ├── App.jsx                             # Root Component (Quản lý Auth State, Routing, Theme, Music, Lock Screen)
│   ├── App.css                             # Style CSS bổ trợ cho App
│   ├── index.css                           # Style CSS toàn cục & Tailwind v4 Directive
│   ├── main.jsx                            # Entry point khởi tạo React DOM
│   │
│   ├── components/                         # Các UI Component dùng chung
│   │   ├── BurningFlame.jsx                # Component ngọn lửa 3D hiệu ứng Boss/Streak
│   │   ├── ChatboxAI.jsx                   # Trợ lý AI Học tập Sinh học Google GenAI
│   │   ├── GalaxyBackground.jsx            # Hiệu ứng nền vũ trụ dải ngân hà Canvas
│   │   ├── SystemErrorBoundary.jsx         # React Error Boundary bắt lỗi crash giao diện
│   │   ├── Toast.jsx                       # Provider hiển thị thông báo Toast
│   │   │
│   │   ├── biology3d/                      # 9 Component Xem Mô hình 3D & Đại phân tử
│   │   │   ├── AnimalCell.jsx              # Mô hình Tế bào Động vật 3D
│   │   │   ├── PlantCell.jsx               # Mô hình Tế bào Thực vật 3D
│   │   │   ├── DNAHelix.jsx                # Mô hình Chuỗi xoắn đôi DNA 3D
│   │   │   ├── HumanBody.jsx               # Mô hình Giải phẫu Cơ thể người 3D
│   │   │   ├── MicroscopeView.jsx          # Kính hiển vi Ảo 3D
│   │   │   ├── MolstarViewer.jsx           # Trình xem cấu trúc phân tử PDB Molstar
│   │   │   ├── Photosynthesis.jsx          # Mô hình Quang hợp 3D
│   │   │   ├── ProteinViewer.jsx           # Mô hình Cấu trúc Protein 3D
│   │   │   ├── VirusViewer.jsx             # Mô hình Cấu trúc Virus 3D
│   │   │   └── index.js                    # Export index module biology3d
│   │   │
│   │   └── games/                          # 17 Component Mini-Game Sinh học 3D Tương tác
│   │       ├── CellAssemblyGame3D.jsx      # Game 3D Lắp ghép Tế bào (Lớp 6)
│   │       ├── DNABuilderGame3D.jsx        # Game 3D Xây dựng ADN (Lớp 9)
│   │       ├── DigestiveGame3D.jsx         # Game 3D Hệ Tiêu hóa (Lớp 8)
│   │       ├── EcosystemGame3D.jsx         # Game 3D Hệ Sinh thái (Lớp 6)
│   │       ├── EnzymeGame3D.jsx            # Game 3D Cơ chế Enzyme (Lớp 10)
│   │       ├── EvolutionGame3D.jsx         # Game 3D Tiến hóa & CLTN (Lớp 12)
│   │       ├── HomeostasisGame3D.jsx       # Game 3D Cân bằng Nội môi (Lớp 11)
│   │       ├── InvertebrateGame3D.jsx      # Game 3D Phân loại Động vật (Lớp 7)
│   │       ├── MendelGame3D.jsx            # Game 3D Di truyền Mendel (Lớp 9)
│   │       ├── MicroorganismGame3D.jsx     # Game 3D Vi sinh vật (Lớp 6)
│   │       ├── MitosisGame3D.jsx           # Game 3D Nguyên phân (Lớp 10)
│   │       ├── MutationGame3D.jsx          # Game 3D Đột biến Gen & NST (Lớp 12)
│   │       ├── NervousSystemGame3D.jsx     # Game 3D Hệ Thần kinh (Lớp 8)
│   │       ├── OxygenJourneyGame3D.jsx     # Game 3D Hành trình Oxy (Lớp 8)
│   │       ├── PhotosynthesisGame3D.jsx    # Game 3D Quang hợp (Lớp 10)
│   │       ├── PlantStructureGame3D.jsx    # Game 3D Cấu tạo Thực vật (Lớp 7)
│   │       └── PlantTransportGame3D.jsx    # Game 3D Vận chuyển Thực vật (Lớp 11)
│   │
│   ├── hooks/                              # Custom React Hooks
│   │   ├── useAuth.js                      # Context Hook quản lý Auth User & Stats
│   │   ├── useContentControls.js           # Hook kiểm tra trạng thái khóa/mở bảo trì nội dung
│   │   └── useCountdown.js                 # Hook đếm ngược thời gian phòng thi
│   │
│   ├── lib/                                # Các dịch vụ thư viện tích hợp ngoài
│   │   ├── email.js                        # Tích hợp dịch vụ gửi email EmailJS
│   │   ├── observability.js                # Thu thập nhật ký Telemetry hệ thống
│   │   └── supabase.js                     # Khởi tạo Supabase Client
│   │
│   ├── pages/                              # Toàn bộ 28 Trang giao diện của ứng dụng
│   │   ├── AdminContentPage.jsx            # Trang CMS Quản trị Nội dung 3D (Bảo trì/Mở)
│   │   ├── AdminLogsPage.jsx               # Trang Xem Nhật ký Giám sát Admin
│   │   ├── AdminMapPage.jsx                # Trang CMS Quản trị Bản đồ học tập
│   │   ├── AdminPage.jsx                   # Trang Dashboard Admin Tổng quan & Duyệt mã
│   │   ├── AdminReportsPage.jsx            # Trang Biểu đồ Báo cáo Admin (DAU & Metrics)
│   │   ├── AdminStationPage.jsx            # Trang CMS Quản lý Trạm thám hiểm
│   │   ├── AdminUsersPage.jsx              # Trang Quản lý Người dùng & Khóa tài khoản
│   │   ├── BattlePage.jsx                  # Trang Sảnh chờ Đấu trường PvP 1v1
│   │   ├── BattlePvPPage.jsx               # Trang Trận đấu PvP Realtime 1v1
│   │   ├── Biology3DPage.jsx               # Trang Trung tâm Mô hình 3D Visualizer
│   │   ├── BossBattlePage.jsx              # Trang Trận chiến Trùm cuối chương
│   │   ├── ClassSelectPage.jsx             # Trang Chọn Khối lớp (Lớp 6 - 12)
│   │   ├── GamePlayPage.jsx                # Trang Màn chơi Bài học & Thi trắc nghiệm
│   │   ├── HomePage.jsx                    # Trang Chủ Học sinh
│   │   ├── LandingPage.jsx                 # Trang Giới thiệu Landing Page
│   │   ├── LandingResourcePage.jsx         # Trang Tài nguyên Hướng dẫn, FAQ & Bảo mật
│   │   ├── LeaderboardPage.jsx             # Trang Bảng xếp hạng Toàn cầu & PvP
│   │   ├── LoginPage.jsx                   # Trang Đăng nhập
│   │   ├── MapPage.jsx                     # Trang Bản đồ Đường dẫn Học tập
│   │   ├── MiniGamePage.jsx                # Trang Mini-game lật thẻ hồi Thể lực
│   │   ├── MissionPage.jsx                 # Trang Nhiệm vụ Hàng ngày & Hàng tuần
│   │   ├── MorePage.jsx                    # Trang CMS Quản trị Nội dung Bài học
│   │   ├── ProfilePage.jsx                 # Trang Hồ sơ cá nhân & Đổi Avatar
│   │   ├── RegisterPage.jsx                # Trang Đăng ký Tài khoản
│   │   ├── SimulationsPage.jsx             # Trang Danh mục 17 Mini-Game 3D
│   │   ├── StationExpeditionPage.jsx       # Trang Thám hiểm Học theo Trạm
│   │   ├── StudentQuizRoomPage.jsx         # Trang Phòng thi Giáo viên dành cho Học sinh
│   │   └── TeacherPage.jsx                 # Trang Cổng thông tin Giáo viên
│   │
│   └── utils/                              # Các hàm tiện ích bổ trợ
│       ├── avatar.js                       # Hàm xử lý đường dẫn ảnh đại diện
│       ├── cloudinary.js                   # Xử lý tối ưu hóa video nền banner Cloudinary
│       ├── mapStages.js                    # Hằng số loại màn chơi & validate câu hỏi bản đồ
│       └── progression.js                  # Thuật toán tính cấp độ từ điểm XP
│
├── public/                                 # Tài nguyên tĩnh công cộng
│   ├── images/                             # Ảnh đại diện, logo, biểu trưng
│   ├── models/                             # Tệp mô hình 3D binary dạng `.glb`
│   ├── music/                              # Nhạc nền (`Microscopic Voyage.mp3`, `All.mp3`) & SFX
│   └── study/                              # Slide và tài liệu học tập
│
└── scratch/                                # Tập lệnh hỗ trợ dữ liệu & SQL Patches
```

---

## ⚡ 10. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH LOCAL (DEVELOPMENT GUIDE)

### Bước 1: Clone dự án và cài đặt dependencies
```bash
git clone <repository_url>
cd NextGen
npm install
```

### Bước 2: Cấu hình Biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc của dự án với các thông số sau:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_API_KEY=your-google-gemini-api-key
```

### Bước 3: Chạy Development Server
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

### Bước 4: Kiểm tra và Build Production
- Kiểm tra lỗi cú pháp và Linting:
  ```bash
  npm run lint
  ```
- Build bản phát hành Production:
  ```bash
  npm run build
  ```
- Chạy thử bản Build Production (Preview):
  ```bash
  npm run preview
  ```

---

## 📝 11. TÌNH TRẠNG VẬN HÀNH & KIỂM THỬ GẦN NHẤT
- **Trạng thái Build Production (`npm run build`)**: Pass thành công 100%, không phát sinh lỗi biên dịch.
- **Hệ thống Database**: Toàn bộ 26 Bảng dữ liệu đã được di trú và bảo vệ chặt chẽ bởi Row Level Security (RLS) trên Supabase Cloud.
- **Tính toàn vẹn phần thưởng**: Vận hành sổ cái `reward_ledger` chống hành vi gian lận và cộng thưởng lặp.
- **Trải nghiệm Đồ họa 3D & Realtime**: Kiểm thử hoạt động mượt mà trên các trình duyệt hiện đại (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
