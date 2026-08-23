import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  CheckCircle2, Mail, Lock, User, Eye, EyeOff, 
  ChevronRight, ChevronLeft, GraduationCap, Sparkles, ShieldCheck, Gift, ArrowLeft
} from 'lucide-react';
import './LoginPage.css';

const isObfuscatedExistingUser = (data) => (
  Boolean(data?.user) &&
  Array.isArray(data.user.identities) &&
  data.user.identities.length === 0
);

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verCode, setVerCode] = useState('');   
  const [teacherRequestSent, setTeacherRequestSent] = useState(false);
  const [teacherRequestStatus, setTeacherRequestStatus] = useState('');
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');

  const clearError = () => {
    setError('');
    setRegisterSuccessMsg('');
  };

  // Handle manual mode changes (clicking buttons/tabs to switch) to clear fields and avoid credential leakage
  const handleManualModeChange = (newMode) => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    clearError();
    resetTeacherRequestFlow();
  };

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
  const validateTeacherPassword = (pwd) => {
    if (!pwd || pwd.length < 8) {
      return { valid: false, message: 'Mật khẩu giáo viên phải có ít nhất 8 ký tự.' };
    }
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+={};':"|,.<>?/-]/.test(pwd);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return { 
        valid: false, 
        message: 'Mật khẩu yêu cầu độ mạnh cao: phải bao gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (!@#$%...).' 
      };
    }
    return { valid: true, message: '' };
  };

  // Auth processing
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        if (password.length < 8) {
          throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
        }

        const { data, error: err } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: username, role: tab },
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (err) throw err;

        if (!data.user || isObfuscatedExistingUser(data)) {
          throw new Error('EMAIL_ALREADY_EXISTS_OR_SOCIAL');
        }

        if (data.session) {
          await supabase.auth.signOut();
        }
        
        // Chuyển sang chế độ đăng nhập và hiển thị thông báo
        setMode('login');
        setEmail(cleanEmail);
        setRegisterSuccessMsg(
          data.session
            ? '✅ Đăng ký thành công! Hãy đăng nhập bằng mật khẩu BioLearn vừa tạo.'
            : `📩 Tài khoản đã được tạo. Hãy mở email ${cleanEmail} và bấm liên kết xác nhận của Supabase trước khi đăng nhập. Mật khẩu đăng nhập là mật khẩu BioLearn vừa tạo, không phải mật khẩu Gmail.`
        );
        
        // Xóa mật khẩu cũ, giữ lại email
        setPassword('');
        setConfirmPassword('');
        setUsername('');
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (err) throw err;
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) throw profileError;

          let role = profile?.role || data.user.user_metadata?.role || 'student';

          if (tab === 'teacher' && !['teacher', 'admin'].includes(role)) {
            await supabase.auth.signOut();
            throw new Error('Tài khoản này chưa được cấp quyền Giáo viên. Hãy hoàn tất đăng ký bằng mã Admin trước.');
          }

          // Mã duyệt không bị xóa. RPC chỉ đánh dấu yêu cầu đã được dùng sau
          // lần đăng nhập Giáo viên thành công để Admin tự động ẩn yêu cầu này.
          if (tab === 'teacher' && role === 'teacher') {
            const { error: consumeError } = await supabase.rpc('consume_teacher_approval', {
              p_email: cleanEmail
            });
            if (consumeError && !consumeError.message?.includes('Could not find the function')) {
              console.warn('Không thể đánh dấu mã Giáo viên đã sử dụng:', consumeError.message);
            }
          }

          setUser({ ...data.user, role });

          if (role === 'admin') navigate('/admin');
          else if (role === 'teacher') navigate('/teacher');
          else navigate('/home');
        }
      }
    } catch (err) {
      setError(translateAuthError(err));
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
    if (!email || !email.trim()) {
      setError('Vui lòng nhập địa chỉ email giáo viên.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true); clearError();
    try {
      // RPC chỉ trả trạng thái, tuyệt đối không trả approved_code ra client.
      const { data: req, error: fetchErr } = await supabase.rpc('get_teacher_request_status', {
        p_email: cleanEmail
      });
      if (fetchErr) throw fetchErr;

      if (req?.exists) {
        if (req.status === 'approved') {
          setTeacherRequestStatus(`✅ Email ${cleanEmail} đã được Admin duyệt cấp mã xác thực. Vui lòng nhập mã và bấm "Đăng ký ngay".`);
        } else if (req.status === 'pending') {
          setTeacherRequestStatus(`⏳ Yêu cầu mã xác thực cho email ${cleanEmail} đã gửi trước đó và đang chờ Admin duyệt. Vui lòng liên hệ Admin qua email supportbiolearn@gmail.com để nhận mã.`);
        } else if (req.status === 'registered') {
          throw new Error('Tài khoản Giáo viên với email này đã tồn tại. Hãy chuyển sang Đăng nhập hoặc dùng Quên mật khẩu.');
        } else {
          await supabase.from('teacher_requests').insert([{
            email: cleanEmail,
            username: username.trim() || cleanEmail.split('@')[0],
            status: 'pending'
          }]);
          setTeacherRequestStatus(`📬 Yêu cầu cấp mã mới đã được gửi tới Admin cho email: ${cleanEmail}. Vui lòng chờ Admin duyệt!`);
        }
      } else {
        const { error: insertErr } = await supabase.from('teacher_requests').insert([{
          email: cleanEmail,
          username: username.trim() || cleanEmail.split('@')[0],
          status: 'pending'
        }]);
        if (insertErr) {
          console.error('Lỗi tạo yêu cầu giáo viên:', insertErr);
        }
        setTeacherRequestStatus(`📬 Yêu cầu cấp mã xác thực đã được gửi thành công đến Admin cho địa chỉ email: ${cleanEmail}. Vui lòng chờ Admin duyệt và cấp mã qua email supportbiolearn@gmail.com!`);
      }
      setTeacherRequestSent(true);
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu mã xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegister = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const codeUpper = verCode.trim().toUpperCase();

    if (!codeUpper) {
      setError('Vui lòng nhập mã xác thực do Admin cấp.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    // Kiểm tra độ mạnh mật khẩu Giáo viên (8+ ký tự, HOA, thường, số, đặc biệt)
    const passCheck = validateTeacherPassword(password);
    if (!passCheck.valid) {
      setError(passCheck.message);
      return;
    }

    setLoading(true); clearError();
    try {
      const { data: matchedReq, error: codeError } = await supabase.rpc('validate_teacher_approval', {
        p_email: cleanEmail,
        p_code: codeUpper
      });

      if (codeError) throw codeError;

      if (!matchedReq?.valid) {
        throw new Error('Mã xác thực không hợp lệ hoặc chưa được Admin phê duyệt cho email này.');
      }

      // Tạo tài khoản trong Supabase
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: username.trim() || cleanEmail.split('@')[0],
            role: 'teacher'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpErr) throw signUpErr;

      if (!data.user || isObfuscatedExistingUser(data)) {
        throw new Error('EMAIL_ALREADY_EXISTS_OR_SOCIAL');
      }

      // Không xóa approved_code tại đây. Mã được giữ để audit và chỉ được
      // đánh dấu consumed sau lần đăng nhập Giáo viên thành công.

      if (data.session) {
        await supabase.from('profiles').update({ role: 'teacher' }).eq('id', data.user.id);
        await supabase.auth.signOut();
      }

      // Chuyển chế độ giao diện sang Đăng Nhập Giáo Viên
      setTab('teacher');
      setMode('login');
      setEmail(cleanEmail);
      setPassword('');
      setConfirmPassword('');
      setVerCode('');
      setTeacherRequestSent(false);
      setTeacherRequestStatus('');

      setRegisterSuccessMsg(
        data.session
          ? '🎉 Đăng ký tài khoản Giáo viên thành công! Hãy đăng nhập bằng mật khẩu BioLearn vừa tạo.'
          : `📩 Tài khoản Giáo viên đã được tạo. Hãy mở email ${cleanEmail} và bấm liên kết xác nhận của Supabase trước khi đăng nhập. Mật khẩu cần dùng là mật khẩu BioLearn vừa tạo, không phải mật khẩu Gmail.`
      );
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  function translateAuthError(errorValue) {
    const msg = typeof errorValue === 'string' ? errorValue : (errorValue?.message || 'Đã xảy ra lỗi xác thực');
    const code = typeof errorValue === 'object' ? errorValue?.code : '';

    if (msg === 'EMAIL_ALREADY_EXISTS_OR_SOCIAL' || code === 'user_already_exists' || msg.includes('already registered')) {
      return tab === 'teacher'
        ? 'Tài khoản Giáo viên với email này đã tồn tại. Hãy đăng nhập bằng mật khẩu BioLearn đã tạo hoặc dùng “Quên mật khẩu?”.'
        : 'Email này đã có tài khoản. Hãy đăng nhập bằng phương thức đã dùng trước đó hoặc đặt lại mật khẩu.';
    }
    if (code === 'email_not_confirmed' || msg.toLowerCase().includes('email not confirmed')) {
      return 'Email chưa được xác nhận. Hãy mở email xác nhận từ Supabase (kiểm tra cả Spam), bấm liên kết xác nhận rồi đăng nhập lại.';
    }
    if (code === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
      return tab === 'teacher'
        ? 'Email hoặc mật khẩu BioLearn không đúng. Đây là mật khẩu bạn đã tạo khi đăng ký Giáo viên, không phải mật khẩu Gmail.'
        : 'Email hoặc mật khẩu không đúng, email chưa xác nhận, hoặc tài khoản dùng đăng nhập Google.';
    }
    if (msg.includes('Password should be at least')) return 'Mật khẩu phải có ít nhất 8 ký tự';
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
                      handleManualModeChange('login');
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
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => handleManualModeChange('login')}>Đăng nhập</button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => handleManualModeChange('register')}>Đăng ký</button>
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

                  {mode === 'register' && (
                    <div className="cosmic-input-group">
                      <label>Xác nhận mật khẩu</label>
                      <div className="cosmic-input-wrapper">
                        <Lock className="wrapper-icon" />
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  {tab === 'teacher' && mode === 'register' && (
                    <p className="cosmic-tip" style={{ color: '#67e8f9', fontSize: '11px', marginTop: '6px', lineHeight: '1.4' }}>
                      🛡️ Yêu cầu: Mật khẩu tối thiểu 8 ký tự, chứa ít nhất 1 chữ HOA, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (!@#$...).
                    </p>
                  )}

                  {registerSuccessMsg && (
                    <div className="bg-emerald-500/25 border border-emerald-400 text-emerald-100 px-4 py-3 rounded-xl my-3 text-xs md:text-sm font-bold leading-relaxed shadow-lg backdrop-blur-md">
                      {registerSuccessMsg}
                    </div>
                  )}

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
                        handleManualModeChange(mode === 'login' ? 'register' : 'login');
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
