# V2-A0 - Gate review trước khi scaffold code

- **Ngày review:** 2026-08-12
- **Kết luận:** `PASS A0 có giới hạn; execution PAUSED bởi V2-R0`
- **Cho phép:** sau khi `V2-R0` đạt, bắt đầu `V2-A1` foundation trong repository
  mới theo `docs/workflows/FOUNDATION_VERTICAL_SLICE.md`
- **Không cho phép:** production deploy/migration, password auth thật, content
  học thuật, reward/progress/PvP/teacher/admin hoặc port code legacy

## 1. Kết luận phản biện

Kiến trúc foundation đã đủ rõ để code mà không phải tự quyết định lại source of
truth, topology, app boundary, session, query/command hoặc WebView trong lúc
triển khai. Không cần chờ nội dung lớp 6-12 để kiểm chứng toolchain, bootstrap và
strict contract; ngược lại, không được dùng foundation shell để lách content gate.

`PASS A0 có giới hạn` không có nghĩa hệ thống đã an toàn production. Nó chỉ xác
nhận architecture đủ cho foundation. Theo quyết định mới ngày 2026-08-12, quyền
thực thi scaffold bị tạm dừng cho đến khi `V2-R0` tạo repository/data/deploy mới.
Các control chưa có runtime test vẫn giữ trạng thái chưa triển khai.

## 2. Ma trận gate

| Gate | Bằng chứng | Kết quả |
|---|---|---|
| Legacy freeze và ranh giới port | `LEGACY_SYSTEM_INVENTORY.md` | PASS |
| Security baseline bốn bất biến | `SECURITY_BASELINE.md` | PASS ở mức policy |
| Threat model và open-risk register | `workflows/SECURITY_THREAT_MODEL.md` | PASS ở mức thiết kế |
| Topology phân tải nhưng chung dữ liệu | ADR-0001 | PASS |
| Monorepo/toolchain/app topology | ADR-0002 | PASS |
| Bootstrap/session fail-closed | ADR-0003 | PASS; auth limiter còn gate |
| Supabase command/query/RLS | ADR-0004 | PASS ở mức contract |
| WebView typed bridge | ADR-0005 | PASS; chưa nằm trong A1 |
| Repository/data/deploy isolation | ADR-0006 + runbook tách repo | PASS ngày 2026-08-13; CI required checks theo issue #1 |
| SLO/resource/capacity baseline | `NON_FUNCTIONAL_REQUIREMENTS.md` | PASS tạm thời |
| Vertical slice kỹ thuật A1 | `workflows/FOUNDATION_VERTICAL_SLICE.md` | PASS |
| UI direction student light/dark | `workflows/STARTUP_AUTH_DAILY_STATION_VISUAL_SPEC.md` | PASS đặc tả sửa đổi; preview cũ bị loại, wireframe/runtime QA chưa chạy |
| Vertical slice học thuật | `CURRICULUM_SOURCE_INVENTORY.md` | BLOCKED cho A3, không chặn A1 foundation |
| Live security audit/pentest | `LEGACY_SECURITY_AUDIT_2026-08-12.md` | OPEN; chặn production |

## 3. Phiếu phạm vi được duyệt có điều kiện cho bước code đầu tiên

Phiếu này chỉ có hiệu lực **trong repository V2 mới sau khi V2-R0 đạt**:

```text
Roadmap ID: V2-A1.1
Mục tiêu duy nhất: tạo workspace/toolchain tái lập và contract bootstrap nền.
Domain sở hữu: Foundation / Platform / Contracts.
Được tạo/sửa: package.json, pnpm-workspace.yaml, pnpm-lock.yaml,
  apps/mobile, apps/student-web, packages/contracts, packages/design-tokens,
  packages/tooling, packages/api-client khi endpoint bootstrap tồn tại,
  supabase local-only, .github/workflows và tài liệu liên quan.
Không được chạm: legacy refs/main/democode, production env/project/database,
  content SGK, reward/progress/role/PvP/teacher/admin/simulation feature.
Contract ảnh hưởng: public bootstrap v1 và endpoint security registry.
Rủi ro chính: dependency supply-chain, secret vào bundle, input/limit thiếu,
  runtime local lệch và local Supabase bị nhầm với production.
Kiểm tra: clean install frozen lockfile, format/lint/type/test/build,
  strict/oversized/unknown-field/rate tests, secret/dependency scan,
  local migration/RLS tests và light/dark viewport QA.
Quay lại: chưa deploy/chạm dữ liệu; có thể bỏ scaffold A1 bằng một revert có
  review mà không ảnh hưởng legacy hoặc production.
```

