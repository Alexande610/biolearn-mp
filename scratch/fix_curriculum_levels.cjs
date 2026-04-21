const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalizeCurriculum() {
  console.log("Starting curriculum normalization (ensuring 10 levels per lesson)...");

  // 1. Fetch all lesson questions
  const { data: allQuestions, error } = await supabase
    .from('lesson_questions')
    .select('*');

  if (error) {
    console.error("Error fetching questions:", error);
    return;
  }

  console.log(`Found ${allQuestions.length} existing level records.`);

  // 2. Group by lesson
  const lessonGroups = {};
  allQuestions.forEach(q => {
    const key = `${q.class_id}_${q.chapter_id}_${q.lesson_id}`;
    if (!lessonGroups[key]) lessonGroups[key] = [];
    lessonGroups[key].push(q);
  });

  const lessons = Object.keys(lessonGroups);
  console.log(`Processing ${lessons.length} unique lessons.`);

  const newRecords = [];

  for (const key of lessons) {
    const group = lessonGroups[key];
    const existingLevels = group.map(g => g.level);
    const maxLevelInDB = Math.max(...existingLevels);
    
    // We want levels 0 through 9
    for (let targetLevel = 0; targetLevel < 10; targetLevel++) {
      if (!existingLevels.includes(targetLevel)) {
        // Missing level! Find a donor level from the same lesson
        // Prefer level 0, otherwise the closest one
        const donor = group.find(g => g.level === 0) || group[0];
        
        if (donor) {
          // Create a clone for the target level
          const { id, created_at, ...cloneData } = donor;
          newRecords.push({
            ...cloneData,
            level: targetLevel
          });
        }
      }
    }
  }

  console.log(`Total new records to insert: ${newRecords.length}`);

  // 3. Batch insert (Supabase limit is usually 1000 per request or similar)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < newRecords.length; i += CHUNK_SIZE) {
    const chunk = newRecords.slice(i, i + CHUNK_SIZE);
    console.log(`Inserting chunk ${i / CHUNK_SIZE + 1}...`);
    const { error: insertError } = await supabase
      .from('lesson_questions')
      .insert(chunk);
    
    if (insertError) {
      console.error("Error inserting chunk:", insertError);
    }
  }

  console.log("Normalization complete! All lessons now have 10 levels.");
}

normalizeCurriculum();
