const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Config
const NEXTGEN_DIR = 'c:/TailieucuaMintPhut/sinh học/KL/NextGen';
const AREAS_DIR = 'c:/TailieucuaMintPhut/sinh học/KL/areas/Sinhhoc';
require('dotenv').config({ path: path.join(NEXTGEN_DIR, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Helper to shuffle array
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Map class names to filenames
const classFileMap = {
  "6": "class6",
  "7": "class7",
  "8": "class8",
  "9": "class9",
  "10": "class10",
  "11": "class11",
  "12": "class12"
};

async function syncAll() {
  console.log('🚀 Bắt đầu khôi phục và phân phối lại dữ liệu Sinh học...');

  const classData = JSON.parse(fs.readFileSync(path.join(NEXTGEN_DIR, 'scratch/full_class_data.json'), 'utf8'));

  for (const grade in classData) {
    console.log(`\n--- Xử lý Lớp ${grade} ---`);
    const gradeDirName = classFileMap[grade];
    if (!gradeDirName) continue;

    const chapters = classData[grade].chapters;
    
    for (const chapter of chapters) {
      for (const lessonMeta of chapter.lessons) {
        const lessonId = lessonMeta.id;
        const filePath = path.join(AREAS_DIR, gradeDirName, 'ketnoi', `lesson${lessonId}.cjs`);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`  ⚠️ Không tìm thấy file nguồn: ${filePath}`);
          continue;
        }

        const sourceData = require(filePath);
        const normalQuestions = sourceData.game || [];
        const bossQuestions = sourceData.bossQuestions || [];
        const allPool = [...normalQuestions];

        console.log(`  📦 Bài ${lessonId}: ${allPool.length} câu hỏi thường, ${bossQuestions.length} câu boss.`);

        // Phân phối vào 10 Levels (0-9)
        for (let level = 0; level < 10; level++) {
          let levelQuestions = [];
          
          if (level === 9) {
            // Level 9 là Boss Level - Ưu tiên bossQuestions
            levelQuestions = bossQuestions.length > 0 ? bossQuestions : allPool.slice(0, 5);
          } else {
            // Levels 0-8: Lấy ít nhất 3-5 câu hỏi, đảo bảo đa dạng loại hình
            // Trộn toàn bộ pool và lấy slice theo level
            const shuffledPool = shuffle([...allPool]);
            const start = (level * 3) % shuffledPool.length;
            levelQuestions = shuffledPool.slice(start, start + 3);
            
            // Nếu quá ít, lấy thêm
            if (levelQuestions.length < 3 && shuffledPool.length >= 3) {
                levelQuestions = shuffledPool.slice(0, 3);
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
            game: levelQuestions, // Đây là array các câu hỏi
            boss_questions: bossQuestions
          };

          const { error } = await supabase
            .from('lesson_questions')
            .upsert(record, { onConflict: 'class_id, chapter_id, lesson_id, level' });

          if (error) console.error(`    ❌ Lỗi Level ${level}:`, error.message);
        }
        console.log(`    ✅ Hoàn thành 10 levels cho Bài ${lessonId}`);
      }
    }
  }

  console.log('\n🎉 ĐÃ KHÔI PHỤC HOÀN TOÀN DỮ LIỆU VÀ PHÂN PHỐI 10 MÀN CHƠI!');
}

syncAll().catch(console.error);
