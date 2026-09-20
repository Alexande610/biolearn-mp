export const MAP_STAGE_TYPES = Object.freeze({
  LESSON: 'lesson',
  PRACTICE: 'practice',
  SKIP_CHALLENGE: 'skip_challenge'
});

export function getMapStageIdentity({ classId, chapterId, lessonId, level = 0, requestedType = '' }) {
  if (requestedType === 'skip-challenge') {
    return {
      classId: Number(classId), chapterId: Number(chapterId),
      stageType: MAP_STAGE_TYPES.SKIP_CHALLENGE, lessonId: 0, level: 0,
      controlId: `${classId}:${chapterId}:review:0`
    };
  }
  const numericLessonId = Number(lessonId);
  const stageType = numericLessonId === 99 ? MAP_STAGE_TYPES.PRACTICE : MAP_STAGE_TYPES.LESSON;
  return {
    classId: Number(classId), chapterId: Number(chapterId), stageType,
    lessonId: numericLessonId, level: Number(level) || 0,
    controlId: `${classId}:${chapterId}:${numericLessonId}:${Number(level) || 0}`
  };
}

export function validateMapGame(game) {
  const quizzes = Array.isArray(game) ? game : game?.quizzes;
  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return 'Nội dung game phải có ít nhất một câu hỏi.';
  }
  for (let index = 0; index < quizzes.length; index += 1) {
    const item = quizzes[index];
    if (!item || typeof item !== 'object') return `Câu ${index + 1} không hợp lệ.`;
    if (!String(item.question || '').trim()) return `Câu ${index + 1} đang thiếu nội dung câu hỏi.`;
    const type = item.type || 'multiple-choice';
    if (['multiple-choice', 'quiz', 'true-false'].includes(type)) {
      if (!Array.isArray(item.options) || item.options.length < 2) return `Câu ${index + 1} cần ít nhất hai lựa chọn.`;
      const answer = item.correctAnswer ?? item.correct_option;
      if (answer === undefined || answer === null || answer === '') return `Câu ${index + 1} đang thiếu đáp án đúng.`;
      if (typeof answer === 'number' && (answer < 0 || answer >= item.options.length)) return `Đáp án câu ${index + 1} nằm ngoài danh sách lựa chọn.`;
    } else if (type === 'matching') {
      if (!Array.isArray(item.pairs) || item.pairs.length < 2 || item.pairs.some(pair => !pair?.term || !pair?.definition)) return `Câu ${index + 1} cần ít nhất hai cặp nối đầy đủ.`;
    } else if (type === 'ordering') {
      if (!Array.isArray(item.correctOrder) || item.correctOrder.length < 2) return `Câu ${index + 1} cần ít nhất hai bước.`;
    } else if (type === 'fillblank' || type === 'fill-in-blank') {
      if (!String(item.sentence || '').trim() || !String(item.correctAnswer ?? '').trim()) return `Câu ${index + 1} đang thiếu câu mẫu hoặc từ cần điền.`;
    } else {
      return `Câu ${index + 1} sử dụng loại trò chơi chưa được hỗ trợ: ${type}.`;
    }
  }
  return '';
}
