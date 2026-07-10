import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import GalaxyBackground from './components/GalaxyBackground';
import { ToastProvider } from './components/Toast';
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
import AdminReportsPage from './pages/AdminReportsPage';
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

const helperComputeClassProgress = (classProgressData = {}) => {
  const classProgress = {};
  const classStructure = {
    6: [{ id: 1, lessons: [1, 2, 3] }, { id: 2, lessons: [4, 5] }, { id: 3, lessons: [6, 7, 8, 9, 10] }],
    7: [{ id: 1, lessons: [1, 2, 3] }, { id: 2, lessons: [4, 5] }],
    8: [{ id: 1, lessons: [1, 2, 3] }],
    9: [{ id: 1, lessons: [1, 2] }],
    10: [
      { id: 1, lessons: [1, 2, 3] },
      { id: 2, lessons: [4, 5, 6] },
      { id: 3, lessons: [7, 8, 9] },
      { id: 4, lessons: [10, 11, 12] },
      { id: 5, lessons: [13, 14] },
      { id: 6, lessons: [16, 17, 19] },
      { id: 7, lessons: [21, 22] },
      { id: 8, lessons: [24, 25] }
    ],
    11: [
      { id: 1, lessons: [1, 2, 4, 6, 8, 9, 10] },
      { id: 2, lessons: [14, 15, 17, 18] },
      { id: 3, lessons: [19, 20, 22] },
      { id: 4, lessons: [24, 25, 27] }
    ],
    12: [
      { id: 1, lessons: [1, 2, 3, 4] },
      { id: 2, lessons: [6, 7, 10, 11] },
      { id: 3, lessons: [8] },
      { id: 4, lessons: [12] }
    ]
  };

  const totalLevelsMap = {
    6: 106, 7: 54, 8: 32, 9: 22, 10: 226, 11: 178, 12: 108
  };

  [6, 7, 8, 9, 10, 11, 12].forEach(classNum => {
    const classProg = classProgressData[classNum];
    if (!classProg || !classProg.completedLevels) {
      classProgress[classNum] = 0;
      return;
    }
    const completed = classProg.completedLevels;
    const completedSet = new Set(completed);
    
    const isFirstLevelDone = completed.includes('1_1_0') || completed.includes('1_review_0');
    if (!isFirstLevelDone) {
      classProgress[classNum] = 0;
      return;
    }

    let completedCount = 0;
    const chapters = classStructure[classNum] || [];
    chapters.forEach(chapter => {
      if (completedSet.has(`${chapter.id}_review_0`)) {
        completedCount += chapter.lessons.length * 10 + 2;
      } else {
        chapter.lessons.forEach(lessonId => {
          for (let lv = 0; lv < 10; lv++) {
            if (completedSet.has(`${chapter.id}_${lessonId}_${lv}`)) {
              completedCount++;
            }
          }
        });
        for (let pv = 0; pv < 2; pv++) {
          if (completedSet.has(`${chapter.id}_99_${pv}`) || completedSet.has(`${chapter.id}_practice_${pv}`)) {
            completedCount++;
          }
        }
      }
    });
    const total = totalLevelsMap[classNum] || 100;
    classProgress[classNum] = Math.min(100, Math.round((completedCount / total) * 100));
  });
  return classProgress;
};

const helperGetHighestStreak = (userId, currentStreak, dbHighestStreak) => {
  if (!userId) return Math.max(currentStreak, dbHighestStreak || 0);
  const key = `highest_streak_${userId}`;
  const storedHighest = localStorage.getItem(key) || 0;
  const highest = Math.max(Number(storedHighest), currentStreak, dbHighestStreak || 0);
  if (highest > Number(storedHighest)) {
    localStorage.setItem(key, String(highest));
  }
  return highest;
};

