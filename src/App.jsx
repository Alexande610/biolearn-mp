import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import GalaxyBackground from './components/GalaxyBackground';
import { supabase } from './lib/supabase';
// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ClassSelectPage from './pages/ClassSelectPage';
import MapPage from './pages/MapPage';
import GamePlayPage from './pages/GamePlayPage';
import MiniGamePage from './pages/MiniGamePage';
import BossBattlePage from './pages/BossBattlePage';
import LeaderboardPage from './pages/LeaderboardPage';
import MissionPage from './pages/MissionPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLogsPage from './pages/AdminLogsPage';
import MorePage from './pages/MorePage';
import BattlePage from './pages/BattlePage';
import BattlePvPPage from './pages/BattlePvPPage';
import SimulationsPage from './pages/SimulationsPage';
import Biology3DPage from './pages/Biology3DPage';
import ChatboxAI from './components/ChatboxAI';
import TeacherPage from './pages/TeacherPage';
import StudentQuizRoomPage from './pages/StudentQuizRoomPage';
import LandingPage from './pages/LandingPage';
import { AuthContext } from './hooks/useAuth';


// API base URL
const API_URL = '/api';
const DEFAULT_LOCK_REASON = 'Phát hiện hành vi bất thường. Vui lòng liên hệ quản trị viên.';

const normalizeLockNotice = (source = {}) => ({
  reason: source.lockReason || source.reason || DEFAULT_LOCK_REASON,
  lockedAt: source.lockedAt || null,
});

