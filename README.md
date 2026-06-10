# NextGen BioLearn

NextGen BioLearn la ung dung web hoc Sinh hoc theo huong gamification cho hoc sinh lop 6 den lop 12. Du an dung React/Vite cho frontend, Supabase cho dang nhap, database, storage va realtime, ket hop cac man choi quiz, ban do bai hoc, PvP, phong quiz giao vien va cac mo phong Sinh hoc 3D.

> Luu y hien tai: nhieu chuoi tieng Viet trong source dang bi loi encoding. README nay chua sua encoding trong source theo dung yeu cau hien tai.

## Cong nghe

- React 19, Vite 8, React Router
- Tailwind CSS, lucide-react
- Supabase Auth, Postgres, Realtime, Storage
- Three.js, @react-three/fiber, @react-three/drei, Molstar
- Google GenAI cho chatbox AI

## Cau truc thu muc

```text
src/
  App.jsx                    # Khoi tao auth, route, user stats, nhac nen
  main.jsx                   # React entry
  lib/supabase.js            # Supabase client
  hooks/useAuth.js           # AuthContext hook
  pages/                     # Man hinh chinh
  components/                # UI, chatbox, nen galaxy
  components/biology3d/      # Mo hinh Sinh hoc 3D
  components/games/          # Game/mo phong 3D tuong tac
public/
  images/                    # Logo, avatar, hinh anh
  models/                    # GLB models
  music/                     # Nhac nen, SFX
  study/                     # Slide hoc tap theo lop
scratch/
  *.cjs, *.sql               # Script/patch du lieu Supabase
database.sql                 # Schema Supabase ban dau
database_update.sql          # Patch schema cu
pvp_final_setup.sql          # Schema va seed PvP/questions
```

