# Trạng thái nâng cấp NextGen BioLearn

Tệp này là điểm bàn giao giữa các phiên làm việc. Cập nhật ngay sau mỗi hạng mục;
không chờ đến cuối toàn bộ dự án.

## 1. Mục tiêu hiện hành

Xây BioLearn V2 trong repository private mới: backend-first về nghiệp vụ,
mobile-first về sản phẩm, Expo bắt đầu từ foundation. Legacy được giữ nguyên làm
nguồn đối soát/maintenance; V2 có dữ liệu và deployment mới, không dùng chung
project legacy.
Map hành trình, thực hành, Mini Boss, 2D/3D, engagement, competition, teacher và
admin được xây lại trên domain contracts, workflow và quyền dữ liệu chuẩn.

## 2. Trạng thái tổng quan

| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| Quy tắc an toàn | DONE | Đã ghi trong `AGENTS.md` |
| Roadmap | DONE | Đã ghi trong `PROJECT_REBUILD_ROADMAP.md` |
| Blueprint BioLearn V2 | DONE | Kiến trúc mobile/backend/UI/workflow đã chốt ở mức kế hoạch |
| Security baseline/threat model | DONE | Đã khóa rate limit, secret, validation, audit và topology phân tải ở V2-A0 |
| Foundation ADR | DONE | ADR-0001..0005 đã khóa topology, toolchain/apps, bootstrap/session, Supabase và WebView |
| V2-A0 foundation gate | DONE | PASS kiến trúc có giới hạn; V2-A1.1 được mở trong repo mới, production/auth/content/nghiệp vụ thật vẫn cấm |
| V2-A1 pre-code readiness | DONE | Đã pin Node, khóa dependency baseline, implementation plan và local setup runbook |
| Tách repository V2 (`V2-R0`) | DONE | Repo private `Alexande610/biolearn-v2`, root history mới và protected `main`; CI required checks được theo dõi ở issue #1 |
| Sửa đặc tả Startup/Auth/Trạm ngày | DONE | Đã chốt logo, ADN+mầm cây, auth phân vai, tuyến ngày/3 sao, chống sao chép tàu mẫu và nền scene độc lập; wireframe còn TODO |
| Legacy security audit | PARTIAL | Đã audit tĩnh source/SQL/dependency; chưa audit live config hoặc pentest production |
| Legacy system inventory | DONE | Đã map route, bảng/RPC, Realtime, role, API thiếu implementation và dữ liệu migration |
| Ảnh tham chiếu Trạm ngày | DONE | Chỉ khóa bố cục tuyến/ngày/vị trí/ba sao; concept phải sáng tạo lại theo Sinh học và không đồng nhất với Map chương trình |
| Chuẩn học thuật | DONE | Có source hierarchy và cổng duyệt nội dung |
| Kiểm kê SGK | PARTIAL | Đã lập danh mục; chưa chọn PDF canonical cho mọi lớp |
| Ma trận chương trình | TODO | Chưa map lớp-chương-bài-yêu cầu cần đạt |
| Ma trận thực hành | TODO | Chưa kiểm định đầy đủ thực hành lớp 6-12 |
| Baseline kỹ thuật | PARTIAL | Đã xác định route/theme/progress; chưa có test report đầy đủ |
| Map V2 | TODO | Map hiện tại vẫn được sử dụng |
| Activity Engine | TODO | Practice hiện tại vẫn dùng dữ liệu dạng quiz |
| Mini Boss | TODO | Có Boss route, chưa có Mini Boss engine |
| Database migration | TODO | Chưa được thiết kế/chạy |
| Expo mobile | TODO | Bắt đầu ở V2-A1, không chờ sau web |
| Backend V2 | TODO | Chưa scaffold/migration; phải qua V2-A0 trước |

## 3. Bằng chứng hiện trạng

- Hệ legacy trên `democode`/`main` dùng React 19 + Vite và Supabase; các dòng
  dưới đây là inventory đối chiếu, không phải code có trong snapshot V2.
- Route Map: `/map/:classId`.
- Route gameplay: `/play/:classId/:chapterId/:lessonId`.
- Route Boss hiện có: `/boss/:classId/:chapterId/:lessonId`.
- Route 3D và mô phỏng: `/biology3d`, `/simulations`.
- Tiến trình hiện lưu chủ yếu ở `profiles.class_progress`.
- `MapPage.jsx` hiện hard-code `classData`, 10 level/bài và 2 practice/chương.
- Practice đi qua `GamePlayPage.jsx` và có thể rơi về multiple-choice.
- Có PDF/TXT Kết nối tri thức cho lớp 6-12 trong `documents/source`. TXT chứa lỗi
  OCR nên chỉ được dùng tìm kiếm, không dùng làm nguồn xuất bản.
