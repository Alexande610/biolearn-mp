# BioLearn V2 - Đặc tả Startup, Auth, Trạm ngày và nền giao diện

- **Trạng thái:** Đã sửa theo phản hồi ngày 2026-08-12; cần duyệt wireframe trước code UI
- **Roadmap:** `V2-R0` chuẩn bị `V2-A1`/`V2-A3`/`V2-A4`
- **Phạm vi:** Mobile học viên + student web; teacher auth dẫn sang teacher web

## 1. Những điểm được chốt lại

| Hạng mục | Quyết định đúng |
|---|---|
| Splash | Logo BioLearn cũ + đường chạy ADN chuyển động + mầm cây + phần trăm thật |
| Login | Giữ chất lượng/thẩm mỹ cosmic của legacy, thiết kế lại bằng token và liquid glass có kiểm soát |
| Vai trò | Tách rõ Học viên/Giáo viên; backend xác minh role |
| Học viên | Google, email/mật khẩu, đăng ký, quên mật khẩu |
| Giáo viên | Đăng nhập riêng; đăng ký/yêu cầu xác minh trường, không có mã demo hard-code |
| Trạm ngày | Tuyến trạm theo ngày lấy nhịp bố cục từ ảnh; phương tiện/tuyến được sáng tạo lại theo Sinh học, mỗi trạm tối đa 3 sao |
| Hành trình học | Map chương trình riêng; không được gọi nhầm là Trạm ngày |
| Dark theme | Galaxy/vũ trụ BioLearn như tinh thần hệ cũ |
| Background | Một lớp scene độc lập, thay ảnh/nền động mà không sửa logic tính năng |

Bản preview “Hành trình” trước đây dùng cụm node không thể hiện rõ tuyến trạm
theo ngày nên **không được xem là thiết kế đã duyệt của Trạm ngày**. Tuy nhiên,
ảnh mẫu cũng không phải giấy phép sao chép tàu hỏa hoặc đường ray y hệt.

## 2. Startup / Splash

### Tài sản thương hiệu

- Dùng logo trong legacy làm nguồn chính thức sau khi đưa qua asset inventory:
  `main:public/images/Logo.png`, Git blob
  `6f344779ac0990e5a5853f68e6ccb32769aea4d5`.
- Không kéo theo component/CSS/auth/config legacy. Asset đích phải có checksum,
  kích thước xuất, safe area và quyền sử dụng được ghi lại.

### Bố cục và motion

1. Logo nằm ở vùng focus phía trên/trung tâm, giữ tỷ lệ, không crop chữ BioLearn.
2. Thanh tiến độ là **một ADN nằm ngang**: hai dải xoắn quanh trục, các bậc liên
   kết chạy tuần tự từ trái sang phải. Đây không phải thanh chữ nhật phủ gradient.
3. Phần đã tải sáng rõ hơn nhưng cả cấu trúc ADN vẫn nhìn thấy. Nhịp xoắn liên tục
   và đều, không rung/nhảy khi phần trăm đổi.
4. Một **mầm cây BioLearn** di chuyển trên dải phía trên theo cùng progress. Mầm
   cây có bounce rất nhẹ; vị trí không được vượt phần trăm thật.
5. Số `0–100%` nằm chính giữa vùng ADN, có scrim/outline để đọc được ở cả light và
   dark. Dòng trạng thái ngắn nằm dưới, ví dụ “Đang khôi phục phiên học”.
6. Dark dùng nền galaxy; light dùng cảnh phòng lab/sinh học ban ngày. Geometry và
   vị trí logo/ADN/mầm cây không đổi giữa theme.

### Tiến độ trung thực và lỗi

- Phần trăm được suy ra từ state machine bootstrap: local configuration, secure
  session restore, public manifest, role/profile tối thiểu và resume target.
- Không chạy giả đến 99%. Mốc chưa hoàn tất không được đánh dấu xong chỉ để đẹp.
- Timeout chuyển sang trạng thái retry/offline an toàn; lỗi auth không hiển thị
  dữ liệu nhạy cảm hay raw backend error.
- Warm start bỏ intro dài. `prefers-reduced-motion`/Reduce Motion dùng ADN tĩnh,
  mầm cây nhảy theo mốc và fade ngắn.

## 3. Auth gateway và đăng nhập

### Hướng thị giác

- Legacy `LoginPage` là tham chiếu về độ đầu tư: logo lớn, cosmic landing, glass
  panel và phân vai. Không port code cũ vì đang gọi Supabase trực tiếp, có role
  metadata từ client và mã giáo viên demo.
- Desktop/tablet có brand scene và form panel cân đối; mobile xếp dọc, form là
  focus chính và không yêu cầu thao tác kéo khó dùng để mới vào được đăng nhập.
- Liquid glass dùng cho role switch, form surface và primary control trên nền đã
  có scrim ổn định. Input và lỗi phải đủ tương phản; có fallback gần-đặc khi
  Reduce Transparency hoặc thiết bị yếu.

### Information architecture

```text
Auth gateway
├─ Học viên
│  ├─ Đăng nhập bằng Google
│  ├─ Đăng nhập email + mật khẩu
│  ├─ Đăng ký tài khoản
│  └─ Quên mật khẩu
└─ Giáo viên
   ├─ Đăng nhập email + mật khẩu/SSO được trường cấp
   ├─ Đăng ký hoặc gửi yêu cầu xác minh giáo viên
   └─ Khôi phục tài khoản
```

- Google chỉ xuất hiện trong luồng Học viên ở phạm vi hiện tại.
- Chọn tab không cấp role. Role/membership do server xác minh sau auth.
- Đăng ký giáo viên không dùng secret/mã dùng chung trong client. Yêu cầu phải có
  workflow duyệt/audit; trạng thái đang chờ không được cấp quyền giáo viên.