## Cai dat va chay local

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_API_KEY=your_google_genai_key
```

3. Chay development server:

```bash
npm run dev
```

4. Build production:

```bash
npm run build
```

5. Kiem tra lint:

```bash
npm run lint
```

## Luong he thong

### 1. Khoi dong ung dung

`App.jsx` tao Supabase session, lang nghe `onAuthStateChange`, doc bang `profiles`, gop profile vao object user va tao `userStats`. App dieu huong theo role:

- `admin` vao `/admin`
- `teacher` vao `/teacher`
- `student` vao `/home`

Nen `GalaxyBackground` hien tren cac trang khong phai admin. `ChatboxAI` hien khi da dang nhap.

### 2. Dang nhap va dang ky

- `LoginPage.jsx` dung `supabase.auth.signInWithPassword`, `signUp` va Google OAuth qua `App.jsx`.
- `RegisterPage.jsx` tao tai khoan Supabase Auth.
- Trigger `handle_new_user()` trong SQL tao row `profiles` tuong ung khi co user moi.

### 3. Luong hoc sinh

1. Hoc sinh vao `/home`.
2. Chon lop 6-12, di den `/map/:classId`.
3. `MapPage.jsx` lay tien do tu `profiles.class_progress`.
4. Khi bam level, app mo `/play/:classId/:chapterId/:lessonId?level=n&type=...`.
5. `GamePlayPage.jsx` doc `lesson_questions` theo `class_id`, `chapter_id`, `lesson_id`, `level`.
6. Hoan thanh khong sai thi goi RPC `reward_user`, cap nhat XP, xu, diem, nhiem vu va `class_progress`.
7. Sai cau hoi se tru stamina/energy theo logic hien tai.

### 4. Mini game nang luong

`MiniGamePage.jsx` la game lat the. Neu chien thang, app cap nhat:

- `profiles.energy`
- `profiles.mini_game_claims_today`
- `profiles.last_active_at`

Moi ngay gioi han 2 lan nhan thuong.

### 5. Bang xep hang va PvP

- `/leaderboard` doc `profiles.weekly_score` cho bang xep hang tuan.
- Tab battle dung Supabase Realtime Presence va bang `pvp_queues` de ghep doi.
- Khi tim duoc doi thu, chuyen sang `/battle-pvp?room=...&class=...`.
- `BattlePvPPage.jsx` tao channel `battle:${roomId}`, host tai cau hoi tu `questions`, phat cau hoi qua broadcast, tinh diem va goi `reward_user` voi `p_reward_type = 'pvp'`.
- Ket qua tran duoc ghi vao `pvp_matches`.

### 6. Phong quiz giao vien

- `/teacher` cho role `teacher` hoac `admin`.
- Giao vien upload file cau hoi dang text, tao row trong `quiz_rooms`.
- Hoc sinh vao `/quiz-room`, nhap `room_code`.
- Giao vien va hoc sinh dung Supabase Realtime channel `room:${roomCode}` de broadcast: join, start, question, answer, result, ended.

### 7. Admin

- `/admin` hien thong ke user, user online gan day, yeu cau giao vien.
- `/admin/users` quan ly danh sach user va khoa/mo khoa tai khoan.
- `/admin/logs` doc `system_logs`.

## Supabase/database can co

Bang va cot frontend dang su dung:

- `profiles`
  - `id`, `email`, `username`, `display_name`, `avatar_url`, `role`
  - `xp`, `level`, `coins`, `total_score`, `weekly_score`, `pvp_score`
  - `stamina`, `max_stamina`, `last_stamina_update`
  - `energy`, `max_energy`, `mini_game_claims_today`, `last_active_at`
  - `daily_missions`, `inventory`, `class_progress`
  - `login_streak`, `last_streak_date`, `levels_completed`
  - `wins`, `losses`, `pvp_wins`, `last_class_id`
  - `is_locked`, `lock_reason`, `locked_at` neu dung tinh nang khoa tai khoan
- `lesson_questions`
  - unique theo `(class_id, chapter_id, lesson_id, level)`
  - chua `title`, `description`, `theory`, `game`, `boss_questions`
- `questions`
  - ngan hang cau hoi PvP/battle theo `class_id`
- `quiz_rooms`
  - phong quiz realtime cua giao vien
- `pvp_queues`
  - hang cho ghep tran PvP
- `pvp_matches`
  - lich su tran PvP
- `teacher_requests`
  - yeu cau cap ma giao vien
- `system_logs`
  - log he thong/admin

RPC frontend dang goi:

- `reward_user(p_user_id, p_xp_gain, p_coin_gain, p_reward_type, p_class_id)`
- `update_mission_progress(p_user_id, p_mission_id, p_progress_gain, p_is_absolute)`
- `reward_pvp(target_user_id, add_xp, add_coins, add_rank)` neu con dung flow cu

Storage:

- Bucket `avatars`, public read, cho phep user upload avatar cua minh.

Realtime:

- Bat Realtime cho `quiz_rooms`, `profiles` neu can presence/profile live.
- Bat Realtime/replica identity cho `pvp_queues` neu dung DB polling/fallback.

## Cac script du lieu

- `scratch/sync_biology_v3.cjs`, `scratch/sync_biology_v4.cjs`: dong bo du lieu `lesson_questions`.
- `scratch/seed_practice_data.cjs`: seed du lieu bai thuc hanh.
- `scratch/reward_system.sql`: them cot profile va tao RPC reward/mission.
- `scratch/update_reward_rpc.sql`: patch reward PvP.
- `scratch/redistribute_*.cjs`: phan bo lai level/cau hoi.

Truoc khi chay script CJS, can nap `.env` co `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`.

## Trang/route chinh

- `/` landing page
- `/login`, `/register`
- `/home`
- `/map/:classId`
- `/play/:classId/:chapterId/:lessonId`
- `/minigame/:classId`
- `/leaderboard`
- `/missions`
- `/profile`
- `/battle`, `/battle-pvp`
- `/simulations`, `/biology3d`
- `/teacher`, `/quiz-room`
- `/admin`, `/admin/users`, `/admin/logs`, `/admin/lessons`

## Tinh trang kiem tra gan nhat

- `npm run build`: pass.
- `npm run lint`: fail voi nhieu loi React Hooks/React Compiler, unused vars va mot so loi logic that su can sua.
- Cac file SQL chua hop nhat thanh migration duy nhat; can chuan hoa schema truoc khi deploy moi.
