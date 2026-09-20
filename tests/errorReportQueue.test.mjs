import test from 'node:test';
import assert from 'node:assert/strict';
import { createErrorReportQueue } from '../src/lib/errorReportQueue.js';

test('distinct concurrent errors are queued; pending duplicates share acceptance', async () => {
  let release;
  const sent = [];
  const reports = createErrorReportQueue(async payload => {
    sent.push(payload.id);
    if (payload.id === 'first') await new Promise(resolve => { release = resolve; });
    return true;
  });
  const first = reports.report('a', { id: 'first' });
  const duplicate = reports.report('a', { id: 'first' });
  const second = reports.report('b', { id: 'second', p_severity: 'warning' });
  const urgent = reports.report('c', { id: 'urgent', p_severity: 'critical' });
  assert.equal(first, duplicate);
  release();
  assert.deepEqual(await Promise.all([first, second, urgent]), [true, true, true]);
  assert.deepEqual(sent, ['first', 'urgent', 'second']);
});
test('failure does not start a five-minute cooldown; acceptance does', async () => {
  let accepted = false;
  let clock = 100;
  const reports = createErrorReportQueue(async () => accepted, { now: () => clock });
  assert.equal(await reports.report('a', {}), false);
  accepted = true;
  assert.equal(await reports.report('a', {}), true);
  assert.equal(await reports.report('a', {}), false);
  clock += 300001;
  assert.equal(await reports.report('a', {}), true);
});
test('rate limits remain bounded and failed transport is contained', async () => {
  const reports = createErrorReportQueue(async () => { throw new Error('offline'); }, { limit: 1 });
  assert.equal(await reports.report('a', {}), false);
  assert.equal(await reports.report('b', {}), false);
  assert.deepEqual(reports.getCounts(), { accepted: 0, failed: 1, suppressed: 1 });
});
