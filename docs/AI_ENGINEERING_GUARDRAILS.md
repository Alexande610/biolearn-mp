# BioLearn V2 - Hợp đồng thực thi bắt buộc cho AI

- **Đối tượng:** mọi AI coding agent, công cụ vibecode và người đóng góp code
- **Mức độ:** bắt buộc, không phải gợi ý
- **Cập nhật:** 2026-08-12

Mục tiêu của tài liệu này là ngăn AI tạo code “có vẻ chạy” nhưng sai nghiệp vụ,
đặt file sai chỗ, nhân đôi source of truth, phá dữ liệu hoặc làm UI lệch định
hướng BioLearn. AI không được dùng tốc độ sinh code để bỏ qua gate kiến trúc.

## 1. Thứ tự tài liệu bắt buộc

Trước khi sửa bất kỳ file nào, AI phải đọc theo thứ tự:

1. `AGENTS.md` và `docs/AGENTS.md`.
2. `docs/IMPLEMENTATION_STATUS.md` để biết giai đoạn và việc đang làm.
3. `docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md` cho quyết định kiến trúc.
4. `docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md` cho vị trí code/deploy.
5. `docs/SECURITY_BASELINE.md` cho mọi nhiệm vụ.
6. `docs/PROJECT_REBUILD_ROADMAP.md` cho hạng mục và tiêu chí nghiệm thu.
7. Tài liệu chuyên biệt theo nhiệm vụ:
   - Security/runtime: `docs/workflows/SECURITY_THREAT_MODEL.md` và ADR liên quan.
   - Nội dung: `CURRICULUM_CONTENT_STANDARD.md` và
     `CURRICULUM_SOURCE_INVENTORY.md`.
   - Map/asset: mở ảnh `docs/assets/map-journey-visual-reference.png` và đọc
     `MAP_VISUAL_REFERENCE.md`.
   - Học viên: `docs/workflows/STUDENT_EXPERIENCE_V2.md`.
   - Một ADR/workflow/runbook liên quan nếu đã tồn tại.

Nếu có mâu thuẫn, blueprint V2 ưu tiên roadmap cũ; quy tắc an toàn và chỉ dẫn
mới nhất của người dùng luôn phải được tôn trọng. AI phải ghi mâu thuẫn vào báo
cáo hoặc ADR, không tự chọn giải pháp làm thay đổi kiến trúc trong im lặng.

## 2. Phiếu phạm vi trước khi code

Trước khi chỉnh sửa, AI phải xác định được các mục sau trong phần cập nhật công
việc hoặc `IMPLEMENTATION_STATUS.md`:

```text
Roadmap ID:
Mục tiêu duy nhất:
Domain sở hữu:
Đường dẫn được phép sửa/tạo:
Đường dẫn không được chạm:
Contract/schema bị ảnh hưởng:
Rủi ro dữ liệu/bảo mật:
Kiểm tra sẽ chạy:
Điều kiện quay lại:
```

Không xác định được domain hoặc đường dẫn đích thì AI chỉ được đọc và đề xuất;
không được “tạm đặt” file ở root hoặc `src/utils`.

## 3. Quy tắc tạo file

AI chỉ được tạo file mới sau khi hoàn thành cả sáu bước:

1. Dùng `rg --files` và `rg` để chắc chắn chưa có file/capability tương đương.
2. Xác định một domain hoặc app sở hữu duy nhất.
3. Đối chiếu bảng vị trí trong `BIOLEARN_V2_REPOSITORY_STRUCTURE.md`.
4. Chứng minh file phục vụ hạng mục roadmap hiện hành, không phải “để sau dùng”.
5. Xác định test hoặc cách kiểm tra cho file.
6. Thêm file vào báo cáo thay đổi và cập nhật status nếu thay đổi cấu trúc.

Không được tạo:

- File/thư mục mới ở root nếu không được liệt kê trong cấu trúc mục tiêu hoặc có
  ADR chấp thuận.
- `utils`, `helpers`, `common`, `shared`, `misc`, `temp`, `new`, `final-v2` không
  có owner và contract cụ thể.
- Component, hook, service hoặc schema trùng chức năng với file hiện có.
- Empty scaffold hàng loạt, placeholder route, mock API hoặc TODO giả để làm
  repository trông như đã hoàn thành.
