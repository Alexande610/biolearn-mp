import { validatePublishedStage } from './stationContent.js';

const publicAndAnswer = (game) => {
  const { hint, explanation } = game.data;
  if (game.type === 'quiz') return {
    publicContent: { question: game.data.question, options: game.data.options, hint },
    answerKey: { value: game.data.options[game.data.answerIndex], explanation },
  };
  if (game.type === 'match') return {
    publicContent: {
      leftItems: game.data.pairs.map((pair) => pair.left),
      // Do not preserve pair-by-index in the public payload: that would reveal
      // every match before the student submits an answer.
      rightItems: game.data.pairs.map((pair) => pair.right).reverse(),
      hint,
    },
    answerKey: { value: game.data.pairs, explanation },
  };
  if (game.type === 'fill') return {
    publicContent: { sentence: game.data.sentence, hint },
    answerKey: { value: game.data.correctAnswer, explanation },
  };
  if (game.type === 'category') return {
    publicContent: {
      categories: game.data.categories,
      items: game.data.items.map((item) => item.name),
      hint,
    },
    answerKey: { value: game.data.items, explanation },
  };
  return {
    publicContent: {
      textWithBlanks: game.data.textWithBlanks,
      bankWords: game.data.bankWords,
      hint,
    },
    answerKey: { value: game.data.correctWord, explanation },
  };
};

export const toDatabaseRelease = (document) => {
  if (!document?.releaseVersion?.trim()) throw new Error('Thiếu releaseVersion.');
  if (!document?.title?.trim()) throw new Error('Thiếu tiêu đề bản phát hành.');
  if (!Array.isArray(document.stages) || document.stages.length !== 10) throw new Error('Một trạm phải có đúng 10 ải.');
  const items = [];
  for (const stage of document.stages) {
    const errors = validatePublishedStage({
      grade: document.grade,
      stationId: document.stationId,
      dayIndex: stage.dayIndex,
      games: stage.games,
    });
    if (errors.length > 0) throw new Error(`Ải ${stage.dayIndex}: ${errors.join(' ')}`);
    stage.games.forEach((game, index) => {
      const separated = publicAndAnswer(game);
      items.push({
        grade: document.grade,
        station_id: document.stationId,
        day_index: stage.dayIndex,
        game_index: index + 1,
        game_type: game.type,
        title: game.title,
        learning_objective: stage.learningObjective,
        public_content: separated.publicContent,
        answer_key: separated.answerKey,
        source_refs: stage.sourceRefs,
      });
    });
  }
  return {
    release: {
      version: document.releaseVersion,
      grade: document.grade,
      station_id: document.stationId,
      title: document.title,
      status: document.status || 'draft',
      notes: document.notes || '',
    },
    items,
  };
};
