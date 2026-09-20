# Tiến độ khắc phục — 20/09/2026

## Trạng thái

Đã thực hiện đợt sửa mã nguồn đầu tiên và kiểm chứng cục bộ. Chưa hoàn thành toàn bộ kế hoạch. Người dùng xác nhận localhost và production dùng chung Supabase project. Chưa có phiên đăng nhập Dashboard để đọc schema/policy/function/cron thực tế. Không chạy migration, DELETE, sửa trạng thái log, thao tác phần thưởng hoặc kiểm thử ghi dữ liệu trên database đó. Chưa deploy production.

## Bảo toàn hiện trạng

- Sao chép toàn bộ `src`, `api`, package/lockfile, cấu hình Vite/ESLint vào `audit/baseline-2026-09-20/` trước khi sửa.
- Lưu git status và SHA256 của các tệp nguồn. Không sao chép hoặc xuất nội dung `.env`/secret.
- Giữ các thay đổi có sẵn của người dùng. Các file SQL hiện có không bị chỉnh sửa.
- ESLint bỏ qua thư mục `audit` vì chứa bản sao baseline và sản phẩm build, tránh lint lặp chính bản sao nguồn cũ.

## Đã thay đổi

1. **Admin Presence:** một chủ sở hữu trong App qua `useOnlinePresence`; Admin đọc snapshot trong AuthContext. Callback được đăng ký trước subscribe. Chờ cleanup hoàn thành trước khi dùng lại topic; callback cũ không cập nhật state. Tách trạng thái mất kết nối khỏi số 0. Payload đếm online chỉ chứa ID, không broadcast tên/email.
2. **PvP:** thêm scope quản lý kênh theo từng lần vào phòng, serialize việc dùng lại topic, chặn callback/timer đã hủy, dọn bằng removeChannel. Capture scope trước await ở nạp/gửi/phục hồi câu hỏi. Gửi broadcast thất bại trả trạng thái và có log/cảnh báo; không để rejection thoát ra global. Đây là sửa vòng đời phía client, chưa xác minh giao dịch phần thưởng/reconnect hai người trên DB thật.
3. **Battle/Boss:** khai báo đúng `updateStats` và `userStats` từ AuthContext. Battle kiểm tra error khi đọc/lưu profile, tránh lấy dữ liệu rỗng làm cơ sở cập nhật khi truy vấn lỗi. Chưa thay đổi thuật toán cộng thưởng, RPC hoặc quyền update profile; tính nguyên tử/idempotency cần kiểm tra database.
4. **Quiz giáo viên:** dọn đúng kênh phòng đã đóng, không dùng timer đọc ref sau khi ref bị đặt null hoặc đổi sang phòng khác.
5. **3D:** nguyên phân gọi useMemo trước return có điều kiện. Hiệu ứng truyền năng lượng ở hệ sinh thái dùng một mesh di chuyển, không truy cập material trên object3D; chỉnh trục mũi tên theo vector start/end.
6. **Gửi log:** queue có giới hạn, ưu tiên severity cao trong hàng đợi, gộp lỗi đang gửi, chỉ bắt đầu cooldown dài sau khi server chấp nhận. Giữ giới hạn gửi, có thống kê accepted/failed/suppressed trong bộ nhớ. Ràng buộc job với tài khoản gửi để không gán log đang chờ cho tài khoản mới. Không bổ sung lưu trữ bí mật hay raw error vào localStorage.
7. **ErrorBoundary:** thông báo đúng việc đã/chưa xác nhận lưu được log, không luôn khẳng định đã ghi nhận.
8. **AdminLogs:** không gọi prune khi mở trang; hủy/bỏ qua truy vấn cũ, phân trang ổn định thêm khóa ID, không bỏ lọc severity khi schema thiếu cột. Action là ô nhập chính xác nên không bị giới hạn trong các action của trang hiện tại. Có mở rộng stack/details. Chỉ hiển thị badge đã sửa nếu resolved_at tồn tại và không cũ hơn lần phát sinh cuối; không tự xác nhận bất kỳ bản ghi nào.
9. **AdminStats:** kiểm tra lỗi query và hiển thị lỗi tải thống kê, thay vì biến lỗi truy vấn thành số 0 hợp lệ.

## Kiểm chứng

- `node --test tests/*.test.mjs`: **9/9 ca đạt**. Bao gồm cleanup bất đồng bộ, StrictMode, đổi tài khoản, callback cũ, reconnect, timer sau khi rời phòng, gửi broadcast thất bại, lỗi đồng thời, ưu tiên báo cáo, cooldown sau thất bại/thành công, rate limit.
- Kiểm thử UI bằng fixture `tests/ui/`, dùng chính AdminPage/AdminLogsPage/useOnlinePresence và React.StrictMode. Supabase được alias sang bộ giả lập không có network/persistence. Đã mở trực tiếp Admin, sang Logs, mở details, quay lại Admin, đổi tài khoản giả lập và refresh. Hiển thị bình thường, không có lỗi console trong các thao tác này.
- Fixture cố ý ném lỗi nếu có RPC prune khi xem log; không thấy lời gọi đó trong kiểm thử.
- ESLint `src api`: **186 errors, 23 warnings**, giảm từ 191/23. Năm chẩn đoán đã loại bỏ: bốn no-undef tại Battle/Boss, một vi phạm thứ tự Hook. Các chẩn đoán còn lại không được coi là đã sửa.
- Các module mới và trang AdminLogs qua kiểm tra ESLint riêng. Build production cục bộ thành công; còn cảnh báo chunk lớn vốn có. Kết quả build không thay thế kiểm thử database và hai client PvP.

Chạy lại kiểm thử giao diện: `node node_modules/vite/bin/vite.js --config tests/ui/vite.config.mjs`, rồi mở `http://127.0.0.1:5186/admin`. Đây là dữ liệu giả lập, không phải tài khoản admin thật.

## Chưa thực hiện / điều kiện tiếp tục

1. Đăng nhập Supabase Dashboard và mở đúng project BioLearn. Script `audit/database-preflight-readonly.sql` dùng transaction read-only, đọc schema/policy/grant/trigger/function/index và thống kê log, không chạy dọn dữ liệu. Cần xem trực tiếp cấu trúc và xác minh backup trước migration.
2. Chưa tạo/áp dụng đầy đủ hồ sơ issue và audit event, RPC chuyển trạng thái có bằng chứng/version/concurrency control, backfill và bộ lọc trạng thái. Badge đọc resolved_at hiện có không thay thế quy trình này. Chưa có lỗi nào được tự gắn “Đã chỉnh sửa” trong DB.
3. Chưa thiết lập cron/retention mới. Bỏ prune ở UI local không vô hiệu hóa job hoặc frontend production cũ nếu đang tồn tại. Cần kiểm tra nguồn gọi prune thực tế.
4. Chưa kiểm thử đầu cuối PvP/Quiz/Boss/Battle với tài khoản test trên môi trường dữ liệu tách biệt; chưa kết luận phần thưởng/tiến độ/quyền truy cập đã an toàn đầy đủ.
5. Các lỗi avatar/Cloudinary, lỗi Router/Toast/Drei lịch sử, kiểm toán RLS profile/API chat và phần dư ESLint còn theo báo cáo gốc. Chưa tự coi hết lỗi do không xuất hiện log mới.

Không chạy lại `supabase_observability_upgrade.sql` cũ để triển khai trạng thái vì cuối file có DELETE theo tuổi log. Bước tiếp theo là đối chiếu database, sau đó viết migration bổ sung và kiểm thử trên môi trường tách biệt.
