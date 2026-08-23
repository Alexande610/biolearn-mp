import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  GraduationCap, LayoutDashboard, PlusCircle, Radio, CheckCircle2,
  Clock, BookOpen, Users, FileText, Trophy, CircleAlert,
  Upload, Eye, CalendarDays, Timer, Archive, UserRoundPen, Save, BarChart3, Medal,
  LogOut, ClipboardPaste, FileUp, WandSparkles, Rocket, Smartphone, Play, UserRound
} from 'lucide-react';
import './TeacherPage.css';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function nowMs() {
  return Date.now();
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [days > 0 ? `${days} ngày` : '', `${String(hours).padStart(2, '0')} giờ`, `${String(minutes).padStart(2, '0')} phút`, `${String(seconds).padStart(2, '0')} giây`]
    .filter(Boolean)
    .join(' ');
}

function GlassIcon({ children, tone = 'cyan', compact = false }) {
  return <span className={`liquid-icon liquid-icon-${tone}${compact ? ' compact' : ''}`}>{children}</span>;
}

// 🧠 HÀM PHÂN TÍCH ĐỀ THI TRẮC NGHIỆM THÔNG MINH ĐA ĐỊNH DẠNG (UNIVERSAL QUIZ PARSER V2)
function parseUniversalQuizText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = cleanText.split('\n');

  const questions = [];
  let currentQ = null;
  let inExplanation = false;

  const finalizeQ = (q) => {
    if (!q || !q.question) return null;
    const opts = [];
    for (let i = 0; i < 4; i++) {
      opts.push(q.options[i] || `Lựa chọn ${String.fromCharCode(65 + i)}`);
    }
    return {
      question: q.question.trim(),
      options: opts,
      correctAnswer: Math.max(0, Math.min(3, q.correctAnswer || 0)),
      timeLimit: 20
    };
  };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (!line) continue;

    // Loại bỏ các ký tự bullet điểm đầu dòng như •, -, *, +, ~
    const cleanLine = line.replace(/^[•\-\*+\u2022]\s*/, '').trim();

    // Check bắt đầu Câu hỏi: "Câu 1:", "Câu 1.", "Câu 1", "Question 1:", "Q1:"
    const qMatch = cleanLine.match(/^(?:câu|câu hỏi|question|q)\s*(\d+)\s*[:.\-\)]?/i);
    if (qMatch) {
      if (currentQ && currentQ.question && currentQ.options.filter(Boolean).length >= 2) {
        const fq = finalizeQ(currentQ);
        if (fq) questions.push(fq);
      }

      inExplanation = false;
      const qText = cleanLine.replace(/^(?:câu|câu hỏi|question|q)\s*\d+\s*[:.\-\)]?\s*/i, '').trim();
      currentQ = {
        question: qText,
        options: [],
        correctAnswer: 0,
        timeLimit: 20
      };
      continue;
    }

    // Check dòng chứa đáp án đúng (Kể cả nằm dưới Lời giải)
    const ansMatch = cleanLine.match(/(?:đáp án đúng là|đáp án đúng|đáp án|answer|key|đ\/a|chọn|đáp án là)\s*[:.\-]?\s*([a-d])/i);
    if (ansMatch && currentQ) {
      const ansChar = ansMatch[1].toUpperCase();
      currentQ.correctAnswer = ansChar.charCodeAt(0) - 65;
      continue;
    }

    // Check tiêu đề Lời giải / Giải thích
    if (/^(?:lời giải|giải thích|hướng dẫn giải|hướng dẫn)\s*[:.\-]?/i.test(cleanLine)) {
      inExplanation = true;
      continue;
    }

    // Nếu đang ở phần Lời giải chi tiết thì bỏ qua các dòng phân tích
    if (inExplanation) {
      continue;
    }

    // Check dòng Lựa chọn đáp án A, B, C, D (Kể cả có bullet • A.)
    const optMatch = cleanLine.match(/^[*]?\s*([a-d])\s*[:.\-\)]\s*(.+)$/i);
    if (optMatch && currentQ) {
      const optChar = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();
      const optIdx = optChar.charCodeAt(0) - 65;

      if (cleanLine.startsWith('*') || cleanLine.toLowerCase().includes('(đúng)')) {
        currentQ.correctAnswer = optIdx;
      }

      currentQ.options[optIdx] = optText.replace(/\(đúng\)/gi, '').trim();
      continue;
    }

    // Nếu thuộc thân câu hỏi (khi chưa đến phần lựa chọn)
    if (currentQ && currentQ.options.filter(Boolean).length === 0) {
      if (currentQ.question) {
        currentQ.question += ' ' + cleanLine;
      } else {
        currentQ.question = cleanLine;
      }
    }
  }

  if (currentQ && currentQ.question && currentQ.options.filter(Boolean).length >= 2) {
    const fq = finalizeQ(currentQ);
    if (fq) questions.push(fq);
  }

  return questions;
}

