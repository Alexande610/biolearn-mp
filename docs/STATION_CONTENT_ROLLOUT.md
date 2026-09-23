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
| 6 | `g6_st1` Kính hiển vi và tế bào | Đã soạn đủ 10 ải/50 trò; người vận hành báo đã chạy SQL nháp; cần xác minh trên Supabase và duyệt |
| 6 | `g6_st2` Từ tế bào đến cơ thể | Đã soạn đủ 10 ải/50 trò; người vận hành báo đã chạy SQL nháp; cần xác minh trên Supabase và duyệt |
| 6 | `g6_st3` Đa dạng thế giới sống | Đã soạn đủ 10 ải/50 trò; người vận hành báo đã chạy SQL nháp; cần xác minh trên Supabase và duyệt |
| 7 | `g7_st1` Quang hợp và dinh dưỡng thực vật | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 7 | `g7_st2` Hô hấp và trao đổi ở sinh vật | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 7 | `g7_st3` Cảm ứng, sinh trưởng và sinh sản | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 8 | `g8_st1` Vận động, dinh dưỡng và tuần hoàn | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 8 | `g8_st2` Điều hoà cơ thể người | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 8 | `g8_st3` Sinh vật và môi trường | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 9 | `g9_st1` Mendel, nucleic acid và gene | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 9 | `g9_st2` Gene, nhiễm sắc thể và di truyền người | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 9 | `g9_st3` Tiến hoá | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 10 | `g10_st1` Thành phần hoá học và cấu trúc tế bào | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 10 | `g10_st2` Trao đổi và chuyển hoá trong tế bào | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 10 | `g10_st3` Phân bào, vi sinh vật và virus | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 11 | `g11_st1` Trao đổi chất và chuyển hoá năng lượng | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 11 | `g11_st2` Cảm ứng, sinh trưởng và phát triển | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 11 | `g11_st3` Sinh sản và tích hợp sinh lí | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 12 | `g12_st1` Di truyền phân tử và nhiễm sắc thể | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 12 | `g12_st2` Di truyền mở rộng và tiến hoá | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
| 12 | `g12_st3` Sinh thái, bảo tồn và phát triển bền vững | Đã soạn đủ 10 ải/50 trò ở `draft`, có SQL nháp; cần duyệt kiến thức, thử giao diện và nhập Supabase |
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

### Điểm tiếp tục sau khi chạy ba SQL lớp 6

Người vận hành đã báo chạy đủ ba SQL lớp 6. Chưa có kết quả truy vấn xác minh trên Supabase được ghi nhận trong repo, nên không coi ba bản nháp là đã phát hành. Kiểm tra `status = draft`, `item_count = 50`, `day_count = 10` cho từng release và thử năm trò trên giao diện trước khi phát hành.

Các trạm lớp 7–12 có nguồn tại `content/stations/grade-07/` đến `grade-12/` và SQL nháp tại `generated/station-releases/`. Trước khi chạy SQL, người duyệt cần đọc lại nội dung trên PDF gốc và xác nhận câu chữ, đáp án cùng giao diện. Các nguồn SGK lớp 12 có vài nhãn số bài không rõ trong bản TXT OCR nên tham chiếu theo tên chương/chủ đề; khi duyệt phải kiểm tra lại PDF gốc. SQL chỉ tạo/cập nhật release `draft`.

Để xác minh các bản nháp đã nhập vào Supabase, chạy truy vấn chỉ đọc sau trong SQL Editor. Mỗi release đã nhập đúng phải có `status = draft`, `item_count = 50`, `day_count = 10`, `game_type_count = 5`. Trạm chưa nhập sẽ không xuất hiện.

```sql
select r.grade, r.station_id, r.version, r.status,
       count(i.id) as item_count,
       count(distinct i.day_index) as day_count,
       count(distinct i.game_type) as game_type_count
from public.station_content_releases r
left join public.station_content_items i on i.release_id = r.id
where r.version ~ '^g(6|7|8|9|10|11|12)-st[1-3]-2026[.]1$'
group by r.id, r.grade, r.station_id, r.version, r.status
order by r.grade, r.station_id;
```

Sau khi nhập từng trạm, kiểm tra các ải lỗi; truy vấn này phải trả về 0 dòng cho những release đã nhập:

```sql
select r.version, i.day_index, count(*) as game_count,
       count(distinct i.game_type) as unique_game_types
from public.station_content_releases r
join public.station_content_items i on i.release_id = r.id
where r.version ~ '^g(6|7|8|9|10|11|12)-st[1-3]-2026[.]1$'
group by r.version, i.day_index
having count(*) <> 5 or count(distinct i.game_type) <> 5
order by r.version, i.day_index;
```

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
