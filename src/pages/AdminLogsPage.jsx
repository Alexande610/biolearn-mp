import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, FileText, RefreshCw, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const LOGS_PAGE_LIMIT = 20;

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme } = useAuth();

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [logsError, setLogsError] = useState('');

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin || !adminId) return;
    fetchSystemLogs();
  }, [isAdmin, adminId, logsPage, logActionFilter]);

  const fetchSystemLogs = async () => {
    if (!adminId) return;

    setLogsLoading(true);
    setLogsError('');
    try {
      let query = supabase
        .from('system_logs')
        .select(`
          *,
          profiles:user_id (email, username, display_name, role)
        `, { count: 'exact' });

      if (logActionFilter !== 'all') {
        query = query.eq('action', logActionFilter);
      }

      const from = (logsPage - 1) * LOGS_PAGE_LIMIT;
      const to = from + LOGS_PAGE_LIMIT - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
      setLogsTotalPages(Math.ceil((count || 0) / LOGS_PAGE_LIMIT));
    } catch (err) {
      console.error(err);
      setLogs([]);
      setLogsTotalPages(1);
      setLogsError('Không thể tải log hệ thống');
    }
    setLogsLoading(false);
  };

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
    } catch (err) {
      return '';
    }
  };

  const availableLogActions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(),
    [logs]
  );

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
    <div className="min-h-screen">
      <header className="bg-gray-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
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
                <h1 className="text-xl font-bold text-white">Hoạt động hệ thống</h1>
                <p className="text-gray-400 text-sm">Theo dõi toàn bộ log và hành vi bất thường</p>
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
                onClick={fetchSystemLogs}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <RefreshCw className={`w-5 h-5 text-white ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="game-card mb-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-4">
            <FileText className="w-5 h-5 text-orange-300" />
            Log hệ thống
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-300 block mb-1">Lọc theo action</label>
              <select
                value={logActionFilter}
                onChange={(event) => {
                  setLogsPage(1);
                  setLogActionFilter(event.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm"
              >
                <option value="all">Tất cả action</option>
                {availableLogActions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end justify-end text-gray-300 text-sm">
              Dùng để theo dõi tài khoản hoặc hành vi bất thường
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
                <div key={log._id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-white font-medium inline-flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-300" />
                        {log.action}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {log.profiles?.email || log.profiles?.username || 'system'} • {getRoleLabel(log.profiles?.role)}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs">{formatDateTime(log.created_at)}</p>
                  </div>
                  {formatLogDetails(log.details) && (
                    <p className="mt-2 text-xs text-gray-300 break-all">{formatLogDetails(log.details)}</p>
                  )}
                </div>
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