const helperUpdateStaminaAndStreak = async (profile, userId) => {
  if (!profile || !userId) return { stamina: 20, login_streak: 0 };

  // 1. Recover Stamina
  let currentStamina = profile.stamina ?? 20;
  const maxStamina = profile.max_stamina ?? 20;
  const lastStaminaUpdate = new Date(profile.last_stamina_update || Date.now());
  const now = new Date();

  if (currentStamina < maxStamina) {
    const secondsPassed = Math.floor((now - lastStaminaUpdate) / 1000);
    const pointsToRecover = Math.floor(secondsPassed / (5 * 60)); // 5 mins
    if (pointsToRecover > 0) {
      currentStamina = Math.min(maxStamina, currentStamina + pointsToRecover);
    }
  }

  // 2. Login Streak
  const lastActiveStr = profile.last_active_at;
  const todayStr = now.toISOString().split('T')[0];
  let newStreak = profile.login_streak ?? 0;
  let shouldUpdateStreak = false;

  if (!lastActiveStr) {
    newStreak = 0;
    shouldUpdateStreak = true;
  } else {
    const lastActiveDate = new Date(lastActiveStr.split('T')[0] + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');
    const diffTime = todayDate - lastActiveDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = (profile.login_streak ?? 0) + 1;
      shouldUpdateStreak = true;
    } else if (diffDays > 1) {
      newStreak = 1;
      shouldUpdateStreak = true;
    }
  }

  const isNewDayActive = !lastActiveStr || lastActiveStr.split('T')[0] !== todayStr;

  // 3. Database Update
  const updateData = {};
  let finalStaminaUpdate = profile.last_stamina_update;

  if (currentStamina !== profile.stamina) {
    updateData.stamina = currentStamina;
    updateData.last_stamina_update = now.toISOString();
    finalStaminaUpdate = updateData.last_stamina_update;
  }
  if (shouldUpdateStreak) {
    updateData.login_streak = newStreak;
  }
  if (isNewDayActive) {
    updateData.last_active_at = now.toISOString();
  }

  if (Object.keys(updateData).length > 0) {
    try {
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (shouldUpdateStreak) {
        const key = `highest_streak_${userId}`;
        const storedHighest = localStorage.getItem(key) || 0;
        if (newStreak > Number(storedHighest)) {
          localStorage.setItem(key, String(newStreak));
          await supabase
            .from('profiles')
            .update({ highest_streak: newStreak })
            .eq('id', userId);
        }
      }
    } catch (err) {
      console.error("Error updating stamina/streak in DB:", err);
    }
  }

  return {
    stamina: currentStamina,
    login_streak: newStreak,
    last_stamina_update: finalStaminaUpdate,
    last_active_at: isNewDayActive ? now.toISOString() : lastActiveStr
  };
};

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

