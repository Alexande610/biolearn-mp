# BioLearn V2 - SLO, capacity và resource budget

- **Trạng thái:** Baseline tạm thời cho `V2-A0`; phải benchmark lại trước pilot
- **Ngày:** 2026-08-12
- **Phạm vi:** mobile, student/teacher/admin web, Supabase, Realtime, worker, 3D

## 1. Cách đọc các con số

Các số dưới đây là **engineering target**, không phải bằng chứng hệ thống hiện đã
đạt. Mỗi report phải ghi environment, region, Supabase/hosting plan, commit SHA,
dataset, cache state, thiết bị, OS, network profile và tool version. Không dùng
average để che tail latency; báo p50/p75/p95/p99, error, timeout và 429 riêng.

Không mua/tách hạ tầng dựa trên số người đăng ký. Capacity phải dựa trên workload
đồng thời và burst thật:

```text
P = max(
  enrolledUsers * measuredPeakConcurrencyRatio,
  simultaneousClasses * p95ClassSize,
  scheduledEventPeak
)
```

Owner phải điền ba đầu vào trước staging load test. Cho đến lúc đó, không tuyên
bố V2 chịu được một số user production cụ thể.

## 2. SLO tạm thời

### 2.1. Đúng và an toàn trước nhanh

| Chỉ số | Target | Cửa sổ/gate |
|---|---:|---|
| Cross-user/class/school access thành công trái phép | 0 | Mọi CI/staging security suite |
| Reward/ledger bị ghi lặp cho cùng idempotency scope | 0 | Mọi retry/parallel test |
| Command client tự quyết định reward/role/match result | 0 | Static + integration gate |
| Secret server xuất hiện trong client bundle/log/test fixture | 0 | Mọi build/CI |
| Oversized/malformed request đi tới domain handler | 0 | Contract/fuzz suite |
| Protected route fail-open khi session chưa rõ/hết hạn | 0 | Mobile/web E2E |

### 2.2. Availability và latency

| Luồng | Availability tháng tạm thời | Latency target ở region mục tiêu |
|---|---:|---|
| Splash asset + public bootstrap manifest tại edge | 99.95% | p95 <= 200 ms, p99 <= 500 ms |
| Auth/session control plane | 99.9% | p95 <= 800 ms, p99 <= 2 s, không tính thời gian người dùng/MFA |
| Query cached/public | 99.9% | p95 <= 300 ms, p99 <= 800 ms |
| Query personalized/RLS | 99.9% | p95 <= 500 ms, p99 <= 1.2 s |
| Command synchronous receipt | 99.9% | p95 <= 800 ms, p99 <= 2 s |
| Realtime answer transport region-local | 99.9% | p95 <= 300 ms, p99 <= 800 ms |
| Outbox projection freshness bình thường | 99.5% | p95 <= 5 s, p99 <= 30 s |

Availability loại trừ maintenance đã thông báo nhưng không loại trừ lỗi deploy,
quota, overload hoặc dependency do ta cấu hình sai. 429 đúng policy được báo riêng,
không trộn thành 5xx; 429 ngoài policy budget vẫn là capacity failure.

### 2.3. Client budget

Trên thiết bị tầm trung được chọn cho pilot, release build, cache lạnh và network
4G profile đã ghi rõ:

- cold start đến public/auth shell: p75 <= 2.5 s, p95 <= 5 s;
- session restore không được giữ splash quá 2 s nếu local state đã đủ để chuyển
  sang public/error shell;
- crash-free session >= 99.5% ở internal/pilot, sau đó nâng target bằng dữ liệu thật;
- main-thread stall, memory peak và FPS của Map/simulation phải có budget riêng
  sau khi chọn thiết bị mục tiêu; chưa có số thì không được ghi “đạt hiệu năng”.

## 3. Resource budget mặc định

Đây là default-deny budget cho endpoint mới. Route cần lớn hơn phải khai báo lý do,
owner, threat case và load test trong registry.

| Loại | Mặc định |
|---|---:|
| JSON request body | 64 KiB |
| JSON response body không stream | 256 KiB |
| Auth request body | 16 KiB |
| Page size | 20 mặc định, 50 tối đa |
| Filter/sort | Field/operator allowlist; không nhận raw expression |
| Command timeout | 2 s; việc dài trả receipt rồi qua worker |
| Query timeout | 1.5 s ở app boundary |
| WebView bridge | 32 KiB/message, 20 message/s/WebView |
| Retry | tối đa 2 cho read transient; command chỉ retry cùng idempotency key |

