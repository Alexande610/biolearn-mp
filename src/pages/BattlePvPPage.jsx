import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft, Clock, Trophy, Star, Zap,
  Users, CheckCircle, XCircle, Swords, Wifi, WifiOff, User, Loader2 as LoaderIcon
} from 'lucide-react';

// Avatar map
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

const getAvatarUrl = (avatarData) => {
  if (!avatarData) return '/images/Avatar/adventurer-1.png';
  if (avatarData.startsWith('http')) return avatarData;
  return avatarMap[avatarData] || '/images/Avatar/adventurer-1.png';
};

export default function BattlePvPPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userStats } = useAuth();

  // URL params
  const roomId = searchParams.get('room');
  const classId = parseInt(searchParams.get('class')) || 6;

  // Supabase Channel ref
  const matchFoundRef = useRef(false);
  const questionsRef = useRef([]);
  const scoresRef = useRef({});
  const gameStatusRef = useRef('waiting');
  const answersReceivedRef = useRef({});
  const channelRef = useRef(null);
  const isHostRef = useRef(false);
  const nextQuestionTimerRef = useRef(null); // Ref để quản lý timer giữa các câu hỏi
  const surrenderedPlayerIdRef = useRef(null); // Ref để lưu ID người bỏ cuộc

  // State
  const [connected, setConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('connecting'); // connecting, waiting, starting, playing, finished
  const [players, setPlayers] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scores, setScores] = useState({});
  const [myAnswer, setMyAnswer] = useState(null);
  const [opponentAnswer, setOpponentAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [nextTimer, setNextTimer] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [finalExitTimer, setFinalExitTimer] = useState(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const myId = user?.id || user?.uid;
  const myName = userStats?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Bạn';
  const myAvatar = userStats?.avatar_url || user?.user_metadata?.avatar_url || 'adventurer-1';

  const getFriendlyRoomName = () => {
    if (!roomId) return '';
    return roomId.substring(0, 8).toUpperCase();
  };

  const addLog = (message, type = 'info') => {
    setActivityLog(prev => [...prev.slice(-19), {
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  // Sync gameStatus with ref
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Sync scores with ref
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // 1. Dọn dẹp entry cũ trong pvp_queues (nếu có)
  useEffect(() => {
    if (!myId) return;
    supabase.from('pvp_queues').delete().eq('user_id', myId)
      .then(({ error }) => {
        if (!error) console.log('✅ Đã dọn dẹp hàng chờ.');
      });
  }, [myId]);

  // Host Logic: Start Game
  const startBattleAsHost = async () => {
    if (!isHostRef.current) return;

    addLog('Bạn là chủ phòng. Đang nạp câu hỏi...', 'info');

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('class_id', classId)
        .order('id', { ascending: false })
        .limit(15);

      if (error || !data || data.length === 0) {
        addLog('Không tìm thấy câu hỏi cho lớp này!', 'error');
        return;
      }

      const shuffled = data.sort(() => Math.random() - 0.5);
      questionsRef.current = shuffled;
      setTotalQuestions(shuffled.length);

      if (channelRef.current) {
        // Delay 1 giây để đối thủ kịp nhận tín hiệu
        setTimeout(() => {
          channelRef.current.send({
            type: 'broadcast',
            event: 'game-starting',
            payload: { countdown: 5, totalQuestions: shuffled.length }
          });
          handleGameStarting(5);
        }, 1000);
      }
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const handleGameStarting = (count) => {
    setGameStatus('starting');
    setCountdown(count);
    addLog('Trận đấu sắp bắt đầu!', 'warning');

    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        // Delay 1 giây để Guest kịp ổn định kết nối và chuyển màn hình
        if (isHostRef.current) {
          setTimeout(() => sendNextQuestion(0), 1000);
        }
      }
    }, 1000);
  };

  const handleNewQuestion = (payload) => {
    // Clear any pending transition timer
    if (nextQuestionTimerRef.current) {
      clearInterval(nextQuestionTimerRef.current);
      nextQuestionTimerRef.current = null;
    }

    setGameStatus('playing');
    setCurrentQuestion({
      question: payload.question,
      options: payload.options,
      explanation: payload.explanation
    });
    setQuestionIndex(payload.questionIndex);
    setTotalQuestions(payload.totalQuestions);
    setTimeLeft(payload.timeLimit);
    setMyAnswer(null);
    setOpponentAnswer(null);
    setShowResult(false);
    setCorrectAnswer(null);
    setExplanation('');
    setNextTimer(null);

    // Chỉ log ở máy Guest để tránh trùng lặp log (vì Host đã có log khi send)
    if (!isHostRef.current) {
      addLog(`Câu hỏi ${payload.questionIndex + 1} bắt đầu!`, 'info');
    }
  };

  const sendNextQuestion = (index) => {
    if (!isHostRef.current) return;

    if (!questionsRef.current[index]) {
      if (index >= questionsRef.current.length && questionsRef.current.length > 0) {
        finishGameAsHost();
      }
      return;
    }

    const q = questionsRef.current[index];
    const payload = {
      question: q.content,
      options: q.options,
      explanation: q.explanation,
      questionIndex: index,
      totalQuestions: questionsRef.current.length,
      timeLimit: 15
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'new-question',
      payload
    });

    // Host tự cập nhật trạng thái cho mình & log trực tiếp
    addLog(`Câu hỏi ${index + 1} bắt đầu!`, 'info');
    handleNewQuestion(payload);
    answersReceivedRef.current = {};
  };

  const finishGameAsHost = () => {
    const finalScores = scoresRef.current;
    let winnerId = null;

    const playerIds = Object.keys(finalScores);
    if (playerIds.length >= 2) {
      if ((finalScores[playerIds[0]] || 0) > (finalScores[playerIds[1]] || 0)) winnerId = playerIds[0];
      else if ((finalScores[playerIds[1]] || 0) > (finalScores[playerIds[0]] || 0)) winnerId = playerIds[1];
    }

    const payload = {
      winnerId,
      scores: finalScores
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'game-over',
      payload
    });

    // Host tự kết thúc
    processGameOver(payload.winnerId, payload.scores);
  };

  const processGameOver = async (winnerId, finalScores) => {
    setGameStatus('finished');
    const isWinner = winnerId === myId;
    const isDraw = !winnerId;

    setGameResult({
      winner: winnerId ? { id: winnerId } : null,
      scores: finalScores
    });

    const xp = isWinner ? 100 : (isDraw ? 70 : 50);
    const coins = isWinner ? 50 : (isDraw ? 30 : 25);
    const rank = isWinner ? 100 : (isDraw ? 70 : 50);

    addLog(`Trận đấu kết thúc! Bạn nhận được ${xp}XP và ${coins} xu.`, 'success');

    try {
      await supabase.rpc('reward_user', {
        p_user_id: myId,
        p_xp_gain: xp,
        p_coin_gain: coins,
        p_reward_type: 'pvp',
        p_class_id: String(classId)
      });

      if (isHostRef.current || isWinner) {
        const oppId = players.find(p => p.id !== myId)?.id;
        let matchStatus = 'finished';
        if (surrenderedPlayerIdRef.current) {
          if (surrenderedPlayerIdRef.current === myId) {
            matchStatus = 'player1_surrendered'; // Assuming player1 is myId if we are host or we write it
          } else if (surrenderedPlayerIdRef.current === oppId) {
            matchStatus = 'player2_surrendered';
          }
        }
        await supabase.from('pvp_matches').insert({
          room_id: roomId,
          player1_id: myId,
          player2_id: oppId || null,
          winner_id: winnerId,
          player1_score: finalScores[myId] || 0,
          player2_score: oppId ? (finalScores[oppId] || 0) : 0,
          class_id: classId,
          status: matchStatus
        });
      }
    } catch (err) {
      console.error('Error processing awards:', err);
    }
  };

  // 3s Auto-exit timer logic
  useEffect(() => {
    if (gameStatus === 'finished') {
      setFinalExitTimer(5); // Tăng lên 5s để người dùng kịp nhìn kết quả theo ý bạn "3s" nhưng thực tế 5s cho thoải mái, hoặc đổi về 3s
      const interval = setInterval(() => {
        setFinalExitTimer(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(interval);
            navigate('/home', { replace: true });
            return 0;
          }
          return (prev || 5) - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, navigate]);

  const handleSurrender = async () => {
    if (gameStatus !== 'playing' && gameStatus !== 'starting') return;
    setShowSurrenderModal(true);
  };

  const confirmSurrender = async () => {
    setShowSurrenderModal(false);
    surrenderedPlayerIdRef.current = myId;
    addLog('Bạn đã bỏ cuộc!', 'error');

    // Broadcast surrender event
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-surrendered',
        payload: { quitterId: myId }
      });
    }

    // End game locally: quitter always loses
    const oppId = players.find(p => p.id !== myId)?.id;
    processGameOver(oppId, scoresRef.current);
  };

  useEffect(() => {
    if (!roomId || !myId) {
      navigate('/home', { replace: true });
      return;
    }

    const channel = supabase.channel(`battle:${roomId}`, {
      config: {
        presence: { key: myId },
        broadcast: { self: false }
      }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const playersList = [];
        Object.entries(state).forEach(([key, value]) => {
          playersList.push({ id: key, ...value[0] });
        });

        setPlayers(playersList);
        const opp = playersList.find(p => p.id !== myId);
        setOpponent(opp);

        const sorted = playersList.sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
        const currentIsHost = sorted[0]?.id === myId;
        setIsHost(currentIsHost);
        isHostRef.current = currentIsHost;

        // Xử lý đối thủ thoát giữa trận
        if (playersList.length < 2 && (gameStatusRef.current === 'playing' || gameStatusRef.current === 'starting')) {
          addLog('Đối thủ đã rời phòng!', 'error');
          processGameOver(myId, scoresRef.current);
        }

        if (playersList.length >= 2 && currentIsHost && gameStatusRef.current === 'waiting') {
          startBattleAsHost();
        }
      })
      .on('broadcast', { event: 'game-starting' }, ({ payload }) => {
        handleGameStarting(payload.countdown);
        setTotalQuestions(payload.totalQuestions);
      })
      .on('broadcast', { event: 'new-question' }, ({ payload }) => {
        handleNewQuestion(payload);
      })
      .on('broadcast', { event: 'player-answered' }, ({ payload }) => {
        if (payload.playerId !== myId) {
          setOpponentAnswer(payload.answerIndex);
          addLog('Đối thủ đã chọn đáp án', 'warning');
        }

        if (isHostRef.current) {
          answersReceivedRef.current[payload.playerId] = payload.answerIndex;
          if (Object.keys(answersReceivedRef.current).length >= 2) {
            setTimeout(computeQuestionResult, 500);
          }
        }
      })
      .on('broadcast', { event: 'question-result' }, ({ payload }) => {
        handleQuestionResult(payload);
      })
      .on('broadcast', { event: 'game-over' }, ({ payload }) => {
        processGameOver(payload.winnerId, payload.scores);
      })
      .on('broadcast', { event: 'player-surrendered' }, ({ payload }) => {
        if (payload.quitterId !== myId) {
          surrenderedPlayerIdRef.current = payload.quitterId;
          addLog('Đối thủ đã bỏ cuộc! Bạn giành chiến thắng.', 'success');
          processGameOver(myId, scoresRef.current);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          setGameStatus('waiting');
          await channel.track({
            display_name: myName,
            avatar_url: myAvatar,
            joined_at: new Date().toISOString()
          });
          addLog(`Đã vào phòng ${roomId}`, 'info');
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, myId, classId]);

  const handleQuestionResult = (payload) => {
    // Clear existing timer if any
    if (nextQuestionTimerRef.current) {
      clearInterval(nextQuestionTimerRef.current);
    }

    setCorrectAnswer(payload.correctAnswer);
    setExplanation(payload.explanation);
    setShowResult(true);
    setScores(payload.scores);
    setNextTimer(10);

    let timersTimeLeft = 10;
    const timer = setInterval(() => {
      timersTimeLeft--;
      setNextTimer(timersTimeLeft);
      if (timersTimeLeft <= 0) {
        clearInterval(timer);
        nextQuestionTimerRef.current = null;
        if (isHostRef.current) sendNextQuestion(payload.questionIndex + 1);
      }
    }, 1000);
    nextQuestionTimerRef.current = timer;
  };

  const computeQuestionResult = () => {
    if (!isHostRef.current) return;

    const q = questionsRef.current[questionIndex];
    if (!q) return;

    const currentScores = { ...scoresRef.current };
    Object.entries(answersReceivedRef.current).forEach(([pid, ans]) => {
      if (ans === q.correct_option) {
        currentScores[pid] = (currentScores[pid] || 0) + 10;
      }
    });

    const payload = {
      correctAnswer: q.correct_option,
      explanation: q.explanation,
      scores: currentScores,
      questionIndex: questionIndex
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'question-result',
      payload
    });

    // Host tự cập nhật
    handleQuestionResult(payload);
  };

  const handleAnswer = useCallback((answerIndex) => {
    if (myAnswer !== null || showResult || gameStatus !== 'playing') return;

    setMyAnswer(answerIndex);
    addLog('Bạn đã chọn đáp án', 'info');

    // Broadcast cho đối thủ
    channelRef.current.send({
      type: 'broadcast',
      event: 'player-answered',
      payload: { playerId: myId, answerIndex }
    });

    // Nếu là Host, tự lưu đáp án của mình vào ref để tính toán kết quả
    if (isHostRef.current) {
      answersReceivedRef.current[myId] = answerIndex;
      if (Object.keys(answersReceivedRef.current).length >= 2) {
        setTimeout(computeQuestionResult, 500);
      }
    }
  }, [myAnswer, showResult, gameStatus, myId]);

  useEffect(() => {
    if (gameStatus !== 'playing' || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (isHostRef.current) computeQuestionResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, showResult, questionIndex]);

  const handleLeave = () => {
    navigate('/leaderboard', { replace: true });
  };

  if (gameStatus === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Đang kết nối Realtime...</p>
        </div>
      </div>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="game-card text-center max-w-md w-full bg-green-950/40 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl animate-in zoom-in duration-500">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
            <span className="text-green-400 font-black text-[10px] uppercase tracking-widest">Realtime Online</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-8 italic">Đang chờ đối thủ...</h1>
          <div className="flex justify-center items-center gap-8 mb-8">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-full border-4 border-green-500 overflow-hidden bg-green-500/20 mx-auto mb-3 ring-4 ring-green-500/10">
                <img src={getAvatarUrl(myAvatar)} alt="You" className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-bold text-sm tracking-tight">{myName}</p>
              <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mt-1">{isHost ? 'Chủ phòng' : 'Sẵn sàng'}</p>
            </div>
            <div className="flex flex-col items-center">
              <Swords className="w-8 h-8 text-green-400 animate-bounce" />
              <div className="h-4 w-[1px] bg-gradient-to-b from-green-500 to-transparent my-2"></div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/10 bg-white/5 mx-auto mb-3 flex items-center justify-center transition-all duration-500" style={{ transform: opponent ? 'scale(1)' : 'scale(0.9)' }}>
                {opponent ? (
                  <img src={getAvatarUrl(opponent.avatar_url)} alt="Opponent" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="animate-pulse"><User className="w-10 h-10 text-white/20" /></div>
                )}
              </div>
              <p className="text-white/60 font-bold text-sm tracking-tight">{opponent?.display_name || 'Đang chờ...'}</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 mb-8 border border-white/5">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-1">Thông tin Phòng</p>
            <p className="text-green-400 font-mono text-sm font-bold">{getFriendlyRoomName()}</p>
          </div>
          <button onClick={handleLeave} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 border border-red-500/20 font-black transition-all active:scale-95 uppercase tracking-widest text-xs">Hủy tìm trận</button>

          {/* Activity Log in Waiting */}
          <div className="mt-8 pt-6 border-t border-white/5 h-32 overflow-y-auto text-left space-y-2 opacity-50 text-[10px]">
            {activityLog.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600">{log.time}</span>
                <span className={log.type === 'error' ? 'text-red-400' : 'text-gray-400'}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'starting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="game-card text-center max-w-md w-full bg-green-950/40 p-12 rounded-[3rem] border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent"></div>
          <h1 className="text-[10px] font-black text-green-400 uppercase tracking-[0.4em] mb-12 relative z-10">Sẵn sàng quyết đấu</h1>
          <div className="text-9xl font-black text-white mb-12 drop-shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-pulse relative z-10">
            {countdown}
          </div>
          <div className="bg-green-500/10 py-4 px-6 rounded-2xl border border-green-500/20 inline-block relative z-10 box-border w-full">
            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Đối đầu với</p>
            <p className="text-white font-black text-xl italic">{opponent?.display_name || 'Đối thủ'}</p>
          </div>

          {/* Activity Log in Starting */}
          <div className="mt-8 text-left space-y-2 opacity-50 text-[10px] max-h-20 overflow-hidden">
            {activityLog.slice(-3).map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 font-mono">{log.time}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'finished') {
    const isWinner = gameResult?.winner?.id === myId;
    const isDraw = !gameResult?.winner;
    const myFinalScore = scores[myId] || 0;
    const oppId = players.find(p => p.id !== myId)?.id;
    const oppFinalScore = oppId ? (scores[oppId] || 0) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-transparent">
        <div className="max-w-lg w-full bg-green-950/60 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 duration-700">
          <div className={`p-10 text-center relative ${isWinner ? 'bg-gradient-to-b from-green-500/20 to-transparent' : isDraw ? 'bg-gradient-to-b from-yellow-500/20 to-transparent' : 'bg-gradient-to-b from-red-500/20 to-transparent'}`}>
            <div className="text-8xl mb-6 transform scale-110 animate-bounce">
              {isWinner ? '🏆' : isDraw ? '🤝' : '💀'}
            </div>
            <h1 className={`text-4xl font-black mb-2 tracking-tighter italic ${isWinner ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
              {isWinner ? 'CHIẾN THẮNG!' : isDraw ? 'HÒA NHAU!' : 'THẤT BẠI!'}
            </h1>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Kết quả cuối cùng</p>
          </div>

          <div className="p-10">
            <div className="flex justify-between items-center mb-10 bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Swords className="w-10 h-10 text-white/10" />
              </div>

              <div className="text-center relative z-10">
                <div className="w-20 h-20 rounded-full border-4 border-green-500 overflow-hidden bg-green-500/10 mb-3 ring-8 ring-green-500/10 group-hover:scale-110 transition-all">
                  <img src={getAvatarUrl(myAvatar)} alt="You" className="w-full h-full object-cover" />
                </div>
                <p className="text-3xl font-black text-white leading-none mb-1">{myFinalScore}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{myName}</p>
              </div>

              <div className="text-center relative z-10">
                <div className="w-20 h-20 rounded-full border-4 border-red-500/30 overflow-hidden bg-red-500/10 mb-3 grayscale opacity-60">
                  {opponent && <img src={getAvatarUrl(opponent.avatar_url)} alt="Opponent" className="w-full h-full object-cover" />}
                </div>
                <p className="text-3xl font-black text-white/40 leading-none mb-1">{oppFinalScore}</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{opponent?.display_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Kinh nghiệm</p>
                <p className="text-xl font-bold text-white">+{isWinner ? 100 : isDraw ? 70 : 50} XP</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-yellow-500 font-bold uppercase mb-1">Tiền vàng</p>
                <p className="text-xl font-bold text-white">+{isWinner ? 50 : isDraw ? 30 : 25}</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Xếp hạng</p>
                <p className="text-xl font-bold text-white">+{isWinner ? 100 : isDraw ? 70 : 50}</p>
              </div>
            </div>

            <button onClick={() => navigate('/home', { replace: true })} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl text-white font-black shadow-lg shadow-purple-900/20 transition-all active:scale-95 flex flex-col items-center gap-1">
              <span>TIẾP TỤC</span>
              {finalExitTimer !== null && (
                <span className="text-[10px] opacity-60 font-medium lowercase">Tự động thoát sau {finalExitTimer}s...</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden relative z-10">
      {/* Custom Surrender Modal */}
      {showSurrenderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-gradient-to-b from-red-900/40 to-black/60 border border-red-500/30 p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-4 italic uppercase tracking-tighter">Bỏ cuộc?</h3>
            <p className="text-red-100/60 text-center mb-8 leading-relaxed">Bạn có chắc chắn muốn rời trận đấu ngay bây giờ? Bạn sẽ bị tính là một trận thua.</p>
            <div className="space-y-3">
              <button
                onClick={confirmSurrender}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-900/40 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Xác nhận bỏ cuộc
              </button>
              <button
                onClick={() => setShowSurrenderModal(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Tiếp tục thi đấu
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-12 flex-shrink-0">
          <button onClick={handleLeave} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><ArrowLeft /></button>
        </div>

        <div className="flex-1 flex flex-col items-center text-center min-w-0 px-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold">Đối kháng PvP</span>
          <span className="font-bold flex items-center gap-1.5 justify-center w-full">
            <span className="truncate">{getFriendlyRoomName()}</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono font-bold text-red-400 text-sm">{timeLeft}s</span>
          </div>
          {(gameStatus === 'playing' || gameStatus === 'starting') && (
            <button
              onClick={handleSurrender}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 flex-shrink-0"
            >
              Bỏ cuộc
            </button>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-green-500 overflow-hidden bg-green-500/10 ring-4 ring-green-500/10">
              <img src={getAvatarUrl(myAvatar)} alt="You" className="w-full h-full object-cover" />
            </div>
            <div><p className="text-2xl font-black leading-tight text-green-400">{scores[myId] || 0}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{myName}</p></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Swords className="w-6 h-6 text-purple-600 mb-1" />
            <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-gray-400">{questionIndex + 1} / {totalQuestions}</div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div><p className="text-2xl font-black leading-tight text-red-500">{opponent ? (scores[opponent.id] || 0) : 0}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{opponent?.display_name}</p></div>
            <div className="w-16 h-16 rounded-full border-4 border-red-500/30 overflow-hidden bg-red-500/10 grayscale ring-4 ring-red-500/10 transition-all duration-500" style={{ transform: opponentAnswer !== null ? 'scale(1.1)' : 'scale(1)' }}>
              {opponent && <img src={getAvatarUrl(opponent.avatar_url)} alt="Opponent" className="w-full h-full object-cover" />}
            </div>
          </div>
        </div>

        {currentQuestion && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="game-card bg-green-950/40 p-8 rounded-[2.5rem] mb-8 border border-white/10 shadow-2xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white leading-relaxed">{currentQuestion.question}</h2>
            </div>

            <div className="grid gap-3 mb-8">
              {currentQuestion.options.map((option, index) => {
                const isMySelection = myAnswer === index;
                const isCorrect = showResult && index === correctAnswer;
                const isWrong = showResult && isMySelection && !isCorrect;

                let statusClass = "bg-white/5 border-white/5 hover:bg-white/10";
                if (isMySelection && !showResult) statusClass = "bg-purple-600 border-purple-500 shadow-lg shadow-purple-900/20 pvp-option-active";
                if (isCorrect) statusClass = "bg-green-500 border-green-400 shadow-lg shadow-green-900/20 pvp-option-active";
                if (isWrong) statusClass = "bg-red-500 border-red-400 shadow-lg shadow-red-900/20 pvp-option-active";

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={myAnswer !== null || showResult}
                    className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${statusClass}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${isMySelection || isCorrect || isWrong ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="font-bold flex-1">{option}</span>
                      {isCorrect && <CheckCircle className="w-6 h-6" />}
                      {isWrong && <XCircle className="w-6 h-6" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className="animate-in zoom-in slide-in-from-top-4 duration-500">
                <div className="game-card bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                      <LoaderIcon className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-purple-400 font-mono font-bold">{nextTimer}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Giải thích</h3>
                  </div>

                  <p className="text-purple-200 leading-relaxed text-lg mb-6">
                    {explanation || "Câu trả lời đúng được xác định dựa trên kiến thức trong sách giáo khoa."}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <p className="text-gray-400 text-sm">Câu hỏi tiếp theo sau vài giây...</p>
                    <div className="flex -space-x-3">
                      <div className={`w-10 h-10 rounded-full border-2 border-[#16161d] overflow-hidden bg-white/10 ${myAnswer === correctAnswer ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'}`}>
                        <img src={getAvatarUrl(myAvatar)} alt="Me" className="w-full h-full object-cover" />
                      </div>
                      {opponent && (
                        <div className={`w-10 h-10 rounded-full border-2 border-[#16161d] overflow-hidden bg-white/10 ${opponentAnswer === correctAnswer ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'}`}>
                          <img src={getAvatarUrl(opponent.avatar_url)} alt="Opp" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Log Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-green-400">Hoạt động thời gian thực</h3>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 h-48 overflow-y-auto border border-white/5 custom-scrollbar">
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center py-10">Đang chờ sự kiện...</p>
            ) : (
              <div className="space-y-3">
                {activityLog.map((log, i) => (
                  <div key={i} className="flex gap-3 text-sm animate-in slide-in-from-left-2 duration-300">
                    <span className="text-gray-500 font-mono text-[10px] whitespace-nowrap pt-0.5">{log.time}</span>
                    <span className={`font-bold ${log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                          log.type === 'warning' ? 'text-yellow-400' :
                            'text-gray-300'
                      }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* Force text white inside active/correct/wrong pvp options, even in light theme */
        body.light-theme .pvp-option-active,
        body.light-theme .pvp-option-active * {
          color: #ffffff !important;
        }

        /* Force high-contrast text, borders, and backgrounds in dark theme (default) */
        body:not(.light-theme) .text-gray-500 {
          color: #9ca3af !important;
        }
        body:not(.light-theme) .text-gray-400 {
          color: #d1d5db !important;
        }
        body:not(.light-theme) .text-purple-600 {
          color: #a78bfa !important;
        }
        body:not(.light-theme) .text-green-400 {
          color: #4ade80 !important;
        }
        body:not(.light-theme) .text-red-500 {
          color: #f87171 !important;
        }
        body:not(.light-theme) .bg-white\/5 {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        body:not(.light-theme) .border-white\/10 {
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        body:not(.light-theme) .border-white\/5 {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        body:not(.light-theme) .border-green-500 {
          border-color: #22c55e !important;
        }
        body:not(.light-theme) .border-red-500\/30 {
          border-color: rgba(239, 68, 68, 0.4) !important;
        }
      `}} />
    </div>
  );
}