const ChatboxManager = ({ user }) => {
  const location = useLocation();
  if (user && location.pathname === '/home') {
    return <ChatboxAI user={user} />;
  }
  return null;
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

  // Theme state - mặc định là 'light' (Day mode)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== null ? saved : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Background music (All.mp3)
  useEffect(() => {
    const audio = new Audio('/music/All.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    bgMusicRef.current = audio;

    const startMusic = () => {
      if (!bgMusicStartedRef.current && bgMusicRef.current) {
        bgMusicRef.current.play().catch(() => { });
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

        // Tự động kiểm tra và reset nhiệm vụ ngày/tuần mới
        try {
          await supabase.rpc('check_and_reset_missions', { p_user_id: sessionUser.id });
        } catch (e) {
          console.error("Error resetting missions:", e);
        }

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

        if (profile?.is_locked) {
          if (mounted) {
            setLockNotice({
              reason: profile.lock_reason || DEFAULT_LOCK_REASON,
              lockedAt: profile.locked_at || null
            });
            const mergedUser = {
              ...sessionUser,
              ...profile,
              uid: sessionUser.id,
              displayName: profile?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email,
              avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
            };
            setUser(mergedUser);
            setLoading(false);
          }
          return;
        } else {
          if (mounted) {
            setLockNotice(null);
          }
        }

        // --- HỆ THỐNG TỰ ĐỘNG CẬP NHẬT CHUỖI ĐĂNG NHẬP (LOGIN STREAK) & THỂ LỰC ---
        const updatedStats = await helperUpdateStaminaAndStreak(profile, sessionUser.id);
        const currentStamina = updatedStats.stamina;
        const currentStreak = updatedStats.login_streak;
        const maxStamina = profile.max_stamina ?? 20;

        if (mounted) {
          const mergedUser = {
            ...sessionUser,
            ...profile,
            uid: sessionUser.id,
            displayName: profile?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email,
            avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
            stamina: currentStamina,
            login_streak: currentStreak,
            last_active_at: updatedStats.last_active_at,
          };

          setUserStats({
            display_name: profile?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email,
            avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || 'adventurer-1',
            coins: profile?.coins || 0,
            xp: profile?.xp || 0,
            level: Math.max(profile?.level || 1, Math.floor((profile?.total_score || 0) / 1000) + 1),
            totalScore: profile?.total_score || 0,
            total_score: profile?.total_score || 0,
            weeklyScore: profile?.weekly_score || 0,
            weekly_score: profile?.weekly_score || 0,
            loginStreak: currentStreak,
            login_streak: currentStreak,
            highestStreak: helperGetHighestStreak(sessionUser.id, currentStreak, profile?.highest_streak || 0),
            highest_streak: helperGetHighestStreak(sessionUser.id, currentStreak, profile?.highest_streak || 0),
            levels_completed: profile?.levels_completed || 0,
            stamina: currentStamina,
            maxStamina: maxStamina,
            energy: currentStamina,
            max_energy: maxStamina,
            daily_missions: profile?.daily_missions || {},
            inventory: profile?.inventory || [],
            class_progress: profile?.class_progress || {},
            classProgress: helperComputeClassProgress(profile?.class_progress || {})
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
        await supabase.rpc('check_and_reset_missions', { p_user_id: user.id });

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.is_locked) {
            setLockNotice({
              reason: data.lock_reason || DEFAULT_LOCK_REASON,
              lockedAt: data.locked_at || null
            });
            return;
          } else {
            setLockNotice(null);
          }

          // --- HỆ THỐNG TỰ ĐỘNG CẬP NHẬT CHUỖI ĐĂNG NHẬP (LOGIN STREAK) & THỂ LỰC ---
          const updatedStats = await helperUpdateStaminaAndStreak(data, user.id);
          const currentStamina = updatedStats.stamina;
          const currentStreak = updatedStats.login_streak;
          const maxStamina = data.max_stamina ?? 20;

          setUserStats({
            display_name: data.display_name || user.email,
            avatar_url: data.avatar_url || 'adventurer-1',
            coins: data.coins || 0,
            xp: data.xp || 0,
            level: Math.max(data?.level || 1, Math.floor((data?.total_score || 0) / 1000) + 1),
            totalScore: data.total_score || 0,
            total_score: data.total_score || 0,
            weeklyScore: data.weekly_score || 0,
            weekly_score: data.weekly_score || 0,
            loginStreak: currentStreak,
            login_streak: currentStreak,
            highestStreak: helperGetHighestStreak(user.id, currentStreak, data.highest_streak || 0),
            highest_streak: helperGetHighestStreak(user.id, currentStreak, data.highest_streak || 0),
            levels_completed: data.levels_completed || 0,
            stamina: currentStamina,
            maxStamina: maxStamina,
            energy: currentStamina,
            max_energy: maxStamina,
            daily_missions: data.daily_missions || {},
            inventory: data.inventory || [],
            wins: data.wins || 0,
            class_progress: data.class_progress || {},
            classProgress: helperComputeClassProgress(data.class_progress || {})
          });

          // Chỉ cập nhật nếu có thay đổi thực sự để tránh nhấp nháy UI (flashing)
          const newDisplayName = data.display_name || user.email;
          const newAvatar = data.avatar_url || 'adventurer-1';

          const hasChanged =
            prevUserRef.current?.displayName !== newDisplayName ||
            prevUserRef.current?.avatar !== newAvatar ||
            prevUserRef.current?.display_name !== newDisplayName ||
            prevUserRef.current?.avatar_url !== newAvatar ||
            prevUserRef.current?.login_streak !== currentStreak ||
            prevUserRef.current?.stamina !== currentStamina;

          if (hasChanged) {
            setUser(prev => ({
              ...prev,
              displayName: newDisplayName,
              avatar: newAvatar,
              display_name: newDisplayName,
              avatar_url: newAvatar,
              stamina: currentStamina,
              login_streak: currentStreak,
              last_active_at: updatedStats.last_active_at,
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
    setBgVolume, setSfxVolume, toggleBgMute, toggleSfxMute,
    theme, toggleTheme
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
    return <GalaxyBackground />;
  };

  return (
    <ToastProvider>
      <AuthContext.Provider value={authValue}>
        <Router>
          <div className="min-h-screen relative">
            <BackgroundManager />
            {user && lockNotice ? (
              <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-2xl rounded-2xl border border-red-400/40 bg-red-900/70 backdrop-blur-md p-6 md:p-8 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-red-100 mb-2">Tài khoản của bạn đã bị khóa</h1>
                  <p className="text-red-100/90 mb-4">Hệ thống phát hiện hành vi bất thường và đã chặn truy cập tài khoản.</p>

                  <div className="text-left bg-black/20 border border-white/10 rounded-xl p-4 mb-6 space-y-2">
                    <p className="text-red-100 text-sm"><span className="font-semibold text-red-200">Lý do khóa:</span> {lockNotice.reason}</p>
                    <p className="text-red-100 text-sm"><span className="font-semibold text-red-200">Thời gian khóa:</span> {formatDateTime(lockNotice.lockedAt)}</p>
                    <div className="pt-2 border-t border-white/10 mt-2">
                      <p className="text-red-200 text-xs leading-relaxed font-semibold">
                        ⚠️ Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ số tổng đài hỗ trợ: <span className="text-yellow-300 font-bold underline">0838667369</span> hoặc gửi email đến <span className="text-yellow-300 font-bold underline">support@biolearn.vn</span> để được hỗ trợ mở khóa.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLockedLogout}
                    className="px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-red-100 transition shadow-lg active:scale-95"
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
                    path="/admin/reports"
                    element={renderAdminOnly(<AdminReportsPage />)}
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
                <ChatboxManager user={user} />
              </>
            )}
          </div>
        </Router>
      </AuthContext.Provider>
    </ToastProvider>
  );
}

export default App;
