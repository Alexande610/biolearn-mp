# Tham chiếu hình ảnh cho Map hành trình Sinh học

## 1. Ảnh tham chiếu gốc

![Ảnh tham chiếu Map hành trình](assets/map-journey-visual-reference.png)

- Tệp trong repository: `docs/assets/map-journey-visual-reference.png`
- SHA-256:
  `F86E0F174C47EFAAE3B78F53C475F7D4B47ABF3453EFC9170F3740A33109DB73`
- Mục đích: căn cứ bố cục, nhịp di chuyển, cảm giác trò chơi và độ rõ của các
  trạm. Đây không phải asset được dùng trực tiếp trong sản phẩm.

Ảnh này là nguồn tham khảo thị giác chính thức cho hạng mục Map V2. Trước khi
thiết kế hoặc sửa Map V2, phải mở ảnh ở kích thước đủ lớn và đọc tài liệu này.

## 2. Những đặc điểm cần kế thừa

| Đặc điểm trong ảnh | Cách áp dụng cho BioLearn |
|---|---|
| Tuyến đường cong liên tục | Dùng đường ray/con đường Sinh học nối các node theo đúng thứ tự |
| Các trạm nổi bật trên bệ | Mỗi node có bệ, icon và nhãn dễ chạm, không lẫn với cảnh nền |
| Trạm hiện tại nằm gần trung tâm | Khi mở Map, tự đưa node hiện tại vào vùng nhìn chính |
| Trạm khóa có ổ khóa rõ | Dùng cả icon khóa, độ tương phản và trạng thái disabled |
| Phương tiện thể hiện tiến trình | Dùng tàu/nhân vật BioLearn nguyên bản tại vị trí học sinh |
| Cảnh nền tạo cảm giác hành trình | Mỗi chương có hệ sinh thái/chủ đề Sinh học riêng |
| Thanh thông tin phía trên | Hiện tên chương, tiến độ, back và các điều khiển cần thiết |
| Còn thấy tuyến đường tiếp theo | Viewport phải gợi ý rằng có thể cuộn để đi tiếp |

## 3. Những phần phải chuyển thành ngôn ngữ BioLearn

Không sao chép logo, tên trò chơi, hình tàu, cây, màu sắc, nút hoặc asset cụ thể
từ ảnh mẫu. Thiết kế cuối phải là tài sản nguyên bản của BioLearn.

| Ảnh mẫu | BioLearn |
|---|---|
| “Ngày 1, Ngày 2…” | “Trạm 1”, tên bài học hoặc tên kỹ năng |
| Đồng cỏ chung | Môi trường theo chương: tế bào, vi sinh, thực vật, di truyền... |
| Bệ đá giống nhau | Bệ riêng cho lesson, lab, Mini Boss, Boss và 3D |
| Tàu hoạt hình mẫu | Tàu khám phá/nhân vật BioLearn nguyên bản |
| Khóa vàng | Icon khóa BioLearn kèm lý do mở khóa |
| Bảng tiêu đề trò chơi | Tên lớp, chương và phần trăm hoàn thành |

Một tuyến mẫu:

```text
Trạm kiến thức → Thử thách → Phòng thí nghiệm → Mini Boss
       → Trạm 3D → Trạm kiến thức → Boss chương
```

## 4. Bố cục responsive

### Mobile dọc

- Đây là bố cục ưu tiên.
- Tuyến đường đi theo chiều dọc và uốn trái/phải.
- Vùng nhìn ban đầu chứa node hiện tại và hé lộ ít nhất một node kế tiếp.
- Thanh trạng thái nằm trong safe area và không che node.
- Station detail mở bằng bottom sheet.
- Nút chạm tối thiểu 44x44 px; không yêu cầu hover.

### Tablet

- Giữ tuyến dọc nhưng tăng khoảng trống cảnh quan.
- Có thể thấy 3 đến 5 node tùy kích thước.
- Station detail dùng bottom sheet hoặc side sheet tùy chiều xoay.

### Desktop web

- Có thể dùng tuyến rộng dạng chữ S như ảnh mẫu.
- Không kéo giãn node theo chiều rộng màn hình.
- Hỗ trợ wheel/trackpad, bàn phím và nút quay về vị trí hiện tại.

## 5. Phiên bản sáng và tối

Ảnh mẫu chỉ thể hiện nền sáng. Map V2 phải có hai biến thể cùng bố cục và cùng
độ rõ trạng thái.

### Light

- Cảm giác ban ngày, nền cảnh quan sáng nhưng không làm mờ đường ray/node.
- Bệ và nhãn có viền/bóng đủ để tách khỏi cảnh nền.
- Chữ tối trên bề mặt sáng; không dùng chữ trắng trên vàng nhạt.

### Dark

- Chuyển cảnh quan thành ban đêm/phòng thí nghiệm tối, không chỉ phủ một lớp đen.
- Đường ray, bệ và node có viền sáng vừa đủ; tránh hiệu ứng neon quá mạnh.
- Locked/current/completed giữ cùng hình dạng và icon như bản sáng.
- Các chi tiết trang trí giảm độ tương phản để không cạnh tranh với node.

### Quy tắc chung

- Không dùng màu là tín hiệu trạng thái duy nhất.
- Theme đổi trong lúc đang ở Map không được làm mất vị trí cuộn hay trạng thái.
- Cảnh nền có thể khác màu, nhưng geometry, thứ tự node và vùng chạm phải giống
  nhau giữa hai theme.

## 6. Tài sản hình ảnh cần sản xuất

Không bắt đầu vẽ toàn bộ asset trước khi wireframe được duyệt.

| Asset | Biến thể tối thiểu |
|---|---|
| Background theo chương | Light, dark, mobile-safe crop |
| Track/đường ray | Thẳng, cong trái, cong phải, nối chương |
| Station base | Normal, lab, Mini Boss, Boss, 3D, reward |
| Station state | Locked, available, current, completed, mastered |
| Phương tiện/avatar | Idle, moving, arrival |
| Trang trí | Theo chủ đề chương, không che vùng tương tác |
| FX | Unlock, complete, boss available; có reduced-motion fallback |

Asset phải có tên có hệ thống, nền trong suốt khi cần và kích thước nguồn đủ cho
màn hình mật độ điểm ảnh cao.

## 7. Tiêu chí đối chiếu trực quan

Map V2 chỉ đạt phần hình ảnh khi có thể trả lời “có” cho các câu sau:

- Nhìn trong hai giây có nhận ra node hiện tại và node kế tiếp không?
- Có hiểu tuyến đường đi theo thứ tự nào mà không cần đọc hướng dẫn không?
- Có phân biệt được lesson, lab, Mini Boss và Boss bằng hình dạng/icon không?
- Khi chỉ xem grayscale, locked/current/completed còn phân biệt được không?
- Ở 360x800, chữ, icon, track và node có bị chồng lên nhau không?
- Ở light và dark, nội dung chính có nổi hơn cảnh trang trí không?
- Map có mang chủ đề Sinh học của chương thay vì chỉ là bản sao ảnh mẫu không?
