import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_STATIONS, STATION_CATALOG, STATION_GAME_TYPES } from '../src/data/stationCatalog.js';
import { shuffleArray, validatePublishedStage } from '../src/utils/stationContent.js';
import { toDatabaseRelease } from '../src/utils/stationRelease.js';

const validGames = [
  { type: 'quiz', title: 'Quiz', data: { question: 'Đơn vị cơ bản của sự sống là gì?', options: ['Tế bào', 'Mô', 'Cơ quan'], answerIndex: 0, hint: 'Đơn vị nhỏ nhất.', explanation: 'Tế bào là đơn vị cơ bản của sự sống.' } },
  { type: 'match', title: 'Nối', data: { pairs: [{ left: 'Màng', right: 'Bao bọc tế bào' }, { left: 'Nhân', right: 'Chứa vật chất di truyền' }], hint: 'Dựa vào chức năng.', explanation: 'Mỗi thành phần có chức năng riêng.' } },
  { type: 'fill', title: 'Điền', data: { sentence: '[blank] là đơn vị cơ bản của sự sống.', correctAnswer: 'Tế bào', hint: 'Hai tiếng.', explanation: 'Đáp án là tế bào.' } },
  { type: 'category', title: 'Phân loại', data: { categories: ['Nhân sơ', 'Nhân thực'], items: [{ name: 'Vi khuẩn', catIndex: 0 }, { name: 'Tế bào thực vật', catIndex: 1 }, { name: 'Tế bào động vật', catIndex: 1 }], hint: 'Xét màng nhân.', explanation: 'Vi khuẩn thuộc nhóm nhân sơ.' } },
  { type: 'dragdrop', title: 'Kéo thả', data: { textWithBlanks: 'Màng tế bào [blank] tế bào.', bankWords: ['bao bọc', 'phân chia'], correctWord: 'bao bọc', hint: 'Vị trí ngoài cùng.', explanation: 'Màng tế bào bao bọc tế bào.' } },
];

test('catalog has three active stations and one locked future station per grade', () => {
  for (let grade = 6; grade <= 12; grade += 1) {
    assert.equal(STATION_CATALOG[grade].length, 4);
    assert.equal(ACTIVE_STATIONS[grade].length, 3);
    assert.equal(STATION_CATALOG[grade][3].isFuture, true);
    assert.deepEqual(ACTIVE_STATIONS[grade].map((station) => station.startDay), [1, 11, 21]);
  }
});

test('published stage requires all five unique game types', () => {
  assert.deepEqual(validatePublishedStage({ grade: 6, stationId: 'g6_st1', dayIndex: 1, games: validGames }), []);
  const duplicate = [...validGames.slice(0, 4), validGames[0]];
  assert.ok(validatePublishedStage({ grade: 6, stationId: 'g6_st1', dayIndex: 1, games: duplicate }).length > 0);
});

test('shuffle does not mutate input and preserves every game type', () => {
  const original = [...STATION_GAME_TYPES];
  const shuffled = shuffleArray(original, () => 0.25);
  assert.deepEqual(original, STATION_GAME_TYPES);
  assert.deepEqual([...shuffled].sort(), [...STATION_GAME_TYPES].sort());
  assert.notStrictEqual(shuffled, original);
});

test('database payload separates public content from every answer key', () => {
  const payload = toDatabaseRelease({
    schemaVersion: 1,
    releaseVersion: 'test-release',
    grade: 6,
    stationId: 'g6_st1',
    title: 'Test',
    stages: Array.from({ length: 10 }, (_, index) => ({
      dayIndex: index + 1,
      learningObjective: 'Mục tiêu kiểm thử.',
      sourceRefs: [{ source: 'SGK' }],
      games: validGames,
    })),
  });
  assert.equal(payload.items.length, 50);
  const serializedPublic = JSON.stringify(payload.items.map((item) => item.public_content));
  assert.equal(serializedPublic.includes('correctAnswer'), false);
  assert.equal(serializedPublic.includes('answerIndex'), false);
  assert.equal(serializedPublic.includes('catIndex'), false);
  assert.equal(serializedPublic.includes('correctWord'), false);
  const matching = payload.items.find((item) => item.game_type === 'match');
  assert.notDeepEqual(matching.public_content.rightItems, matching.answer_key.value.map((pair) => pair.right));
});
