import { getAvatarUrl as resolveAvatarUrl } from '../utils/avatar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft, Trophy, Medal, Crown, Star,
  ChevronUp, ChevronDown, Minus, RefreshCw, Swords, Bot, Users, X, Clock, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWeeklyCountdown } from '../hooks/useCountdown';
import { 
  Sprout, Leaf, TreePine, Flower2, Dna, Microscope, GraduationCap,
  Microscope as LabIcon, Binary, Biohazard, FlaskConical, Atom
} from 'lucide-react';

// Avatar map để ánh xạ ID avatar sang đường dẫn ảnh


// Hàm lấy URL avatar từ ID hoặc URL
const getAvatarUrl = (avatar) => resolveAvatarUrl(avatar);

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userStats } = useAuth();
  const [totalLeaderboard, setTotalLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('total');
  const timeLeft = useWeeklyCountdown();
  const leaderboardRequestRef = useRef(0);
  const loadedClassWeekRef = useRef('');

  // Battle states
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [showBotSelect, setShowBotSelect] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [battleMode, setBattleMode] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const [cooldownNotice, setCooldownNotice] = useState('');
  const matchFoundRef = useRef(false);
  const [debugLog, setDebugLog] = useState([]); // Debug log hiện trên UI

  const addDebug = (msg) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[MM] ${msg}`);
    setDebugLog(prev => [...prev.slice(-8), `${time} ${msg}`]);
  };

  // Xử lý history
  useEffect(() => {
    window.history.replaceState({ fromLeaderboard: true }, '', window.location.href);
  }, []);

  // Ghép trận nguyên tử tại database để mỗi người chỉ thuộc một cặp/phòng.
  useEffect(() => {
    let timeoutTimer = null;
    let claimTimer = null;
    let navigating = false;

    if (!showMatchmaking) return undefined;
    const currentUserId = user?.id || user?.uid;
    if (!currentUserId) return undefined;

    const myDisplayName = userStats?.display_name || 'Người chơi';
    const myAvatarUrl = userStats?.avatar_url || null;
    addDebug(`🚀 Bắt đầu tìm trận lớp ${selectedClass} (ID: ${currentUserId.substring(0, 8)}...)`);

    const goToRoom = (match) => {
      if (navigating || matchFoundRef.current || match?.status !== 'matched') return;
      const opponentId = match.opponent_id || (match.host_id === currentUserId ? match.guest_id : match.host_id);
      navigating = true;
      matchFoundRef.current = true;
      setMatchFound(true);
      setOpponent({ id: opponentId, display_name: match.opponent_name || 'Đối thủ', avatar_url: match.opponent_avatar || null });
      addDebug(`✅ Ghép trận thành công! Phòng: ${match.room_id.substring(0, 20)}...`);
      setTimeout(() => {
        const query = new URLSearchParams({ room: match.room_id, class: String(selectedClass), host: match.host_id, opponent: opponentId });
        navigate(`/battle-pvp?${query.toString()}`, { replace: true });
      }, 800);
    };

    const claimMatch = async () => {
      if (navigating || matchFoundRef.current) return;
      try {
        const { data, error } = await supabase.rpc('claim_pvp_match', {
          p_class_id: selectedClass,
          p_display_name: myDisplayName,
          p_avatar_url: myAvatarUrl
        });
        if (error) throw error;
        goToRoom(data);
      } catch (error) {
        addDebug(`❌ Ghép trận thất bại: ${error.message}`);
      }
    };

    claimMatch();
    claimTimer = setInterval(claimMatch, 1200);
    timeoutTimer = setInterval(() => {
      setMatchmakingTime(prev => {
        if (prev >= 30) {
          clearInterval(timeoutTimer);
          setShowMatchmaking(false);
          setShowBotSelect(true);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timeoutTimer) clearInterval(timeoutTimer);
      if (claimTimer) clearInterval(claimTimer);
      if (!matchFoundRef.current) supabase.from('pvp_queues').delete().eq('user_id', currentUserId);
    };
  }, [showMatchmaking, selectedClass, user, userStats, navigate]);
  // Rời khỏi queue
  const leaveQueue = async () => {
    try {
      const userId = user?.id || user?.uid;
      if (userId) {
        await supabase
          .from('pvp_queues')
          .delete()
          .eq('user_id', userId);
      }
    } catch (err) {
      console.error('Error leaving queue:', err);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    const requestId = ++leaderboardRequestRef.current;
    setLoading(true);
    try {
      const totalRequest = supabase
        .from('profiles')
        .select('*')
        .eq('is_test_account', false)
        .gt('total_score', 0)
        .order('total_score', { ascending: false })
        .limit(50);

      const weeklyRequest = (async () => {
        const { data: weekStart, error: weekError } = await supabase.rpc('current_biolearn_week');
        if (weekError) throw weekError;

        const { data, error } = await supabase
          .from('weekly_scores')
          .select('weekly_score,map_score,pvp_score,profiles!inner(*)')
          .eq('week_start', weekStart)
          .eq('profiles.is_test_account', false)
          .gt('weekly_score', 0)
          .order('weekly_score', { ascending: false })
          .limit(50);
        if (error) throw error;

        return (data || []).map(row => ({
          ...row.profiles,
          weekly_score: row.weekly_score,
          weekly_map_score: row.map_score,
          weekly_pvp_score: row.pvp_score
        }));
      })();

      const [totalResult, weeklyResult] = await Promise.allSettled([totalRequest, weeklyRequest]);

      if (totalResult.status === 'fulfilled' && !totalResult.value.error) {
        setTotalLeaderboard(totalResult.value.data || []);
      } else {
        console.error('Error fetching total leaderboard:', totalResult.status === 'rejected' ? totalResult.reason : totalResult.value.error);
        setTotalLeaderboard([]);
      }

      if (weeklyResult.status === 'fulfilled') {
        setWeeklyLeaderboard(weeklyResult.value);
      } else {
        // Tạm tương thích nếu giao diện được cập nhật trước migration database.
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_test_account', false)
          .gt('weekly_score', 0)
          .order('weekly_score', { ascending: false })
          .limit(50);

        if (fallbackError) console.error('Error fetching weekly leaderboard:', weeklyResult.reason, fallbackError);
        setWeeklyLeaderboard(fallbackData || []);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      if (requestId === leaderboardRequestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!timeLeft.weekStart) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) fetchLeaderboard();
    });
    return () => {
      cancelled = true;
    };
  }, [timeLeft.weekStart, fetchLeaderboard]);

  // Huy chương theo rank (style Duolingo)
  const getMedalBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <Crown className="w-6 h-6 text-yellow-900" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 border-2 border-white">1</div>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center shadow-lg shadow-gray-400/50">
            <Medal className="w-6 h-6 text-gray-700" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-white">2</div>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
            <Medal className="w-6 h-6 text-amber-900" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-amber-900 border-2 border-white">3</div>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-green-600/30 rounded-full flex items-center justify-center">
        <span className="text-lg font-bold text-green-400">{rank}</span>
      </div>
    );
  };

  const getRankChange = (change) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-green-400 text-xs">
          <ChevronUp className="w-4 h-4" />
          {change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="flex items-center text-red-400 text-xs">
          <ChevronDown className="w-4 h-4" />
          {Math.abs(change)}
        </span>
      );
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  // Danh sách lớp để chọn khi đối kháng - Sử dụng Icon Lucide hiện đại hơn
  const classOptions = [
    { id: 6, name: 'Lớp 6', icon: <Sprout className="w-8 h-8 text-green-400" />, label: 'Tế bào' },
    { id: 7, name: 'Lớp 7', icon: <Leaf className="w-8 h-8 text-emerald-400" />, label: 'Thực vật' },
    { id: 8, name: 'Lớp 8', icon: <TreePine className="w-8 h-8 text-green-600" />, label: 'Hệ sinh thái' },
    { id: 9, name: 'Lớp 9', icon: <Flower2 className="w-8 h-8 text-pink-400" />, label: 'Di truyền' },
    { id: 10, name: 'Lớp 10', icon: <Dna className="w-8 h-8 text-purple-400" />, label: 'ADN & Gen' },
    { id: 11, name: 'Lớp 11', icon: <Microscope className="w-8 h-8 text-blue-400" />, label: 'Vi sinh' },
    { id: 12, name: 'Lớp 12', icon: <GraduationCap className="w-8 h-8 text-amber-400" />, label: 'Tiến hóa' },
  ];

  // State cho bảng xếp hạng PvP theo lớp
  const [showClassLeaderboard, setShowClassLeaderboard] = useState(false);
  const [classLeaderboard, setClassLeaderboard] = useState([]);
  const [loadingClassLeaderboard, setLoadingClassLeaderboard] = useState(false);

  useEffect(() => {
    const requestedTab = location.state?.tab;

    if (requestedTab === 'battle') {
      setActiveTab('battle');
      setShowClassSelect(true);
      setShowClassLeaderboard(false);
      setShowMatchmaking(false);
      setShowBotSelect(false);
      return;
    }

    if (requestedTab === 'weekly') {
      setActiveTab('weekly');
      setShowClassSelect(false);
      setShowClassLeaderboard(false);
      setShowMatchmaking(false);
      setShowBotSelect(false);
      return;
    }

    if (requestedTab === 'total') {
      setActiveTab('total');
      setShowClassSelect(false);
      setShowClassLeaderboard(false);
      setShowMatchmaking(false);
      setShowBotSelect(false);
    }
  }, [location.state]);

  // Chọn lớp - hiển thị bảng xếp hạng trước khi bắt đầu
  const selectClass = useCallback(async (classId) => {
    loadedClassWeekRef.current = timeLeft.weekStart;
    setSelectedClass(classId);
    setShowClassSelect(false);
    setShowClassLeaderboard(true);
    setLoadingClassLeaderboard(true);

    try {
      const { data, error } = await supabase
        .from('pvp_class_scores')
        .select('score,wins,losses,draws,completed_matches,profiles!inner(id,display_name,avatar_url)')
        .eq('class_id', classId)
        .eq('week_start', timeLeft.weekStart)
        .eq('profiles.is_test_account', false)
        .gt('score', 0)
        .order('score', { ascending: false })
        .limit(10);

      if (!error && data) {
        setClassLeaderboard(data.map(row => ({
          ...row.profiles,
          pvp_score: row.score,
          wins: row.wins,
          losses: row.losses,
          draws: row.draws,
          completed_matches: row.completed_matches
        })));
      }
    } catch (err) {
      console.error('Error fetching class leaderboard:', err);
      setClassLeaderboard([]);
    }
    setLoadingClassLeaderboard(false);
  }, [timeLeft.weekStart]);

  useEffect(() => {
    if (
      showClassLeaderboard
      && selectedClass
      && timeLeft.weekStart
      && loadedClassWeekRef.current !== timeLeft.weekStart
    ) {
      const timer = setTimeout(() => selectClass(selectedClass), 0);
      return () => clearTimeout(timer);
    }
  }, [timeLeft.weekStart, showClassLeaderboard, selectedClass, selectClass]);

  const startMatchmaking = async () => {
    const currentUserId = user?.id || user?.uid;
    if (!currentUserId) return;
    const { data } = await supabase
      .from('profiles')
      .select('pvp_cooldown_until')
      .eq('id', currentUserId)
      .single();
    const cooldownUntil = data?.pvp_cooldown_until ? new Date(data.pvp_cooldown_until) : null;
    if (cooldownUntil && cooldownUntil.getTime() > Date.now()) {
      const seconds = Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000);
      setCooldownNotice(`Bạn vừa bỏ cuộc. Vui lòng chờ ${seconds} giây trước khi ghép trận lại.`);
      return;
    }
    setCooldownNotice('');
    setShowClassLeaderboard(false);
    setShowMatchmaking(true);
    setMatchmakingTime(0);
    setBattleMode('pvp');
    setMatchFound(false);
    matchFoundRef.current = false;
    setOpponent(null);
    setDebugLog([]);
  };

  const startBotBattle = (difficulty) => {
    setShowBotSelect(false);
    // Navigate to battle page with bot
    navigate(`/battle?mode=pve&class=${selectedClass}&difficulty=${difficulty}`);
  };

  const cancelMatchmaking = async () => {
    matchFoundRef.current = false;
    await leaveQueue();
    setShowMatchmaking(false);
    setMatchmakingTime(0);
    setShowClassLeaderboard(true);
    setMatchFound(false);
    setOpponent(null);
  };

  const backToClassSelect = () => {
    setShowClassLeaderboard(false);
    setShowClassSelect(true);
    setSelectedClass(null);
  };

  const activeScoreLeaderboard = activeTab === 'total' ? totalLeaderboard : weeklyLeaderboard;
  const activeScoreField = activeTab === 'total' ? 'total_score' : 'weekly_score';
  const activeScoreLabel = activeTab === 'total' ? 'Tổng điểm' : 'Điểm tuần';
  const currentUserId = user?.id || user?.uid;
  const isCurrentPlayer = (player) => Boolean(
    currentUserId &&
    (player?.id || player?._id) &&
    String(player.id || player._id) === String(currentUserId)
  );

  return (
    <div className="min-h-screen relative bg-transparent text-white pb-24 overflow-x-hidden">
      {/* Local decorations removed to allow global galaxy to show */}

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home', { replace: true })}
            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 mb-0.5">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-[10px] font-black tracking-[0.3em] text-yellow-400/80 uppercase">BioLearn</span>
             </div>
             <h1 className="text-xl font-black text-white tracking-widest uppercase italic">BẢNG XẾP HẠNG</h1>
          </div>

          <button 
            onClick={fetchLeaderboard}
            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 active:scale-95"
          >
            <RefreshCw className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 relative z-10">
        {/* Tabs - Advanced Biological Style */}
        <div className="flex bg-black/40 p-1.5 rounded-[2rem] gap-2 mb-10 border border-white/10 shadow-2xl">
          <button
            onClick={() => {
              setActiveTab('total');
              setShowClassSelect(false);
              setShowClassLeaderboard(false);
            }}
            className={`flex-1 py-3.5 px-3 md:px-6 rounded-[1.75rem] font-black text-xs md:text-sm transition-all relative overflow-hidden ${
              activeTab === 'total'
                ? 'leaderboard-tab-active bg-gradient-to-r from-emerald-500 to-green-700 text-white shadow-[0_4px_15px_rgba(34,197,94,0.35)]'
                : 'leaderboard-tab-inactive text-white/40 hover:text-white/60'
            }`}
          >
            TỔNG ĐIỂM
          </button>
          <button 
            onClick={() => {
              setActiveTab('weekly');
              setShowClassSelect(false);
              setShowClassLeaderboard(false);
            }}
            className={`flex-1 py-3.5 px-3 md:px-6 rounded-[1.75rem] font-black text-xs md:text-sm transition-all relative overflow-hidden ${
              activeTab === 'weekly' 
                ? 'leaderboard-tab-active bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-[0_4px_15px_rgba(245,158,11,0.4)]'
                : 'leaderboard-tab-inactive text-white/40 hover:text-white/60'
            }`}
          >
            TUẦN NÀY
          </button>
          <button 
            onClick={() => {
              setActiveTab('battle');
              setShowClassSelect(true);
            }}
            className={`flex-1 py-3.5 px-3 md:px-6 rounded-[1.75rem] font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'battle' 
                ? 'leaderboard-tab-active bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-[0_4px_15px_rgba(147,51,234,0.4)]'
                : 'leaderboard-tab-inactive text-white/40 hover:text-white/60'
            }`}
          >
            <Swords className="w-4 h-4" />
            ĐỐI KHÁNG
          </button>
        </div>

        {/* Tổng điểm là bảng tích lũy; chỉ hai bảng theo tuần mới có đồng hồ. */}
        {activeTab !== 'total' && (
          <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 mb-12 flex items-center gap-5 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-inner border border-blue-400/20">
              <Clock className="w-7 h-7 text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.25em] mb-1.5">Tuần hiện tại kết thúc sau</p>
              <div className="flex items-baseline gap-2">
                <p className="text-white font-black text-2xl tracking-tighter">
                  {timeLeft.days}<span className="text-xs text-white/40 ml-0.5 mr-2">N</span>
                  {timeLeft.hours}<span className="text-xs text-white/40 ml-0.5 mr-2">G</span>
                  {timeLeft.minutes}<span className="text-xs text-white/40 ml-0.5 mr-2">P</span>
                  {timeLeft.seconds}<span className="text-xs text-white/40 ml-0.5">S</span>
                </p>
              </div>
            </div>
            <Trophy className="w-12 h-12 text-white/5 absolute right-[-1rem] bottom-[-1rem] rotate-12" />
          </div>
        )}

        {/* Leaderboard Content */}
        {(activeTab === 'total' || activeTab === 'weekly') && (
          <div className="space-y-12">
            {loading ? (
              <div className="leaderboard-empty-state text-center py-24 bg-white/5 border border-white/5 rounded-[3rem] shadow-2xl" role="status">
                <RefreshCw className="leaderboard-empty-icon w-12 h-12 mx-auto animate-spin" />
                <p className="leaderboard-empty-description font-bold mt-4">Đang tải bảng xếp hạng...</p>
              </div>
            ) : activeScoreLeaderboard.length === 0 ? (
              <div className="leaderboard-empty-state text-center py-24 bg-white/5 border border-white/5 rounded-[3rem] shadow-2xl">
                <div className="leaderboard-empty-icon-wrap w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Trophy className="leaderboard-empty-icon w-12 h-12" />
                </div>
                <h3 className="leaderboard-empty-title text-2xl font-black text-white/80">Chưa có bảng xếp hạng</h3>
                <p className="leaderboard-empty-description text-white/30 font-bold mt-2">Bắt đầu học ngay để xuất hiện tại đây!</p>
              </div>
            ) : (
              <>
                {/* Top 10 Label Pill - Beautifully refined */}
                <div className="flex justify-center mb-20 relative z-10">
                   <div className="bg-[#B2EE55] text-[#062013] px-12 py-3 rounded-full font-black text-xs shadow-[0_10px_25px_rgba(178,238,85,0.3)] border-[3px] border-[#062013] uppercase tracking-[0.2em] flex items-center gap-3">
                     <Star className="w-3.5 h-3.5 fill-current" />
                     Top 10 - Tất cả
                     <Star className="w-3.5 h-3.5 fill-current" />
                   </div>
                </div>

                {/* Top 3 Vertical Layout (Without Podium) */}
                <div className="flex items-center justify-center gap-6 md:gap-14 mb-16 px-2 relative z-20">
                  {[1, 0, 2].map((actualIndex) => {
                    const actualPlayer = activeScoreLeaderboard[actualIndex];
                    if (!actualPlayer) return <div key={`empty-${actualIndex}`} className="flex-1" />;
                    
                    const rank = actualIndex + 1;
                    const configs = {
                      1: { 
                        scale: 'scale-90 translate-y-4', 
                        pillColor: 'bg-emerald-500',
                        crownColor: 'text-slate-200 drop-shadow-[0_0_18px_rgba(226,232,240,0.65)]'
                      },
                      0: { 
                        scale: 'scale-110 -translate-y-4', 
                        pillColor: 'bg-yellow-500',
                        crownColor: 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.65)]'
                      },
                      2: { 
                        scale: 'scale-75 translate-y-8', 
                        pillColor: 'bg-orange-500',
                        crownColor: 'text-amber-700 drop-shadow-[0_0_18px_rgba(180,83,9,0.65)]'
                      }
                    };
                    const config = configs[actualIndex];
                    const isCurrentUser = isCurrentPlayer(actualPlayer);

                    return (
                      <div key={actualPlayer.id || actualIndex} className={`flex flex-col items-center flex-1 transition-all duration-1000 ${config.scale} relative z-10`}>
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40" aria-label={`Vương miện hạng ${rank}`}>
                          <Crown className={`w-14 h-14 ${config.crownColor} ${rank === 1 ? 'animate-bounce' : ''}`} />
                        </div>

                        {/* Avatar */}
                        <div className="relative mb-6">
                            <div className={`w-28 h-28 rounded-full border-[5px] overflow-hidden relative z-20 mx-auto transition-all duration-500 ${
                              isCurrentUser
                                ? 'leaderboard-current-top-avatar border-orange-400 shadow-[0_0_0_5px_rgba(249,115,22,0.28),0_15px_40px_rgba(0,0,0,0.4)]'
                                : 'border-white/90 shadow-[0_15px_40px_rgba(0,0,0,0.4)]'
                            }`}>
                              <img 
                                src={getAvatarUrl(actualPlayer.avatar_url || actualPlayer.avatar)} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                              />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white border-[4px] border-green-950 flex items-center justify-center text-xs font-black text-green-950 shadow-xl z-30">
                              #{rank}
                            </div>
                        </div>

                        {/* Info cluster */}
                        <div className="text-center z-20 flex flex-col items-center">
                           <div className="flex items-center justify-center gap-1.5 mb-2 max-w-36">
                             <h4 className="text-white font-black text-sm drop-shadow-lg truncate uppercase tracking-widest">{actualPlayer.display_name || 'Người chơi'}</h4>
                             {isCurrentUser && <span className="leaderboard-current-badge bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">Bạn</span>}
                           </div>
                           <div className={`${config.pillColor} text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center gap-2 border border-white/20 transition-all hover:scale-105`}>
                             {actualPlayer[activeScoreField]?.toLocaleString() || 0} <span className="opacity-60 text-[8px]">điểm</span>
                           </div>
                           <p className="text-white/40 text-[9px] font-black mt-2 uppercase tracking-widest truncate w-32">
                             {actualPlayer.school || actualPlayer.school_name || 'BioLearn Student'}
                           </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Player List (Rank 4+) - Premium Glass Cards */}
                <div className="space-y-4 mt-20 pb-20 px-1">
                  {activeScoreLeaderboard.map((player, index) => {
                    const rank = index + 1;
                    if (rank <= 3) return null;
                    
                    const p_id = player.id || player._id;
                    const isCurrentUser = isCurrentPlayer(player);

                    return (
                      <div
                        key={p_id || index}
                        className={`flex items-center gap-5 p-5 rounded-[2.5rem] shadow-2xl transition-all border-b-[6px] relative overflow-hidden group active:scale-[0.98] ${
                          isCurrentUser 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-orange-700 text-white' 
                            : 'bg-white/5 backdrop-blur-xl border-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        {isCurrentUser && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_60%)] from-white/20 to-transparent pointer-events-none" />
                        )}

                        {/* Rank Badge */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors shadow-inner ${
                          isCurrentUser ? 'bg-white/20 text-white' : 'bg-black/40 text-white/40 border border-white/5'
                        }`}>
                          {rank < 10 ? `0${rank}` : rank}
                        </div>

                        {/* Avatar */}
                        <div className="relative group">
                          <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden shadow-lg transform transition-transform group-hover:rotate-6 ${
                            isCurrentUser ? 'border-white/40' : 'border-white/10'
                          }`}>
                            <img 
                              src={getAvatarUrl(player.avatar_url || player.avatar)} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                            />
                          </div>
                        </div>

                        {/* User Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                             <p className={`font-black text-base truncate uppercase tracking-tight ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
                               {player.display_name || 'Người chơi'}
                             </p>
                             {isCurrentUser && <span className="bg-white/20 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Bạn</span>}
                          </div>
                          <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isCurrentUser ? 'text-white/60' : 'text-white/30'}`}>
                            {player.school || player.school_name || 'BioLearn Student'}
                          </p>
                        </div>

                        {/* Score Display - Bold and Clear */}
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                             <p className={`text-2xl font-black tracking-tighter ${isCurrentUser ? 'text-white' : 'text-[#B2EE55] drop-shadow-[0_0_10px_rgba(178,238,85,0.4)]'}`}>
                               {player[activeScoreField]?.toLocaleString() || 0}
                             </p>
                          </div>
                          <p className={`leaderboard-score-label text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isCurrentUser ? 'text-white/40' : 'text-white/20'}`}>
                            {activeScoreLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Battle Mode - Class Selection */}
        {activeTab === 'battle' && showClassSelect && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Swords className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white">Chọn lớp để đối kháng</h3>
              <p className="text-gray-400">Chọn lớp học của bạn để xem bảng xếp hạng và tìm đối thủ</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {classOptions.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => selectClass(cls.id)}
                  className="game-card hover:bg-white/20 transition-all text-left"
                >
                  <span className="text-3xl">{cls.icon}</span>
                  <p className="text-white font-bold mt-2">{cls.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Class Leaderboard Screen */}
        {activeTab === 'battle' && showClassLeaderboard && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={backToClassSelect}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {classOptions.find(c => c.id === selectedClass)?.icon} Bảng xếp hạng Lớp {selectedClass}
                </h3>
                <p className="text-gray-400 text-sm">Top 10 người chơi PvP</p>
              </div>
            </div>

            {loadingClassLeaderboard ? (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Đang tải bảng xếp hạng...</p>
              </div>
            ) : classLeaderboard.filter(p => (p.pvp_score || 0) > 0).length === 0 ? (
              <div className="text-center py-8 bg-white/10 rounded-xl">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-white font-semibold">Chưa có ai trong bảng xếp hạng</p>
                <p className="text-gray-400 text-sm">Hãy là người đầu tiên chiến thắng!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classLeaderboard.filter(p => (p.pvp_score || 0) > 0).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${player.id === (user?.id || user?.uid)
                        ? 'bg-purple-500/30 border border-purple-500/50'
                        : 'bg-white/10'
                      }`}
                  >
                    {/* Rank */}
                    {getMedalBadge(index + 1)}

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getAvatarUrl(player.avatar_url)} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                      />
                    </div>

                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{player.display_name || 'Người chơi'}</p>
                      <p className="text-purple-300 text-xs">{player.wins || 0} trận thắng</p>
                    </div>

                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">{player.pvp_score || 0}</p>
                      <p className="text-gray-400 text-xs">điểm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Start Button */}
            <div className="fixed bottom-6 left-4 right-4 max-w-4xl mx-auto">
              {cooldownNotice && <p className="mb-2 rounded-xl bg-red-500/90 px-4 py-2 text-center text-sm font-semibold text-white">{cooldownNotice}</p>}
              <button
                onClick={startMatchmaking}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30"
              >
                <Swords className="w-6 h-6" />
                Bắt đầu tìm đối thủ
              </button>
            </div>

            {/* Spacer for fixed button */}
            <div className="h-20"></div>
          </div>
        )}

        {/* Matchmaking Screen */}
        {showMatchmaking && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
              {/* VS Banner với 2 người chơi */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Người chơi - Bên trái */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-4 border-green-400 overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <img 
                      src={getAvatarUrl(userStats?.avatar_url)} 
                      alt="You" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                    />
                  </div>
                  <p className="text-white font-bold mt-2 text-sm truncate max-w-[80px]">
                    {userStats?.display_name || 'Bạn'}
                  </p>
                </div>

                {/* VS */}
                <div className={`text-2xl font-bold ${matchFound ? 'text-yellow-400 animate-pulse' : 'text-purple-300'}`}>
                  VS
                </div>

                {/* Đối thủ - Bên phải */}
                <div className="flex flex-col items-center">
                  {matchFound && opponent ? (
                    <>
                      <div className="w-20 h-20 rounded-full border-4 border-red-400 overflow-hidden bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                        <img 
                          src={getAvatarUrl(opponent.avatar_url)} 
                          alt="Opponent" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                        />
                      </div>
                      <p className="text-red-300 font-bold mt-2 text-sm truncate max-w-[80px]">
                        {opponent.display_name || 'Đối thủ'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full border-4 border-purple-400 overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex items-center justify-center">
                        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full"></div>
                      </div>
                      <p className="text-purple-300 font-bold mt-2 text-sm animate-pulse">
                        Đang tìm...
                      </p>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {matchFound ? '🎉 Đã tìm thấy đối thủ!' : 'Đang tìm đối thủ...'}
              </h3>
              <p className="text-purple-300 mb-4">Lớp {selectedClass}</p>

              {!matchFound && (
                <>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-mono text-2xl">{matchmakingTime}s / 30s</span>
                  </div>

                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full bg-purple-400 transition-all"
                      style={{ width: `${(matchmakingTime / 30) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelMatchmaking}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => { leaveQueue(); setShowMatchmaking(false); setShowBotSelect(true); }}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-400 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <Bot className="w-5 h-5" />
                      Chơi với BOT
                    </button>
                  </div>
                </>
              )}

              {matchFound && (
                <div className="bg-green-500/20 rounded-xl p-4">
                  <p className="text-green-300">Đang vào trận đấu...</p>
                </div>
              )}

              {/* Debug Log - hiển thị trạng thái realtime */}
              <div className="mt-4 bg-black/40 rounded-xl p-3 max-h-32 overflow-y-auto text-left border border-white/10">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Debug Log</p>
                {debugLog.length === 0 ? (
                  <p className="text-gray-600 text-xs">Đang kết nối...</p>
                ) : (
                  debugLog.map((log, i) => (
                    <p key={i} className={`text-[11px] font-mono leading-tight ${
                      log.includes('❌') ? 'text-red-400' : 
                      log.includes('✅') ? 'text-green-400' : 
                      log.includes('🏆') ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bot Difficulty Selection */}
        {showBotSelect && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
              <button
                onClick={() => { setShowBotSelect(false); setShowClassSelect(true); }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <Bot className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Chọn độ khó BOT</h3>
              <p className="text-green-300 mb-6">Lớp {selectedClass}</p>

              <div className="space-y-3">
                <button
                  onClick={() => startBotBattle('easy')}
                  className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-xl text-white font-semibold"
                >
                  🟢 Dễ
                </button>
                <button
                  onClick={() => startBotBattle('medium')}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-white font-semibold"
                >
                  🟡 Trung bình
                </button>
                <button
                  onClick={() => startBotBattle('hard')}
                  className="w-full py-4 bg-red-500 hover:bg-red-400 rounded-xl text-white font-semibold"
                >
                  🔴 Khó
                </button>
              </div>

              <button
                onClick={() => { setShowBotSelect(false); setShowClassSelect(true); }}
                className="mt-4 text-gray-400 hover:text-white"
              >
                ← Quay lại chọn lớp
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
