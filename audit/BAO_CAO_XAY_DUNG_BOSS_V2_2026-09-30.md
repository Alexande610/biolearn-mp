# Boss Battle V2 lớp 6 — kết quả xây dựng và thứ tự triển khai

Ngày: 30/09/2026. Trạng thái: bản thử nghiệm đã xây dựng và kiểm tra cục bộ; chưa triển khai database thật, chưa bật cho học viên thật. Không xác nhận hoàn tất phát hành sản phẩm.

## 1. Quy tắc đã chốt

- Giữ nguyên 10 bài, ID và tiến độ; sửa tên map theo nội dung database đã kiểm kê.
- Sau khi kết thúc một lượt ải thường, kể cả có câu sai, xét gặp boss với xác suất 35%. Mỗi ải chỉ xét một lần; không dùng chơi lại cùng ải để quay xác suất liên tục.
- Một mục tiêu boss cho mỗi học viên/bài. Thắng chỉ nhận thưởng một lần. Thua có thể gặp lại khi kết thúc ải khác còn đủ điều kiện.
- Lời mời tồn tại 5 phút từ lúc phát hiện. Chọn “Để sau” vẫn có thể vào trong thời hạn, không đặt lại đồng hồ.
- Kết thúc ải 10 giữ một cơ hội cuối nếu đang có hoặc vừa xuất hiện lời mời. Thắng, thua hoặc lời mời hết hạn sẽ đóng cơ hội của bài; bài đã hoàn thành từ trước không mở lại boss.
- Trận kéo dài tối đa 8 phút: 3 tim, boss 100 máu, mỗi câu đúng gây 10 sát thương; 10 câu đúng chiến thắng. Câu sai mất một tim, khiên không chặn.
- Khiên tối đa một, chặn một va chạm/đòn trên đường. Bình hồi một tim tối đa ba; đủ tim không dự trữ. Gợi ý nhặt và tiêu hao. Vũ khí mở câu hỏi đúng bài.
- Thưởng thiết kế: 1000 XP + 500 vàng khi thắng; thua không thưởng. Chế độ thử nghiệm không cộng tiền/XP thật.

## 2. Phần đã xây dựng

### Dữ liệu và luật phía máy chủ

`supabase_boss_battle_v2.sql` thêm bảng riêng cho cấu hình, câu hỏi, tiến độ boss, vé ải, trận và lịch sử trả lời. Mặc định OFF, RLS bật, học viên không đọc trực tiếp đáp án hoặc ghi trực tiếp bảng boss. RPC kiểm tra chủ trận, đồng hồ, máu, vật phẩm, đáp án và nhận thưởng. Giao dịch nhận thưởng dùng khóa và khóa duy nhất của sổ thưởng để chống nhận lặp; không sửa tiến độ ải thường.

Ngân hàng nháp `content/boss/grade6.json` có 150 câu, 15 câu cho mỗi bài; có đáp án, gợi ý và giải thích. Đây là nội dung mới cần duyệt học thuật, không tự coi là nội dung đã xuất bản. SQL nhập dùng INSERT ON CONFLICT DO NOTHING để không đè nội dung đã chỉnh sửa.

### Trải nghiệm chơi

Đã có màn giới thiệu, đồng hồ lời mời, bảng vật phẩm, đường chạy canvas với nhân vật/boss/chướng ngại/đạn/vật phẩm, nhảy bằng Space/mũi tên lên/chạm, HUD tim và máu boss, câu hỏi, gợi ý, phản hồi và kết quả. Đường chạy dừng khi đọc câu hỏi; đồng hồ trận vẫn chạy. Thông báo boss có thể thu nhỏ rồi mở lại trong thời hạn.

Đã nối việc xét boss vào kết thúc ải thường, độc lập với điều kiện trả lời đúng hết. Đường dẫn Boss cũ chuyển sang trang V2. Cờ frontend trong `.env.example` mặc định false; không thay `.env` thật.

## 3. Kiểm chứng đã thực hiện

- `npm test`: 75/75 đạt, gồm kiểm thử cũ và kiểm thử policy/database boss.
- Build production thành công. Còn cảnh báo bundle lớn của ứng dụng.
- Lint các thành phần Boss mới đạt.
- Kiểm thử database dùng PGlite với schema mô phỏng từ kết quả kiểm kê: SQL chạy lại được, mặc định tắt, hết hạn, quyền sở hữu, đáp án riêng tư, sai xuyên khiên, thưởng một lần, cơ hội cuối, tài khoản thử không nhận thưởng, bài cũ đã hoàn thành không mở vé.
- Giao diện cục bộ đã kiểm tra ở 1280×900 và 390×844; thử bắt đầu, dùng gợi ý, trả lời đúng làm máu 100→90. Ảnh lưu tại `audit/boss-preview/`.
- Giao diện xem thử dùng bộ mô phỏng DEV trong `scratch/boss-preview.jsx`, không chứng minh kết nối Supabase thật. Chưa kiểm thử độ trễ thực tế hoặc giao dịch đồng thời hai tab trên PostgreSQL thật.

