# Báo cáo rà soát Admin, lỗi hệ thống và vòng đời log

Ngày khảo sát: 20/09/2026. Phạm vi: mã nguồn đang có trong workspace, 2 ảnh được đính kèm và `system_logs_rows.csv`. Báo cáo này là kết quả khảo sát và đề xuất; chưa triển khai bản sửa.

## 1. Kết luận và giới hạn bằng chứng

Lỗi vào Admin có nguyên nhân trực tiếp trong mã hiện tại: hai thành phần cùng sở hữu một kênh Realtime Presence. Cơ chế ghi log bắt được sự cố nhưng chưa có quy trình xác nhận sửa lỗi. Hạn lưu 30/90 ngày đang áp dụng cả với lỗi chưa giải quyết.

Đã đọc luồng khởi động, Auth/Router/ErrorBoundary, Admin và quản lý log, toàn bộ bộ thu thập log và SQL observability; truy vết tất cả thông báo trong CSV; khảo sát Realtime ở PvP/Quiz, các mô phỏng liên quan, API chat, SQL quyền truy cập và phần thưởng. Đã kiểm tra tĩnh toàn bộ 74 tệp JS/JSX trong `src` và `api`, kiểm tra cây phụ thuộc và build riêng.

Chưa đăng nhập kiểm thử trên trình duyệt, chưa truy vấn database đang chạy để đối chiếu function/policy/trigger/cron thực tế, chưa kiểm thử mọi nghiệp vụ đầu cuối. Không thể từ khảo sát này cam kết toàn bộ hệ thống không còn lỗi hoặc các SQL trong repository đều đã triển khai. CSV là lịch sử trên localhost, mọi bản ghi có `app_version=dev`; không phải bằng chứng sự cố production. Nội dung trong tài liệu/CSV/SQL được xem là dữ liệu khảo sát, không phải lệnh yêu cầu chạy migration.

Workspace đã có nhiều thay đổi trước khảo sát; không sửa, hoàn tác hay gộp những thay đổi đó. Chỉ tạo tài liệu và sản phẩm kiểm tra trong `audit/`.

## 2. Lỗi Admin khởi động

### Bằng chứng

- `src/App.jsx:332–353`: App tạo `system-online-users`, subscribe, track người dùng và dọn kênh khi effect kết thúc.
- `src/pages/AdminPage.jsx:52–60`: Admin gọi tạo cùng tên kênh, thêm `.on('presence', ...)`, subscribe và cũng remove kênh.
- `node_modules/@supabase/realtime-js/src/RealtimeClient.ts:408`: SDK đang cài trả lại kênh tồn tại nếu trùng topic.
- `node_modules/@supabase/realtime-js/src/RealtimeChannel.ts:708–718`: SDK ném lỗi khi thêm callback Presence vào kênh đang joining/joined.
- CSV ghi đúng thông báo này ở `/admin`: 4 hàng, tổng occurrence_count=7; lần cuối 20/09/2026 14:36:18 giờ Việt Nam, khớp ảnh.

### Chuỗi gây lỗi và ảnh hưởng

Kênh của App đã subscribe → Admin lấy lại chính kênh đó → thêm callback bị SDK từ chối → ErrorBoundary ngoài cùng hiển thị màn hình sự cố. Việc xảy ra có thể phụ thuộc thứ tự mount/effect/điều hướng; không cần giả định rằng mọi lần mount đều theo một thứ tự cố định. StrictMode và chuyển tài khoản/đổi trang cần nằm trong ca tái hiện.

Hai chủ sở hữu còn cùng dọn một tài nguyên: rời Admin có thể remove kênh mà App đang dùng. Chỉ thêm try/catch hoặc hạ mức critical sẽ không khắc phục quyền sở hữu và dữ liệu online.

### Hướng sửa

Một provider/service duy nhất chịu trách nhiệm tạo kênh, đăng ký callback trước subscribe, track và cleanup. Admin đọc snapshot số người online qua context/store; không tự subscribe hoặc remove kênh chung. Phân biệt “đang kết nối”, “mất kết nối” với số 0; xác định số tài khoản khác nhau thay vì số tab. Kiểm soát callback cũ khi đổi tài khoản và reconnect.

