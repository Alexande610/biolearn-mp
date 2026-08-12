# Trạng thái nâng cấp NextGen BioLearn

Tệp này là điểm bàn giao giữa các phiên làm việc. Cập nhật ngay sau mỗi hạng mục;
không chờ đến cuối toàn bộ dự án.

## 1. Mục tiêu hiện hành

Xây BioLearn V2 song song: backend-first về nghiệp vụ, mobile-first về sản phẩm,
Expo bắt đầu từ foundation. Legacy được giữ làm nguồn đối soát và chỉ maintenance.
Map hành trình, thực hành, Mini Boss, 2D/3D, engagement, competition, teacher và
admin được xây lại trên domain contracts, workflow và quyền dữ liệu chuẩn.

## 2. Trạng thái tổng quan

| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| Quy tắc an toàn | DONE | Đã ghi trong `AGENTS.md` |
| Roadmap | DONE | Đã ghi trong `PROJECT_REBUILD_ROADMAP.md` |
| Blueprint BioLearn V2 | DONE | Kiến trúc mobile/backend/UI/workflow đã chốt ở mức kế hoạch |
| Ảnh tham chiếu Map | DONE | Đã lưu trong `docs/assets` và có visual spec |
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
- Ảnh mẫu Map đã được lưu tại
  `docs/assets/map-journey-visual-reference.png`; không còn phụ thuộc tệp clipboard.
- README ghi nhận build gần nhất pass; lint đang có nhiều lỗi tồn đọng.

## 4. Quyết định đã chốt

| ID | Quyết định | Lý do |
|---|---|---|
| D-001 | Mobile dùng React Native + Expo | Dễ phát triển, build và bảo trì đa nền tảng |
| D-002 | Hoàn thiện core/content trước mobile UI | Tránh viết lại cùng logic hai lần |
| D-003 | Giữ 3D web trong giai đoạn đầu | Stack 3D web không chuyển trực tiếp sang native |
| D-004 | Map V2 phải có feature flag | Cho phép pilot và quay lại Map cũ |
| D-005 | Practice có Activity Engine riêng | Thực hành không được giả lập bằng quiz thông thường |
| D-006 | UI mới bắt buộc sáng/tối | Đây là tiêu chí hoàn tất, không phải phần trang trí sau cùng |
| D-007 | Dữ liệu cũ phải tương thích | Không làm mất tiến trình người dùng hiện có |
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

## 5. Việc tiếp theo

`NEXT: V2-A0 - Khóa ADR, legacy inventory, threat model và vertical slice; chưa scaffold hay chạy production migration.`

Phạm vi lần tiếp theo:

1. Viết ADR cho Supabase V2, monorepo, Expo, command/query plane và 3D bridge.
2. Ghi schema/API/role/flow legacy và dữ liệu cần migration.
3. Threat model auth, reward, progress, quiz, PvP và admin.
4. Chọn vertical slice sau khi curriculum/PDF/YCCĐ được duyệt.
5. Wireframe iPhone light/dark và token direction; chưa code production UI.
6. Không chạy migration production hoặc chuyển dữ liệu trong V2-A0.

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
