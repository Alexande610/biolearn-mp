import test from 'node:test';
import assert from 'node:assert/strict';
import { contextualStationHint, isPlaceholderStationHint } from '../src/utils/stationHints.js';

test('authored hints give one concrete clue without revealing every match', () => {
  assert.equal(isPlaceholderStationHint('Dựa vào kiến thức của ải 1.'), true);
  assert.equal(isPlaceholderStationHint('Dựa vào nội dung của ải 10.'), true);
  const match = contextualStationHint({
    type: 'match',
    pairs: [{ left: 'Thị kính', right: 'Nơi đặt mắt' }, { left: 'Vật kính', right: 'Phóng đại ảnh' }],
  });
  assert.match(match, /Thị kính/);
  assert.match(match, /Nơi đặt mắt/);
  assert.doesNotMatch(match, /Phóng đại ảnh|ải 1/);
  const fill = contextualStationHint({ type: 'fill', correctAnswer: 'nhỏ bé' });
  assert.match(fill, /2 tiếng.*chữ “n”/);
  assert.doesNotMatch(fill, /nhỏ bé|ải 1/);
  const category = contextualStationHint({ type: 'category', categories: ['Quang học', 'Cơ học'], items: [{ name: 'Thị kính', catIndex: 0 }] });
  assert.match(category, /Thị kính.*Quang học/);
  const drag = contextualStationHint({ type: 'dragdrop', correctWord: 'ốc điều chỉnh' });
  assert.match(drag, /3 tiếng.*chữ “ố”/);
});
