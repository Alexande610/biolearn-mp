import fs from 'node:fs';
const bank = JSON.parse(fs.readFileSync('content/boss/grade6.json','utf8'));
const expected = ['1:1','1:2','1:3','2:4','2:5','3:6','3:7','3:8','3:9','3:10'];
if(bank.grade!==6 || bank.lessons.length!==10 || bank.lessons.some(l=>!expected.includes(`${l.chapterId}:${l.lessonId}`))) throw Error('Unexpected lesson identity');
const ids = new Set();
const quote = v => `'${String(v).replaceAll("'","''")}'`;
const lines = ['-- Draft content only. Does not enable battles or overwrite edited content.','begin;'];
for(const l of bank.lessons) {
  if(l.questions.length<15 || new Set(l.questions.map(q=>q.question.trim())).size!==l.questions.length) throw Error(`Insufficient/duplicate content: ${l.lessonId}`);
  lines.push(`insert into public.boss_lessons(class_id,chapter_id,lesson_id,title,version) values(6,${l.chapterId},${l.lessonId},${quote(l.title)},${quote(bank.version)}) on conflict do nothing;`);
  for(const q of l.questions) {
    if(ids.has(q.id) || !q.question?.trim() || !q.hint?.trim() || !q.explanation?.trim() ||
      !Array.isArray(q.options) || q.options.length<3 || new Set(q.options).size!==q.options.length ||
      !Number.isInteger(q.correctAnswer) || q.correctAnswer<0 || q.correctAnswer>=q.options.length) throw Error(`Invalid question: ${q.id}`);
    ids.add(q.id);
    lines.push(`insert into public.boss_questions(id,class_id,chapter_id,lesson_id,question,options,correct_answer,hint,explanation,version) values(${quote(q.id)},6,${l.chapterId},${l.lessonId},${quote(q.question)},${quote(JSON.stringify(q.options))}::jsonb,${q.correctAnswer},${quote(q.hint)},${quote(q.explanation)},${quote(bank.version)}) on conflict do nothing;`);
  }
}
lines.push('commit;','');
fs.mkdirSync('generated/boss-releases',{recursive:true});
fs.writeFileSync('generated/boss-releases/g6-boss-2026.1-draft.sql',lines.join('\n'));
console.log(`Validated ${ids.size} draft questions. Feature remains disabled.`);