Upload không kế thừa 64 KiB. Mỗi media class phải có extension/MIME/magic-byte,
size, count, scan/quarantine và total quota riêng trước khi route được bật. Không
có media class trong registry thì từ chối upload.

Rate limit không có “unlimited”. Registry định nghĩa user/account/device/IP/subnet
bucket phù hợp. Password login tuân `ADR-0003`: tối đa 5 thất bại/rolling 15 phút
và phải chống upstream bypass; provider/default limit không được coi là bằng chứng.

## 4. Workload suite bắt buộc

### 4.1. Các mức chạy

| Mức | Tải | Mục đích |
|---|---|---|
| Smoke | 20 virtual users, 5 phút | Sai contract/config rõ ràng |
| Expected | `P`, 30 phút | Chứng minh SLO ở peak dự báo |
| Headroom | `1.5P`, 30 phút | Giữ ít nhất 50% headroom trước pilot |
| Spike | `3P`, 2 phút rồi hạ | 429/load shedding/reconnect không sập dây chuyền |
| Soak | `P`, tối thiểu 4 giờ | Leak, pool, queue lag, token refresh, cost drift |
| Stress | tăng bậc đến SLO đầu tiên vỡ | Biết capacity ceiling và recovery, không phải target |

Foundation minimum trước khi có forecast chỉ là bài kiểm tra plumbing, không phải
cam kết production: 500 client query đồng thời, 100 command writer đồng thời và
20 room x 50 Realtime client. Nếu plan local/staging không hỗ trợ, report phải ghi
quota/ceiling và gate production vẫn mở.

### 4.2. Scenario phải có

- CDN cache hit/miss cho splash/bootstrap, cache stampede và origin unavailable.
- Session restore, login thành công/thất bại, 5/15, CAPTCHA/MFA và credential spray.
- Query Map/profile/leaderboard với page tối đa, filter sai và payload lớn.
- Submit attempt song song/replay, timeout sau commit và retry cùng request ID.
- Realtime join/leave, message burst, network flap và reconnect storm có jitter.
- Worker chậm/dead-letter; projection trễ nhưng canonical reward vẫn đúng.
- Upload sai MIME/magic/size và nhiều file; AI/3D bị tắt/load-shed trước core.
- DB pool saturation, slow query, lock wait, provider 429 và dependency timeout.

Không chạy stress/spike vào production hoặc dữ liệu thật nếu chưa có change plan,
phạm vi, thời điểm, kill switch và phê duyệt riêng.

## 5. Scale và load-shedding gate

Scale/tách workload khi cùng một bottleneck làm vỡ SLO trong ba cửa sổ 5 phút ở
load test lặp lại hoặc production telemetry, sau khi đã loại lỗi query/index/config.
Quyết định cần biểu đồ trước/sau và cost impact.

Thứ tự xử lý:

1. chặn query/payload bất hợp lệ, sửa N+1/index/transaction/lock;
2. CDN/cache/ETag cho public và projection chịu stale;
3. pool connection và scale stateless query/command;
4. queue việc nền, giảm AI/cosmetic/presence;
5. read replica chỉ cho read chịu lag;
6. match coordinator riêng khi PvP metric chứng minh cần.

Không bao giờ load-shed authorization, RLS, validation, idempotency hoặc audit.
Khi quá tải, ưu tiên session và command đang diễn ra; trả snapshot/version cho
Map/rank; trì hoãn AI/notification; trả 429/503 có `Retry-After` thay vì treo.

## 6. Telemetry tối thiểu

Theo route/version: request count, latency histogram, status/429/timeout, payload
size, rate bucket (không log raw identity), concurrency, retry và cost class. Theo
hạ tầng: DB CPU/IO/connection/lock/slow query, Realtime connection/message/join,
outbox lag/dead-letter, cache hit, egress và provider quota.

Log/tracing phải redact token, cookie, password, auth code, PII và raw student
answer nếu không cần. High-cardinality user ID chỉ dùng dạng HMAC/trace scope có
retention rõ, không làm metric label công khai.

## 7. Gate nghiệm thu

- `V2-A1`: có registry + schema contract, load-test harness skeleton và smoke
  report local; chưa cần đạt production capacity.
- `V2-A2`: auth/query/command/RLS/idempotency abuse tests xanh.
- Trước pilot: điền `P`, chạy Expected/Headroom/Spike/Soak ở staging tương đương,
  đạt SLO và diễn tập load shedding/recovery.
- Trước PvP/quiz live: report Realtime riêng gồm fairness, reconnect và clock/server
  authority. Trước 3D: report thiết bị/FPS/memory/asset/bridge riêng.

