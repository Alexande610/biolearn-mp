const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Đọc metadata mới nhất
const classData = JSON.parse(fs.readFileSync(path.join(__dirname, 'full_class_data.json'), 'utf8'));

async function redistributeAll() {
  console.log('🚀 Bắt đầu nạp lại dữ liệu bản đồ cho TOÀN BỘ CÁC LỚP (6-12)...');

  for (const classId in classData) {
    const chapters = classData[classId].chapters;
    console.log(`\n--- Xử lý Lớp ${classId} ---`);

    for (const chapter of chapters) {
      for (const lessonMeta of chapter.lessons) {
        const lessonId = lessonMeta.id;
        
        // 1. Lấy tất cả câu hỏi hiện có của bài này (không phân biệt level 0, 1, 2)
        const { data: sourceQuestions, error: fetchError } = await supabase
          .from('lesson_questions')
          .select('*')
          .eq('class_id', parseInt(classId))
          .eq('lesson_id', lessonId);

        if (fetchError || !sourceQuestions || sourceQuestions.length === 0) {
          console.warn(`  ⚠️ Bài ${lessonId} (${lessonMeta.name}): Không tìm thấy câu hỏi gốc. Bỏ qua.`);
          continue;
        }

        console.log(`  📦 Đang phân phối Bài ${lessonId} (${sourceQuestions.length} câu hỏi gốc)...`);

        // 2. Phân phối vào 10 level (0-9)
        for (let level = 0; level < 10; level++) {
          // Mỗi level lấy 3 câu hỏi (hoặc xoay vòng nếu thiếu)
          const levelQuestions = [];
          for (let i = 0; i < 3; i++) {
            const qIndex = (level * 3 + i) % sourceQuestions.length;
            levelQuestions.push(sourceQuestions[qIndex].game[0] || sourceQuestions[0].game[0]);
          }

          // Chuẩn bị dữ liệu mẫu từ bản ghi đầu tiên
          const sample = sourceQuestions[0];
          const data = {
            class_id: sample.class_id,
            chapter_id: chapter.id,
            lesson_id: sample.lesson_id,
            level: level,
            title: sample.title,
            description: sample.description,
            theory: sample.theory,
            game: levelQuestions,
            boss_questions: sample.boss_questions
          };

          const { error } = await supabase
            .from('lesson_questions')
            .upsert(data, { onConflict: 'class_id, chapter_id, lesson_id, level' });

          if (error) {
            console.error(`    ❌ Lỗi Level ${level}: ${error.message}`);
          }
        }
        console.log(`    ✅ Hoàn thành Bài ${lessonId}`);
      }
    }
  }

  console.log('\n🎉 ĐÃ ĐỒNG BỘ TOÀN BỘ HỆ THỐNG DỮ LIỆU!');
}

redistributeAll();
