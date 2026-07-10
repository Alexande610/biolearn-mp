import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Trophy, Users, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const normalizeRoomCode = (value) => String(value || '').toUpperCase().replace(/\s+/g, '');
const ANSWER_THEMES = [
  {
    symbol: '▲',
    base: 'from-red-500/90 to-rose-600/90 border-red-300/40',
    hover: 'hover:from-red-400 hover:to-rose-500',
  },
  {
    symbol: '◆',
    base: 'from-sky-500/90 to-blue-600/90 border-sky-300/40',
    hover: 'hover:from-sky-400 hover:to-blue-500',
  },
  {
    symbol: '●',
    base: 'from-emerald-500/90 to-green-600/90 border-emerald-300/40',
    hover: 'hover:from-emerald-400 hover:to-green-500',
  },
  {
    symbol: '■',
    base: 'from-amber-500/90 to-orange-600/90 border-amber-300/40',
    hover: 'hover:from-amber-400 hover:to-orange-500',
  },
];

export default function StudentQuizRoomPage() {
  const navigate = useNavigate();
  const { user, userStats } = useAuth();

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);

  const [checkingRoom, setCheckingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joined, setJoined] = useState(false);

  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState('join'); // join | waiting | question | result | ended

  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);

  const studentId = useMemo(
    () => user?.uid || user?.firebaseUid || user?.id || user?._id || '',
    [user]
  );
  const studentName = user?.displayName || user?.username || 'Học sinh';
  const studentAvatar = userStats?.avatar || user?.avatar || 'adventurer-1';

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearSocket = () => {
    if (socketRef.current) {
      supabase.removeChannel(socketRef.current);
      socketRef.current = null;
    }
  };

  const resetQuestionState = () => {
    setQuestion(null);
    setTimer(0);
    setSelectedAnswer(null);
    setAnswerLocked(false);
    setAnswerResult(null);
  };

  const startTimer = (seconds) => {
    clearTimer();
    setTimer(seconds);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const leaveRoom = () => {
    clearTimer();

    // Supabase Channel will disconnect on clearSocket
    clearSocket();
    setJoined(false);
    setPhase('join');
    setPlayers([]);
    setLeaderboard([]);
    resetQuestionState();
  };

  useEffect(() => {
    return () => {
      leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectSocketAndJoin = (resolvedRoomCode) => {
    clearSocket();
    setJoiningRoom(true);

    const channel = supabase.channel(`room:${resolvedRoomCode}`, {
      config: { presence: { key: studentId } }
    });

    socketRef.current = channel;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setJoiningRoom(false);
        setJoined(true);
        setPhase('waiting');
        setError('');

        channel.send({
          type: 'broadcast',
          event: 'student_join',
          payload: {
            studentId,
            studentName,
            studentAvatar,
          }
        });
      }
      if (status === 'CHANNEL_ERROR') {
        setError('Không thể vào phòng quiz.');
        setJoiningRoom(false);
        setJoined(false);
        clearSocket();
      }
    });

    channel
      .on('broadcast', { event: 'quiz_started' }, () => {
        setPhase('waiting');
      })
      .on('broadcast', { event: 'student_list' }, ({ payload }) => {
        setPlayers(Array.isArray(payload?.students) ? payload.students : []);
      })
      .on('broadcast', { event: 'quiz_question' }, ({ payload }) => {
        setQuestion(payload);
        setPhase('question');
        setSelectedAnswer(null);
        setAnswerLocked(false);
        setAnswerResult(null);
        startTimer(Number(payload?.timeLimit || 20));
      })
      .on('broadcast', { event: 'quiz_result' }, ({ payload }) => {
        clearTimer();
        setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []);
        setPhase('result');
      })
      .on('broadcast', { event: 'quiz_ended' }, ({ payload }) => {
        clearTimer();
        setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []);
        setPhase('ended');
      });
  };

  const handleJoinRoom = async () => {
    setError('');

    if (!studentId) {
      setError('Bạn cần đăng nhập trước khi vào phòng quiz.');
      return;
    }

    const normalizedCode = normalizeRoomCode(roomCodeInput);
    if (!normalizedCode || normalizedCode.length < 4) {
      setError('Vui lòng nhập mã phòng hợp lệ.');
      return;
    }

    setCheckingRoom(true);
    try {
      const { data: room, error: err } = await supabase
        .from('quiz_rooms')
        .select(`*, profiles(display_name)`)
        .eq('room_code', normalizedCode)
        .single();

      if (err || !room) {
        throw new Error('Phòng không tồn tại.');
      }

      if (room.status !== 'waiting') {
        throw new Error('Phòng quiz đang diễn ra. Hãy chờ phiên mới từ giáo viên.');
      }

      setRoomInfo({ title: room.title, teacherName: room.profiles?.display_name || 'Giáo viên' });
      setRoomCode(normalizedCode);
      connectSocketAndJoin(normalizedCode);
    } catch (err) {
      setError(err.message || 'Không thể vào phòng quiz.');
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleSelectAnswer = (index) => {
    if (!socketRef.current || phase !== 'question' || answerLocked || !question) return;

    setSelectedAnswer(index);
    setAnswerLocked(true);
    
    // Tự đánh giá điểm Client-side cho nhẹ Server
    const isCorrect = (index === question.correctAnswer);
    const timeRatio = timer / question.timeLimit;
    const points = isCorrect ? Math.round(1000 * timeRatio) : 0;
    
    setAnswerResult({ isCorrect, points });

    socketRef.current.send({
      type: 'broadcast',
      event: 'student_answer',
      payload: {
        studentId,
        score: points,
        timeLeft: timer,
      }
    });
  };

  return (
    <div className="min-h-screen pb-8 relative overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute -top-36 -left-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              leaveRoom();
              navigate('/home', { replace: true });
            }}
            className="w-10 h-10 bg-white/10 border border-white/15 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Phòng Quiz Học Sinh</h1>
            <p className="text-cyan-100/90 text-sm">Nhập mã phòng từ giáo viên</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 relative z-10">
        {!joined && (
          <section className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl shadow-black/20">
            <h2 className="text-white text-2xl font-bold mb-2">Vào phòng quiz</h2>
            <p className="text-emerald-100/90 text-sm mb-5">Nhập mã phòng do giáo viên cấp để tham gia.</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={roomCodeInput}
                onChange={(event) => setRoomCodeInput(normalizeRoomCode(event.target.value))}
                placeholder="Ví dụ: A1B2C3"
                maxLength={8}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-50/10 text-white border border-white/20 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 uppercase tracking-[0.2em]"
              />
              <button
                onClick={handleJoinRoom}
                disabled={checkingRoom || joiningRoom}
                className="sm:min-w-[120px] px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkingRoom || joiningRoom ? 'Đang vào...' : 'Vào'}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-200 text-sm bg-red-500/15 border border-red-400/40 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-emerald-100">1. Nhập mã phòng</div>
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-emerald-100">2. Chờ giáo viên bắt đầu</div>
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-emerald-100">3. Trả lời theo thời gian thực</div>
            </div>
          </section>
        )}

        {joined && roomInfo && (
          <>
            <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">{roomInfo.title || 'Quiz Room'}</h2>
                  <p className="text-cyan-100 text-sm">Mã phòng: <span className="font-mono font-bold tracking-wider">{roomCode}</span> • GV: {roomInfo.teacherName || 'Giáo viên'}</p>
                </div>
                <button
                  onClick={leaveRoom}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Rời phòng
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-cyan-300" />
                <h3 className="text-white font-semibold">Người chơi trong phòng ({players.length})</h3>
              </div>

              {players.length === 0 ? (
                <p className="text-gray-300 text-sm">Đang chờ cập nhật danh sách người chơi...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div key={player.studentId} className="px-3 py-2 bg-cyan-400/15 border border-cyan-300/20 rounded-lg text-sm text-white">
                      {player.studentName}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {phase === 'waiting' && (
              <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center">
                <p className="text-white font-semibold text-lg">Đang chờ giáo viên bắt đầu quiz...</p>
                <p className="text-gray-200/90 text-sm mt-2">Khi giáo viên bấm bắt đầu, câu hỏi sẽ hiển thị ngay tại đây.</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/30 text-yellow-100">
                  <Clock className="w-4 h-4" />
                  Sẵn sàng vào trận
                </div>
              </section>
            )}

            {phase === 'question' && question && (
              <section className="rounded-2xl border border-cyan-300/20 bg-white/10 backdrop-blur-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <p className="text-cyan-100 text-sm font-medium">Câu {Number(question.questionIndex) + 1}/{question.totalQuestions}</p>
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-300/30 bg-yellow-400/10 text-yellow-100 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold leading-none">{timer}</span>
                    <span className="text-[10px] mt-1">giây</span>
                  </div>
                </div>

                <h3 className="text-white text-xl font-bold mb-5 leading-relaxed">{question.question}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options?.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const theme = ANSWER_THEMES[index % ANSWER_THEMES.length];

                    return (
                      <button
                        key={`${question.questionIndex}-${index}`}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={answerLocked}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 bg-gradient-to-r text-white ${theme.base} ${answerLocked ? 'opacity-80 cursor-not-allowed' : theme.hover} ${isSelected ? 'ring-4 ring-white/60 scale-[1.02] shadow-xl shadow-black/30' : 'hover:scale-[1.01]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/20 text-lg font-black leading-none">
                            {theme.symbol}
                          </span>
                          <div className="flex-1">
                            <span className="block text-xs uppercase tracking-wider text-white/80">Đáp án {String.fromCharCode(65 + index)}</span>
                            <span className="block font-semibold text-sm sm:text-base">{option}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {answerResult && (
                  <div className={`mt-5 p-3 rounded-xl border ${answerResult.isCorrect ? 'bg-green-500/15 border-green-400/40 text-green-200' : 'bg-red-500/15 border-red-400/40 text-red-200'}`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {answerResult.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      {answerResult.isCorrect ? 'Bạn trả lời đúng!' : 'Bạn trả lời chưa đúng.'}
                    </div>
                    <p className="text-sm mt-1">+{answerResult.points || 0} điểm</p>
                  </div>
                )}
              </section>
            )}

            {phase === 'result' && (
              <section className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-5">
                <h3 className="text-white font-bold text-lg mb-3">Kết quả tạm thời</h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((item) => (
                    <div key={item.studentId} className="flex items-center justify-between bg-white/10 border border-white/10 rounded-lg px-3 py-2">
                      <p className="text-white">#{item.rank} {item.studentName}</p>
                      <p className="text-yellow-300 font-semibold">{item.score} điểm</p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-200/90 text-sm mt-3">Đang chờ câu hỏi tiếp theo...</p>
              </section>
            )}

            {phase === 'ended' && (
              <section className="rounded-2xl border border-yellow-300/25 bg-white/10 backdrop-blur-xl p-5 sm:p-6 text-center">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-bold text-2xl">Quiz đã kết thúc</h3>
                <p className="text-gray-200/90 text-sm mt-1 mb-4">Bảng xếp hạng cuối cùng</p>

                <div className="space-y-2 text-left">
                  {leaderboard.slice(0, 10).map((item) => (
                    <div key={item.studentId} className="flex items-center justify-between bg-white/10 border border-white/10 rounded-lg px-3 py-2">
                      <p className="text-white">#{item.rank} {item.studentName}</p>
                      <p className="text-yellow-300 font-semibold">{item.score} điểm</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    leaveRoom();
                    navigate('/home', { replace: true });
                  }}
                  className="mt-5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold"
                >
                  Về trang chủ
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
