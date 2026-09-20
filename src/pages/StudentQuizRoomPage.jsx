import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, DoorClosed, History, PlayCircle, Trophy, Users, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';
import { reportSystemError } from '../lib/observability';
import './StudentQuizRoomPage.css';

const normalizeRoomCode = (value) => String(value || '').toUpperCase().replace(/\s+/g, '');
const QUIZ_LOGO_URL = '/images/SVG/Gradient%20Liquid%20Glass%20Wordmark%20-%20Bio%20Quizz.svg';

const createSeededRandom = (seedText) => {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

const seededShuffle = (items, seedText) => {
  const shuffled = [...items];
  const random = createSeededRandom(seedText);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

const personalizeQuestionOptions = (question, seedText, enabled) => {
  const optionEntries = (question.options || []).map((option, sourceOptionIndex) => ({ option, sourceOptionIndex }));
  const orderedOptions = enabled ? seededShuffle(optionEntries, seedText) : optionEntries;
  return {
    ...question,
    options: orderedOptions.map(entry => entry.option),
    optionIndexMap: orderedOptions.map(entry => entry.sourceOptionIndex),
  };
};

const buildPersonalizedAssignment = (questions, roomId, studentId, settings = {}) => {
  const withSource = (questions || []).map((question, sourceQuestionIndex) => ({ ...question, sourceQuestionIndex }));
  const orderedQuestions = settings.shuffleQuestions ? seededShuffle(withSource, `${roomId}:${studentId}:questions`) : withSource;
  return orderedQuestions.map((question, displayIndex) => ({
    ...personalizeQuestionOptions(question, `${roomId}:${studentId}:options:${question.sourceQuestionIndex}`, Boolean(settings.shuffleAnswers)),
    questionIndex: displayIndex,
    totalQuestions: orderedQuestions.length,
  }));
};

const prepareQuizLogo = (event) => {
  const svg = event.currentTarget.contentDocument?.documentElement;
  if (!svg) return;

  // Bản xuất từ Canva có một lớp caro giả trong suốt và canvas vuông rất lớn.
  // Chỉ ẩn lớp nền đó khi hiển thị, giữ nguyên tệp SVG gốc và các hiệu ứng bên trong.
  const backgroundLayer = Array.from(svg.children).find((child) =>
    child.tagName.toLowerCase() === 'g'
      && child.querySelector(':scope > image[width="2000"][height="2000"]')
  );

  if (backgroundLayer) backgroundLayer.style.display = 'none';
  svg.setAttribute('viewBox', '23.25 444.75 1453.5 610.25');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
};

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

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [days ? `${days} ngày` : '', `${String(hours).padStart(2, '0')} giờ`, `${String(minutes).padStart(2, '0')} phút`, `${String(seconds).padStart(2, '0')} giây`]
    .filter(Boolean)
    .join(' ');
};

export default function StudentQuizRoomPage() {
  const navigate = useNavigate();
  const { user, userStats } = useAuth();

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const roomCloseTimerRef = useRef(null);

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
  const [attemptId, setAttemptId] = useState('');
  const [assignmentScore, setAssignmentScore] = useState(0);
  const [recentRooms, setRecentRooms] = useState([]);
  const [clockNow, setClockNow] = useState(0);
  const [closedCountdown, setClosedCountdown] = useState(5);
  const [closedMessage, setClosedMessage] = useState('Phòng đã được Giáo viên đóng.');
  const [leaveIntent, setLeaveIntent] = useState(''); // lobby | home

  const studentId = useMemo(
    () => user?.uid || user?.firebaseUid || user?.id || user?._id || '',
    [user]
  );
  const studentName = user?.displayName || user?.username || 'Học sinh';
  const studentAvatar = userStats?.avatar_url || userStats?.avatar || user?.avatar_url || user?.avatar || 'adventurer-1';
  const recentRoomsKey = studentId ? `biolearn_recent_quiz_rooms_${studentId}` : '';

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

  const leaveRoom = async ({ navigateHome = false } = {}) => {
    clearTimer();
    clearInterval(roomCloseTimerRef.current);
    roomCloseTimerRef.current = null;

    const activeChannel = socketRef.current;
    if (activeChannel && studentId) {
      await activeChannel.send({
        type: 'broadcast', event: 'student_leave',
        payload: { studentId, studentName }
      }).catch(() => {});
      await activeChannel.untrack().catch(() => {});
    }
    if (attemptId && phase !== 'ended') {
      await supabase.from('quiz_attempts').update({ status: 'left' }).eq('id', attemptId).eq('student_id', studentId);
    }
    clearSocket();
    setJoined(false);
    setPhase('join');
    setPlayers([]);
    setLeaderboard([]);
    setRoomInfo(null);
    setRoomCode('');
    setAttemptId('');
    setLeaveIntent('');
    setClosedCountdown(5);
    resetQuestionState();
    if (navigateHome) navigate('/home', { replace: true });
  };

  const showRoomClosed = (message = 'Phòng đã được Giáo viên đóng.') => {
    clearTimer();
    clearInterval(roomCloseTimerRef.current);
    setClosedMessage(message);
    setClosedCountdown(5);
    setPhase('closed');
    let remaining = 5;
    roomCloseTimerRef.current = setInterval(() => {
      remaining -= 1;
      setClosedCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(roomCloseTimerRef.current);
        roomCloseTimerRef.current = null;
        leaveRoom();
      }
    }, 1000);
  };

  useEffect(() => {
    if (!joined || !roomCode || ['closed', 'ended', 'join'].includes(phase)) return undefined;
    const verifyRoomStatus = async () => {
      const { data: latestRoom, error: statusError } = await supabase
        .rpc('get_quiz_room_for_player', { p_room_code: roomCode });
      if (!statusError && latestRoom && ['closed', 'finished'].includes(latestRoom.status)) {
        showRoomClosed('Phòng đã được Giáo viên đóng. Bạn sẽ được đưa về phòng chờ.');
      }
    };
    const statusPoll = setInterval(verifyRoomStatus, 3000);
    return () => clearInterval(statusPoll);
    // Polling is a fallback for the rare case where a realtime close event is missed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, roomCode, phase]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearInterval(roomCloseTimerRef.current);
      clearSocket();
    };
  }, []);

  useEffect(() => {
    const tick = () => setClockNow(Date.now());
    tick();
    const clock = setInterval(tick, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!recentRoomsKey) return;
    let savedRooms = [];
    try {
      const saved = JSON.parse(localStorage.getItem(recentRoomsKey) || '[]');
      savedRooms = Array.isArray(saved) ? saved.slice(0, 5) : [];
    } catch { /* Ignore invalid temporary history data. */ }
    const syncHistory = setTimeout(() => setRecentRooms(savedRooms), 0);
    return () => clearTimeout(syncHistory);
  }, [recentRoomsKey]);

  const rememberRoom = (room, code) => {
    if (!recentRoomsKey) return;
    const summary = {
      code,
      title: room.title,
      teacherName: room.teacher_name || room.teacherName || 'Giáo viên',
      roomType: room.room_type || 'live',
      opensAt: room.opens_at || null,
      closesAt: room.closes_at || null,
      visitedAt: new Date().toISOString()
    };
    const next = [summary, ...recentRooms.filter(item => item.code !== code)].slice(0, 5);
    setRecentRooms(next);
    localStorage.setItem(recentRoomsKey, JSON.stringify(next));
  };

  const connectSocketAndJoin = (resolvedRoomCode, resolvedAttemptId, resolvedRoom) => {
    clearSocket();
    setJoiningRoom(true);

    const channel = supabase.channel(`room:${resolvedRoomCode}`, {
      config: { presence: { key: studentId } }
    });

    socketRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const onlineStudents = Object.values(channel.presenceState())
          .flat()
          .filter(meta => meta?.role === 'student' && meta?.studentId);
        const uniqueStudents = [...new Map(onlineStudents.map(meta => [meta.studentId, meta])).values()];
        setPlayers(uniqueStudents);
      })
      .on('broadcast', { event: 'quiz_started' }, () => {
        setRoomInfo(current => current ? { ...current, is_locked: true } : current);
        setPhase('waiting');
      })
      .on('broadcast', { event: 'student_list' }, ({ payload }) => {
        setPlayers(Array.isArray(payload?.students) ? payload.students : []);
      })
      .on('broadcast', { event: 'student_leave' }, ({ payload }) => {
        setPlayers(current => current.filter(player => player.studentId !== payload?.studentId));
      })
      .on('broadcast', { event: 'room_lock_changed' }, ({ payload }) => {
        setRoomInfo(current => current ? { ...current, is_locked: Boolean(payload?.locked) } : current);
      })
      .on('broadcast', { event: 'join_rejected' }, ({ payload }) => {
        if (payload?.studentId !== studentId) return;
        setError(payload.message || 'Phòng đã khóa và không nhận thêm học viên.');
        leaveRoom();
      })
      .on('broadcast', { event: 'quiz_question' }, ({ payload }) => {
        const personalizedQuestion = personalizeQuestionOptions(
          payload,
          `${resolvedRoom?.id}:${studentId}:live-options:${payload?.questionIndex}`,
          Boolean(resolvedRoom?.settings?.shuffleAnswers)
        );
        setQuestion(personalizedQuestion);
        setPhase('question');
        setSelectedAnswer(null);
        setAnswerLocked(false);
        setAnswerResult(null);
        startTimer(Number(payload?.timeLimit || 20));
      })
      .on('broadcast', { event: 'answer_ack' }, ({ payload }) => {
        if (payload?.studentId !== studentId) return;
        setAnswerResult({ isCorrect: Boolean(payload.isCorrect), points: Number(payload.points || 0) });
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
      })
      .on('broadcast', { event: 'host_ready' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'student_join',
          payload: { studentId, studentName, studentAvatar, attemptId: resolvedAttemptId }
        });
      })
      .on('broadcast', { event: 'room_closed' }, ({ payload }) => {
        showRoomClosed(payload?.message || 'Phòng đã được Giáo viên đóng.');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presencePayload = { role: 'student', studentId, studentName, studentAvatar, attemptId: resolvedAttemptId };
          await channel.track(presencePayload);
          setJoiningRoom(false);
          setJoined(true);
          setPhase('waiting');
          setError('');
          channel.send({
            type: 'broadcast',
            event: 'student_join',
            payload: { studentId, studentName, studentAvatar, attemptId: resolvedAttemptId }
          });
        }
        if (status === 'CHANNEL_ERROR') {
          setError('Không thể vào phòng quiz.');
          setJoiningRoom(false);
          setJoined(false);
          clearSocket();
        }
      });
  };

  const beginAssignmentRoom = async (room) => {
    if (!room || !studentId) return;
    setJoiningRoom(true);
    try {
      const personalizedQuestions = buildPersonalizedAssignment(room.questions, room.id, studentId, room.settings || {});
      const questionOrder = personalizedQuestions.map(item => item.sourceQuestionIndex);
      const optionOrders = Object.fromEntries(personalizedQuestions.map(item => [item.sourceQuestionIndex, item.optionIndexMap]));
      const { data: attempt, error: attemptError } = await supabase.from('quiz_attempts').upsert({
        room_id: room.id,
        student_id: studentId,
        display_name: studentName,
        avatar_url: studentAvatar,
        status: 'playing',
        question_order: questionOrder,
        option_orders: optionOrders
      }, { onConflict: 'room_id,student_id' }).select().single();
      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);
      setRoomInfo(current => ({ ...(current || room), questions: personalizedQuestions }));
      const firstQuestion = { ...personalizedQuestions[0], timeLimit: Number(room.question_time_seconds || 20) };
      setQuestion(firstQuestion);
      setPhase('question');
      setError('');
      startTimer(firstQuestion.timeLimit);
    } catch (startError) {
      reportSystemError(startError, {
        action: 'assignment_quiz_start_failed',
        component: 'StudentQuizRoomPage',
        operation: 'beginAssignmentRoom',
        supabaseCode: startError.code,
      });
      setError(startError.message || 'Không thể bắt đầu bài quiz.');
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleJoinRoom = async (requestedCode) => {
    setError('');

    if (!studentId) {
      setError('Bạn cần đăng nhập trước khi vào phòng quiz.');
      return;
    }

    const normalizedCode = normalizeRoomCode(typeof requestedCode === 'string' ? requestedCode : roomCodeInput);
    if (!normalizedCode || normalizedCode.length < 4) {
      setError('Vui lòng nhập mã phòng hợp lệ.');
      return;
    }

    setCheckingRoom(true);
    try {
      const { data: room, error: err } = await supabase
        .rpc('get_quiz_room_for_player', { p_room_code: normalizedCode });

      if (err || !room) {
        throw new Error('Phòng không tồn tại.');
      }

      const roomType = room.room_type || 'live';
      if (['closed', 'finished'].includes(room.status)) {
        throw new Error('Phòng này đã đóng và không thể tham gia lại.');
      }
      if (roomType === 'live' && room.status !== 'waiting') {
        throw new Error('Phòng quiz đang diễn ra. Hãy chờ phiên mới từ giáo viên.');
      }
      if (roomType === 'live' && room.is_locked) {
        throw new Error('Phòng đã khóa và không nhận thêm học viên.');
      }

      if (roomType === 'assignment') {
        const now = Date.now();
        if (room.archived_at) throw new Error('Bài quiz này đã được lưu trữ.');
        if (room.closes_at && now > new Date(room.closes_at).getTime()) throw new Error('Bài quiz đã hết hạn.');
      }

      const resolvedRoom = { ...room, title: room.title, teacherName: room.teacher_name || 'Giáo viên' };
      setRoomInfo(resolvedRoom);
      setRoomCode(normalizedCode);
      setRoomCodeInput(normalizedCode);
      rememberRoom(room, normalizedCode);
      if (roomType === 'assignment') {
        setJoined(true);
        if (room.opens_at && Date.now() < new Date(room.opens_at).getTime()) {
          setPhase('scheduled');
        } else {
          await beginAssignmentRoom(resolvedRoom);
        }
      } else {
        const { data: attempt, error: attemptError } = await supabase.from('quiz_attempts').upsert({
          room_id: room.id,
          student_id: studentId,
          display_name: studentName,
          avatar_url: studentAvatar,
          status: 'joined'
        }, { onConflict: 'room_id,student_id' }).select().single();
        if (attemptError) throw attemptError;
        setAttemptId(attempt.id);
        connectSocketAndJoin(normalizedCode, attempt.id, resolvedRoom);
      }
    } catch (err) {
      if (err.code || Number(err.status) >= 500) {
        reportSystemError(err, {
          action: 'quiz_room_join_failed',
          component: 'StudentQuizRoomPage',
          operation: 'handleJoinRoom',
          supabaseCode: err.code,
          statusCode: err.status,
        });
      }
      setError(err.message || 'Không thể vào phòng quiz.');
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleSelectAnswer = async (index) => {
    if (phase !== 'question' || answerLocked || !question) return;

    setSelectedAnswer(index);
    setAnswerLocked(true);
    
    if (roomInfo?.room_type === 'assignment') {
      const responseMs = Math.max(0, (question.timeLimit - timer) * 1000);
      const { data: graded, error: gradeError } = await supabase.rpc('submit_assignment_answer', {
        p_attempt_id: attemptId,
        p_question_index: Number(question.sourceQuestionIndex ?? question.questionIndex),
        p_selected_option: Number(question.optionIndexMap?.[index] ?? index),
        p_response_ms: responseMs
      });
      if (gradeError) {
        setError(gradeError.message || 'Không thể chấm câu trả lời.');
        setAnswerLocked(false);
        return;
      }
      setAssignmentScore(Number(graded.total_score || 0));
      setAnswerResult({ isCorrect: Boolean(graded.is_correct), points: Number(graded.points || 0) });
    } else if (socketRef.current) {
      // Giáo viên/chủ phòng mới là bên tính đúng-sai và điểm của phòng live.
      socketRef.current.send({
        type: 'broadcast', event: 'student_answer',
        payload: { studentId, attemptId, answerIndex: Number(question.optionIndexMap?.[index] ?? index) }
      });
    }
  };

  useEffect(() => {
    if (phase !== 'scheduled' || !roomInfo?.opens_at || joiningRoom) return;
    if (clockNow >= new Date(roomInfo.opens_at).getTime()) {
      const openScheduledRoom = setTimeout(() => beginAssignmentRoom(roomInfo), 0);
      return () => clearTimeout(openScheduledRoom);
    }
    // beginAssignmentRoom intentionally runs once when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roomInfo, clockNow, joiningRoom]);

  const handleNextAssignmentQuestion = async () => {
    const nextIndex = Number(question?.questionIndex || 0) + 1;
    if (nextIndex >= (roomInfo?.questions?.length || 0)) {
      clearTimer();
      await supabase.from('quiz_attempts').update({
        status: 'completed', score: assignmentScore,
        completed_at: new Date().toISOString()
      }).eq('id', attemptId);
      setLeaderboard([{ studentId, studentName, score: assignmentScore, rank: 1 }]);
      setPhase('ended');
      return;
    }
    const next = { ...roomInfo.questions[nextIndex], questionIndex: nextIndex, totalQuestions: roomInfo.questions.length, timeLimit: Number(roomInfo.question_time_seconds || 20) };
    setQuestion(next);
    setSelectedAnswer(null);
    setAnswerLocked(false);
    setAnswerResult(null);
    startTimer(next.timeLimit);
  };

  return (
    <div className="student-quiz-page min-h-screen pb-8 relative overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute -top-36 -left-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <header className="student-quiz-header bg-black/40 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (joined) setLeaveIntent('home');
              else navigate('/home', { replace: true });
            }}
            className="w-10 h-10 bg-white/10 border border-white/15 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Phòng Quiz</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 relative z-10">
        {!joined && (
          <section className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl shadow-black/20">
            <div className="flex justify-center mb-3">
              <object
                data={QUIZ_LOGO_URL}
                type="image/svg+xml"
                aria-label="BioQuizz"
                onLoad={prepareQuizLogo}
                className="block w-full max-w-[250px] sm:max-w-[270px] aspect-[1453.5/610.25] border-0 pointer-events-none select-none"
              >
                <span className="sr-only">BioQuizz</span>
              </object>
            </div>
            <p className="text-white/80 text-sm mb-5">Nhập mã phòng do giáo viên cấp để tham gia.</p>

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
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-white/80">1. Nhập mã phòng</div>
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-white/80">2. Chờ giáo viên bắt đầu</div>
              <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-3 text-white/80">3. Trả lời theo thời gian thực</div>
            </div>

            {recentRooms.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/15">
                <div className="flex items-center gap-2 mb-3 text-white font-bold">
                  <History className="w-5 h-5 text-cyan-300" />
                  Phòng đã mở gần đây
                </div>
                <div className="grid gap-2">
                  {recentRooms.map((recent) => {
                    const opensIn = recent.opensAt ? new Date(recent.opensAt).getTime() - clockNow : 0;
                    const expired = recent.closesAt ? clockNow > new Date(recent.closesAt).getTime() : false;
                    return (
                      <button
                        key={recent.code}
                        type="button"
                        disabled={expired}
                        onClick={() => handleJoinRoom(recent.code)}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3 text-left transition disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{recent.title}</p>
                          <p className="text-cyan-100/75 text-xs mt-1">#{recent.code} · {recent.teacherName}</p>
                          {recent.roomType === 'assignment' && opensIn > 0 && (
                            <p className="text-violet-100 text-xs mt-1">Mở sau {formatCountdown(opensIn)}</p>
                          )}
                        </div>
                        <PlayCircle className="w-6 h-6 shrink-0 text-cyan-300 group-hover:scale-110 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {joined && roomInfo && (
          <>
            {roomInfo.room_type !== 'assignment' && <section className="student-room-summary rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">{roomInfo.title || 'Quiz Room'}</h2>
                  <p className="text-cyan-100 text-sm">Mã phòng: <span className="font-mono font-bold tracking-wider">{roomCode}</span> • GV: {roomInfo.teacherName || 'Giáo viên'}</p>
                </div>
                <button
                  onClick={() => setLeaveIntent('lobby')}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Rời phòng
                </button>
              </div>
            </section>}

            <section className="student-player-panel rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-cyan-300" />
                <h3 className="text-white font-semibold">Người chơi trong phòng ({players.length})</h3>
              </div>

              {players.length === 0 ? (
                <p className="text-gray-300 text-sm">Đang chờ cập nhật danh sách người chơi...</p>
              ) : (
                <div className="quiz-player-grid">
                  {players.map((player) => (
                    <div key={player.studentId} className="quiz-player-card">
                      <img src={getAvatarUrl(player.studentAvatar || player.avatar_url)} onError={handleAvatarError} alt="" />
                      <span>{player.studentName}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {phase === 'closed' && (
              <section className="rounded-[28px] border border-rose-300/40 bg-gradient-to-br from-rose-500/25 via-red-400/15 to-violet-500/20 backdrop-blur-2xl p-7 text-center shadow-2xl shadow-red-950/25">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl border border-white/50 bg-gradient-to-br from-rose-400 to-red-600 shadow-lg shadow-red-500/25 flex items-center justify-center">
                  <DoorClosed className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-extrabold text-2xl">Phòng hiện đã đóng</h3>
                <p className="text-rose-50/90 mt-2">{closedMessage}</p>
                <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-white/25 bg-black/20 px-6 py-4">
                  <span className="text-white/75 text-xs uppercase tracking-[.16em]">Trở lại phòng chờ sau</span>
                  <strong className="text-white text-3xl mt-1 tabular-nums">{closedCountdown}</strong>
                </div>
              </section>
            )}

            {phase === 'waiting' && (
              <section className="student-wait-panel rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center">
                <p className="text-white font-semibold text-lg">Đang chờ giáo viên bắt đầu quiz...</p>
                <p className="text-gray-200/90 text-sm mt-2">Khi giáo viên bấm bắt đầu, câu hỏi sẽ hiển thị ngay tại đây.</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/30 text-yellow-100">
                  <Clock className="w-4 h-4" />
                  Sẵn sàng vào trận
                </div>
              </section>
            )}

            {phase === 'scheduled' && roomInfo?.opens_at && (
              <section className="rounded-[28px] border border-white/35 bg-gradient-to-br from-white/20 via-violet-300/10 to-cyan-300/15 backdrop-blur-2xl p-7 text-center shadow-2xl shadow-indigo-950/20">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl border border-white/60 bg-gradient-to-br from-violet-300/80 to-cyan-400/80 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                  <CalendarClock className="w-8 h-8 text-white drop-shadow" />
                </div>
                <p className="text-violet-100 text-sm font-semibold">Phòng đang chuẩn bị</p>
                <h3 className="text-white font-extrabold text-2xl mt-1">Sẽ mở lúc {new Date(roomInfo.opens_at).toLocaleString('vi-VN')}</h3>
                <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-white/25 bg-black/15 px-6 py-4">
                  <span className="text-cyan-100/75 text-xs uppercase tracking-[.18em]">Còn lại</span>
                  <strong className="text-white text-xl sm:text-2xl mt-1 tabular-nums">{formatCountdown(new Date(roomInfo.opens_at).getTime() - clockNow)}</strong>
                </div>
                <p className="text-white/65 text-sm mt-4">Bạn có thể giữ nguyên trang này. Bài quiz sẽ tự động mở khi bộ đếm về 0.</p>
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
                    {roomInfo.room_type === 'assignment' && (
                      <button onClick={handleNextAssignmentQuestion} className="mt-3 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold">
                        {question.questionIndex + 1 >= question.totalQuestions ? 'Hoàn thành bài quiz' : 'Câu tiếp theo'}
                      </button>
                    )}
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
                  onClick={() => leaveRoom({ navigateHome: true })}
                  className="mt-5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold"
                >
                  Về trang chủ
                </button>
              </section>
            )}
          </>
        )}
      </main>
      {leaveIntent && (
        <div className="quiz-leave-backdrop" role="presentation">
          <div className="quiz-leave-dialog" role="dialog" aria-modal="true" aria-labelledby="quiz-leave-title">
            <div className="quiz-leave-icon"><DoorClosed /></div>
            <div>
              <h3 id="quiz-leave-title">Xác nhận rời phòng?</h3>
              <p>Bạn sẽ được xóa khỏi danh sách người đang trực tuyến trong phòng. Lịch sử tham gia vẫn được giữ lại.</p>
            </div>
            <div className="quiz-leave-actions">
              <button type="button" onClick={() => setLeaveIntent('')}>Ở lại phòng</button>
              <button type="button" className="danger" onClick={() => leaveRoom({ navigateHome: leaveIntent === 'home' })}>Rời phòng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
