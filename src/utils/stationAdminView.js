export function stationReleaseVersion(grade, stationId) {
  const order = stationId.match(/_st([1-3])$/)?.[1];
  if (!order || !Number.isInteger(grade) || grade < 6 || grade > 12) {
    throw new Error('Trạm hoặc khối lớp không hợp lệ.');
  }
  return `g${grade}-st${order}-2026.1`;
}

export function selectAdminStationRelease(releases, requestedVersion, baseVersion) {
  if (!releases.length) return null;
  return releases.find(release => release.version === requestedVersion)
    || releases.find(release => release.status === 'review' && release.version.startsWith(`${baseVersion}-hints.`))
    || releases.find(release => release.status === 'published')
    || releases.find(release => release.version === baseVersion)
    || releases[0];
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
    updatedAt: item.updated_at,
  };
}

export function toAdminStationUpdate(game) {
  const separated = publicAndAnswer(game);
  return {
    title: game.title,
    public_content: separated.publicContent,
    answer_key: separated.answerKey,
    learning_objective: game.learningObjective,
    source_refs: game.sourceRefs,
  };
}

export function toAdminStationDocument(release, items) {
  if (items.length !== 50) throw new Error('Bản phát hành chưa có đủ 50 trò chơi.');
  const stages = Array.from({ length: 10 }, (_, index) => {
    const dayItems = items.filter(item => item.day_index === index + 1)
      .sort((a, b) => a.game_index - b.game_index);
    if (dayItems.length !== 5) throw new Error(`Ải ${index + 1} chưa đủ năm trò chơi.`);
    return {
      dayIndex: index + 1,
      learningObjective: dayItems[0].learning_objective,
      sourceRefs: dayItems[0].source_refs,
      games: dayItems.map(item => {
        const game = toAdminStationGame(item);
        return { type: game.type, title: game.title, data: game.data };
      }),
    };
  });
  return {
    schemaVersion: 1,
    releaseVersion: release.version,
    grade: release.grade,
    stationId: release.station_id,
    title: release.title,
    status: release.status,
    notes: release.notes,
    stages,
  };
}
import { publicAndAnswer } from './stationRelease.js';
