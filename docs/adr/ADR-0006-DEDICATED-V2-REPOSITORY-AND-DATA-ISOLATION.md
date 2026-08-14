# ADR-0006 - Repository V2 riêng và cô lập dữ liệu theo môi trường

- **Trạng thái:** Implemented ngày 2026-08-13; CI required checks theo issue #1
- **Ngày:** 2026-08-12
- **Roadmap:** `V2-R0`, chặn `V2-A1`

## Bối cảnh

BioLearn V2 hiện được chuẩn bị trên nhánh root độc lập
`biolearn-v2-foundation` trong repository legacy. Cách này đã ngăn V2 kế thừa
lịch sử file cũ, nhưng vẫn còn chung remote, quyền repository, cấu hình CI,
preview deployment và tên nhánh `main` với hệ thống đang vận hành. Một thao tác
nhầm production branch, merge unrelated histories hoặc tái sử dụng biến môi
trường có thể làm V2 ảnh hưởng legacy và ngược lại.

Người sở hữu sản phẩm yêu cầu toàn bộ hệ thống xây lại được chuyển sang một Git
mới và dữ liệu V2 được tạo mới. Quyết định phải đồng thời giữ khả năng đối chiếu
legacy, không xóa dữ liệu cũ và không phân mảnh ranking/PvP/lớp học bên trong V2.

## Quyết định

### 1. Một repository riêng cho toàn bộ BioLearn V2

- Tạo **một private repository mới** cho monorepo BioLearn V2. Tên đề xuất:
  `biolearn-v2`; tên và owner remote cần người sở hữu xác nhận trước khi tạo.
- Repository mới có lịch sử Git mới, default branch `main` mới và **không có
  quan hệ lịch sử** với `biolearn-mp/main` hoặc `biolearn-v2-foundation`.
- Nhánh hiện tại chỉ là nguồn xuất tạm thời. Không scaffold runtime, cài
  dependency, tạo migration hay cấu hình deploy mới trong repository legacy kể
  từ khi ADR này được chấp nhận.
- Chỉ xuất các file nằm trong allowlist của runbook. Không copy `.git`, file bị
  ignore, `.env*`, cache, build output, SQL/script legacy hoặc deployment config
  cũ.
- Logo/asset legacy chỉ được chuyển bằng mục inventory riêng, có hash, nguồn và
  quyền sử dụng; không copy nguyên toàn bộ `public/`.
- Repository legacy giữ nguyên làm đối chiếu read-only/maintenance. Không merge
  V2 trở lại `biolearn-mp/main` và không đổi production branch của repository cũ.

Quyết định này không mâu thuẫn với ADR-0002: V2 vẫn là **một monorepo**, không
tách mỗi mobile/web/domain thành repository riêng.

### 2. Git workflow và quyền bảo vệ

- `main` của repository V2 được bảo vệ: thay đổi qua pull request, CI bắt buộc,
  không force-push, không xóa branch và không merge khi security gate đỏ.
- Feature branch ngắn theo `codex/<roadmap-id>-<ten-ngan>` hoặc quy ước team đã
  duyệt. Release production chỉ lấy commit/tag đã qua staging và approval.
- Bật secret scanning/push protection của nhà cung cấp Git nếu gói hỗ trợ; CI
  vẫn phải quét worktree, diff và toàn bộ lịch sử repository V2.
- Không đưa production secret vào GitHub Actions/Vercel/EAS preview. Ưu tiên
  workload identity/OIDC; secret còn bắt buộc phải có owner, scope, rotation và
  environment riêng.

### 3. Dữ liệu V2 tạo mới, không dùng chung backend legacy

- Tạo Supabase/Postgres **mới** cho `local`, `staging` và `production-v2`.
  Project ID, database, storage bucket, auth tenant, signing secret và API key
  không dùng chung với legacy.
- Schema V2 được dựng từ empty database chỉ bằng migration trong repository V2.
  Local/staging dùng synthetic seed; không clone dữ liệu học sinh production.
- Mặc định **không import dữ liệu legacy** vào V2. Nội dung, cấu hình, role,
  progress, reward ledger và dữ liệu kiểm thử V2 được xây lại theo schema/contract
  mới.
- Không xóa, reset hoặc sửa database legacy. Nếu sau này cần đưa tài khoản hay
  tiến trình thật sang V2, đó là hạng mục migration riêng có dry-run, mapping,
  consent/pháp lý, checksum, reconciliation, idempotency, backup và rollback.
- Trong mỗi environment V2 vẫn có một canonical identity/Postgres/ledger. Việc
  tách workload hoặc nhiều instance không tạo leaderboard, PvP hay dữ liệu giáo
  viên riêng theo “server”.

### 4. Deploy tách hoàn toàn khỏi legacy

- Tạo Vercel project mới cho từng web app V2 và EAS project mới cho mobile; tuyệt
  đối không nối preview V2 vào production database legacy.
- Preview chỉ dùng backend/dữ liệu test. Staging có approval riêng. Production
  domain chưa được chuyển cho đến khi CI, RLS, rate limit, secret scan, input
  validation, load test, security audit và rollback rehearsal đều đạt.
- Không reuse project ID, environment variable set, webhook, service-role key,
  OAuth callback hoặc signing secret legacy bằng cách copy hàng loạt.
- Cutover DNS/domain là thay đổi riêng có maintenance window, health check,
  canary/rollback và phê duyệt của người sở hữu.

## Gate V2-R0

`V2-A1` chỉ được bắt đầu trong repository mới khi có đủ:

1. Remote private mới và owner/tên đã xác nhận.
2. Export allowlist đã review; secret scan source snapshot không còn finding mở
   thuộc diện chặn.
3. Commit khởi tạo mới có đúng tài liệu/asset đã duyệt, không có lịch sử legacy.
4. Branch protection và CI tối thiểu đã bật hoặc có issue/owner xác định nếu nhà
   cung cấp chưa cho cấu hình trước commit đầu.
5. Ma trận environment mới và cam kết không nối legacy database.
6. `docs/IMPLEMENTATION_STATUS.md` trong repository mới ghi `NEXT: V2-A1.1`.

## Hệ quả

### Tích cực

- Legacy và V2 không còn có thể xung đột default branch, preview hay Git history.
- Security scan/history, quyền deploy và vòng đời secret của V2 sạch, dễ audit.
- Database V2 có thể chứng minh dựng lại từ migration trống.

### Đánh đổi

- Cần cấu hình lại remote, CI, Vercel, EAS, Supabase và OAuth callback.
- Không có migration dữ liệu mặc định; tài khoản/progress cũ sẽ không xuất hiện ở
  V2 trừ khi một dự án migration sau này được duyệt.
- Một số asset hợp lệ phải export có chọn lọc thay vì tiện tay copy cả thư mục.

## Phương án bị loại

1. **Tiếp tục trên nhánh của repository cũ:** vẫn dùng chung remote/default
   branch/deploy settings và dễ thao tác nhầm.
2. **Merge root history V2 vào `main` legacy:** tạo unrelated-history cutover khó
   review và trái yêu cầu không xung đột.
3. **Dùng lại database legacy nhưng schema mới:** không đạt cô lập, rollback và
   kiểm chứng migration-from-empty.
4. **Xóa repository/database cũ sau khi chuyển:** phá đường đối chiếu/khôi phục và
   là thao tác dữ liệu không thể đảo ngược chưa được phép.
