import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Leaf, Coins, Trophy, Target, LogOut, 
  Plus, User, ChevronRight, Sparkles, Zap, MoreHorizontal, Swords,
  Microscope, Dna, FlaskConical, Heart,
  Sprout, TreePine, Flower2, GraduationCap, Bug, Activity, Atom,
  Mail, X, HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

// Avatar mapping - sử dụng tên file thực tế từ folder Avatar
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

export default function HomePage() {
  const { user, userStats, logout, refreshUserStats } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [energy, setEnergy] = useState({ energy: 20, maxEnergy: 20, minutesUntilNextEnergy: 0 });
  const [userAvatar, setUserAvatar] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Modal xác nhận đăng xuất
  const [showBattleMenuModal, setShowBattleMenuModal] = useState(false);
  
  // Mailbox state
  const [mails, setMails] = useState([]);
  const [showInboxModal, setShowInboxModal] = useState(false);

  const fetchMails = async () => {
    if (!user?.id) return;
    try {
      // Automatic cleanup: delete mails older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      await supabase
        .from('user_mails')
        .delete()
        .eq('receiver_id', user.id)
        .lt('created_at', sevenDaysAgo.toISOString());

      // Fetch active mails
      const { data, error } = await supabase
        .from('user_mails')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMails(data);
      }
    } catch (err) {
      console.error("Lỗi tải thư:", err);
    }
  };

  const handleOpenInbox = async () => {
    setShowInboxModal(true);
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_mails')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        
        if (!error) {
          setMails(prev => prev.map(m => ({ ...m, is_read: true })));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClaimCoins = async (mail) => {
    if (mail.is_claimed || mail.coins_attached <= 0 || !user?.id) return;
    try {
      const { error: mailErr } = await supabase
        .from('user_mails')
        .update({ is_claimed: true })
        .eq('id', mail.id);
      
      if (mailErr) throw mailErr;

      const currentCoins = userStats?.coins || 0;
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ coins: currentCoins + mail.coins_attached })
        .eq('id', user.id);
      
      if (profileErr) throw profileErr;

      refreshUserStats();
      fetchMails();
      showToast(`Đã nhận thành công ${mail.coins_attached.toLocaleString()} Xu vào tài khoản!`, 'success');
    } catch (err) {
      showToast("Không thể nhận xu: " + err.message, 'error');
    }
  };

  const hasUnreadMails = mails.some(m => !m.is_read);
  
  useEffect(() => {
    refreshUserStats();
    fetchUserAvatar();
    if (user?.id) {
      fetchMails();
    }
    // Refresh energy and fetch mails periodically
    const interval = setInterval(() => {
      refreshUserStats();
      if (user?.id) fetchMails();
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Gỡ bỏ fetchUserAvatar cũ vì Supabase user object đã có avatar
  const fetchUserAvatar = () => {
    // Thông tin đã được xử lý trong App.jsx/useAuth
  };

  useEffect(() => {
    if (userStats?.energy) {
      setEnergy(userStats.energy);
    }
  }, [userStats]);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const handleBattleMenuNavigate = (mode) => {
    setShowBattleMenuModal(false);

    if (mode === 'weekly') {
      navigate('/leaderboard', { state: { tab: 'weekly' } });
      return;
    }

    if (mode === 'battle') {
      navigate('/leaderboard', { state: { tab: 'battle' } });
      return;
    }

    if (mode === 'room') {
      navigate('/quiz-room');
    }
  };

  // Get avatar URL from ID
  const getAvatarUrl = () => {
    const avatar = user?.avatar_url || user?.avatar || userStats?.avatar_url;
    if (!avatar) return avatarMap['adventurer-1'];
    if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar;
    return avatarMap[avatar] || avatarMap['adventurer-1'];
  };

  // Danh sách lớp học THCS
  const classesThCS = [
    { id: 6, name: 'Lớp 6', color: 'from-green-400 to-green-600', Icon: Sprout },
    { id: 7, name: 'Lớp 7', color: 'from-blue-400 to-blue-600', Icon: Leaf },
    { id: 8, name: 'Lớp 8', color: 'from-purple-400 to-purple-600', Icon: TreePine },
    { id: 9, name: 'Lớp 9', color: 'from-orange-400 to-orange-600', Icon: Flower2 },
  ];

  // Danh sách lớp học THPT
  const classesThPT = [
    { id: 10, name: 'Lớp 10', color: 'from-cyan-400 to-cyan-600', Icon: Dna },
    { id: 11, name: 'Lớp 11', color: 'from-pink-400 to-pink-600', Icon: Microscope },
    { id: 12, name: 'Lớp 12', color: 'from-amber-400 to-amber-600', Icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen pb-20 relative bg-transparent">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Avatar & User Info */}
            <Link to="/profile" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full avatar-circle overflow-hidden bg-green-600">
                <img 
                  src={getAvatarUrl()} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/Avatar/adventurer-1766999604259.png';
                  }}
                />
              </div>
              <div>
                <p className="text-white font-semibold">{user?.displayName || user?.username || 'Học sinh'}</p>
                <p className="text-green-300 text-sm">Level {userStats?.level}</p>
              </div>
            </Link>

            {/* Stats Bar (Đã xích nhẹ và bo gọn để có không gian cho hộp thư) */}
            <div className="flex items-center gap-3">
              {/* Energy */}
              <div className="flex items-center gap-1.5 bg-green-700/50 px-2.5 py-1.5 rounded-xl border border-white/5">
                <Leaf className="w-4 h-4 text-green-300 leaf-energy" />
                <span className="text-white font-bold text-xs">{userStats?.energy || 0}</span>
                <span className="text-green-300 text-[10px]">/{userStats?.max_energy || 20}</span>
                {(userStats?.energy || 0) < (userStats?.max_energy || 20) && (
                  <Link to="/minigame/6" className="ml-0.5">
                    <Plus className="w-3.5 h-3.5 text-green-300 hover:text-white" />
                  </Link>
                )}
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1.5 bg-yellow-600/50 px-2.5 py-1.5 rounded-xl border border-white/5">
                <Coins className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-bold text-xs">{userStats?.coins || 0}</span>
              </div>

              {/* Hộp thư (Mailbox) */}
              <button 
                onClick={handleOpenInbox}
                className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Hộp thư"
              >
                <Mail className="w-4 h-4 text-white" />
                {hasUnreadMails && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse shadow-lg" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Banner - Upgraded to Clear Liquid Glass */}
        <div className="card-clear-liquid-glass mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/25 border border-green-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/10">
              <Sparkles className="w-8 h-8 text-green-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Chào mừng trở lại!</h2>
              <p className="text-green-300 font-medium">Hãy tiếp tục hành trình khám phá Sinh học nào!</p>
            </div>
          </div>
        </div>

        {/* Quick Stats - Upgraded to Clear Liquid Glass */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Link to="/leaderboard" className="card-clear-liquid-glass text-center p-4">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold">{userStats?.total_score || 0}</p>
            <p className="text-green-300 text-sm">Tổng điểm</p>
          </Link>
          
          <Link to="/missions" className="card-clear-liquid-glass text-center p-4">
            <Target className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-white font-bold">
              {userStats?.daily_missions ? 
                [userStats.daily_missions.mission1Completed, 
                 userStats.daily_missions.mission2Completed, 
                 userStats.daily_missions.mission3Completed].filter(Boolean).length 
                : 0}/3
            </p>
            <p className="text-green-300 text-sm">Nhiệm vụ</p>
          </Link>

          <Link to="/leaderboard" className="card-clear-liquid-glass text-center p-4">
            <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold">{userStats?.weekly_score || 0}</p>
            <p className="text-green-300 text-sm">Điểm tuần</p>
          </Link>
        </div>

        {/* Class Selection - THCS */}
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-400" />
          Sinh học THCS
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {classesThCS.map((cls) => (
            <Link
              key={cls.id}
              to={`/map/${cls.id}`}
              className={`game-card bg-gradient-to-br ${cls.color} game-card-liquid-glass-colored hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm shadow-sm">
                    <cls.Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">{cls.name}</h4>
                  <p className="text-white/80 text-sm mt-1">Sinh học THCS</p>
                </div>
                <ChevronRight className="w-8 h-8 text-white/60" />
              </div>
            </Link>
          ))}
        </div>

        {/* Class Selection - THPT */}
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-cyan-400" />
          Sinh học THPT
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {classesThPT.map((cls) => (
            <Link
              key={cls.id}
              to={`/map/${cls.id}`}
              className={`game-card bg-gradient-to-br ${cls.color} game-card-liquid-glass-colored hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm shadow-sm">
                    <cls.Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">{cls.name}</h4>
                  <p className="text-white/80 text-sm mt-1">Sinh học THPT</p>
                </div>
                <ChevronRight className="w-8 h-8 text-white/60" />
              </div>
            </Link>
          ))}
        </div>

        {/* Mini Game Quick Access */}
        {(userStats?.energy || 0) < (userStats?.max_energy || 20) && (
          <div className="mt-6">
            <Link 
              to="/minigame/6"
              className="game-card block bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold">Mini Game - Lật thẻ</h4>
                  <p className="text-purple-200 text-xs">{2 - (userStats?.mini_game_claims_today || 0)} lượt còn</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 🧬 PHÒNG THÍ NGHIỆM ẢO - Game mô phỏng 3D */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-purple-400" />
              Phòng thí nghiệm ảo
            </h3>
            <Link 
              to="/simulations" 
              className="btn-hover-reveal-glass font-bold"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* DNA 3D - Purple Card */}
            <Link
              to="/simulations"
              className="game-card bg-gradient-to-br from-purple-600/40 to-indigo-700/40 virtual-lab-card lab-card-purple"
            >
              <div className="flex flex-col items-center text-center py-2">
                <Dna className="w-12 h-12 text-purple-300 mb-2" />
                <h4 className="text-white font-bold">ADN xoắn kép</h4>
                <p className="text-purple-200 text-xs mt-1">Mô hình 3D tương tác</p>
              </div>
            </Link>

            {/* Tế bào - Pink Card */}
            <Link
              to="/simulations"
              className="game-card bg-gradient-to-br from-pink-600/40 to-rose-700/40 virtual-lab-card lab-card-pink"
            >
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-pink-500/30 flex items-center justify-center mb-2">
                  <Atom className="w-6 h-6 text-pink-300" />
                </div>
                <h4 className="text-white font-bold">Tế bào học</h4>
                <p className="text-pink-200 text-xs mt-1">Khám phá bào quan</p>
              </div>
            </Link>

            {/* Kính hiển vi - Cyan Card */}
            <Link
              to="/simulations"
              className="game-card bg-gradient-to-br from-cyan-600/40 to-blue-700/40 virtual-lab-card lab-card-cyan"
            >
              <div className="flex flex-col items-center text-center py-2">
                <Microscope className="w-12 h-12 text-cyan-300 mb-2" />
                <h4 className="text-white font-bold">Kính hiển vi</h4>
                <p className="text-cyan-200 text-xs mt-1">Vi sinh vật sống động</p>
              </div>
            </Link>

            {/* Cơ thể người - Red Card */}
            <Link
              to="/simulations"
              className="game-card bg-gradient-to-br from-red-600/40 to-rose-700/40 virtual-lab-card lab-card-red"
            >
              <div className="flex flex-col items-center text-center py-2">
                <Heart className="w-12 h-12 text-red-300 mb-2" />
                <h4 className="text-white font-bold">Cơ thể người</h4>
                <p className="text-red-200 text-xs mt-1">Giải phẫu 3D</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 🧬 MÔ HÌNH SINH HỌC 3D - Redesigned Pure Liquid Glass Card */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Dna className="w-6 h-6 text-purple-400" />
            Mô hình sinh học 3D
          </h3>
          
          <div className="card-clear-liquid-glass p-8 text-center relative overflow-hidden group w-full">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/15 transition-all duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Icon Wrapper - Pure Glassmorphic */}
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300 mb-6 biology-3d-icon-wrapper">
                <Dna className="w-9 h-9 text-purple-400 biology-3d-icon" />
              </div>
              
              {/* Title & Description */}
              <h4 className="text-xl font-black text-white tracking-tight biology-3d-title">
                Khám phá thế giới vi mô
              </h4>
              <p className="text-purple-200 text-sm mt-3 leading-relaxed font-medium max-w-xl mx-auto biology-3d-desc">
                Xoay, phóng to và tương tác trực quan với các mô hình cấu trúc phân tử ADN, tế bào, và vi sinh vật sống động trong không gian 3 chiều.
              </p>
              
              {/* Action Button - Pure Colorless Liquid Glass */}
              <div className="mt-8 w-full max-w-md">
                <Link 
                  to="/biology3d"
                  className="w-full py-4 rounded-2xl btn-pure-liquid-glass text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
                >
                  Khám phá ngay <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/home" className="flex flex-col items-center text-green-300">
              <Leaf className="w-6 h-6" />
              <span className="text-xs mt-1">Trang chủ</span>
            </Link>
            <Link to="/missions" className="flex flex-col items-center text-white/60 hover:text-green-300">
              <Target className="w-6 h-6" />
              <span className="text-xs mt-1">Nhiệm vụ</span>
            </Link>
            <button
              onClick={() => setShowBattleMenuModal(true)}
              className="flex flex-col items-center text-white/60 hover:text-green-300"
            >
              <div className="relative">
                <Trophy className="w-6 h-6" />
                <Swords className="w-3 h-3 absolute -bottom-1 -right-1 text-yellow-400" />
              </div>
              <span className="text-xs mt-1">Xếp hạng/VS</span>
            </button>
            <Link to="/more" className="flex flex-col items-center text-white/60 hover:text-green-300">
              <MoreHorizontal className="w-6 h-6" />
              <span className="text-xs mt-1">Thêm</span>
            </Link>
            <button onClick={handleLogout} className="flex flex-col items-center text-white/60 hover:text-red-400">
              <LogOut className="w-6 h-6" />
              <span className="text-xs mt-1">Đăng xuất</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modal tùy chọn Xếp hạng / VS / Room Quiz */}
      {showBattleMenuModal && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-end sm:items-center justify-center p-4">
          <div className="game-card w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Xếp hạng & Đối kháng</h2>
            <p className="text-gray-300 text-sm mb-4">Chọn chế độ bạn muốn vào</p>

            <div className="space-y-3">
              <button
                onClick={() => handleBattleMenuNavigate('weekly')}
                className="w-full p-4 rounded-[1.5rem] bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-left flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer battle-menu-btn-weekly"
              >
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                  <Trophy className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Xếp hạng</p>
                  <p className="text-yellow-200/70 text-sm">Xem bảng xếp hạng tuần</p>
                </div>
              </button>

              <button
                onClick={() => handleBattleMenuNavigate('battle')}
                className="w-full p-4 rounded-[1.5rem] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-left flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer battle-menu-btn-battle"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Swords className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">VS Đối kháng</p>
                  <p className="text-purple-200/70 text-sm">Ghép trận hoặc chơi với bot</p>
                </div>
              </button>

              <button
                onClick={() => handleBattleMenuNavigate('room')}
                className="w-full p-4 rounded-[1.5rem] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-left flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer battle-menu-btn-room"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <HelpCircle className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Room Quiz</p>
                  <p className="text-cyan-200/70 text-sm">Nhập mã phòng do giáo viên cung cấp</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowBattleMenuModal(false)}
              className="w-full mt-4 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
              style={{
                backgroundColor: document.body?.classList?.contains('light-theme') ? '#e2e8f0' : undefined,
                color: document.body?.classList?.contains('light-theme') ? '#1e293b' : undefined
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal xác nhận đăng xuất */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4">
          <div className="game-card max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Đăng xuất</h2>
            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Hộp thư - Liquid Glass trong suốt hiện đại */}
      {showInboxModal && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 flex flex-col max-h-[80vh] shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider italic">Hộp Thư Của Bạn</h3>
                  <p className="text-xs text-white/40 font-bold">Thư sẽ tự động xóa sau 7 ngày</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInboxModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mail List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {mails.length === 0 ? (
                <div className="text-center py-12 text-white/30 italic text-sm font-semibold">
                  Hộp thư trống
                </div>
              ) : (
                mails.map((mail) => (
                  <div 
                    key={mail.id} 
                    className="p-4 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-white font-bold text-sm tracking-wide">{mail.title}</h4>
                        <p className="text-[10px] text-white/30 font-semibold mt-1">
                          {new Date(mail.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{mail.content}</p>
                    
                    {mail.coins_attached > 0 && (
                      <div className="mt-2 flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-yellow-400 animate-bounce" />
                          <span className="text-yellow-400 text-xs font-bold">Kèm theo: +{mail.coins_attached.toLocaleString()} Xu</span>
                        </div>
                        <button
                          onClick={() => handleClaimCoins(mail)}
                          disabled={mail.is_claimed}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                            mail.is_claimed 
                              ? 'bg-white/10 text-white/40 border border-white/5' 
                              : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {mail.is_claimed ? 'Đã nhận' : 'Nhận quà'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