- Có hai PDF KHTN 8 gần như trùng nhau; chưa được xóa hoặc chọn bản chuẩn.
- `scratch/seed_practice_data.cjs` xóa practice cũ trước khi insert và dữ liệu
  hiện có dấu hiệu lỗi encoding; không được chạy vào production.
- Theme legacy lưu ở `localStorage` và dùng `body.light-theme`; V2 không kế thừa
  cơ chế này mà dùng semantic token + adapter riêng cho mobile/web.
- Ảnh mẫu Trạm ngày đã được lưu tại
  `docs/assets/map-journey-visual-reference.png`; ảnh chỉ tham chiếu bố cục tuyến/
  ngày/ba sao, không phải mẫu tàu để sao chép, không phải Map chương trình và
  không còn phụ thuộc tệp clipboard.
- README ghi nhận build gần nhất pass; lint đang có nhiều lỗi tồn đọng.
- Audit 2026-08-12 xác nhận legacy có finding Critical về reward/RLS/mail/quiz/PvP
  và dependency; không được port SQL/component/config/lockfile legacy nguyên trạng.

## 4. Quyết định đã chốt

| ID | Quyết định | Lý do |
|---|---|---|
| D-001 | Mobile dùng React Native + Expo | Dễ phát triển, build và bảo trì đa nền tảng |
| D-002 | Hoàn thiện core/content trước mobile UI | Tránh viết lại cùng logic hai lần |
| D-003 | Giữ 3D web trong giai đoạn đầu | Stack 3D web không chuyển trực tiếp sang native |
| D-004 | Map V2 phải có feature flag | Cho phép pilot và quay lại Map cũ |
| D-005 | Practice có Activity Engine riêng | Thực hành không được giả lập bằng quiz thông thường |
| D-006 | UI mới bắt buộc sáng/tối | Đây là tiêu chí hoàn tất, không phải phần trang trí sau cùng |
| D-007 | Không hủy dữ liệu legacy | V2 dùng database/schema mới; legacy được giữ nguyên, migration tài khoản/tiến độ chỉ làm khi có dự án riêng |
| D-008 | Ảnh mẫu được lưu trong repo | Bảo toàn căn cứ thị giác giữa các phiên |
| D-009 | Chương trình hiện hành là nguồn cao nhất | SGK phải phục vụ đúng yêu cầu cần đạt |
| D-010 | TXT/OCR không phải nguồn chuẩn | Tránh đưa lỗi chuyển đổi vào bài học |
| D-011 | Content cần trang nguồn và trạng thái duyệt | Có thể truy vết và sửa lỗi an toàn |
| D-012 | Thực hành không được thay bằng quiz | Phải giữ mục tiêu, thao tác và evidence |
| D-013 | V2 xây song song, không đập legacy | Có đường đối soát, pilot và rollback |
| D-014 | Backend-first và Expo từ foundation | Chốt nghiệp vụ sớm nhưng kiểm chứng mobile ngay |
| D-015 | Modular monolith trên Supabase/Postgres | Tránh microservice sớm, vẫn có ranh giới domain |
| D-016 | Command quan trọng do server quyết định | Chống gian lận reward/progress/PvP/publish |
| D-017 | Teacher/Admin là web app riêng | Không làm mobile student app thành dashboard |
| D-018 | Liquid Glass chỉ ở lớp điều khiển | Đúng hierarchy iOS, tránh glass/vibecode đại trà |
| D-019 | 2D native, 3D dùng typed WebView bridge trước | Ra sản phẩm sớm và đo hiệu năng trước native 3D |
| D-020 | TypeScript strict + contracts + migration tests | Bảo trì dài hạn và giảm lỗi tích hợp |
| D-021 | Nhánh V2 có root commit độc lập | Snapshot V2 sạch; legacy còn nguyên trên `democode`/`main` để đối chiếu |
| D-022 | Bốn bất biến security là release gate | Rate limit, secret scan, strict input và audit phải đi cùng mọi hạng mục |
| D-023 | Auth tối đa 5 lần thất bại/15 phút | Chống brute force bằng nhiều khóa, CAPTCHA thích ứng và test chống bypass/lockout DoS |
| D-024 | Phân tải theo workload, không phân mảnh dữ liệu | Splash/CDN, auth, query, command, Realtime, worker scale riêng nhưng chung canonical Postgres/ledger |
| D-025 | Không port security model và dependency legacy | Audit phát hiện client-authoritative reward, RLS mở và advisory nghiêm trọng |
| D-026 | pnpm workspace + Node 24 LTS, chưa dùng build orchestrator | Build tái tạo được nhưng không thêm cache/config sớm |
| D-027 | Student web là Next.js app riêng | UI desktop/session riêng nhưng vẫn chung domain/contracts/backend với mobile |
| D-028 | Bootstrap/session là state machine fail-closed | Không có progress giả hoặc nháy route protected khi auth chưa rõ |
| D-029 | Data API opt-in; command có hậu quả qua handler server | RLS + authorization + idempotency + ledger/audit/outbox nhiều lớp |
| D-030 | WebView không giữ session hay cấp reward | Typed bridge chỉ gửi evidence; server quyết định kết quả canonical |
| D-031 | V2 chuyển sang repository private mới | Không dùng chung remote/default branch/deploy config với legacy và không merge V2 vào `biolearn-mp/main` |
| D-032 | V2 dựng dữ liệu từ empty migrations | Local/staging/production-v2 dùng project mới; mặc định không import hoặc xóa legacy |
| D-033 | Trạm ngày kế thừa bố cục tuyến theo ngày, hoàn hảo 3 sao | Tuyến/biểu tượng phải mang phong cách Sinh học nguyên bản; không sao chép tàu/đường ray mẫu và không dùng Map node chung để thay thế |
| D-034 | Background là scene layer độc lập | Có thể đổi nền tĩnh/động, light/galaxy dark mà không ảnh hưởng chức năng |

