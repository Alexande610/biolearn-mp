# Danh mục nguồn SGK Kết nối tri thức

Ngày kiểm kê: **2026-07-26**

Thư mục nguồn local hiện tại: `documents/source`

Thư mục này bị Git ignore. Danh mục, hash và trạng thái xác minh được commit;
PDF/TXT gốc chỉ được giữ local khi chưa xác nhận quyền phân phối.

## 1. Trạng thái kiểm định

| Trạng thái | Ý nghĩa |
|---|---|
| `DISCOVERED` | Đã thấy tệp, chưa kiểm tra trực quan |
| `COVER_VERIFIED` | Đã mở bìa, xác nhận lớp và bộ sách |
| `STRUCTURE_VERIFIED` | Đã kiểm tra bìa, mục lục, trang đầu/cuối và độ đầy đủ |
| `CANONICAL` | Được chọn làm PDF chuẩn cho biên soạn |
| `DUPLICATE_CANDIDATE` | Có thể trùng nguồn khác, chưa được xóa |
| `REJECTED` | Sai sách/phiên bản hoặc hỏng; giữ log lý do |

Không được dùng tên file hoặc metadata PDF làm bằng chứng duy nhất.

## 2. Danh mục PDF

| Source ID | Lớp | Tệp | Trang PDF | SHA-256 | Trạng thái |
|---|---:|---|---:|---|---|
| `SRC-KNTT-G06-A` | 6 | `Khoa học tự nhiên 6 kết nối tri thức với cuộc sống.pdf` | 237 | `48696ffa7cffde131b4362ba59865799601fd12649f6e284e62bca3380cefb92` | `DISCOVERED` |
| `SRC-KNTT-G07-A` | 7 | `SGK KHTN 7 KNTT.pdf` | 182 | `6cc432057c2605b7efe545b1885e52102ee3fadd0db8908f8f5eb3942eb4636c` | `DISCOVERED` |
| `SRC-KNTT-G08-A` | 8 | `khoa-hoc-tu-nhien-8-ket-noi-tri-thuc_317202375711.pdf` | 198 | `7efb1571ffc62831f9e907c13914852c370f0f9e6044625aa849bcb5ecbb32c7` | `COVER_VERIFIED`, `DUPLICATE_CANDIDATE` |
| `SRC-KNTT-G08-B` | 8 | `SGK KHTN 8 KNTT.pdf` | 199 | `66c47688ce5a128628edc4d844b0e3e8625a38444954c6da85627df9becbd167` | `COVER_VERIFIED`, `DUPLICATE_CANDIDATE` |
| `SRC-KNTT-G09-A` | 9 | `sach-giao-khoa-khoa-hoc-tu-nhien-9-ket-noi-tri-thuc-pdf.pdf` | 116 | `bcf5824f98d7d70b80778083482706efe904c92e6fe4ab54a431550e793bdc3d` | `COVER_VERIFIED`, cần kiểm tra độ đầy đủ |
| `SRC-KNTT-G10-A` | 10 | `sach-giao-khoa-sinh-hoc-10-ket-noi-tri-thuc-voi-cuoc-song.pdf` | 162 | `720e2d797f01c54d8791c8bb73cdf65c2ac00ea5213c0d0b330d7d4bc419d30c` | `DISCOVERED` |
| `SRC-KNTT-G11-A` | 11 | `Pdf sgk sinh 11 KNTT.pdf` | 190 | `004ca4ece7ee0a78dff48d68eaf6f4f1ab114d6f74e7d5809bd51ffc989da1fb` | `DISCOVERED` |
| `SRC-KNTT-G12-A` | 12 | `SGK Sinh 12 Kết Nối Tri Thức.pdf` | 199 | `f0fd1af075419236b237e9401b2e1dce9426b2433fd844d9d081a6bacf7a02f8` | `DISCOVERED` |

### Phát hiện quan trọng

- Hai PDF lớp 8 có bìa Khoa học tự nhiên 8 Kết nối tri thức gần như cùng nguồn,
  nhưng khác số trang, dung lượng và hash. Chưa được xóa tệp nào; cần so sánh mục
  lục, trang thiếu, chất lượng hình và chọn một bản `CANONICAL`.
