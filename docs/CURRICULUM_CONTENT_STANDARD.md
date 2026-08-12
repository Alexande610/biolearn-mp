# Chuẩn nội dung Sinh học và quy trình kiểm định học thuật

## 1. Mục tiêu

Mọi bài học, câu hỏi, thử thách, thực hành, Mini Boss và Boss trong BioLearn phải:

- Bám Chương trình Giáo dục phổ thông hiện hành của Bộ Giáo dục và Đào tạo.
- Đúng lớp, đúng yêu cầu cần đạt và đúng mạch nội dung.
- Dùng thuật ngữ phù hợp với SGK bộ Kết nối tri thức với cuộc sống.
- Có nguồn truy vết đến đúng tài liệu và trang PDF.
- Không đưa lỗi OCR, lỗi dịch, ký hiệu sai hoặc suy diễn của AI vào sản phẩm.

Tệp TXT trong `documents/source` chỉ là bản hỗ trợ tìm kiếm. TXT không phải nguồn
chuẩn để xuất bản nội dung.

## 2. Thứ tự ưu tiên nguồn

Khi các nguồn khác nhau, áp dụng thứ tự sau:

1. Văn bản Chương trình GDPT hiện hành và các sửa đổi còn hiệu lực của Bộ GD&ĐT.
2. Yêu cầu cần đạt của môn Khoa học tự nhiên cấp THCS hoặc môn Sinh học cấp THPT.
3. Bản SGK Kết nối tri thức đúng lớp, đúng phiên bản, đã xác minh trực tiếp từ PDF.
4. Sách giáo viên/tài liệu hướng dẫn chính thức của Bộ hoặc Nhà xuất bản Giáo dục.
5. Nội dung đã được giáo viên/chuyên gia Sinh học duyệt và có nguồn trang.
6. TXT/OCR chỉ để định vị nội dung, không được dùng làm căn cứ cuối cùng.
7. Website, bài viết hoặc nội dung AI chỉ dùng tham khảo; không thay thế nguồn 1-5.

Nếu chương trình và SGK có khác biệt về cách sắp xếp, chương trình quyết định
“học sinh cần đạt gì”; SGK Kết nối tri thức quyết định ngữ cảnh, thứ tự bài,
thuật ngữ và hoạt động học tập của bộ sách mà dự án đang phục vụ.

## 3. Mốc pháp lý phải kiểm tra

Ngày xác minh gần nhất: **2026-07-26**.

| Nguồn | Vai trò | Liên kết chính thức |
|---|---|---|
| Thông tư 32/2018/TT-BGDĐT | Ban hành Chương trình GDPT 2018 | `https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1301/TT%2032.2018%20CTGDPT.pdf` |
| Văn bản hợp nhất 32/2018 và 20/2021 | Lộ trình và nội dung hợp nhất tại thời điểm ban hành | `https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1453/vbhn-322018-202021-ttbgddt-trinh-ky-xt.pdf` |
| Thông tư 13/2022/TT-BGDĐT | Sửa đổi một số nội dung Chương trình GDPT | `https://vanban.chinhphu.vn/?docid=206343&pageid=27160` |
| Thông tư 17/2025/TT-BGDĐT | Sửa đổi mới hơn đối với Chương trình GDPT | `https://vanban.chinhphu.vn/?docid=215347&pageid=27160` |
| Bộ sách Kết nối tri thức | Xác minh bộ sách và thông tin xuất bản | `https://nxbgd.vn/chuyen-muc/bo-sach-ket-noi-tri-thuc-voi-cuoc-song` |

Không mặc định mọi thông tư sửa đổi đều thay đổi môn Sinh học. Với mỗi lần cập
nhật chương trình, phải đọc phụ lục và ghi rõ lớp/mạch nội dung nào bị ảnh hưởng.

Trước mỗi đợt biên soạn lớn hoặc đầu năm học, phải kiểm tra lại nguồn chính thức
và cập nhật ngày xác minh.

## 4. Cổng trạng thái nội dung

Mỗi đơn vị nội dung phải đi qua đúng thứ tự:

```text
RAW_TXT
  → PDF_LOCATED
  → OCR_CORRECTED
  → CURRICULUM_MAPPED
  → BIOLOGY_REVIEWED
  → APPROVED
  → PUBLISHED
```

