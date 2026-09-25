import test from 'node:test';
import assert from 'node:assert/strict';
import { composeAdminUserList } from '../src/lib/adminUserList.js';

const real = [{ id: 'real', role: 'student', display_name: 'Học viên thật', email: 'real@example.com', created_at: '2026-09-20T00:00:00Z' }];
const samples = [
  { id: 'sample-student', role: 'student', display_name: 'Nguyễn Minh An', created_at: '2026-09-24T00:00:00Z' },
  { id: 'sample-teacher', role: 'teacher', display_name: 'Trần Ngọc Hà', created_at: '2026-09-22T00:00:00Z' }
];

test('admin list counts, filters and pages real and sample profiles together', () => {
  const first = composeAdminUserList(real, samples, { page: 1, pageSize: 2 });
  assert.equal(first.total, 3);
  assert.equal(first.totalPages, 2);
  assert.equal(first.sampleCount, 2);
  assert.deepEqual(first.rows.map(row => row.id), ['sample-student', 'sample-teacher']);
  const second = composeAdminUserList(real, samples, { page: 2, pageSize: 2 });
  assert.deepEqual(second.rows.map(row => row.id), ['real']);
  assert.equal(second.rows[0].is_presentation_data, undefined);
  const teacher = composeAdminUserList(real, samples, { role: 'teacher' });
  assert.equal(teacher.total, 1);
  assert.equal(teacher.rows[0].is_presentation_data, true);
  const search = composeAdminUserList(real, samples, { search: 'minh an' });
  assert.equal(search.total, 1);
  assert.equal(search.rows[0].id, 'sample-student');
});
