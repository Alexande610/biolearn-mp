# Runbook - Chuẩn bị môi trường local BioLearn V2

- **Roadmap:** `V2-A1.1`
- **Phạm vi:** máy phát triển; không liên kết hoặc thay đổi hosted Supabase
- **Nguồn version:** `.node-version` và root `package.json` sau khi scaffold

## 1. Điều kiện bắt buộc

- Windows 11/macOS/Linux được Node, Expo và Docker-compatible runtime hỗ trợ.
- Node đúng version trong `.node-version`; không chỉ có một binary khác nằm đâu
  đó trên máy.
- pnpm đúng exact version trong `packageManager`.
- Docker-compatible runtime đang chạy và dành ít nhất 7 GB RAM cho Supabase local.
- Android Studio/SDK cho Android development build; macOS + Xcode cho iOS build.

Không dùng production credential hoặc clone dữ liệu học sinh về local. Supabase
local không có TLS/rate limit production và tuyệt đối không expose ra Internet.

## 2. Preflight an toàn

Chạy từ root repository:

```powershell
git status --short --branch
node --version
corepack --version
pnpm --version
docker --version
```

Kết quả Node phải khớp `.node-version`. Nếu không khớp, dừng trước `pnpm install`.
Cài/activate Node bằng kênh chính thức hoặc version manager được team chấp nhận;
không sửa PATH bằng script tải binary không kiểm chứng.

Sau khi root manifest tồn tại, activate đúng pnpm theo version đã pin:

```powershell
corepack prepare pnpm@10.28.1 --activate
pnpm --version
```

Nếu Corepack yêu cầu quyền ghi ngoài workspace, thực hiện trong terminal người
dùng có chủ đích; không chạy elevation từ script dự án.

## 3. Cài dependency và kiểm tra supply chain

Lần tạo lockfile đầu dùng đúng Node/pnpm và chỉ các dependency trong kế hoạch A1.
Các lần sau dùng:

```powershell
pnpm install --frozen-lockfile
pnpm security:dependencies
pnpm security:secrets
```

Không dùng `--no-frozen-lockfile` trong CI, `audit fix --force`, canary/beta hoặc
nâng đồng loạt. Nếu có Critical/High, dừng trước build/deploy và ghi finding.

## 4. Supabase local

CLI sẽ là dev dependency project-scoped, gọi qua pnpm. Chỉ sau khi
`supabase/config.toml` đã được review:

```powershell
pnpm exec supabase start
pnpm exec supabase status
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm exec supabase stop
```

`db reset` ở đây chỉ hợp lệ khi CLI xác nhận target local. A1 không chạy:

```text
supabase link
supabase db push
supabase db pull
supabase db reset --linked
```

Không thêm script root trỏ đến các lệnh remote trên. Seed A1 chỉ synthetic và
phải fail closed nếu environment không phải local/test.

## 5. Biến môi trường

- `.env.example` chỉ placeholder giả và tên biến.
- `EXPO_PUBLIC_*`/`NEXT_PUBLIC_*` được xem là công khai, kể cả URL/publishable key.
- Service-role, DB password, signing/API secret không xuất hiện trong client env,
  Git, log, screenshot hoặc preview artifact.
- A1 local bootstrap không cần secret production; thiếu secret phải fail closed.

## 6. Xử lý lỗi thường gặp

| Lỗi | Hành động |
|---|---|
| Node khác `.node-version` | Dừng install, sửa version/PATH rồi mở terminal mới |
| pnpm khác `packageManager` | Activate exact version qua Corepack, không sửa manifest để khớp máy |
| Docker không có/không chạy | Chỉ chạy unit/docs; không tuyên bố DB/RLS gate đã pass |
| Supabase tải image thất bại | Kiểm tra Docker/network/quota; không chuyển sang hosted production để thử |
| Migration local lỗi | Sửa migration chưa deploy + test từ sạch; không bypass bằng Dashboard |
| Secret scanner finding | Không in giá trị; phân loại, revoke/rotate nếu thật rồi mới xử lý history |
| Expo peer mismatch | Dùng `expo install --check/fix` có review; không lấy React Native latest |

## 7. Bằng chứng phải lưu trong status

Ghi version thực tế, lệnh và exit code; build nào chưa chạy phải ghi rõ. Với UI,
ghi thiết bị/viewport + light/dark. Với database, ghi local project ID và xác nhận
không linked/remote nhưng không ghi key/password.

