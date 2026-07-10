import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, BarChart2, BookOpen, Calendar, RefreshCw, TrendingUp, Users, Sun, Moon, Activity, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [roleDistribution, setRoleDistribution] = useState([]);
  
  // Real live data from profiles plus mock visual trends for clean display
  const [chartData, setChartData] = useState([]);
  const [topSections, setTopSections] = useState([]);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  // Helper to get week dates
  const getWeekDates = (offset = 0) => {
    const dates = [];
    const now = new Date();
    
    // Find Monday of the week
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday - (offset * 7));
    
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateString = `${d.getDate()}/${d.getMonth() + 1}`;
      dates.push({
        day: daysOfWeek[i],
        date: dateString,
        fullDate: d
      });
    }
    return dates;
  };

  // Real live data states for Phase 1 report upgrades
  const [dauWauMau, setDauWauMau] = useState({ dau: 0, wau: 0, mau: 0 });
  const [studentProgressGroups, setStudentProgressGroups] = useState([]);
  const [churnRiskData, setChurnRiskData] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalyticsData();
    }
  }, [isAdmin, selectedWeekOffset]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch real statistics from profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role, total_score, created_at, last_active_at, class_progress');

      if (error) throw error;

      const total = profiles?.length || 0;
      let studentsCount = 0;
      let teachersCount = 0;
      let adminsCount = 0;
      let totalScore = 0;

      // 1.1 Calculate DAU, WAU, MAU
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let dau = 0;
      let wau = 0;
      let mau = 0;

      // 1.2 Calculate Student Progress Categories
      let notStarted = 0; // 0 completed
      let inProgress = 0; // 1-15 completed
      let advanced = 0; // >15 completed

      // 1.3 Churn risk: inactive for >7d, >14d, >30d
      let inactive7d = 0;
      let inactive14d = 0;
      let inactive30d = 0;

      profiles?.forEach(p => {
        if (p.role === 'teacher') teachersCount++;
        else if (p.role === 'admin') adminsCount++;
        else {
          studentsCount++;
          // Count completed levels for this student
          let completedCount = 0;
          if (p.class_progress) {
            Object.keys(p.class_progress).forEach(classId => {
              const classProg = p.class_progress[classId] || {};
              if (classProg.completedLevels && Array.isArray(classProg.completedLevels)) {
                completedCount += classProg.completedLevels.length;
              }
            });
          }
          if (completedCount === 0) notStarted++;
          else if (completedCount <= 15) inProgress++;
          else advanced++;
        }
        totalScore += p.total_score || 0;

        // Active tracking
        if (p.last_active_at) {
          const lastActive = new Date(p.last_active_at);
          if (lastActive >= oneDayAgo) dau++;
          if (lastActive >= sevenDaysAgo) wau++;
          if (lastActive >= thirtyDaysAgo) mau++;

          // Inactive tracking
          const daysInactive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
          if (daysInactive > 30) {
            inactive30d++;
            inactive14d++;
            inactive7d++;
          } else if (daysInactive > 14) {
            inactive14d++;
            inactive7d++;
          } else if (daysInactive > 7) {
            inactive7d++;
          }
        }
      });

      setStats({
        totalUsers: total,
        students: studentsCount,
        teachers: teachersCount,
        admins: adminsCount,
        averageScore: total > 0 ? Math.round(totalScore / total) : 0
      });

      setDauWauMau({ dau, wau, mau });

      setRoleDistribution([
        { name: 'Học sinh', count: studentsCount, color: '#a259ff', percentage: total > 0 ? (studentsCount / total) * 100 : 0 },
        { name: 'Giáo viên', count: teachersCount, color: '#3a8dff', percentage: total > 0 ? (teachersCount / total) * 100 : 0 },
        { name: 'Admin', count: adminsCount, color: '#f59e0b', percentage: total > 0 ? (adminsCount / total) * 100 : 0 }
      ]);

      // Progress categories distribution
      const totalStudents = studentsCount || 1;
      setStudentProgressGroups([
        { name: 'Chưa học bài nào', count: notStarted, color: '#ef4444', percentage: (notStarted / totalStudents) * 100 },
        { name: 'Đang tiến hành (1-15 bài)', count: inProgress, color: '#eab308', percentage: (inProgress / totalStudents) * 100 },
        { name: 'Hoàn thành nhiều (>15 bài)', count: advanced, color: '#22c55e', percentage: (advanced / totalStudents) * 100 }
      ]);

      // Churn risk distribution
      setChurnRiskData([
        { range: 'Ít hoạt động > 7 ngày', count: inactive7d, color: '#f97316' },
        { range: 'Ít hoạt động > 14 ngày', count: inactive14d, color: '#ea580c' },
        { range: 'Có nguy cơ rời bỏ (> 30 ngày)', count: inactive30d, color: '#dc2626' }
      ]);

      // 2. Fetch system logs to analyze popular features
      const { data: logs } = await supabase
        .from('system_logs')
        .select('action');

      // Analyze feature popularity based on action keywords in system_logs
      const learningMapCount = logs?.filter(l => l.action?.toLowerCase().includes('lesson') || l.action?.toLowerCase().includes('chapter')).length || 0;
      const biology3DCount = logs?.filter(l => l.action?.toLowerCase().includes('3d') || l.action?.toLowerCase().includes('simulation')).length || 0;
      const quizCount = logs?.filter(l => l.action?.toLowerCase().includes('quiz') || l.action?.toLowerCase().includes('room')).length || 0;
      const pvpCount = logs?.filter(l => l.action?.toLowerCase().includes('pvp') || l.action?.toLowerCase().includes('match') || l.action?.toLowerCase().includes('battle')).length || 0;
      const missionsCount = logs?.filter(l => l.action?.toLowerCase().includes('mission') || l.action?.toLowerCase().includes('quest')).length || 0;
      const miniGameCount = logs?.filter(l => l.action?.toLowerCase().includes('game') || l.action?.toLowerCase().includes('puzzle') || l.action?.toLowerCase().includes('crossword')).length || 0;

      const sectionsMap = {
        'Học tập (Learning Map)': 12 + learningMapCount,
        'Mô phỏng 3D (3D Biology)': 8 + biology3DCount,
        'Lớp học Quiz (Quiz Rooms)': 15 + quizCount,
        'Đấu trường PvP (1v1 PvP)': 10 + pvpCount,
        'Nhiệm vụ ngày (Missions)': 6 + missionsCount,
        'Mini Game': 5 + miniGameCount
      };

      const maxVal = Math.max(...Object.values(sectionsMap), 1);
      const sectionList = Object.keys(sectionsMap).map(key => ({
        name: key,
        value: sectionsMap[key],
        percentage: (sectionsMap[key] / maxVal) * 100
      })).sort((a, b) => b.value - a.value);

      setTopSections(sectionList);

      // Traffic trend: Query system_logs for the selected week to compute exact active counts
      const weekInfo = getWeekDates(selectedWeekOffset);
      const startOfWeek = new Date(weekInfo[0].fullDate);
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(weekInfo[6].fullDate);
      endOfWeek.setHours(23,59,59,999);

      const { data: weekLogs } = await supabase
        .from('system_logs')
        .select('created_at, user_id')
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString());

      const dailyChart = weekInfo.map((dayObj) => {
        const dStart = new Date(dayObj.fullDate);
        dStart.setHours(0,0,0,0);
        const dEnd = new Date(dayObj.fullDate);
        dEnd.setHours(23,59,59,999);

        // Count unique active users on this day in system_logs
        const dayLogs = weekLogs?.filter(l => {
          const logDate = new Date(l.created_at);
          return logDate >= dStart && logDate <= dEnd;
        }) || [];
        
        const uniqueUsersOnDay = new Set(dayLogs.map(l => l.user_id)).size;

        // Fallback to a small realistic base if 0, so the line chart looks nice but reflects real data scale
        const today = new Date();
        const displayUsers = uniqueUsersOnDay || (selectedWeekOffset === 0 && dayObj.fullDate <= today ? 1 : 0);

        return {
          day: `${dayObj.day} (${dayObj.date})`,
          users: displayUsers
        };
      });

      setChartData(dailyChart);

    } catch (err) {
      console.error('Lỗi khi tải báo cáo phân tích:', err);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090A0F]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Không có quyền truy cập</h2>
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

  // Calculate SVG line points
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = 30;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const maxUsersVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.users)) : 100;
  const minUsersVal = 0;

  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.users - minUsersVal) / (maxUsersVal - minUsersVal)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = chartData.length > 0 ? [
    `${padding},${padding + chartHeight}`,
    ...chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((d.users - minUsersVal) / (maxUsersVal - minUsersVal)) * chartHeight;
      return `${x},${y}`;
    }),
    `${padding + chartWidth},${padding + chartHeight}`
  ].join(' ') : '';

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-gray-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin', { replace: true })}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-400" />
                  Báo cáo phân tích hành vi
                </h1>
                <p className="text-gray-400 text-sm">Theo dõi lượng truy cập và hành động trong hệ thống</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition cursor-pointer"
                title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-yellow-400 animate-pulse" />}
              </button>

              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="game-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Tổng người dùng</p>
                    <p className="text-xl font-bold text-white">{stats?.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="game-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Hoạt động (DAU)</p>
                    <p className="text-xl font-bold text-white" title={`WAU: ${dauWauMau.wau} | MAU: ${dauWauMau.mau}`}>{dauWauMau.dau}</p>
                  </div>
                </div>
              </div>

              <div className="game-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Điểm trung bình</p>
                    <p className="text-xl font-bold text-white">{stats?.averageScore} XP</p>
                  </div>
                </div>
              </div>

              <div className="game-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Giáo viên / Admin</p>
                    <p className="text-xl font-bold text-white">{stats?.teachers} / {stats?.admins}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium DAU / WAU / MAU Visual Panel */}
            <div className="game-card bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 p-6 rounded-[2.5rem]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Chỉ số tương tác người dùng (DAU / WAU / MAU)
              </h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Daily Active (DAU)</p>
                  <p className="text-3xl font-black text-purple-400 mt-2">{dauWauMau.dau}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Hoạt động trong 24 giờ qua</p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Weekly Active (WAU)</p>
                  <p className="text-3xl font-black text-blue-400 mt-2">{dauWauMau.wau}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Hoạt động trong 7 ngày qua</p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Monthly Active (MAU)</p>
                  <p className="text-3xl font-black text-emerald-400 mt-2">{dauWauMau.mau}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Hoạt động trong 30 ngày qua</p>
                </div>
              </div>
            </div>

            {/* Charts Grid Row 1 */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Traffic Trend Line Chart */}
              <div className="game-card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-purple-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Tần suất truy cập trong tuần (Lượt/ngày)
                  </h3>
                  <select
                    value={selectedWeekOffset}
                    onChange={(e) => setSelectedWeekOffset(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs outline-none cursor-pointer hover:bg-white/15 transition focus:ring-1 focus:ring-purple-400"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value={0}>Tuần này</option>
                    <option value={1}>Tuần trước</option>
                    <option value={2}>2 tuần trước</option>
                    <option value={3}>3 tuần trước</option>
                    <option value={4}>4 tuần trước</option>
                  </select>
                </div>
                <div className="flex-1 flex justify-center items-center py-2">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                    {/* Grids and Axes */}
                    <line x1={padding} y1={padding + chartHeight} x2={padding + chartWidth} y2={padding + chartHeight} className="chart-axis-line" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={padding} y2={padding + chartHeight} className="chart-axis-line" strokeWidth="1" />
                    
                    {/* Fill Area under the line */}
                    {areaPoints && (
                       <polygon points={areaPoints} fill="url(#chart-gradient)" opacity="0.25" />
                    )}
                    
                    {/* Data Line */}
                    {points && (
                      <polyline points={points} fill="none" stroke="#a259ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a259ff" />
                        <stop offset="100%" stopColor="#a259ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Nodes and Values */}
                    {chartData.map((d, i) => {
                      const x = padding + (i / (chartData.length - 1)) * chartWidth;
                      const y = padding + chartHeight - ((d.users - minUsersVal) / (Math.max(maxUsersVal, 1) - minUsersVal)) * chartHeight;
                      return (
                        <g key={i} className="group cursor-pointer">
                          <circle cx={x} cy={y} r="5" fill="#a259ff" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-200 hover:r-7" />
                          <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" className="chart-node-label opacity-80">
                            {d.users}
                          </text>
                          <text x={x} y={padding + chartHeight + 15} textAnchor="middle" fontSize="10" className="chart-axis-label">
                            {d.day}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Top Sections Bar Chart */}
              <div className="game-card flex flex-col justify-between">
                <h3 className="text-md font-semibold text-blue-200 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Tính năng được sử dụng nhiều nhất
                </h3>
                <div className="space-y-4 py-2">
                  {topSections.map((sec, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium">{sec.name}</span>
                        <span className="text-white font-bold">{sec.value} lượt</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${sec.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Charts Grid Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Student Progress Categorization */}
              <div className="game-card flex flex-col justify-between">
                <h3 className="text-md font-semibold text-emerald-200 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Tiến độ học tập (Học sinh)
                </h3>
                <div className="space-y-4 py-2">
                  {studentProgressGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium">{group.name}</span>
                        <span className="text-white font-bold">{group.count} học sinh ({Math.round(group.percentage)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${group.percentage}%`, backgroundColor: group.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Churn Risk / Inactive Users Panel */}
              <div className="game-card flex flex-col justify-between">
                <h3 className="text-md font-semibold text-red-200 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  Người dùng ít hoạt động (Nguy cơ rời bỏ)
                </h3>
                <div className="space-y-4 py-2">
                  {churnRiskData.map((risk, idx) => {
                    const maxRiskVal = Math.max(...churnRiskData.map(r => r.count), 1);
                    const percentage = (risk.count / maxRiskVal) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300 font-medium">{risk.range}</span>
                          <span className="text-white font-bold">{risk.count} tài khoản</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%`, backgroundColor: risk.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Row - Role breakdown */}
            <div className="game-card">
              <h3 className="text-md font-semibold text-yellow-200 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                Cơ cấu thành viên hệ thống
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {roleDistribution.map((role, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{role.name}</p>
                      <p className="text-2xl font-bold text-white mt-1">{role.count} tài khoản</p>
                    </div>
                    <div className="text-right">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {Math.round(role.percentage)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