| Trạng thái | Ý nghĩa | Có được đưa vào sản phẩm không |
|---|---|---:|
| `RAW_TXT` | Văn bản trích xuất chưa kiểm tra | Không |
| `PDF_LOCATED` | Đã tìm đúng PDF và trang | Không |
| `OCR_CORRECTED` | Đã sửa lỗi bằng cách nhìn PDF | Không |
| `CURRICULUM_MAPPED` | Đã gắn yêu cầu cần đạt và đúng lớp | Không |
| `BIOLOGY_REVIEWED` | Đã duyệt thuật ngữ, kiến thức, hình và thực hành | Chỉ staging |
| `APPROVED` | Đủ nguồn, review và QA | Có |
| `PUBLISHED` | Đã phát hành với version cụ thể | Có |

Frontend production chỉ được đọc content ở trạng thái `APPROVED` hoặc
`PUBLISHED`.

## 5. Bản ghi nội dung chuẩn

Mỗi bài/trạm/activity cần có tối thiểu:

```ts
type CurriculumContent = {
  id: string;
  version: number;
  grade: 6 | 7 | 8 | 9 | 10 | 11 | 12;
  subject: "khtn" | "sinh_hoc";
  textbookSeries: "ket_noi_tri_thuc";
  chapter: string;
  lesson: string;
  learningOutcomeIds: string[];
  contentType: "lesson" | "question" | "lab" | "mini_boss" | "boss";
  sourceRefs: Array<{
    sourceId: string;
    pdfPage: number;
    printedPage?: number;
    section?: string;
  }>;
  verificationStatus:
    | "raw_txt"
    | "pdf_located"
    | "ocr_corrected"
    | "curriculum_mapped"
    | "biology_reviewed"
    | "approved"
    | "published";
  reviewedBy?: string;
  reviewedAt?: string;
  correctionNotes?: string[];
};
```

`pdfPage` là số trang trong tệp PDF; `printedPage` là số in trên trang sách.
Hai số có thể khác nhau và phải ghi riêng.

## 6. Quy trình xử lý PDF/TXT

### Bước 1: Xác minh tài liệu

- Mở bìa PDF, xác nhận lớp, bộ Kết nối tri thức và Nhà xuất bản.
- Kiểm tra mục lục, số trang, trang đầu và trang cuối.
- Ghi SHA-256 để biết tài liệu có bị thay đổi hay không.
- Nếu có hai PDF cùng tên sách, không tự xóa; so sánh độ đầy đủ và chất lượng.

### Bước 2: Định vị bằng TXT

- Dùng TXT để tìm tên chương, bài, thuật ngữ hoặc cụm “THỰC HÀNH”.
- Không sao chép nguyên văn TXT vào database.
- Ghi lại vị trí dòng chỉ để hỗ trợ tìm kiếm; nguồn chính vẫn là trang PDF.

### Bước 3: Đọc trực tiếp PDF

- Mở trang PDF chứa mục tiêu, kiến thức, hình/bảng và hoạt động.
- Với sơ đồ, bảng, chỉ số trên/dưới, công thức, tên Latin và ký hiệu di truyền,
  phải kiểm tra bằng hình ảnh trang; text extraction không đủ tin cậy.
- Ghi `sourceId`, `pdfPage`, `printedPage` và section.

### Bước 4: Hiệu đính OCR

- Sửa từng nội dung dựa trên trang PDF, không đoán theo ngữ cảnh.
- Không chạy replace hàng loạt với thuật ngữ khoa học nếu chưa kiểm tra từng chỗ.
- Bảo toàn dấu tiếng Việt, chữ nghiêng tên loài, chỉ số, đơn vị và ký hiệu.
- Mọi sửa chữa cần có `correctionNotes` hoặc glossary truy vết.

### Bước 5: Đối chiếu chương trình

- Gắn đúng yêu cầu cần đạt, lớp, chủ đề và mức độ nhận thức.
- Không đưa kiến thức lớp trên vào như yêu cầu bắt buộc của lớp dưới.
- Nội dung mở rộng phải được gắn nhãn “Mở rộng”, không dùng để khóa tiến trình.

### Bước 6: Duyệt và phát hành

- Người soạn không tự là người duyệt cuối nếu có thể bố trí reviewer độc lập.
- Reviewer kiểm tra kiến thức, thuật ngữ, đáp án, hình và quy trình thực hành.
- QA kiểm tra hiển thị, theme, mobile, encoding và nguồn trang.
- Chỉ bản `APPROVED` mới được seed hoặc publish.

## 7. Những lỗi TXT phải chủ động tìm

