const clients = new WeakMap();

// Serializes reuse of a topic and owns every callback/timer for one room visit.
export function managedRealtimeChannel(client, topic, config, onError = () => {}) {
  let registry = clients.get(client);
  if (!registry) { registry = new Map(); clients.set(client, registry); }
  const previous = registry.get(topic) || Promise.resolve();
  let release;
  const finished = new Promise(resolve => { release = resolve; });
  registry.set(topic, finished);
  let channel;
  let disposed = false;
  let subscribed = false;
  const bindings = [];
  const timers = new Set();
  const report = error => {
    if (disposed) return;
    try { Promise.resolve(onError(error)).catch(() => {}); } catch { /* no recursive failure */ }
  };
  let ready = previous;
  const guard = callback => (...args) => {
    if (disposed) return;
    try { Promise.resolve(callback(...args)).catch(report); } catch (error) { report(error); }
  };
  const scope = {
    isActive: () => !disposed && Boolean(channel),
    presenceState: () => channel?.presenceState() || {},
    on(type, filter, callback) {
      if (subscribed) throw new Error('Register room listeners before subscribing');
      bindings.push([type, filter, guard(callback)]);
      return scope;
    },
    subscribe(callback) {
      if (subscribed) throw new Error('Room already subscribed');
      subscribed = true;
      ready = previous.then(() => {
        if (disposed) return;
        channel = client.channel(topic, config);
        for (const args of bindings) channel.on(...args);
        channel.subscribe(guard(callback));
      }).catch(report);
      return scope;
    },
    async track(payload) {
      if (disposed || !channel) return 'error';
      return channel.track(payload);
    },
    async send(payload) {
      if (disposed || !channel) return 'cancelled';
      try {
        const result = await channel.send(payload);
        if (disposed) return 'cancelled';
        if (result !== 'ok') throw new Error(`Không gửi được sự kiện phòng: ${payload.event || 'broadcast'}`);
        return 'ok';
      } catch (error) { report(error); return 'error'; }
    },
    timeout(callback, delay) {
      if (disposed) return null;
      const timer = setTimeout(() => { timers.delete(timer); guard(callback)(); }, delay);
      timers.add(timer);
      return timer;
    },
    interval(callback, delay) {
      if (disposed) return null;
      const timer = setInterval(guard(callback), delay);
      timers.add(timer);
      return timer;
    },
    unsubscribe() {
      if (disposed) return finished;
      disposed = true;
      for (const timer of timers) { clearTimeout(timer); clearInterval(timer); }
      timers.clear();
      ready.then(async () => {
        if (channel) await client.removeChannel(channel);
      }).catch(() => {}).finally(() => {
        if (registry.get(topic) === finished) registry.delete(topic);
        release();
      });
      return finished;
    },
  };
  return scope;
}
