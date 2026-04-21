const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const NEXTGEN_DIR = 'c:/TailieucuaMintPhut/sinh học/KL/NextGen';
const AREAS_DIR = 'c:/TailieucuaMintPhut/sinh học/KL/areas/Sinhhoc';
require('dotenv').config({ path: path.join(NEXTGEN_DIR, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const classFileMap = { "6": "class6", "7": "class7", "8": "class8", "9": "class9", "10": "class10", "11": "class11", "12": "class12" };

async function syncAll() {
  console.log('🚀 Bắt đầu khôi phục và phân phối lại dữ liệu Sinh học (V4 - Tăng mật độ câu hỏi)...');
  const classData = JSON.parse(fs.readFileSync(path.join(NEXTGEN_DIR, 'scratch/full_class_data.json'), 'utf8'));

  for (const grade in classData) {
    const gradeDirName = classFileMap[grade];
    if (!gradeDirName) continue;
    const chapters = classData[grade].chapters;
    
    for (const chapter of chapters) {
      for (const lessonMeta of chapter.lessons) {
        const lessonId = lessonMeta.id;
        const filePath = path.join(AREAS_DIR, gradeDirName, 'ketnoi', `lesson${lessonId}.cjs`);
        if (!fs.existsSync(filePath)) continue;

        const sourceData = require(filePath);
        const normalQuestions = sourceData.game || [];
        const bossQuestions = sourceData.bossQuestions || [];
        const allPool = [...normalQuestions, ...bossQuestions]; // Gộp chung data để đa dạng

        console.log(`  📦 Bài ${lessonId}: Tổng pool ${allPool.length} câu hỏi.`);

        for (let level = 0; level < 10; level++) {
          let levelQuestions = [];
          
          if (level === 9) {
            // Màn 10 (index 9) là Boss Level
            const bossPool = bossQuestions.length >= 5 ? bossQuestions : allPool;
            levelQuestions = shuffle([...bossPool]).slice(0, 5);
          } else {
            // Các màn khác: lấy ngẫu nhiên 5 câu từ bộ pool
            // Để tránh lặp lại hoàn toàn giữa các màn gần nhau, ta dùng shuffle có kiểm soát
            const shuffled = shuffle([...allPool]);
            levelQuestions = shuffled.slice(0, 5);
            
            // Nếu bài học quá ít câu hỏi (ví dụ chỉ có 3), ta cứ lấy hết
            if (levelQuestions.length < 5 && allPool.length > 0) {
              levelQuestions = allPool;
            }
          }

          const record = {
            class_id: parseInt(grade),
            chapter_id: chapter.id,
            lesson_id: lessonId,
            level: level,
            title: sourceData.title,
            description: sourceData.description,
            theory: sourceData.theory,
            game: levelQuestions,
            boss_questions: bossQuestions
          };

          await supabase.from('lesson_questions').upsert(record, { onConflict: 'class_id, chapter_id, lesson_id, level' });
        }
      }
    }
  }
  console.log('🎉 ĐÃ HOÀN TẤT ĐỒNG BỘ DATA V4!');
}

syncAll().catch(console.error);
