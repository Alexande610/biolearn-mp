# Quy tắc phát triển NextGen BioLearn

Tệp này là chỉ dẫn bắt buộc cho mọi người và mọi coding agent làm việc trong
repository. Trước khi thay đổi mã nguồn, phải đọc:

1. `docs/PROJECT_REBUILD_ROADMAP.md`
2. `docs/IMPLEMENTATION_STATUS.md`
3. `docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md` nếu công việc liên quan hệ thống V2.
4. `docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md` và
   `docs/AI_ENGINEERING_GUARDRAILS.md` nếu sửa hoặc tạo code/cấu hình V2.
5. `docs/CURRICULUM_CONTENT_STANDARD.md` và
   `docs/CURRICULUM_SOURCE_INVENTORY.md` nếu liên quan nội dung học tập.
6. `docs/MAP_VISUAL_REFERENCE.md` nếu công việc liên quan Map hoặc asset.
7. `docs/workflows/STUDENT_EXPERIENCE_V2.md` nếu công việc liên quan học viên.
8. Các tệp đang được sửa và luồng gọi liên quan.

Sau mỗi hạng mục, cập nhật `docs/IMPLEMENTATION_STATUS.md` để phiên làm việc sau
có thể tiếp tục mà không phụ thuộc lịch sử trò chuyện.

## 1. Phạm vi dự án

- Mục tiêu hiện hành là xây BioLearn V2 song song theo blueprint: backend-first
  về nghiệp vụ, mobile-first về sản phẩm, giữ legacy làm nguồn đối soát.
- `docs/assets/map-journey-visual-reference.png` là ảnh căn cứ chính thức cho
  bố cục Map V2. Phải mở ảnh trước khi thiết kế; không chỉ dựa vào mô tả chữ.
- Legacy chỉ maintenance; không thêm feature lớn trùng V2. 3D, Mission, Quiz,
  PvP, Teacher và Admin cũ là nguồn tham khảo nghiệp vụ, không phải code mẫu để port.
- Không viết lại toàn bộ ứng dụng hoặc thay thế Supabase nếu chưa có quyết định
  kiến trúc được ghi vào roadmap và được người dùng đồng ý.
- V2 không được gọi Supabase trực tiếp từ screen/component và không được để client
  tự quyết định reward, progress, role, publish, match hoặc score.
- Kiến thức phải đúng Chương trình GDPT hiện hành và SGK Kết nối tri thức. TXT
  trong `documents/source` chỉ dùng tìm kiếm, không phải nguồn chuẩn.
- Không xóa Map cũ trong khi Map V2 chưa đạt đủ tiêu chí nghiệm thu. Map V2 phải
  có feature flag hoặc cách quay lại Map cũ.

## 2. Các lệnh và hành động bị cấm

Không thực hiện các lệnh/hành động sau nếu người dùng chưa chỉ định rõ mục tiêu,
chưa có bản sao lưu và chưa phê duyệt trực tiếp:

- `git reset --hard`, `git clean -fd`, `git clean -fdx`, `git checkout -- .`,
  `git restore .` hoặc thao tác làm mất thay đổi chưa commit.
- `git push --force`, `git push --force-with-lease` trên nhánh dùng chung.
- `Remove-Item -Recurse -Force`, `rm -rf`, xóa hàng loạt hoặc di chuyển đệ quy
  ngoài thư mục tạm/build đã được xác minh.
- Xóa hoặc ghi đè `.env`, khóa API, Supabase URL, dữ liệu người dùng hay tệp
  người dùng tải lên.
- Chỉnh sửa trực tiếp `node_modules/`, `dist/` hoặc tệp build sinh tự động.
- `npm audit fix --force`, nâng đồng loạt dependency lên `latest`, hoặc thay
  package manager khi chưa kiểm tra tương thích.
- Chạy `DROP`, `TRUNCATE`, `DELETE` không có điều kiện chặt chẽ, reset database,
  reset Supabase, hoặc chạy seed/patch thử nghiệm trên production.
