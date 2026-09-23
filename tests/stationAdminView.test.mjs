import test from 'node:test';
import assert from 'node:assert/strict';
import { stationReleaseVersion, toAdminStationGame } from '../src/utils/stationAdminView.js';

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
});