const getDefaultRouteForUser = (currentUser) => {
  if (!currentUser) return '/login';
  if (currentUser.role === 'admin') return '/admin';
  if (currentUser.role === 'teacher') return '/teacher';
  return '/home';
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [lockNotice, setLockNotice] = useState(null);
  const prevUserRef = useRef(null);
  
  // Đồng bộ ref với state user
  useEffect(() => {
    prevUserRef.current = user;
  }, [user]);
  const bgMusicRef = useRef(null);
  const bgMusicStartedRef = useRef(false);

  // Audio volume states - lưu vào localStorage
  const [bgVolume, setBgVolumeRaw] = useState(() => {
    const saved = localStorage.getItem('bgVolume');
    return saved !== null ? Number(saved) : 15;
  });
  const [sfxVolume, setSfxVolumeRaw] = useState(() => {
    const saved = localStorage.getItem('sfxVolume');
    return saved !== null ? Number(saved) : 50;
  });
  const [bgMuted, setBgMutedRaw] = useState(() => localStorage.getItem('bgMuted') === 'true');
  const [sfxMuted, setSfxMutedRaw] = useState(() => localStorage.getItem('sfxMuted') === 'true');

  // Background music (All.mp3)
  useEffect(() => {
    const audio = new Audio('/music/All.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    bgMusicRef.current = audio;

    const startMusic = () => {
      if (!bgMusicStartedRef.current && bgMusicRef.current) {
        bgMusicRef.current.play().catch(() => {});
        bgMusicStartedRef.current = true;
      }
    };
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    return () => {
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      if (bgMusicRef.current) { bgMusicRef.current.pause(); bgMusicRef.current.src = ''; }
    };
  }, []);

  // Sync bg music volume khi thay đổi
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = bgMuted ? 0 : bgVolume / 100;
    }
  }, [bgVolume, bgMuted]);

  // Volume control functions
  const setBgVolume = (value) => {
    setBgVolumeRaw(value);
    localStorage.setItem('bgVolume', String(value));
  };
  const setSfxVolume = (value) => {
    setSfxVolumeRaw(value);
    localStorage.setItem('sfxVolume', String(value));
  };
  const toggleBgMute = () => {
    const newMuted = !bgMuted;
    setBgMutedRaw(newMuted);
    localStorage.setItem('bgMuted', String(newMuted));
  };
  const toggleSfxMute = () => {
    const newMuted = !sfxMuted;
    setSfxMutedRaw(newMuted);
    localStorage.setItem('sfxMuted', String(newMuted));
  };

  // Pause/resume bg music (for games)
  const pauseBgMusic = () => { if (bgMusicRef.current) bgMusicRef.current.volume = 0; };
  const resumeBgMusic = () => { if (bgMusicRef.current) bgMusicRef.current.volume = bgMuted ? 0 : bgVolume / 100; };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (sessionUser) => {
      try {
        if (!sessionUser) {
          if (mounted) {
            setUser(null);
            setUserStats(null);
            setLoading(false);
          }
          return;
        }

        // Đợi một chút để trigger SQL chạy nếu là tài khoản mới
        await new Promise(resolve => setTimeout(resolve, 800));

        // Lấy toàn bộ thông tin profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error) {
          console.error('Lỗi lấy profile:', error);
          if (mounted) {
            setUser(sessionUser);
            setLoading(false);
          }
          return;
        }

        // --- HỆ THỐNG TỰ HỒI THỂ LỰC (5 phút / 1 điểm) ---
        let currentStamina = profile.stamina ?? 20;
        const maxStamina = profile.max_stamina ?? 20;
        const lastUpdate = new Date(profile.last_stamina_update || Date.now());
        const now = new Date();
        
        if (currentStamina < maxStamina) {
          const secondsPassed = Math.floor((now - lastUpdate) / 1000);
          const pointsToRecover = Math.floor(secondsPassed / (5 * 60)); // 5 phút = 300s
          
          if (pointsToRecover > 0) {
            currentStamina = Math.min(maxStamina, currentStamina + pointsToRecover);
            
            // Cập nhật DB (Background)
            supabase
              .from('profiles')
              .update({ 
                stamina: currentStamina, 
                last_stamina_update: now.toISOString() 
              })
              .eq('id', sessionUser.id)
              .then();
          }
        }

        if (mounted) {
          const mergedUser = {
            ...sessionUser,
            ...profile,
            uid: sessionUser.id,
            displayName: profile?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email,
            avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
          };

          setUserStats({
            display_name: profile?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email,
            avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || 'adventurer-1',
            coins: profile?.coins || 0,
            xp: profile?.xp || 0,
            level: Math.floor((profile?.total_score || 0) / 1000) + 1,
            totalScore: profile?.total_score || 0,
            total_score: profile?.total_score || 0,
            weeklyScore: profile?.weekly_score || 0,
            weekly_score: profile?.weekly_score || 0,
            loginStreak: profile?.login_streak || 0,
            login_streak: profile?.login_streak || 0,
            levels_completed: profile?.levels_completed || 0,
            stamina: currentStamina,
            maxStamina: maxStamina,
            energy: currentStamina, 
            max_energy: maxStamina,
            daily_missions: profile?.daily_missions || {},
            inventory: profile?.inventory || [],
            class_progress: profile?.class_progress || {}
          });

          setUser(mergedUser);
        }
      } catch (err) {
        console.error("Auth fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Khởi tạo lấy session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user);
    });

    // Lắng nghe thay đổi Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Không cần Heartbeat nữa, Supabase Realtime Presence sẽ xử lý Online/Offline state (nếu cần thiết triển khai sau)

  // Google Login bằng Supabase
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout bằng Supabase
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserStats(null);
      setLockNotice(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'Không xác định';
    return new Date(value).toLocaleString('vi-VN');
  };

  const handleLockedLogout = async () => {
    await logout();
  };

  // Refresh user stats (Supabase query)
  const refreshUserStats = async () => {
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          // --- HỆ THỐNG TỰ HỒI THỂ LỰC (5 phút / 1 điểm) ---
          let currentStamina = data.stamina ?? 20;
          const maxStamina = data.max_stamina ?? 20;
          const lastUpdate = new Date(data.last_stamina_update || Date.now());
          const now = new Date();
          
          if (currentStamina < maxStamina) {
            const secondsPassed = Math.floor((now - lastUpdate) / 1000);
            const pointsToRecover = Math.floor(secondsPassed / (5 * 60));
            if (pointsToRecover > 0) {
              currentStamina = Math.min(maxStamina, currentStamina + pointsToRecover);
              supabase.from('profiles').update({ stamina: currentStamina, last_stamina_update: now.toISOString() }).eq('id', user.id).then();
            }
          }

          setUserStats({
            display_name: data.display_name || user.email,
            avatar_url: data.avatar_url || 'adventurer-1',
            coins: data.coins || 0,
            xp: data.xp || 0,
            level: Math.floor((data.total_score || 0) / 1000) + 1,
            totalScore: data.total_score || 0,
            total_score: data.total_score || 0,
            weeklyScore: data.weekly_score || 0,
            weekly_score: data.weekly_score || 0,
            loginStreak: data.login_streak || 0,
            login_streak: data.login_streak || 0,
            levels_completed: data.levels_completed || 0,
            stamina: currentStamina,
            maxStamina: maxStamina,
            energy: currentStamina,
            max_energy: maxStamina,
            daily_missions: data.daily_missions || {},
            inventory: data.inventory || [],
            wins: data.wins || 0,
            class_progress: data.class_progress || {}
          });

          // Chỉ cập nhật nếu có thay đổi thực sự để tránh nhấp nháy UI (flashing)
          const newDisplayName = data.display_name || user.email;
          const newAvatar = data.avatar_url || 'adventurer-1';
          
          const hasChanged = 
            prevUserRef.current?.displayName !== newDisplayName || 
            prevUserRef.current?.avatar !== newAvatar ||
            prevUserRef.current?.display_name !== newDisplayName ||
            prevUserRef.current?.avatar_url !== newAvatar;

          if (hasChanged) {
            setUser(prev => ({
              ...prev,
              displayName: newDisplayName,
              avatar: newAvatar,
              display_name: newDisplayName,
              avatar_url: newAvatar
            }));
          }
        }
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  };

  const authValue = {
    user,
    userStats,
    loading,
    loginWithGoogle,
    logout,
    updateStats: refreshUserStats,
    refreshUserStats,
    setUser,
    pauseBgMusic,
    resumeBgMusic,
    bgVolume, sfxVolume, bgMuted, sfxMuted,
    setBgVolume, setSfxVolume, toggleBgMute, toggleSfxMute
  };

  const renderStudentOnly = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'student') return element;
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  };

  const renderAdminOnly = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return element;
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  };

  const renderTeacherOnly = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'teacher') return element;
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-100 text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  const BackgroundManager = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/admin');
    
    return !isAdminPath ? <GalaxyBackground /> : null;
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <div className="min-h-screen relative">
          <BackgroundManager />
          {user && lockNotice ? (
            <div className="min-h-screen flex items-center justify-center px-4">
              <div className="w-full max-w-2xl rounded-2xl border border-red-400/40 bg-red-900/70 backdrop-blur-md p-6 md:p-8 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-red-100 mb-2">Tài khoản của bạn đã bị khóa</h1>
                <p className="text-red-100/90 mb-4">Hệ thống phát hiện hành vi bất thường và đã chặn truy cập tài khoản.</p>

                <div className="text-left bg-black/20 border border-white/10 rounded-xl p-4 mb-6">
                  <p className="text-red-100 text-sm mb-2"><span className="font-semibold">Lý do:</span> {lockNotice.reason}</p>
                  <p className="text-red-100 text-sm"><span className="font-semibold">Thời gian khóa:</span> {formatDateTime(lockNotice.lockedAt)}</p>
                </div>

                <button
                  onClick={handleLockedLogout}
                  className="px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-red-100 transition"
                >
                  Về đăng nhập
                </button>
              </div>
            </div>
          ) : (
            <>
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={
                    user
                      ? <Navigate to={getDefaultRouteForUser(user)} replace />
                      : <LoginPage onLogin={(u, token) => { if (token) localStorage.setItem('token', token); setUser(u); }} />
                  }
                />
                <Route 
                  path="/register" 
                  element={user ? <Navigate to={getDefaultRouteForUser(user)} replace /> : <RegisterPage />} 
                />

                {/* Protected routes */}
                <Route 
                  path="/home" 
                  element={renderStudentOnly(<HomePage />)} 
                />
                <Route 
                  path="/class-select" 
                  element={renderStudentOnly(<ClassSelectPage />)} 
                />
                <Route 
                  path="/map/:classId" 
                  element={renderStudentOnly(<MapPage />)} 
                />
                <Route 
                  path="/play/:classId/:chapterId/:lessonId" 
                  element={renderStudentOnly(<GamePlayPage />)} 
                />
                <Route 
                  path="/minigame/:classId" 
                  element={renderStudentOnly(<MiniGamePage />)} 
                />
                <Route 
                  path="/boss/:classId/:chapterId/:lessonId" 
                  element={renderStudentOnly(<BossBattlePage />)} 
                />
                <Route 
                  path="/leaderboard" 
                  element={renderStudentOnly(<LeaderboardPage />)} 
                />
                <Route 
                  path="/missions" 
                  element={renderStudentOnly(<MissionPage />)} 
                />
                <Route 
                  path="/profile" 
                  element={renderStudentOnly(<ProfilePage />)} 
                />
                <Route 
                  path="/admin" 
                  element={renderAdminOnly(<AdminPage user={user} />)} 
                />
                <Route 
                  path="/admin/users" 
                  element={renderAdminOnly(<AdminUsersPage user={user} />)} 
                />
                <Route 
                  path="/admin/logs" 
                  element={renderAdminOnly(<AdminLogsPage user={user} />)} 
                />
                <Route 
                  path="/admin/lessons" 
                  element={renderAdminOnly(<MorePage />)} 
                />
                <Route 
                  path="/teacher" 
                  element={renderTeacherOnly(<TeacherPage user={user} />)} 
                />
                <Route 
                  path="/quiz-room" 
                  element={renderStudentOnly(<StudentQuizRoomPage />)} 
                />
                <Route 
                  path="/more" 
                  element={renderStudentOnly(<MorePage />)} 
                />
                <Route 
                  path="/battle" 
                  element={renderStudentOnly(<BattlePage />)} 
                />
                <Route 
                  path="/battle-pvp" 
                  element={renderStudentOnly(<BattlePvPPage />)} 
                />
                <Route 
                  path="/simulations" 
                  element={renderStudentOnly(<SimulationsPage />)} 
                />
                <Route 
                  path="/biology3d" 
                  element={renderStudentOnly(<Biology3DPage />)} 
                />

                {/* Default redirect */}
                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              {user && <ChatboxAI user={user} />}
            </>
          )}
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