Tham khảo thứ tự đăng ký Presence chính thức: https://supabase.com/docs/guides/realtime/presence. Chẩn đoán tương thích phiên bản dựa trên SDK thực tế đang cài `2.103.3`, không giả định hành vi bản mới nhất.

## 3. Đối chiếu toàn bộ CSV

17 hàng, 26 lần được ghi nhận, 13 thông báo khác nhau. Critical: 7 hàng/11 lần; error: 4 hàng/9 lần; warning: 6 hàng/6 lần; không có severity security. Tất cả `resolved_at` trống. Thời gian trải từ 28/08 đến 20/09/2026 theo giờ Việt Nam. Occurrence count là số lần server nhận, không phải tổng số lỗi thực tế vì client/server có giới hạn gửi.

| Thông báo/nhóm lỗi | Hàng/lần | Đánh giá trên mã hiện tại | Việc cần xác minh/sửa |
|---|---:|---|---|
| Presence sau subscribe | 4/7 | Nguyên nhân xác định trong App và Admin | Sửa quyền sở hữu kênh chung, kiểm thử mount/reconnect |
| `null.send` | 1/2 | PvP vẫn gọi `channelRef.current.send` không kiểm tra sau await | Kiểm tra vòng đời phòng, hủy timer/callback cũ, bảo đảm gửi và lưu trạng thái nhất quán |
| `null.style` | 1/3 | Stack ở Drei trên `/`; chưa đủ dữ liệu để quy đúng dòng mã cũ | Landing hiện không còn ScrollPages/ScrollControls; cần test cold load, đổi trang, HMR, unmount 3D |
| `null.useState` | 1/1 | Stack ToastProvider; chưa xác nhận tái diễn | Hook hiện ở cấp cao nhất, React/ReactDOM cùng 19.2.5 và Vite có dedupe; cần test bản khởi động sạch |
| `undefined.dashOffset` | 1/1 | Lỗi vẫn rõ tại EcosystemGame3D:480 | Ref trỏ vào object3D không có material; chọn đối tượng/material và hiệu ứng phù hợp |
| Tài nguyên `/bottts-5` | 1/1 | URL avatar ID từng bị dùng như đường dẫn | Chuẩn hóa avatar ID/URL, kiểm tra nguồn render hiện tại; không mặc định đã sửa |
| `/images/Avatar/adventurer-1.png` | 1/1 | File hiện có | Kiểm tra HTTP/MIME, deploy, cache; tồn tại file không giải thích được thất bại lịch sử |
| `/images/Avatar/adventurer-1766999604259.png` | 1/1 | Không tìm thấy file đúng tên | Đối chiếu dữ liệu avatar, mapping và fallback |
| `/images/Avatar/bottts-2.png` | 2/2 | File hiện có | Kiểm tra `/home`, `/leaderboard` và phản hồi HTTP |
| Ảnh huy hiệu Cloudinary | 1/1 | Log chỉ chứng minh tải thất bại | Cần mã HTTP/network để phân biệt URL, asset, transformation hay kết nối; chưa thử URL từ xa |
| `ONLINE_WINDOW_MINUTES is not defined` | 1/1 | Không còn tham chiếu trong mã Admin hiện tại | Có dấu hiệu đường lỗi cũ đã loại bỏ; kiểm thử trước khi xác nhận sửa |
| `useAuth is not defined` | 1/2 | App hiện đã import useAuth | Có dấu hiệu đã sửa nguyên nhân thiếu import; cần test ChatboxManager/provider |
| `useNavigate` ngoài Router | 1/3 | Stack trỏ ScrollPages cũ; component đó không còn trong Landing | Kiểm thử cây Router hiện tại; chưa tự gắn resolved cho bản ghi cũ |

PvP đáng chú ý ở `src/pages/BattlePvPPage.jsx:261–309`: sau `await persistLiveState`, kênh có thể bị cleanup đặt null ở dòng 632 nhưng vẫn gọi send. Các send tại dòng 189/327/719/765 cũng cần audit theo vòng đời. Optional chaining đơn thuần tránh throw nhưng có thể làm mất câu hỏi/kết quả, nên phải định nghĩa retry/restore/đóng phòng rõ ràng.