- Bản sao như `ComponentNew`, `ComponentFinal`, `ComponentV2Fixed`; phải dùng
  branch, version contract hoặc migration đúng quy trình.
- SQL ngoài `supabase/migrations`, `supabase/functions` hoặc vùng test được quy
  định; không nhét SQL vào frontend.
- Asset runtime trong `docs/assets`, hoặc ảnh tham chiếu trong bundle production.
- Secret, `.env`, dữ liệu người dùng thật, export database hoặc nội dung SGK
  không xác nhận quyền phát hành.

## 4. Phạm vi theo giai đoạn

| Giai đoạn hiện hành | AI được phép tạo | AI chưa được phép tạo |
|---|---|---|
| V2-A0 | `docs/adr`, `docs/workflows`, `docs/runbooks`, inventory/threat model/wireframe đã duyệt và cập nhật tài liệu gốc bắt buộc | `apps/*`, `packages/*`, migration production, feature UI thật |
| V2-A1 | Workspace tối thiểu, Expo shell, token, contract nền, Supabase local, CI | Đủ toàn bộ screen, PvP, microservice, schema chưa có ADR |
| V2-A2 | Backend core và test theo contract | Client tự cấp reward, content production chưa duyệt |
| V2-A3 | Một vertical slice đã chốt | Nhân rộng lớp 6-12 trước khi slice đạt gate |
| V2-A4 trở đi | Chức năng đúng gate blueprint | Nhảy cóc feature vì dễ demo |

`src/` legacy chỉ tồn tại trên `democode`/`main`; không được copy cả cây vào nhánh
V2. Sửa legacy phải được làm riêng trên nhánh legacy, là lỗi cụ thể, phạm vi nhỏ
và không trộn với scaffold V2.

## 5. Ranh giới code bắt buộc

- `apps/*`: presentation và application orchestration; không sở hữu luật nghiệp vụ.
- `packages/domain`: TypeScript thuần; không React, Expo, DOM, SDK database.
- `packages/contracts`: schema/DTO/error code; không query database và không UI.
- `packages/api-client`: giao tiếp API; không quyết định điểm, unlock hoặc quyền.
- `packages/curriculum`: schema/validator; không tự xác nhận nội dung học thuật.
- `supabase/functions`: command ghi dữ liệu và transaction server-authoritative.
- `supabase/migrations`: schema/RLS/index/constraint; migration đã chạy là bất biến.
- Screen/component không biết tên bảng, RPC hay service-role.
- Client không được tin dữ liệu role, score, reward hoặc completion do chính
  client tạo ra mà chưa được backend kiểm tra.

Mọi import phải đi theo hướng trong tài liệu cấu trúc. AI không được phá vòng
phụ thuộc bằng alias, dynamic import hoặc copy code sang nơi khác.

## 6. Luật backend và dữ liệu

AI tuyệt đối không được:

- Chạy hoặc sinh lệnh phá hủy production; sửa migration đã chạy; reset database.
- Dùng `DELETE`/`UPDATE` diện rộng không có điều kiện, dry-run, backup và rollback.
- Dùng service-role ở mobile/web client hoặc biến `EXPO_PUBLIC_*`/`VITE_*`.
- Cho phép claim reward nhiều lần cho cùng completion/mission/match.
- Cập nhật balance trực tiếp từ nhiều nơi thay vì reward ledger/transaction.
- Dùng thời gian thiết bị để chốt streak, mission hoặc mùa giải.
- Tin `userId`, role hoặc ownership từ request khi có thể suy ra từ auth context.
- Tắt RLS để “sửa lỗi quyền” hoặc dùng admin policy quá rộng.

Mỗi command ghi dữ liệu phải có authentication, authorization, runtime
validation, idempotency key khi cần, transaction boundary, stable error code và
audit/telemetry phù hợp. Migration phải có forward check, test và kế hoạch quay
lại hoặc giải thích vì sao chỉ có forward-fix.

Mọi endpoint/trust boundary còn phải tuân thủ `SECURITY_BASELINE.md`: rate limit
được thực thi server-side bằng store dùng chung, payload/query/concurrency/timeout
limit, schema strict và secret scan. Auth mật khẩu phải có test chứng minh tối đa
5 lần thất bại trong 15 phút và không có đường gọi upstream để né policy.

