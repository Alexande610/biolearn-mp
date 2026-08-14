# BioLearn - Báo cáo audit bảo mật nền tảng và legacy

- **Ngày audit:** 2026-08-12
- **Roadmap:** `V2-A0`
- **Phạm vi ghi:** snapshot V2 hiện tại
- **Phạm vi chỉ đọc:** tip của nhánh legacy `main` và `democode`, lịch sử file
  nhạy cảm và production dependency graph trong `package-lock.json`
- **Không thực hiện:** checkout/sửa legacy, gọi production, chạy SQL, đọc dữ liệu
  người dùng, pentest endpoint thật hoặc kiểm tra cấu hình dashboard Supabase/Vercel

## 1. Kết luận điều hành

Snapshot V2 hiện chỉ có tài liệu/ảnh căn cứ và **chưa có runtime endpoint, package
hay migration**. Vì vậy chưa có code V2 để tuyên bố đã triển khai rate limit,
validation hoặc RLS; các control đã được khóa thành release gate trong
`SECURITY_BASELINE.md` và threat model.

Code legacy **không an toàn để port hoặc tái triển khai nguyên trạng**. Audit tĩnh
phát hiện đường cấp reward do client điều khiển, `security definer` nhận tùy ý
user/giá trị thưởng, RLS/policy mở ở mail/quiz/PvP/storage, thiếu rate limit và
validation có hệ thống, raw HTML sink, upload thiếu kiểm soát và dependency có
lỗ hổng nghiêm trọng. Đây là lý do V2 giữ legacy chỉ làm nguồn đối soát.

Nếu legacy vẫn đang public, cần một hạng mục maintenance khẩn cấp, có backup và
quyền production riêng. Báo cáo này không tự ý vá live database.

## 2. Phương pháp và bằng chứng

- Kiểm tra Git status/file tracked của V2; không có `apps/`, `packages/`,
  `supabase/`, `package.json` hay endpoint runtime trong snapshot.
- `git grep` trên `main`/`democode` cho auth, RPC reward/mission, RLS/policy,
  raw HTML, upload, input/query và AI proxy.
- Kiểm tra `.env` tracked và lịch sử commit mà không in giá trị; chỉ ghi tên biến,
  phân loại public/server và độ dài.
- Regex scan tên file/lớp credential và một số signature phổ biến ở ref hiện tại.
  `gitleaks`, `trufflehog`, `semgrep` không có trong môi trường, do đó full-history
  provider scan vẫn là gate mở và phải chạy trong CI/Git host.
- Quét thêm file text local ngoài Git để chuẩn bị `V2-R0`; mọi kết quả chỉ ghi
  loại/path/dòng, không in giá trị credential.
- Chạy `npm audit --omit=dev` trực tiếp từ `package-lock.json` của `democode` trong
  thư mục tạm, sau đó xóa thư mục tạm đã xác minh. Không cài, không sửa lockfile.

## 3. Finding còn mở

### Critical

#### LSA-001 - Client có thể thao túng reward/progress/score

- **Bằng chứng:** `src/pages/GamePlayPage.jsx:1097`,
  `src/pages/BattlePvPPage.jsx:286`, `src/pages/MissionPage.jsx:76` gọi RPC từ
  client với user ID và/hoặc giá trị tiến trình/thưởng.
- `supabase_unified_migration.sql:371-502` khai báo `security definer`
  `update_mission_progress`, `reward_user`, `reward_pvp`; các hàm nhận target user,
  XP/coin/rank từ caller nhưng không kiểm tra `auth.uid()`, quyền, biên giá trị,
  completion/match evidence hoặc idempotency trong thân hàm được audit.
- **Tác động:** tự cộng tài sản/điểm, sửa người khác, farm/replay reward, phá
  leaderboard và PvP.
- **Xử lý:** không port. V2 chỉ nhận intent/evidence; backend suy ra user/reward,
  dùng ledger + unique idempotency + transaction. Legacy live cần thu hồi quyền
  execute công khai và thay bằng server-authoritative RPC sau khi có backup/test.

#### LSA-002 - Mail/quà riêng bị public read/write

- **Bằng chứng:** `supabase_unified_migration.sql:541-561` tắt RLS cho
  `user_mails`, đồng thời tạo policy public read và all access.
- **Tác động:** lộ thư học sinh, giả/sửa/xóa quà và trạng thái claim.
- **Xử lý:** bật/force RLS, receiver chỉ đọc/cập nhật trạng thái hợp lệ của mình;
  gửi/đính quà/claim qua command audit được, không update trực tiếp.

#### LSA-003 - Quiz/PvP không có ranh giới quyền và server authority

- **Bằng chứng:** `supabase_unified_migration.sql:182-203` cho mọi người đọc/sửa
  quiz room, mọi authenticated user thao tác toàn bộ queue và insert match;
  client legacy điều phối room/match/score qua Supabase/Realtime.