- Mất hoặc sai dấu tiếng Việt.
- Nhầm ký tự: `@UAN SÁT` thay cho `QUAN SÁT`, `nắm` thay cho `nấm`.
- Rơi chữ cái, đảo từ, ngắt dòng giữa một thuật ngữ.
- Nhầm `0/O`, `1/l/I`, `rn/m`, dấu gạch và dấu âm.
- Mất chỉ số trong công thức, allele, kiểu gene hoặc đơn vị.
- Trộn chú thích hình vào đoạn kiến thức.
- Đảo thứ tự cột/hàng khi trích xuất bảng.
- Mất mũi tên, ký hiệu quan hệ, tên trục biểu đồ.
- Dịch máy một thuật ngữ vốn không cần dịch hoặc dùng thuật ngữ không có trong SGK.

Phát hiện tự động chỉ tạo cảnh báo; không được tự sửa và tự duyệt.

## 8. Chuẩn biên soạn bài thực hành

### 8.1. Căn cứ bắt buộc

Mỗi bài thực hành phải truy được đến:

- Yêu cầu cần đạt của chương trình.
- Tên bài/hoạt động trong SGK Kết nối tri thức.
- Trang mục tiêu, chuẩn bị, cách tiến hành và báo cáo trong PDF.

Nếu không tìm đủ nguồn trên, activity chưa được gọi là bài thực hành chính thức.

### 8.2. Cấu trúc bắt buộc

```text
Mục tiêu
→ Chuẩn bị/dụng cụ/mẫu vật
→ An toàn
→ Biến và giả thuyết (nếu có)
→ Các bước học sinh thao tác
→ Quan sát/số đo
→ Bảng kết quả
→ Phân tích
→ Kết luận
→ Tự đánh giá/feedback
```

Không thay toàn bộ cấu trúc này bằng câu hỏi trắc nghiệm.

### 8.3. Loại thực hành

| Loại | Cách triển khai |
|---|---|
| `physical_guided` | Hướng dẫn thực hành thật; app hỗ trợ bước, thời gian và báo cáo |
| `virtual_simulation` | Mô phỏng biến, kết quả và quan sát khi phù hợp |
| `observation` | Xem mẫu/hình/mô hình, ghi đặc điểm và bằng chứng |
| `measurement` | Học sinh đo, nhập số liệu, đơn vị và sai số |
| `data_analysis` | Phân tích bảng/đồ thị/dữ liệu từ thí nghiệm |
| `hybrid` | Thao tác thật kết hợp ghi nhận/đánh giá trong app |

Không mô tả mô phỏng số như thể học sinh đã thực hiện thí nghiệm vật lý thật.

### 8.4. An toàn

- Cảnh báo an toàn phải lấy từ SGK/tài liệu hướng dẫn đáng tin cậy.
- Không hướng dẫn học sinh tự làm với hóa chất, lửa, điện, vi sinh vật hoặc mẫu
  sinh học có rủi ro nếu thiếu giám sát.
- Hoạt động có rủi ro phải ghi điều kiện giáo viên/phòng thí nghiệm.
- Phiên bản mobile phải có bước xác nhận an toàn trước khi bắt đầu.

### 8.5. Đánh giá

Điểm thực hành dựa trên evidence: thao tác, quan sát, số liệu, phân tích và kết
luận. Trắc nghiệm có thể dùng ở phần chuẩn bị hoặc củng cố, nhưng không phải toàn
bộ bài thực hành.

## 9. Quy tắc dùng AI

AI được phép:

- Tìm vị trí có khả năng lỗi OCR.
- So sánh hai bản trích xuất.
- Soạn nháp câu hỏi/activity từ nội dung đã có nguồn.
- Kiểm tra schema, độ phủ và lỗi logic.

AI không được:

- Tự quyết định thuật ngữ đúng khi PDF và TXT khác nhau.
- Tạo “kiến thức hợp lý” nhưng không có nguồn trong chương trình/SGK.
- Tự phê duyệt đáp án, quy trình thực hành hoặc cảnh báo an toàn.
- Chuyển content sang `APPROVED` nếu chưa có review được ghi nhận.

## 10. Quy tắc sửa và cập nhật nội dung

- Không sửa trực tiếp PDF nguồn.
- Không ghi đè TXT nguồn đã có; nếu làm bản sạch, tạo file/version mới.
- Không chạy seed xóa trước khi bản dữ liệu mới được duyệt và backup.
- Mọi content phát hành có version; sửa kiến thức tạo version mới.
- Khi phát hiện lỗi đã publish, ẩn version lỗi, ghi correction log và phát hành
  version mới; không âm thầm thay đáp án.
