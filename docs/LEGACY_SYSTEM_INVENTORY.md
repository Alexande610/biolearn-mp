# BioLearn - Inventory hệ thống legacy để xây V2

- **Roadmap:** `V2-A0`, đối ứng `P0.1`
- **Ngày kiểm kê:** 2026-08-12
- **Nguồn chỉ đọc:** tip nhánh `main`; đối chiếu `democode` khi audit security
- **Mục đích:** giữ hiểu biết nghiệp vụ và dữ liệu cần migration; không coi source,
  SQL, API hoặc security model legacy là code mẫu

## 1. Kết luận

Legacy là một React/Vite SPA gọi Supabase trực tiếp từ page/component. Auth,
progress, economy, mission, quiz, matchmaking, PvP, teacher và admin bị trộn trong
client; một số `/api/*` được gọi nhưng không có implementation server được track
trong repository. Vì vậy V2 phải giữ **hành vi có giá trị**, viết lại contract và
quyền dữ liệu; tuyệt đối không port nguyên page, SQL hay lockfile.

Nguồn dữ liệu legacy tập trung quá nhiều vào `profiles`, đặc biệt
`class_progress`, `daily_missions`, inventory và nhiều balance/counter. V2 sẽ
chuẩn hóa attempt/progress/ledger/membership; JSONB cũ chỉ được đọc qua migration
adapter có report chênh lệch.

## 2. Route và quyết định chuyển đổi

| Route legacy | Actor | Nghiệp vụ cần giữ | Đích V2 | Quyết định |
|---|---|---|---|---|
| `/` | Public | Giới thiệu sản phẩm | Student web/public landing | Viết lại; static/CDN, không mang auth logic vào landing |
| `/login`, `/register` | Public | Email/password, OAuth, chọn luồng student/teacher | Identity | Viết lại; splash/bootstrap riêng, auth 5 failed/15 phút, CAPTCHA; client không tự chọn role tin cậy |
| `/home` | Student | Resume, stats, mission, mail | Student Home/Station | Tách query model; mail claim và economy qua command |
| `/class-select` | Student | Chọn lớp 6-12 | Journey bootstrap | Giữ ý nghĩa; enrollment/content entitlement do backend xác định |
| `/map/:classId` | Student | Hành trình, unlock, energy | Journey | Viết mới theo content/progress contract; không hard-code `classData` |
| `/play/:classId/:chapterId/:lessonId` | Student | Lesson/activity/practice/skip challenge | Activity | Renderer theo activity version; attempt/evidence server-authoritative |
| `/minigame/:classId` | Student | Minigame và energy | Activity game | Chỉ giữ game có learning objective/rubric; reward qua ledger |
| `/boss/:classId/:chapterId/:lessonId` | Student | Boss encounter | Activity encounter | Viết state machine; không tự cộng reward/progress ở client |
| `/leaderboard` | Student | Xếp hạng tuần/PvP và vào matchmaking | Competition | Snapshot/version từ cùng ledger; matchmaking tách khỏi UI leaderboard |
| `/missions` | Student | Daily/weekly mission, claim | Engagement | Server time, idempotent claim, mission definition versioned |
| `/profile` | Student | Hồ sơ, avatar/inventory | Identity + Economy | Public profile projection tối thiểu; avatar owner-bound; purchase command |
| `/more` | Student | Tài liệu, video, nội dung học | Media/Curriculum | Published content read model; HTML/import qua pipeline an toàn |
| `/battle` | Student | PvE quiz battle | Activity encounter | Không port reward calculation/client writes |
| `/battle-pvp` | Student | PvP realtime | Competition | Match server/coordinator là trọng tài; private typed events |
| `/quiz-room` | Student | Join/answer live quiz | Quiz Live | Capability + membership, answer sequence/deadline, no answer leakage |
| `/simulations` | Student | Catalog/mở simulation | Activity/Media | 2D native ưu tiên; progress qua typed command |
| `/biology3d` | Student | Viewer/game 3D | Simulation Web | WebView bridge versioned, origin/schema/size allowlist |
| `/teacher` | Teacher | Tạo/điều khiển quiz room, import | Teacher Web/Classroom | App riêng; role từ membership đã duyệt, import server-side |
| `/admin` | Admin | Teacher request, online user, ops | Admin Web | App riêng; MFA/step-up/audit; không tin header ID từ client |
| `/admin/users` | Admin | User detail, lock/edit, mail/gift | Admin Web/Operations | Command riêng theo capability; không update profile/balance trực tiếp |
| `/admin/logs` | Admin | Audit log | Operations | Append-only, redacted, server-originated |
| `/admin/reports` | Admin | Báo cáo usage/role/progress | Analytics projection | Read model tối thiểu; không tải toàn bộ profile vào client |
| `/admin/lessons` | Admin | Override bài/video | Content Studio | Draft-review-approve-publish; immutable version |

Route guard trong legacy chỉ cải thiện UX; V2 authorization luôn được kiểm tra ở
gateway/command/RLS. Mobile và các web app dùng route riêng nhưng chung contract.

