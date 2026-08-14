# BioLearn V2 - Chuẩn bảo mật bắt buộc

- **Mức áp dụng:** bắt buộc cho mọi app, API, Edge Function, RPC, Realtime,
  upload, worker, script và pipeline của BioLearn V2
- **Ngày chốt:** 2026-08-12
- **Trạng thái:** baseline V2-A0; các hạn mức phải được kiểm chứng lại bằng load
  test trước production nhưng không được nới lỏng âm thầm

Tài liệu này biến bốn yêu cầu bảo mật của chủ dự án thành release gate lâu dài.
Không hạng mục nào được coi là hoàn tất chỉ vì giao diện chạy được.

## 1. Bốn bất biến bảo mật

1. Mọi endpoint có thể truy cập đều phải có chính sách rate limit và giới hạn tài
   nguyên rõ ràng. Route xác thực mật khẩu bị giới hạn tối đa **5 lần thất bại
   trong 15 phút** theo nhiều khóa chống abuse.
2. Không hard-code API key, token, mật khẩu hoặc private credential. Secret phải
   nằm trong secret manager/biến môi trường phía server, được quét ở working tree,
   staged diff và toàn bộ Git history.
3. Mọi input không tin cậy phải được kiểm tra cú pháp, ngữ nghĩa, quyền và kích
   thước tại trust boundary. Payload quá lớn, sai `Content-Type`, sai schema hoặc
   có field lạ phải bị từ chối trước khi vào nghiệp vụ.
4. Security audit là cổng bắt buộc ở mỗi release. Báo cáo phải liệt kê cả lỗ hổng
   còn mở, giới hạn của cuộc audit, owner, hạn xử lý và biện pháp tạm thời; không
   được dùng câu “đã an toàn” khi chưa có bằng chứng.

## 2. Rate limit và chống quá tải

### 2.1. Nguyên tắc

- Mỗi route trong registry API phải khai báo: danh tính khóa giới hạn, cửa sổ,
  quota, burst, concurrency, payload tối đa, timeout, chi phí downstream và hành
  vi khi quá giới hạn. Không có cấu hình mặc định ngầm.
- Rate limit phải thực thi phía server/edge bằng kho đếm nguyên tử dùng chung.
  Không dùng bộ nhớ của một process vì instance stateless có thể scale ngang.
- Phải có nhiều lớp: CDN/WAF, Auth provider, API gateway, domain command và hạn
  mức tài nguyên ở database/Realtime/storage/nhà cung cấp ngoài.
- Khi vượt giới hạn, trả `429` với `Retry-After` phù hợp và mã lỗi ổn định; không
  tiết lộ tài khoản có tồn tại hay không.
- Rate limit không thay thế authorization, RLS, idempotency, timeout, queue,
  circuit breaker hoặc spending alert.
- Log chỉ chứa request ID, route, bucket đã băm, quyết định allow/deny và latency;
  không log mật khẩu, token, CAPTCHA token, nội dung học sinh hay payload thô.

### 2.2. Baseline ban đầu

| Nhóm lưu lượng | Chính sách bắt buộc ban đầu |
|---|---|
| Đăng nhập mật khẩu | Tối đa 5 lần **thất bại**/15 phút cho tổ hợp HMAC(identifier chuẩn hóa) + IP/device; đồng thời có bucket theo account và IP/subnet để chống cả brute force lẫn khóa tài khoản nạn nhân |
| Đăng ký/khôi phục/OTP | Hạn mức riêng chặt hơn theo identity + IP, generic response, cooldown; bật CAPTCHA thích ứng và giữ giới hạn Supabase Auth |
| Refresh/session restore | Bucket riêng đủ cho vòng đời session; không dùng hạn mức 5 lần đăng nhập khiến client hợp lệ tự logout |
| Query công khai/đã xác thực | Quota theo IP hoặc user/device, page size và query cost; cache dữ liệu publish được |
| Command ghi dữ liệu | Quota theo user + IP, idempotency key, concurrency cap và transaction timeout |
| Reward/mission/mail/publish/admin | Hạn mức nghiệp vụ chặt, audit bắt buộc; không nhận `userId`, số XP/coin hoặc role do client tự quyết định |
| Quiz join/answer và PvP | Hạn mức theo room/match/user/device; một câu chỉ nhận event hợp lệ theo sequence/time window; reconnect có backoff |
| Upload | Giới hạn số file, tổng byte, byte/file, thời gian xử lý và dung lượng theo user/lớp |
| AI/third-party API | Quota theo user/ngày, concurrency, token/cost budget, timeout và circuit breaker; cấm client gọi bằng secret |
| Static asset/splash | CDN cache + WAF/bot/egress limit; không đi qua command server |
| Internal worker/webhook | Chữ ký hoặc service identity, replay protection, concurrency/queue depth và quota riêng |

