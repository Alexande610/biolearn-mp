import { useState, useEffect, useRef } from 'react';
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

// Hàm lấy URL avatar từ ID hoặc URL
const getAvatarUrl = (avatarData) => {
  if (!avatarData) return '/images/Avatar/adventurer-1.png';
  if (avatarData.startsWith('http')) return avatarData;
  return avatarMap[avatarData] || '/images/Avatar/adventurer-1.png';
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userStats } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const timeLeft = useWeeklyCountdown();

  // Battle states
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [showBotSelect, setShowBotSelect] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [battleMode, setBattleMode] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
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

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // MATCHMAKING: Hybrid (Realtime Presence + DB Polling fallback)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    let channel = null;
    let timer = null;
    let pollInterval = null;
    let navigating = false;

    if (showMatchmaking) {
      const currentUserId = user?.id || user?.uid;
      if (!currentUserId) return;

      const myDisplayName = userStats?.display_name || 'Người chơi';
      const myAvatarUrl = userStats?.avatar_url || null;

      addDebug(`🚀 Bắt đầu tìm trận lớp ${selectedClass} (ID: ${currentUserId.substring(0,8)}...)`);

      // ── Hàm navigate vào phòng (dùng chung cho Presence lẫn DB path) ──
      const goToRoom = (roomId, oppId, oppName, oppAvatar, source) => {
        if (navigating || matchFoundRef.current) return;
        navigating = true;
        matchFoundRef.current = true;
        setMatchFound(true);
        setOpponent({ id: oppId, display_name: oppName, avatar_url: oppAvatar });
        addDebug(`✅ Ghép trận thành công qua ${source}! Phòng: ${roomId.substring(0,20)}...`);
        setTimeout(() => {
          navigate(`/battle-pvp?room=${roomId}&class=${selectedClass}`, { replace: true });
        }, 800);
      };

      // ══════════════════════════════════════════
      // PATH 1: SUPABASE REALTIME PRESENCE
      // ══════════════════════════════════════════
      try {
        channel = supabase.channel(`matchmake-class-${selectedClass}`, {
          config: {
            presence: { key: currentUserId },
            broadcast: { self: false }
          }
        });

        // Lắng nghe broadcast "match-ready" từ Host
        channel
          .on('broadcast', { event: 'match-ready' }, ({ payload }) => {
            if (payload.guestId !== currentUserId) return;
            addDebug(`📡 Nhận broadcast match-ready từ Host`);
            goToRoom(payload.roomId, payload.hostId, payload.hostName, payload.hostAvatar, 'Broadcast');
          })
          // Presence sync: phát hiện khi có ≥2 người
          .on('presence', { event: 'sync' }, () => {
            if (navigating || matchFoundRef.current) return;

            const state = channel.presenceState();
            const players = [];
            Object.entries(state).forEach(([key, presences]) => {
              if (presences && presences.length > 0) {
                players.push({ id: key, ...presences[0] });
              }
            });

            addDebug(`👥 Presence sync: ${players.length} người`);

            if (players.length < 2) return;

            const opp = players.find(p => p.id !== currentUserId);
            if (!opp) return;

            setOpponent({
              id: opp.id,
              display_name: opp.display_name || 'Đối thủ',
              avatar_url: opp.avatar_url
            });

            // Host = user có ID nhỏ nhất
            const sortedIds = players.map(p => p.id).sort();
            if (sortedIds[0] === currentUserId) {
              // HOST: broadcast room rồi navigate
              const ids = [currentUserId, opp.id].sort();
              const roomId = `pvp_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}_${Date.now().toString(36)}`;
              
              addDebug(`🏆 Host: Tạo phòng, broadcast cho Guest`);
              
              channel.send({
                type: 'broadcast',
                event: 'match-ready',
                payload: { roomId, hostId: currentUserId, hostName: myDisplayName, hostAvatar: myAvatarUrl, guestId: opp.id }
              });

              // Host cũng ghi vào DB để Guest fallback polling có thể tìm thấy
              supabase.from('pvp_queues').update({ match_room_id: roomId, match_opponent_id: currentUserId }).eq('user_id', opp.id);
              supabase.from('pvp_queues').update({ match_room_id: roomId, match_opponent_id: opp.id }).eq('user_id', currentUserId);

              goToRoom(roomId, opp.id, opp.display_name, opp.avatar_url, 'Presence');
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            addDebug(`🟢 Join: ${newPresences?.[0]?.display_name || key.substring(0,8)}`);
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            addDebug(`🔴 Leave: ${key.substring(0,8)}`);
          })
          .subscribe(async (status) => {
            addDebug(`📶 Channel: ${status}`);
            if (status === 'SUBSCRIBED') {
              const trackResult = await channel.track({
                display_name: myDisplayName,
                avatar_url: myAvatarUrl,
                joined_at: new Date().toISOString()
              });
              addDebug(`📍 Track presence: ${trackResult}`);
            }
          });
      } catch (err) {
        addDebug(`❌ Lỗi tạo channel: ${err.message}`);
      }

      // ══════════════════════════════════════════
      // PATH 2: DB POLLING FALLBACK
      // ══════════════════════════════════════════
      // Insert vào pvp_queues để fallback polling hoạt động
      const setupDbFallback = async () => {
        // Xóa entry cũ
        await supabase.from('pvp_queues').delete().eq('user_id', currentUserId);

        // Insert mới
        const { error: insertErr } = await supabase.from('pvp_queues').insert({
          user_id: currentUserId,
          class_id: selectedClass,
          display_name: myDisplayName,
          avatar_url: myAvatarUrl
        });

        if (insertErr) {
          addDebug(`❌ DB insert lỗi: ${insertErr.message}`);
        } else {
          addDebug(`💾 DB: Đã vào hàng chờ`);
        }

        // Bắt đầu polling mỗi 2s
        pollInterval = setInterval(async () => {
          if (navigating || matchFoundRef.current) return;

          try {
            // A. Kiểm tra row mình có được ghi signal chưa
            const { data: myRow } = await supabase
              .from('pvp_queues')
              .select('match_room_id, match_opponent_id')
              .eq('user_id', currentUserId)
              .single();

            if (myRow?.match_room_id) {
              const oppId = myRow.match_opponent_id;
              const { data: oppData } = await supabase
                .from('pvp_queues')
                .select('display_name, avatar_url')
                .eq('user_id', oppId)
                .single();
              
              addDebug(`🔍 DB Poll: Tìm thấy signal! Room: ${myRow.match_room_id.substring(0,20)}`);
              goToRoom(myRow.match_room_id, oppId, oppData?.display_name || 'Đối thủ', oppData?.avatar_url, 'DB-Poll');
              return;
            }

            // B. Tìm đối thủ (chỉ người có ID nhỏ hơn mới tạo phòng)
            const { data: opponents, error: findErr } = await supabase
              .from('pvp_queues')
              .select('*')
              .eq('class_id', selectedClass)
              .neq('user_id', currentUserId)
              .is('match_room_id', null)
              .limit(1);

            if (findErr) {
              addDebug(`❌ DB Poll lỗi: ${findErr.message}`);
              return;
            }

            if (opponents && opponents.length > 0) {
              const opp = opponents[0];
              addDebug(`🔍 DB Poll: Thấy đối thủ ${opp.display_name}`);

              setOpponent({
                id: opp.user_id,
                display_name: opp.display_name,
                avatar_url: opp.avatar_url
              });

              // Chỉ người có ID nhỏ hơn mới tạo phòng (tránh race condition)
              if (currentUserId < opp.user_id) {
                const ids = [currentUserId, opp.user_id].sort();
                const roomId = `pvp_${ids[0].substring(0, 8)}_${ids[1].substring(0, 8)}_${Date.now().toString(36)}`;

                addDebug(`🏆 DB Host: Tạo phòng ${roomId.substring(0,20)}`);

                // Ghi signal vào row đối thủ VÀ row mình
                await supabase.from('pvp_queues').update({ match_room_id: roomId, match_opponent_id: currentUserId }).eq('user_id', opp.user_id);
                await supabase.from('pvp_queues').update({ match_room_id: roomId, match_opponent_id: opp.user_id }).eq('user_id', currentUserId);

                // Cũng broadcast qua Realtime
                if (channel) {
                  channel.send({
                    type: 'broadcast', event: 'match-ready',
                    payload: { roomId, hostId: currentUserId, hostName: myDisplayName, hostAvatar: myAvatarUrl, guestId: opp.user_id }
                  });
                }

                goToRoom(roomId, opp.user_id, opp.display_name, opp.avatar_url, 'DB-Host');
              } else {
                addDebug(`⏳ DB Guest: Đợi đối thủ tạo phòng...`);
              }
            }
          } catch (err) {
            addDebug(`❌ Poll error: ${err.message}`);
          }
        }, 2000);
      };

      setupDbFallback();

      // ── Timer đếm giờ (timeout 30s → chuyển sang BOT) ──
      timer = setInterval(() => {
        setMatchmakingTime(prev => {
          if (prev >= 30) {
            clearInterval(timer);
            setShowMatchmaking(false);
            setShowBotSelect(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    // ── Cleanup ──
    return () => {
      if (timer) clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
        channel = null;
      }
      // Xóa khỏi hàng chờ DB nếu chưa match
      if (!matchFoundRef.current) {
        const userId = user?.id || user?.uid;
        if (userId) supabase.from('pvp_queues').delete().eq('user_id', userId);
      }
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

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .gt('weekly_score', 0)
        .order('weekly_score', { ascending: false })
        .limit(50);

      if (!error && data) {
        setWeeklyLeaderboard(data);

        // Find user rank
        const userId = user?.id || user?.uid;
        const userIndex = data.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          setUserRank({
            rank: userIndex + 1,
            ...data[userIndex]
          });
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
    setLoading(false);
  };

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
    }
  }, [location.state]);

  // Chọn lớp - hiển thị bảng xếp hạng trước khi bắt đầu
  const selectClass = async (classId) => {
    setSelectedClass(classId);
    setShowClassSelect(false);
    setShowClassLeaderboard(true);
    setLoadingClassLeaderboard(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('last_class_id', String(classId))
        .gt('pvp_score', 0)
        .order('pvp_score', { ascending: false })
        .limit(10);

      if (!error && data) {
        setClassLeaderboard(data);
      }
    } catch (err) {
      console.error('Error fetching class leaderboard:', err);
      setClassLeaderboard([]);
    }
    setLoadingClassLeaderboard(false);
  };

  const startMatchmaking = (classId) => {
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
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-3.5 px-6 rounded-[1.75rem] font-black text-sm transition-all relative overflow-hidden ${
              activeTab === 'weekly' 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-[0_4px_15px_rgba(245,158,11,0.4)]' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            TUẦN NÀY
          </button>
          <button 
            onClick={() => {
              setActiveTab('battle');
              setShowClassSelect(true);
            }}
            className={`flex-1 py-3.5 px-6 rounded-[1.75rem] font-black text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'battle' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-[0_4px_15px_rgba(147,51,234,0.4)]' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Swords className="w-4 h-4" />
            ĐỐI KHÁNG
          </button>
        </div>

        {/* Weekly Countdown - Hình 3 Style Refined */}
        <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 mb-12 flex items-center gap-5 border border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-inner border border-blue-400/20">
            <Clock className="w-7 h-7 text-blue-300" />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.25em] mb-1.5">Sự kiện kết thúc sau</p>
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

        {/* Leaderboard Content */}
        {activeTab === 'weekly' && (
          <div className="space-y-12">
            {weeklyLeaderboard.length === 0 ? (
              <div className="text-center py-24 bg-white/5 border border-white/5 rounded-[3rem] shadow-2xl">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Trophy className="w-12 h-12 text-white/10" />
                </div>
                <h3 className="text-2xl font-black text-white/80">Chưa có bảng xếp hạng</h3>
                <p className="text-white/30 font-bold mt-2">Bắt đầu học ngay để xuất hiện tại đây!</p>
              </div>
            ) : (
              <>
                {/* Top 10 Label Pill - Beautifully refined */}
                <div className="flex justify-center -mb-4 relative z-20">
                   <div className="bg-[#B2EE55] text-[#062013] px-12 py-3 rounded-full font-black text-xs shadow-[0_10px_25px_rgba(178,238,85,0.3)] border-[3px] border-[#062013] uppercase tracking-[0.2em] flex items-center gap-3">
                     <Star className="w-3.5 h-3.5 fill-current" />
                     Top 10 - Tất cả
                     <Star className="w-3.5 h-3.5 fill-current" />
                   </div>
                </div>

                {/* Top 3 Vertical Layout (Without Podium) */}
                <div className="flex items-center justify-center gap-6 md:gap-14 mb-16 mt-16 px-2 relative">
                  {[1, 0, 2].map((actualIndex) => {
                    const actualPlayer = weeklyLeaderboard[actualIndex];
                    if (!actualPlayer) return <div key={`empty-${actualIndex}`} className="flex-1" />;
                    
                    const rank = actualIndex + 1;
                    const configs = {
                      1: { 
                        scale: 'scale-90 translate-y-4', 
                        pillColor: 'bg-emerald-500',
                        crown: false 
                      },
                      0: { 
                        scale: 'scale-110 -translate-y-4', 
                        pillColor: 'bg-yellow-500',
                        crown: true 
                      },
                      2: { 
                        scale: 'scale-75 translate-y-8', 
                        pillColor: 'bg-orange-500',
                        crown: false 
                      }
                    };
                    const config = configs[actualIndex];

                    return (
                      <div key={actualPlayer.id || actualIndex} className={`flex flex-col items-center flex-1 transition-all duration-1000 ${config.scale} relative z-10`}>
                        {/* Status for Rank 1 */}
                        {config.crown && (
                          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40">
                             <Crown className="w-14 h-14 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-bounce" />
                          </div>
                        )}

                        {/* Avatar */}
                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full border-[5px] border-white/90 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative z-20 mx-auto transition-transform duration-500">
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
                           <h4 className="text-white font-black text-sm drop-shadow-lg mb-2 truncate w-28 uppercase tracking-widest">{actualPlayer.display_name || 'Người chơi'}</h4>
                           <div className={`${config.pillColor} text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center gap-2 border border-white/20 transition-all hover:scale-105`}>
                             {actualPlayer.weekly_score?.toLocaleString() || 0} <span className="opacity-60 text-[8px]">XP</span>
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
                  {weeklyLeaderboard.map((player, index) => {
                    const rank = index + 1;
                    if (rank <= 3) return null;
                    
                    const p_id = player.id || player._id;
                    const u_id = user?.id || user?.uid;
                    const isCurrentUser = p_id === u_id && u_id;

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
                               {player.weekly_score?.toLocaleString() || 0}
                             </p>
                          </div>
                          <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isCurrentUser ? 'text-white/40' : 'text-white/20'}`}>
                            Điểm XP
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
                {classLeaderboard.filter(p => (p.total_score || 0) > 0).map((player, index) => (
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
                      <p className="text-yellow-400 font-bold">{player.total_score || 0}</p>
                      <p className="text-gray-400 text-xs">điểm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Start Button */}
            <div className="fixed bottom-6 left-4 right-4 max-w-4xl mx-auto">
              <button
                onClick={() => startMatchmaking(selectedClass)}
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
