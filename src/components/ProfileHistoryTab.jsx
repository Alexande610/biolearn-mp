import { createElement, useEffect, useState } from 'react';
import {
  Activity, BarChart3, BookOpenCheck, ChevronDown, Clock3, RefreshCw,
  Swords, Target, TrendingUp, Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;
const EMPTY_PERFORMANCE = {
  pvp_total: 0,
  pvp_wins: 0,
  pvp_losses: 0,
  pvp_draws: 0,
  pvp_win_rate: 0,
  pvp_average_score: 0,
  quiz_completed: 0,
  quiz_average_score: 0,
  quiz_best_score: 0,
  quiz_correct_answers: 0,
  quiz_answered: 0,
  quiz_accuracy: 0,
  quiz_average_response_ms: 0
};

const asList = (value) => Array.isArray(value) ? value : [];
const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) : 0;
const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatPercent = (value) => `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Chưa hoàn thành';
const formatDuration = (milliseconds) => {
  const value = Number(milliseconds || 0);
  if (!value) return '—';
  return value < 1000 ? `${value} ms` : `${(value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giây`;
};

const resultMeta = {
  win: { label: 'Thắng', className: 'history-result-win' },
  loss: { label: 'Thua', className: 'history-result-loss' },
  draw: { label: 'Hòa', className: 'history-result-draw' }
};

async function loadCompatibleHistory(userId) {
  const [pvpResult, quizResult] = await Promise.all([
    supabase
      .from('pvp_matches')
      .select('id,room_id,player1_id,player2_id,winner_id,player1_score,player2_score,class_id,status,questions_played,quitter_id,finished_at,created_at,player1:player1_id(display_name,avatar_url),player2:player2_id(display_name,avatar_url)')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('quiz_attempts')
      .select('id,room_id,status,score,correct_count,started_at,completed_at')
      .eq('student_id', userId)
      .order('started_at', { ascending: false })
      .limit(50)
  ]);

  if (pvpResult.error) throw pvpResult.error;
  if (quizResult.error) throw quizResult.error;

  const rawQuiz = quizResult.data || [];
  const attemptIds = rawQuiz.map(item => item.id);
  let answers = [];
  if (attemptIds.length > 0) {
    const answerResult = await supabase
      .from('quiz_answers')
      .select('attempt_id,response_ms')
      .in('attempt_id', attemptIds);
    if (answerResult.error) throw answerResult.error;
    answers = answerResult.data || [];
  }

  const pvp = (pvpResult.data || []).filter(match => match.status !== 'playing').map(match => {
    const isPlayer1 = match.player1_id === userId;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    return {
      id: match.id,
      room_id: match.room_id,
      class_id: match.class_id,
      status: match.status,
      questions_played: match.questions_played || 0,
      played_at: match.finished_at || match.created_at,
      my_score: isPlayer1 ? match.player1_score || 0 : match.player2_score || 0,
      opponent_score: isPlayer1 ? match.player2_score || 0 : match.player1_score || 0,
      opponent_name: opponent?.display_name || 'Đối thủ',
      opponent_avatar: opponent?.avatar_url,
      result: match.winner_id === userId || (match.winner_id == null && match.quitter_id && match.quitter_id !== userId)
        ? 'win'
        : match.winner_id == null && !match.quitter_id ? 'draw' : 'loss',
      did_quit: match.quitter_id === userId,
      opponent_quit: Boolean(match.quitter_id && match.quitter_id !== userId)
    };
  });

  const quiz = rawQuiz.map(attempt => {
    const attemptAnswers = answers.filter(answer => answer.attempt_id === attempt.id);
    return {
      ...attempt,
      title: 'Bài Quiz Sinh học',
      teacher_name: 'Giáo viên',
      room_type: 'live',
      answered_count: attemptAnswers.length,
      average_response_ms: average(attemptAnswers.map(answer => answer.response_ms))
    };
  });

  const completedQuiz = quiz.filter(item => item.status === 'completed');
  const completedAnswers = completedQuiz.reduce((sum, item) => sum + item.answered_count, 0);
  const correctAnswers = completedQuiz.reduce((sum, item) => sum + Number(item.correct_count || 0), 0);
  const wins = pvp.filter(item => item.result === 'win').length;
  const losses = pvp.filter(item => item.result === 'loss').length;
  const draws = pvp.filter(item => item.result === 'draw').length;

  return {
    performance: {
      ...EMPTY_PERFORMANCE,
      pvp_total: pvp.length,
      pvp_wins: wins,
      pvp_losses: losses,
      pvp_draws: draws,
      pvp_win_rate: pvp.length ? wins * 100 / pvp.length : 0,
      pvp_average_score: average(pvp.map(item => item.my_score)),
      quiz_completed: completedQuiz.length,
      quiz_average_score: average(completedQuiz.map(item => item.score)),
      quiz_best_score: completedQuiz.length ? Math.max(...completedQuiz.map(item => Number(item.score || 0))) : 0,
      quiz_correct_answers: correctAnswers,
      quiz_answered: completedAnswers,
      quiz_accuracy: completedAnswers ? correctAnswers * 100 / completedAnswers : 0,
      quiz_average_response_ms: average(completedQuiz.map(item => item.average_response_ms).filter(Boolean))
    },
    pvp,
    quiz
  };
}

function OverviewCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className={`profile-history-overview-card ${tone}`}>
      <span className="profile-history-overview-icon">{createElement(Icon, { className: 'w-5 h-5' })}</span>
      <div>
        <p className="profile-history-label">{label}</p>
        <p className="profile-history-value">{value}</p>
        <p className="profile-history-detail">{detail}</p>
      </div>
    </div>
  );
}

function EmptyHistory({ type }) {
  const Icon = type === 'pvp' ? Swords : BookOpenCheck;
  return (
    <div className="profile-history-empty">
      <Icon className="w-10 h-10" />
      <p>Chưa có lịch sử {type === 'pvp' ? 'PvP' : 'Quiz'}</p>
      <small>Kết quả sẽ xuất hiện sau khi bạn hoàn thành hoạt động đầu tiên.</small>
    </div>
  );
}

export default function ProfileHistoryTab({ userId }) {
  const [performance, setPerformance] = useState(EMPTY_PERFORMANCE);
  const [pvpHistory, setPvpHistory] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [hasMore, setHasMore] = useState({ pvp: false, quiz: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState('');
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState('');
  const [mobileFilter, setMobileFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!userId) return;
      setLoading(true);
      setError('');

      const [performanceResult, pvpResult, quizResult] = await Promise.all([
        supabase.rpc('get_my_profile_performance'),
        supabase.rpc('get_my_pvp_history', { p_limit: PAGE_SIZE + 1, p_offset: 0 }),
        supabase.rpc('get_my_quiz_history', { p_limit: PAGE_SIZE + 1, p_offset: 0 })
      ]);

      if (!active) return;
      const firstError = performanceResult.error || pvpResult.error || quizResult.error;
      if (firstError) {
        console.warn('Profile history RPC unavailable, using compatible table reads:', firstError.message);
        try {
          const compatible = await loadCompatibleHistory(userId);
          if (!active) return;
          setPerformance(compatible.performance);
          setPvpHistory(compatible.pvp.slice(0, PAGE_SIZE));
          setQuizHistory(compatible.quiz.slice(0, PAGE_SIZE));
          setHasMore({ pvp: false, quiz: false });
          setLoading(false);
          return;
        } catch (compatibleError) {
          if (!active) return;
          console.error('Error loading compatible profile history:', compatibleError);
          setError('Không thể tải lịch sử lúc này. Vui lòng thử lại sau.');
          setLoading(false);
          return;
        }
      }

      const pvpItems = asList(pvpResult.data);
      const quizItems = asList(quizResult.data);
      setPerformance({ ...EMPTY_PERFORMANCE, ...(performanceResult.data || {}) });
      setPvpHistory(pvpItems.slice(0, PAGE_SIZE));
      setQuizHistory(quizItems.slice(0, PAGE_SIZE));
      setHasMore({ pvp: pvpItems.length > PAGE_SIZE, quiz: quizItems.length > PAGE_SIZE });
      setLoading(false);
    }

    loadHistory();
    return () => { active = false; };
  }, [userId, refreshKey]);

  const loadMore = async (type) => {
    if (loadingMore) return;
    setLoadingMore(type);
    setError('');
    const currentItems = type === 'pvp' ? pvpHistory : quizHistory;
    const functionName = type === 'pvp' ? 'get_my_pvp_history' : 'get_my_quiz_history';
    const { data, error: requestError } = await supabase.rpc(functionName, {
      p_limit: PAGE_SIZE + 1,
      p_offset: currentItems.length
    });

    if (requestError) {
      console.error(`Error loading more ${type} history:`, requestError);
      setError('Không thể tải thêm dữ liệu. Vui lòng thử lại.');
      setLoadingMore('');
      return;
    }

    const nextItems = asList(data);
    const visibleItems = nextItems.slice(0, PAGE_SIZE);
    if (type === 'pvp') setPvpHistory(items => [...items, ...visibleItems]);
    else setQuizHistory(items => [...items, ...visibleItems]);
    setHasMore(value => ({ ...value, [type]: nextItems.length > PAGE_SIZE }));
    setLoadingMore('');
  };

  if (loading) {
    return (
      <div className="profile-history-loading" role="status">
        <RefreshCw className="w-7 h-7 animate-spin" />
        <p>Đang tổng hợp hiệu suất học tập...</p>
      </div>
    );
  }

  if (error && pvpHistory.length === 0 && quizHistory.length === 0) {
    return (
      <div className="profile-history-error" role="alert">
        <Activity className="w-10 h-10" />
        <p>{error}</p>
        <button onClick={() => setRefreshKey(value => value + 1)}><RefreshCw className="w-4 h-4" /> Thử lại</button>
      </div>
    );
  }

  const recentForm = pvpHistory.slice(0, 5);
  const totalActivities = Number(performance.pvp_total || 0) + Number(performance.quiz_completed || 0);

  return (
    <div className="profile-history-tab">
      <section className="profile-history-summary" aria-labelledby="performance-title">
        <div className="profile-history-section-heading">
          <div>
            <h3 id="performance-title">Tổng quan hiệu suất</h3>
            <p>Các chỉ số được tổng hợp từ những hoạt động đã có kết quả.</p>
          </div>
          {recentForm.length > 0 && (
            <div className="profile-recent-form" aria-label="Phong độ năm trận PvP gần nhất">
              <span>5 trận gần nhất</span>
              <div>{recentForm.map(item => <i key={item.id} className={resultMeta[item.result]?.className} title={resultMeta[item.result]?.label} />)}</div>
            </div>
          )}
        </div>

        <div className="profile-history-overview-grid">
          <OverviewCard icon={Activity} label="Tổng hoạt động" value={formatNumber(totalActivities)} detail="PvP và Quiz hoàn thành" tone="tone-blue" />
          <OverviewCard icon={Trophy} label="Tỷ lệ thắng PvP" value={formatPercent(performance.pvp_win_rate)} detail={`${formatNumber(performance.pvp_wins)} thắng · ${formatNumber(performance.pvp_losses)} thua · ${formatNumber(performance.pvp_draws)} hòa`} tone="tone-amber" />
          <OverviewCard icon={BarChart3} label="Điểm PvP trung bình" value={formatNumber(performance.pvp_average_score)} detail={`${formatNumber(performance.pvp_total)} trận đã có kết quả`} tone="tone-purple" />
          <OverviewCard icon={Target} label="Độ chính xác Quiz" value={formatPercent(performance.quiz_accuracy)} detail={`${formatNumber(performance.quiz_correct_answers)}/${formatNumber(performance.quiz_answered)} câu đúng`} tone="tone-emerald" />
          <OverviewCard icon={TrendingUp} label="Điểm Quiz trung bình" value={formatNumber(performance.quiz_average_score)} detail={`Cao nhất ${formatNumber(performance.quiz_best_score)} điểm`} tone="tone-cyan" />
          <OverviewCard icon={Clock3} label="Phản hồi trung bình" value={formatDuration(performance.quiz_average_response_ms)} detail={`${formatNumber(performance.quiz_completed)} lượt Quiz hoàn thành`} tone="tone-rose" />
        </div>
      </section>

      <div className="profile-history-mobile-filter" role="group" aria-label="Lọc loại lịch sử">
        {['all', 'pvp', 'quiz'].map(filter => (
          <button key={filter} onClick={() => setMobileFilter(filter)} className={mobileFilter === filter ? 'is-active' : ''}>
            {filter === 'all' ? 'Tất cả' : filter === 'pvp' ? 'PvP' : 'Quiz'}
          </button>
        ))}
      </div>

      {error && <p className="profile-history-inline-error">{error}</p>}

      <div className="profile-history-columns">
        <section className={`profile-history-list-section ${mobileFilter === 'quiz' ? 'is-filtered' : ''}`} aria-labelledby="pvp-history-title">
          <div className="profile-history-list-title">
            <span><Swords className="w-5 h-5" /></span>
            <div><h3 id="pvp-history-title">Lịch sử PvP</h3><p>{formatNumber(performance.pvp_total)} trận đã có kết quả</p></div>
          </div>
          <div className="profile-history-list">
            {pvpHistory.length === 0 ? <EmptyHistory type="pvp" /> : pvpHistory.map(item => {
              const meta = resultMeta[item.result] || resultMeta.draw;
              const itemKey = `pvp-${item.id}`;
              const expanded = expandedItem === itemKey;
              return (
                <article key={item.id} className={`profile-history-row ${expanded ? 'is-expanded' : ''}`}>
                  <button onClick={() => setExpandedItem(expanded ? '' : itemKey)} aria-expanded={expanded}>
                    <span className={`profile-history-result ${meta.className}`}>{meta.label}</span>
                    <span className="profile-history-row-main"><strong>vs {item.opponent_name}</strong><small>Lớp {item.class_id || '—'} · {formatDate(item.played_at)}</small></span>
                    <span className="profile-history-score">{item.my_score}–{item.opponent_score}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="profile-history-row-details" aria-hidden={!expanded}><div>
                    <dl>
                      <div><dt>Số câu đã chơi</dt><dd>{formatNumber(item.questions_played)}</dd></div>
                      <div><dt>Trạng thái</dt><dd>{item.did_quit ? 'Bạn đã rời trận' : item.opponent_quit ? 'Đối thủ rời trận' : 'Hoàn thành'}</dd></div>
                      <div><dt>Mã trận</dt><dd>{item.room_id}</dd></div>
                    </dl>
                  </div></div>
                </article>
              );
            })}
          </div>
          {hasMore.pvp && <button className="profile-history-more" onClick={() => loadMore('pvp')} disabled={Boolean(loadingMore)}>{loadingMore === 'pvp' && <RefreshCw className="w-4 h-4 animate-spin" />} Xem thêm PvP</button>}
        </section>

        <section className={`profile-history-list-section ${mobileFilter === 'pvp' ? 'is-filtered' : ''}`} aria-labelledby="quiz-history-title">
          <div className="profile-history-list-title quiz-title">
            <span><BookOpenCheck className="w-5 h-5" /></span>
            <div><h3 id="quiz-history-title">Lịch sử Quiz</h3><p>{formatNumber(performance.quiz_completed)} lượt đã hoàn thành</p></div>
          </div>
          <div className="profile-history-list">
            {quizHistory.length === 0 ? <EmptyHistory type="quiz" /> : quizHistory.map(item => {
              const itemKey = `quiz-${item.id}`;
              const expanded = expandedItem === itemKey;
              const completed = item.status === 'completed';
              const accuracy = item.answered_count > 0 ? item.correct_count * 100 / item.answered_count : 0;
              return (
                <article key={item.id} className={`profile-history-row ${expanded ? 'is-expanded' : ''}`}>
                  <button onClick={() => setExpandedItem(expanded ? '' : itemKey)} aria-expanded={expanded}>
                    <span className={`profile-history-result ${completed ? 'history-result-complete' : 'history-result-pending'}`}>{completed ? 'Xong' : 'Dở'}</span>
                    <span className="profile-history-row-main"><strong>{item.title}</strong><small>{item.teacher_name} · {formatDate(item.completed_at || item.started_at)}</small></span>
                    <span className="profile-history-score">{formatNumber(item.score)}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="profile-history-row-details" aria-hidden={!expanded}><div>
                    <dl>
                      <div><dt>Kết quả</dt><dd>{formatNumber(item.correct_count)}/{formatNumber(item.answered_count)} câu · {formatPercent(accuracy)}</dd></div>
                      <div><dt>Loại Quiz</dt><dd>{item.room_type === 'assignment' ? 'Bài được giao' : 'Trực tiếp'}</dd></div>
                      <div><dt>Phản hồi TB</dt><dd>{formatDuration(item.average_response_ms)}</dd></div>
                    </dl>
                  </div></div>
                </article>
              );
            })}
          </div>
          {hasMore.quiz && <button className="profile-history-more" onClick={() => loadMore('quiz')} disabled={Boolean(loadingMore)}>{loadingMore === 'quiz' && <RefreshCw className="w-4 h-4 animate-spin" />} Xem thêm Quiz</button>}
        </section>
      </div>
    </div>
  );
}