- Chạy các tệp trong `scratch/` vào database thật chỉ vì tên tệp có vẻ phù hợp.
  Một số script hiện có thao tác xóa dữ liệu trước khi chèn.
- Seed/publish nội dung ở trạng thái TXT thô, chưa có trang PDF, chưa đối chiếu
  yêu cầu cần đạt hoặc chưa duyệt chuyên môn.
- Sửa trực tiếp PDF SGK nguồn, ghi đè TXT nguồn hoặc tự động sửa OCR hàng loạt
  mà không đối chiếu từng trang.
- Đưa Supabase service-role key hoặc secret vào frontend, commit, log hay ảnh
  chụp màn hình.
- Thay toàn bộ một tệp lớn chỉ để sửa một phần nhỏ; không xóa code người dùng
  đang sửa hoặc thay đổi ngoài phạm vi nhiệm vụ.

Nếu cần một hành động phá hủy, trước tiên phải ghi rõ: mục tiêu chính xác, phạm
vi dữ liệu, cách sao lưu, cách khôi phục và lệnh dự kiến; sau đó chờ phê duyệt.

## 3. Quy trình thay đổi an toàn

1. Chạy `git status --short` và đọc các tệp liên quan.
2. Ghi ID hạng mục roadmap đang thực hiện vào `IMPLEMENTATION_STATUS.md`.
3. Tạo thay đổi nhỏ, tương thích ngược và có thể kiểm thử độc lập.
4. Với database, chỉ thêm migration mới, có kiểm tra tồn tại hoặc tính
   idempotent; không sửa lịch sử migration đã chạy.
5. Không dùng dữ liệu production để thử nghiệm. Seed phải có môi trường đích rõ
   ràng và mặc định từ chối chạy nếu không xác định được môi trường.
6. Chạy kiểm tra phù hợp: build, test liên quan và kiểm tra thủ công hai theme.
7. Cập nhật trạng thái, tệp đã đổi, kết quả kiểm tra và bước tiếp theo.

Các lệnh đọc và kiểm tra an toàn thường dùng:

```powershell
git status --short
git diff --check
git diff -- <duong-dan>
rg -n "<mau-can-tim>" src
npm run build
npm run lint
```

`npm run lint` hiện có lỗi tồn đọng. Không được tuyên bố hạng mục làm phát sinh
lint sạch nếu chỉ bỏ qua lỗi; phải phân biệt lỗi cũ và lỗi mới trong báo cáo.

## 4. Quy tắc database và tiến trình học

- `profiles.class_progress` đang là nguồn tiến trình hiện tại; mọi mô hình mới
  phải có adapter tương thích với dữ liệu cũ trước khi migration.
- Không đổi ý nghĩa các key tiến trình cũ khi chưa có migration và rollback.
- Reward phải đi qua RPC/transaction đã xác định; không cộng XP, coin, energy ở
  nhiều nơi khiến người dùng nhận thưởng lặp.
- Mỗi lần hoàn thành activity phải có khóa chống ghi nhận lặp và định danh attempt.
- Nội dung Map, thực hành và Mini Boss không được hard-code thêm vào component
  giao diện. Dữ liệu phải nằm trong content/config hoặc database có schema rõ.
- Mọi lesson/question/lab/boss phải có `sourceRefs`, version và trạng thái kiểm
  định theo `CURRICULUM_CONTENT_STANDARD.md`.
- Production chỉ được dùng content `APPROVED` hoặc `PUBLISHED`; AI không được tự
  chuyển nội dung sang các trạng thái này.
- Migration phải có tài liệu: dữ liệu vào, dữ liệu ra, giá trị mặc định, cách
  kiểm tra và cách quay lại.

## 4.1. Quy tắc chuyên môn Sinh học

- Nguồn ưu tiên là Chương trình GDPT hiện hành, yêu cầu cần đạt và đúng SGK Kết
  nối tri thức của từng lớp.
- Phải kiểm tra trực tiếp PDF cho thuật ngữ, hình, bảng, công thức, ký hiệu, tên
  Latin và bài thực hành. Không kết luận từ TXT/OCR.