// 📄 HÀM TRÍCH XUẤT VĂN BẢN TỪ FILE DOCX WORD
function extractTextFromDocxArrayBuffer(arrayBuffer) {
  try {
    const decoder = new TextDecoder('utf-8');
    const decodedText = decoder.decode(arrayBuffer);

    const pMatches = decodedText.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);
    if (pMatches && pMatches.length > 0) {
      const extractedLines = pMatches.map(pXml => {
        const tMatches = pXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (!tMatches) return '';
        return tMatches.map(tXml => tXml.replace(/<[^>]+>/g, '')).join('');
      }).filter(line => line.trim().length > 0);
      return extractedLines.join('\n');
    }

    const tMatches = decodedText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (tMatches) {
      return tMatches.map(tXml => tXml.replace(/<[^>]+>/g, '')).join('\n');
    }
  } catch (err) {
    console.error("Docx text extraction error:", err);
  }
  return '';
}

const SAMPLE_BIOLOGY_QUIZ_TEXT = `Câu 1:
Đâu là vai trò của trao đổi chất và chuyển hóa năng lượng đối với sinh vật?
•	A. Giúp sinh vật lấy được các chất từ môi trường.
•	B. Giúp sinh vật chuyển hóa các chất phức tạp thành các chất đơn giản.
•	C. Giúp sinh vật tồn tại và phát triển.
•	D. Giúp sinh vật phân giải các chất độc hại sinh ra từ quá trình chuyển hóa.
Lời giải:
Đáp án đúng là: C

Câu 2:
Quá trình nào dưới đây không phải là dấu hiệu đặc trưng của trao đổi chất và chuyển hóa năng lượng ở sinh vật?
•	A. Phân giải các chất từ môi trường và hấp thụ các chất.
•	B. Tiếp nhận các chất từ môi trường và vận chuyển các chất.
•	C. Biến đổi các chất kèm theo chuyển hóa năng lượng ở tế bào.
•	D. Thải các chất vào môi trường.
Lời giải:
Đáp án đúng là: A

Câu 3:
Quá trình chuyển hóa năng lượng trong sinh giới được chia thành mấy giai đoạn?
•	A. 2 giai đoạn.
•	B. 3 giai đoạn.
•	C. 4 giai đoạn.
•	D. 5 giai đoạn.
Lời giải:
Đáp án đúng là: B

Câu 4:
Nguồn năng lượng khởi đầu trong sinh giới là
•	A. năng lượng hóa học.
•	B. năng lượng gió.
•	C. năng lượng sinh học.
•	D. năng lượng ánh sáng.
Lời giải:
Đáp án đúng là: D

Câu 5:
Ở giai đoạn phân giải, nhờ quá trình nào mà thế năng trong các phân tử hữu cơ được biến đổi thành động năng?
•	A. Quá trình quang hợp.
•	B. Quá trình hô hấp.
•	C. Quá trình cảm ứng.
•	D. Quá trình sinh trưởng.
Lời giải:
Đáp án đúng là: B`;

