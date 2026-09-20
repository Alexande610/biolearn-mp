import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, FileText, RefreshCw, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AdminIssuePanel from '../components/AdminIssuePanel';

const LOGS_PAGE_LIMIT = 20;
const issueStatusLabels = { open: 'Chưa xử lý', investigating: 'Đang xử lý', verifying: 'Chờ xác minh', resolved: 'Đã chỉnh sửa', reopened: 'Tái phát' };

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme } = useAuth();

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [logsError, setLogsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin || !adminId) return;
    const controller = new AbortController();
    let active = true;
    async function fetchLogs() {
      setLogsLoading(true);
      setLogsError('');
      try {
        let query = supabase.from('system_logs')
          .select('*, profiles:user_id (email, username, display_name, role)', { count: 'exact' });
        if (logActionFilter !== 'all') query = query.eq('action', logActionFilter);
        if (severityFilter !== 'all') query = query.eq('severity', severityFilter);
        const from = (logsPage - 1) * LOGS_PAGE_LIMIT;
        const { data, error, count } = await query
          .order('last_seen_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
          .range(from, from + LOGS_PAGE_LIMIT - 1)
          .abortSignal(controller.signal);
        if (!active) return;
        if (error) throw error;
        const pages = Math.max(1, Math.ceil((count || 0) / LOGS_PAGE_LIMIT));
        setLogsTotalPages(pages);
        if (logsPage > pages) { setLogsPage(pages); return; }
        const issueIds = [...new Set((data || []).map(log => log.issue_id).filter(Boolean))];
        let issueById = new Map();
        if (issueIds.length) {
          const issueResult = await supabase.from('system_issues').select('id,status,resolved_at,fixed_version')
            .in('id', issueIds).abortSignal(controller.signal);
          if (!active) return;
          if (!issueResult.error) issueById = new Map((issueResult.data || []).map(issue => [issue.id, issue]));
        }
        setLogs((data || []).map(log => ({ ...log, issue: issueById.get(log.issue_id) })));
      } catch (error) {
        if (!active) return;
        setLogs([]);
        setLogsTotalPages(1);
        setLogsError(error.code === '42703'
          ? 'Cấu trúc log chưa tương thích. Cần kiểm tra database trước khi cập nhật.'
          : 'Không thể tải log hệ thống. Hãy thử tải lại.');
      } finally {
        if (active) setLogsLoading(false);
      }
    }
    fetchLogs();
    return () => { active = false; controller.abort(); };
  }, [isAdmin, adminId, logsPage, logActionFilter, severityFilter, refreshKey]);

  // Viewing evidence must not trigger retention deletion. A server-side job is
  // enabled only after the issue archive and database migration are verified.

  const formatDateTime = (value) => {
    if (!value) return 'Chưa rõ';
    return new Date(value).toLocaleString('vi-VN');
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'teacher') return 'Giáo viên';
    if (role === 'student') return 'Học sinh';
    return 'Hệ thống';
  };

  const formatLogDetails = (details) => {
    try {
      const raw = JSON.stringify(details || {});
      if (!raw) return '';
      return raw.length > 360 ? `${raw.slice(0, 360)}...` : raw;
    } catch {
      return '';
    }
  };

  const severityClasses = {
    warning: 'admin-log-severity--warning',
    error: 'admin-log-severity--error',
    critical: 'admin-log-severity--critical',
    security: 'admin-log-severity--security',
  };

  const severityLabels = {
    warning: 'Cảnh báo',
    error: 'Lỗi',
    critical: 'Nghiêm trọng',
    security: 'Bảo mật',
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Không có quyền truy cập</h2>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 bg-green-500 rounded-lg text-white"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-logs-page min-h-screen">
      <header className="admin-logs-header bg-gray-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Giám sát lỗi hệ thống</h1>
                <p className="text-gray-400 text-sm">Chỉ lưu lỗi, cảnh báo và dấu hiệu bảo mật bất thường</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition cursor-pointer"
                title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-yellow-400 animate-pulse" />}
              </button>

              <button
                onClick={() => setRefreshKey(value => value + 1)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <RefreshCw className={`w-5 h-5 text-white ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <AdminIssuePanel onStatusChanged={() => setRefreshKey(value => value + 1)} />
        <div className="admin-logs-panel game-card mb-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-4">
            <FileText className="w-5 h-5 text-orange-300" />
            Log lỗi được nhóm theo người dùng và ngày
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Mức độ</label>
              <select
                value={severityFilter}
                onChange={(event) => {
                  setLogsPage(1);
                  setSeverityFilter(event.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="warning">Cảnh báo</option>
                <option value="error">Lỗi</option>
                <option value="critical">Nghiêm trọng</option>
                <option value="security">Bảo mật</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Lọc theo action</label>
              <input
                aria-label="Lọc theo action chính xác"
                value={logActionFilter === 'all' ? '' : logActionFilter}
                placeholder="Tất cả action — nhập tên để lọc"
                onChange={event => {
                  setLogsPage(1);
                  setLogActionFilter(event.target.value.trim() || 'all');
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm"
              />
            </div>

            <div className="md:col-span-2 flex items-end justify-end text-gray-300 text-sm">
              Hạn lưu hiện tại: 30/90 ngày. Mở trang này không tự xóa log.
            </div>
          </div>

          {logsError && (
            <div className="mb-3 p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-100 text-sm">
              {logsError}
            </div>
          )}

          {logsLoading ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300 text-sm">Đang tải log hệ thống...</div>
          ) : logs.length === 0 ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300 text-sm">Chưa có log để hiển thị.</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <article key={log.id} className={`admin-log-card admin-log-card--${log.severity || 'error'} p-3 rounded-lg border`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-white font-medium flex flex-wrap items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-300" />
                        {log.action}
                        {log.issue ? <span className={`px-2 py-0.5 rounded-full border text-xs ${log.issue.status === 'resolved' ? 'border-emerald-500 text-emerald-600' : 'border-slate-400'}`}>
                          {issueStatusLabels[log.issue.status]}{log.issue.status === 'resolved' ? ` · ${log.issue.fixed_version}` : ''}
                        </span> : log.resolved_at && new Date(log.resolved_at) >= new Date(log.last_seen_at || log.created_at) ? (
                          <span className="px-2 py-0.5 rounded-full border border-emerald-500 text-xs text-emerald-600">
                            Đã chỉnh sửa · {formatDateTime(log.resolved_at)}
                          </span>
                        ) : <span className="text-xs text-gray-500">{log.issue_id ? 'Trạng thái ở hồ sơ xử lý phía trên' : 'Chưa xác nhận sửa'}</span>}
                        <span className={`admin-log-severity px-2 py-0.5 rounded-full border text-[10px] font-bold ${severityClasses[log.severity] || severityClasses.error}`}>
                          {severityLabels[log.severity] || 'Lỗi'}
                        </span>
                        {Number(log.occurrence_count || 1) > 1 && (
                          <span className="admin-log-repeat px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Lặp {Number(log.occurrence_count)} lần
                          </span>
                        )}
                      </p>
                      <p className="admin-log-identity text-gray-300 text-sm">
                        {log.profiles?.email || log.profiles?.username || 'system'} • {getRoleLabel(log.profiles?.role)}
                      </p>
                    </div>
                    <div className="admin-log-timing text-gray-400 text-xs md:text-right">
                      <p>Lần cuối: {formatDateTime(log.last_seen_at || log.created_at)}</p>
                      {log.route && <p className="text-gray-500">{log.route}</p>}
                    </div>
                  </div>
                  {log.message && <p className="admin-log-message mt-2 text-sm break-words">{log.message}</p>}
                  {formatLogDetails(log.details) && (
                    <details className="admin-log-details mt-2 text-xs break-all">
                      <summary className="cursor-pointer">Xem chi tiết lỗi</summary>
                      <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(log.details || {}, null, 2)}</pre>
                      <p>Phiên bản: {log.app_version || 'Chưa xác định'}</p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
              disabled={logsPage <= 1 || logsLoading}
              className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-gray-300 text-sm">Trang {logsPage}/{logsTotalPages}</span>
            <button
              onClick={() => setLogsPage((prev) => Math.min(logsTotalPages, prev + 1))}
              disabled={logsPage >= logsTotalPages || logsLoading}
              className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