- Nội dung lớp 6-9 thuộc mạch Sinh học trong môn Khoa học tự nhiên; không đưa
  toàn bộ phần Vật lí/Hóa học vào hành trình Sinh học.
- Nội dung lớp 10-12 theo môn Sinh học; nội dung mở rộng phải có nhãn và không
  dùng để khóa tiến trình bắt buộc.
- Bài thực hành phải có mục tiêu, chuẩn bị, an toàn, thao tác, quan sát/số liệu,
  phân tích và kết luận. Không đổi bài thực hành thành một bộ trắc nghiệm.
- Nội dung hoặc đáp án chưa được reviewer chuyên môn xác nhận không được seed
  vào production.

## 5. Quy tắc giao diện sáng/tối

Legacy dùng theme tối làm CSS mặc định và thêm `body.light-theme` cho nền sáng.
V2 không kế thừa cơ chế này; V2 phải dùng semantic design tokens dùng chung cho
mobile/web và mapping riêng theo nền tảng.

- Mọi màn hình/component mới phải có thiết kế cho cả `dark` và `light`.
- Map V2 phải đối chiếu với `docs/MAP_VISUAL_REFERENCE.md`; không sao chép logo,
  thương hiệu hoặc asset cụ thể từ ảnh tham chiếu.
- Dùng semantic token như `--map-surface`, `--map-text`, `--map-track`; không
  rải màu nền/chữ cố định trong JSX.
- Không phụ thuộc duy nhất vào lớp Tailwind `dark:` hoặc một class global để mô
  phỏng semantic theme của V2.
- Trạng thái locked/current/completed/correct/wrong không chỉ phân biệt bằng màu;
  phải có icon, hình dạng, nhãn hoặc pattern hỗ trợ.
- Chữ thường đạt tương phản WCAG AA 4.5:1; chữ lớn và icon quan trọng đạt 3:1.
- Focus, hover, pressed, disabled và modal overlay phải đọc được ở cả hai theme.
- Canvas/WebGL/SVG cần nhận theme qua prop hoặc token; không tự đọc màu một lần
  rồi bỏ qua thay đổi theme.
- Mỗi hạng mục UI phải kiểm tra ít nhất ở 360x800, 768x1024 và 1440x900 cho cả
  hai theme. Không được có tràn ngang, chữ đè nhau hoặc nút nhỏ hơn 44x44 px trên
  giao diện cảm ứng.
- Hỗ trợ `prefers-reduced-motion`; animation Map không được ngăn thao tác.

## 6. Quy tắc React Native + Expo

- Mobile dùng React Native với Expo, ưu tiên Expo Router và development build.
- Không di chuyển toàn bộ web sang mobile trong một lần. Tách `game-core`,
  content schema và Supabase service trước, rồi tạo UI mobile.
- Không giả định component DOM, CSS, Molstar hoặc React Three Fiber web dùng lại
  trực tiếp trong React Native.
- Giai đoạn đầu, 3D hiện có được giữ nguyên trên web và mở qua WebView/deep link
  có kiểm soát. Không sửa engine 3D chỉ để đạt parity mobile sớm.
- Không đặt secret trong biến `EXPO_PUBLIC_*`; các biến này được đóng gói vào app.
- Logic dùng chung không được truy cập trực tiếp `window`, `document`,
  `localStorage` hoặc API chỉ có trên trình duyệt.

## 7. Tiêu chuẩn hoàn thành

Một hạng mục chỉ được đánh dấu `DONE` khi:

- Đạt tiêu chí nghiệm thu trong roadmap.
- Không làm thay đổi ngoài phạm vi đã ghi.
- Build thành công; test liên quan thành công hoặc có ghi rõ phần chưa chạy được.
- Đã kiểm tra sáng/tối và viewport quy định nếu có UI.
- Có xử lý loading, empty, error, offline/retry phù hợp với hạng mục.
- Không lộ secret, không có lệnh/xử lý database phá hủy.
- `docs/IMPLEMENTATION_STATUS.md` đã được cập nhật.
