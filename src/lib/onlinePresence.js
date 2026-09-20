// One owner per Supabase client. Cleanup finishes before the topic is reused.
export function createOnlinePresence(client, report = () => {}) {
  let snapshot = { count: null, status: 'disconnected' };
  const listeners = new Set();
  let pendingCleanup = Promise.resolve();
  let current = null;
  const publish = (value) => {
    snapshot = value;
    listeners.forEach(listener => listener());
  };
  const notifyError = (error) => {
    try { Promise.resolve(report(error)).catch(() => {}); } catch { /* reporting must not break cleanup */ }
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start(userId) {
      current?.stop();
      const session = { cancelled: false, channel: null, stop: null };
      current = session;
      publish({ count: null, status: userId ? 'connecting' : 'disconnected' });
      const ready = pendingCleanup.then(() => {
        if (session.cancelled || !userId) return;
        const active = () => !session.cancelled && current === session;
        try {
          const channel = client.channel('system-online-users', {
            config: { presence: { key: userId } },
          });
          session.channel = channel;
          channel.on('presence', { event: 'sync' }, () => {
            if (active()) publish({ count: Object.keys(channel.presenceState()).length, status: 'connected' });
          });
          channel.subscribe(async status => {
            if (!active()) return;
            if (status !== 'SUBSCRIBED') {
              publish({ count: null, status: 'disconnected' });
              return;
            }
            try {
              // Only an identity is needed for counting; do not broadcast email/name.
              const result = await channel.track({ user_id: userId });
              if (!active()) return;
              if (result !== 'ok') throw new Error('Không thể đồng bộ trạng thái trực tuyến');
              publish({ count: Object.keys(channel.presenceState()).length, status: 'connected' });
            } catch (error) {
              if (active()) publish({ count: null, status: 'disconnected' });
              notifyError(error);
            }
          });
        } catch (error) {
          if (active()) publish({ count: null, status: 'disconnected' });
          notifyError(error);
        }
      });
      session.stop = () => {
        if (session.cancelled) return;
        session.cancelled = true;
        if (current === session) {
          current = null;
          publish({ count: null, status: 'disconnected' });
        }
        pendingCleanup = ready.then(async () => {
          if (session.channel) await client.removeChannel(session.channel);
        }).catch(notifyError);
      };
      return session.stop;
    },
  };
}