## 4. Thứ tự chạy data

Thực hiện trên bản sao/staging database có schema giống hệ thống đã kiểm kê trước. Lưu bản sao lưu trước khi áp dụng lên database thật. Ba SQL kiểm kê trước đây chỉ đọc, không phải migration cần chạy lại để tạo boss.

1. Chạy `supabase_boss_battle_v2.sql` — tạo cấu trúc và RPC, tính năng vẫn tắt.
2. Chạy `generated/boss-releases/g6-boss-2026.1-draft.sql` — nhập 10 cấu hình và 150 câu nháp, vẫn tắt.
3. Kiểm tra bằng truy vấn bên dưới. Kỳ vọng 10 dòng, mỗi dòng 15 câu, enabled=false, test_only=true, security_ready=false.
4. Chỉ cho pilot tài khoản thử: chạy `generated/boss-releases/pilot-grade6-lesson1.sql`. Chỉ bài (6,1,1) bật thử, không thưởng thật. Dùng tài khoản sẵn có được quản trị xác nhận `is_test_account=true`; SQL pilot không tự đổi hồ sơ học viên.
5. Trên bản frontend thử nghiệm, đặt `VITE_BOSS_V2_ENABLED=true` rồi khởi động/build lại. Chơi bài 1 với tài khoản thử chưa hoàn thành bài đó; xác suất vẫn 35%, không ép boss luôn xuất hiện.
6. Chạy đủ checklist tại mục 5, sửa lỗi phát hiện rồi mới mở rộng thử sang các bài khác.
7. Hoàn tất các điều kiện an toàn tại mục 6 và duyệt câu hỏi trước khi lập migration mở thật. Không tự đặt `security_ready=true` để vượt điều kiện.

```sql
select l.class_id,l.chapter_id,l.lesson_id,l.title,
       l.enabled,l.reviewed,l.test_only,l.security_ready,
       l.encounter_chance,l.battle_seconds,count(q.id) as question_count
from public.boss_lessons l
left join public.boss_questions q
  on (q.class_id,q.chapter_id,q.lesson_id)=(l.class_id,l.chapter_id,l.lesson_id)
group by l.class_id,l.chapter_id,l.lesson_id
order by l.chapter_id,l.lesson_id;
```

Để dừng pilot, không xóa dữ liệu:

```sql
update public.boss_lessons set enabled=false where class_id=6;
```

Đồng thời đưa cờ frontend về false và build lại. Đây là dừng tính năng, không hoàn tác mọi thay đổi schema. Không xóa lịch sử hoặc sổ thưởng để rollback.

## 5. Checklist chơi thử thực tế

1. Hoàn thành ải có câu sai vẫn đủ điều kiện xét; không xét khi mới mở ải.
2. Chọn để sau, chuyển trang, tải lại: thời hạn lời mời giữ nguyên; hết 5 phút không vào được.
3. Câu đúng trừ đúng 10 máu; câu sai trừ một tim kể cả có khiên; gửi lại đáp án không trừ thêm.
4. Khiên không cộng dồn; va chạm tiêu hao một khiên; bình không tăng quá ba tim; gợi ý dùng đúng câu.
5. Thua sớm không có nút farm thử lại trực tiếp; kết thúc ải khác có thể gặp lại.
6. Cơ hội sau ải 10 đóng đúng khi thắng/thua/hết hạn; bài đã hoàn thành không xuất hiện lại.
7. Hai tab, mất mạng, tải lại, thoát trận, hết giờ: không tạo hai trận hoặc thưởng hai lần; trạng thái được phục hồi rõ ràng.
8. Tài khoản thử thắng vẫn giữ nguyên XP/vàng; tài khoản học viên thường không vào được pilot.
9. Kiểm tra nội dung câu hỏi cả 10 bài, điều khiển trên điện thoại và độ khó/nhịp vật phẩm trong trận 8 phút.

## 6. Phần còn phải hoàn tất trước phát hành thật

