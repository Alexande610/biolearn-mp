const PLACEHOLDER_HINT = /^Dựa vào (?:kiến thức|nội dung) của ải\s+\d+\.$/iu;

export const isPlaceholderStationHint = (hint) => PLACEHOLDER_HINT.test(String(hint || '').trim());

const short = (value, limit = 72) => {
  const text = String(value || '').replace(/\s+/gu, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
};

export const contextualStationHint = (game) => {
  const data = game?.data || game || {};
  const wordClue = (answer) => {
    const text = String(answer || '').trim();
    if (!text) return '';
    const words = text.split(/\s+/u).length;
    return ` Từ cần chọn bắt đầu bằng “${Array.from(text)[0]}” và gồm ${words} tiếng.`;
  };
  if (game?.type === 'match') {
    const first = data.pairs?.[0]?.left || data.leftItems?.[0];
    const second = data.pairs?.[1]?.left || data.leftItems?.[1];
    const firstRight = data.pairs?.[0]?.right;
    const clue = firstRight ? ` Mô tả của “${first}” bắt đầu bằng “${Array.from(firstRight)[0]}”.` : '';
    return `Phân biệt vai trò của “${first}” và “${second}” trước khi nối.${clue}`;
  }
  if (game?.type === 'fill') {
    const sentence = short(data.sentence, 100);
    return `Xét ngữ cảnh của ô trống trong “${sentence}”.${wordClue(data.correctAnswer)}`;
  }
  if (game?.type === 'category') {
    const firstItem = data.items?.[0];
    const clue = firstItem && Number.isInteger(firstItem.catIndex)
      ? ` “${firstItem.name}” thuộc nhóm “${data.categories?.[firstItem.catIndex]}”.`
      : '';
    return `Phân biệt hai nhóm “${data.categories?.[0]}” và “${data.categories?.[1]}” theo đặc điểm của từng mục.${clue}`;
  }
  if (game?.type === 'dragdrop') {
    return `Thử từng từ trong kho vào câu “${short(data.textWithBlanks, 100)}” để tạo phát biểu đúng.${wordClue(data.correctWord)}`;
  }
  return String(data.hint || '');
};

export const replacePlaceholderStationHints = (document) => {
  for (const stage of document.stages || []) {
    for (const game of stage.games || []) {
      if (isPlaceholderStationHint(game.data?.hint)) {
        game.data.hint = contextualStationHint(game);
      }
    }
  }
  return document;
};