## 5. Việc tiếp theo

`NEXT: V2-A1.1 - Scaffold workspace/contracts/tokens/bootstrap tối thiểu trên
feature branch trong repository V2 mới; không tạo code mới trong repository legacy.`

Phạm vi lần tiếp theo:

1. Tạo feature branch `codex/v2-a1-foundation`; không commit trực tiếp lên `main`.
2. Thực hiện `V2-A1.1`: workspace, contracts, tokens, bootstrap tối thiểu và CI
   security theo issue #1; chưa mở auth thật hoặc kết nối hosted database.
3. Tạo ít nhất hai concept Sinh học rồi wireframe Splash/Auth/Trạm ngày light/dark;
   không dùng lại preview node cũ và không vẽ lại tàu/đường ray mẫu.
4. Chuẩn hóa Node `24.18.1` trước khi sinh lockfile hoặc cài dependency.
5. Không mở password auth trước `AUTH-RL-01`; không chạy migration/deploy hosted.

### Phiếu phạm vi đã chuẩn bị cho lượt code kế tiếp

```text
Roadmap ID: V2-A1.1
Mục tiêu duy nhất: scaffold foundation tối thiểu có CI/security gate trong repo V2 mới.
Domain: Repository foundation / Contracts / Tokens / Bootstrap / CI.
Được sửa/tạo: workspace config, apps shell được duyệt, packages contracts/tokens,
bootstrap tối thiểu, Supabase local skeleton và CI theo implementation plan.
Không chạm: code/database/deploy production legacy; runtime scaffold/auth thật;
content, reward/progress/PvP/teacher/admin.
Rủi ro: dependency/secret/config legacy đi theo; CI chưa required; Node sai version;
preview vô tình nối production.
Kiểm tra: Node 24.18.1, lockfile mới, secret scan current+history, lint/typecheck/test,
migration-from-empty local và không có connection/project ID legacy.
Quay lại: revert commit/PR V2-A1.1; repository/database legacy không đổi.
```

## 6. Mẫu cập nhật sau mỗi hạng mục

Sao chép khối sau xuống mục Nhật ký:

```md
### YYYY-MM-DD - P?.?

- Trạng thái: DONE | BLOCKED | PARTIAL
- Mục tiêu:
- Tệp đã thay đổi:
- Database/migration:
- Kiểm tra đã chạy:
- Kết quả light:
- Kết quả dark:
- Rủi ro còn lại:
- NEXT:
```

## 7. Nhật ký

### 2026-08-13 - Hoàn tất V2-R0.1 repository isolation