## 3. Client data access và API bề mặt

### 3.1. Supabase Data API/RPC được gọi từ client

| Resource | Caller legacy | Dùng cho | V2 disposition |
|---|---|---|---|
| `profiles` | Hầu hết student/admin pages và app bootstrap | role, profile, progress, balance, streak, stats, lock | Tách `profile`, membership, progress, ledger/projection; query chỉ select field cần |
| `lesson_questions` | Gameplay | Nội dung bài/game/boss | Thay bằng published curriculum/activity version read model |
| `questions` | PvE/PvP | Question/options/correct answer | Không đưa đáp án trước phase; question delivery contract riêng |
| `quiz_rooms` | Teacher/student/admin | Room state/questions/participants | Chuẩn hóa room/session/participant/answer; command + private Realtime |
| `pvp_queues` | Leaderboard/PvP | Queue/match room/opponent | Matchmaking command/coordinator; client không sửa đối thủ |
| `pvp_matches` | PvP/admin | Kết quả/score | Canonical match state/result, append/audit, server commit |
| `teacher_requests` | Login/admin | Xin/duyệt teacher | Invitation/membership approval workflow; one-time token hash, expiry |
| `system_logs` | Admin | Audit/usage | Append-only audit events; không cho client tự ghi event tin cậy |
| `study_videos` | More/Admin lesson | Video metadata | Published media manifest; write qua Content Studio |
| `user_mails` | Home/Admin | Thư, quà, claim | Owner-bound inbox + idempotent gift claim transaction |
| Storage `avatars` | Profile | Upload/avatar URL | Owner prefix, quarantine/re-encode, size/magic/type limits |
| `reward_user` | Gameplay/PvP | Cộng XP/coin/score | Loại contract cũ; `completeActivity`/`settleMatch` suy ra reward server-side |
| `update_mission_progress` | Mission | Cập nhật progress | Loại caller-supplied progress; project từ domain event hợp lệ |
| `check_and_reset_missions` | App bootstrap/refresh | Reset mission/streak | Worker/query theo server time; bootstrap không tạo side effect tùy tiện |

### 3.2. `/api/*` được gọi nhưng không có server source được track

| Path | Dự kiến legacy | Trạng thái | V2 disposition |
|---|---|---|---|
| `/api/ai` | Proxy AI | Chỉ thấy Vite dev proxy; không có production handler trong Git | Hoãn sau vertical slice; ADR/privacy/quota riêng |
| `/api/admin/reject-teacher-request` | Admin reject | Không thấy implementation track | Command admin có JWT/MFA/capability; bỏ `x-admin-id` |
| `/api/lessons/study-content-overrides` | Đọc override | Không thấy implementation track | Published content query/version |
| `/api/admin/study-content-overrides` | Ghi override | Không thấy implementation track | Content workflow command/audit |
| `/api/users/simulation-progress` | Lưu tiến trình mô phỏng | Không thấy implementation track | Typed attempt/progress command |

Không được giả định các route này tồn tại hoặc an toàn trong production chỉ vì
client gọi được đường dẫn.

## 4. Realtime inventory

| Topic legacy | Event chính | Vấn đề | V2 contract |
|---|---|---|---|
| `matchmake-class-{class}` | `match-ready`, presence | Client tự tìm đối thủ và update cả hai queue row | `matchmaking.request/cancel/matched`; coordinator quyết định |
| `battle:{roomId}` | start/question/answered/result/game-over/surrender | Client có thể làm host/trọng tài và broadcast payload | Private match channel; server events có sequence/version; client chỉ gửi intent |
| `room:{roomCode}` | student_join/answer, quiz_started/question/result/ended | Teacher/student payload chưa có server validation/state machine | Private quiz channel; membership/capability, phase, deadline, dedupe |

V2 không dùng Realtime presence/broadcast làm source of truth. Tất cả reconnect
phải fetch canonical snapshot rồi resume từ sequence gần nhất.

## 5. Schema legacy và ánh xạ migration

### 5.1. Bảng tracked trong unified SQL