## 7. Luật nội dung Sinh học

- TXT/OCR trong `documents/source` chỉ là chỉ mục tìm kiếm, không phải nguồn chuẩn.
- Thuật ngữ, hình, bảng, công thức, tên Latin và quy trình thực hành phải đối
  chiếu PDF/trang nguồn và Chương trình GDPT hiện hành.
- Lớp 6-9 chỉ lấy mạch Sinh học trong Khoa học tự nhiên; lớp 10-12 theo môn Sinh học.
- AI không được tự đặt trạng thái `APPROVED` hoặc `PUBLISHED`.
- Lesson, question, lab, Mini Boss và Boss phải có `sourceRefs`, version, YCCĐ và
  lịch sử reviewer theo content standard.
- Thực hành phải là thao tác: mục tiêu, chuẩn bị, an toàn, quy trình, quan sát/số
  liệu, phân tích và kết luận. Một bộ câu hỏi đáp không được gắn nhãn “thực hành”.
- Nội dung mở rộng phải có nhãn, không được dùng để khóa hành trình bắt buộc.

Khi chưa chắc kiến thức, AI phải đánh dấu `NEEDS_REVIEW` và nêu trang cần đối
chiếu. Không được điền câu trả lời nghe hợp lý để lấp chỗ trống.

## 8. Luật UI mobile BioLearn

- Thiết kế cho iPhone và thao tác cảm ứng trước; hit target tối thiểu 44x44 pt.
- Mỗi UI mới phải dùng semantic token và hoạt động đúng ở light/dark.
- Không hard-code màu nền/chữ rải rác trong JSX/TSX.
- Liquid Glass chỉ dùng cho navigation, toolbar, HUD hoặc modal điều khiển; nội
  dung học dài cần surface dễ đọc. Có fallback khi giảm transparency/performance.
- Không sao chép nhận diện Duolingo, Kahoot, Quizizz hoặc ảnh Map tham chiếu.
- Không dùng layout marketing, hero lớn, card lồng card, gradient/orb trang trí,
  palette một màu hoặc hiệu ứng chỉ để trông “hiện đại”.
- Trạng thái current/locked/completed/correct/wrong phải có thêm icon, hình dạng
  hoặc nhãn; không chỉ dùng màu.
- Phải có loading, empty, error, offline/retry và disabled/pressed/focus state.
- Map phải mở và đối chiếu ảnh tham chiếu trước khi sửa; 3D phải kiểm tra canvas
  thực sự có pixel/render chứ không chỉ thấy component mount.
- UI không đạt ở cả light/dark thì hạng mục chưa hoàn thành.

## 9. Luật dependency và cấu hình

- Không cài package mới khi API nền tảng hoặc package hiện có đáp ứng được.
- Package mới phải có lý do, owner, license, kích thước/ảnh hưởng mobile, tình
  trạng bảo trì và test tối thiểu; dependency nền tảng cần ADR.
- Không đổi package manager, nâng đồng loạt `latest`, chạy audit fix cưỡng bức
  hoặc sửa lockfile ngoài phạm vi.
- Không thêm config cạnh tranh (`eslint`, `tsconfig`, bundler, env loader) ở mỗi
  app nếu `packages/tooling` phải sở hữu phần dùng chung.
- Không sửa `vercel.json`, `eas.json`, app identifiers, signing hoặc production
  environment chỉ để chạy local.
- Không hard-code key/token/password hoặc xem biến môi trường là đủ an toàn.
  `VITE_*`/`EXPO_PUBLIC_*` là public; secret chỉ ở server secret store.
- CI phải quét secret ở current diff và history, audit production dependency và
  chặn advisory Critical/High theo policy; không chạy `audit fix --force`.

## 10. Git và bảo vệ thay đổi của người dùng

Trước khi sửa phải chạy `git status --short`. AI phải coi mọi thay đổi chưa biết
là thay đổi của người dùng và không được revert, overwrite hoặc format tràn lan.

Các lệnh sau bị cấm nếu chưa có yêu cầu và phê duyệt trực tiếp: `git reset
--hard`, `git clean -fdx`, `git restore .`, `git checkout -- .`, force push,
xóa đệ quy và mọi thao tác làm mất dữ liệu. Không commit/push/merge/deploy nếu
người dùng chưa yêu cầu. Không dùng commit để che giấu file thừa.