Con số ngoài route đăng nhập là cấu hình khởi đầu cần được khóa trong API
registry ở V2-A1/A2 và điều chỉnh bằng load/abuse test. Mọi thay đổi production
phải có lý do, reviewer và theo dõi tỷ lệ `429`; không sửa trực tiếp để chữa cháy.

### 2.3. Xác thực 5/15 phút không được tạo lỗ hổng mới

- Chỉ đếm thất bại xác thực thực sự; không tính lỗi mạng/5xx do hệ thống.
- Không khóa chỉ theo email vì kẻ xấu có thể cố ý khóa tài khoản người khác.
- Dùng khóa đã HMAC; không lưu email/số điện thoại dạng rõ trong rate-limit store.
- Sau ngưỡng rủi ro, dùng cooldown tăng dần và CAPTCHA. Teacher/Admin phải có MFA
  trước production.
- Supabase Auth có rate limit riêng nhưng không được coi là bằng chứng tự động cho
  yêu cầu 5/15. Luồng V2 phải chứng minh bằng integration test rằng không có đường
  gọi trực tiếp upstream để né policy. Supabase có Password Verification Hook để
  quan sát/kìm lần xác thực sai nhưng hiện là tính năng theo plan; hook cũng có
  nguy cơ bị lạm dụng để khóa user. V2-A1 phải lập spike so sánh hook với auth
  gateway/provider khác, test lockout DoS rồi chốt ADR trước khi phát hành.

## 3. Quản lý secret

### 3.1. Phân loại

| Loại | Vị trí được phép | Ghi chú |
|---|---|---|
| Supabase publishable/legacy anon key, public project URL | Client env có tên public | Không phải secret; vẫn không phải authorization và chỉ an toàn khi RLS đúng |
| CAPTCHA site key, public analytics ID | Client env public | Không đặt secret key cùng phía client |
| Service-role/secret API key, DB URL/password, signing key, Cloudinary API secret, AI provider key | Secret store phía server theo environment | Cấm `VITE_*`, `EXPO_PUBLIC_*`, bundle, log, screenshot và Git |
| Test credential | Secret store CI hoặc fixture giả | Không dùng tài khoản/dữ liệu production |

Biến môi trường chỉ là cơ chế cấu hình. Đưa secret vào biến có prefix public vẫn
làm lộ secret trong bundle. `.env.example` chỉ chứa tên biến và placeholder giả;
mọi `.env` có giá trị thật phải bị ignore.

### 3.2. Quy trình bắt buộc

1. Quét working tree, staged diff, commit mới và toàn bộ history bằng secret
   scanner có nhận diện provider; CI fail khi có finding chưa được triage.
2. Bật secret scanning và push protection trên Git host nếu gói sử dụng hỗ trợ.
3. Nếu một credential từng vào Git: **revoke/rotate trước**, rồi đánh giá việc
   làm sạch history. Chỉ xóa file hoặc đổi tên biến không thu hồi credential.
4. Secret có scope tối thiểu, tách local/staging/production, có owner, ngày tạo,
   ngày rotate và audit truy cập.
5. Không in giá trị secret trong báo cáo. Chỉ ghi tên biến, nguồn, phạm vi và
   trạng thái rotate/revoke.

