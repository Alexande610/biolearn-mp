import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  CheckCircle2, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ChevronRight,
  GraduationCap,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, setUser } = useAuth();
  const [tab, setTab] = useState('student');     // 'student' | 'teacher'
  const [mode, setMode] = useState('login');      // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verCode, setVerCode] = useState('');   // Giáo viên: mã xác thực
  const [teacherRequestSent, setTeacherRequestSent] = useState(false);
  const [teacherRequestStatus, setTeacherRequestStatus] = useState('');
  const [checkingTeacherStatus, setCheckingTeacherStatus] = useState(false);

  const clearError = () => setError('');

  const resetTeacherRequestFlow = () => {
    setTeacherRequestSent(false);
    setTeacherRequestStatus('');
    setVerCode('');
  };

  // ─── STUDENT: Đăng nhập / Đăng ký qua Supabase ───────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    try {
      if (mode === 'register') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: username, role: tab } }
        });
        if (err) throw err;
        if (data.user) {
          setUser(data.user);
          navigate(tab === 'teacher' ? '/teacher' : '/home');
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (err) throw err;
        if (data.user) {
          // Fetch user role from profile to handle "admin login anywhere"
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          const role = profile?.role || 'student';
          setUser({ ...data.user, role });
          
          if (role === 'admin') navigate('/admin');
          else if (role === 'teacher') navigate('/teacher');
          else navigate('/home');
        }
      }
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── STUDENT: Google OAuth ────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true); clearError();
    const result = await loginWithGoogle();
    if (result.success) {
      // Auth change will navigate
    } else {
      setError(translateAuthError(result.error));
    }
    setLoading(false);
  };

  const handleTeacherRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    setTeacherRequestStatus('');
    setTimeout(() => {
      setTeacherRequestSent(true);
      setTeacherRequestStatus('Bản Demo Serverless: Mặc định mã xác thực để đăng ký Teacher là ADMIN123');
      setLoading(false);
    }, 500);
  };

  const handleCheckTeacherRequestStatus = async () => {
    setCheckingTeacherStatus(true);
    clearError();
    setTimeout(() => {
      setCheckingTeacherStatus(false);
    }, 300);
  };

  // ─── TEACHER: Hoàn tất đăng ký ──────────
  const handleTeacherRegister = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    try {
      if (!teacherRequestSent) throw new Error('Bạn cần gửi yêu cầu mã xác thực trước khi đăng ký');
      if (verCode !== 'ADMIN123') throw new Error('Mã xác thực không hợp lệ (Dùng ADMIN123 cho Demo)');

      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: username, role: 'teacher' } }
      });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        navigate('/teacher');
      }
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── TEACHER: Đăng nhập ────────────────────────
  // Consolidated handlers for simplicity as they now share the same logic
  const handleTeacherLogin = handleEmailAuth;
  const handleAdminLogin = handleEmailAuth;

  function translateAuthError(msg) {
    if (msg.includes('already registered')) return 'Email đã được sử dụng';
    if (msg.includes('Invalid login credentials')) return 'Email hoặc mật khẩu không đúng';
    if (msg.includes('Password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return msg;
  }

  const tabs = [
    { id: 'student', label: 'Học sinh', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'teacher', label: 'Giáo viên', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <div className="login-page relative bg-transparent overflow-hidden flex items-center justify-center p-4">
      <div className="login-wrapper">
        
        {/* Left Sidebar - Info Area */}
        <div className="login-sidebar">
          <div className="sidebar-header">
            <Link to="/" className="back-link">
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Về trang chủ</span>
            </Link>
            <div className="platform-logo-top">
              <ShieldCheck className="w-8 h-8 text-white" />
              <span className="platform-name">Sinh Học Vui</span>
            </div>
          </div>

          <div className="sidebar-middle">
            <div className="welcome-box">
              <img 
                src="/images/Logo.png" 
                alt="BioLearn Logo" 
                className="sidebar-big-logo" 
              />
              <h2 className="welcome-title text-white">Chào mừng đến với Sinh Học Vui</h2>
              <p className="welcome-desc">Hành trình khám phá tri thức kỳ diệu đang chờ đón bạn!</p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-check"><CheckCircle2 className="w-4 h-4" /></div>
                <div className="feature-text">
                  <p className="feature-label">Học tập hiệu quả</p>
                  <p className="feature-sub">Phương pháp giảng dạy sinh động, dễ hiểu.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-check"><CheckCircle2 className="w-4 h-4" /></div>
                <div className="feature-text">
                  <p className="feature-label">Theo dõi tiến độ</p>
                  <p className="feature-sub">Hệ thống đánh giá và lộ trình rõ ràng.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-check"><CheckCircle2 className="w-4 h-4" /></div>
                <div className="feature-text">
                  <p className="feature-label">Nhận huy hiệu</p>
                  <p className="feature-sub">Thành tích xứng đáng cho những nỗ lực của bạn.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Form Area */}
        <div className="login-form-area">
          <div className="form-container-inner">
            <div className="form-header">
              <h1 className="form-title">Đăng nhập</h1>
              <p className="form-subtitle">Chào mừng bạn quay trở lại! 👋</p>
            </div>

            {/* Tab Selector */}
            <div className="login-tabs-modern">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`tab-btn-modern ${tab === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setTab(t.id);
                    setMode('login');
                    clearError();
                    resetTeacherRequestFlow();
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="login-card-modern">
              {error && <div className="error-message">⚠️ {error}</div>}

              {/* Form Content */}
              <div className="form-content">
                {/* Registration switch inside the form area for Student */}
                {tab === 'student' && (
                  <div className="mode-tabs">
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Đăng ký</button>
                  </div>
                )}

                {/* Teacher specialized info */}
                {tab === 'teacher' && mode === 'login' && (
                  <div className="teacher-info-box">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    <p>Dành riêng cho Giáo viên. Đăng nhập để quản lý lớp học.</p>
                  </div>
                )}

                <form onSubmit={tab === 'teacher' && mode === 'register' ? (teacherRequestSent ? handleTeacherRegister : handleTeacherRequestCode) : handleEmailAuth} className="main-form">
                  {mode === 'register' && (
                    <div className="form-group-modern">
                      <label>Họ và tên</label>
                      <div className="input-wrapper">
                        <User className="input-icon" />
                        <input type="text" placeholder="Nhập tên của bạn" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                    </div>
                  )}

                  <div className="form-group-modern">
                    <label>{tab === 'teacher' ? 'Email giáo viên' : 'Email'}</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" />
                      <input type="email" placeholder="Nhập địa chỉ email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label>Mật khẩu</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {tab === 'teacher' && mode === 'register' && teacherRequestSent && (
                    <div className="form-group-modern">
                      <label>Mã xác thực Admin</label>
                      <div className="input-wrapper">
                        <ShieldCheck className="input-icon" />
                        <input 
                          type="text" 
                          placeholder="Nhập mã xác thực" 
                          value={verCode} 
                          onChange={e => setVerCode(e.target.value.toUpperCase())}
                          required 
                        />
                      </div>
                      {teacherRequestStatus && <p className="status-tip">{teacherRequestStatus}</p>}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="form-extras">
                      <label className="remember-me">
                        <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                        <span>Ghi nhớ đăng nhập</span>
                      </label>
                      <button type="button" className="forgot-pass">Quên mật khẩu?</button>
                    </div>
                  )}

                  <button type="submit" className="submit-btn-modern" disabled={loading}>
                    {loading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <>
                        {mode === 'login' ? 'Đăng nhập' : (tab === 'teacher' && !teacherRequestSent ? 'Gửi yêu cầu mã' : 'Đăng ký ngay')}
                      </>
                    )}
                  </button>
                </form>

                {mode === 'login' && tab === 'student' && (
                  <>
                    <div className="divider-modern">
                      <span>Hoặc đăng nhập bằng</span>
                    </div>

                    <button type="button" className="google-btn-modern" onClick={handleGoogleLogin} disabled={loading}>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                      <span>Google</span>
                    </button>
                  </>
                )}

                <div className="form-footer">
                  <p>
                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button 
                      type="button" 
                      className="footer-link" 
                      onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        resetTeacherRequestFlow();
                      }}
                    >
                      {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
