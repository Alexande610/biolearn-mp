# Báo cáo hoàn tất đợt khắc phục Admin và vòng đời log

Ngày chốt: 21/09/2026.

## Kết quả chính

- Đã loại bỏ nguyên nhân làm trang Admin sập khi mount: toàn ứng dụng chỉ còn một chủ sở hữu kênh Presence `system-online-users`; Admin chỉ đọc snapshot từ context.
- Đã sửa vòng đời kênh PvP, timer/callback cũ, lỗi gửi qua channel đã bị cleanup; sửa các lỗi Battle/Boss/Teacher, thứ tự Hook trong Mitosis và hiệu ứng `dashOffset` trong Ecosystem.
- Đã chuẩn hóa avatar ID/URL và fallback. ID lịch sử không tồn tại `adventurer-1766999604259` được đưa về avatar mặc định; fallback không lặp vô hạn.
- Đã thay cơ chế gửi log bằng queue giới hạn, không bỏ mất lỗi khác chỉ vì một request đang gửi; cooldown chỉ bắt đầu sau khi server chấp nhận. ErrorBoundary không còn khẳng định đã lưu khi RPC thực tế thất bại.
- Đã bỏ việc prune log khi admin chỉ mở trang. Trang log có truy vấn ổn định, chi tiết đầy đủ hơn, và workflow trạng thái issue.
- Đã thêm hồ sơ `system_issues`, lịch sử bất biến `system_issue_events`, RPC chuyển trạng thái có kiểm tra admin/revision/bằng chứng/phiên bản và cơ chế nhận biết tái phát.

## Database đã áp dụng và xác minh

Project Supabase được cấu hình cho localhost và bản đang phục vụ người dùng là cùng project `tsmxzqfdumxeoppspdxa`, vì vậy migration được thực hiện theo hướng cộng thêm và có backup trước.

- Backup nằm trong schema khóa quyền `biolearn_migration_backup`: 17 dòng log, định nghĩa 2 function cũ và policy cũ.
- Sau migration: 17 log, tổng 26 occurrence, 14 issue, 0 log thiếu `issue_id`, 1 admin trong allowlist, 3 trigger và 3 function vòng đời tồn tại.
- Không tự đánh dấu log lịch sử là đã sửa. `system_issue_events` hiện bằng 0 vì chưa có bản frontend phát hành kèm version/evidence để xác nhận đóng issue.
- Retention đang bật: thường 30 ngày; `critical/security` 120 ngày. Job `biolearn-system-log-retention` chạy `17 3 * * *` (03:17 UTC, 10:17 giờ Việt Nam), lệnh `select public.prune_system_observability();`.
- Trước và sau khi bật job đều có 0 log đủ hạn. Sau cấu hình vẫn còn đủ 17 log và 17 dòng backup; không có dữ liệu bị xóa trong đợt này.
- Khi log thô hết hạn, issue và lịch sử xác minh vẫn còn. Lỗi chưa sửa tiếp tục có trạng thái mở; lỗi mới trên issue đã đóng sẽ chuyển thành tái phát.

Các script tương ứng: `supabase_log_lifecycle_upgrade.sql` và `supabase_log_retention_schedule.sql`.

## Đối chiếu CSV

CSV có 17 dòng, 26 occurrence và 13 thông báo khác nhau. Migration tạo 14 issue do khóa nhận diện lịch sử còn xét fingerprint/môi trường.

| Nhóm | Trạng thái mã | Căn cứ |
|---|---|---|
| Presence sau subscribe | Đã sửa cục bộ | Chỉ còn service Presence trong App, Admin không tạo/remove cùng channel |
| `null.send` PvP | Đã sửa cục bộ | Scope channel hủy callback/timer cũ và kiểm tra send sau await |
| `undefined.dashOffset` | Đã sửa cục bộ | Không còn đọc material từ `object3D` không có material |
| Avatar ID và URL localhost | Đã sửa cục bộ | Chuẩn hóa ID/URL, fallback ảnh mặc định, có test chống vòng lặp |
| `ONLINE_WINDOW_MINUTES` | Đường lỗi cũ không còn | Không còn identifier này trong `src` |
| `useAuth is not defined` | Đường thiếu import hiện đã có | App hiện import/use hook đúng; cần bản phát hành để xác nhận issue |
| `useNavigate` ngoài Router | Component cũ trong stack không còn | Cây hiện tại build được và fixture chạy dưới Router; chưa tự đóng log lịch sử |
| `null.style` trong Drei | Không tái hiện trong fixture hiện tại | Component cũ trong stack không còn; giữ issue mở cho đến kiểm thử bản phát hành |
| `null.useState` tại ToastProvider | Không tái hiện trong fixture hiện tại | React/ReactDOM đồng nhất, fixture StrictMode chạy được; giữ issue mở |
| Ảnh huy hiệu Cloudinary | URL hiện trả HTTP 200 `image/png` | Sự cố cũ có thể do mạng/cache; chưa có bằng chứng là lỗi logic hiện tại |

