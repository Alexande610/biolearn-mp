import test from 'node:test';
import assert from 'node:assert/strict';
import { contextualStationHint, isPlaceholderStationHint } from '../src/utils/stationHints.js';

test('contextual hints replace circular stage references without revealing match answers', () => {
  assert.equal(isPlaceholderStationHint('Dựa vào kiến thức của ải 1.'), true);
  assert.equal(isPlaceholderStationHint('Dựa vào nội dung của ải 10.'), true);
  const match = contextualStationHint({
    type: 'match',
    leftItems: ['Thị kính', 'Vật kính'],
    rightItems: ['Nơi đặt mắt', 'Phóng đại ảnh'],
  });
  assert.match(match, /Thị kính/);
  assert.doesNotMatch(match, /Nơi đặt mắt|Phóng đại ảnh|ải 1/);
  const fill = contextualStationHint({ type: 'fill', sentence: 'Vật có kích thước [blank] khó nhìn thấy.' });
  assert.match(fill, /kích thước/);
  assert.doesNotMatch(fill, /undefined|ải 1/);
});
