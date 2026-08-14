# Tham chiếu hình ảnh cho Trạm hằng ngày BioLearn

## 1. Ảnh tham chiếu gốc

![Ảnh tham chiếu Trạm hằng ngày](assets/map-journey-visual-reference.png)

- Tệp trong repository: `docs/assets/map-journey-visual-reference.png`
- SHA-256:
  `F86E0F174C47EFAAE3B78F53C475F7D4B47ABF3453EFC9170F3740A33109DB73`
- Mục đích: căn cứ **ngữ pháp bố cục** gồm tuyến uốn liên tục, thứ tự ngày, bệ
  trạm, vị trí hiện tại, sao hoàn thành, nhịp di chuyển và trạng thái khóa. Đây
  không phải asset hoặc mẫu tàu/đường ray để vẽ lại.

Tên file/tài liệu lịch sử có chữ “map”, nhưng phản hồi sản phẩm ngày 2026-08-12
đã chốt: ảnh này là nguồn tham chiếu thị giác chính thức cho **Trạm hằng ngày**.
Nó không phải căn cứ để đồng nhất Trạm ngày với Map chương trình chính.

## 2. Hai hành trình không được trộn lẫn

| Hệ | Mục đích | Hình tượng | Trục tiến triển |
|---|---|---|---|
| Trạm hằng ngày | Engagement và thói quen học | Tuyến khám phá Sinh học + mốc ngày + biểu tượng hành trình + 1-3 sao | Ngày server mở |
| Hành trình học | Chương trình lớp/chương/bài | Biome + lesson/lab/Mini Boss/Boss | Curriculum/progress |

Hai hệ dùng chung identity, attempt/progress và reward ledger canonical, nhưng có
contract, UI và chính sách mở khóa riêng. Không dùng một component rồi chỉ đổi
nhãn “Ngày” thành “Bài”.

## 3. Kế thừa cấu trúc, không sao chép vật thể

| Đặc điểm trong ảnh | Cách áp dụng cho BioLearn |
|---|---|
| Tuyến đường ray liên tục | Kế thừa nhịp tuyến uốn nối các ngày; hình thức BioLearn có thể là dải ADN, mạch dẫn, sợi nấm, dây leo, đường tế bào hoặc một tuyến khám phá Sinh học nguyên bản |
| Tàu thể hiện vị trí | Dùng linh vật/phương tiện/biểu tượng hành trình BioLearn nguyên bản ở ngày hiện tại; có thể lấy ý tưởng “di chuyển theo tuyến”, không sao chép đầu máy/toa tàu trong ảnh |
| Biển `Ngày 1`, `Ngày 2` | Giữ ý nghĩa ngày; có thể kèm tên chủ đề ngắn nhưng không thay bằng lesson Map |
| Bệ trạm nổi bật | Mỗi ngày có vùng chạm rõ, nhãn và trạng thái không lẫn với cảnh nền |
| Ba sao dưới trạm | Hiển thị 1-3 sao; hoàn hảo là 3 sao, do policy server quyết định |
| Trạm khóa có ổ khóa | Có icon, độ tương phản, disabled state và lý do/thời điểm mở |
| Trạm hiện tại gần trung tâm | Mở màn hình tự đưa biểu tượng hành trình/ngày hiện tại vào vùng nhìn chính |
| Còn thấy đường phía trước | Gợi ý rõ còn có thể cuộn/đi tiếp mà không phơi nội dung bị khóa |

Không sao chép logo, tên trò chơi, đầu máy/toa tàu, đường ray, cây, palette, nút,
tỷ lệ vật thể hoặc asset cụ thể từ ảnh mẫu. Thiết kế BioLearn phải thay đổi rõ
ngôn ngữ hình khối, vật liệu, cảnh quan và chuyển động theo Sinh học.

Trước wireframe chi tiết phải có ít nhất hai hướng concept để so sánh, ví dụ:

1. Dải ADN/microtubule với “pod khám phá” BioLearn di chuyển giữa các mốc ngày.
2. Mạch dẫn/sợi nấm/dây leo phát triển qua từng trạm, dùng linh vật hoặc mầm sống
   làm dấu vị trí.
3. Một phương tiện Sinh học nguyên bản có tinh thần hành trình như ảnh, nhưng
   silhouette, cấu tạo và animation không giống tàu hỏa mẫu.

Chỉ một hướng được duyệt mới trở thành asset runtime; không kết hợp ngẫu nhiên
cả ba thành giao diện thiếu nhất quán.

## 4. Trạng thái và luật trực quan

```text
Ngày đã hoàn thành ← Dấu hành trình hiện tại → Ngày kế tiếp bị khóa → Các ngày sau
       1-3 sao               CTA chính             thời điểm/lý do
```

- `locked`: ổ khóa + nhãn thời điểm/lý do; không chỉ làm mờ.
- `available/current`: biểu tượng hành trình, focus ring và CTA rõ; không phụ thuộc màu.
- `completed`: cờ/dấu hoàn tất + 1-3 sao.
- `perfect`: đủ 3 sao và hiệu ứng ngắn; không dùng animation vô hạn.
- `replay`: cho ôn lại trạm đã mở nhưng không tự cấp reward lặp.
- Khi server xác nhận hoàn thành, biểu tượng hành trình mới di chuyển/phát triển
  đến trạm kế tiếp. Client không tự đổi sao, reward hoặc trạng thái mở khóa.