- Error message chống account enumeration; loading chống submit lặp; session
  fail-closed và redirect đích chỉ lấy từ allowlist.
- Mọi route auth thuộc gate `AUTH-RL-01`: tối đa 5 lần thất bại/15 phút bằng
  nhiều khóa hợp lý, có test bypass/IPv6/parallel/lockout DoS. Input schema strict,
  payload nhỏ và credential không log/telemetry.

## 4. Trạm hằng ngày là tuyến khám phá theo ngày

Ảnh `docs/assets/map-journey-visual-reference.png` là căn cứ chính cho **Trạm
hằng ngày** về bố cục, thứ tự ngày, vị trí hiện tại, khóa và ba sao. Nó không
khóa thiết kế thành tàu hỏa/đường ray và không phải asset để vẽ lại.

### Mô hình thị giác

- Một tuyến uốn liên tục đi qua `Ngày 1`, `Ngày 2`, ... theo thứ tự. Tuyến có thể
  được diễn giải thành ADN, mạch dẫn, sợi nấm, dây leo, microtubule hoặc một cấu
  trúc Sinh học nguyên bản khác.
- Linh vật/phương tiện/biểu tượng hành trình BioLearn nằm ở trạm hiện tại và di
  chuyển hoặc phát triển sang trạm kế tiếp khi server xác nhận hoàn thành. Có
  idle/moving-or-growing/arrival và reduced-motion fallback.
- Mỗi trạm có bệ, biển ngày, trạng thái khóa/current/completed và ba vị trí sao.
- Trạm hoàn thành hiển thị 1–3 sao; **hoàn hảo là 3 sao**. Ngưỡng cụ thể thuộc
  policy/content server, không hard-code vào animation hoặc client.
- Trạm chưa mở cho biết thời điểm/lý do. Trạm cũ đã mở có thể ôn lại; ôn lại không
  tự cấp reward lần hai.
- Mobile ưu tiên tuyến dọc/uốn nhẹ để đọc từng ngày; tablet/desktop có thể dùng
  tuyến ngang/chữ S giống nhịp ảnh tham chiếu. Thứ tự ngày luôn rõ.
- Không sao chép đầu máy, toa tàu, đường ray, cây, palette, nút, tỷ lệ hay
  animation từ ảnh. Wireframe phải trình ít nhất hai concept Sinh học khác nhau
  trước khi chọn art direction.

### Ranh giới với Hành trình học

- `Trạm ngày`: engagement theo lịch ngày, tuyến khám phá + biểu tượng hành trình
  BioLearn + 1–3 sao.
- `Hành trình học`: chương trình lớp/chương/bài, gồm lesson, lab, Mini Boss, Boss
  và remediation. Nó có progression riêng và không đổi thành lịch ngày.
- Hai hệ dùng chung identity, attempt/progress/reward ledger canonical nhưng có
  contract và UI riêng. Không dùng cùng một component rồi chỉ đổi nhãn.

## 5. Background thay thế được và nền động an toàn

Mỗi screen feature chỉ render nội dung/interaction trên một `SceneBackground`
port. Feature không biết nền là ảnh tĩnh, particle hay animation.

```text
fallback color
→ static scene asset (light/dark)
→ optional motion/particle layer
→ contrast scrim
→ feature content
→ HUD/liquid-glass controls
```

### Contract bắt buộc

- Input tối thiểu: `sceneId`, `theme`, `motionPreference`, `performanceTier`.
  Không truyền password, token, progress chi tiết, PvP state hay dữ liệu lớp học.
- Background `pointer-events: none`, không điều hướng, không gọi command API và
  không là nguồn sự thật của feature.
- Nếu asset/dynamic renderer lỗi, screen vẫn hoạt động trên fallback color/static
  asset; error boundary nền không được kéo sập auth/lesson/PvP.
- Scene manifest versioned và allowlist loại renderer. Remote asset có checksum,
  content type, kích thước, cache policy và timeout; không thực thi script tùy ý.
- Có budget cho bundle/download, memory, FPS/battery và số particle. Giảm hoặc
  tắt motion khi Reduce Motion, data saver, low-power hoặc thiết bị thấp.
- Scrim/semantic token đảm bảo tương phản; không sửa trực tiếp màu chữ của từng
  feature khi thay background.

### Scene gốc

- `biolearn-galaxy-night-v1`: nền tối xanh đen, sao nhấp nháy và nebula sinh học
  có kiểm soát, kế thừa tinh thần `GalaxyBackground` legacy nhưng triển khai lại
  deterministic, có performance/reduced-motion test.
- `biolearn-lab-day-v1`: nền sáng sinh học/phòng lab ban ngày, không chỉ ẩn galaxy
  rồi phủ một gradient toàn cục.
- Background cosmetic về sau chỉ thay `sceneId`/manifest; layout, touch target,
  auth, progress, ranking, teacher và PvP không thay đổi.

## 6. Gate trước khi code UI

1. Wireframe riêng cho Splash, Student Auth, Teacher Auth và Trạm ngày ở mobile +
   desktop, đủ light/dark.
2. Review trực tiếp logo legacy và ảnh Trạm ngày, không chỉ mô tả bằng chữ.
3. Prototype motion ADN/mầm cây cho Splash và motion biểu tượng Trạm ngày có
   reduced-motion; không dùng progress giả hoặc sao chép motion tàu mẫu.
4. Token/material/background contract được chốt trước CSS/component.
5. Auth UI chỉ nối backend sau `AUTH-RL-01`, schema/payload/error/secret gates.
6. Visual regression + accessibility + 360x800 + desktop + device yếu đạt.