- Trạng thái: `DONE` cho repository boundary; `OPEN` cho CI required checks ở
  GitHub issue #1 do `Alexande610` sở hữu.
- Đã tạo repository private `Alexande610/biolearn-v2` và thư mục local V2 mới
  nằm ngoài cây legacy; default branch là `main` mới.
- Root commit `1e45cabf7efde40c23aa7b833b09686a8678fd6d` gồm đúng 33 file allowlist,
  không có parent/lịch sử legacy; manifest SHA-256 nguồn và đích đều là
  `f12661be2086122eb15cc66984ff1a9fc859315317dfcc234d5f05a108570a62`.
- Secret scan độ tin cậy cao trên snapshot nguồn, các path allowlist trong lịch sử
  nguồn, snapshot đích và root commit: 0 finding. `gitleaks`/`trufflehog` chưa có
  trên máy nên CI chuyên dụng vẫn là cổng bắt buộc ở issue #1.
- GitHub `main` buộc pull request, chặn force-push/xóa branch; vulnerability alerts
  và automated security fixes đã bật. Required checks sẽ được bật sau workflow CI
  đầu tiên; không tuyên bố secret scanning nâng cao nếu gói private chưa xác minh.
- Không copy `.git`, `.env*`, code, SQL/database, deploy config, logo legacy hoặc
  asset ngoài allowlist; không chạm database/deploy/remote của legacy.
- NEXT: `V2-A1.1` trên feature branch trong repository mới.

### 2026-08-12 - Hiệu chỉnh nguyên tắc không sao chép tàu mẫu

- Trạng thái: `DONE` ở mức đặc tả; chưa tạo wireframe/asset/code UI.
- Người sở hữu xác nhận ảnh Trạm ngày chỉ là căn cứ “na ná” về bố cục: tuyến uốn,
  các ngày, vị trí hiện tại, khóa và tối đa ba sao.
- Đã loại bỏ cách hiểu khóa hình tượng thành đầu máy/đường ray; tuyến và biểu
  tượng hành trình phải được sáng tạo lại rõ ràng theo Sinh học BioLearn.
- Visual gate yêu cầu ít nhất hai concept trước wireframe và có tiêu chí chống
  sao chép đầu máy, toa, ray, palette, tỷ lệ, asset và animation mẫu.
- Database/migration/code/deploy: không thay đổi.
- NEXT: vẫn là `V2-R0.1`; sau khi tách repo mới mới tạo concept/wireframe.

### 2026-08-12 - Khóa V2-R0 và sửa hướng Startup/Auth/Trạm ngày

- Trạng thái: `DONE` cho ADR/runbook/visual spec; `DOING` cho việc tạo remote mới.
- Đã đối chiếu read-only `main`: logo legacy blob
  `6f344779ac0990e5a5853f68e6ccb32769aea4d5`, `GalaxyBackground`, login có
  Học sinh/Giáo viên, Google cho học sinh và đăng ký. Không port code auth cũ.
- ADR-0006 chốt repository private mới, lịch sử `main` mới, export allowlist,
  branch protection và dữ liệu/deploy V2 không dùng chung legacy.
- Đã sửa lại product spec: Trạm ngày kế thừa tuyến/ngày/vị trí/ba sao từ ảnh,
  nhưng concept phương tiện/tuyến phải sáng tạo theo Sinh học; Map chương trình
  là hệ riêng.
- Splash chốt thanh ADN xoắn, mầm cây chạy phía trên và phần trăm bootstrap thật.
- Background chốt scene layer độc lập; light là sinh học ban ngày, dark là galaxy
  BioLearn; lỗi/thay nền không ảnh hưởng feature.
- Database/migration: không thay đổi, không chạy SQL, không chạm hosted/production.
- Rủi ro mở: chưa có owner/tên remote, chưa secret-scan bằng scanner chuyên dụng,
  chưa có wireframe/visual QA và `AUTH-RL-01` vẫn chặn password auth.
- NEXT: người sở hữu xác nhận remote rồi thực hiện `V2-R0.1`.

### 2026-08-12 - Đóng gate V2-A0 và chuẩn bị V2-A1.1

- Trạng thái: `DONE` cho pre-code architecture/readiness; runtime implementation
  vẫn `TODO`.
- Gate `PASS có giới hạn`: cho phép workspace, contracts, tokens, bootstrap,
  student web/mobile shell, Supabase local và CI; không cho production/auth thật/
  content/reward/progress/PvP/teacher/admin.
