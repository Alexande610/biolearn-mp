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
  Sun,
  Moon,
  Compass,
  Mail,
  Send,
  Check,
  Copy,
  CheckCheck,
  Boxes
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendAutoTeacherCodeEmail } from '../lib/email';
import { useToast } from '../components/Toast';
import { reportSystemError } from '../lib/observability';
import { loadPresentationPeople } from '../lib/presentationPeople';
import { loadAllAdminProfiles, summarizeAdminProfiles } from '../lib/adminProfileMetrics';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, onlinePresence } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);
  const onlineCountLabel = onlinePresence?.status === 'connected'
    ? onlinePresence.count.toLocaleString('vi-VN')
    : onlinePresence?.status === 'connecting' ? 'Đang kết nối…' : 'Mất kết nối';

  const [teacherRequests, setTeacherRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState('');
  const [requestError, setRequestError] = useState('');

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';

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

  const approveTeacherRequest = async (requestItem) => {
    const requestId = typeof requestItem === 'string' ? requestItem : requestItem?.id;
    if (!adminId || !requestId) return;

    setProcessingRequestId(requestId);
    setRequestError('');

    try {
      const approvedCode = 'TEACH' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 60 phút hiệu lực

      const expiresAtFormatted = expiresAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + expiresAt.toLocaleDateString('vi-VN');

      // 1. Cập nhật trạng thái và mã xác thực vào cơ sở dữ liệu Supabase (Hạn 60 phút)
      const { error } = await supabase
        .from('teacher_requests')
        .update({
          status: 'approved',
          approved_code: approvedCode,
          code_expires_at: expiresAt.toISOString(),
          decision_at: new Date().toISOString(),
          decision_by: adminId
        })
        .eq('id', requestId);

      if (error) throw error;

      // 2. TỰ ĐỘNG GỬI EMAIL CHẠY NGẦM ĐẾN HÒM THƯ GIÁO VIÊN TỪ supportbiolearn@gmail.com
      const targetReq = typeof requestItem === 'object' ? requestItem : teacherRequests.find(r => r.id === requestId);
      const targetEmail = targetReq?.email || '';
      const targetName = targetReq?.username || '';

      if (targetEmail) {
        const mailResult = await sendAutoTeacherCodeEmail({
          teacherEmail: targetEmail,
          teacherName: targetName,
          approvedCode: approvedCode,
          expiresAtFormatted: expiresAtFormatted
        });

        if (mailResult.success) {
          showToast(`✅ Đã duyệt mã [${approvedCode}] & gửi email thành công tới: ${targetEmail}!`, 'success', 4500);
        } else {
          const emailError = `Mã [${approvedCode}] đã được duyệt nhưng email chưa gửi được. ${mailResult.error}`;
          setRequestError(emailError);
          showToast(emailError, 'error', 8000);
        }
      } else {
        showToast(`✅ Đã duyệt cấp mã [${approvedCode}] thành công!`, 'success', 4000);
      }

      await fetchTeacherRequests();
    } catch (err) {
      setRequestError(err.message || 'Duyệt yêu cầu thất bại');
      showToast(err.message || 'Duyệt yêu cầu thất bại', 'error');
    }
    setProcessingRequestId('');
  };

  const rejectTeacherRequest = async (requestId) => {
    if (!adminId || !requestId) return;

    setProcessingRequestId(requestId);
    setRequestError('');
    try {
      const { error } = await supabase
        .from('teacher_requests')
        .update({
          status: 'rejected',
          approved_code: null,
          code_expires_at: null,
          decision_at: new Date().toISOString(),
          decision_by: adminId
        })
        .eq('id', requestId);

      if (error) throw error;

      showToast('Đã từ chối yêu cầu mã giáo viên thành công', 'info');
      await fetchTeacherRequests();
    } catch (err) {
      setRequestError(err.message || 'Từ chối yêu cầu thất bại');
      showToast(err.message || 'Từ chối thất bại', 'error');
    }
    setProcessingRequestId('');
  };

  const handleResendAutoEmail = async (request) => {
    if (!request?.email || !request?.approved_code) return;
    setProcessingRequestId(request.id);
    setRequestError('');
    try {
      const expiresAtFormatted = request.code_expires_at
        ? formatDateTime(request.code_expires_at)
        : undefined;
      const mailResult = await sendAutoTeacherCodeEmail({
        teacherEmail: request.email,
        teacherName: request.username,
        approvedCode: request.approved_code,
        expiresAtFormatted
      });

      if (mailResult.success) {
        showToast(`📬 Đã gửi lại email chứa mã [${request.approved_code}] tới ${request.email}!`, 'success', 4000);
      } else {
        const emailError = `Gửi lại email thất bại. ${mailResult.error}`;
        setRequestError(emailError);
        showToast(emailError, 'error', 8000);
      }
    } catch (err) {
      const emailError = `Gửi lại email thất bại. ${err?.message || 'Lỗi không xác định'}`;
      setRequestError(emailError);
      showToast(emailError, 'error', 8000);
    }
    setProcessingRequestId('');
  };

  const fetchAdminStats = async () => {
    if (!adminId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatsError('');
    try {
      const [profiles, presentation] = await Promise.all([
        loadAllAdminProfiles(supabase), loadPresentationPeople(supabase)
      ]);
      setSampleCount(presentation.length);
      setStats(summarizeAdminProfiles([
        ...profiles,
        ...presentation.map(person => ({ ...person, is_presentation_data: true }))
      ]));
    } catch (err) {
      console.error(err);
      setStats(null);
      setStatsError('Không thể tải thống kê. Hãy thử tải lại.');
      reportSystemError(err, { action: 'admin_stats_error', operation: 'load_stats', supabaseCode: err.code });
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

  const isLight = theme === 'light';

  const pendingTeacherRequests = teacherRequests.filter((request) => request.status === 'pending');
  const activeApprovedRequests = teacherRequests.filter((request) => {
    if (request.status !== 'approved' || !request.code_expires_at) return false;
    return new Date(request.code_expires_at).getTime() > Date.now();
  });
  const rejectedTeacherRequests = teacherRequests.filter((request) => request.status === 'rejected');

  return (
    <div className="min-h-screen">
      <header className={`backdrop-blur-lg sticky top-0 z-50 border-b ${isLight ? 'bg-white/80 border-slate-200' : 'bg-gray-800/50 border-white/10'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Dashboard</h1>
                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Quản lý Sinh Học Vui</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-700" /> : <Sun className="w-5 h-5 text-yellow-400 animate-pulse" />}
              </button>

              <button
                onClick={() => {
                  fetchAdminStats();
                  fetchTeacherRequests();
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {statsError && <p role="alert" className="mb-4 rounded-xl border border-red-400 p-3 text-red-500">{statsError}</p>}

        <div className={`game-card mb-6 ${isLight ? '!bg-white/90 !border-slate-300 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Duyệt yêu cầu mã giáo viên</h3>
            <button
              onClick={fetchTeacherRequests}
              disabled={requestLoading}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-60`}
            >
              {requestLoading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {requestError && (
            <div className="mb-3 p-3 rounded-xl border border-red-400/40 bg-red-500/15 text-red-100 text-sm">
              {requestError}
            </div>
          )}

          {pendingTeacherRequests.length === 0 && !requestLoading && (
            <div className={`p-3.5 rounded-xl text-sm font-medium ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white/5 text-gray-300'}`}>
              Hiện chưa có yêu cầu giáo viên nào đang chờ duyệt.
            </div>
          )}

          <div className="space-y-3">
            {pendingTeacherRequests.map((request) => (
              <div key={request.id} className={`p-4 rounded-2xl border transition-all shadow-md ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div>
                    <p className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>{request.username}</p>
                    <p className={`text-sm font-bold font-mono ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>{request.email}</p>
                    <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Gửi lúc: {formatDateTime(request.created_at)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveTeacherRequest(request)}
                      disabled={processingRequestId === request.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition shadow-md active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{processingRequestId === request.id ? 'Đang duyệt & gửi mail...' : 'Duyệt & Tự động gửi Email'}</span>
                    </button>

                    <button
                      onClick={() => rejectTeacherRequest(request.id)}
                      disabled={processingRequestId === request.id}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeApprovedRequests.length > 0 && (
            <div className="mt-6">
              <h4 className={`font-bold text-base mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Mã đã cấp còn hiệu lực (Hạn 60 phút)</h4>
              <div className="space-y-3">
                {activeApprovedRequests.map((request) => (
                  <div 
                    key={`approved-${request.id}`} 
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md ${isLight ? 'bg-slate-50 border-emerald-300 text-slate-900' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'}`}
                  >
                    <div>
                      <p className="text-sm font-bold">
                         <strong className={isLight ? 'text-slate-900' : 'text-emerald-200'}>{request.username}</strong> - <span className={`font-mono font-bold underline ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>{request.email}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-xs ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Mã duyệt:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(request.approved_code);
                            showToast(`📋 Đã sao chép mã [${request.approved_code}]!`, 'info', 3000);
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer active:scale-95 ${
                            isLight 
                              ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm' 
                              : 'bg-slate-800/80 border-slate-600/50 text-slate-100 shadow-md'
                          }`}
                          title="Bấm để sao chép mã xác thực"
                        >
                          <span className={`font-mono font-black tracking-widest text-sm ${isLight ? 'text-indigo-950' : 'text-cyan-300'}`}>
                            {request.approved_code}
                          </span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isLight 
                              ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                              : 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
                          }`}>
                            <Copy className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isLight ? 'text-slate-600' : 'text-green-200/80'}`}>Hết hạn lúc: {formatDateTime(request.code_expires_at)}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                      <button
                        onClick={() => handleResendAutoEmail(request)}
                        disabled={processingRequestId === request.id}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 disabled:opacity-50 ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-cyan-200'}`}
                        title="Tự động gửi lại email chứa mã xác thực từ supportbiolearn@gmail.com"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{processingRequestId === request.id ? 'Đang gửi...' : 'Gửi lại Email'}</span>
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rejectedTeacherRequests.length > 0 && (
            <details className="mt-6">
              <summary className={`cursor-pointer font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Lịch sử yêu cầu không được duyệt ({rejectedTeacherRequests.length})
              </summary>
              <div className="mt-3 grid gap-2">
                {rejectedTeacherRequests.map((request) => (
                  <div key={`rejected-${request.id}`} className={`rounded-xl border p-3 text-sm ${isLight ? 'bg-rose-50 border-rose-200 text-slate-700' : 'bg-rose-950/20 border-rose-500/20 text-slate-300'}`}>
                    <strong>{request.username || 'Chưa đặt tên'}</strong> · {request.email}
                    <span className="block text-xs opacity-70 mt-1">Từ chối lúc: {formatDateTime(request.decision_at || request.updated_at)}</span>
                  </div>
                ))}
              </div>
            </details>
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
                {sampleCount > 0 && <p className={`text-[11px] ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>Gồm {sampleCount} hồ sơ mẫu</p>}
              </div>
            </div>
          </div>

          <div className="game-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Đang online trực tiếp</p>
                <p className="text-2xl font-bold text-white">{onlineCountLabel}</p>
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
                <p className="text-2xl font-bold text-white">{stats?.averageScore?.toLocaleString('vi-VN')} điểm</p>
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
            Người dùng đang online trực tiếp
          </h3>

          <div className="flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-3xl font-black text-emerald-300">{onlineCountLabel}</span>
            <span className="text-sm text-gray-300">người đang kết nối với hệ thống</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="game-card text-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-white text-sm">Quản lý users</span>
          </button>
          <button
            onClick={() => navigate('/admin/stations')}
            className="game-card text-center hover:bg-white/20 transition-colors border border-cyan-400/40 cursor-pointer"
          >
            <Compass className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin-slow" />
            <span className="text-white text-sm font-bold">Quản lý Trạm</span>
          </button>
          <button
            onClick={() => navigate('/admin/map')}
            className="game-card text-center hover:bg-white/20 transition-colors border border-violet-400/40 cursor-pointer"
          >
            <Boxes className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <span className="text-white text-sm font-bold">Quản lý Map</span>
          </button>
          <button
            onClick={() => navigate('/admin/content')}
            className="game-card text-center hover:bg-white/20 transition-colors border border-fuchsia-400/40 cursor-pointer"
          >
            <Boxes className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
            <span className="text-white text-sm font-bold">Quản lý nội dung 3D</span>
          </button>
          <button
            onClick={goToLessonManagement}
            className="game-card text-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <span className="text-white text-sm">Quản lý bài học</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="game-card text-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <span className="text-white text-sm">Báo cáo</span>
          </button>
          <button
            onClick={() => navigate('/admin/logs')}
            className="game-card text-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <span className="text-white text-sm">Hoạt động</span>
          </button>
        </div>

      </main>
    </div>
  );
}