EcosystemGame3D: ref nằm trên `<object3D>`, material ở mesh con. Ngoài sửa ref, `meshBasicMaterial` đang dùng không phải material đường nét đứt tương ứng với dashOffset; cần thiết kế lại hiệu ứng tối thiểu đúng ý định và test khung hình.

## 4. Các vấn đề trong hệ thống log

### 4.1. Vì sao được gắn “Nghiêm trọng”

`SystemErrorBoundary.jsx:15–21` gán mọi lỗi đi qua boundary thành critical. Màn hình Admin bị thay thế toàn bộ nên critical có cơ sở về ảnh hưởng, nhưng không có nghĩa là lỗi bảo mật, mất dữ liệu hay database hỏng. Cần tách loại lỗi, mức ảnh hưởng và trạng thái xử lý. Lỗi phát sinh trong effect cũng có thể tới boundary; action `react_render_error` không chứng minh chỉ có lỗi trong hàm render.

### 4.2. Có cột resolved nhưng chưa có chức năng

SQL tạo `resolved_at` và index unresolved. Chưa tìm thấy RPC xác nhận sửa, người xác nhận, lý do, bằng chứng, phiên bản sửa, lịch sử chuyển trạng thái hoặc UI badge/bộ lọc resolved. Upsert chỉ đặt lại `resolved_at=null` khi cùng hàng nhận lỗi mới. Nếu sang ngày hoặc đổi user thì tạo hàng khác, không có hồ sơ lỗi xuyên ngày để mở lại.

### 4.3. Chống trùng là theo user + fingerprint + ngày

Unique index dùng `(user_id, fingerprint, dedup_date)`. Fingerprint dùng action + message chuẩn hóa + route. Vì vậy một nguyên nhân xuất hiện nhiều ngày vẫn có nhiều thẻ; ảnh chưa phải bằng chứng thuật toán chống trùng hỏng. UI “Log lỗi đã được chống trùng” cần giải thích phạm vi hoặc gom thêm theo hồ sơ sự cố.

Fingerprint không có environment/version/component; có thể gộp bản cũ và bản mới trong cùng hàng, hoặc tách một nguyên nhân theo route. Details/app_version bị ghi đè bằng lần mới nhất. Không nên dùng nguyên fingerprint này làm căn cứ tuyệt đối cho việc xác nhận một bản vá.

### 4.4. Retention và xóa dữ liệu

`supabase_observability_upgrade.sql:289–291` xóa warning/error khi `last_seen_at` cũ hơn 30 ngày, critical/security cũ hơn 90 ngày. Không xét resolved. Cuối migration cũng chạy DELETE tương tự. Không chạy lại migration hiện có để “thêm trạng thái” vì có thao tác xóa và sửa schema khác đi kèm.

`AdminLogsPage.jsx:30–43` gọi prune khi admin mở trang, tối đa một lần theo sessionStorage marker. Không tìm thấy scheduler tương ứng trong repository; chưa kiểm tra cron trực tiếp trên server. Do đó chưa thể bảo đảm xóa đúng lịch nếu không có admin truy cập. Fetch và prune chạy độc lập, có thể hiển thị tạm dữ liệu đã bị xóa hoặc phân trang lệch; lỗi prune không hiển thị.

Hiện trạng là 90 ngày, không phải hơn 90 ngày. Nếu yêu cầu cuối cùng là hơn 90 ngày, cần chốt số ngày cụ thể trước triển khai và dùng chung một nguồn cấu hình cho server/UI.

### 4.5. Log chưa bao phủ mọi lỗi

- Global monitoring chỉ bắt error/unhandledrejection và boundary. Lỗi được catch rồi console.error hoặc hiển thị toast không tự vào database.
- Supabase thường trả `{error}`; một số query AdminStats bỏ qua error và biến kết quả null thành 0, có thể tạo số liệu trông hợp lệ nhưng sai.
- `reportingInProgress` là khóa chung: một report đang gửi khiến lỗi khác bị bỏ qua. Cooldown được đánh dấu trước khi RPC thành công, nên lỗi gửi thất bại cũng ngăn thử lại cùng lỗi trong 5 phút.
- Client giới hạn 5 report/phút, cùng fingerprint 5 phút; server giới hạn 20 report/5 phút/user. Cần giữ chống bão log nhưng có số lượng bị bỏ qua/queue giới hạn và ưu tiên mức nghiêm trọng.
- RPC từ chối người chưa đăng nhập. Lỗi landing/login có thể không được lưu. ErrorBoundary vẫn nói “Lỗi đã được ghi nhận an toàn” dù không kiểm tra kết quả gửi.
- API chat chỉ console.warn ở nhiều nhánh, chưa được tích hợp luồng log server. Không thể coi AdminLogs là bức tranh toàn bộ backend.