## 4. Input, output và file không tin cậy

### 4.1. Request contract

- Kiểm tra `Content-Type` và `Content-Length` tại edge trước khi parse body; stream
  hoặc dừng đọc khi vượt giới hạn, không nhận body vô hạn.
- Dùng schema runtime strict: đúng kiểu, enum, min/max, độ dài, số phần tử, nesting
  depth; mặc định từ chối field lạ để chống mass assignment.
- Validate cả path, query, header, cookie, JSON, Realtime event, WebView message,
  webhook, CSV/import và dữ liệu đọc lại từ database/third party.
- Chuẩn hóa Unicode và định dạng định danh trước khi so sánh. Kiểm tra semantic
  như class membership, content version, match phase và ownership sau syntax.
- Query có page size tối đa, sort/filter allowlist và timeout. Dùng typed query/
  parameter binding; không ghép chuỗi filter/SQL từ input.
- “Làm sạch” phải theo ngữ cảnh. Không biến đổi mật khẩu tùy ý; HTML chỉ được phép
  khi thật sự cần, qua allowlist sanitizer và CSP. Text thường phải render/encode
  như text, không dùng raw HTML.

### 4.2. Upload

- Chỉ user có quyền mới được upload; policy storage ràng buộc owner/path.
- Allowlist extension và loại nghiệp vụ; không tin MIME do client gửi. Kiểm tra
  magic/signature, kích thước, tên do server sinh và giới hạn số lượng.
- File vào vùng quarantine/private; scan malware/sandbox hoặc CDR cho PDF/DOCX
  trước khi publish/xử lý. Parser chạy cách ly với timeout, memory và decompression
  limits; không hỗ trợ archive khi chưa có thiết kế chống zip bomb.
- URL tải xuống có authorization hoặc signed URL khi nội dung không công khai;
  có bandwidth/rate limit và quy trình báo cáo nội dung xấu.

## 5. Authorization và tính toàn vẹn nghiệp vụ

- Backend suy ra `auth.uid`, role, tenant/trường/lớp từ session và database; không
  tin các field này từ client.
- RLS bật trên mọi bảng exposed. Mỗi policy phải có test theo anonymous, student,
  teacher, admin, cross-user và cross-class; `using (true)`/`for all` cần ngoại lệ
  được ADR duyệt cho dữ liệu thật sự public, read-only.
- `security definer` mặc định bị thu hồi quyền thực thi công khai, cố định
  `search_path`, kiểm tra caller/ownership và chỉ nhận intent/evidence.
- Reward, score, streak, energy, leaderboard và PvP dùng command server-authoritative,
  idempotency và immutable ledger. Client không gửi số tiền thưởng cần cộng.
- Admin/teacher actions nhạy cảm cần step-up auth/MFA, audit trail và least privilege.

## 6. Cổng audit và phát hành

Mỗi PR/release chọn kiểm tra theo blast radius nhưng tối thiểu phải có:

- secret scan current + history, dependency/license audit, SAST và review thủ công;
- contract fuzz/negative tests cho payload sai/lớn/field lạ;
- RLS/authz/idempotency/concurrency/replay tests;
- rate-limit/abuse/load test, kiểm tra `429`, backoff và recovery;
- CSP/CORS/CSRF/security headers cho web; secure storage/deep link/WebView cho mobile;
- SBOM/lockfile, image/runtime scan nếu có container;
- privacy/log review vì hệ thống xử lý dữ liệu học sinh.

`Critical` hoặc `High` chưa xử lý chặn production, trừ khi chủ rủi ro phê duyệt
bằng văn bản với owner, hạn hết hiệu lực và biện pháp bù. `Medium/Low` vẫn phải
được ghi, không được xóa khỏi báo cáo để làm dashboard xanh.

## 7. Bằng chứng tham chiếu

- [OWASP API4:2023 - Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase Password Verification Hook](https://supabase.com/docs/guides/auth/auth-hooks/password-verification-hook)
- [GitHub secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