- **Tác động:** chiếm room, sửa queue của người khác, giả match/answer/score, lộ
  đáp án hoặc gây DoS lớp học.
- **Xử lý:** room/match state machine server-side, private channel/capability,
  policy theo host/member/class, sequence/deadline/replay checks và per-room limit.

#### LSA-004 - Production dependency graph có advisory Critical/High

- **Bằng chứng ngày audit:** 700 dependency được npm audit ghi nhận; `1 critical`,
  `8 high`, `2 moderate`, `1 low`. Critical: `websocket-driver`; High gồm
  `@grpc/grpc-js`, direct `axios`, `form-data`, `immutable`, `protobufjs`,
  `react-router`, direct `react-router-dom`, `ws`. npm báo có fix cho các finding.
- **Tác động:** gồm resource-limit bypass/DoS, injection/prototype pollution,
  credential/request manipulation và vấn đề router tùy đường chạy.
- **Xử lý:** không mang lockfile legacy sang V2. Nếu legacy còn public, nâng theo
  PR nhỏ với test/build thay vì `npm audit fix --force`; audit lại sau mỗi thay đổi.

### High

#### LSA-005 - Thiếu rate limit và giới hạn tài nguyên cấp ứng dụng

- **Bằng chứng:** không thấy rate-limit middleware/store/route registry, CAPTCHA,
  body/query/concurrency limit có hệ thống trong source legacy; auth gọi trực tiếp
  `signInWithPassword`/`signUp` ở client.
- **Tác động:** brute force/credential stuffing, spam signup/recovery, DoS và tăng
  chi phí API/AI/storage.
- **Xử lý:** baseline 5 failed/15 phút nhiều khóa, Supabase provider limits,
  CAPTCHA thích ứng, limit mọi route/payload/query/file/cost và abuse/load tests.

#### LSA-006 - `.env` có giá trị thật đã được Git theo dõi

