import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnlinePresence } from '../src/lib/onlinePresence.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const channels = [];
  const removed = [];
  const client = {
    channel(topic, config) {
      assert.ok(!channels.some(c => !removed.includes(c)), 'previous channel must be removed');
      const c = {
        topic, config, state: { u1: [{}, {}], u2: [{}] },
        on(type, filter, handler) { assert.ok(!this.subscribed); this.sync = handler; return this; },
        subscribe(handler) { this.subscribed = true; this.status = handler; return this; },
        presenceState() { return this.state; },
        async track(payload) { this.payload = payload; return 'ok'; },
      };
      channels.push(c);
      return c;
    },
    async removeChannel(c) { await flush(); removed.push(c); },
  };
  return { client, channels, removed };
}
test('counts accounts, reconnects, and ignores late callbacks after cleanup', async () => {
  const { client, channels, removed } = fixture();
  const store = createOnlinePresence(client);
  const stop = store.start('u1');
  await flush();
  await channels[0].status('SUBSCRIBED');
  assert.deepEqual(store.getSnapshot(), { count: 2, status: 'connected' });
  assert.deepEqual(channels[0].payload, { user_id: 'u1' });
  await channels[0].status('CHANNEL_ERROR');
  assert.equal(store.getSnapshot().count, null);
  await channels[0].status('SUBSCRIBED');
  stop();
  channels[0].sync();
  assert.equal(store.getSnapshot().status, 'disconnected');
  await flush(); await flush();
  assert.equal(removed.length, 1);
});
test('StrictMode setup/cleanup/setup and rapid account changes do not reuse joining channels', async () => {
  const { client, channels } = fixture();
  const store = createOnlinePresence(client);
  store.start('a')();
  const stopB = store.start('b');
  await flush();
  assert.equal(channels.length, 1);
  const stopC = store.start('c');
  stopB();
  await flush(); await flush(); await flush();
  assert.equal(channels.length, 2);
  assert.equal(channels[1].config.config.presence.key, 'c');
  await channels[0].status('SUBSCRIBED');
  assert.equal(store.getSnapshot().status, 'connecting');
  await channels[1].status('SUBSCRIBED');
  assert.equal(store.getSnapshot().status, 'connected');
  stopC();
});
test('failed track does not claim zero online or reject into the application', async () => {
  const { client, channels } = fixture();
  const errors = [];
  const store = createOnlinePresence(client, error => errors.push(error));
  const stop = store.start('a');
  await flush();
  channels[0].track = async () => { throw new Error('offline'); };
  await channels[0].status('SUBSCRIBED');
  assert.deepEqual(store.getSnapshot(), { count: null, status: 'disconnected' });
  assert.equal(errors.length, 1);
  stop();
});
