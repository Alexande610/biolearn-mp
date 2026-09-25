# Hồ sơ mẫu cho video khóa luận

Bộ dữ liệu này được thiết kế cho **các trang production hiện có**, không có chế độ demo. 109 hồ sơ mẫu gồm 102 học viên (15 mỗi khối 6–9; 14 mỗi khối 10–12) và 7 giáo viên. Mỗi khối có ít nhất 12 học viên có điểm PvP trong tuần hiện tại.

Hồ sơ mẫu ở `presentation_people` **không phải** tài khoản Auth. Họ không thể đăng nhập, ghép trận, nhận thưởng, nhận thư hoặc thay đổi tiến độ của người dùng thật. Các bảng xếp hạng và báo cáo admin ghép dữ liệu mẫu ở lớp hiển thị. Giao diện không gắn nhãn trên từng hàng; video hoặc phần thuyết minh phải nêu rõ rằng bảng xếp hạng và báo cáo có dữ liệu minh họa.

## Thứ tự áp dụng

1. Kiểm tra đúng project Supabase production bằng `preflight.sql` (chỉ đọc). Lưu lại `real_profile_count`.
2. Đưa mã giao diện mới lên production. Mã sẽ bỏ qua bảng mẫu nếu bảng chưa tồn tại.
3. Chạy `supabase_presentation_people.sql` trong Supabase SQL Editor để tạo hai bảng chỉ đọc với ứng dụng.
4. Chạy `seed.sql` trong cùng project. Đây là thao tác upsert chỉ với mã lô `thesis-presentation-2026-09`, không sửa `profiles`, `weekly_scores`, `pvp_class_scores`, `auth.users`, phần thưởng hoặc hàng chờ PvP.
5. Chạy `verification.sql`. Kỳ vọng: 109 hồ sơ, 102 học viên, 7 giáo viên, 109 tên riêng, 0 điểm PvP không nhất quán, 0 trùng ID Auth; mỗi lớp có ít nhất 12 người có điểm PvP.
6. Kiểm tra bằng một học viên và một admin: bảng tổng, bảng tuần, PvP lớp 6–12; số học viên/giáo viên, điểm trung bình, số bài hoàn thành, DAU và biểu đồ admin. Xác nhận người thật vẫn hiển thị và không có hồ sơ mẫu trong hàng chờ PvP. Khi quay, công bố dữ liệu minh họa ở đầu video hoặc bằng lời thuyết minh.

Tuần BioLearn đổi vào thứ Hai theo giờ Việt Nam. Trước lần quay sang tuần mới, chạy lại `seed.sql` để chuyển điểm mẫu sang tuần hiện tại, rồi chạy `verification.sql`.

## Gỡ dữ liệu

Chạy `cleanup.sql`. Lệnh chỉ xóa hàng của đúng mã lô ở `presentation_people`; hàng `presentation_activity` liên quan tự xóa theo khóa ngoại. Không xóa bảng để giữ nguyên ứng dụng và tránh ảnh hưởng dữ liệu thật. Xác nhận `remaining = 0`; sau đó bảng xếp hạng và báo cáo chỉ còn dữ liệu thật.