## 4. Contract endpoint đầu tiên

Endpoint đầu tiên là query công khai, cacheable; không phải auth hoặc command:

```text
id: public.bootstrap.v1
method/path: GET /v1/bootstrap
auth: public
query allowlist: platform, clientVersion, locale
body: không chấp nhận
rate baseline: 60 request/phút/IP, burst 10; store dùng chung ở staging/prod
query string: tối đa 2 KiB; unknown field bị từ chối
response: tối đa 64 KiB; strict schema; ETag/manifestVersion
timeout: 1.5 giây
cache: public versioned, không chứa user/session/secret
cost class: low
owner: Foundation Platform
threat cases: TM-08, TM-09, malformed/oversized/cache stampede
```

Schema request chỉ nhận `platform = ios | android | web`, `clientVersion` có giới
hạn độ dài/định dạng và `locale` allowlist. Response tối thiểu có
`schemaVersion`, `manifestVersion`, `serverTime`, `minimumClientVersion` và trạng
thái maintenance versioned. Không trả database row, provider config nội bộ hoặc
feature chưa tồn tại.

Test negative bắt buộc: query/body/content-type sai, field lạ, URL quá dài,
response sai schema, timeout và request thứ 61 trong cửa sổ. 429 có
`Retry-After`; log chỉ có request/trace ID và rate bucket đã băm.

## 5. Preflight môi trường hiện tại

| Thành phần | Kết quả 2026-08-12 | Ảnh hưởng |
|---|---|---|
| Git source snapshot | `biolearn-v2-foundation`, có upstream legacy | Chỉ dùng export; không phải repository đích để scaffold |
| Node trên PATH | `v22.14.0` | FAIL so với pin Node 24.18.1 |
| Node đóng gói Codex | `v24.14.0` | Dùng chẩn đoán được, không thay pin repository |
| pnpm khả dụng | `10.28.1` | Sẽ pin chính xác ở root package manifest |
| Corepack | `0.31.0` | Có, nhưng PATH Node cần sửa trước install |
| Supabase CLI | thiếu | Sẽ pin project dependency `2.113.0` ở A1 |
| Docker-compatible runtime | thiếu | Chưa thể chạy Supabase local/RLS test |
| Gitleaks/TruffleHog/Semgrep/OSV Scanner | thiếu | CI/local scanner chưa triển khai |
| Browser QA tích hợp | lỗi quyền runtime Windows `EPERM` | Không tuyên bố visual QA đã pass |

Không tạo lockfile bằng Node 22. Trước bước scaffold phải cài/activate đúng Node
trong `.node-version` và xác nhận `node --version` từ chính terminal dự án.

## 6. Rủi ro/gate còn mở

- `AUTH-RL-01`: chưa chứng minh 5 thất bại/15 phút chống gọi thẳng upstream và
  lockout DoS; không mở password auth.
- `SEC-LIVE-01`: chưa audit live Supabase/Vercel/WAF/production; không deploy.
- `ENV-LOCAL-01`: thiếu Docker, chưa chạy local migration/pgTAP/RLS.
- `SEC-CI-01`: chưa có secret history scan, dependency/SAST gate thực thi.
- `UI-QA-01`: preview light/dark chưa được browser/device QA đủ viewport.
- `CONTENT-01`: `C0.1`-`C0.6` chưa đạt; không tạo bài học/lab/Mini Boss thật.
- `REPO-01`: chưa tạo remote private/lịch sử `main` mới và branch protection;
  chặn mọi scaffold `V2-A1` trong repository hiện tại.
- `VISUAL-01`: chưa có wireframe duyệt cho ADN+mầm cây, auth phân vai và tuyến
  Trạm ngày/ba sao với concept Sinh học nguyên bản; chặn code UI tương ứng.

Các finding trên có owner là Foundation/Security cho đến khi một hạng mục cụ thể
được giao. Không finding nào được đóng chỉ bằng tài liệu.