- **Bằng chứng:** `.env` là blob tracked trên `democode`, có lịch sử tại commit
  `a74f36b`, `583ce43`, `00b454e`. Tên biến: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`,
  `VITE_CLOUDINARY_UPLOAD_PRESET`; không in giá trị trong audit.
- **Nhận định:** `VITE_*` luôn được đưa vào frontend. URL và Supabase anon/
  publishable key không phải secret, nhưng **không phải authorization**; mức nguy
  hiểm tăng mạnh khi RLS legacy đang mở. Upload preset có thể bị abuse nếu cho
  unsigned upload rộng.
- **Xử lý:** untrack `.env`, giữ `.env.example` giả; harden RLS; kiểm tra và
  disable/restrict/recreate Cloudinary preset; full-history secret scan; revoke/
  rotate ngay nếu scanner phát hiện credential bí mật thực sự.

#### LSA-007 - Storage avatar không ràng buộc ownership và upload thiếu kiểm tra

- **Bằng chứng:** `supabase_unified_migration.sql:221-239` cho mọi authenticated
  user insert/update/delete object trong bucket `avatars` mà không kiểm tra prefix
  owner. `ProfilePage.jsx:115-122,291` upload `image/*` không thấy size/magic/
  quarantine scan.
- **Tác động:** overwrite/delete avatar người khác, file giả/độc hại, storage/CPU
  exhaustion.
- **Xử lý:** path bắt đầu bằng `auth.uid()`, server-generated filename, extension+
  MIME+magic+size allowlist, image re-encode/quarantine và per-user quota.

#### LSA-008 - Raw HTML có thể dẫn tới stored XSS

- **Bằng chứng:** `MorePage.jsx:1604` render `slidesHtml[...]` bằng
  `dangerouslySetInnerHTML` mà không thấy sanitizer allowlist trong source.
- **Tác động:** script/HTML độc hại đánh cắp session hoặc hành động thay người dùng
  nếu nội dung/import bị kiểm soát.
- **Xử lý:** ưu tiên structured slide schema; nếu cần HTML, sanitize server-side
  và client-side theo allowlist, CSP chặt, URL/protocol allowlist và security tests.

#### LSA-009 - AI proxy không có backend production/control chống abuse rõ ràng

- **Bằng chứng:** `ChatboxAI.jsx:261` gọi `/api/ai`; `vite.config.js` chỉ proxy dev
  sang provider ngoài, còn `vercel.json` chỉ rewrite SPA. Không thấy auth/quota/
  validation/privacy/cost control production.
- **Tác động:** endpoint hỏng hoặc bị abuse, gửi dữ liệu học sinh ra ngoài, cost/
  availability không kiểm soát.
- **Xử lý:** không port trước ADR riêng; server proxy có auth, redaction, quota,
  schema/size/token limit, timeout/circuit breaker và privacy review.

#### LSA-010 - Profile và bảng nội dung có policy quá rộng

- **Bằng chứng:** `profiles_select_all` dùng `using (true)`; `study_videos` tắt
  RLS và tạo `for all using (true)` tại `supabase_unified_migration.sql:165-186,
  522-539`.
- **Tác động:** lộ dữ liệu hồ sơ và sửa/xóa nội dung bởi caller không có quyền.
- **Xử lý:** public projection chỉ chứa field được duyệt; owner/class/role policies
  riêng; content write chỉ teacher/admin qua publish workflow.

### Medium

#### LSA-011 - Ghép input vào PostgREST filter string

- **Bằng chứng:** `AdminUsersPage.jsx:146` ghép `usersSearchTerm` vào `.or(...)`
  mà không thấy length/grammar escaping.
- **Tác động:** sửa semantics filter, query đắt hoặc lỗi parser/DoS; phạm vi phụ
  thuộc PostgREST client encoding.
- **Xử lý:** strict search contract/length, typed allowlisted filters và server
  query endpoint có pagination/cost limit.

#### LSA-012 - Import tài liệu xử lý sai loại và không giới hạn kích thước

- **Bằng chứng:** `TeacherPage.jsx:382` nhận `.txt,.pdf,.doc,.docx`, nhưng
  `TeacherPage.jsx:125` dùng `FileReader.readAsText`; không thấy max-size/parser
  sandbox.
- **Tác động:** treo browser, nội dung rác/encoding sai và đường mở cho parser
  nguy hiểm khi mở rộng sau này.
- **Xử lý:** server upload pipeline riêng; allowlist/size/magic/quarantine/parser
  theo loại, job async và trạng thái review.

#### LSA-013 - Thiếu security headers/CSP trong cấu hình web được audit

- **Bằng chứng:** `vercel.json` chỉ có SPA rewrite, không thấy CSP, frame policy,
  referrer/permissions policy hoặc asset origin allowlist.
- **Tác động:** làm tăng blast radius XSS/clickjacking/data exfiltration.
- **Xử lý:** header theo từng web app, nonce/hash CSP và test CSP; simulation
  WebView dùng origin/bridge allowlist riêng.

#### LSA-014 - Thư mục local bị ignore chứa Firebase client API key/config

- **Bằng chứng:** `temp_brain/brain-atlas/firebase-analytics.js:14` chứa một
  chuỗi Google/Firebase API key gắn nhãn `apiKey`. File **không tracked** và đang
  bị ignore bởi rule `temp_brain/`; giá trị không được in trong báo cáo.
- Hai cảnh báo `AKIA` trong Draco decoder cùng thư mục đã được kiểm tra lại bằng
  regex phân biệt hoa/thường và là false positive từ mã nén, không khớp định
  dạng AWS access key viết hoa.
- **Tác động:** Firebase client key thường là định danh public chứ không phải bí
  mật, nhưng nếu project/API restriction sai có thể bị lạm dụng quota hoặc làm
  lộ liên kết tới project bên thứ ba. Chuyển nguyên thư mục sẽ vi phạm allowlist
  V2 và có thể mang theo config/asset chưa kiểm kê.
- **Xử lý:** không export `temp_brain`; owner kiểm tra project/key restriction và
  thu hồi nếu không còn dùng. Nếu V2 thật sự cần Firebase, khai báo dưới public
  environment config có domain/app restriction, quota và API allowlist; không
  hiểu nhầm việc đưa vào env sẽ làm client key thành bí mật.

## 4. Điểm không được kết luận quá mức

- Regex scan phân biệt hoa/thường không tìm thấy signature private key/GitHub/
  OpenAI/Supabase secret key phổ biến ở snapshot export hiện tại, nhưng đây
  **không phải** bằng chứng lịch sử sạch; LSA-014 vẫn phải xử lý cho local ignored
  files.
- Không xác minh credential trong `.env` còn hiệu lực hay Cloudinary preset có
  bật unsigned upload; owner phải kiểm tra dashboard mà không chia sẻ giá trị.
- Không kiểm tra live grants, RLS đang deploy, Auth settings, backups, logs, WAF,
  DNS/TLS, storage object thật hoặc dữ liệu người dùng.
- Không chạy DAST/pentest/mobile binary review. Các bước này còn mở trước V2-A8.

## 5. Thứ tự xử lý an toàn

1. Nếu legacy còn public: hạn chế/tắt các RPC và policy Critical sau backup/test;
   bật abuse protection auth; kiểm tra/thu hồi credential/preset có nguy cơ.
2. Hoàn tất V2-R0: không export `.git`, `temp_brain`, SQL/component/config/
   lockfile legacy; scan lại cả source và thư mục đích trước commit đầu.
3. V2-A1 trong repository mới dựng CI secret/dependency scan, contract validation, route limit registry
   và môi trường local/staging trước UI chức năng.
4. V2-A2 chứng minh auth 5/15, RLS matrix, reward ledger/idempotency và payload
   limit bằng integration/abuse tests.
5. Trước production: audit live config + DAST/pentest độc lập, load/chaos test,
   backup/restore rehearsal và sign-off toàn bộ finding còn mở.
