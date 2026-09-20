// No network or persistence: UI regression fixture only.
const channels = new Map();
const rows = [{ id: 'sample', action: 'react_render_error', severity: 'critical',
  message: 'Lỗi giả lập để kiểm tra giao diện', occurrence_count: 7,
  created_at: '2026-09-20T07:36:18Z', last_seen_at: '2026-09-20T07:36:18Z',
  resolved_at: null, route: '/admin', app_version: 'test', issue_id: 'issue-sample',
  details: { stack: 'Error: sample\n    at testFixture (no network)' }, profiles: { role: 'admin', username: 'test-admin' } }];
const issues = [{ id: 'issue-sample', action: 'react_render_error', message: rows[0].message,
  status: 'open', environment: 'development', revision: 1, severity: 'critical', route: '/admin',
  occurrence_count: 7, last_seen_at: rows[0].last_seen_at, fixed_version: null, resolved_at: null }];
const events = [];
export const supabase = {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'test-admin' } } } }) },
  rpc: async (name, params) => {
    if (name === 'prune_system_observability') throw new Error('Viewing logs must not delete data');
    if (name === 'is_system_log_admin') return { data: true };
    if (name === 'set_system_issue_status') {
      const issue = issues.find(value => value.id === params.p_issue_id);
      if (issue.revision !== params.p_expected_revision) return { error: { code: '40001' } };
      Object.assign(issue, { status: params.p_status, revision: issue.revision + 1,
        fixed_version: params.p_fixed_version, verification_evidence: params.p_evidence,
        resolved_at: params.p_status === 'resolved' ? new Date().toISOString() : null });
      events.push({ id: String(events.length), issue_id: issue.id, created_at: new Date().toISOString(),
        new_status: issue.status, app_version: params.p_fixed_version, note: params.p_note, evidence: params.p_evidence });
      return { data: issue };
    }
    return { data: { accepted: true } };
  },
  from(table) {
    const filters = {};
    let single = false;
    const query = {
      select() { return query; }, order() { return query; }, range() { return query; },
      abortSignal() { return query; }, gte() { return query; },
      limit() { return query; },
      maybeSingle() { single = true; return query; },
      in(key, value) { filters[key] = value; return query; },
      eq(key, value) { filters[key] = value; return query; },
      then(resolve, reject) {
        const source = table === 'system_logs' ? rows : table === 'system_issues' ? issues : table === 'system_issue_events' ? events
          : table === 'system_log_retention_config' ? [{ singleton: true, enabled: false, standard_days: 30, elevated_days: 90 }] : [];
        const data = source.filter(row => Object.entries(filters).every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value));
        return Promise.resolve({ data: single ? data[0] : data, error: null, count: table === 'profiles' ? 2 : data.length }).then(resolve, reject);
      },
    };
    return query;
  },
  channel(topic) {
    if (channels.has(topic)) return channels.get(topic);
    const channel = {
      on(type, filter, callback) {
        if (this.started) throw new Error('cannot add presence callbacks after subscribe');
        this.sync = callback; return this;
      },
      subscribe(callback) { this.started = true; queueMicrotask(() => callback('SUBSCRIBED')); return this; },
      track: async () => 'ok',
      presenceState: () => ({ 'test-admin': [{}], student: [{}, {}] }),
    };
    channels.set(topic, channel); return channel;
  },
  async removeChannel(channel) {
    for (const [key, value] of channels) if (value === channel) channels.delete(key);
  },
};