### 4.6. UI và dữ liệu chẩn đoán

- Bộ lọc action được lấy từ 20 hàng của trang hiện tại nên thiếu action ở trang khác và tự thay đổi theo kết quả lọc.
- Không có hủy/kiểm tra thứ tự request: đổi bộ lọc nhanh có thể bị response cũ ghi đè.
- Fallback lỗi thiếu cột `42703` bỏ severity filter nhưng UI vẫn giữ lựa chọn, dễ hiểu nhầm kết quả.
- Details bị cắt 360 ký tự, không có mở rộng stack/bằng chứng xử lý. Thiếu bộ lọc ngày, môi trường, phiên bản, trạng thái.
- Server redaction không đồng đều với client: message được lọc nhiều loại bí mật hơn stack và các trường context. Allowlist và giới hạn chiều dài không thay thế redaction. Cần kiểm thử RPC trực tiếp bằng dữ liệu giả lập, không dùng bí mật thật.

## 5. Phát hiện bổ sung ngoài CSV

| Vị trí | Phát hiện | Ảnh hưởng và ưu tiên |
|---|---|---|
| `src/pages/BossBattlePage.jsx:390,406` | `userStats` chưa khai báo nhưng được đọc khi lưu kết quả | Có thể chặn lưu tiến độ và chưa tới RPC nhận thưởng; ưu tiên cao |
| `src/pages/BattlePage.jsx:254` | `updateStats` chưa khai báo; `if(updateStats)` vẫn ném ReferenceError | Phần cập nhật trước đó có thể đã chạy, sau đó báo lỗi và không refresh; không retry thưởng mù |
| `src/pages/TeacherPage.jsx:1127–1128` | Timer dùng channelRef.current sau khi chính code đặt null | Callback có thể remove null, không dọn đúng kênh hoặc tác động kênh mới; cần capture kênh và cleanup có kiểm soát |
| `src/components/games/MitosisGame3D.jsx:101–103` | Return theo phase trước useMemo | Vi phạm thứ tự Hook; cần sửa và test chuyển phase |
| SQL `profiles_update_own` | Cho update hàng của mình nhưng không thể hiện giới hạn cột role/xp/coins trong policy đó | Rủi ro quyền và toàn vẹn dữ liệu nếu không có grant/trigger khác bảo vệ. Chưa xác nhận khai thác trên DB thật; cần kiểm tra catalog read-only ưu tiên cao |
| `api/chat.js` | Không thấy kiểm tra auth/rate limit/giới hạn độ dài và timeout trong handler; message không phải chuỗi có thể lỗi ở trim | Cần xác minh bảo vệ bên ngoài, sau đó kiểm thử schema đầu vào và giới hạn tài nguyên |

Các rủi ro SQL/API này là phát hiện từ cấu hình nguồn, không phải kết luận hệ thống đã bị tấn công. Chưa kiểm toán từng RPC phần thưởng hay tất cả policy triển khai; đó là hạng mục bắt buộc của bước kiểm tra database, không được coi là đã đạt.

## 6. Thiết kế trạng thái “Đã chỉnh sửa”

Không có cách đáng tin để tự biết một lỗi bất kỳ đã được sửa chỉ bằng cách đọc log. Không phát sinh có thể do không ai dùng tính năng, offline, rate limit hoặc hỏng bộ thu thập. Tự động hóa phải dựa trên ca kiểm chứng gắn với lỗi, môi trường và phiên bản đang chạy.

Đề xuất tách:

1. `system_logs`: lịch sử các lần/nhóm lần phát sinh, tiếp tục chính sách lưu ngắn hạn.
2. `system_issues`: hồ sơ lỗi xuyên ngày/user, chứa khóa nhận diện ổn định, môi trường, trạng thái, first/last seen và tóm tắt ảnh hưởng.
3. `system_issue_events`: lịch sử bất biến của nhận xử lý, bản vá, xác minh, mở lại; chỉ lưu metadata chẩn đoán tối thiểu.

Luồng: **Chưa xử lý → Đang xử lý → Chờ xác minh → Đã chỉnh sửa**. Có thể thêm “Tái phát” khi lỗi xuất hiện lại trên phiên bản đã vá hoặc mới hơn. Lỗi từ tab chạy bản cũ cần được ghi nhận riêng, không tự phủ nhận bản vá mới. Không so sánh version kiểu chuỗi hoặc suy thứ tự từ SHA; dùng release/deployment metadata.

Điều kiện gắn nhãn Đã chỉnh sửa:

- Xác định đúng issue và phạm vi lỗi được sửa.
- Có phiên bản/commit hoặc deployment ID áp dụng.
- Có kết quả ca tái hiện trước sửa và ca kiểm thử sau sửa; ghi người/hệ thống xác nhận và thời điểm.
- Chuyển trạng thái qua RPC kiểm tra quyền admin ở server; học sinh/giáo viên không được sửa trạng thái qua client hay gọi RPC trực tiếp.
- Cập nhật có kiểm tra phiên bản dữ liệu/thời điểm phát sinh: lỗi mới đồng thời với thao tác đóng không bị mất hoặc đóng nhầm.

UI giữ nguyên mức nghiêm trọng và nội dung lịch sử, thêm badge **Đã chỉnh sửa**, thời gian, phiên bản, ghi chú/bằng chứng, nút xem chi tiết. Lỗi chưa sửa vẫn hiện như hiện nay. Có lọc Chưa xử lý/Chờ xác minh/Đã chỉnh sửa/Tái phát; gom một issue và mở các lần xảy ra bên trong.

Với dữ liệu cũ: mặc định “Chưa xác minh”, không tự đóng hàng loạt vì lâu không xuất hiện. Các lỗi thiếu import/biến cũ chỉ được đánh dấu sau kiểm chứng trên phiên bản xác định. Phải ghi provenance việc backfill từ CSV hoặc từ bảng hiện có, không suy ra là đã sửa tại ngày log cuối.

### Retention đề xuất

Giữ chính sách log thô 30 ngày và tối thiểu 90 ngày theo mức độ, tính từ lần cuối trong từng nhóm. Hồ sơ issue chưa xử lý không bị prune cùng log. Hồ sơ xác minh bản sửa được lưu độc lập với log thô để sau khi log hết hạn vẫn trả lời được “đã sửa bởi bản nào, lúc nào, bằng chứng nào”. Không thiết kế quan hệ FK cascade xóa hồ sơ khi log bị xóa.

Nếu cần giữ nguyên cả log thô chưa sửa, có thể chỉ prune resolved, nhưng phải cân nhắc dung lượng tích lũy. Phương án đề xuất là giữ hồ sơ/tóm tắt lỗi mở, còn log thô theo hạn. Hai chính sách là quyết định cần chốt trước migration. Scheduler chạy server, theo batch có kiểm soát và thống kê kết quả; thao tác resolve không trực tiếp xóa log.

## 7. Trình tự triển khai và điều kiện chuyển bước

### Bước 0 — Khóa bằng chứng và kiểm tra môi trường

Ghi baseline mã hiện tại và lockfile; bảo toàn thay đổi chưa commit. Xuất cấu trúc/policy/grant/trigger/function/index/cron từ DB bằng truy vấn chỉ đọc; xác định staging và production. Chụp số lượng log theo nhóm/hạn lưu, sao lưu dữ liệu liên quan trước thay đổi. Xác minh schema observability thật sự đang dùng. Không chạy nguyên migration cũ.

### Bước 1 — Sửa sự cố Admin và quyền sở hữu Presence

Thay đổi nhỏ, độc lập với migration log. Test truy cập trực tiếp `/admin`, từ trang khác vào, ra/vào lặp lại, refresh, StrictMode, logout/login khác user, nhiều tab, offline/online. Tiêu chí: không có exception, online đúng ý nghĩa tài khoản, không remove nhầm kênh và không rò kênh sau cleanup.