- RPC thưởng cũ `claim_map_reward` còn nhánh boss_1/2/3 chấp nhận yêu cầu thưởng chưa chứng minh thắng. Trang boss cũ đã thay thế nhưng đường backend cũ vẫn phải được khóa bằng migration tương thích.
- Quyền cập nhật hồ sơ hiện tại cho phép học viên sửa trực tiếp các trường thưởng. Cần chuyển các luồng liên quan sang RPC có kiểm tra trước khi thu hồi quyền; không thu hồi hàng loạt vì cửa hàng/thư/game khác đang phụ thuộc.
- Vé ải V2 do máy chủ phát và mỗi ải chỉ xét một lần, nhưng kết thúc ải thường hiện vẫn dựa vào callback cũ phía trình duyệt. Cần máy chủ xác nhận hoàn thành các câu/hoạt động trước khi cho xét boss để chống gọi RPC giả.
- Nếu mạng lỗi đúng lúc báo kết thúc ải, frontend hiện chưa có hàng đợi phục hồi bền vững cho sự kiện đó; cần kiểm thử và bổ sung phục hồi để không mất cơ hội boss.
- Duyệt 150 câu nháp, hoàn thiện giải thích và kiểm thử kết nối/độ trễ/đồng thời trên Supabase thật. Đường chạy đã được cập nhật ngẫu nhiên theo yêu cầu bổ sung ở mục 7; cần chơi thử để đánh giá mức thử thách.

Vì các điểm này còn tồn tại, bản hiện tại chỉ dành cho thử nghiệm, không được quảng bá là game đã phát hành hoàn chỉnh. `security_ready=false` là khóa phát hành có chủ đích. Chưa có SQL nào được chạy trên database thật trong lượt xây dựng này.

## 7. Điều chỉnh theo yêu cầu bổ sung — 30/09/2026

- Nền trang, canvas, câu hỏi, vật phẩm hướng dẫn và thông báo boss theo `body.light-theme` của hệ thống. Đổi chế độ không khởi động lại trận.
- Khi trận bắt đầu, màn chơi chiếm viewport. HUD và điều khiển nằm trong màn chơi. Câu hỏi là hộp thoại giữa màn hình với nền mờ; có điều khiển focus bằng bàn phím, cuộn nội dung khi cần trên màn hình nhỏ. Trả lời xong đóng hộp thoại và tiếp tục đường chạy.
- Máy chủ tạo và lưu lịch đường chạy riêng cho mỗi trận. Một sự kiện mỗi 1,5 giây; tại vị trí không dành cho vũ khí, xác suất là chướng ngại 30%, đạn boss 30%, gợi ý 12%, bình máu 12%, khiên 10%, trống 6%. Mật độ nguy hiểm trung bình tăng từ 2 lên khoảng 3–5 mỗi khoảng giữa hai vũ khí; từng trận có thể khác.
- Vũ khí cũng ngẫu nhiên, cách nhau 9–15 giây chạy. Giới hạn này tránh chờ vũ khí quá lâu. Khi đọc câu hỏi, thời gian đường chạy và các sự kiện ngừng, đồng hồ trận vẫn chạy như trước.
- Frontend nhận sự kiện sắp tới từ máy chủ để vẽ đúng vật phẩm và va chạm. Tải lại hoặc gọi bắt đầu lần nữa không tạo lịch mới. Một trận mới tạo lịch mới.
- Trận đã bắt đầu bằng phiên bản cũ được giữ lịch cũ đến khi kết thúc; không đổi chướng ngại giữa chừng hoặc đặt lại hạn trận.

Nếu **chưa chạy** migration Boss V2: dùng `supabase_boss_battle_v2.sql` đã cập nhật rồi tiếp tục thứ tự mục 4.

Nếu **đã chạy** migration Boss V2 trước thay đổi này: chạy thêm `generated/boss-releases/upgrade-arena-v2.sql` trên môi trường thử, sau đó cập nhật frontend cùng phiên bản. Không cần nhập lại câu hỏi hoặc bật lại cấu hình pilot. SQL nâng cấp chỉ thêm trường lịch chạy và thay ba hàm Boss; không đổi quyền hồ sơ, tiến độ thường, phần thưởng hoặc cờ mở thật. Nên cập nhật backend trước frontend để tránh frontend mới thiếu dữ liệu lịch.

Ảnh kiểm chứng mới: `quiz-centred-light.jpg`, `quiz-centred-dark.jpg`, `quiz-centred-mobile.jpg`, `arena-large-light.jpg` trong `audit/boss-preview/`. Kiểm thử thêm kiểm tra lịch được lưu, không quay lại khi tải lại, khoảng vũ khí ngẫu nhiên, SQL nâng cấp chạy lại được và giữ nguyên trận đang chạy. Giao diện xem thử vẫn là DEV fixture, chưa phải Supabase thật.

Kết quả kiểm tra sau điều chỉnh: toàn bộ 77/77 bài kiểm thử đạt; lint thành phần chỉnh sửa đạt. Đã thử hộp thoại nền sáng/tối, gợi ý, trả lời đúng 100→90 HP và tiếp tục đường chạy; kiểm tra điện thoại dọc 390×844 không tràn ngang, điện thoại ngang 844×390 cho phép cuộn hộp câu hỏi trong viewport.