- Đã tạo `.node-version` = `24.18.1`, gate review, kế hoạch triển khai A1 và
  runbook local. Dependency baseline bám template Expo SDK 57 stable và Next 16.
- Endpoint đầu tiên được khóa là `GET /v1/bootstrap`: strict query allowlist,
  không body, 60 request/phút/IP + burst 10, 2 KiB query, 64 KiB response,
  timeout 1.5 giây, versioned cache và không user/secret.
- Preflight: Node PATH hiện `22.14.0` nên chưa được tạo lockfile; pnpm `10.28.1`
  có sẵn; Docker, Supabase CLI và scanner local chưa có.
- Database/migration: không thay đổi, không chạy SQL, không link/chạm production.
- Kiểm tra UI: có preview light/dark nhưng browser QA tích hợp bị lỗi quyền Windows
  `EPERM`; không tuyên bố viewport/device QA đã pass.
- Rủi ro mở: `AUTH-RL-01`, `SEC-LIVE-01`, `ENV-LOCAL-01`, `SEC-CI-01`,
  `UI-QA-01`, `CONTENT-01` trong gate review.
- NEXT: chuẩn hóa Node 24.18.1 rồi bắt đầu `V2-A1.1`.

### 2026-08-12 - V2-A0 Foundation ADR-0002 đến ADR-0005

- Trạng thái: `DONE` ở mức quyết định kiến trúc; chưa phải implementation.
- Đã khóa pnpm workspace, Node 24 LTS, Expo SDK 57, student web Next.js riêng và
  không thêm Turborepo/Nx trước khi CI metric chứng minh cần.
- Đã khóa bootstrap/session fail-closed cho mobile/web; password auth vẫn bị chặn
  release đến khi spike `AUTH-RL-01` chứng minh 5 thất bại/15 phút không bypass.
- Đã khóa Supabase Data API opt-in + RLS/grant, command handler idempotent và
  endpoint registry bắt buộc cho mọi trust boundary.
- Đã khóa WebView allowlist, typed protocol 32 KiB/message và 20 message/s làm
  baseline; WebView chỉ gửi evidence, không nhận session hoặc tự cấp reward.
- Đồng bộ `student-web` vào repository tree và blueprint; mobile/web vẫn dùng
  chung canonical data, leaderboard, classroom và PvP.
- Database/migration: không thay đổi, không chạy SQL, không chạm production.
- NEXT: SLO/capacity + gate review V2-A0 trước scaffold foundation V2-A1.

### 2026-08-12 - V2-A0 Legacy route/schema/role/flow inventory

- Trạng thái: `DONE` ở mức audit tĩnh của tip `main`; không phải snapshot live DB.
- Đã tạo `docs/LEGACY_SYSTEM_INVENTORY.md` với toàn bộ route React, actor/domain,
  Data API/RPC/storage, `/api/*`, Realtime topics, role flow và mapping migration.
- Phát hiện bổ sung: signup legacy copy `role` từ client metadata; React guard tin
  `user.role`; một số admin API truyền `x-admin-id`; năm `/api/*` được client gọi
  nhưng không có server implementation được track trong repo.
- Chốt không port: auth/role, reward/progress, RLS, Realtime authority, upload,
  admin command, AI proxy, local token và lockfile/config legacy.
- Chốt migration: `profiles` phải tách identity/membership/progress/ledger;
  balance thành opening ledger có batch ID; JSONB qua adapter; queue/presence/
  session và approved code dạng rõ không migration.
- Database/migration: chỉ đọc Git refs; không checkout legacy, không chạy SQL,
  không chạm production.
- NEXT: các ADR foundation còn lại, vertical slice và SLO/capacity gate V2-A0.

### 2026-08-12 - V2-A0 Security baseline, threat model và topology phân tải

- Trạng thái: `DONE` cho security architecture/audit tĩnh; `PARTIAL` cho audit
  toàn hệ thống vì chưa có quyền live config/production pentest.
- Mục tiêu: biến bốn yêu cầu rate limit, secret, input và security audit thành
  quy tắc bắt buộc; phản biện cách chia server mà không tách dữ liệu/ranking/PvP.
- Đã tạo `docs/SECURITY_BASELINE.md`,
  `docs/workflows/SECURITY_THREAT_MODEL.md`,
  `docs/adr/ADR-0001-RUNTIME-TOPOLOGY-AND-SCALING.md` và
  `docs/LEGACY_SECURITY_AUDIT_2026-08-12.md`.
