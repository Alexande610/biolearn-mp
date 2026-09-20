export function createErrorReportQueue(send, { now = Date.now, limit = 5, cooldown = 300000, capacity = 20 } = {}) {
  const queue = [];
  const pending = new Map();
  const acceptedAt = new Map();
  const attempts = [];
  const counts = { accepted: 0, failed: 0, suppressed: 0 };
  let running = false;
  async function drain() {
    if (running) return;
    running = true;
    try {
      while (queue.length) {
        queue.sort((a, b) => b.priority - a.priority);
        const item = queue.shift();
        const time = now();
        while (attempts.length && attempts[0] <= time - 60000) attempts.shift();
        let accepted = false;
        if (attempts.length >= limit) {
          counts.suppressed++;
        } else {
          attempts.push(time);
          try { accepted = await send(item.payload) === true; } catch { /* return failure to caller */ }
          if (accepted) { acceptedAt.set(item.key, now()); counts.accepted++; }
          else counts.failed++;
        }
        pending.delete(item.key);
        item.resolve(accepted);
      }
    } finally { running = false; }
  }
  return {
    getCounts: () => ({ ...counts }),
    report(key, payload) {
      if (pending.has(key)) return pending.get(key);
      const time = now();
      for (const [entry, sentAt] of acceptedAt) if (time - sentAt >= cooldown) acceptedAt.delete(entry);
      if (acceptedAt.has(key) || queue.length >= capacity) {
        counts.suppressed++;
        return Promise.resolve(false);
      }
      let resolve;
      const result = new Promise(done => { resolve = done; });
      pending.set(key, result);
      const priority = { security: 3, critical: 3, error: 2, warning: 1 }[payload.p_severity] || 2;
      queue.push({ key, payload, priority, resolve });
      void drain();
      return result;
    },
  };
}