| Legacy | Dữ liệu đáng giữ | Đích canonical dự kiến | Cách migration |
|---|---|---|---|
| `profiles` | identity link, display/avatar, role hiện có, balances, streak, progress JSONB, lock | `profiles`, `memberships/role_grants`, `progress`, `reward_ledger` + projections, moderation | Export snapshot; validate FK/range; role cần re-verify; balance thành opening ledger entry; JSONB qua adapter |
| `lesson_questions` | content có thể tái biên tập | curriculum/activity version | Không copy thẳng; kiểm định nguồn/trang/YCCĐ/reviewer rồi import draft |
| `questions` | question text/options/explanation | question version/bank | Không copy thẳng đáp án ra published read; academic review bắt buộc |
| `quiz_rooms` | lịch sử room tối thiểu nếu cần | quiz session/participant/answer/result | Không mang JSON participant/question nguyên dạng; archive/report hoặc transform có version |
| `pvp_queues` | Không cần lưu dài hạn | Không migration | Ephemeral; bỏ khi cutover |
| `pvp_matches` | player/result/time nếu đối soát được | match/result/audit | Chỉ import record hợp lệ; legacy score không tự tạo reward ledger mới |
| `teacher_requests` | request/status/email/timestamps | invitation/membership approval audit | Không migrate approved code dạng rõ; tạo token mới hoặc đóng request |
| `system_logs` | audit lịch sử hợp lệ | cold archive/new audit schema | Redact PII/secrets; không coi client-origin log là bằng chứng tuyệt đối |
| `study_videos` | URL/title/class mapping | media asset/manifest/version | Verify ownership/license/URL; publish workflow |
| `user_mails` | inbox/read/claim nếu có owner | inbox/message/gift claim | RLS-safe export; reconcile claimed gift với ledger trước import |
| Storage `avatars` | avatar hiện dùng | owner-bound object + metadata | Scan/re-encode/hash; đổi path; reject unknown owner/type |

### 5.2. Trường `profiles` cần xử lý đặc biệt

- `role`: không tin metadata client. Mọi teacher/admin phải xác minh lại thành
  grant/membership server-managed; default migration là student nếu không có bằng chứng.
- `xp`, `coins`, `total_score`, `weekly_score`, `pvp_score`: không copy thành field
  client-writable. Tạo opening ledger/projection có migration batch ID và tổng đối soát.
- `stamina` và `energy` đang trùng ý nghĩa; chốt một resource policy, timezone/
  regeneration server-side rồi map rõ giá trị ưu tiên.
- `daily_missions`, `inventory`, `achievements`, `class_progress`,
  `unlocked_chapters`: parse schema version cũ, quarantine record sai và sinh
  bảng chuẩn; không giữ JSONB làm nguồn sự thật mới.
- `login_streak`, `highest_streak`, timestamps: kiểm tra timezone/server-time;
  không nhận localStorage highest streak làm bằng chứng.
- `is_locked`, lý do/thời điểm: chuyển thành moderation action có actor/audit;
  không để profile update thông thường thay đổi.

## 6. Role và trust flow legacy

### Hiện trạng

1. Signup gửi `role` trong `user_metadata`; trigger `handle_new_user` copy metadata
   đó vào `profiles.role`.
2. Login đọc `profiles.role`, merge vào object user và route guard phía React.
3. Teacher/Admin page vừa kiểm tra `user.role` ở client vừa gọi trực tiếp Data API
   hoặc `/api/*`; một số API truyền `x-admin-id` do client cung cấp.

### V2 bắt buộc

1. Signup public luôn tạo identity/student profile tối thiểu; không cấp teacher/admin.
2. Teacher access đến từ invitation/request đã duyệt + membership/role grant do
   command server tạo. Admin chỉ do operator có thẩm quyền cấp, có MFA/step-up.
3. JWT có claim tối thiểu phục vụ routing, nhưng authorization cuối đọc canonical
   membership/grant hoặc claim có version/expiry và RLS kiểm tra tenant/class.
4. Role change revoke/refresh session phù hợp và tạo audit event. Client ID/header
   không thay thế JWT/session.

## 7. Local/session storage legacy

- Theme, âm lượng và trạng thái UI/chat có thể giữ dưới dạng preference local,
  nhưng phải có version/size limit và không chứa PII nhạy cảm.
- `token` trong `localStorage`, mission start time, chat transcript và highest
  streak không được port như nguồn tin cậy.
- Mobile V2 dùng session storage phù hợp nền tảng; web tuân theo auth SDK/SSR
  strategy đã ADR chốt. AsyncStorage/localStorage chỉ là cache, không cấp reward.

## 8. Bất biến migration và tiêu chí hoàn tất

- Không đọc/ghi production trong V2-A0/A1. Migration tool sau này có
  `--dry-run`, environment allowlist, batch ID, checksum, report input/output/
  reject và idempotency.
- Mỗi user có reconciliation: identity, role evidence, opening balances,
  completed activity mapping, inbox claim và moderation state.
- Không migrate ephemeral queue/presence/session; không mang approved code,
  plaintext credential, raw HTML chưa scan hoặc content chưa duyệt.
- Tổng opening ledger theo currency phải khớp export hợp lệ; record lỗi bị
  quarantine, không tự sửa im lặng.
- Cutover chỉ sau backup, restore rehearsal, pilot, dual-read hữu hạn và rollback.

## 9. Kết quả phân loại

- **Giữ làm yêu cầu nghiệp vụ:** hành trình, attempt/progress, economy, mission,
  inbox, leaderboard, quiz, PvP, teacher/admin/content và simulation.
- **Viết lại hoàn toàn contract/security:** auth/role, reward, progress, RLS,
  upload, Realtime, admin command, AI proxy và migration.
- **Không migration:** queue/presence/session, token local, code phê duyệt dạng rõ,
  client log không đáng tin và config/dependency legacy.