- Đã nối security baseline vào `AGENTS.md`, `docs/AGENTS.md`, AI guardrails,
  blueprint, repository structure, roadmap, README và Definition of Done.
- Audit V2: snapshot chỉ có docs/assets, chưa có runtime endpoint/dependency/SQL;
  control chưa được xem là implemented cho đến khi V2-A1/A2 có test.
- Audit legacy chỉ đọc: client-authoritative reward/progress; `security definer`
  thiếu caller/evidence/idempotency; RLS/policy mở ở mail/quiz/PvP/storage; raw
  HTML/upload/AI/input limits yếu; `.env` từng tracked.
- `npm audit --omit=dev` trên lockfile legacy: 700 dependency, 1 critical, 8 high,
  2 moderate, 1 low; không cài/sửa package và đã xóa thư mục audit tạm.
- Database/migration: không thay đổi, không chạy SQL, không chạm production.
- Tải mục tiêu chưa có số chính thức; ADR yêu cầu đo p95/p99, DB connection/lock,
  Realtime connection/event, queue lag và cost trước khi mua replica/tách service.
- Rủi ro mở: credential/preset legacy phải được owner kiểm tra/rotate nếu còn
  hiệu lực; chưa audit live Supabase/Vercel/WAF; chưa chạy DAST/pentest.
- NEXT: hoàn tất inventory/ADR/vertical slice còn lại của V2-A0, sau duyệt mới
  scaffold V2-A1 với CI security gates và route registry.

### 2026-08-12 - Tạo nhánh nền trắng và đặc tả trải nghiệm học viên

- Roadmap ID: `V2-A0`.
- Nhánh làm việc: `biolearn-v2-foundation`, root commit độc lập với legacy.
- Phạm vi snapshot: chỉ tài liệu Markdown, ảnh căn cứ thiết kế và metadata nguồn;
  không mang code, config, SQL hoặc lịch sử file legacy vào nhánh V2.
- PDF/TXT SGK được giữ local ở `documents/source`, bị Git ignore; không xóa file
  và không đưa vào bundle/Git khi quyền phân phối chưa được xác nhận.
- Đã tạo `docs/workflows/STUDENT_EXPERIENCE_V2.md`: splash/auth/transition,
  Trạm Sinh học, Map + remediation câu sai, 2D/3D, mission/streak, ranking, PvP,
  quiz live, hồ sơ/tài liệu/thư và thứ tự phát triển mobile + student web.
- Đã catalog năm ảnh tham khảo tại `docs/assets/references`; chỉ học mô hình tương
  tác, không sao chép thương hiệu hoặc asset.
- Liquid Glass được khóa là material cho navigation/HUD/control, có fallback và
  accessibility; `liquid-glass-js` chưa được chọn làm dependency production.
- Database/migration: không thay đổi, không chạy SQL, không chạm production.
- NEXT: hoàn tất phần còn lại của `V2-A0`: ADR, inventory legacy, threat model và
  wireframe student light/dark; chưa scaffold `apps/*` hoặc `packages/*`.

### 2026-08-12 - Khóa cấu trúc repository và hợp đồng AI

- Nhánh làm việc lúc ghi tài liệu: `biolearn-v2-foundation`.
- Đã tạo `BIOLEARN_V2_REPOSITORY_STRUCTURE.md`: cây monorepo mục tiêu, ranh giới
  dependency, mapping toàn bộ nhóm chức năng legacy, quy tắc đặt file và
  topology triển khai Vercel/Expo.
- Đã tạo `AI_ENGINEERING_GUARDRAILS.md`: quy trình xác định phạm vi, quy tắc tạo
  file, giới hạn theo giai đoạn, hàng rào backend/content/UI/Git và mẫu bàn giao
  cho AI khác.
- Đã nối hai tài liệu vào `AGENTS.md`, `docs/AGENTS.md`, blueprint và README để
  trở thành chỉ dẫn bắt buộc.
- Quyết định deploy: branch V2 dùng Vercel Preview sau khi push; web teacher,
  admin, content studio và simulation tách Vercel Project theo Root Directory;
  mobile native phát hành bằng Expo EAS/TestFlight/App Store/Play Store.
- Chưa làm: chưa push nhánh, chưa liên kết Vercel, chưa scaffold monorepo, chưa
  sửa `vercel.json`, chưa chạy migration hoặc chạm production.
