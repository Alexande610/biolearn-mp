# Quy trình dữ liệu Trạm Sinh Học

## Mục tiêu và phạm vi

- Lớp 6 đến lớp 12, mỗi lớp có ba trạm đang hoạt động và một trạm tương lai bị khóa.
- Mỗi trạm có 10 ải. Mỗi ải phát hành phải có đúng năm trò chơi khác loại: `quiz`, `match`, `fill`, `category`, `dragdrop`.
- Thứ tự năm trò chơi và các lựa chọn được đảo khi học sinh bắt đầu lượt chơi.
- JSON là bản nguồn để biên tập, soát lỗi và lưu lịch sử Git. Supabase là dữ liệu chạy thực tế.
- TXT OCR chỉ hỗ trợ tìm kiếm. Nội dung cuối phải đối chiếu lại PDF/SGK và chương trình chính thức.

## Vì sao dùng 21 JSON

21 tệp tương ứng chính xác với 7 khối lớp × 3 trạm đang hoạt động. Một tệp chứa trọn 10 ải của một trạm, giúp người duyệt đọc theo chủ đề, xem diff rõ và hoàn tác độc lập. JSON không được tải trực tiếp ở trình duyệt nên không làm tăng gói JavaScript. Bộ chuyển đổi đưa bản đã duyệt vào Supabase; ứng dụng chỉ tải đúng năm trò chơi của ải hiện tại.

## Trạng thái triển khai

| Khối | Trạm | Trạng thái |
|---|---|---|
| 6 | `g6_st1` Kính hiển vi và tế bào | Đã soạn đủ 10 ải/50 trò, đang ở `draft`; cần nhập lại bản đã hiệu chỉnh nguồn trước khi duyệt |
| 6 | `g6_st2` Từ tế bào đến cơ thể | Đã soạn đủ 10 ải/50 trò, đang chờ nhập `draft` và duyệt |
| 6 | `g6_st3` Đa dạng thế giới sống | Đã soạn đủ 10 ải/50 trò, đang chờ nhập `draft` và duyệt |
| 7–12 | 18 trạm hoạt động | Chờ biên soạn và duyệt |
| 6–12 | Bảy trạm thứ tư | Giữ khóa, không tạo bản phát hành |

## Trình tự an toàn

1. Chạy `npm test`, `npm run validate:stations`, lint riêng tệp thay đổi và `npm run build`.
2. Chạy `supabase_station_content_v2.sql`. Migration này chỉ thêm bảng/hàm/chính sách, không xóa bảng `station_questions` và không đổi tiến trình cũ.
3. Tạo SQL nháp từ JSON bằng `npm run build:station-release -- <file.json> <output.sql>`.
4. Chạy SQL nháp, kiểm tra đủ 10 ải và 50 trò. Không có thay đổi phía học sinh ở bước này.
5. Người duyệt kiểm tra kiến thức, chính tả, độ tuổi, nguồn và thử đủ năm kiểu trò chơi.
6. Gọi `admin_publish_station_release(release_id)`. Bản cũ được lưu để hoàn tác; nội dung đã phát hành bị khóa sửa trực tiếp.
7. Lặp lại cho đủ 21 trạm.
8. Chỉ sau khi 21 trạm đều có bản V2 hoàn chỉnh mới chạy `supabase_station_content_v2_cutover.sql`. Migration này tự chặn nếu thiếu bất kỳ trạm nào; khi đạt điều kiện, nó khóa đường đọc đáp án và tự khai sao của hệ thống cũ.

## Bảo mật và tính toàn vẹn

- Trình duyệt chỉ nhận `public_content`; `answer_key` chỉ được đọc trong hàm chấm điểm `security definer`.
- Mỗi câu có tối đa hai lượt trả lời. Sao được tính trên máy chủ từ kết quả của năm trò chơi.
- Học sinh không có quyền đọc bảng chứa đáp án hoặc ghi trực tiếp kết quả.
- Một bản đã phát hành hoặc lưu trữ không thể sửa nội dung; muốn sửa phải tạo version mới.
- Cutover không thể chạy sớm vì có kiểm tra đủ 21 bản phát hành, mỗi bản 50 mục.
- Khi chạy bản nháp trong Supabase SQL Editor, `auth.uid()` không có JWT. SQL nhập liệu sẽ chọn một hồ sơ có vai trò `admin` làm chủ sở hữu và tự dừng nếu chưa có hồ sơ admin; cột `created_by` không được nới lỏng thành nullable.

## Nguồn chuẩn

- PDF SGK Kết nối tri thức trong `documents/source/`.
- [Chương trình giáo dục phổ thông 2018 của Bộ GDĐT](https://moet.gov.vn/content/tintuc/Lists/News/Attachments/8421/chuong-trinh-tong-the-ctgdpt-2018.pdf).
- [Chương trình môn Sinh học của Bộ GDĐT](https://moet.gov.vn/content/vanban/Lists/VBDT/Attachments/1582/8-mon-sinh-hoc-thpt-cap-gdtx---ngay-26122022.pdf).
- [Bộ sách Kết nối tri thức với cuộc sống của NXBGDVN](https://www.nxbgd.vn/chuyen-muc/bo-sach-ket-noi-tri-thuc-voi-cuoc-song).

## Hoàn tác

Không sửa hoặc xóa release đang chạy. Khi cần quay lại, dùng chức năng phát hành để trỏ `station_content_publications` về release cũ đã duyệt. Tiến trình học và lịch sử lượt chơi vẫn giữ nguyên vì release và kết quả được lưu riêng.