Một thay đổi nên gắn với một roadmap ID và một mục tiêu nghiệp vụ. Không trộn
refactor diện rộng, nâng dependency, format toàn repo hoặc đổi UI ngoài phạm vi.

## 11. Kiểm tra bắt buộc

AI phải chọn kiểm tra theo blast radius, nhưng tối thiểu gồm:

| Loại thay đổi | Kiểm tra tối thiểu |
|---|---|
| Docs/structure | Link/path tồn tại, `git diff --check`, đối chiếu không mâu thuẫn blueprint |
| Domain/contract | unit test + typecheck + contract compatibility |
| Migration/RLS | local migration từ sạch + RLS/pgTAP + rollback/forward-fix review |
| Command/reward | authz + validation + idempotency + concurrency test |
| API/Auth/Security | rate-limit + oversized/malformed/unknown-field + abuse tests; secret/SAST/dependency scan |
| Mobile UI | typecheck/test + iPhone target + light/dark + offline/error |
| Web UI | build/test + light/dark + viewport quy định |
| Map | ảnh/screenshot light/dark + node states + touch/scroll + visual regression |
| 2D/3D | correctness rubric + performance budget + nonblank render/canvas check |
| Quiz/PvP | state machine + reconnect + ordering/race + abuse cases |

AI không được tuyên bố “đã test” nếu chỉ đọc code. Lỗi tồn đọng phải phân biệt
với lỗi mới bằng log hoặc baseline; không được xóa test để làm CI xanh.

## 12. Điều kiện phải dừng và báo cáo

AI phải dừng thay đổi và xin quyết định khi:

- Nhiệm vụ yêu cầu vượt gate giai đoạn hiện hành.
- Không xác định được source of truth, domain owner hoặc nguồn học thuật.
- Phát hiện secret, production credential hoặc dữ liệu người dùng thật.
- Cần migration phá hủy, force push, xóa/di chuyển diện rộng hoặc đổi nền tảng.
- File người dùng đang sửa xung đột trực tiếp và không thể giữ cả hai ý định.
- Yêu cầu mới mâu thuẫn blueprint/ADR hoặc làm yếu RLS/server authority.
- Quyền phát hành PDF/video/asset chưa rõ.

“Dừng” không có nghĩa là bỏ việc: AI phải nêu blocker, bằng chứng đã kiểm tra,
phần vẫn có thể làm an toàn và quyết định cụ thể cần người dùng xác nhận.

## 13. Báo cáo kết thúc bắt buộc

Sau mỗi hạng mục, AI phải báo cáo ngắn gọn:

```text
Roadmap ID và kết quả:
File đã sửa/tạo:
Nghiệp vụ/contract/schema thay đổi:
Kiểm tra đã chạy và kết quả:
Kiểm tra chưa chạy:
Rủi ro còn lại và rollback:
Bước tiếp theo hợp lệ:
```

Đồng thời cập nhật `docs/IMPLEMENTATION_STATUS.md`. Không đánh dấu `DONE` khi
chỉ tạo skeleton, mock, giao diện tĩnh hoặc bỏ qua light/dark, test, sourceRefs,
RLS hay idempotency.

## 14. Mẫu lệnh giao việc cho AI khác

Khi chuyển việc sang một AI/vibecode khác, dùng mẫu sau:

```text
Bạn đang làm trong BioLearn V2. Hãy đọc AGENTS.md và toàn bộ tài liệu bắt buộc
được nó dẫn chiếu. Roadmap ID: <ID>. Mục tiêu duy nhất: <mục tiêu>. Chỉ được sửa:
<paths>. Không được chạm: <paths>. Trước khi tạo file, đối chiếu
BIOLEARN_V2_REPOSITORY_STRUCTURE.md và tìm file tương đương bằng rg. Không tự
đổi kiến trúc, dependency, schema, reward, theme hoặc publish content. Hãy chạy
<tests> và cập nhật IMPLEMENTATION_STATUS.md với bằng chứng thực tế.
```

Prompt này không thay thế tài liệu. Nếu AI không thể đọc các file bắt buộc, AI
không được thực hiện thay đổi mã nguồn BioLearn V2.
