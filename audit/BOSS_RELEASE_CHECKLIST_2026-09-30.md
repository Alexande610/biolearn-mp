# Boss V2 — sửa thao tác nhảy và chuẩn bị phát hành

Đích phát hành do người dùng xác nhận: https://biolearn-mp.vercel.app/ (Vercel project `alexande610s-projects/biolearn-mp`). Chưa có deployment mới trong đợt này; chưa mở Boss cho học viên thường.

## Sửa thao tác nhảy

- Phản hồi hình ảnh tại thời điểm bấm, không đợi RPC hoặc lượt poll 750 ms.
- RPC nhảy dùng đường gửi riêng, không xếp sau poll. Phản hồi cũ không được ghi đè snapshot mới.
- Quỹ đạo nhân vật dùng đồng hồ animation; phản hồi máy chủ muộn không khởi động lại cú nhảy. Nội suy đường chạy giữ thời gian không lùi giữa hai phản hồi.
- Giới hạn bấm nhảy cục bộ 1,35 giây; thời gian trên không 1,15 giây. Luật va chạm, khiên, mất tim và thưởng vẫn do máy chủ quyết định. Mạng chậm vẫn có thể ảnh hưởng thời điểm máy chủ nhận lệnh né; sửa này không đảm bảo loại bỏ mọi ảnh hưởng của độ trễ mạng.
- Bộ xem thử DEV có tham số `latency=900` để thử phản hồi chậm. Đã thử trả lời đúng rồi nhảy, chụp nhân vật đang trên không trước phản hồi nhảy. Đây là giả lập, không phải kiểm chứng độ trễ Supabase thật.

## Thứ tự chuẩn bị phát hành

1. Chạy `audit/boss-release-preflight-readonly.sql` và kiểm tra quyền hồ sơ/hàm/trigger thực tế sau các SQL người dùng đã chạy.
2. Kiểm tra và áp dụng `generated/boss-releases/guard-legacy-boss-rewards.sql` trên môi trường thử trước. SQL giữ nguyên xử lý `normal` và `skip`, chặn mã `boss_*` cũ; hàm gốc đổi sang tên riêng bị thu hồi quyền gọi. Chạy lại được, không mở thưởng thật và không sửa tiến độ.
3. Hoàn tất cơ chế xác nhận kết thúc ải trên máy chủ, bảo vệ cập nhật trực tiếp XP/vàng và kiểm thử tương thích cửa hàng/thư/game khác. Không thu hồi mọi quyền hồ sơ đột ngột vì các luồng đang dùng chúng.
4. Duyệt nội dung từng bài. Tài khoản thử đạt gameplay không tự đánh dấu cả 150 câu là đã duyệt.
5. Tạo bản Preview trên đúng Vercel project, frontend `VITE_BOSS_V2_ENABLED=true`, database vẫn `test_only=true`, `security_ready=false`. Kiểm thử Supabase thực, hai tab, reload, nhảy/mất mạng, thắng/thua và không cộng thưởng thử.
6. Sau khi 1–5 đạt, mới dùng migration mở thật có điều kiện kiểm tra; trả xác suất pilot 100% về 35%, thời gian 480 giây. Không tạo SQL chỉ đổi `security_ready=true` để bỏ qua điều kiện.
7. Promote đúng bản đã kiểm thử lên Production; xác minh commit/deployment ID, luồng ải thường, boss và thưởng một lần. Dừng tính năng bằng `enabled=false` nếu có lỗi, giữ lịch sử và ledger.

## Điều kiện đang thiếu

- Cần kết quả preflight database thực. Quyền truy cập công cụ hiện tại chưa cho phép tự áp dụng SQL vào Supabase.
- Đã nhận kết quả preflight của người dùng: đủ 10×15 câu, chỉ bài 1 enabled ở test_only với xác suất 1; reviewed/security_ready đều false. Quyền authenticated sửa trực tiếp cả xp/coins/level/bosses_defeated/class_progress còn mở; trigger chưa bảo vệ các trường này. RPC claim_map_reward vẫn có boss_1/2/3; hàm private_legacy chưa tồn tại. Những điểm này xác nhận database chưa đủ điều kiện mở thưởng thật.
- Vercel trong phiên trình duyệt hiện chuyển đến trang đăng nhập; cần người dùng đăng nhập để đọc cấu hình dự án và thực hiện deploy.
- Cơ chế thưởng cũ, quyền sửa hồ sơ và callback hoàn thành ải còn phải được xử lý trước bản chính thức. File guard chỉ xử lý đường thưởng Boss cũ, không giải quyết toàn bộ ba vấn đề.

Không xác nhận đã phát hành khi chưa có deployment mới và kiểm chứng Production.

Kiểm tra cuối cho bản sửa nhảy và guard: toàn bộ 80/80 bài kiểm thử đạt, lint các thành phần chỉnh sửa đạt, build production thành công. Guard SQL mới chưa được chạy trên database thật. Ảnh kiểm chứng nhảy với độ trễ mô phỏng 900 ms: `audit/boss-preview/jump-latency-900ms.jpg`.
