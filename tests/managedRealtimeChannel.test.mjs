import test from 'node:test';
import assert from 'node:assert/strict';
import { managedRealtimeChannel } from '../src/lib/managedRealtimeChannel.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
test('same topic waits for asynchronous removal; stale callbacks and sends are cancelled', async () => {
  let finishRemoval;
  let creates = 0;
  let callbacks = 0;
  let sends = 0;
  const channels = [];
  const client = {
    channel() {
      creates++;
      const c = { on(t, f, cb) { this.cb = cb; return this; }, subscribe(cb) { this.sub = cb; },
        async send() { sends++; return 'ok'; }, presenceState: () => ({}) };
      channels.push(c); return c;
    },
    removeChannel: () => new Promise(resolve => { finishRemoval = resolve; }),
  };
  const old = managedRealtimeChannel(client, 'battle:a', {}).on('presence', {}, () => callbacks++).subscribe(() => {});
  await flush();
  channels[0].cb();
  assert.equal(callbacks, 1);
  const disposed = old.unsubscribe();
  const next = managedRealtimeChannel(client, 'battle:a', {}).subscribe(() => {});
  await flush();
  assert.equal(creates, 1);
  channels[0].cb();
  assert.equal(callbacks, 1);
  assert.equal(await old.send({ event: 'new-question' }), 'cancelled');
  assert.equal(sends, 0);
  finishRemoval(); await disposed; await flush();
  assert.equal(creates, 2);
  const cleanup = next.unsubscribe(); await flush(); finishRemoval(); await cleanup;
});
test('leaving before startup cancels timers and avoids creating a channel', async () => {
  let fired = false;
  const client = { channel() { throw new Error('must not create'); } };
  const room = managedRealtimeChannel(client, 'battle:a', {}).subscribe(() => {});
  room.timeout(() => { fired = true; }, 0);
  room.interval(() => { fired = true; }, 0);
  await room.unsubscribe(); await flush();
  assert.equal(fired, false);
});
test('broadcast failure is observable and does not become an unhandled rejection', async () => {
  const errors = [];
  const room = managedRealtimeChannel({
    channel: () => ({ subscribe() {}, send: async () => 'timed out' }),
    removeChannel: async () => {},
  }, 'battle:a', {}, error => errors.push(error)).subscribe(() => {});
  await flush();
  assert.equal(await room.send({ event: 'new-question' }), 'error');
  assert.equal(errors.length, 1);
  await room.unsubscribe();
});