export default function TeacherPage({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const channelRef = useRef(null);

  const [view, setView] = useState('dashboard'); // 'dashboard' | 'create-room' | 'room-live'
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room state
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'file'
  const [pasteText, setPasteText] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [roomType, setRoomType] = useState('live');
  const [questionTime, setQuestionTime] = useState(20);
  const [openDate, setOpenDate] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [clockNow, setClockNow] = useState(0);
  const [activeRoom, setActiveRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [quizState, setQuizState] = useState('waiting');
  const [currentQ, setCurrentQ] = useState(null);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answerDistribution, setAnswerDistribution] = useState([0, 0, 0, 0]);
  const [fastestCorrect, setFastestCorrect] = useState(null);
  const [nextCountdown, setNextCountdown] = useState(5);
  const [profileName, setProfileName] = useState(user?.displayName || user?.display_name || '');
  const [editingName, setEditingName] = useState(false);
  const timerRef = useRef(null);
  const currentQRef = useRef(null);
  const answersRef = useRef(new Map());
  const questionStartedAtRef = useRef(0);
  const nextTimerRef = useRef(null);

  useEffect(() => {
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) fetchMyRooms();
  }, [user]);

  useEffect(() => {
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const clock = setInterval(updateClock, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(nextTimerRef.current);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  async function fetchMyRooms() {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('teacher_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRooms = (data || []).map(r => ({
        ...r,
        roomCode: r.room_code,
        questionCount: r.questions ? r.questions.length : 0,
        studentCount: r.participants ? r.participants.length : 0
      }));
      setMyRooms(formattedRooms);
    } catch (e) {
      console.warn("Could not fetch quiz rooms from DB:", e.message);
      setMyRooms([]);
    }
  }

  // Phân tích file tải lên (TXT, DOCX, DOC, PDF)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus('Đang phân tích file đề thi...');

    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

    if (isDocx) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result;
          const extractedText = extractTextFromDocxArrayBuffer(arrayBuffer);
          const parsed = parseUniversalQuizText(extractedText);

          if (parsed.length > 0) {
            setQuestions(parsed);
            setUploadStatus(`Đã phân tích thành công ${parsed.length} câu hỏi từ file Word (.docx)`);
          } else {
            const fallbackReader = new FileReader();
            fallbackReader.onload = (fEvt) => {
              const rawTxt = fEvt.target.result;
              const fallbackParsed = parseUniversalQuizText(rawTxt);
              if (fallbackParsed.length > 0) {
                setQuestions(fallbackParsed);
                setUploadStatus(`Đã nhận diện ${fallbackParsed.length} câu hỏi`);
              } else {
                setUploadStatus('Chưa nhận diện được câu hỏi trong file Word. Hãy mở file Word, sao chép nội dung và dán vào tab Dán văn bản.');
              }
            };
            fallbackReader.readAsText(file);
          }
        } catch (err) {
          setUploadStatus('Lỗi xử lý file Word: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const parsed = parseUniversalQuizText(text);
          if (parsed.length > 0) {
            setQuestions(parsed);
            setUploadStatus(`Đã nhận diện thành công ${parsed.length} câu hỏi trắc nghiệm`);
          } else {
            setUploadStatus('Chưa nhận diện được câu hỏi. Hãy chuyển sang tab Dán văn bản và thử lại.');
          }
        } catch (err) {
          setUploadStatus('Lỗi khi đọc file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // Phân tích văn bản dán trực tiếp
  const handleParsePasteText = (txt) => {
    setPasteText(txt);
    if (!txt.trim()) {
      setQuestions([]);
      setUploadStatus('');
      return;
    }
    const parsed = parseUniversalQuizText(txt);
    if (parsed.length > 0) {
      setQuestions(parsed);
      setUploadStatus(`Đã nhận diện thành công ${parsed.length} câu hỏi trắc nghiệm từ văn bản dán.`);
    } else {
      setQuestions([]);
      setUploadStatus('⚠️ Chưa nhận diện được cấu trúc câu hỏi. Bạn hãy đảm bảo có cấu trúc dạng: "Câu 1: ... • A. ... • B. ... Lời giải: Đáp án đúng là: A"');
    }
  };

  // Tải mẫu đề Sinh Học mẫu
  const handleLoadSampleQuiz = () => {
    setInputMode('paste');
    setRoomTitle('Ôn Tập Sinh Học - Bài Thi Trắc Nghiệm Mẫu');
    handleParsePasteText(SAMPLE_BIOLOGY_QUIZ_TEXT);
  };

  // Tạo phòng
  const handleCreateRoom = async () => {
    if (questions.length === 0) { setError('Cần ít nhất 1 câu hỏi được nhận diện'); return; }
    const activeLiveCount = myRooms.filter(r => r.room_type === 'live' && ['waiting', 'playing'].includes(r.status)).length;
    const activeAssignmentCount = myRooms.filter(r => r.room_type === 'assignment').length;
    if (roomType === 'live' && activeLiveCount >= 1) {
      setError('Bạn chỉ được mở 1 phòng trực tuyến. Hãy kết thúc hoặc lưu trữ phòng hiện tại trước.'); return;
    }
    if (roomType === 'assignment' && activeAssignmentCount >= 2) {
      setError('Bạn chỉ được hiển thị tối đa 2 bài quiz theo lịch. Hãy lưu trữ một phòng cũ trước.'); return;
    }
    let openIso = null;
    let closeIso = null;
    if (roomType === 'assignment') {
      const openMoment = new Date(`${openDate}T${openTime}`);
      const closeMoment = new Date(`${closeDate}T${closeTime}`);
      if (!openDate || !openTime || !closeDate || !closeTime || Number.isNaN(openMoment.getTime()) || Number.isNaN(closeMoment.getTime())) {
        setError('Hãy chọn đầy đủ ngày và giờ mở/đóng bằng bộ lịch.'); return;
      }
      if (openMoment.getTime() <= Date.now()) {
        setError('Thời gian mở phải nằm sau thời điểm hiện tại.'); return;
      }
      if (closeMoment <= openMoment) {
        setError('Thời gian đóng phải sau thời gian mở.'); return;
      }
      if (closeMoment - openMoment > 7 * 24 * 60 * 60 * 1000) {
        setError('Bài quiz theo lịch chỉ được mở tối đa 7 ngày.'); return;
      }
      openIso = openMoment.toISOString();
      closeIso = closeMoment.toISOString();
    }
    setLoading(true); setError('');
    try {
      const code = createRoomCode();

      const { data, error } = await supabase.from('quiz_rooms').insert([{
        room_code: code,
        teacher_id: user.id,
        title: roomTitle || 'Phòng thi đấu Sinh Học',
        status: 'waiting',
        room_type: roomType,
        opens_at: openIso,
        closes_at: closeIso,
        question_time_seconds: Number(questionTime),
        intermission_seconds: 5,
        questions: questions,
        settings: { timePerQuestion: Number(questionTime), intermissionSeconds: 5 }
      }]).select().single();

      if (error) throw error;

      const roomData = { ...data, roomCode: data.room_code };
      if (roomType === 'live') {
        openRoomSocket(roomData);
        setActiveRoom(roomData);
        setView('room-live');
      } else {
        setView('dashboard');
      }
      fetchMyRooms();
    } catch (e) {
      setError(e.message || 'Không thể tạo phòng. Hãy kiểm tra migration Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime Socket
  const openRoomSocket = (room) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    let currentStudents = [];
    const channel = supabase.channel(`room:${room.roomCode}`, {
      config: { presence: { key: user.id } }
    });

    channelRef.current = channel;

    const broadcastStudentList = () => {
      channel.send({
        type: 'broadcast',
        event: 'student_list',
        payload: { students: currentStudents }
      });
    };

    channel
      .on('broadcast', { event: 'student_join' }, ({ payload }) => {
        if (!currentStudents.some((student) => student.studentId === payload.studentId)) {
          currentStudents.push({ ...payload, score: 0 });
        }
        setStudents([...currentStudents]);
        broadcastStudentList();
      })
      .on('broadcast', { event: 'student_answer' }, ({ payload }) => {
        const q = currentQRef.current;
        if (!q || answersRef.current.has(payload.studentId)) return;
        const std = currentStudents.find(s => s.studentId === payload.studentId);
        if (std) {
          const responseMs = Math.max(0, nowMs() - questionStartedAtRef.current);
          const isCorrect = Number(payload.answerIndex) === Number(q.correctAnswer);
          const speedRatio = Math.max(0, 1 - responseMs / (q.timeLimit * 1000));
          const points = isCorrect ? Math.round(500 + 500 * speedRatio) : 0;
          std.score = (std.score || 0) + points;
          std.lastAnswerTime = responseMs;
          std.correctCount = (std.correctCount || 0) + (isCorrect ? 1 : 0);
          answersRef.current.set(payload.studentId, { ...payload, responseMs, isCorrect, points, studentName: std.studentName });
          channel.send({
            type: 'broadcast', event: 'answer_ack',
            payload: { studentId: payload.studentId, isCorrect, points }
          });
          if (payload.attemptId) {
            supabase.from('quiz_answers').insert({
              attempt_id: payload.attemptId, room_id: room.id, student_id: payload.studentId,
              question_index: q.questionIndex, selected_option: payload.answerIndex,
              is_correct: isCorrect, response_ms: responseMs, points
            }).then(() => supabase.from('quiz_attempts').update({
              score: std.score, correct_count: std.correctCount, status: 'playing'
            }).eq('id', payload.attemptId));
          }
        }
        setStudents([...currentStudents]);
        broadcastStudentList();
      })
      .subscribe();

    channel.currentStudents = currentStudents;
  };

  const handleStartQuiz = async () => {
    if (!channelRef.current || !activeRoom) return;

    const { error: startError } = await supabase.from('quiz_rooms').update({
      status: 'playing', current_question_index: 0, started_at: new Date().toISOString()
    }).eq('id', activeRoom.id);
    if (startError) { setError(startError.message); return; }

    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_started',
      payload: { startedAt: nowMs() }
    });

    setQuizState('playing');
    setTimeout(() => {
      playQuestion(0);
    }, 2000);
  };

  const playQuestion = (qIndex) => {
    const qData = activeRoom.questions[qIndex];
    if (!qData) {
      handleEndQuiz();
      return;
    }

    const questionPayload = {
      ...qData,
      questionIndex: qIndex,
      totalQuestions: activeRoom.questions.length,
      timeLimit: Number(activeRoom.question_time_seconds || activeRoom.settings?.timePerQuestion || 20)
    };

    setCurrentQ(questionPayload);
    currentQRef.current = questionPayload;
    answersRef.current = new Map();
    questionStartedAtRef.current = nowMs();
    setQuizState('question');
    setTimer(questionPayload.timeLimit);

    const { correctAnswer: _privateAnswer, explanation: _privateExplanation, ...safeQuestionPayload } = questionPayload;
    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_question',
      payload: safeQuestionPayload
    });

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          showResult();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const showResult = async () => {
    const q = currentQRef.current;
    const answers = [...answersRef.current.values()];
    const distribution = [0, 0, 0, 0];
    answers.forEach(answer => { if (answer.answerIndex >= 0 && answer.answerIndex < 4) distribution[answer.answerIndex] += 1; });
    const fastest = answers.filter(answer => answer.isCorrect).sort((a, b) => a.responseMs - b.responseMs)[0] || null;
    const lb = [...(channelRef.current?.currentStudents || [])]
      .sort((a, b) => b.score - a.score || a.lastAnswerTime - b.lastAnswerTime)
      .map((student, index) => ({ ...student, rank: index + 1 }));
    setLeaderboard([...lb]);
    setAnswerDistribution(distribution);
    setFastestCorrect(fastest);
    setNextCountdown(5);
    setQuizState('result');

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'quiz_result',
        payload: { leaderboard: lb, distribution, fastestCorrect: fastest, correctAnswer: q?.correctAnswer, nextIn: 5 }
      });
    }
    clearInterval(nextTimerRef.current);
    let remaining = 5;
    nextTimerRef.current = setInterval(() => {
      remaining -= 1;
      setNextCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(nextTimerRef.current);
        handleNextQuestion();
      }
    }, 1000);
  };

  const handleNextQuestion = async () => {
    const activeQuestion = currentQRef.current;
    if (!activeRoom || !activeQuestion) return;
    clearInterval(nextTimerRef.current);
    const nextIdx = activeQuestion.questionIndex + 1;
    const { error: nextError } = await supabase.from('quiz_rooms').update({ current_question_index: nextIdx }).eq('id', activeRoom.id);
    if (nextError) { setError(nextError.message); return; }
    playQuestion(nextIdx);
  };

  const handleEndQuiz = async () => {
    const finalLb = [...(channelRef.current?.currentStudents || [])]
      .sort((a, b) => b.score - a.score)
      .map((student, index) => ({ ...student, rank: index + 1 }));
    try {
      await supabase
        .from('quiz_rooms')
        .update({
          status: 'finished',
          ended_at: new Date().toISOString(),
          participants: finalLb
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error updating quiz participants in DB:', err);
    }
    setQuizState('ended');
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'quiz_ended',
        payload: { leaderboard: finalLb }
      });
    }
  };

  const handleArchiveRoom = async (roomId) => {
    const { error: archiveError } = await supabase.from('quiz_rooms')
      .update({ archived_at: new Date().toISOString() }).eq('id', roomId).eq('teacher_id', user.id);
    if (archiveError) setError(archiveError.message);
    else fetchMyRooms();
  };

  const handleSaveProfileName = async () => {
    const cleanName = profileName.trim();
    if (cleanName.length < 2) { setError('Tên hiển thị cần ít nhất 2 ký tự.'); return; }
    const { error: nameError } = await supabase.from('profiles').update({ display_name: cleanName }).eq('id', user.id);
    if (nameError) setError(nameError.message);
    else setEditingName(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const scheduledOpenMoment = openDate && openTime ? new Date(`${openDate}T${openTime}`).getTime() : 0;

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  if (!user) return null;

  return (
    <div className="teacher-page">
      {/* Sidebar Navigation */}
      <aside className="teacher-sidebar">
        <div className="sidebar-logo">
          <GlassIcon tone="cyan"><GraduationCap /></GlassIcon>
          <div className="sidebar-identity">
            {editingName ? (
              <div className="profile-name-editor">
                <input value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={60} aria-label="Tên hiển thị Giáo viên" />
                <button onClick={handleSaveProfileName} aria-label="Lưu tên"><Save size={15} /></button>
              </div>
            ) : (
              <button className="sidebar-name editable" onClick={() => setEditingName(true)} title="Đổi tên hiển thị">
                {profileName || user.email}<UserRoundPen size={14} />
              </button>
            )}
            <div className="sidebar-role">Giáo viên Quản Lý</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
            <GlassIcon tone="blue" compact><LayoutDashboard /></GlassIcon>
            <span>Bảng điều khiển</span>
          </button>
          <button className={view === 'create-room' ? 'active' : ''} onClick={() => setView('create-room')}>
            <GlassIcon tone="mint" compact><PlusCircle /></GlassIcon>
            <span>Tạo phòng Quiz</span>
          </button>
          {activeRoom && (
            <button className={view === 'room-live' ? 'active' : ''} onClick={() => setView('room-live')}>
              <Radio className="w-4 h-4 inline-block mr-2 text-red-400 animate-pulse" />
              <span>Phòng đang mở</span>
            </button>
          )}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <GlassIcon tone="rose" compact><LogOut /></GlassIcon>
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="teacher-main">

        {/* 📊 DASHBOARD */}
        {view === 'dashboard' && (
          <div className="teacher-dashboard">
            <h2 className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-cyan-400" />
              <span>Bảng Điều Khiển Giáo Viên</span>
            </h2>

            <div className="dash-stats">
              <div className="stat-card">
                <GlassIcon tone="cyan"><BookOpen /></GlassIcon>
                <div>
                  <b>{myRooms.length}</b>
                  <small>Tổng số phòng</small>
                </div>
              </div>
              <div className="stat-card">
                <GlassIcon tone="mint"><Radio /></GlassIcon>
                <div>
                  <b>{myRooms.filter(r => r.status === 'playing').length}</b>
                  <small>Đang chạy live</small>
                </div>
              </div>
              <div className="stat-card">
                <GlassIcon tone="violet"><CheckCircle2 /></GlassIcon>
                <div>
                  <b>{myRooms.filter(r => r.status === 'finished').length}</b>
                  <small>Đã kết thúc</small>
                </div>
              </div>
            </div>

            <h3 className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Danh Sách Phòng Quiz Gần Đây</span>
            </h3>

            {myRooms.length === 0 ? (
              <div className="empty-state">
                Chưa có phòng thi nào. <button onClick={() => setView('create-room')}>Tạo ngay phòng Quiz mới →</button>
              </div>
            ) : (
              <div className="rooms-list">
                {myRooms.map(room => (
                  <div className="room-card" key={room.roomCode}>
                    <div className="room-code">#{room.roomCode}</div>
                    <div className="room-info">
                      <b>{room.title}</b>
                      <small>{room.room_type === 'assignment' ? 'Theo lịch' : 'Trực tuyến'} · {room.questionCount} câu hỏi · {room.studentCount} học sinh</small>
                      {room.room_type === 'assignment' && room.opens_at && new Date(room.opens_at).getTime() > clockNow && (
                        <small className="room-opening-countdown">Mở sau {formatCountdown(new Date(room.opens_at).getTime() - clockNow)}</small>
                      )}
                    </div>
                    <div className={`room-status ${room.status}`}>
                      {room.status === 'waiting' ? 'Đang chờ' : room.status === 'playing' ? 'Live' : 'Hoàn thành'}
                    </div>
                    <button className="room-archive" onClick={() => handleArchiveRoom(room.id)} title="Ẩn phòng khỏi màn hình, vẫn giữ toàn bộ dữ liệu"><Archive size={16} /> Lưu trữ</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE ROOM */}
        {view === 'create-room' && (
          <div className="create-room">
            <h2 className="flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
              <span>Tạo Phòng Quiz Trắc Nghiệm Mới</span>
            </h2>

            {error && <div className="teacher-error"><CircleAlert size={18} /> {error}</div>}

            <div className="form-section">
              <label>Tên phòng Quiz trắc nghiệm</label>
              <input
                value={roomTitle}
                onChange={e => setRoomTitle(e.target.value)}
                placeholder="VD: Ôn tập Chương 1 - Tế bào & Đơn vị sống"
                className="teacher-input"
              />
            </div>

            <div className="room-mode-grid">
              <button className={roomType === 'live' ? 'mode-card active live-mode' : 'mode-card live-mode'} onClick={() => setRoomType('live')}>
                <GlassIcon tone="cyan"><Radio /></GlassIcon>
                <span><b>Trực tuyến có Giáo viên</b><small>Sảnh chờ, từng câu theo giờ, biểu đồ và xếp hạng trực tiếp</small></span>
                <i className="mode-check"><CheckCircle2 /></i>
              </button>
              <button className={roomType === 'assignment' ? 'mode-card active schedule-mode' : 'mode-card schedule-mode'} onClick={() => setRoomType('assignment')}>
                <GlassIcon tone="violet"><CalendarDays /></GlassIcon>
                <span><b>Quiz theo lịch</b><small>Học sinh tự làm trong khung giờ, tối đa 7 ngày</small></span>
                <i className="mode-check"><CheckCircle2 /></i>
              </button>
            </div>

            <div className="schedule-grid">
              <label className="glass-field"><GlassIcon tone="amber" compact><Timer /></GlassIcon><span>Thời gian mỗi câu</span>
                <select value={questionTime} onChange={e => setQuestionTime(Number(e.target.value))}>
                  {[10, 15, 20, 30, 45, 60, 90].map(value => <option key={value} value={value}>{value} giây</option>)}
                </select>
              </label>
              {roomType === 'assignment' && <>
                <div className="glass-field date-time-field">
                  <div className="field-heading"><GlassIcon tone="cyan" compact><CalendarDays /></GlassIcon><span>Mở từ</span></div>
                  <div className="date-time-pair">
                    <label>Ngày<input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} /></label>
                    <label>Giờ<input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} /></label>
                  </div>
                </div>
                <div className="glass-field date-time-field">
                  <div className="field-heading"><GlassIcon tone="violet" compact><CalendarDays /></GlassIcon><span>Đóng lúc</span></div>
                  <div className="date-time-pair">
                    <label>Ngày<input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} /></label>
                    <label>Giờ<input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} /></label>
                  </div>
                </div>
              </>}
            </div>

            {roomType === 'assignment' && scheduledOpenMoment > clockNow && (
              <div className="schedule-countdown-preview">
                <GlassIcon tone="violet"><Clock /></GlassIcon>
                <div><span>Phòng sẽ mở sau</span><strong>{formatCountdown(scheduledOpenMoment - clockNow)}</strong></div>
              </div>
            )}

            {/* Chọn hình thức nạp câu hỏi */}
            <div className="upload-section">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="font-extrabold text-base">Nhập Đề Thi Trắc Nghiệm</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${inputMode === 'paste' ? 'bg-cyan-500 text-white shadow-md' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                  >
                    <ClipboardPaste size={15} /> Dán Văn Bản (Ctrl+V)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${inputMode === 'file' ? 'bg-cyan-500 text-white shadow-md' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                  >
                    <FileUp size={15} /> Upload File (.txt, .docx)
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleQuiz}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <WandSparkles size={15} /> Nạp Đề Mẫu Chuẩn
                  </button>
                </div>
              </div>

              {inputMode === 'paste' ? (
                <div className="paste-area-container">
                  <p className="quiz-helper-text">
                    <ClipboardPaste size={15} /> Bạn hãy copy (Ctrl+C) đề thi trắc nghiệm từ Word / Website rồi dán (Ctrl+V) vào ô dưới đây:
                  </p>
                  <textarea
                    rows={10}
                    value={pasteText}
                    onChange={e => handleParsePasteText(e.target.value)}
                    placeholder={`Câu 1:\nĐâu là vai trò của trao đổi chất đối với sinh vật?\n• A. Giúp sinh vật lấy được các chất từ môi trường.\n• B. Giúp sinh vật chuyển hóa...\n• C. Giúp sinh vật tồn tại và phát triển.\n• D. Giúp sinh vật phân giải...\nLời giải:\nĐáp án đúng là: C\n\nCâu 2:...`}
                    className="teacher-input font-mono text-sm leading-relaxed p-3.5"
                  />
                </div>
              ) : (
                <>
                  <div className="upload-format">
                    <p><b>Định dạng được hỗ trợ tự động:</b> File <code>.txt</code>, <code>.docx (Word)</code>, <code>.pdf</code></p>
                    <pre>{`Câu 1: Quá trình quang hợp diễn ra ở đâu?
A. Lục lạp
B. Ti thể
C. Nhược thể
D. Lưới nội chất
Đáp án: A`}</pre>
                  </div>

                  <label className="upload-btn cursor-pointer">
                    <FileUp size={17} /> Chọn file đề thi từ máy tính (TXT, DOCX, DOC)
                    <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} hidden />
                  </label>
                </>
              )}

              {uploadStatus && (
                <div className="upload-status mt-3 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs font-bold leading-relaxed">
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Xem trước danh sách câu hỏi */}
            {questions.length > 0 && (
              <div className="questions-preview">
                <h3 className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <span>Đã nhận diện thành công ({questions.length} câu hỏi)</span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">✓ Đủ điều kiện tạo phòng</span>
                </h3>

                {questions.slice(0, 5).map((q, i) => (
                  <div className="q-preview" key={i}>
                    <b>{i + 1}. {q.question}</b>
                    <div className="q-options">
                      {q.options.map((opt, j) => (
                        <span key={j} className={j === q.correctAnswer ? 'correct' : ''}>
                          {String.fromCharCode(65 + j)}. {opt} {j === q.correctAnswer && '✓ (Đáp án đúng)'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {questions.length > 5 && <p className="q-more">... và còn {questions.length - 5} câu hỏi nữa</p>}
              </div>
            )}

            <button className="btn-create-room" onClick={handleCreateRoom} disabled={loading || questions.length === 0}>
              {loading ? <><span className="button-spinner" />Đang tạo phòng...</> : <><Rocket size={20} />Tạo Phòng Quiz ({questions.length} câu hỏi)</>}
            </button>
          </div>
        )}

        {/* ROOM LIVE */}
        {view === 'room-live' && activeRoom && (
          <div className="room-live">
            <div className="room-header">
              <div>
                <h2 className="flex items-center gap-2">
                  <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                  <span>{activeRoom.title}</span>
                </h2>
                <div className="room-code-display">Mã kết nối phòng: <strong>{activeRoom.roomCode}</strong></div>
              </div>
              <div className="room-qr">
                <div className="qr-placeholder"><Smartphone size={18} /> Mã cho học sinh: <b>{activeRoom.roomCode}</b></div>
              </div>
            </div>

            {/* Student Joined List */}
            <div className="students-joined">
              <h3 className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Học sinh đã tham gia phòng ({students.length})</span>
              </h3>
              <div className="student-chips">
                {students.map(s => (
                  <div className="student-chip" key={s.studentId}>
                    <GlassIcon tone="cyan" compact><UserRound /></GlassIcon>
                    <span>{s.studentName}</span>
                  </div>
                ))}
                {students.length === 0 && <p className="empty-students">Đang chờ học sinh kết nối vào phòng...</p>}
              </div>
            </div>

            {/* Room Controls */}
            {quizState === 'waiting' && (
              <button className="btn-start-quiz" onClick={handleStartQuiz} disabled={students.length === 0}>
                <Play size={20} /> Bắt Đầu Thi Đấu Quiz {students.length > 0 ? `(${students.length} học sinh)` : '(Đang chờ học sinh)'}
              </button>
            )}

            {quizState === 'question' && currentQ && (
              <div className="live-question">
                <div className="q-progress">Câu {currentQ.questionIndex + 1} / {currentQ.totalQuestions}</div>
                <div className="q-timer" style={{ '--pct': `${(timer / currentQ.timeLimit) * 100}%` }}>{timer}s</div>
                <div className="q-text">{currentQ.question}</div>
                <div className="q-options-grid">
                  {currentQ.options.map((opt, i) => (
                    <div className="q-option-box" key={i} style={{ background: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i] }}>
                      <span>{['▲', '◆', '●', '■'][i]}</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizState === 'result' && (
              <div className="live-result">
                <h3><BarChart3 size={22} /> Kết quả câu hỏi</h3>
                <div className="answer-chart">
                  {answerDistribution.map((count, i) => (
                    <div key={i} className={i === currentQ?.correctAnswer ? 'chart-column correct' : 'chart-column'}>
                      <span>{count}</span><i style={{ height: `${Math.max(10, count * 24)}px` }} /><b>{String.fromCharCode(65 + i)}</b>
                    </div>
                  ))}
                </div>
                <p className="fastest-answer"><Medal size={18} /> {fastestCorrect ? `${fastestCorrect.studentName} trả lời đúng nhanh nhất (${(fastestCorrect.responseMs / 1000).toFixed(1)}s)` : 'Chưa có câu trả lời đúng'}</p>
                <div className="leaderboard">
                  {leaderboard.slice(0, 5).map((s, i) => (
                    <div className="lb-row" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#fff' }}>{i + 1}</span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-next-q" onClick={handleNextQuestion}>Câu tiếp theo sau {nextCountdown}s</button>
              </div>
            )}

            {quizState === 'ended' && (
              <div className="quiz-ended">
                <h2 className="flex items-center justify-center gap-2">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <span>Quiz Hoàn Thành!</span>
                </h2>
                <div className="final-leaderboard">
                  {leaderboard.map((s, i) => (
                    <div className="lb-row final" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#aaa', fontSize: i < 3 ? '24px' : '18px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-new-room" onClick={() => { setView('create-room'); setActiveRoom(null); setQuizState('waiting'); }}>
                  <PlusCircle size={18} /> Tạo Phòng Mới
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
