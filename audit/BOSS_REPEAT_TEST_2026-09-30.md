# Tài khoản thử — boss sau mỗi ải lớp 6

Chạy `generated/boss-releases/repeat-test-grade6.sql` sau các migration Boss V2 hiện có. Không cần chạy lại SQL nhập câu hỏi, pilot bài 1 hoặc guard thưởng cũ.

SQL thêm cờ `test_repeat_enabled`, cập nhật ba hàm Boss và bật chế độ thử ở 10 bài có đủ 15 câu/bài. Chỉ áp dụng khi đồng thời tài khoản `is_test_account=true` và bài `test_only=true`, `test_repeat_enabled=true`. Học viên thường không vào được pilot. Bài live vẫn giữ xác suất 35%, một phần thưởng và đóng sau ải cuối, kể cả tài khoản có cờ thử.

Tài khoản thử có thể chọn mọi ải thường trong 10 bài lớp 6 trên map. Các ải bị quản trị tắt vẫn không mở. Kết thúc ải sẽ có lời mời boss, kể cả chơi lại, bài đã hoàn thành, boss đã thắng/thua/hết hạn. Nếu còn lời mời hoặc trận đang diễn ra, giữ trận hiện tại và hạn ban đầu; không tạo trùng. Gửi lại cùng vé kết thúc vẫn trả cùng kết quả.

Chế độ boss thử không cấp XP/vàng thật, không xóa lịch sử trận hoặc thay tiến độ ải thường. Luật thưởng ải thường hiện có vẫn hoạt động riêng như trước.

Kiểm tra sau SQL:

```sql
select chapter_id,lesson_id,enabled,test_only,test_repeat_enabled,
       security_ready,encounter_chance,battle_seconds
from public.boss_lessons where class_id=6 order by chapter_id,lesson_id;
```

Kỳ vọng 10 dòng: enabled=true, test_only=true, test_repeat_enabled=true, security_ready=false, encounter_chance=0.35, battle_seconds=480. Riêng tài khoản thử được nhánh xử lý đảm bảo xuất hiện 100%, không đổi xác suất của cấu hình live.

Để dừng chế độ lặp: `update public.boss_lessons set test_repeat_enabled=false where class_id=6;`.

Build Vercel Preview mặc định bật frontend Boss nếu không đặt cờ rõ ràng. Production mặc định tắt; giá trị `VITE_BOSS_V2_ENABLED=false` luôn được tôn trọng. Phân biệt môi trường dựa vào [biến hệ thống VERCEL_ENV của Vercel](https://vercel.com/docs/environment-variables/system-environment-variables). Database vẫn quyết định ai được vào.

Bản cập nhật dành cho kiểm thử trước phát hành chính thức. Điều kiện bảo vệ XP/vàng và xác nhận kết thúc ải trong báo cáo phát hành vẫn chưa hoàn tất; không tự đổi test_only hoặc security_ready để mở học viên thường.
