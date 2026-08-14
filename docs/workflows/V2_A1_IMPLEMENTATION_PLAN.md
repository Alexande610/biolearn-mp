# V2-A1 - Kế hoạch triển khai foundation code

- **Trạng thái:** Ready về kỹ thuật nhưng `BLOCKED` cho đến khi `V2-R0` tạo
  repository private mới; không thực thi trong repository legacy
- **Gate nguồn:** `workflows/V2_A0_GATE_REVIEW.md`
- **Mục tiêu:** mobile + student web đi qua cùng strict bootstrap contract, local
  Supabase và CI security gate mà không có feature nghiệp vụ giả

## 1. Dependency baseline đã kiểm tra

Các version dưới đây là baseline để tạo lockfile, không phải lệnh nâng tự động:

| Thành phần | Version/policy |
|---|---|
| Node.js | `24.18.1` LTS, source tại `.node-version` |
| pnpm | `10.28.1`, pin trong `packageManager`; không nhảy pnpm 11 trong A1 |
| Expo template | `expo-template-default@57.0.14` |
| Expo / Router | `~57.0.12` / `~57.0.12` |
| React / React Native | `19.2.3` / `0.86.2`, theo template Expo |
| TypeScript | `~6.0.3`, theo template Expo |
| Student web | Next.js `16.3.0`, dùng cùng React `19.2.3` nếu install/peer audit xanh |
| Runtime schema | Zod `4.4.3` |
| Test runner | Vitest `4.1.10` nếu compatibility smoke xanh |
| Supabase CLI | project dev dependency `2.113.0`, không cài global |

Khi scaffold, dùng manifest tối thiểu rồi chạy Expo dependency check. Nếu registry
đã đổi, chỉ cập nhật baseline sau khi đối chiếu template stable, peer dependency,
license, advisory và build; không lấy `latest` đồng loạt. Canary/beta bị cấm.

## 2. Trình tự triển khai

### V2-A1.1 - Toolchain và workspace

- Root private `package.json`, `pnpm-workspace.yaml`, exact `packageManager`,
  `engines.node` và frozen lockfile.
- Root scripts chỉ điều phối format/lint/type/test/build/audit; chưa thêm
  Turborepo/Nx.
- `.env.example` chỉ tên biến public/local giả; `.env*` thật tiếp tục bị ignore.
- Gate: terminal dùng đúng Node 24.18.1; clean install tái lập; dependency audit
  được lưu làm baseline.

### V2-A1.2 - Tooling, contract và token

- `packages/tooling`: strict TypeScript, lint/format/test config dùng chung.
- `packages/contracts`: bootstrap schemas, stable error codes và endpoint registry
  typed; test strict/unknown/length/enum/response.
- `packages/design-tokens`: semantic token light/dark thuần TypeScript, không DOM/
  Expo import; có contrast/shape/status contract.
- Gate: unit/type/contract test xanh; không có `any`, raw color rải trong app hoặc
  endpoint thiếu limit metadata.

### V2-A1.3 - Bootstrap query và API client

- Tạo `packages/api-client` vì endpoint thật đầu tiên đã tồn tại.
- Handler `GET /v1/bootstrap` thực thi registry, body/query/timeout/response limit,
  stable error mapping và trace redaction.
- Rate limiter là interface + shared-store adapter cho staging/prod; in-memory chỉ
  được dùng trong unit/local test và phải fail build/deploy nếu chọn ở production.
- Gate: malformed/oversized/rate/timeout/cache tests; không có secret/user data.

### V2-A1.4 - Student web shell

- Next.js App Router public shell gọi typed client; loading/ready/offline/error.
- Security headers/CSP baseline; không tạo nghiệp vụ ở route handler.
- Light/dark, keyboard, reduced motion; viewport 360x800, 768x1024, 1440x900.
- Gate: production build + component/E2E smoke + bundle secret assertion.

### V2-A1.5 - Mobile shell

- Expo Router route mỏng, native splash và bootstrap state machine fail-closed.
- Không cài Supabase auth/SecureStore cho đến session spike cần thật; không có
  password login hoạt động.
- Cùng semantics state/token/contract với web, UI riêng cho touch.
- Gate: Expo dependency check, type/test, development build và light/dark/device QA.

### V2-A1.6 - Supabase local-only

- Pin CLI project-scoped; `config.toml`, migration public manifest tối thiểu,
  explicit grants/RLS và synthetic seed fail-closed ngoài local.
- Không `link`, `db push`, `db pull` hoặc dùng credential hosted trong A1.
- Gate: local stack từ sạch, migration repeatability, pgTAP/RLS anonymous read-only
  và write-denied tests.

### V2-A1.7 - CI/security/capacity plumbing

- Frozen install; format/lint/type/test/build; migration/RLS; dependency/SAST;
  secret current + full-history scan; generated bundle secret assertion.
- Bootstrap smoke load test có 429, payload/query/timeout; không tuyên bố capacity
  production từ local benchmark.
- Critical/High fail gate; exception chỉ theo security baseline có owner/expiry.

## 3. Definition of Ready cho mỗi bước

Trước khi sửa, bước phải có owner, file list, contract, negative tests và rollback.
Không bắt đầu bước kế tiếp khi bước hiện tại đỏ. Mỗi bước cập nhật
`IMPLEMENTATION_STATUS.md`; không gộp migration, dependency major, UI redesign và
security bypass trong cùng một change.

## 4. Những thứ cố ý chưa tạo

- `packages/domain` trước use case nghiệp vụ thật.
- Teacher/Admin/Content Studio/Simulation/PvP/Quiz app hoặc empty folder.
- Auth password, reward, progress, leaderboard, upload, AI hoặc Realtime handler.
- Content fixture giả gắn mác bài học production.
- Production Vercel/EAS/Supabase configuration, project link hoặc secret.

## 5. Lệnh nghiệm thu dự kiến

Tên script sẽ được chốt ở `V2-A1.1`, nhưng gate phải có khả năng chạy từ root:

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:secrets
pnpm security:dependencies
pnpm db:start
pnpm db:reset:local
pnpm db:test
```

Không tạo script tên an toàn nhưng thực tế gọi remote/destructive command. Mọi
script database A1 phải local-explicit và từ chối khi phát hiện linked/remote.