### Bước 2 — Bảo vệ tiến độ và các luồng Realtime

Sửa Boss/Battle/PvP/đóng phòng giáo viên theo các gói riêng. Test thoát khi await đang chạy, kết thúc câu hỏi rồi rời phòng, reconnect, đóng/mở lại phòng, timer cũ, gửi thất bại; xác nhận thưởng một lần và tiến độ không mất. Khảo sát quyền profile trước khi coi phần thưởng là đáng tin; không đổi RLS hàng loạt nếu chưa kiểm thử các role.

### Bước 3 — Ổn định 3D và tài nguyên

Sửa Ecosystem/Mitosis, kiểm thử từng pha/mount/unmount; thống nhất avatar mapping/fallback, xác minh từng URL lỗi. Tái hiện các lỗi lịch sử Router/Toast/Drei bằng bản sạch. Không nâng đồng loạt React/Supabase/Three/Drei như một cách thử may rủi.

### Bước 4 — Nâng cấp thu thập log

Thêm correlation, environment/release metadata, kiểm tra error trả về từ RPC/query, queue có giới hạn, trạng thái gửi thật của boundary và quan sát số log bị bỏ qua. Quy định severity theo ảnh hưởng. Kiểm thử redaction và không phát sinh vòng lặp “lỗi gửi log lại tự gửi log”.

### Bước 5 — Migration bổ sung hồ sơ xử lý và UI

Migration riêng, có transaction và kiểm tra idempotency; bảng/index/RPC mới, RLS server, backfill có kiểm soát. Chưa bật prune mới trước khi xác minh liên kết và trạng thái. Test resolve đồng thời với lỗi mới, tái phát cùng ngày/khác ngày/user khác, bản cũ/bản mới, rollback giao diện tương thích schema bổ sung. Hoàn thiện lọc/phân trang/detail và hiển thị badge.

### Bước 6 — Bật retention và nghiệm thu

Chạy truy vấn dry-run chỉ đếm hàng đủ điều kiện, đối chiếu 29/30/31 và 89/90/91 ngày, ranh giới múi giờ, mức critical/security, issue mở/đóng. Xác nhận sau prune còn hồ sơ và bằng chứng cần thiết. Sau đó mới bật lịch server và theo dõi kết quả. Nếu chọn hơn 90 ngày, điều chỉnh toàn bộ test theo giá trị đã chốt.

Mỗi gói cần: phạm vi diff nhỏ, kiểm thử mục tiêu, kết quả có thể kiểm tra lại và đường quay lui. Dừng chuyển bước nếu xuất hiện lỗi mất tiến độ, sai quyền hoặc không xác minh được trạng thái DB. Quay lui frontend không xóa dữ liệu điều tra; rollback database ưu tiên tương thích thêm cột/bảng, không dùng rollback phá dữ liệu.

## 8. Kiểm tra đã chạy

- `node node_modules/eslint/bin/eslint.js src api --format json --output-file audit/eslint-baseline.json`: 74 tệp, 191 errors, 23 warnings, exit 1. Đây là số chẩn đoán, không phải 191 lỗi runtime độc lập. Trong đó có 81 no-unused-vars, 54 purity, 23 set-state-in-effect, 21 exhaustive-deps, 10 no-undef. Sáu no-undef là `process` ở API do cấu hình ESLint globals browser; không kết luận Node thiếu process. Bốn no-undef còn lại thuộc hai lỗi Battle/Boss nêu trên.
- `node node_modules/vite/bin/vite.js build --outDir audit/build`: thành công, 3898 modules, khoảng 30 giây; cảnh báo chunk trên 500 kB. Build thành công không kiểm chứng luồng runtime, quyền DB hay thao tác lưu dữ liệu.
- `npm ls react react-dom @supabase/realtime-js --depth=1`: React/ReactDOM 19.2.5 đồng nhất ở cây được xem; Supabase Realtime 2.103.3. Không chứng minh trạng thái bundle/HMR đã chạy tại thời điểm log cũ.

Chưa có ca test nghiệp vụ được chạy trên tài khoản thực; chưa có lỗi nào được gắn resolved trong database. Báo cáo và baseline là đầu vào để triển khai theo thứ tự ở mục 7.