“Đã sửa cục bộ” không đồng nghĩa đã sửa trên bản đang phục vụ người dùng. Trạng thái **Đã chỉnh sửa** chỉ được đặt sau khi frontend mới được deploy, tái hiện/kiểm thử đạt, rồi nhập version và bằng chứng qua RPC/UI.

## Kiểm thử cuối

- `node --test tests/*.test.mjs`: 15/15 đạt. Bao phủ Presence/StrictMode/reconnect, PvP cleanup, queue log, avatar fallback, migration chạy lặp, quyền role, resolve có evidence/revision, tái phát và retention 30/120.
- ESLint riêng cho toàn bộ module mới/sửa trọng tâm, fixture, `api` và `vite.config.js`: đạt.
- Build Vite production: đạt, 3903 module. Còn cảnh báo một số chunk trên 500 kB; đây là vấn đề hiệu năng tải, không làm build hỏng.
- ESLint toàn repository còn 179 error và 23 warning trong 37 file nguồn cũ. Con số này là chẩn đoán tĩnh, không phải 179 sự cố runtime; không được che giấu hoặc sửa hàng loạt ngoài phạm vi vì rủi ro regression.
- `npm audit --omit=dev`: 13 package production bị cảnh báo (1 low, 3 moderate, 8 high, 1 critical). Direct dependencies đáng chú ý là `axios@1.15.0` và `react-router-dom@7.14.1`; phần còn lại đi qua Google GenAI, Supabase/Firebase. Chưa chạy `npm audit fix` vì cập nhật hàng loạt dependency trong đợt sửa sự cố có thể gây thay đổi runtime; cần một đợt nâng cấp và regression test riêng.

## Vì sao Source Control tăng từ khoảng 82–83 lên hơn 700

Badge Source Control của VS Code đếm file thay đổi/chưa theo dõi, không phải commit. Số tăng mạnh do sản phẩm kiểm tra nằm dưới `audit/`:

- `audit/build`: 284 file.
- `audit/build-after-fixes`: 284 file.
- `audit/baseline-2026-09-20`: 89 file.
- Cộng với khoảng 80–100 thay đổi vốn đã có trong workspace, tổng hiển thị xấp xỉ ảnh hơn 700.

Hai thư mục build sao chép nguyên asset từ `public/`, nên xuất hiện `.glb`, `.mp3`, ảnh và JavaScript bundle. Chúng không phải model/nhạc mới được thêm vào tính năng; chúng là bản sao đầu ra của Vite. Chúng không được import vào source và không ảnh hưởng runtime nếu không commit/deploy, nhưng gây tốn dung lượng, làm diff nhiễu và có nguy cơ bị commit nhầm.

Đã xóa an toàn các thư mục/file sinh tạm nói trên và `audit/db-tools`. PGlite được chuyển thành devDependency chuẩn nên `node_modules` vẫn bị Git ignore. Sau dọn dẹp:

- `git status --porcelain --untracked-files=all`: 106 file (36 modified, 70 untracked), đã tính cả chính báo cáo hoàn tất này.
- Số file `.glb`, `.mp3`, `.wav`, `.ogg` đang chờ trong Git: 0.
- Còn 6 file `.mjs`, đều là mã kiểm thử/cấu hình hợp lệ: 5 test Node và `tests/ui/vite.config.mjs`.

`.mjs` là JavaScript ES Module chạy bởi Node/Vite, không phải file nhị phân và không tự chạy trong production. Các test `.mjs` chỉ chạy khi gọi `node --test`; cấu hình UI chỉ chạy khi chủ động mở fixture. Chúng không làm tăng bundle production.

## Phạm vi còn lại trước khi coi là phát hành hoàn chỉnh

- Frontend mới chưa được deploy trong đợt này; database đã tương thích ngược nên frontend cũ vẫn chạy nhưng chưa có giao diện trạng thái issue mới.
- Chưa đóng 14 issue lịch sử vì chưa có deployment version và bằng chứng kiểm thử trên bản phát hành. Đây là hành vi chủ đích của workflow mới.
- Cần đợt riêng để giảm 179/23 chẩn đoán ESLint, nâng các dependency bị audit cảnh báo, và đo/giảm chunk lớn. Không nên gộp ba việc này với bản vá Admin nếu chưa có regression test rộng.
