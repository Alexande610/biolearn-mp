const PLACEHOLDER_HINT = /^Dựa vào (?:kiến thức|nội dung) của ải\s+\d+\.$/iu;

export const isPlaceholderStationHint = (hint) => PLACEHOLDER_HINT.test(String(hint || '').trim());

export const contextualStationHint = (game) => {
  const data = game?.data || game || {};
  const wordClue = (answer, action) => {
    const text = String(answer || '').trim();
    if (!text) return '';
    const words = text.split(/\s+/u).length;
    return `Từ cần ${action} gồm ${words} tiếng và bắt đầu bằng chữ “${Array.from(text)[0]}”.`;
  };
  if (game?.type === 'match') {
    const first = data.pairs?.[0]?.left || data.leftItems?.[0];
    const firstRight = data.pairs?.[0]?.right;
    if (firstRight) return `“${first}” tương ứng với “${firstRight}”.`;
    return `Hãy xác định vai trò hoặc đặc điểm của “${first}” trước khi nối các mục còn lại.`;
  }
  if (game?.type === 'fill') {
    return wordClue(data.correctAnswer, 'điền') || 'Tìm thuật ngữ sinh học mô tả đúng chỗ trống.';
  }
  if (game?.type === 'category') {
    const firstItem = data.items?.[0];
    if (firstItem && Number.isInteger(firstItem.catIndex)) {
      return `“${firstItem.name}” thuộc nhóm “${data.categories?.[firstItem.catIndex]}”.`;
    }
    return `Xét đặc điểm của từng mục để phân biệt “${data.categories?.[0]}” và “${data.categories?.[1]}”.`;
  }
  if (game?.type === 'dragdrop') {
    return wordClue(data.correctWord, 'chọn') || 'Loại những từ khiến câu không đúng về mặt khoa học.';
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