- Bước tiếp theo: tiếp tục V2-A0 bằng ADR và inventory/threat model theo blueprint.

### 2026-08-05 - Chốt blueprint BioLearn V2

- Trạng thái: DONE ở mức kiến trúc, chưa triển khai.
- Mục tiêu: Phản biện kế hoạch cũ và chuyển sang V2 mobile-first/backend-first.
- Tệp đã thay đổi: `AGENTS.md`, `docs/AGENTS.md`,
  `docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md`,
  `docs/PROJECT_REBUILD_ROADMAP.md`, `docs/IMPLEMENTATION_STATUS.md`, `README.md`.
- Database/migration: Không thay đổi, không chạy SQL.
- Kiểm tra đã chạy: đọc toàn bộ hồ sơ bắt buộc, audit cấu trúc code/SQL,
  đối chiếu tài liệu chính thức Expo/React Native/Supabase/Apple.
- Kết quả light: Có nguyên tắc và workflow thiết kế, chưa tạo UI.
- Kết quả dark: Có nguyên tắc và workflow thiết kế, chưa tạo UI.
- Rủi ro còn lại: Chưa có ADR/threat model/schema V2 chi tiết và vertical slice duyệt học thuật.
- NEXT: V2-A0.

### 2026-07-26 - Thêm hàng rào học thuật

- Trạng thái: PARTIAL
- Mục tiêu: Ngăn TXT/OCR lỗi trở thành nội dung và chuẩn hóa cách bám chương trình.
- Tệp đã thay đổi: `AGENTS.md`, `docs/AGENTS.md`,
  `docs/CURRICULUM_CONTENT_STANDARD.md`,
  `docs/CURRICULUM_SOURCE_INVENTORY.md`,
  `docs/PROJECT_REBUILD_ROADMAP.md`, `docs/IMPLEMENTATION_STATUS.md`, `README.md`.
- Database/migration: Không thay đổi.
- Kiểm tra đã chạy: Kiểm kê PDF/TXT, đọc metadata/page count, render bìa mẫu,
  đối chiếu nguồn Bộ GD&ĐT/NXBGD và `git diff --check`.
- Kết quả light: Không thay đổi UI.
- Kết quả dark: Không thay đổi UI.
- Rủi ro còn lại: Chưa kiểm tra cấu trúc đầy đủ từng PDF, chưa có reviewer Sinh học.
- NEXT: P0.1 + P0.2, sau đó C0.1 + C0.2.

### 2026-07-26 - Lưu ảnh tham chiếu Map

- Trạng thái: DONE
- Mục tiêu: Bảo toàn ảnh mẫu và chuyển nó thành đặc tả thị giác có thể thực hiện.
- Tệp đã thay đổi: `AGENTS.md`, `docs/AGENTS.md`,
  `docs/PROJECT_REBUILD_ROADMAP.md`, `docs/IMPLEMENTATION_STATUS.md`,
  `docs/MAP_VISUAL_REFERENCE.md`,
  `docs/assets/map-journey-visual-reference.png`, `README.md`.
- Database/migration: Không thay đổi.
- Kiểm tra đã chạy: SHA-256 ảnh, kiểm tra liên kết và `git diff --check`.
- Kết quả light: Đã mô tả tiêu chí visual cho light; chưa thay đổi UI.
- Kết quả dark: Đã mô tả cách chuyển cảnh và tiêu chí visual; chưa thay đổi UI.
- Rủi ro còn lại: Cần tạo wireframe BioLearn nguyên bản ở P1.1.
- NEXT: P0.1 + P0.2.

### 2026-07-26 - Khởi tạo kế hoạch

- Trạng thái: DONE
- Mục tiêu: Tạo roadmap, quy tắc an toàn và điểm khôi phục ngữ cảnh.
- Tệp đã thay đổi: `AGENTS.md`, `docs/PROJECT_REBUILD_ROADMAP.md`,
  `docs/IMPLEMENTATION_STATUS.md`, `README.md`.
- Database/migration: Không thay đổi.
- Kiểm tra đã chạy: Đọc cấu trúc route, theme, Map và gameplay hiện tại.
- Kết quả light: Chưa thay đổi UI.
- Kết quả dark: Chưa thay đổi UI.
- Rủi ro còn lại: Chưa có baseline test tự động và chưa kiểm tra trực quan.
- NEXT: P0.1 + P0.2.
