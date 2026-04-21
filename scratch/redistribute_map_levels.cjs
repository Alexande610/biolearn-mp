const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function redistribute() {
  console.log('🚀 Bắt đầu phân phối lại màn chơi...');
  
  // 1. Lấy tất cả bài học ở level 0 (đang ôm đồm tất cả câu hỏi)
  const { data: lessons, error: fetchError } = await supabase
    .from('lesson_questions')
    .select('*')
    .eq('level', 0);

  if (fetchError) {
    console.error('❌ Lỗi tải bài học:', fetchError.message);
    return;
  }

  console.log(`Tìm thấy ${lessons.length} bài học cần phân phối.`);

  for (const lesson of lessons) {
    let questions = [];
    if (Array.isArray(lesson.game)) {
      questions = lesson.game;
    } else if (lesson.game && Array.isArray(lesson.game.quizzes)) {
      questions = lesson.game.quizzes;
    }

    if (questions.length === 0) continue;

    console.log(`\n📦 Đang xử lý: ${lesson.title} (${questions.length} câu hỏi)`);

    // Phân phối câu hỏi cho chính xác 9 màn chơi (0-8)
    // Nếu có ít hơn 9 câu, ta sẽ quay vòng lặp lại để đảm bảo mỗi màn có ít nhất 1 câu
    for (let i = 0; i < 9; i++) {
        // Lấy 1-2 câu cho mỗi màn dựa trên tổng số câu có sẵn
        const numQuestionsPerLevel = Math.max(1, Math.floor(questions.length / 9));
        const start = (i * numQuestionsPerLevel) % questions.length;
        let chunk = questions.slice(start, start + numQuestionsPerLevel);
        
        // Nếu chunk rỗng (vì modulo) hoặc quá ít, lấy ít nhất 1 câu bất kỳ
        if (chunk.length === 0) {
          chunk = [questions[i % questions.length]];
        }

        const levelData = {
          ...lesson,
          id: undefined,
          level: i,
          game: chunk,
          created_at: undefined
        };

        const { error } = await supabase
          .from('lesson_questions')
          .upsert(levelData, { onConflict: 'class_id, chapter_id, lesson_id, level' });

        if (error) console.error(`  ❌ Lỗi nạp Level ${i}:`, error.message);
        else console.log(`  ✅ Level ${i+1} sẵn sàng (chứa ${chunk.length} câu).`);
    }

    // Nạp Boss vào màn 9 (Màn thứ 10)
    const bossQuestions = lesson.boss_questions || [];
    if (bossQuestions.length > 0) {
      const bossData = {
        ...lesson,
        id: undefined,
        level: 9,
        game: bossQuestions,
        created_at: undefined
      };
      const { error } = await supabase
        .from('lesson_questions')
        .upsert(bossData, { onConflict: 'class_id, chapter_id, lesson_id, level' });
      
      if (error) console.error(`  ❌ Lỗi nạp Boss (Level 9):`, error.message);
      else console.log(`  🔥 Boss Level (10) sẵn sàng.`);
    }
  }

  console.log('\n🎉 HOÀN THÀNH: Bản đồ đã được nạp đầy đủ dữ liệu!');
}

redistribute();
