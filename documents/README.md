# Nguồn tài liệu học thuật local

Thư mục `documents/source/` chứa PDF SGK Kết nối tri thức và TXT trích xuất để
định vị nội dung. Toàn bộ thư mục nguồn bị Git ignore và không phải asset runtime.
Các tệp hiện có trên máy được giữ nguyên, không bị xóa khi tạo nhánh nền V2.

## Quy tắc sử dụng

- PDF đã xác minh trực quan là nguồn đối chiếu; TXT/OCR chỉ hỗ trợ tìm kiếm.
- Không sửa PDF gốc, không ghi đè TXT và không tự động sửa OCR hàng loạt.
- Mọi bài học, câu hỏi, lab, Mini Boss và Boss phải ghi `sourceId`, `pdfPage`,
  `printedPage` khi có, yêu cầu cần đạt và trạng thái review.
- Không commit hoặc phát hành PDF/TXT khi quyền phân phối chưa được xác nhận.
- Không seed nội dung vào production từ thư mục này.
- Khi thêm hoặc thay nguồn, cập nhật hash và trạng thái trong
  `docs/CURRICULUM_SOURCE_INVENTORY.md`.

Đọc `docs/CURRICULUM_CONTENT_STANDARD.md` trước khi biên soạn nội dung.
