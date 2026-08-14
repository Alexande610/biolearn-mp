# ADR-0002 - Monorepo, toolchain và topology ứng dụng

- **Trạng thái:** Accepted cho foundation
- **Ngày:** 2026-08-12
- **Roadmap:** `V2-A0`, chuẩn bị `V2-A1`

## Bối cảnh

V2 cần ứng dụng mobile cho học sinh, student web responsive, các web app vận
hành và runtime simulation. Các app phải dùng chung domain, contract và token
thiết kế nhưng có layout, session adapter và chu kỳ deploy riêng. Cây repository
trước đây chưa liệt kê `student-web`, dù blueprint và workflow yêu cầu một shell
student web ngay từ `V2-A1`.

Foundation cũng cần một toolchain có thể tái tạo từ máy sạch. Dùng lẫn npm/yarn/
pnpm hoặc lấy dependency `latest` trong CI sẽ làm lockfile và native build khó đối
soát. Ngược lại, thêm build orchestrator và nhiều package dùng chung quá sớm tạo
phức tạp chưa có giá trị đo được.

## Quyết định

### Workspace và runtime

- Dùng **pnpm workspace** với một `pnpm-lock.yaml` ở root và
  `pnpm-workspace.yaml` chỉ nhận `apps/*`, `packages/*`.
- Pin **Node.js 24 LTS** ở file version của repository và pin chính xác phiên bản
  pnpm trong trường `packageManager`. CI từ chối runtime/package manager lệch.
- Package nội bộ dùng `workspace:` để không vô tình lấy package cùng tên từ
  registry. Root là `private`; không publish package nếu chưa có ADR riêng.
- TypeScript `strict` dùng chung, cùng một lint/format/test baseline. App vẫn sở
  hữu config build đặc thù của nó.
- Chưa dùng Turborepo/Nx ở `V2-A1`. Root script dùng pnpm filter/recursive; chỉ
  thêm build graph/cache khi CI metric chứng minh đây là bottleneck.
- Dependency production được pin qua lockfile, audit trước khi merge và không
  dùng canary/beta nếu chưa có risk acceptance ghi thành văn bản.

### Các app

| App | Nền tảng | Trách nhiệm | Bắt đầu |
|---|---|---|---|
| `apps/mobile` | Expo SDK 57 + Expo Router | Trải nghiệm học sinh iOS/Android | V2-A1 |
| `apps/student-web` | Next.js App Router | Trải nghiệm học sinh responsive trên web | V2-A1 shell |
| `apps/teacher-web` | Next.js App Router | Lớp học, giao bài, quiz, báo cáo | V2-A5 |
| `apps/admin-web` | Next.js App Router | User, role, moderation, audit, vận hành | V2-A5 |
| `apps/content-studio` | Next.js App Router | Draft, review, approve, publish nội dung | V2-A5 |
| `apps/simulation-web` | Web runtime cô lập | Simulation 2D/3D cho WebView/web | Theo vertical slice |

`apps/mobile` không phải nguồn production cho student web. Hai app học sinh chia
sẻ `domain`, `contracts`, `api-client`, `curriculum` và `design-tokens`; không ép
dùng chung screen/component khi touch, accessibility hoặc desktop layout cần UI
khác. Cả hai gọi cùng query/command plane và canonical database, vì vậy việc tách
deployment không tách progress, leaderboard hoặc PvP.

Next.js route handler chỉ được dùng cho nhu cầu web-specific như cookie/session
adapter hoặc BFF mỏng đã đăng ký endpoint. Nó không được tạo backend nghiệp vụ
thứ hai hay bỏ qua command plane. Mọi route handler vẫn phải có schema, rate,
payload, timeout và observability policy.

### Phạm vi scaffold V2-A1

Chỉ tạo cấu trúc đang được dùng:

```text
apps/
  mobile/
  student-web/
packages/
  contracts/
  design-tokens/
  tooling/
supabase/
  migrations/
  seed/
  tests/
```

`api-client` được tạo khi có endpoint health/bootstrap typed đầu tiên. `domain`
được tạo khi use case thuần đầu tiên tồn tại. Không sinh hàng loạt thư mục rỗng
cho teacher/admin/PvP/3D trước gate tương ứng.

## Hệ quả

### Tích cực

- Mobile và student web có UX phù hợp nền tảng nhưng không nhân đôi nghiệp vụ.
- Một lockfile và toolchain pin giúp build, audit và rollback có thể lặp lại.
- Việc tách Vercel/EAS project không làm phân mảnh dữ liệu hoặc identity.

### Đánh đổi

- Có hai composition layer cho học sinh; cần contract test và parity checklist
  thay vì giả định dùng chung UI là tự động đồng nhất.
- pnpm workspace và native tooling cần được kiểm tra trên Windows, macOS và CI.
- `@supabase/ssr` có lifecycle riêng; phiên bản pin phải qua integration test khi
  nâng cấp.

## Phương án bị loại

1. **Chỉ Expo Web cho production student web:** giảm app nhưng làm desktop/SSR,
   cookie session và chu kỳ deploy phụ thuộc mobile; không khớp yêu cầu UI riêng.
2. **Một Vite SPA port nguyên legacy:** mang theo session/data-access và debt cũ.
3. **Tách mỗi app/domain thành repository riêng:** làm contract thay đổi khó
   atomic và tăng supply-chain/CI overhead ở giai đoạn foundation. V2 vẫn đặt
   toàn bộ monorepo trong một Git riêng theo ADR-0006.
4. **Turborepo/Nx từ ngày đầu:** chưa có build graph đủ lớn để biện minh thêm lớp
   cache/config.

## Bằng chứng tham chiếu

- [Expo monorepo support](https://docs.expo.dev/guides/monorepos/)
- [Expo SDK version matrix](https://docs.expo.dev/versions/latest/)
- [Next.js installation and requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [pnpm workspaces](https://pnpm.io/workspaces)
