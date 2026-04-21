import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);

  const [teacherRequests, setTeacherRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState('');
  const [requestError, setRequestError] = useState('');

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';
  const ONLINE_WINDOW_MINUTES = 3;

  useEffect(() => {
    if (isAdmin && adminId) {
      fetchAdminStats();
      fetchTeacherRequests();
    }
  }, [isAdmin, adminId]);

  const formatDateTime = (value) => {
    if (!value) return 'Chưa rõ';
    return new Date(value).toLocaleString('vi-VN');
  };

  const openAnalytics = () => {
    window.open('https://analytics.google.com', '_blank', 'noopener,noreferrer');
  };

  const goToLessonManagement = () => {
    navigate('/admin/lessons?adminEdit=1&section=lessons');
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'teacher') return 'Giáo viên';
    return 'Học sinh';
  };

  const fetchTeacherRequests = async () => {
    if (!adminId) return;

    setRequestLoading(true);
    setRequestError('');
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeacherRequests(data || []);
    } catch (err) {
      setTeacherRequests([]);
      setRequestError('Không thể tải danh sách yêu cầu giáo viên');
    }
    setRequestLoading(false);
  };

  const approveTeacherRequest = async (requestId) => {
    if (!adminId || !requestId) return;

    setProcessingRequestId(requestId);
    setRequestError('');
    try {
      const approvedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error } = await supabase
        .from('teacher_requests')
        .update({
          status: 'approved',
          approved_code: approvedCode,
          code_expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchTeacherRequests();
    } catch (err) {
      setRequestError(err.message || 'Duyệt yêu cầu thất bại');
    }
    setProcessingRequestId('');
  };

  const rejectTeacherRequest = async (requestId) => {
    if (!adminId || !requestId) return;

    setProcessingRequestId(requestId);
    setRequestError('');
    try {
      const res = await axios.post(
        '/api/admin/reject-teacher-request',
        { requestId },
        {
          headers: { 'x-admin-id': adminId },
          params: { adminId },
        }
      );

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Không thể từ chối yêu cầu giáo viên');
      }

      await fetchTeacherRequests();
    } catch (err) {
      setRequestError(err?.response?.data?.message || err.message || 'Từ chối yêu cầu thất bại');
    }
    setProcessingRequestId('');
  };

  const fetchAdminStats = async () => {
    if (!adminId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Active today
      const today = new Date();
      today.setHours(0,0,0,0);
      const { count: activeToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', today.toISOString());

      // 3. Active users (online window)
      const onlineWindow = new Date();
      onlineWindow.setMinutes(onlineWindow.getMinutes() - ONLINE_WINDOW_MINUTES);
      const { data: onlineUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('last_active_at', onlineWindow.toISOString())
        .order('last_active_at', { ascending: false })
        .limit(8);

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        activeWeek: activeToday || 0, // Simplified
        totalLessonsCompleted: 0, // Would need more tables
        averageScore: 0,
        newUsersThisWeek: 0,
      });

      setActiveUsers(
        (onlineUsers || []).map((item) => ({
          id: item.id,
          name: item.display_name || item.username || item.email || 'Người dùng',
          role: item.role || 'student',
          score: item.total_score || 0,
          lastActive: item.last_active_at ? new Date(item.last_active_at).toLocaleString('vi-VN') : 'Không rõ',
        }))
      );
    } catch (err) {
      console.error(err);
      setStats(null);
      setActiveUsers([]);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-400 mb-4">Bạn không có quyền xem trang này</p>
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

  const pendingTeacherRequests = teacherRequests.filter((request) => request.status === 'pending');
  const activeApprovedRequests = teacherRequests.filter((request) => {
    if (request.status !== 'approved' || !request.codeExpiresAt) return false;
    return new Date(request.codeExpiresAt).getTime() > Date.now();
  });

  return (
    <div className="min-h-screen">
      <header className="bg-gray-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Quản lý Sinh Học Vui</p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchAdminStats();
                fetchTeacherRequests();
              }}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-white font-semibold">Google Analytics</h3>
              <p className="text-blue-200 text-sm">Tracking ID: G-948G9QV2DF</p>
            </div>
            <button
              onClick={openAnalytics}
              className="ml-auto px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white text-sm"
            >
              Xem Analytics
            </button>
          </div>
        </div>

        <div className="game-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Duyệt yêu cầu mã giáo viên</h3>
            <button
              onClick={fetchTeacherRequests}
              disabled={requestLoading}
              className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 disabled:opacity-60"
            >
              {requestLoading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {requestError && (
            <div className="mb-3 p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-100 text-sm">
              {requestError}
            </div>
          )}

          {pendingTeacherRequests.length === 0 && !requestLoading && (
            <div className="p-3 rounded-lg bg-white/5 text-gray-300 text-sm">
              Hiện chưa có yêu cầu giáo viên nào đang chờ duyệt.
            </div>
          )}

          <div className="space-y-3">
            {pendingTeacherRequests.map((request) => (
              <div key={request._id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div>
                    <p className="text-white font-semibold">{request.username}</p>
                    <p className="text-gray-300 text-sm">{request.email}</p>
                    <p className="text-gray-400 text-xs mt-1">Gửi lúc: {formatDateTime(request.createdAt)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveTeacherRequest(request._id)}
                      disabled={processingRequestId === request._id}
                      className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white text-sm disabled:opacity-60"
                    >
                      {processingRequestId === request._id ? 'Đang xử lý...' : 'Duyệt cấp mã'}
                    </button>

                    <button
                      onClick={() => rejectTeacherRequest(request._id)}
                      disabled={processingRequestId === request._id}
                      className="px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeApprovedRequests.length > 0 && (
            <div className="mt-5">
              <h4 className="text-white font-medium mb-2">Mã đã cấp còn hiệu lực</h4>
              <div className="space-y-2">
                {activeApprovedRequests.map((request) => (
                  <div key={`approved-${request._id}`} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-green-200 text-sm">
                      <strong>{request.username}</strong> - {request.email}
                    </p>
                    <p className="text-white mt-1">
                      Mã: <span className="font-bold tracking-wider">{request.approvedCode}</span>
                    </p>
                    <p className="text-green-100/80 text-xs mt-1">Hết hạn lúc: {formatDateTime(request.codeExpiresAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tổng người dùng</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Online hôm nay</p>
                <p className="text-2xl font-bold text-white">{stats?.activeToday?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active tuần</p>
                <p className="text-2xl font-bold text-white">{stats?.activeWeek?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/30 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Bài đã hoàn thành</p>
                <p className="text-2xl font-bold text-white">{stats?.totalLessonsCompleted?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Điểm trung bình</p>
                <p className="text-2xl font-bold text-white">{stats?.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-500/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Người dùng mới (tuần)</p>
                <p className="text-2xl font-bold text-white">+{stats?.newUsersThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="game-card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Người dùng đang hoạt động ({ONLINE_WINDOW_MINUTES} phút gần nhất)
          </h3>

          {activeUsers.length === 0 ? (
            <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-sm">
              Hiện chưa có người dùng online trong {ONLINE_WINDOW_MINUTES} phút gần đây.
            </div>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-bold">{onlineUser.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{onlineUser.name}</p>
                    <p className="text-gray-400 text-sm">{onlineUser.score} điểm • {getRoleLabel(onlineUser.role)}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-green-400 rounded-full inline-block mr-2 animate-pulse"></div>
                    <span className="text-gray-400 text-sm">{onlineUser.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="game-card text-center hover:bg-white/20 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-white text-sm">Quản lý users</span>
          </button>
          <button
            onClick={goToLessonManagement}
            className="game-card text-center hover:bg-white/20 transition-colors"
          >
            <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <span className="text-white text-sm">Quản lý bài học</span>
          </button>
          <button
            onClick={openAnalytics}
            className="game-card text-center hover:bg-white/20 transition-colors"
          >
            <BarChart2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <span className="text-white text-sm">Báo cáo</span>
          </button>
          <button
            onClick={() => navigate('/admin/logs')}
            className="game-card text-center hover:bg-white/20 transition-colors"
          >
            <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <span className="text-white text-sm">Hoạt động</span>
          </button>
        </div>
      </main>
    </div>
  );
}
