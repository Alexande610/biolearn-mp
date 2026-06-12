import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, RefreshCw, Search, Unlock, Users, 
  Mail, Send, Copy, Check, Plus, Edit, X, Trophy, Zap, Target, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const USERS_PAGE_LIMIT = 12;
const DEFAULT_LOCK_REASON = 'Phát hiện hành vi bất thường. Vui lòng liên hệ quản trị viên.';

// Helper to format large numbers to compact k/m format
const formatNumberCompact = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

// Helper to parse compact k/m input back to integer
const parseCompactNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toLowerCase().replace(/,/g, '').trim();
  if (clean.endsWith('k')) {
    return Math.floor(parseFloat(clean.slice(0, -1)) * 1000);
  }
  if (clean.endsWith('m')) {
    return Math.floor(parseFloat(clean.slice(0, -1)) * 1000000);
  }
  if (clean.endsWith('b')) {
    return Math.floor(parseFloat(clean.slice(0, -1)) * 1000000000);
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper for avatar URL mapping
const getAvatarUrl = (avatar) => {
  const avatarMap = {
    'adventurer-1': '/images/Avatar/adventurer-1.png',
    'adventurer-2': '/images/Avatar/adventurer-2.png',
    'adventurer-3': '/images/Avatar/adventurer-3.png',
    'adventurer-4': '/images/Avatar/adventurer-4.png',
    'adventurer-5': '/images/Avatar/adventurer-5.png',
    'avataaars-1': '/images/Avatar/avataaars-1.png',
    'avataaars-2': '/images/Avatar/avataaars-2.png',
    'avataaars-3': '/images/Avatar/avataaars-3.png',
    'avataaars-4': '/images/Avatar/avataaars-4.png',
    'avataaars-5': '/images/Avatar/avataaars-5.png',
    'bigEars-1': '/images/Avatar/bigEars-1.png',
    'bigEars-2': '/images/Avatar/bigEars-2.png',
    'bigEars-3': '/images/Avatar/bigEars-3.png',
    'bigEars-4': '/images/Avatar/bigEars-4.png',
    'bigEars-5': '/images/Avatar/bigEars-5.png',
    'bottts-1': '/images/Avatar/bottts-1.png',
    'bottts-2': '/images/Avatar/bottts-2.png',
    'bottts-3': '/images/Avatar/bottts-3.png',
    'bottts-4': '/images/Avatar/bottts-4.png',
    'bottts-5': '/images/Avatar/bottts-5.png',
    'rings-1': '/images/Avatar/rings-1.png',
    'rings-2': '/images/Avatar/rings-2.png',
    'rings-3': '/images/Avatar/rings-3.png',
    'rings-4': '/images/Avatar/rings-4.png',
    'rings-5': '/images/Avatar/rings-5.png',
  };
  if (!avatar) return avatarMap['adventurer-1'];
  if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar;
  return avatarMap[avatar] || avatarMap['adventurer-1'];
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

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

  // Selected User for details
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userPvPMatches, setUserPvPMatches] = useState([]);
  const [userQuizRooms, setUserQuizRooms] = useState([]);
  const [userSystemLogs, setUserSystemLogs] = useState([]);
  const [extraLoading, setExtraLoading] = useState(false);

  // States for resource editing
  const [editLevel, setEditLevel] = useState('');
  const [editCoin, setEditCoin] = useState('');
  const [savingResources, setSavingResources] = useState(false);

  // Mail forms
  const [showMailForm, setShowMailForm] = useState(false);
  const [showGlobalMailForm, setShowGlobalMailForm] = useState(false);
  const [mailTitle, setMailTitle] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [mailCoins, setMailCoins] = useState('');
  const [sendingMail, setSendingMail] = useState(false);

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
    if (!targetUser?.id || !adminId || targetUser.role === 'admin') return;

    let lockReason = '';
    if (!targetUser.is_locked) {
      const inputReason = window.prompt(
        'Nhập lý do khóa tài khoản:',
        targetUser.lock_reason || DEFAULT_LOCK_REASON
      );
      if (inputReason === null) return;
      lockReason = inputReason.trim();
    }

    setActionLoadingId(targetUser.id);
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

      if (selectedUserDetail?.id === targetUser.id) {
        setSelectedUserDetail(prev => ({
          ...prev,
          is_locked: isLocked,
          lock_reason: isLocked ? lockReason : null,
          locked_at: isLocked ? new Date().toISOString() : null
        }));
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Cập nhật trạng thái tài khoản thất bại');
    }
    setActionLoadingId('');
  };

  const handleSelectUser = (userItem) => {
    if (selectedUserDetail?.id === userItem.id) {
      setSelectedUserDetail(null);
    } else {
      setSelectedUserDetail(userItem);
      setEditLevel(String(userItem.level || 1));
      setEditCoin(formatNumberCompact(userItem.coins || 0));
      fetchUserExtraDetails(userItem.id);
    }
  };

  const fetchUserExtraDetails = async (userId) => {
    setExtraLoading(true);
    try {
      const { data: pvpData } = await supabase
        .from('pvp_matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(5);
      setUserPvPMatches(pvpData || []);

      const { data: logsData } = await supabase
        .from('system_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setUserSystemLogs(logsData || []);

      const { data: roomsData } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      setUserQuizRooms(roomsData || []);
    } catch (err) {
      console.error(err);
    }
    setExtraLoading(false);
  };

  const handleUpdateResources = async (userId) => {
    const levelInt = parseInt(editLevel, 10);
    const coinsInt = parseCompactNumber(editCoin);

    if (isNaN(levelInt) || levelInt < 1 || levelInt > 9999) {
      showToast("Cấp độ không hợp lệ (tối đa 9999)!", "warning");
      return;
    }

    setSavingResources(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          level: levelInt,
          coins: coinsInt
        })
        .eq('id', userId);

      if (error) throw error;

      setSelectedUserDetail(prev => prev ? { ...prev, level: levelInt, coins: coinsInt } : null);
      fetchUsers();
      showToast("Đã cập nhật cấp độ và xu thành công!", "success");
    } catch (err) {
      showToast("Lỗi cập nhật: " + err.message, "error");
    }
    setSavingResources(false);
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!mailTitle.trim() || !mailContent.trim() || !selectedUserDetail?.id) return;

    setSendingMail(true);
    try {
      const coinsInt = mailCoins ? parseInt(mailCoins, 10) : 0;
      const { error } = await supabase
        .from('user_mails')
        .insert([{
          receiver_id: selectedUserDetail.id,
          title: mailTitle.trim(),
          content: mailContent.trim(),
          coins_attached: isNaN(coinsInt) ? 0 : coinsInt
        }]);

      if (error) throw error;
      
      showToast("Gửi thư thành công!", "success");
      setMailTitle('');
      setMailContent('');
      setMailCoins('');
      setShowMailForm(false);
    } catch (err) {
      showToast("Lỗi gửi thư: " + err.message, "error");
    }
    setSendingMail(false);
  };

  const handleSendGlobalMail = async (e) => {
    e.preventDefault();
    if (!mailTitle.trim() || !mailContent.trim()) return;

    setSendingMail(true);
    try {
      const coinsInt = mailCoins ? parseInt(mailCoins, 10) : 0;
      const attachmentCoins = isNaN(coinsInt) ? 0 : coinsInt;

      const { data: allUsers, error: fetchErr } = await supabase
        .from('profiles')
        .select('id');
      
      if (fetchErr) throw fetchErr;

      if (!allUsers || allUsers.length === 0) {
        showToast("Không tìm thấy người dùng nào!", "warning");
        setSendingMail(false);
        return;
      }

      const mailRows = allUsers.map(u => ({
        receiver_id: u.id,
        title: mailTitle.trim(),
        content: mailContent.trim(),
        coins_attached: attachmentCoins,
        is_read: false,
        is_claimed: false
      }));

      const { error: insertErr } = await supabase
        .from('user_mails')
        .insert(mailRows);
      
      if (insertErr) throw insertErr;

      showToast(`Đã gửi thư thành công tới ${allUsers.length} người dùng!`, "success");
      setMailTitle('');
      setMailContent('');
      setMailCoins('');
      setShowGlobalMailForm(false);
    } catch (err) {
      showToast("Lỗi gửi thư: " + err.message, "error");
    }
    setSendingMail(false);
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
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Quản lý users</h1>
                <p className="text-gray-400 text-sm">Khóa/mở khóa tài khoản & tặng tài nguyên</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMailTitle('');
                  setMailContent('');
                  setMailCoins('');
                  setShowGlobalMailForm(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Gửi thư toàn bộ</span>
              </button>

              <button
                onClick={fetchUsers}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition"
              >
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 relative">
          
          {/* Cột trái: Danh sách người dùng */}
          <div className={`transition-all duration-300 ${selectedUserDetail ? 'w-full lg:w-[55%]' : 'w-full'}`}>
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
                    style={{ color: '#fff', backgroundColor: '#1f2937' }}
                  >
                    <option value="all" style={{ color: '#fff', backgroundColor: '#1f2937' }}>Tất cả</option>
                    <option value="student" style={{ color: '#fff', backgroundColor: '#1f2937' }}>Học sinh</option>
                    <option value="teacher" style={{ color: '#fff', backgroundColor: '#1f2937' }}>Giáo viên</option>
                    <option value="admin" style={{ color: '#fff', backgroundColor: '#1f2937' }}>Admin</option>
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
                  {users.map((item) => {
                    const isSelected = selectedUserDetail?.id === item.id;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectUser(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                          <div>
                            <p className="text-white font-semibold">{item.display_name || item.username || item.email}</p>
                            <p className="text-gray-300 text-xs">{item.email || 'Không có email'} • {getRoleLabel(item.role)}</p>
                            <p className="text-gray-400 text-[10px] mt-1">Hoạt động gần nhất: {formatDateTime(item.last_active_at)}</p>
                            {item.is_locked && (
                              <p className="text-red-200 text-[10px] mt-1">Bị khóa: {item.lock_reason || DEFAULT_LOCK_REASON}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.is_locked ? 'bg-red-500/20 text-red-200 border border-red-400/30' : 'bg-green-500/20 text-green-200 border border-green-400/30'}`}>
                              {item.is_locked ? 'Đang khóa' : 'Bình thường'}
                            </span>

                            {item.role !== 'admin' && (
                              <button
                                onClick={() => toggleUserLock(item)}
                                disabled={actionLoadingId === item.id}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition active:scale-95 disabled:opacity-60 cursor-pointer ${item.is_locked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                              >
                                {actionLoadingId === item.id ? '...' : item.is_locked ? 'Mở khóa' : 'Khóa'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                  disabled={usersPage <= 1 || loading}
                  className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-50 cursor-pointer"
                >
                  Trang trước
                </button>
                <span className="text-gray-300 text-sm">Trang {usersPage}/{usersTotalPages}</span>
                <button
                  onClick={() => setUsersPage((prev) => Math.min(usersTotalPages, prev + 1))}
                  disabled={usersPage >= usersTotalPages || loading}
                  className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-50 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Chi tiết người dùng slide-out panel */}
          {selectedUserDetail && (
            <div 
              className="w-full lg:w-[42%] lg:fixed lg:right-4 lg:top-24 lg:bottom-4 bg-slate-900/90 border border-white/10 rounded-3xl p-6 overflow-y-auto z-40 backdrop-blur-xl animate-in slide-in-from-right duration-300 flex flex-col justify-between"
            >
              {/* Header chi tiết */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-white font-black text-sm uppercase tracking-wider italic">Thông Tin Chi Tiết</h3>
                <button 
                  onClick={() => setSelectedUserDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nội dung chi tiết */}
              <div className="space-y-6 flex-1 pr-1">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden bg-white/5 shadow-inner">
                    <img 
                      src={getAvatarUrl(selectedUserDetail.avatar_url || selectedUserDetail.avatar)} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-base truncate uppercase tracking-tight">
                      {selectedUserDetail.display_name || 'Người chơi'}
                    </h4>
                    <p className="text-gray-400 text-xs truncate mt-0.5">{selectedUserDetail.email}</p>
                    <span className="inline-block mt-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      {getRoleLabel(selectedUserDetail.role)}
                    </span>
                  </div>
                </div>

                {/* UID Section */}
                <div className="p-3 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">User ID (UID)</p>
                    <p className="text-white text-xs font-mono truncate select-all">{selectedUserDetail.id}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUserDetail.id);
                      showToast("Đã sao chép UID!", "success");
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition active:scale-95 cursor-pointer"
                    title="Sao chép UID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tài nguyên */}
                <div className="p-4 rounded-3xl border border-white/5 bg-white/5 space-y-4">
                  <h5 className="text-white font-black text-[10px] uppercase tracking-widest text-[#B2EE55]">Điều chỉnh tài nguyên</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 uppercase font-black tracking-widest">Cấp độ (Level)</label>
                      <input 
                        type="number"
                        min="1"
                        max="9999"
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 uppercase font-black tracking-widest">Số Xu (Coins)</label>
                      <input 
                        type="text"
                        value={editCoin}
                        onChange={(e) => setEditCoin(e.target.value)}
                        placeholder="Ví dụ: 100k, 2.5m, 5000"
                        className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateResources(selectedUserDetail.id)}
                    disabled={savingResources}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingResources ? 'Đang lưu...' : 'Cập nhật tài nguyên'}</span>
                  </button>
                </div>

                {/* Học tập & Xếp hạng */}
                <div className="p-4 rounded-3xl border border-white/5 bg-white/5 space-y-3">
                  <h5 className="text-white font-black text-[10px] uppercase tracking-widest text-emerald-400">Thống kê học tập</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                      <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Điểm tuần</p>
                      <p className="text-white font-black text-sm mt-1">{(selectedUserDetail.weekly_score ?? 0).toLocaleString()} XP</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                      <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Tổng điểm</p>
                      <p className="text-white font-black text-sm mt-1">{(selectedUserDetail.total_score ?? 0).toLocaleString()} XP</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                      <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Đăng nhập</p>
                      <p className="text-white font-black text-sm mt-1">{selectedUserDetail.login_streak ?? 0} ngày liên tiếp</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                      <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Hoàn thành</p>
                      <p className="text-white font-black text-sm mt-1">{selectedUserDetail.levels_completed ?? 0} cấp độ</p>
                    </div>
                  </div>
                </div>

                {/* Tiến độ chi tiết từng lớp */}
                <div className="p-4 rounded-3xl border border-white/5 bg-white/5 space-y-3">
                  <h5 className="text-white font-black text-[10px] uppercase tracking-widest text-purple-400">Tiến độ chi tiết các lớp</h5>
                  <div className="space-y-2 text-xs">
                    {['6', '7', '8', '9', '10', '11', '12'].map((classId) => {
                      const classProg = selectedUserDetail.class_progress?.[classId] || {};
                      const completedCount = Object.keys(classProg).filter(k => classProg[k]?.completed).length;

                      return (
                        <div key={classId} className="flex items-center justify-between bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                          <span className="font-bold text-white">Sinh học Lớp {classId}</span>
                          <span className="text-gray-400 text-[10px]">Đã học: <span className="text-emerald-400 font-bold">{completedCount} bài</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Room & PvP History */}
                <div className="p-4 rounded-3xl border border-white/5 bg-white/5 space-y-3">
                  <h5 className="text-white font-black text-[10px] uppercase tracking-widest text-yellow-400">Lịch sử PvP & Room</h5>
                  {extraLoading ? (
                    <p className="text-gray-400 text-xs">Đang tải...</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {userPvPMatches.length === 0 ? (
                        <p className="text-gray-500 italic text-[11px]">Chưa có lịch sử PvP</p>
                      ) : (
                        userPvPMatches.map((match) => {
                          const isWinner = match.winner_id === selectedUserDetail.id;
                          return (
                            <div key={match.id} className="flex items-center justify-between bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                              <span className="text-white">Trận đấu PvP Lớp {match.class_id}</span>
                              <span className={`font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>{isWinner ? 'Thắng' : 'Thua'}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Activity logs */}
                <div className="p-4 rounded-3xl border border-white/5 bg-white/5 space-y-3">
                  <h5 className="text-white font-black text-[10px] uppercase tracking-widest text-blue-400">Hoạt động gần đây</h5>
                  {extraLoading ? (
                    <p className="text-gray-400 text-xs">Đang tải...</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {userSystemLogs.length === 0 ? (
                        <p className="text-gray-500 italic text-[11px]">Chưa có hoạt động nào</p>
                      ) : (
                        userSystemLogs.map((log) => (
                          <div key={log.id} className="p-2.5 rounded-xl bg-black/10 border border-white/5 text-[11px]">
                            <div className="flex justify-between text-gray-400 mb-1">
                              <span className="font-bold text-gray-300 text-[10px]">{log.action}</span>
                              <span>{new Date(log.created_at).toLocaleTimeString('vi-VN')}</span>
                            </div>
                            <p className="text-gray-300 truncate">{JSON.stringify(log.details)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setMailTitle('');
                    setMailContent('');
                    setMailCoins('');
                    setShowMailForm(true);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 font-black text-xs uppercase tracking-widest hover:bg-cyan-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gửi thư cá nhân</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Form gửi thư cá nhân (Đã di chuyển ra ngoài panel để không bị che khuất) */}
      {showMailForm && selectedUserDetail && (
        <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendMail} className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-white font-black text-xs uppercase tracking-widest">Gửi thư cho {selectedUserDetail.display_name || 'Học sinh'}</h4>
              <button type="button" onClick={() => setShowMailForm(false)} className="text-white/60 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Tiêu đề thư</label>
              <input 
                type="text"
                required
                autoFocus
                value={mailTitle}
                onChange={(e) => setMailTitle(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Nhập tiêu đề..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Nội dung thư</label>
              <textarea 
                required
                rows={4}
                value={mailContent}
                onChange={(e) => setMailContent(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                placeholder="Nhập nội dung thư..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Xu đính kèm (Tùy chọn)</label>
              <input 
                type="number"
                min="0"
                value={mailCoins}
                onChange={(e) => setMailCoins(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Ví dụ: 1000"
              />
            </div>
            <button 
              type="submit" 
              disabled={sendingMail}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sendingMail ? 'Đang gửi...' : 'Gửi thư'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Form gửi thư toàn hệ thống */}
      {showGlobalMailForm && (
        <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendGlobalMail} className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-white font-black text-xs uppercase tracking-widest">Gửi thư toàn hệ thống</h4>
              <button type="button" onClick={() => setShowGlobalMailForm(false)} className="text-white/60 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Tiêu đề thư</label>
              <input 
                type="text"
                required
                autoFocus
                value={mailTitle}
                onChange={(e) => setMailTitle(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Nhập tiêu đề cho tất cả người dùng..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Nội dung thư</label>
              <textarea 
                required
                rows={4}
                value={mailContent}
                onChange={(e) => setMailContent(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                placeholder="Nhập nội dung thư..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">Xu đính kèm (Tùy chọn)</label>
              <input 
                type="number"
                min="0"
                value={mailCoins}
                onChange={(e) => setMailCoins(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Ví dụ: 1000"
              />
            </div>
            <button 
              type="submit" 
              disabled={sendingMail}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sendingMail ? 'Đang gửi...' : 'Gửi thư cho tất cả'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
