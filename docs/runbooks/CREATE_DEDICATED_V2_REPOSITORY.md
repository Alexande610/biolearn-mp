# Runbook - Tạo repository BioLearn V2 độc lập

- **Trạng thái:** Đã chạy ngày 2026-08-13; xem bằng chứng trong `IMPLEMENTATION_STATUS.md`
- **Owner:** Repository owner + Platform/Security
- **ADR:** `ADR-0006-DEDICATED-V2-REPOSITORY-AND-DATA-ISOLATION.md`

Runbook này chuyển snapshot foundation hiện tại sang một Git mới mà không mang
lịch sử, secret, cấu hình deploy hoặc dữ liệu legacy. Không chạy lệnh tạo remote,
commit, push, deploy hay hosted database nếu chưa có đúng owner, tên repository
và phê duyệt tương ứng.

## 1. Thông tin phải chốt

| Trường | Giá trị đề xuất | Trạng thái |
|---|---|---|
| Git provider | GitHub | Đã xác nhận |
| Owner/organization | `Alexande610` | Đã xác nhận |
| Repository | `biolearn-v2` | Đã tạo private |
| Visibility | Private | Bắt buộc mặc định |
| Default branch | `main` | Đã chốt |
| Legacy remote | `Alexande610/biolearn-mp` | Chỉ đối chiếu |
| V2 database | Project mới cho từng environment | Chưa tạo; không dùng legacy |

## 2. Freeze và preflight

1. Ghi lại commit/ref nguồn và `git status`; không tự sửa/xóa thay đổi của người
   dùng.
2. Dừng scaffold/code/dependency/migration trong repository nguồn.
3. Quét secret trên file tracked, untracked được xuất, diff và Git history; mọi
   credential thật phải rotate/revoke trước khi push.
4. Kiểm tra file lớn, license asset, line ending, encoding và đường dẫn tuyệt đối.
5. Lập checksum cho asset được phép chuyển.

## 3. Export allowlist

Chỉ export các nhóm sau sau khi review:

```text
.gitignore
.node-version
AGENTS.md
README.md
docs/**/*.md
docs/assets/map-journey-visual-reference.png
```

Asset logo cũ là mục riêng, không tự động nằm trong allowlist:

```text
Nguồn: legacy main:public/images/Logo.png
Git blob: 6f344779ac0990e5a5853f68e6ccb32769aea4d5
Điều kiện: owner xác nhận quyền sử dụng + ghi asset inventory/checksum đích
```

Danh sách luôn loại trừ:

```text
.git/**
.env*
node_modules/**
.next/**
dist/**
coverage/**
documents/source/**
scratch/**
public/**                 # trừ asset được duyệt riêng
src/**                    # code legacy
supabase/**               # SQL/config legacy
vercel.json và config deploy legacy
```

Không dùng lệnh copy toàn repository rồi xóa bớt. Tạo thư mục đích trống và đưa
từng mục allowlist vào để file ngoài phạm vi không thể đi theo.

## 4. Khởi tạo repository mới

1. Tạo remote private trống, không sinh README/license/.gitignore tự động.
2. Tạo thư mục đích mới ngoài cây repository legacy; xác nhận đường dẫn tuyệt đối
   trước mọi thao tác.
3. Xuất allowlist đã review vào thư mục đích, không mang `.git` nguồn.
4. Khởi tạo Git mới với `main`, kiểm tra `git status` và chạy secret scan lại trên
   snapshot đích.
5. Review diff/file manifest, rồi mới tạo commit foundation đầu tiên.
6. Thêm đúng remote mới; xác nhận URL bằng `git remote -v` trước khi push.
7. Push `main` lần đầu, bật branch protection/ruleset và required checks.

Không force-push, không đổi remote `origin` của repository legacy và không thêm
remote cũ vào repository V2 với quyền push.

## 5. Khởi tạo dữ liệu và deploy sau khi tách

1. Tạo Supabase local từ migration V2 trống.
2. Tạo project staging mới; chạy migration, RLS test, malformed/oversized test,
   rate-limit test và synthetic seed.
3. Chỉ tạo production-v2 khi staging gate xanh và có owner chi phí/vận hành.
4. Tạo Vercel/EAS project mới, map biến môi trường theo public/server và theo
   environment; preview không có production secret.
5. Chưa nối domain production. Chỉ preview/internal build cho đến release gate.

## 6. Kiểm tra hoàn tất

- `git log --all` của V2 chỉ có lịch sử mới.
- Không có `.env`, key/token/password, code/SQL/config legacy ngoài allowlist.
- `main` mới có protection; CI có secret/dependency/SAST/test gates.
- Database V2 dựng được từ empty và không có connection string/project ID legacy.
- Preview web/mobile dùng dữ liệu test và có thể thu hồi độc lập.
- Repository/database legacy vẫn nguyên trạng và không bị deploy lại.

## 7. Rollback

Trước cutover production, rollback đơn giản là dừng V2 preview/staging và tiếp
tục dùng legacy; không cần sửa legacy. Sau cutover phải dùng runbook phát hành
riêng với DNS/domain rollback, database reconciliation và thời hạn lưu giữ.
