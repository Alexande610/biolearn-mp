import { STATION_GAME_TYPES, getStationById } from '../data/stationCatalog.js';
import { isPlaceholderStationHint } from './stationHints.js';

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasOneBlank = (value) => hasText(value) && (value.match(/\[blank\]/g) || []).length === 1;

export const shuffleArray = (values, random = Math.random) => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
};

export const normalizeComparableText = (value) => String(value ?? '')
  .normalize('NFC')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('vi-VN');

const validateCommon = (game, errors) => {
  if (!STATION_GAME_TYPES.includes(game?.type)) errors.push(`Loại trò chơi không hợp lệ: ${game?.type || '(trống)'}`);
  if (!hasText(game?.title)) errors.push('Thiếu tiêu đề trò chơi.');
  if (!hasText(game?.data?.hint)) errors.push(`${game?.type || 'Trò chơi'} thiếu gợi ý.`);
  if (isPlaceholderStationHint(game?.data?.hint)) errors.push(`${game?.type || 'Trò chơi'} còn gợi ý mẫu theo số ải.`);
  if (!hasText(game?.data?.explanation)) errors.push(`${game?.type || 'Trò chơi'} thiếu giải thích.`);
};

export const validateStationGame = (game) => {
  const errors = [];
  validateCommon(game, errors);
  const data = game?.data || {};

  if (game?.type === 'quiz') {
    if (!hasText(data.question)) errors.push('Quiz thiếu câu hỏi.');
    if (!Array.isArray(data.options) || data.options.length < 3 || data.options.length > 5) errors.push('Quiz phải có từ 3 đến 5 lựa chọn.');
    if (!Number.isInteger(data.answerIndex) || data.answerIndex < 0 || data.answerIndex >= (data.options?.length || 0)) errors.push('Quiz có answerIndex không hợp lệ.');
    if (Array.isArray(data.options) && new Set(data.options.map(normalizeComparableText)).size !== data.options.length) errors.push('Quiz có lựa chọn trùng nhau.');
  }

  if (game?.type === 'match') {
    if (!Array.isArray(data.pairs) || data.pairs.length < 2) errors.push('Matching phải có ít nhất hai cặp.');
    if (data.pairs?.some((pair) => !hasText(pair?.left) || !hasText(pair?.right))) errors.push('Matching có cặp bị trống.');
    if (Array.isArray(data.pairs) && new Set(data.pairs.map((pair) => normalizeComparableText(pair.left))).size !== data.pairs.length) errors.push('Matching có mục cột trái trùng nhau.');
    if (Array.isArray(data.pairs) && new Set(data.pairs.map((pair) => normalizeComparableText(pair.right))).size !== data.pairs.length) errors.push('Matching có đáp án cột phải trùng nhau.');
  }

  if (game?.type === 'fill') {
    if (!hasOneBlank(data.sentence)) errors.push('Fill phải có đúng một [blank].');
    if (!hasText(data.correctAnswer)) errors.push('Fill thiếu đáp án đúng.');
  }

  if (game?.type === 'category') {
    if (!Array.isArray(data.categories) || data.categories.length !== 2 || data.categories.some((item) => !hasText(item))) errors.push('Category phải có đúng hai nhóm có tên.');
    if (!Array.isArray(data.items) || data.items.length < 3) errors.push('Category phải có ít nhất ba mục.');
    if (data.items?.some((item) => !hasText(item?.name) || ![0, 1].includes(item?.catIndex))) errors.push('Category có mục hoặc chỉ số nhóm không hợp lệ.');
    if (Array.isArray(data.items) && new Set(data.items.map((item) => normalizeComparableText(item.name))).size !== data.items.length) errors.push('Category có mục trùng nhau.');
  }

  if (game?.type === 'dragdrop') {
    if (!hasOneBlank(data.textWithBlanks)) errors.push('Dragdrop phải có đúng một [blank].');
    if (!Array.isArray(data.bankWords) || data.bankWords.length < 2) errors.push('Dragdrop phải có ít nhất hai từ trong kho.');
    if (Array.isArray(data.bankWords) && new Set(data.bankWords.map(normalizeComparableText)).size !== data.bankWords.length) errors.push('Dragdrop có từ trong kho trùng nhau.');
    if (!hasText(data.correctWord) || !data.bankWords?.some((word) => normalizeComparableText(word) === normalizeComparableText(data.correctWord))) errors.push('Từ đúng của Dragdrop phải nằm trong kho từ.');
  }

  return errors;
};

export const validatePublishedStage = ({ grade, stationId, dayIndex, games }) => {
  const errors = [];
  const station = getStationById(grade, stationId);
  if (!station || station.isFuture) errors.push(`Trạm ${stationId} không thuộc lớp ${grade} hoặc chưa được mở.`);
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 10) errors.push('dayIndex phải nằm trong khoảng 1-10.');
  if (!Array.isArray(games) || games.length !== 5) errors.push('Một ải phát hành phải có đúng năm trò chơi.');

  if (Array.isArray(games)) {
    const types = games.map((game) => game?.type);
    if (new Set(types).size !== types.length) errors.push('Năm trò chơi phải thuộc năm loại khác nhau.');
    for (const requiredType of STATION_GAME_TYPES) {
      if (!types.includes(requiredType)) errors.push(`Thiếu trò chơi loại ${requiredType}.`);
    }
    games.forEach((game, index) => {
      validateStationGame(game).forEach((error) => errors.push(`Trò ${index + 1}: ${error}`));
    });
  }

  return errors;
};
