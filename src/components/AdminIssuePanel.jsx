import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const labels = { open: 'Chưa xử lý', investigating: 'Đang xử lý', verifying: 'Chờ xác minh', resolved: 'Đã chỉnh sửa', reopened: 'Tái phát' };
const pageSize = 10;
const date = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
const inputClass = 'w-full p-2 rounded-lg border border-slate-400/40 bg-white/10';

function IssueEditor({ issue, onSaved, onClose }) {
  const [status, setStatus] = useState(issue.status === 'reopened' ? 'investigating' : issue.status);
  const [note, setNote] = useState('');
  const [version, setVersion] = useState(issue.fixed_version || import.meta.env.VITE_APP_VERSION || '');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState([]);
  const [historyError, setHistoryError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.from('system_issue_events').select('*').eq('issue_id', issue.id)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data, error: readError }) => {
        if (!active) return;
        if (readError) setHistoryError('Không tải được lịch sử xử lý.');
        else setEvents(data || []);
      }).catch(() => { if (active) setHistoryError('Không tải được lịch sử xử lý.'); });
    return () => { active = false; };
  }, [issue.id]);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { error: saveError } = await supabase.rpc('set_system_issue_status', {
        p_issue_id: issue.id, p_expected_revision: issue.revision, p_status: status,
        p_note: note.trim(), p_fixed_version: status === 'resolved' ? version.trim() : null,
        p_evidence: status === 'resolved' ? evidence.trim() : null,
      });
      if (saveError) throw saveError;
      onSaved();
    } catch (saveError) {
      setError(saveError.code === '40001'
        ? 'Lỗi vừa có cập nhật mới. Đóng biểu mẫu, tải lại danh sách và kiểm tra trước khi xác nhận.'
        : saveError.code === '42501' ? 'Tài khoản chưa được cấp quyền xử lý log.'
          : 'Chưa lưu được. Cần ghi chú, phiên bản cụ thể (không dùng dev/latest) và bằng chứng kiểm thử khi xác nhận đã sửa.');
    } finally { setBusy(false); }
  }
  return <div className="mt-3 rounded-xl border border-slate-400/40 p-4">
    <form onSubmit={submit} className="space-y-3">
      <label className="block">Trạng thái
        <select aria-label="Trạng thái xử lý" className={inputClass} value={status} onChange={event => setStatus(event.target.value)}>
          {Object.entries(labels).filter(([key]) => key !== 'reopened').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="block">Ghi chú xử lý
        <textarea className={inputClass} required minLength={5} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} />
      </label>
      {status === 'resolved' && <>
        <p className="text-sm">Chỉ xác nhận sau khi tái kiểm tra trên phiên bản đã sửa. Không có log mới chưa đủ chứng minh lỗi đã hết.</p>
        <label className="block">Phiên bản đã kiểm chứng
          <input className={inputClass} required minLength={3} maxLength={40} value={version} onChange={event => setVersion(event.target.value)} />
        </label>
        <label className="block">Bằng chứng kiểm thử
          <textarea className={inputClass} required minLength={10} maxLength={3000} placeholder="Ca tái hiện, kết quả kiểm thử, bản build hoặc liên kết báo cáo" value={evidence} onChange={event => setEvidence(event.target.value)} />
        </label>
      </>}
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button disabled={busy} type="submit" className="rounded-lg bg-cyan-700 text-white px-4 py-2 disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu kết quả xử lý'}</button>
        <button disabled={busy} type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Đóng</button>
      </div>
    </form>
    <details className="mt-4">
      <summary className="cursor-pointer">Lịch sử xử lý gần đây ({events.length})</summary>
      {historyError && <p role="alert">{historyError}</p>}
      {events.map(event => <div key={event.id} className="border-t border-slate-400/30 py-2 text-sm">
        <p>{date(event.created_at)} · {labels[event.new_status]} · {event.app_version || 'Chưa rõ phiên bản'}</p>
        <p className="break-words">{event.note}</p><p className="whitespace-pre-wrap break-words">{event.evidence}</p>
      </div>)}
    </details>
  </div>;
}