- Metadata của `SRC-KNTT-G08-A` ghi “Sách giáo viên lớp 7 chân trời sáng tạo”
  nhưng bìa hiển thị là Khoa học tự nhiên 8 Kết nối tri thức. Metadata không đáng
  tin và không được dùng để phân loại tự động.
- PDF lớp 9 có 116 trang PDF, thấp hơn các nguồn khác. Có thể là trang đôi hoặc
  bản rút/ghép; phải kiểm tra độ đầy đủ trước khi chọn làm nguồn chuẩn.
- Tên file lớp 12 sử dụng Unicode tổ hợp. Không tự đổi tên cho đến khi cập nhật
  mọi tham chiếu và kiểm tra trên Windows, Git và mobile build.

## 3. Danh mục TXT

| Lớp | Tệp TXT | Số dòng gần đúng | Vai trò |
|---:|---|---:|---|
| 6 | `Khoa học tự nhiên 6 kết nối tri thức với cuộc sống.txt` | 6.641 | Chỉ tìm kiếm |
| 7 | `SGK KHTN 7 KNTT.txt` | 5.349 | Chỉ tìm kiếm |
| 8 | `SGK KHTN 8 KNTT.txt` | 6.186 | Chỉ tìm kiếm |
| 9 | `sach-giao-khoa-khoa-hoc-tu-nhien-9-ket-noi-tri-thuc-pdf.txt` | 7.532 | Chỉ tìm kiếm |
| 10 | `sach-giao-khoa-sinh-hoc-10-ket-noi-tri-thuc-voi-cuoc-song.txt` | 5.863 | Chỉ tìm kiếm |
| 11 | `Pdf sgk sinh 11 KNTT.txt` | 7.034 | Chỉ tìm kiếm |
| 12 | `SGK Sinh 12 Kết Nối Tri Thức.txt` | 6.946 | Chỉ tìm kiếm |

TXT chưa được đánh dấu `OCR_CORRECTED`. Không có TXT nào trong danh mục này được
coi là nội dung chuẩn.

## 4. Ví dụ lỗi đã quan sát

Trong TXT lớp 6 đã thấy các dạng:

- `THỰC HÀNH: @UAN SÁT` thay cho `THỰC HÀNH: QUAN SÁT`.
- `các loại nắm` có khả năng là `các loại nấm`.
- Rơi dấu/chữ trong “an toàn”, “phòng thực hành” và chú thích hình.
- Ký hiệu đầu dòng, số thứ tự, icon và cột bảng bị trộn vào câu.

Các ví dụ chỉ chứng minh có lỗi; không phải danh sách sửa tự động. Mọi sửa chữa
phải đối chiếu đúng trang PDF.

## 5. Việc cần hoàn tất cho từng lớp

| ID | Công việc | Kết quả |
|---|---|---|
| C0.1 | Xác minh bìa, mục lục, trang đầu/cuối | PDF đạt `STRUCTURE_VERIFIED` |
| C0.2 | Chọn PDF chuẩn, giải quyết nguồn trùng | Một `CANONICAL` cho mỗi lớp |
| C0.3 | Lập ma trận chương-bài-yêu cầu cần đạt | Curriculum matrix có nguồn |
| C0.4 | Lập danh sách toàn bộ bài thực hành | Practice matrix có trang PDF |
| C0.5 | Tạo glossary thuật ngữ và lỗi OCR | Bản sửa có truy vết |
| C0.6 | Duyệt chuyên môn theo lớp | Content đạt `BIOLOGY_REVIEWED` |

## 6. Mẫu biên bản xác minh nguồn

```md
### SRC-KNTT-G??-?

- Người kiểm tra:
- Ngày:
- Bìa/lớp/bộ sách:
- Năm xuất bản/lần in:
- Số trang PDF:
- Số trang in:
- Mục lục đầy đủ:
- Trang đầu/cuối:
- Chất lượng hình/bảng:
- TXT tương ứng:
- Nguồn trùng:
- Kết luận: STRUCTURE_VERIFIED | CANONICAL | REJECTED
- Ghi chú:
```