Ngưỡng 1/2/3 sao phải nằm trong versioned policy/content, không hard-code trong
component. Retry/idempotency không được nhân đôi reward.

## 5. Bố cục responsive

### Mobile dọc

- Đây là bố cục ưu tiên.
- Tuyến khám phá đi dọc hoặc uốn nhẹ trái/phải; không ép ảnh desktop ngang vào màn
  hình hẹp.
- Vùng nhìn ban đầu chứa dấu hành trình, trạm hiện tại và hé lộ ít nhất một trạm kế tiếp.
- Chi tiết ngày mở bằng bottom sheet; vùng chạm tối thiểu 44x44 px.
- HUD nằm trong safe area, không che biểu tượng hành trình, biển ngày hoặc sao.

### Tablet

- Có thể dùng tuyến dọc rộng hoặc ngang tùy chiều xoay.
- Hiển thị 3-5 trạm nếu vẫn giữ được nhãn, sao và trạng thái rõ ràng.
- Chi tiết ngày dùng bottom sheet hoặc side sheet.

### Desktop web

- Có thể dùng tuyến ngang/chữ S giống nhịp ảnh mẫu.
- Hỗ trợ wheel/trackpad, bàn phím và nút quay về tàu hiện tại.
- Không kéo giãn biểu tượng/bệ theo chiều rộng màn hình; giữ tỷ lệ asset.

## 6. Phiên bản sáng và tối

### Light

- Cảnh ban ngày/sinh học tươi, ray và bệ vẫn nổi hơn trang trí.
- Chữ tối trên surface sáng; sao và lock có hình dạng/nhãn ngoài màu.
- Không dùng một gradient toàn trang để thay cho art direction.

### Dark

- Nền galaxy/vũ trụ BioLearn như tinh thần legacy: xanh đen sâu, sao/nebula có
  kiểm soát, không phủ đen đơn giản lên bản light.
- Tuyến, bệ, biểu tượng hành trình và biển ngày có viền/độ tương phản đủ nhưng
  không neon đại trà.
- Chi tiết trang trí giảm tương phản để không cạnh tranh với CTA và trạng thái.

### Quy tắc chung

- Geometry, thứ tự ngày và vùng chạm giống nhau giữa theme.
- Đổi theme không làm mất vị trí cuộn, trạm hiện tại hoặc state.
- Background là scene layer độc lập theo
  `workflows/STARTUP_AUTH_DAILY_STATION_VISUAL_SPEC.md`; thay nền tĩnh/động không
  được sửa logic trạm, reward, ranking hay PvP.
- Có reduced-motion/reduce-transparency và fallback khi asset/renderer lỗi.

## 7. Tài sản hình ảnh cần sản xuất

Không vẽ hàng loạt asset trước khi wireframe được duyệt.

| Asset | Biến thể tối thiểu |
|---|---|
| Background Trạm ngày | Light, galaxy dark, mobile-safe crop, fallback tĩnh |
| Tuyến khám phá Sinh học | Thẳng, cong trái, cong phải, nối segment, light/dark; không tái tạo ray mẫu |
| Bệ và biển ngày | Locked, available/current, completed, perfect |
| Sao | Empty, earned, perfect FX; không chỉ đổi màu |
| Linh vật/phương tiện/biểu tượng BioLearn | Idle, moving/growing, arrival, reduced-motion; silhouette nguyên bản |
| Cảnh quan Sinh học | Theo chủ đề, không che ray/trạm/vùng chạm |
| FX | Unlock, complete, 3-star; có performance budget |

Asset cần tên có hệ thống, checksum, nguồn/quyền sử dụng, kích thước/crop và
budget bundle/download/memory. Nền động không được thực thi script tùy ý.

## 8. Tiêu chí đối chiếu trực quan

Trạm ngày chỉ đạt khi trả lời “có” cho các câu sau:

- Nhìn trong hai giây có hiểu đây là một tuyến Trạm hằng ngày có thứ tự không?
- Có thấy biểu tượng hành trình đang ở ngày nào và ngày kế tiếp ở đâu không?
- Mỗi trạm có đọc được 0/1/2/3 sao mà không chỉ dựa vào màu không?
- Trạm khóa/current/completed/perfect có khác nhau ở grayscale không?
- Ở 360x800, biểu tượng, tuyến, biển ngày, sao và CTA có chồng lên nhau không?
- Thiết kế có đủ khác đầu máy, toa tàu, đường ray, palette và asset mẫu để được
  xem là ngôn ngữ BioLearn nguyên bản không?
- Ở light và galaxy dark, nội dung chính có nổi hơn cảnh trang trí không?
- Khi Reduce Motion, người dùng vẫn hiểu chuyển trạm mà không cần animation không?
- Thay hoặc tắt background có làm thay đổi chức năng/trạng thái không?
