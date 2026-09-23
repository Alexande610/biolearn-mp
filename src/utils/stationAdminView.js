export function stationReleaseVersion(grade, stationId) {
  const order = stationId.match(/_st([1-3])$/)?.[1];
  if (!order || !Number.isInteger(grade) || grade < 6 || grade > 12) {
    throw new Error('Trạm hoặc khối lớp không hợp lệ.');
  }
  return `g${grade}-st${order}-2026.1`;
}

export function toAdminStationGame(item) {
  const content = item.public_content || {};
  const answer = item.answer_key || {};
  const data = { ...content, explanation: answer.explanation || '' };
  if (item.game_type === 'quiz') data.answerIndex = content.options?.indexOf(answer.value) ?? -1;
  if (item.game_type === 'match') data.pairs = answer.value;
  if (item.game_type === 'fill') data.correctAnswer = answer.value;
  if (item.game_type === 'category') data.items = answer.value;
  if (item.game_type === 'dragdrop') data.correctWord = answer.value;
  return {
    id: item.id,
    type: item.game_type,
    title: item.title,
    data,
    learningObjective: item.learning_objective,
    sourceRefs: item.source_refs || [],
  };
}
