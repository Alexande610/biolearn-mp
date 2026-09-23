import test from 'node:test';
import assert from 'node:assert/strict';
import { stationReleaseVersion, toAdminStationGame, toAdminStationDocument, toAdminStationUpdate } from '../src/utils/stationAdminView.js';

test('admin V2 view identifies the imported release and reconstructs answer for review', () => {
  assert.equal(stationReleaseVersion(12, 'g12_st3'), 'g12-st3-2026.1');
  assert.throws(() => stationReleaseVersion(12, 'g12_future'));
  const game = toAdminStationGame({
    id: 'item-1', game_type: 'quiz', title: 'Câu hỏi',
    learning_objective: 'Hiểu khái niệm', source_refs: [{ source: 'SGK' }],
    public_content: { question: 'Câu hỏi?', options: ['Sai', 'Đúng'], hint: 'Gợi ý' },
    answer_key: { value: 'Đúng', explanation: 'Giải thích' },
  });
  assert.equal(game.data.answerIndex, 1);
  assert.equal(game.data.explanation, 'Giải thích');
  assert.deepEqual(game.sourceRefs, [{ source: 'SGK' }]);
  const update = toAdminStationUpdate(game);
  assert.equal(update.answer_key.value, 'Đúng');
  assert.equal(update.public_content.answerIndex, undefined);
});

test('V2 export reconstructs ten stages from database content', () => {
  const items = Array.from({ length: 50 }, (_, index) => ({
    day_index: Math.floor(index / 5) + 1,
    game_index: index % 5 + 1,
    game_type: 'quiz', title: 'Câu hỏi', learning_objective: 'Mục tiêu',
    source_refs: [{ source: 'SGK' }],
    public_content: { question: 'Câu hỏi?', options: ['Sai', 'Đúng'], hint: 'Gợi ý' },
    answer_key: { value: 'Đúng', explanation: 'Giải thích' },
  }));
  const document = toAdminStationDocument({ version: 'g6-st1-2026.1', grade: 6,
    station_id: 'g6_st1', title: 'Trạm 1', status: 'review', notes: '' }, items);
  assert.equal(document.stages.length, 10);
  assert.equal(document.stages[9].games.length, 5);
  assert.equal(document.stages[0].games[0].data.answerIndex, 1);
});
