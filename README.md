# BioLearn V2 Foundation

BioLearn V2 được phát triển trong repository private độc lập
`Alexande610/biolearn-v2`, với lịch sử `main`, dữ liệu và deployment riêng.
Repository này không có quan hệ lịch sử Git với `biolearn-mp`; hệ thống cũ vẫn
được giữ nguyên để đối chiếu read-only/maintenance.

## Trạng thái

- `V2-R0` đã hoàn tất ranh giới repository ngày 2026-08-13. Giai đoạn hiện hành:
  `V2-A1.1` - scaffold foundation trên feature branch; chưa chạy migration hosted.
- Kiến trúc: modular monolith trên Supabase/Postgres, backend-first về nghiệp vụ,
  mobile-first về trải nghiệm và có student web responsive riêng.
- Phạm vi ưu tiên: trải nghiệm học viên. Teacher, Admin và Content Studio chỉ
  được phát triển sau khi các gate tương ứng trong blueprint đạt.

## Tài liệu bắt buộc

Đọc theo thứ tự trước khi thay đổi dự án:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/AGENTS.md`](docs/AGENTS.md)
3. [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)
4. [`docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md`](docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md)
5. [`docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md`](docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md)
6. [`docs/AI_ENGINEERING_GUARDRAILS.md`](docs/AI_ENGINEERING_GUARDRAILS.md)
7. [`docs/SECURITY_BASELINE.md`](docs/SECURITY_BASELINE.md)
8. [`docs/PROJECT_REBUILD_ROADMAP.md`](docs/PROJECT_REBUILD_ROADMAP.md)

Tài liệu chuyên biệt:

- [`docs/workflows/STUDENT_EXPERIENCE_V2.md`](docs/workflows/STUDENT_EXPERIENCE_V2.md):
  luồng và phản biện trải nghiệm học viên mobile/web.
- [`docs/workflows/SECURITY_THREAT_MODEL.md`](docs/workflows/SECURITY_THREAT_MODEL.md):
  tài sản, trust boundary, abuse cases và security gate theo giai đoạn.
- [`docs/workflows/V2_A0_GATE_REVIEW.md`](docs/workflows/V2_A0_GATE_REVIEW.md):
  kết luận gate, phạm vi được phép code và blocker production còn mở.
- [`docs/workflows/V2_A1_IMPLEMENTATION_PLAN.md`](docs/workflows/V2_A1_IMPLEMENTATION_PLAN.md):
  thứ tự scaffold foundation, dependency baseline và kiểm tra từng bước.
- [`docs/workflows/STARTUP_AUTH_DAILY_STATION_VISUAL_SPEC.md`](docs/workflows/STARTUP_AUTH_DAILY_STATION_VISUAL_SPEC.md):
  logo + ADN/mầm cây, auth phân vai, tuyến Trạm ngày Sinh học/ba sao và background thay thế được.
- [`docs/runbooks/LOCAL_DEVELOPMENT_SETUP.md`](docs/runbooks/LOCAL_DEVELOPMENT_SETUP.md):
  chuẩn bị Node/pnpm/Docker/Supabase local mà không chạm hosted project.
- [`docs/runbooks/CREATE_DEDICATED_V2_REPOSITORY.md`](docs/runbooks/CREATE_DEDICATED_V2_REPOSITORY.md):
  export allowlist sang Git mới mà không mang lịch sử/secret/config legacy.
- [`docs/adr/ADR-0001-RUNTIME-TOPOLOGY-AND-SCALING.md`](docs/adr/ADR-0001-RUNTIME-TOPOLOGY-AND-SCALING.md):
  phân tải theo workload nhưng giữ chung dữ liệu/ranking/PvP.
- [`docs/adr/ADR-0002-MONOREPO-TOOLCHAIN-AND-APP-TOPOLOGY.md`](docs/adr/ADR-0002-MONOREPO-TOOLCHAIN-AND-APP-TOPOLOGY.md):
  pnpm workspace, runtime pin và ranh giới mobile/student web.
- [`docs/adr/ADR-0003-APP-BOOTSTRAP-AND-SESSION.md`](docs/adr/ADR-0003-APP-BOOTSTRAP-AND-SESSION.md):
  state machine splash/session và gate auth 5 lần thất bại/15 phút.
- [`docs/adr/ADR-0004-SUPABASE-COMMAND-QUERY-AND-AUTHORIZATION.md`](docs/adr/ADR-0004-SUPABASE-COMMAND-QUERY-AND-AUTHORIZATION.md):
  bề mặt Data API tối thiểu, RLS và command server-authoritative.
- [`docs/adr/ADR-0005-SIMULATION-WEBVIEW-BRIDGE.md`](docs/adr/ADR-0005-SIMULATION-WEBVIEW-BRIDGE.md):
  protocol/allowlist/authority cho simulation 2D/3D trong WebView.
- [`docs/adr/ADR-0006-DEDICATED-V2-REPOSITORY-AND-DATA-ISOLATION.md`](docs/adr/ADR-0006-DEDICATED-V2-REPOSITORY-AND-DATA-ISOLATION.md):
  repository V2 riêng, dữ liệu tạo mới và deploy không dùng chung legacy.
- [`docs/LEGACY_SECURITY_AUDIT_2026-08-12.md`](docs/LEGACY_SECURITY_AUDIT_2026-08-12.md):
  finding còn mở của V2 foundation và code legacy được audit chỉ đọc.
- [`docs/LEGACY_SYSTEM_INVENTORY.md`](docs/LEGACY_SYSTEM_INVENTORY.md):
  route, Data API/RPC, Realtime, role và mapping dữ liệu cần migration.
- [`docs/CURRICULUM_CONTENT_STANDARD.md`](docs/CURRICULUM_CONTENT_STANDARD.md):
  nguồn, kiểm định học thuật và quy trình nội dung.
- [`docs/CURRICULUM_SOURCE_INVENTORY.md`](docs/CURRICULUM_SOURCE_INVENTORY.md):
  danh mục SGK local và trạng thái xác minh.
- [`docs/MAP_VISUAL_REFERENCE.md`](docs/MAP_VISUAL_REFERENCE.md): căn cứ bố cục
  Trạm ngày theo tuyến/ba sao, hướng Sinh học nguyên bản, responsive, light/dark
  và giới hạn không sao chép tàu/đường ray mẫu.
- [`docs/assets/references/README.md`](docs/assets/references/README.md): danh mục
  ảnh tham khảo do người dùng cung cấp.
- [`documents/README.md`](documents/README.md): cách quản lý PDF/TXT nguồn local.

## Nguyên tắc khởi tạo

- Không copy component, SQL hoặc cấu hình legacy vào V2 theo kiểu từng file.
- Chỉ tạo đường dẫn khi có roadmap ID, domain owner, contract và kiểm tra rõ.
- Screen không gọi Supabase trực tiếp; client không tự quyết định reward,
  progress, streak, role, leaderboard, quiz hoặc PvP.
- Mọi endpoint có rate/payload/query/concurrency/timeout limit; auth tối đa 5 lần
  thất bại/15 phút; mọi input strict-validate và secret được quét cả Git history.
- Nội dung phải có `sourceRefs`, version và trạng thái duyệt; TXT/OCR không phải
  nguồn xuất bản.
- Student mobile và student web dùng chung domain, contracts, API client và
  design tokens, nhưng có UI phù hợp riêng cho cảm ứng và desktop.
- PDF/TXT SGK trong `documents/source/` là local-only, không được Git theo dõi hay
  đưa vào bundle sản phẩm khi chưa xác nhận quyền phân phối.

## Cây hiện tại

```text
AGENTS.md
README.md
docs/
  AGENTS.md
  *.md
  adr/
  workflows/
  assets/
documents/
  README.md
  source/                 # local-only, bị ignore
```

`apps/`, `packages/` và `supabase/` chỉ được tạo ở `V2-A1` sau khi `V2-A0` được
duyệt. Không tạo skeleton rỗng để làm repository trông như đã triển khai.
