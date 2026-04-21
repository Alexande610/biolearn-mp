import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, RefreshCw, Search, Unlock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const USERS_PAGE_LIMIT = 12;
const DEFAULT_LOCK_REASON = 'Phát hiện hành vi bất thường. Vui lòng liên hệ quản trị viên.';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersRoleFilter, setUsersRoleFilter] = useState('all');
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [error, setError] = useState('');

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin || !adminId) return;
    fetchUsers();
  }, [isAdmin, adminId, usersPage, usersRoleFilter, usersSearchTerm]);

  const formatDateTime = (value) => {
    if (!value) return 'Chưa rõ';
    return new Date(value).toLocaleString('vi-VN');
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'teacher') return 'Giáo viên';
    return 'Học sinh';
  };

  const fetchUsers = async () => {
    if (!adminId) return;

    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (usersRoleFilter !== 'all') {
        query = query.eq('role', usersRoleFilter);
      }
      
      if (usersSearchTerm) {
        query = query.or(`display_name.ilike.%${usersSearchTerm}%,email.ilike.%${usersSearchTerm}%`);
      }

      const from = (usersPage - 1) * USERS_PAGE_LIMIT;
      const to = from + USERS_PAGE_LIMIT - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setUsersTotal(count || 0);
      setUsersTotalPages(Math.ceil((count || 0) / USERS_PAGE_LIMIT));
    } catch (err) {
      console.error(err);
      setUsers([]);
      setUsersTotal(0);
      setUsersTotalPages(1);
      setError('Không thể tải danh sách người dùng');
    }
    setLoading(false);
  };

  const applyUserFilter = () => {
    setUsersPage(1);
    setUsersSearchTerm(usersSearchInput.trim());
  };

  const toggleUserLock = async (targetUser) => {
    if (!targetUser?._id || !adminId || targetUser.role === 'admin') return;

    let lockReason = '';
    if (!targetUser.isLocked) {
      const inputReason = window.prompt(
        'Nhập lý do khóa tài khoản:',
        targetUser.lockReason || DEFAULT_LOCK_REASON
      );
      if (inputReason === null) return;
      lockReason = inputReason.trim();
    }

    setActionLoadingId(targetUser._id);
    setError('');
    try {
      const isLocked = !targetUser.is_locked;
      const { error } = await supabase
        .from('profiles')
        .update({
          is_locked: isLocked,
          lock_reason: isLocked ? lockReason : null,
          locked_at: isLocked ? new Date().toISOString() : null
        })
        .eq('id', targetUser.id);

      if (error) throw error;

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || 'Không thể cập nhật trạng thái tài khoản');
      }

      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Cập nhật trạng thái tài khoản thất bại');
    }
    setActionLoadingId('');
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
                <h1 className="text-xl font-bold text-white">Quản lý users</h1>
                <p className="text-gray-400 text-sm">Khóa/mở khóa tài khoản người dùng</p>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="game-card mb-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            Danh sách toàn bộ người dùng
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-300 block mb-1">Tìm theo tên/email</label>
              <div className="flex gap-2">
                <input
                  value={usersSearchInput}
                  onChange={(event) => setUsersSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyUserFilter();
                  }}
                  placeholder="Nhập từ khóa..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm"
                />
                <button
                  onClick={applyUserFilter}
                  className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Vai trò</label>
              <select
                value={usersRoleFilter}
                onChange={(event) => {
                  setUsersPage(1);
                  setUsersRoleFilter(event.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm">
                Tổng: {usersTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-100 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300 text-sm">Đang tải danh sách người dùng...</div>
          ) : users.length === 0 ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300 text-sm">Không có người dùng nào khớp bộ lọc.</div>
          ) : (
            <div className="space-y-2">
              {users.map((item) => (
                <div key={item._id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                    <div>
                      <p className="text-white font-semibold">{item.displayName || item.username || item.email}</p>
                      <p className="text-gray-300 text-sm">{item.email || 'Không có email'} • {getRoleLabel(item.role)}</p>
                      <p className="text-gray-400 text-xs mt-1">Hoạt động gần nhất: {formatDateTime(item.lastActiveAt)}</p>
                      {item.isLocked && (
                        <>
                          <p className="text-red-200 text-xs mt-1">Lý do khóa: {item.lockReason || DEFAULT_LOCK_REASON}</p>
                          <p className="text-red-200 text-xs mt-1">Khóa lúc: {formatDateTime(item.lockedAt)}</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs ${item.isLocked ? 'bg-red-500/20 text-red-200 border border-red-400/30' : 'bg-green-500/20 text-green-200 border border-green-400/30'}`}>
                        {item.isLocked ? 'Đang khóa' : 'Bình thường'}
                      </span>

                      {item.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserLock(item)}
                          disabled={actionLoadingId === item._id}
                          className={`px-3 py-2 rounded-lg text-sm text-white disabled:opacity-60 ${item.isLocked ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'}`}
                        >
                          {actionLoadingId === item.id ? 'Đang xử lý...' : item.is_locked ? (
                            <span className="inline-flex items-center gap-1"><Unlock className="w-4 h-4" /> Mở khóa</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Lock className="w-4 h-4" /> Khóa</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
              disabled={usersPage <= 1 || loading}
              className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-gray-300 text-sm">Trang {usersPage}/{usersTotalPages}</span>
            <button
              onClick={() => setUsersPage((prev) => Math.min(usersTotalPages, prev + 1))}
              disabled={usersPage >= usersTotalPages || loading}
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
