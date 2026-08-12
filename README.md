# BioLearn V2 Foundation

Nhánh `biolearn-v2-foundation` là nền trắng để xây BioLearn V2 cho học sinh trên
ứng dụng mobile và web. Nhánh này không kế thừa code, cấu hình triển khai hay SQL
legacy. Hệ thống cũ vẫn được giữ nguyên trên `democode` và `main` để đối chiếu
nghiệp vụ, asset và dữ liệu khi có kế hoạch migration riêng.

## Trạng thái

- Giai đoạn hiện hành: `V2-A0` - khóa kiến trúc, inventory, threat model và
  vertical slice; chưa scaffold ứng dụng và chưa chạy migration.
- Kiến trúc: modular monolith trên Supabase/Postgres, backend-first về nghiệp vụ,
  mobile-first về trải nghiệm và có student web responsive riêng.
- Phạm vi ưu tiên: trải nghiệm học viên. Teacher, Admin và Content Studio chỉ
  được phát triển sau khi các gate tương ứng trong blueprint đạt.

## Tài liệu bắt buộc

Đọc theo thứ tự trước khi thay đổi dự án:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/AGENTS.md`](docs/AGENTS.md)
3. [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)
4. [`docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md`](docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md)
5. [`docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md`](docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md)
6. [`docs/AI_ENGINEERING_GUARDRAILS.md`](docs/AI_ENGINEERING_GUARDRAILS.md)
7. [`docs/PROJECT_REBUILD_ROADMAP.md`](docs/PROJECT_REBUILD_ROADMAP.md)

Tài liệu chuyên biệt:

- [`docs/workflows/STUDENT_EXPERIENCE_V2.md`](docs/workflows/STUDENT_EXPERIENCE_V2.md):
  luồng và phản biện trải nghiệm học viên mobile/web.
- [`docs/CURRICULUM_CONTENT_STANDARD.md`](docs/CURRICULUM_CONTENT_STANDARD.md):
  nguồn, kiểm định học thuật và quy trình nội dung.
- [`docs/CURRICULUM_SOURCE_INVENTORY.md`](docs/CURRICULUM_SOURCE_INVENTORY.md):
  danh mục SGK local và trạng thái xác minh.
- [`docs/MAP_VISUAL_REFERENCE.md`](docs/MAP_VISUAL_REFERENCE.md): căn cứ Map,
  responsive, light/dark và giới hạn không sao chép.
- [`docs/assets/references/README.md`](docs/assets/references/README.md): danh mục
  ảnh tham khảo do người dùng cung cấp.
- [`documents/README.md`](documents/README.md): cách quản lý PDF/TXT nguồn local.

## Nguyên tắc khởi tạo

- Không copy component, SQL hoặc cấu hình legacy vào V2 theo kiểu từng file.
- Chỉ tạo đường dẫn khi có roadmap ID, domain owner, contract và kiểm tra rõ.
- Screen không gọi Supabase trực tiếp; client không tự quyết định reward,
  progress, streak, role, leaderboard, quiz hoặc PvP.
- Nội dung phải có `sourceRefs`, version và trạng thái duyệt; TXT/OCR không phải
  nguồn xuất bản.
- Student mobile và student web dùng chung domain, contracts, API client và
  design tokens, nhưng có UI phù hợp riêng cho cảm ứng và desktop.
- PDF/TXT SGK trong `documents/source/` là local-only, không được Git theo dõi hay
  đưa vào bundle sản phẩm khi chưa xác nhận quyền phân phối.

## Cây hiện tại

```text
AGENTS.md
README.md
docs/
  AGENTS.md
  *.md
  workflows/
  assets/
documents/
  README.md
  source/                 # local-only, bị ignore
```

`apps/`, `packages/` và `supabase/` chỉ được tạo ở `V2-A1` sau khi `V2-A0` được
duyệt. Không tạo skeleton rỗng để làm repository trông như đã triển khai.
