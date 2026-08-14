# ADR-0004 - Supabase V2, command/query plane và authorization

- **Trạng thái:** Accepted cho foundation
- **Ngày:** 2026-08-12
- **Roadmap:** `V2-A0` đến `V2-A2`

## Bối cảnh

Legacy cho client gọi table/RPC rộng, có function nhận `user_id` và reward từ
caller, policy mở hoặc tắt RLS. Port cách này sang V2 sẽ tái tạo lỗ hổng gian lận,
cross-user access và quá tải query. V2 vẫn dùng Supabase nhưng phải phân biệt rõ
query chịu RLS, command có hậu quả và hạ tầng nội bộ.

Yêu cầu rate/payload/query/concurrency/timeout cho mọi endpoint cũng có nghĩa là
không thể để UI tùy ý dựng PostgREST filter hoặc gọi function ngoài registry.

## Quyết định

### Database và bề mặt API

- Mỗi environment có một canonical Postgres; mọi thay đổi chỉ bằng migration đã
  commit. Local/staging/production có project và secret tách biệt.
- Domain table nằm trong schema không expose trực tiếp. Schema API chỉ chứa view/
  function tối thiểu, versioned và có owner rõ.
- Revoke default table/function privileges; grant opt-in. RLS bật rõ ràng trên mọi
  object client-reachable; view dùng security mode phù hợp và có test cross-user,
  cross-class, cross-school.
- `anon`/`authenticated` không có quyền write domain table. Không có function
  nhận reward, role, balance hoặc actor identity như sự thật từ client.
- `SECURITY DEFINER` là ngoại lệ: fixed `search_path`, fully-qualified object,
  quyền execute tối thiểu, không nằm trong exposed schema nếu không cần, review
  riêng và test privilege escalation.

### Query plane

Client gọi query versioned qua `packages/api-client`; UI/screen không gọi
`.from()` hoặc dựng filter string. Query handler:

1. xác thực content type/JWT khi cần;
2. áp route registry: rate, body, query complexity, page size, concurrency,
   timeout, cache/freshness và cost class;
3. validate schema strict, từ chối unknown field/operator;
4. thực thi user-scoped read để RLS vẫn là defense-in-depth;
5. trả DTO đã validate, không trả raw row hoặc cột nội bộ.

Published curriculum/bootstrap có thể cache CDN bằng version/ETag. Progress riêng,
membership và auth response không cache public. Leaderboard là projection có
`asOf/version`, không phải phép cộng từ client.

### Command plane

Mọi thay đổi nghiệp vụ đi qua Edge Function/command handler versioned. Handler
verify JWT, lấy actor từ token, validate intent/evidence, authorize theo canonical
membership, áp limiter và dùng `requestId`/idempotency key.

Transaction DB nội bộ chỉ callable bằng server role tối thiểu. Nếu server role
bypass RLS, transaction function bắt buộc kiểm tra authorization tường minh từ
actor đã verify và có test negative; service-role key không xuất hiện ở app,
preview log hoặc client bundle. Reward, XP, coin, role, publish và match result do
server tính từ state/evidence, ghi ledger + audit/outbox trong cùng transaction.

Command chậm không giữ HTTP connection vô hạn: commit job/outbox rồi trả receipt;
worker idempotent xử lý nền. Retry chỉ cho lỗi được phân loại và luôn giữ cùng
idempotency key.

### Realtime, Storage và Auth

- Realtime là transport private. Server Broadcast mang event quiz/PvP; client
  event không quyết định score/state. Channel auth, join/message/payload/reconnect
  limit nằm trong endpoint registry.
- Storage read dùng bucket/policy hoặc signed URL scope hẹp. Upload đi qua pipeline
  allowlist type + magic bytes + size + scan/quarantine theo security baseline.
- Auth là control plane riêng nhưng vẫn nằm trong registry. Gate 5 failed/15 phút
  được giải quyết bởi `ADR-0003`, không mặc định platform rate limit là đủ.

### Contract và endpoint registry

`packages/contracts` là nguồn sự thật cho input/output/error/event và metadata:

```text
endpoint id + version + auth mode + actor roles
request/response runtime schema + content types
rate buckets + burst + retry policy
max body/page/query cost + timeout + concurrency + cost class
idempotency + cache/freshness + audit/redaction policy
owner + threat cases + test references
```

CI fail nếu handler không có registry entry, schema không strict hoặc policy thiếu.
Infrastructure/provider endpoint không thể bọc bởi app vẫn phải được kê khai với
provider limit, policy và test chống bypass tương ứng.

## Hệ quả

### Tích cực

- Một đường command có thể audit, rate-limit, chống replay và giữ ledger thống nhất.
- RLS, grants và explicit authorization tạo nhiều lớp thay vì phụ thuộc UI.
- Query/cache scale riêng mà không cho phép filter không giới hạn đánh vào DB.

### Đánh đổi

- Thêm handler/DTO so với gọi Supabase trực tiếp, cần contract test giữa app và DB.
- Server role làm tăng blast radius; vì vậy phải tách function, secret, log và test
  negative rất chặt.
- Edge Function có cold start/concurrency; công việc dài phải chuyển worker.

## Phương án bị loại

1. **Client ghi table/RPC trực tiếp như legacy:** không bảo đảm limiter, evidence,
   idempotency và server-authoritative reward.
2. **Mọi read dùng service role:** bỏ defense-in-depth RLS và tăng rò chéo tenant.
3. **Một API endpoint tổng quát nhận table/filter/action:** khó giới hạn query và
   biến thành privileged proxy.
4. **Realtime Postgres Changes cho toàn bộ game state:** fan-out lớn và nhầm
   transport với authority.

## Bằng chứng tham chiếu

- [Supabase securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase database connection management](https://supabase.com/docs/guides/database/connection-management)
- [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization)