export default function AdminIssuePanel({ onStatusChanged }) {
  const [issues, setIssues] = useState([]);
  const [status, setStatus] = useState('all');
  const [environment, setEnvironment] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retention, setRetention] = useState(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const { data: allowed, error: permissionError } = await supabase.rpc('is_system_log_admin');
        if (permissionError) throw permissionError;
        if (!allowed) throw { code: '42501' };
        let query = supabase.from('system_issues').select('*', { count: 'exact' });
        if (status !== 'all') query = query.eq('status', status);
        if (environment !== 'all') query = query.eq('environment', environment);
        const [result, retentionResult] = await Promise.all([
          query.order('last_seen_at', { ascending: false }).order('id', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1).abortSignal(controller.signal),
          supabase.from('system_log_retention_config').select('*').eq('singleton', true).maybeSingle(),
        ]);
        if (!active) return;
        if (result.error) throw result.error;
        const totalPages = Math.max(1, Math.ceil((result.count || 0) / pageSize));
        setPages(totalPages);
        if (page > totalPages) { setPage(totalPages); return; }
        setIssues(result.data || []);
        if (!retentionResult.error) setRetention(retentionResult.data);
      } catch (readError) {
        if (!active) return;
        setIssues([]);
        setError(readError.code === '42501' ? 'Chưa được cấp quyền quản lý hồ sơ lỗi.'
          : ['PGRST202', 'PGRST205', '42P01', '42883'].includes(readError.code)
            ? 'Hồ sơ xử lý lỗi chưa được cài đặt trên database này. Log gốc vẫn được giữ bên dưới.'
            : 'Không tải được hồ sơ xử lý lỗi. Hãy thử tải lại.');
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [status, environment, page, refresh]);
  const reload = () => { setSelected(null); setRefresh(value => value + 1); };
  return <section className="admin-logs-panel game-card mb-6">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="font-bold text-lg">Theo dõi khắc phục lỗi</h2>
      <button onClick={reload} className="rounded-lg border px-3 py-2">Tải lại hồ sơ</button>
    </div>
    <p className="text-sm mb-3">Hồ sơ xử lý và bằng chứng được giữ lại khi log chi tiết hết hạn.</p>
    <p className="text-sm mb-3">Phiên bản đang mở: {import.meta.env.VITE_APP_VERSION || 'dev — chưa xác định bản build'}</p>
    {retention && <p className="text-sm mb-3">Log thường: {retention.standard_days} ngày; nghiêm trọng/bảo mật: {retention.elevated_days} ngày. Dọn log tự động: {retention.enabled ? 'Đã bật' : 'Đang tạm dừng'}.</p>}
    <div className="grid md:grid-cols-2 gap-3 mb-4">
      <label>Trạng thái hồ sơ<select aria-label="Lọc trạng thái hồ sơ" className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); setSelected(null); }}>
        <option value="all">Tất cả trạng thái</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Môi trường<select aria-label="Lọc môi trường" className={inputClass} value={environment} onChange={event => { setEnvironment(event.target.value); setPage(1); setSelected(null); }}>
        <option value="all">Tất cả môi trường</option><option value="development">Phát triển</option><option value="staging">Thử nghiệm</option><option value="production">Đang phục vụ người dùng</option><option value="legacy">Chưa xác định (log cũ)</option>
      </select></label>
    </div>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {loading ? <p>Đang tải hồ sơ lỗi…</p> : issues.length === 0 && !error ? <p>Không có hồ sơ phù hợp.</p> : issues.map(issue => <article key={issue.id} className="admin-log-card border rounded-xl p-3 mb-3">
      <div className="flex flex-wrap justify-between gap-2"><strong>{issue.action}</strong><span className={issue.status === 'resolved' ? 'text-emerald-600 font-bold' : 'font-semibold'}>{labels[issue.status]}</span></div>
      <p className="break-words my-2">{issue.message}</p>
      <p className="text-xs">{issue.environment} · {issue.route} · Ghi nhận {Number(issue.occurrence_count).toLocaleString('vi-VN')} lần · Lần cuối: {date(issue.last_seen_at)}</p>
      {issue.status === 'resolved' && <div className="mt-2 text-sm"><p>Đã kiểm chứng: {issue.fixed_version} · {date(issue.resolved_at)}</p><p className="whitespace-pre-wrap break-words">{issue.verification_evidence}</p></div>}
      <button onClick={() => setSelected(selected === issue.id ? null : issue.id)} className="mt-3 rounded-lg border px-3 py-2">Xử lý / xem lịch sử</button>
      {selected === issue.id && <IssueEditor key={`${issue.id}:${issue.revision}`} issue={issue} onClose={() => setSelected(null)} onSaved={() => { reload(); onStatusChanged(); }} />}
    </article>)}
    <div className="flex justify-between items-center mt-3">
      <button disabled={loading || page <= 1} onClick={() => { setPage(value => value - 1); setSelected(null); }}>Hồ sơ trước</button>
      <span>Trang {page}/{pages}</span><button disabled={loading || page >= pages} onClick={() => { setPage(value => value + 1); setSelected(null); }}>Hồ sơ sau</button>
    </div>
  </section>;
}
