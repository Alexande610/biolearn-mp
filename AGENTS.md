# Chỉ dẫn bắt buộc

Trước khi thay đổi dự án, phải đọc và tuân thủ toàn bộ
`docs/AGENTS.md`, `docs/PROJECT_REBUILD_ROADMAP.md` và
`docs/IMPLEMENTATION_STATUS.md`.

Mọi công việc BioLearn V2 phải đọc
`docs/BIOLEARN_V2_SYSTEM_BLUEPRINT.md`,
`docs/BIOLEARN_V2_REPOSITORY_STRUCTURE.md` và
`docs/AI_ENGINEERING_GUARDRAILS.md`. Mọi thay đổi không ngoại lệ phải đọc và tuân
thủ `docs/SECURITY_BASELINE.md`; công việc auth, API, dữ liệu, upload, Realtime,
PvP, quiz, AI, deploy hoặc hạ tầng phải đọc thêm
`docs/workflows/SECURITY_THREAT_MODEL.md` và ADR liên quan. Nếu thứ tự triển khai
trong roadmap cũ mâu thuẫn với blueprint V2, blueprint V2 được ưu tiên.

Trước khi scaffold V2 phải hoàn tất `V2-R0` theo
`docs/adr/ADR-0006-DEDICATED-V2-REPOSITORY-AND-DATA-ISOLATION.md`; không tạo code,
migration hoặc deploy V2 mới trong repository legacy.

Nếu công việc liên quan bài học, câu hỏi, thực hành, Mini Boss hoặc Boss, phải
đọc `docs/CURRICULUM_CONTENT_STANDARD.md` và
`docs/CURRICULUM_SOURCE_INVENTORY.md`.

Nếu công việc liên quan Map hoặc asset, phải mở ảnh
`docs/assets/map-journey-visual-reference.png` và đọc
`docs/MAP_VISUAL_REFERENCE.md` trước khi thiết kế hoặc sửa giao diện.

Nếu công việc liên quan trải nghiệm học viên, phải đọc
`docs/workflows/STUDENT_EXPERIENCE_V2.md`. Nếu liên quan splash, đăng nhập, Trạm
ngày hoặc background, phải đọc thêm
`docs/workflows/STARTUP_AUTH_DAILY_STATION_VISUAL_SPEC.md`.

Không được bỏ qua các quy tắc an toàn Git/database, giới hạn phạm vi và tiêu
chuẩn giao diện sáng/tối trong `docs/AGENTS.md`.
