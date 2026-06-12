import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  CheckCircle2, Mail, Lock, User, Eye, EyeOff, 
  ChevronRight, ChevronLeft, GraduationCap, Sparkles, ShieldCheck, Gift, ArrowLeft
} from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, setUser } = useAuth();
  
  // Interactive UI states
  const [isOpen, setIsOpen] = useState(false);
  const [dragX, setDragX] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const startDragX = useRef(0);
  const initialDragX = useRef(0);
  const trackRef = useRef(null);

  // Tab & auth states
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
  const [verCode, setVerCode] = useState('');   
  const [teacherRequestSent, setTeacherRequestSent] = useState(false);
  const [teacherRequestStatus, setTeacherRequestStatus] = useState('');

  const clearError = () => setError('');

  const resetTeacherRequestFlow = () => {
    setTeacherRequestSent(false);
    setTeacherRequestStatus('');
    setVerCode('');
  };

  const getMaxDrag = () => {
    return window.innerWidth > 900 ? window.innerWidth * 0.44 : window.innerWidth;
  };

  // Drag handlers for the lock slider
  const onDragStart = (clientX) => {
    setIsDragging(true);
    startDragX.current = clientX;
    initialDragX.current = isOpen ? getMaxDrag() : 0;
  };

  const onDragMove = (clientX) => {
    if (!isDragging) return;
    const delta = startDragX.current - clientX; // Dragging left increases delta
    const maxDragVal = getMaxDrag();
    const currentDrag = Math.max(0, Math.min(initialDragX.current + delta, maxDragVal));
    setDragX(currentDrag);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const maxDragVal = getMaxDrag();
    if (dragX > maxDragVal * 0.35) {
      setIsOpen(true);
      setDragX(maxDragVal);
    } else {
      setIsOpen(false);
      setDragX(0);
    }
  };

  // Mouse & Touch events mapping
  const handleMouseDown = (e) => onDragStart(e.clientX);
  const handleMouseMove = (e) => onDragMove(e.clientX);
  const handleMouseUp = () => onDragEnd();

  const handleTouchStart = (e) => onDragStart(e.touches[0].clientX);
  const handleTouchMove = (e) => onDragMove(e.touches[0].clientX);
  const handleTouchEnd = () => onDragEnd();

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragX]);

  // Auth processing
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
          const { data: profile } = await supabase
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

  const handleGoogleLogin = async () => {
    setLoading(true); clearError();
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(translateAuthError(result.error));
    }
    setLoading(false);
  };

  const handleTeacherRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    setTimeout(() => {
      setTeacherRequestSent(true);
      setTeacherRequestStatus('Bản Demo: Mặc định mã xác thực Teacher là ADMIN123');
      setLoading(false);
    }, 500);
  };

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

  const dragRatio = dragX / (getMaxDrag() || 1);

  return (
    <div className="login-screen-cosmic">
      {/* Back button (Only visible in landing state) */}
      {!isOpen && !isDragging && (
        <Link to="/" className="cosmic-back-home">
          <ArrowLeft className="w-5 h-5" />
          <span>Về trang chủ</span>
        </Link>
      )}

      {/* Main Container */}
      <div className={`cosmic-layout-container ${isOpen ? 'panel-open' : ''} ${isDragging ? 'dragging' : ''}`}>
        
        {/* Left/Centered: Brand Identity */}
        <div 
          className={`cosmic-brand-identity ${isDragging ? 'dragging' : ''}`}
          style={{
            transform: window.innerWidth > 900 
              ? `translate3d(calc(-50% - ${dragRatio * 22}vw), 0, 0)` 
              : 'translate3d(-50%, 0, 0)'
          }}
        >
          <div className="brand-wrapper">
            <div className="brand-logo-container">
              <img 
                src="/images/Logo.png" 
                alt="BioLearn Logo" 
                className="brand-giant-logo" 
              />
            </div>
            
            <p className="brand-slogan-text">Hành trình khám phá tri thức kỳ diệu đang chờ đón bạn!</p>
            
            {/* Slide to unlock slider (Only in landing state) */}
            {!isOpen && (
              <div 
                className="cosmic-slider-track"
                ref={trackRef}
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}
              >
                <div 
                  className="cosmic-slider-handle"
                  style={{ transform: `translateX(-${dragX}px)` }}
                >
                  <ChevronLeft className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="cosmic-slider-text">
                  &lt;&lt; Kéo sang trái để đăng nhập
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Glassmorphism Login Panel */}
        <div 
          className={`cosmic-login-panel ${isOpen ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
          style={{
            transform: window.innerWidth > 900
              ? `translateX(${(1 - dragRatio) * 100}%)`
              : (isOpen ? 'translateX(0)' : 'translateX(100%)')
          }}
        >
          {/* Drag edge to slide panel back */}
          {isOpen && (
            <div 
              className="cosmic-panel-drag-edge"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              title="Kéo sang phải để đóng"
            />
          )}
          
          {/* Back to landing screen button */}
          <button 
            onClick={() => { setIsOpen(false); setDragX(0); }}
            className="cosmic-retract-btn"
          >
            <ChevronRight className="w-6 h-6" />
            <span>Thu nhỏ</span>
          </button>

          <div className="panel-scroll-container">
            <div className="glass-form-card">
              <div className="form-header-cosmic">
                <h2 className="form-title-cosmic">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
              </div>

              {/* Tab Selector */}
              <div className="cosmic-tabs">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    className={`cosmic-tab-btn ${tab === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setTab(t.id);
                      setMode('login');
                      clearError();
                      resetTeacherRequestFlow();
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {error && <div className="cosmic-error-box">⚠️ {error}</div>}

              {/* Form Content */}
              <div className="cosmic-form-body">
                {tab === 'student' && (
                  <div className="cosmic-mode-toggle">
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Đăng ký</button>
                  </div>
                )}

                {tab === 'teacher' && mode === 'login' && (
                  <div className="cosmic-info-badge">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Khu vực dành cho Giáo viên quản lý lớp học.</span>
                  </div>
                )}

                <form 
                  onSubmit={tab === 'teacher' && mode === 'register' ? (teacherRequestSent ? handleTeacherRegister : handleTeacherRequestCode) : handleEmailAuth}
                  className="cosmic-form"
                >
                  {mode === 'register' && (
                    <div className="cosmic-input-group">
                      <label>Họ và tên</label>
                      <div className="cosmic-input-wrapper">
                        <User className="wrapper-icon" />
                        <input 
                          type="text" 
                          placeholder="Nhập tên của bạn" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="cosmic-input-group">
                    <label>{tab === 'teacher' ? 'Email giáo viên' : 'Email'}</label>
                    <div className="cosmic-input-wrapper">
                      <Mail className="wrapper-icon" />
                      <input 
                        type="email" 
                        placeholder="Nhập địa chỉ email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="cosmic-input-group">
                    <label>Mật khẩu</label>
                    <div className="cosmic-input-wrapper">
                      <Lock className="wrapper-icon" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                      <button 
                        type="button" 
                        className="cosmic-pass-toggle" 
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {tab === 'teacher' && mode === 'register' && teacherRequestSent && (
                    <div className="cosmic-input-group">
                      <label>Mã xác thực Admin</label>
                      <div className="cosmic-input-wrapper">
                        <ShieldCheck className="wrapper-icon" />
                        <input 
                          type="text" 
                          placeholder="Nhập mã xác thực" 
                          value={verCode} 
                          onChange={e => setVerCode(e.target.value.toUpperCase())}
                          required 
                        />
                      </div>
                      {teacherRequestStatus && <p className="cosmic-tip">{teacherRequestStatus}</p>}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="cosmic-form-actions">
                      <label className="cosmic-checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={rememberMe} 
                          onChange={() => setRememberMe(!rememberMe)} 
                        />
                        <span className="checkmark"></span>
                        <span className="checkbox-text">Ghi nhớ đăng nhập</span>
                      </label>
                      <button type="button" className="cosmic-forgot">Quên mật khẩu?</button>
                    </div>
                  )}

                  <button type="submit" className="cosmic-submit-btn" disabled={loading}>
                    {loading ? (
                      <div className="cosmic-spinner"></div>
                    ) : (
                      <span>
                        {mode === 'login' ? 'Đăng nhập' : (tab === 'teacher' && !teacherRequestSent ? 'Gửi yêu cầu mã' : 'Đăng ký ngay')}
                      </span>
                    )}
                  </button>
                </form>

                {mode === 'login' && tab === 'student' && (
                  <>
                    <div className="cosmic-divider">
                      <span>Hoặc đăng nhập bằng</span>
                    </div>

                    <button 
                      type="button" 
                      className="cosmic-google-btn" 
                      onClick={handleGoogleLogin} 
                      disabled={loading}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                      <span>Tiếp tục với Google</span>
                    </button>
                  </>
                )}

                <div className="cosmic-form-footer">
                  <p>
                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button 
                      type="button" 
                      className="cosmic-footer-link" 
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
