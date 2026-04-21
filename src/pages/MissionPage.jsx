import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Target, Gift, Check, Clock, 
  Star, Flame, Calendar, Trophy, Coins, Lock, Gamepad2, Timer, BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWeeklyCountdown } from '../hooks/useCountdown';
import BurningFlame from '../components/BurningFlame';

export default function MissionPage() {
  const navigate = useNavigate();
  const { user, userStats, updateStats, refreshUserStats } = useAuth();
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMilestones, setWeeklyMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTime, setActiveTime] = useState(0); // Thời gian hoạt động (giây)
  const timerRef = useRef(null);
  
  // Lấy userId để phân biệt session của mỗi user
  const userId = user?.uid || user?._id || user?.firebaseUid;

  // Đồng hồ đếm thời gian hoạt động - GẮN VỚI USER ID
  useEffect(() => {
    if (!userId) return;
    
    // Key riêng cho mỗi user
    const sessionKey = `sessionStartTime_${userId}`;
    
    // Load hoặc tạo mới session start time cho user này
    let savedStartTime = sessionStorage.getItem(sessionKey);
    
    // Nếu chưa có hoặc khác user -> reset
    if (!savedStartTime) {
      savedStartTime = Date.now().toString();
      sessionStorage.setItem(sessionKey, savedStartTime);
    }
    
    const startTime = parseInt(savedStartTime);
    
    // Clear timer cũ trước khi tạo mới
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setActiveTime(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId]); // Phụ thuộc vào userId để reset khi đổi user

  useEffect(() => {
    fetchMissions();
  }, [user]);

  const lastSavedMinute = useRef(0);

  // Update missions when activeTime changes
  useEffect(() => {
    const minutesActive = Math.floor(activeTime / 60);
    
    if (minutesActive > lastSavedMinute.current) {
      lastSavedMinute.current = minutesActive;
      
      const updateTimeProgress = async () => {
        try {
          const userId = user?.id || user?.uid;
          if (!userId) return;

          // Cập nhật mission3Progress (Học tập 20 phút) qua RPC để kích hoạt logic tính chuỗi
          await supabase.rpc('update_mission_progress', {
            p_user_id: userId,
            p_mission_id: 3,
            p_progress_gain: minutesActive,
            p_is_absolute: true
          });
            
          if (refreshUserStats) refreshUserStats();
        } catch (err) {
          console.error('Error updating time progress:', err);
        }
      };
      updateTimeProgress();
      fetchMissions();
    }
  }, [activeTime]);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      // Dữ liệu đã có sẵn trong userStats từ App.jsx
      const serverMissions = userStats?.daily_missions || {};
      const minutesActive = Math.floor(activeTime / 60);
      
      const missions = [
        { 
          id: 1, 
          title: 'Hoàn thành 1 trò chơi', 
          description: 'Hoàn thành 1 trò chơi bất kỳ', 
          reward: 50, 
          progress: serverMissions.mission1Progress || 0,
          target: 1,
          completed: serverMissions.mission1Completed || false, 
          claimed: serverMissions.mission1Claimed || false 
        },
        { 
          id: 2, 
          title: 'Hoàn thành 5 màn chơi', 
          description: 'Vượt qua 5 màn bất kỳ', 
          reward: 100, 
          progress: serverMissions.mission2Progress || 0, 
          target: 5, 
          completed: serverMissions.mission2Completed || false, 
          claimed: serverMissions.mission2Claimed || false 
        },
        { 
          id: 3, 
          title: 'Học tập 20 phút', 
          description: 'Học tập liên tục 20 phút', 
          reward: 150, 
          progress: Math.max(serverMissions.mission3Progress || 0, minutesActive),
          target: 20,
          completed: minutesActive >= 20 || serverMissions.mission3Completed || false, 
          claimed: serverMissions.mission3Claimed || false 
        },
      ];
      
      setDailyMissions(missions);
      
      // Weekly milestones (Giả lập vì Supabase profiles hiện chứa streak)
      setWeeklyMilestones([
        { id: 1, days: 3, title: '3 ngày liên tiếp', daysRequired: 3, reward: 100, claimed: serverMissions.claimed3Days || false },
        { id: 2, days: 5, title: '5 ngày liên tiếp', daysRequired: 5, reward: 200, claimed: serverMissions.claimed5Days || false },
        { id: 3, days: 7, title: '7 ngày liên tiếp', daysRequired: 7, reward: 500, claimed: serverMissions.claimed7Days || false },
      ]);
    } catch (err) {
      console.error('Error fetching missions:', err);
    }
    setLoading(false);
  };

  const claimDailyReward = async (missionId) => {
    try {
      const userId = user?.id || user?.uid;
      const mission = dailyMissions.find(m => m.id === missionId);
      if (!mission || !mission.completed || mission.claimed) return;

      const currentMissions = userStats?.daily_missions || {};
      const newCoins = (userStats?.coins || 0) + mission.reward;

      await supabase
        .from('profiles')
        .update({
          coins: newCoins,
          daily_missions: {
            ...currentMissions,
            [`mission${missionId}Claimed`]: true
          }
        })
        .eq('id', userId);

      if (refreshUserStats) refreshUserStats();
      fetchMissions();
    } catch (err) {
      console.error('Error claiming reward:', err);
    }
  };

  const claimWeeklyReward = async (milestoneId) => {
    try {
      const userId = user?.id || user?.uid;
      const milestone = weeklyMilestones.find(m => m.id === milestoneId);
      if (!milestone || milestone.claimed) return;

      const currentMissions = userStats?.daily_missions || {};
      const newCoins = (userStats?.coins || 0) + milestone.reward;

      await supabase
        .from('profiles')
        .update({
          coins: newCoins,
          daily_missions: {
            ...currentMissions,
            [`claimed${milestone.daysRequired}Days`]: true
          }
        })
        .eq('id', userId);

      if (refreshUserStats) refreshUserStats();
      fetchMissions();
    } catch (err) {
      console.error('Error claiming weekly reward:', err);
    }
  };

  // Format thời gian hoạt động
  const formatActiveTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Calculate time until reset (Use the new hook)
  const timeLeft = useWeeklyCountdown();
  const formatWeeklyTime = () => {
    return `${timeLeft.days}n ${timeLeft.hours}g ${timeLeft.minutes}p`;
  };

  const completedDaily = dailyMissions.filter(m => m.completed).length;

  // Get icon for mission
  const getMissionIcon = (missionId, completed) => {
    const iconClass = `w-7 h-7 ${completed ? 'text-green-400' : 'text-gray-400'}`;
    switch (missionId) {
      case 1:
        return <Gamepad2 className={iconClass} />;
      case 2:
        return <Target className={iconClass} />;
      case 3:
        return <BookOpen className={iconClass} />;
      default:
        return <Star className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen relative bg-transparent">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Nhiệm vụ
            </h1>

            {/* Đồng hồ thời gian hoạt động */}
            <div className="flex items-center gap-1 bg-green-600/50 px-3 py-1 rounded-lg">
              <Timer className="w-4 h-4 text-green-300" />
              <span className="text-white text-sm font-mono">{formatActiveTime(activeTime)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Summary */}
        <div className="game-card bg-gradient-to-r from-orange-600/30 to-red-600/30 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BurningFlame active={completedDaily === 3} size="md" />
              <div>
                <h2 className="text-xl font-bold text-white">Nhiệm vụ hàng ngày</h2>
                <p className="text-orange-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Mới sau: <span className="font-mono font-bold text-white">{formatWeeklyTime()}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{completedDaily}/3</p>
              <p className="text-gray-400 text-sm">hoàn thành</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-500"
              style={{ width: `${(completedDaily / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Daily Missions */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Nhiệm vụ ngày
          </h3>

          {dailyMissions.map((mission) => (
            <div 
              key={mission.id}
              className={`game-card flex items-center gap-4 ${
                mission.claimed ? 'opacity-60' : ''
              }`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                mission.completed 
                  ? 'bg-green-500/30' 
                  : 'bg-white/10'
              }`}>
                {getMissionIcon(mission.id, mission.completed)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="text-white font-semibold">{mission.title}</h4>
                <p className="text-gray-400 text-sm">{mission.description}</p>
                
                {/* Progress bar */}
                {mission.target && (
                  <div className="mt-2">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-400 transition-all"
                        style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {mission.id === 3 
                        ? `${mission.progress} / ${mission.target} phút` 
                        : `${mission.progress}/${mission.target}`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Reward / Claim button */}
              {mission.claimed ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm">Đã nhận</span>
                </div>
              ) : mission.completed ? (
                <button
                  onClick={() => claimDailyReward(mission.id)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-white font-semibold flex items-center gap-2 animate-pulse"
                >
                  <Gift className="w-5 h-5" />
                  +{mission.reward}
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded-xl">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-semibold">{mission.reward}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Weekly Streak Milestones */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Chuỗi ngày liên tiếp
          </h3>

          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/30 rounded-full flex items-center justify-center">
                <Flame className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Chuỗi hiện tại</p>
                <p className="text-orange-300 text-2xl font-bold">{userStats?.login_streak || 0} ngày</p>
              </div>
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="grid grid-cols-3 gap-4">
            {weeklyMilestones.map((milestone) => {
              const progress = Math.min(milestone.currentStreak || userStats?.login_streak || 0, milestone.daysRequired);
              const isCompleted = progress >= milestone.daysRequired;
              
              return (
                <div 
                  key={milestone.id}
                  className={`game-card text-center ${
                    milestone.claimed ? 'opacity-60' : ''
                  }`}
                >
                  {/* Days indicator */}
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                      : 'bg-white/10'
                  }`}>
                    {milestone.claimed ? (
                      <Check className="w-8 h-8 text-white" />
                    ) : isCompleted ? (
                      <Gift className="w-8 h-8 text-white animate-bounce" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">{milestone.daysRequired}</span>
                    )}
                  </div>

                  <h4 className="text-white font-semibold text-sm">{milestone.title}</h4>
                  
                  {/* Progress */}
                  <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${(progress / milestone.daysRequired) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{progress}/{milestone.daysRequired} ngày</p>

                  {/* Reward */}
                  {milestone.claimed ? (
                    <p className="text-green-400 text-sm mt-2">Đã nhận</p>
                  ) : isCompleted ? (
                    <button
                      onClick={() => claimWeeklyReward(milestone.id)}
                      className="mt-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-semibold"
                    >
                      +{milestone.reward} xu
                    </button>
                  ) : (
                    <p className="text-yellow-300 text-sm mt-2 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      {milestone.reward} xu
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <h4 className="text-blue-300 font-semibold mb-2">💡 Mẹo</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Hoàn thành 1 trò chơi bất kỳ để nhận 50 xu</li>
            <li>• Vượt qua 5 màn chơi để nhận 100 xu</li>
            <li>• Học tập liên tục 20 phút để nhận 150 xu</li>
            <li>• Chuỗi 7 ngày liên tiếp sẽ nhận thưởng lớn!</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
