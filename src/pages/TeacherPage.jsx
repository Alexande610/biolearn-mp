import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  GraduationCap, LayoutDashboard, PlusCircle, Radio, CheckCircle2,
  Clock, BookOpen, Users, FileText, Trophy, CircleAlert,
  Upload, Eye, CalendarDays, Timer, Archive, UserRoundPen, Save, BarChart3, Medal,
  LogOut, ClipboardPaste, FileUp, WandSparkles, Rocket, Play,
  Copy, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, History,
  DoorClosed, RotateCcw, ListChecks, Search, LockKeyhole, UnlockKeyhole, Download
} from 'lucide-react';
import './TeacherPage.css';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';
import { reportSystemError } from '../lib/observability';

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

const toLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTimeValue = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const parseLocalDate = (value) => value ? new Date(`${value}T00:00:00`) : null;

function LiquidDatePicker({ value, onChange, label, minDate }) {
  const selectedDate = parseLocalDate(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => selectedDate || new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minimum = minDate ? parseLocalDate(minDate) : null;
  const todayValue = toLocalDateValue(new Date());

  const chooseDay = (day) => {
    onChange(toLocalDateValue(new Date(year, month, day)));
    setOpen(false);
  };

  return (
    <div className="liquid-picker">
      <button type="button" className={`liquid-picker-trigger ${value ? 'has-value' : ''}`} onClick={() => {
        if (!open) setCursor(selectedDate || new Date());
        setOpen(current => !current);
      }}>
        <CalendarDays size={17} />
        <span>{value ? selectedDate.toLocaleDateString('vi-VN') : label}</span>
      </button>
      {open && (
        <div className="liquid-calendar-popover">
          <div className="liquid-calendar-heading">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Tháng trước"><ChevronLeft size={18} /></button>
            <strong>Tháng {month + 1}, {year}</strong>
            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Tháng sau"><ChevronRight size={18} /></button>
          </div>
          <div className="liquid-calendar-weekdays">{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <span key={day}>{day}</span>)}</div>
          <div className="liquid-calendar-days">
            {Array.from({ length: firstWeekday }).map((_, index) => <i key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
              const date = new Date(year, month, day);
              const dateValue = toLocalDateValue(date);
              const disabled = minimum && date < minimum;
              return (
                <button
                  type="button"
                  key={day}
                  disabled={disabled}
                  className={`${dateValue === value ? 'selected' : ''} ${dateValue === todayValue ? 'today' : ''}`}
                  onClick={() => chooseDay(day)}
                >{day}</button>
              );
            })}
          </div>
          <button type="button" className="liquid-today-button" onClick={() => { onChange(todayValue); setCursor(new Date()); setOpen(false); }}>Hôm nay</button>
        </div>
      )}
    </div>
  );
}

function LiquidTimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(value?.split(':')[0] || '08');
  const [draftMinute, setDraftMinute] = useState(value?.split(':')[1] || '00');

  return (
    <div className="liquid-picker">
      <button type="button" className={`liquid-picker-trigger ${value ? 'has-value' : ''}`} onClick={() => {
        if (!open && value) {
          const [hour, minute] = value.split(':');
          setDraftHour(hour);
          setDraftMinute(minute);
        }
        setOpen(current => !current);
      }}>
        <Clock size={17} />
        <span>{value || label}</span>
      </button>
      {open && (
        <div className="liquid-time-popover">
          <div className="liquid-time-title"><Clock size={17} /><strong>Chọn giờ</strong></div>
          <div className="liquid-time-columns">
            <div><span>Giờ</span><div className="time-option-list">{Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')).map(hour => <button type="button" key={hour} className={draftHour === hour ? 'selected' : ''} onClick={() => setDraftHour(hour)}>{hour}</button>)}</div></div>
            <b>:</b>
            <div><span>Phút</span><div className="time-option-list minute-list">{Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map(minute => <button type="button" key={minute} className={draftMinute === minute ? 'selected' : ''} onClick={() => setDraftMinute(minute)}>{minute}</button>)}</div></div>
          </div>
          <button type="button" className="liquid-time-confirm" onClick={() => { onChange(`${draftHour}:${draftMinute}`); setOpen(false); }}>Xác nhận {draftHour}:{draftMinute}</button>
        </div>
      )}
    </div>
  );
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
    const cleanLine = line.replace(/^[•*+\u2022-]\s*/, '').trim();

    // Check bắt đầu Câu hỏi: "Câu 1:", "Câu 1.", "Câu 1", "Question 1:", "Q1:"
    const qMatch = cleanLine.match(/^(?:câu|câu hỏi|question|q)\s*(\d+)\s*[:.)-]?/i);
    if (qMatch) {
      if (currentQ && currentQ.question && currentQ.options.filter(Boolean).length >= 2) {
        const fq = finalizeQ(currentQ);
        if (fq) questions.push(fq);
      }

      inExplanation = false;
      const qText = cleanLine.replace(/^(?:câu|câu hỏi|question|q)\s*\d+\s*[:.)-]?\s*/i, '').trim();
      currentQ = {
        question: qText,
        options: [],
        correctAnswer: 0,
        timeLimit: 20
      };
      continue;
    }

    // Check dòng chứa đáp án đúng (Kể cả nằm dưới Lời giải)
    const ansMatch = cleanLine.match(/(?:đáp án đúng là|đáp án đúng|đáp án|answer|key|đ\/a|chọn|đáp án là)\s*[:.-]?\s*([a-d])/i);
    if (ansMatch && currentQ) {
      const ansChar = ansMatch[1].toUpperCase();
      currentQ.correctAnswer = ansChar.charCodeAt(0) - 65;
      continue;
    }

    // Check tiêu đề Lời giải / Giải thích
    if (/^(?:lời giải|giải thích|hướng dẫn giải|hướng dẫn)\s*[:.-]?/i.test(cleanLine)) {
      inExplanation = true;
      continue;
    }

    // Nếu đang ở phần Lời giải chi tiết thì bỏ qua các dòng phân tích
    if (inExplanation) {
      continue;
    }

    // Check dòng Lựa chọn đáp án A, B, C, D (Kể cả có bullet • A.)
    const optMatch = cleanLine.match(/^[*]?\s*([a-d])\s*[:.)-]\s*(.+)$/i);
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

  const [view, setView] = useState('dashboard'); // dashboard | create-room | room-live | history
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room state
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'file'
  const [pasteText, setPasteText] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndexes, setSelectedQuestionIndexes] = useState([]);
  const [questionFontSize, setQuestionFontSize] = useState(15);
  const [questionFontFamily, setQuestionFontFamily] = useState('Inter');
  const [shuffleQuiz, setShuffleQuiz] = useState(false);
  const [reopenSourceRoom, setReopenSourceRoom] = useState(null);
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
  const [copiedRoomCode, setCopiedRoomCode] = useState('');
  const [pendingCloseRoom, setPendingCloseRoom] = useState(null);
  const [closingRoomId, setClosingRoomId] = useState('');
  const [historyRoom, setHistoryRoom] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPanelMode, setHistoryPanelMode] = useState('details');
  const timerRef = useRef(null);
  const currentQRef = useRef(null);
  const answersRef = useRef(new Map());
  const questionStartedAtRef = useRef(0);
  const nextTimerRef = useRef(null);
  const restoredRoomRef = useRef('');
  const activeRoomRef = useRef(null);

  useEffect(() => {
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.id) fetchMyRooms();
    // Fetch lại khi đổi tài khoản; các lần làm mới tiếp theo được gọi sau thao tác CRUD.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const clock = setInterval(updateClock, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

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
        .order('created_at', { ascending: false });

      if (error) throw error;

      let roomRows = data || [];
      const expiredAt = new Date().toISOString();
      const expiredAssignmentIds = roomRows
        .filter(room => room.room_type === 'assignment' && ['waiting', 'playing'].includes(room.status) && room.closes_at && new Date(room.closes_at).getTime() <= Date.now())
        .map(room => room.id);
      if (expiredAssignmentIds.length > 0) {
        const { error: expireError } = await supabase.from('quiz_rooms').update({
          status: 'closed', closed_at: expiredAt, ended_at: expiredAt,
          close_reason: 'expired', live_state: { phase: 'closed', reason: 'expired', closed_at: expiredAt }
        }).in('id', expiredAssignmentIds).eq('teacher_id', user.id);
        if (!expireError) {
          const expiredIds = new Set(expiredAssignmentIds);
          roomRows = roomRows.map(room => expiredIds.has(room.id)
            ? { ...room, status: 'closed', closed_at: expiredAt, ended_at: expiredAt, close_reason: 'expired' }
            : room);
        }
      }

      const roomIds = roomRows.map(room => room.id);
      let attemptCounts = new Map();
      if (roomIds.length > 0) {
        const { data: attemptRows, error: attemptsCountError } = await supabase
          .from('quiz_attempts')
          .select('room_id')
          .in('room_id', roomIds);
        if (!attemptsCountError) {
          attemptCounts = (attemptRows || []).reduce((counts, attempt) => {
            counts.set(attempt.room_id, (counts.get(attempt.room_id) || 0) + 1);
            return counts;
          }, new Map());
        }
      }

      const formattedRooms = roomRows.map(r => ({
        ...r,
        roomCode: r.room_code,
        questionCount: r.questions ? r.questions.length : 0,
        studentCount: attemptCounts.get(r.id) || (r.participants ? r.participants.length : 0)
      }));
      setMyRooms(formattedRooms);

      const resumableRoom = formattedRooms.find(room =>
        room.room_type === 'live'
        && !room.archived_at
        && ['waiting', 'playing'].includes(room.status)
      );

      if (resumableRoom && (restoredRoomRef.current !== resumableRoom.id || !channelRef.current)) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('id, student_id, display_name, avatar_url, score, correct_count, status')
          .eq('room_id', resumableRoom.id)
          .order('started_at', { ascending: true });
        const restoredStudents = (attempts || []).map(attempt => ({
          studentId: attempt.student_id,
          attemptId: attempt.id,
          studentName: attempt.display_name,
          studentAvatar: attempt.avatar_url,
          score: Number(attempt.score || 0),
          correctCount: Number(attempt.correct_count || 0),
        }));
        restoredRoomRef.current = resumableRoom.id;
        activeRoomRef.current = resumableRoom;
        setActiveRoom(resumableRoom);
        openRoomSocket(resumableRoom, restoredStudents);
        await restoreLiveRoomSession(resumableRoom, restoredStudents);
      }
    } catch (e) {
      console.warn("Could not fetch quiz rooms from DB:", e.message);
      reportSystemError(e, {
        action: 'teacher_rooms_load_failed',
        component: 'TeacherPage',
        operation: 'fetchMyRooms',
        supabaseCode: e.code,
      });
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
            setSelectedQuestionIndexes([]);
            setUploadStatus(`Đã phân tích thành công ${parsed.length} câu hỏi từ file Word (.docx)`);
          } else {
            const fallbackReader = new FileReader();
            fallbackReader.onload = (fEvt) => {
              const rawTxt = fEvt.target.result;
              const fallbackParsed = parseUniversalQuizText(rawTxt);
              if (fallbackParsed.length > 0) {
                setQuestions(fallbackParsed);
                setSelectedQuestionIndexes([]);
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
            setSelectedQuestionIndexes([]);
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
      setSelectedQuestionIndexes([]);
      setUploadStatus('');
      return;
    }
    const parsed = parseUniversalQuizText(txt);
    if (parsed.length > 0) {
      setQuestions(parsed);
      setSelectedQuestionIndexes([]);
      setUploadStatus(`Đã nhận diện thành công ${parsed.length} câu hỏi trắc nghiệm từ văn bản dán.`);
    } else {
      setQuestions([]);
      setSelectedQuestionIndexes([]);
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
    const activeLiveCount = myRooms.filter(r => r.room_type === 'live' && !r.archived_at && ['waiting', 'playing'].includes(r.status)).length;
    const activeAssignmentCount = myRooms.filter(r => r.room_type === 'assignment' && !r.archived_at && ['waiting', 'playing'].includes(r.status)).length;
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
      const code = reopenSourceRoom?.roomCode || createRoomCode();
      const inheritedSeriesId = reopenSourceRoom?.room_series_id || reopenSourceRoom?.id || null;

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
        settings: {
          timePerQuestion: Number(questionTime), intermissionSeconds: 5,
          editorFontSize: questionFontSize, editorFontFamily: questionFontFamily,
          shuffleQuestions: roomType === 'assignment' && shuffleQuiz,
          shuffleAnswers: shuffleQuiz
        },
        is_locked: false,
        live_state: roomType === 'live' ? { phase: 'waiting', question_index: 0 } : {},
        reopened_from_id: reopenSourceRoom?.id || null,
        room_series_id: inheritedSeriesId,
        revision: reopenSourceRoom ? Number(reopenSourceRoom.revision || 1) + 1 : 1
      }]).select().single();

      if (error) throw error;

      const roomData = { ...data, roomCode: data.room_code };
      if (roomType === 'live') {
        restoredRoomRef.current = roomData.id;
        activeRoomRef.current = roomData;
        openRoomSocket(roomData);
        setActiveRoom(roomData);
        setView('room-live');
      } else {
        setView('dashboard');
      }
      setReopenSourceRoom(null);
      fetchMyRooms();
    } catch (e) {
      reportSystemError(e, {
        action: 'teacher_room_create_failed',
        component: 'TeacherPage',
        operation: 'createRoom',
        supabaseCode: e.code,
      });
      setError(e.message || 'Không thể tạo phòng. Hãy kiểm tra migration Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime Socket
  function openRoomSocket(room, initialStudents = []) {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    let currentStudents = [...initialStudents];
    const channel = supabase.channel(`room:${room.roomCode}`, {
      config: { presence: { key: user.id } }
    });

    channelRef.current = channel;

    const broadcastStudentList = () => {
      channel.currentStudents = currentStudents;
      channel.send({
        type: 'broadcast',
        event: 'student_list',
        payload: { students: currentStudents }
      });
    };

    const syncPresenceStudents = () => {
      const presenceStudents = Object.values(channel.presenceState())
        .flat()
        .filter(meta => meta?.role === 'student' && meta?.studentId);
      const onlineById = new Map();
      presenceStudents.forEach(meta => {
        const saved = currentStudents.find(student => student.studentId === meta.studentId) || {};
        onlineById.set(meta.studentId, { ...saved, ...meta });
      });
      currentStudents = [...onlineById.values()];
      setStudents(currentStudents);
      broadcastStudentList();
    };

    channel
      .on('presence', { event: 'sync' }, syncPresenceStudents)
      .on('presence', { event: 'leave' }, syncPresenceStudents)
      .on('broadcast', { event: 'student_join' }, ({ payload }) => {
        const currentRoom = activeRoomRef.current || room;
        if (currentRoom.is_locked || currentRoom.status === 'playing') {
          currentStudents = currentStudents.filter(student => student.studentId !== payload.studentId);
          channel.send({
            type: 'broadcast', event: 'join_rejected',
            payload: { studentId: payload.studentId, message: 'Phòng đã khóa và không nhận thêm học viên.' }
          });
          setStudents([...currentStudents]);
          broadcastStudentList();
          return;
        }
        const existingStudent = currentStudents.find((student) => student.studentId === payload.studentId);
        if (!existingStudent) {
          currentStudents.push({ ...payload, score: 0 });
        } else {
          Object.assign(existingStudent, payload);
        }
        setStudents([...currentStudents]);
        broadcastStudentList();
      })
      .on('broadcast', { event: 'student_leave' }, ({ payload }) => {
        currentStudents = currentStudents.filter(student => student.studentId !== payload?.studentId);
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'teacher', teacherId: user.id, roomId: room.id });
          channel.send({ type: 'broadcast', event: 'host_ready', payload: { roomId: room.id } });
          broadcastStudentList();
        }
      });

    channel.currentStudents = currentStudents;
  }

  async function restoreLiveRoomSession(room, restoredStudents = []) {
    if (room.status === 'waiting') {
      setQuizState('waiting');
      setStudents(restoredStudents);
      return;
    }

    const state = room.live_state || {};
    const questionIndex = Number(state.question_index ?? room.current_question_index ?? 0);
    const qData = room.questions?.[questionIndex];
    if (!qData) {
      setQuizState('waiting');
      return;
    }

    const questionPayload = {
      ...qData,
      questionIndex,
      totalQuestions: room.questions.length,
      timeLimit: Number(room.question_time_seconds || room.settings?.timePerQuestion || 20),
    };
    setCurrentQ(questionPayload);
    currentQRef.current = questionPayload;
    setStudents(restoredStudents);

    const { data: savedAnswers } = await supabase
      .from('quiz_answers')
      .select('student_id, selected_option, is_correct, response_ms, points')
      .eq('room_id', room.id)
      .eq('question_index', questionIndex);
    const namesById = new Map(restoredStudents.map(student => [student.studentId, student.studentName]));
    answersRef.current = new Map((savedAnswers || []).map(answer => [answer.student_id, {
      studentId: answer.student_id,
      answerIndex: answer.selected_option,
      isCorrect: answer.is_correct,
      responseMs: answer.response_ms,
      points: answer.points,
      studentName: namesById.get(answer.student_id) || 'Học sinh',
    }]));

    if (state.phase === 'result') {
      setAnswerDistribution(Array.isArray(state.distribution) ? state.distribution : [0, 0, 0, 0]);
      setLeaderboard(Array.isArray(state.leaderboard) ? state.leaderboard : []);
      setFastestCorrect(state.fastest_correct || null);
      setNextCountdown(0);
      setQuizState('result');
      return;
    }

    const startedAt = state.question_started_at ? new Date(state.question_started_at).getTime() : Date.now();
    const endsAt = state.question_ends_at ? new Date(state.question_ends_at).getTime() : startedAt + questionPayload.timeLimit * 1000;
    questionStartedAtRef.current = startedAt;
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setQuizState('question');
    if (remaining > 0) startTeacherQuestionTimer(remaining);
    else setTimeout(() => showResult(), 0);
  }

  function startTeacherQuestionTimer(seconds) {
    clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer(value => {
        if (value <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => showResult(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  const handleStartQuiz = async () => {
    const room = activeRoomRef.current || activeRoom;
    if (!channelRef.current || !room) return;

    const { error: startError } = await supabase.from('quiz_rooms').update({
      status: 'playing', current_question_index: 0, started_at: new Date().toISOString(),
      is_locked: true,
      live_state: { phase: 'starting', question_index: 0 }
    }).eq('id', room.id);
    if (startError) { setError(startError.message); return; }

    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_started',
      payload: { startedAt: nowMs() }
    });

    setQuizState('playing');
    activeRoomRef.current = { ...room, status: 'playing', is_locked: true, current_question_index: 0 };
    setActiveRoom(room => room ? { ...room, status: 'playing', is_locked: true, current_question_index: 0 } : room);
    channelRef.current.send({ type: 'broadcast', event: 'room_lock_changed', payload: { locked: true } });
    setTimeout(() => {
      playQuestion(0);
    }, 2000);
  };

  const handleToggleRoomLock = async () => {
    const room = activeRoomRef.current || activeRoom;
    if (!room || room.status === 'playing') return;
    const nextLocked = !room.is_locked;
    const { error: lockError } = await supabase.from('quiz_rooms')
      .update({ is_locked: nextLocked })
      .eq('id', room.id)
      .eq('teacher_id', user.id);
    if (lockError) {
      setError(`${lockError.message}. Hãy chạy migration khóa phòng mới trong Supabase.`);
      return;
    }
    const updatedRoom = { ...room, is_locked: nextLocked };
    activeRoomRef.current = updatedRoom;
    setActiveRoom(updatedRoom);
    channelRef.current?.send({ type: 'broadcast', event: 'room_lock_changed', payload: { locked: nextLocked } });
  };

  const playQuestion = (qIndex) => {
    const room = activeRoomRef.current || activeRoom;
    if (!room) return;
    const qData = room.questions[qIndex];
    if (!qData) {
      handleEndQuiz();
      return;
    }

    const questionPayload = {
      ...qData,
      questionIndex: qIndex,
      totalQuestions: room.questions.length,
      timeLimit: Number(room.question_time_seconds || room.settings?.timePerQuestion || 20)
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
    const questionStartedAt = new Date(questionStartedAtRef.current).toISOString();
    const questionEndsAt = new Date(questionStartedAtRef.current + questionPayload.timeLimit * 1000).toISOString();
    supabase.from('quiz_rooms').update({
      current_question_index: qIndex,
      live_state: {
        phase: 'question',
        question_index: qIndex,
        question_started_at: questionStartedAt,
        question_ends_at: questionEndsAt,
      }
    }).eq('id', room.id).then(({ error: stateError }) => {
      if (stateError) console.warn('Không thể lưu trạng thái câu hỏi:', stateError.message);
    });

    startTeacherQuestionTimer(questionPayload.timeLimit);
  };

  const showResult = async () => {
    const room = activeRoomRef.current || activeRoom;
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

    if (room?.id) {
      supabase.from('quiz_rooms').update({
        participants: lb,
        live_state: {
          phase: 'result',
          question_index: q?.questionIndex ?? room.current_question_index ?? 0,
          distribution,
          leaderboard: lb,
          fastest_correct: fastest,
          result_at: new Date().toISOString(),
        }
      }).eq('id', room.id).then(({ error: stateError }) => {
        if (stateError) console.warn('Không thể lưu kết quả câu hỏi:', stateError.message);
      });
    }

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
    const room = activeRoomRef.current || activeRoom;
    const activeQuestion = currentQRef.current;
    if (!room || !activeQuestion) return;
    clearInterval(nextTimerRef.current);
    const nextIdx = activeQuestion.questionIndex + 1;
    const { error: nextError } = await supabase.from('quiz_rooms').update({ current_question_index: nextIdx }).eq('id', room.id);
    if (nextError) { setError(nextError.message); return; }
    playQuestion(nextIdx);
  };

  const handleEndQuiz = async () => {
    const room = activeRoomRef.current || activeRoom;
    if (!room) return;
    const finalLb = [...(channelRef.current?.currentStudents || [])]
      .sort((a, b) => b.score - a.score)
      .map((student, index) => ({ ...student, rank: index + 1 }));
    try {
      await supabase
        .from('quiz_rooms')
        .update({
          status: 'closed',
          ended_at: new Date().toISOString(),
          closed_at: new Date().toISOString(),
          close_reason: 'completed',
          participants: finalLb,
          live_state: { phase: 'ended', leaderboard: finalLb, ended_at: new Date().toISOString() }
        })
        .eq('id', room.id);
      await supabase.from('quiz_attempts')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('room_id', room.id)
        .neq('status', 'left');
    } catch (err) {
      console.error('Error updating quiz participants in DB:', err);
      reportSystemError(err, {
        action: 'teacher_quiz_finalize_failed',
        component: 'TeacherPage',
        operation: 'handleEndQuiz',
        supabaseCode: err.code,
      });
    }
    setQuizState('ended');
    activeRoomRef.current = { ...room, status: 'closed' };
    setActiveRoom(currentRoom => currentRoom ? { ...currentRoom, status: 'closed' } : activeRoomRef.current);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'quiz_ended',
        payload: { leaderboard: finalLb }
      });
    }
    fetchMyRooms();
  };

  const handleArchiveRoom = async (roomId) => {
    const { error: archiveError } = await supabase.from('quiz_rooms')
      .update({ archived_at: new Date().toISOString() }).eq('id', roomId).eq('teacher_id', user.id);
    if (archiveError) setError(archiveError.message);
    else fetchMyRooms();
  };

  const handleCopyRoomCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedRoomCode(code);
      setTimeout(() => setCopiedRoomCode(current => current === code ? '' : current), 1800);
    } catch {
      setError(`Không thể sao chép tự động. Mã phòng là ${code}.`);
    }
  };

  const requestCloseRoom = async (room) => {
    const currentActiveRoom = activeRoomRef.current || activeRoom;
    const isCurrentLiveRoom = currentActiveRoom?.id === room.id;
    let participantCount = isCurrentLiveRoom ? students.length : 0;
    if (!isCurrentLiveRoom) {
      const { count } = await supabase.from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .in('status', ['joined', 'playing']);
      participantCount = Number(count || 0);
    }
    setPendingCloseRoom({ ...room, studentCount: participantCount });
  };

  const broadcastRoomClosed = async (room, payload) => {
    const currentActiveRoom = activeRoomRef.current || activeRoom;
    if (channelRef.current && currentActiveRoom?.id === room.id) {
      await channelRef.current.send({ type: 'broadcast', event: 'room_closed', payload });
      return;
    }
    const closeChannel = supabase.channel(`room:${room.roomCode || room.room_code}`);
    await new Promise((resolve) => {
      const fallback = setTimeout(() => {
        supabase.removeChannel(closeChannel);
        resolve();
      }, 2500);
      closeChannel.subscribe(async status => {
        if (status !== 'SUBSCRIBED') return;
        await closeChannel.send({ type: 'broadcast', event: 'room_closed', payload });
        clearTimeout(fallback);
        await supabase.removeChannel(closeChannel);
        resolve();
      });
    });
  };

  const confirmCloseRoom = async () => {
    if (!pendingCloseRoom) return;
    const room = pendingCloseRoom;
    const currentActiveRoom = activeRoomRef.current || activeRoom;
    setClosingRoomId(room.id);
    setError('');
    const closedAt = new Date().toISOString();
    const participantSnapshot = currentActiveRoom?.id === room.id ? students : (room.participants || []);
    const { error: closeError } = await supabase.from('quiz_rooms').update({
      status: 'closed',
      closed_at: closedAt,
      ended_at: closedAt,
      close_reason: 'teacher_closed',
      participants: participantSnapshot,
      live_state: { phase: 'closed', closed_at: closedAt, reason: 'teacher_closed' },
    }).eq('id', room.id).eq('teacher_id', user.id);
    setClosingRoomId('');
    if (closeError) {
      setError(`${closeError.message}. Hãy chạy migration vòng đời phòng mới trong Supabase.`);
      return;
    }
    await broadcastRoomClosed(room, { message: 'Giáo viên đã đóng phòng.', redirectIn: 5 });
    setPendingCloseRoom(null);
    if (currentActiveRoom?.id === room.id) {
      clearInterval(timerRef.current);
      clearInterval(nextTimerRef.current);
      if (channelRef.current) {
        const closedChannel = channelRef.current;
        channelRef.current = null;
        // Capture the closed room, never read a ref that may point at a new room.
        supabase.removeChannel(closedChannel).catch(error => reportSystemError(error, {
          action: 'quiz_channel_cleanup_error', operation: 'close_room', severity: 'warning',
        }));
      }
      setActiveRoom(null);
      activeRoomRef.current = null;
      restoredRoomRef.current = '';
      setStudents([]);
      setQuizState('waiting');
      setView('dashboard');
    }
    await fetchMyRooms();
  };

  const handleOpenLiveRoom = async (room) => {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id, student_id, display_name, avatar_url, score, correct_count, status')
      .eq('room_id', room.id)
      .order('started_at', { ascending: true });
    const restoredStudents = (attempts || []).map(attempt => ({
      studentId: attempt.student_id,
      attemptId: attempt.id,
      studentName: attempt.display_name,
      studentAvatar: attempt.avatar_url,
      score: Number(attempt.score || 0),
      correctCount: Number(attempt.correct_count || 0),
    }));
    restoredRoomRef.current = room.id;
    activeRoomRef.current = room;
    setActiveRoom(room);
    openRoomSocket(room, restoredStudents);
    await restoreLiveRoomSession(room, restoredStudents);
    setView('room-live');
  };

  const handleOpenHistoryDetails = async (room, mode = 'details') => {
    setHistoryPanelMode(mode);
    setHistoryRoom(room);
    setHistoryDetails(null);
    setHistoryLoading(true);
    const [{ data: attempts, error: attemptsError }, { data: answers, error: answersError }] = await Promise.all([
      supabase.from('quiz_attempts').select('id, student_id, display_name, avatar_url, status, score, correct_count, started_at, completed_at').eq('room_id', room.id).order('score', { ascending: false }),
      supabase.from('quiz_answers').select('id, student_id, question_index, selected_option, is_correct, response_ms, points, answered_at').eq('room_id', room.id).order('answered_at', { ascending: true }),
    ]);
    if (attemptsError || answersError) setError(attemptsError?.message || answersError?.message);
    setHistoryDetails({ attempts: attempts || [], answers: answers || [] });
    setHistoryLoading(false);
  };

  const handleReopenRoom = (room) => {
    const existingActiveRevision = myRooms.find(candidate => candidate.id !== room.id && candidate.roomCode === room.roomCode && ['waiting', 'playing'].includes(candidate.status));
    if (existingActiveRevision) {
      setError(`Mã #${room.roomCode} đã có một phiên đang hoạt động. Hãy đóng phiên đó trước khi mở lại lần nữa.`);
      setView('dashboard');
      return;
    }
    const clonedQuestions = JSON.parse(JSON.stringify(room.questions || []));
    setReopenSourceRoom(room);
    setRoomTitle(room.title || 'Phòng thi đấu Sinh Học');
    setRoomType(room.room_type || 'live');
    setQuestionTime(Number(room.question_time_seconds || room.settings?.timePerQuestion || 20));
    setQuestionFontSize(Number(room.settings?.editorFontSize || 15));
    setQuestionFontFamily(room.settings?.editorFontFamily || 'Inter');
    setShuffleQuiz(Boolean(room.settings?.shuffleQuestions || room.settings?.shuffleAnswers));
    setQuestions(clonedQuestions);
    setSelectedQuestionIndexes([]);
    setPasteText('');
    setUploadStatus(`Đã nạp ${clonedQuestions.length} câu từ phòng #${room.roomCode}. Bạn có thể sửa trước khi tạo phiên mới.`);

    if (room.room_type === 'assignment') {
      const oldOpen = room.opens_at ? new Date(room.opens_at) : null;
      const oldClose = room.closes_at ? new Date(room.closes_at) : null;
      const oldWindow = oldOpen && oldClose ? oldClose.getTime() - oldOpen.getTime() : 60 * 60 * 1000;
      const safeWindow = Math.min(7 * 24 * 60 * 60 * 1000, Math.max(15 * 60 * 1000, oldWindow));
      const nextOpen = oldOpen && oldOpen.getTime() > Date.now() ? oldOpen : new Date(Date.now() + 15 * 60 * 1000);
      nextOpen.setSeconds(0, 0);
      const nextClose = oldClose && oldClose.getTime() > nextOpen.getTime() ? oldClose : new Date(nextOpen.getTime() + safeWindow);
      setOpenDate(toLocalDateValue(nextOpen));
      setOpenTime(toLocalTimeValue(nextOpen));
      setCloseDate(toLocalDateValue(nextClose));
      setCloseTime(toLocalTimeValue(nextClose));
    } else {
      setOpenDate(''); setOpenTime(''); setCloseDate(''); setCloseTime('');
    }

    setError('');
    setHistoryRoom(null);
    setHistoryDetails(null);
    setView('create-room');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearQuestions = () => {
    setQuestions([]);
    setSelectedQuestionIndexes([]);
    setPasteText('');
    setUploadStatus('Đã xóa toàn bộ đề đã nạp.');
  };

  const toggleQuestionSelection = (index) => {
    setSelectedQuestionIndexes(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]);
  };

  const handleDeleteSelectedQuestions = () => {
    if (selectedQuestionIndexes.length === 0) return;
    const selected = new Set(selectedQuestionIndexes);
    setQuestions(current => current.filter((_, index) => !selected.has(index)));
    setSelectedQuestionIndexes([]);
    setUploadStatus(`Đã xóa ${selected.size} câu hỏi được chọn.`);
  };

  const updateQuestionText = (questionIndex, value) => {
    setQuestions(current => current.map((question, index) => index === questionIndex ? { ...question, question: value } : question));
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setQuestions(current => current.map((question, index) => index === questionIndex
      ? { ...question, options: question.options.map((option, currentOption) => currentOption === optionIndex ? value : option) }
      : question));
  };

  const moveQuestionOption = (questionIndex, optionIndex, direction) => {
    const targetIndex = optionIndex + direction;
    if (targetIndex < 0 || targetIndex > 3) return;
    setQuestions(current => current.map((question, index) => {
      if (index !== questionIndex) return question;
      const options = [...question.options];
      [options[optionIndex], options[targetIndex]] = [options[targetIndex], options[optionIndex]];
      let correctAnswer = question.correctAnswer;
      if (correctAnswer === optionIndex) correctAnswer = targetIndex;
      else if (correctAnswer === targetIndex) correctAnswer = optionIndex;
      return { ...question, options, correctAnswer };
    }));
  };

  const handleExportRoomExcel = (targetRoom = historyRoom, attempts = historyDetails?.attempts) => {
    const room = targetRoom || historyRoom;
    const attemptList = attempts || historyDetails?.attempts || [];
    if (!room) return;
    if (!attemptList || attemptList.length === 0) {
      setError('Chưa có dữ liệu học sinh nộp bài hoặc tham gia phòng này để xuất file Excel.');
      return;
    }

    let csvContent = '\uFEFF';
    csvContent += `BÁO CÁO KẾT QUẢ PHÒNG THI QUIZ SINH HỌC - BIOLEARN\n`;
    csvContent += `Mã phòng,${room.roomCode || room.room_code || ''}\n`;
    csvContent += `Tên phòng,${(room.title || '').replace(/,/g, ' ')}\n`;
    csvContent += `Hình thức,${room.room_type === 'assignment' ? 'Quiz theo lịch' : 'Phòng trực tuyến'}\n`;
    csvContent += `Thời gian tạo,${new Date(room.created_at).toLocaleString('vi-VN')}\n`;
    csvContent += `Tổng số học sinh,${attemptList.length}\n\n`;

    csvContent += `STT,Họ và tên học sinh,Điểm số,Số câu đúng,Trạng thái,Thời gian nộp bài\n`;

    attemptList.forEach((attempt, index) => {
      const name = `"${(attempt.display_name || 'Học sinh').replace(/"/g, '""')}"`;
      const score = attempt.score || 0;
      const correct = attempt.correct_count || 0;
      const status = attempt.status === 'completed' ? 'Đã hoàn thành' : 'Đang làm / Đã thoát';
      const timeStr = attempt.completed_at ? new Date(attempt.completed_at).toLocaleString('vi-VN') : (attempt.started_at ? new Date(attempt.started_at).toLocaleString('vi-VN') : 'N/A');

      csvContent += `${index + 1},${name},${score},${correct},${status},${timeStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KetQua_Quiz_${room.roomCode || 'BioLearn'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const todayDateValue = toLocalDateValue(new Date());

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const visibleRooms = myRooms.filter(room => !room.archived_at);
  const activeLiveRooms = visibleRooms.filter(room => room.room_type === 'live' && ['waiting', 'playing'].includes(room.status));
  const activeAssignmentRooms = visibleRooms.filter(room => room.room_type === 'assignment' && ['waiting', 'playing'].includes(room.status));
  const closedRooms = visibleRooms.filter(room => ['closed', 'finished'].includes(room.status));
  const filteredHistoryRooms = myRooms.filter(room => {
    const search = historySearch.trim().toLowerCase();
    return !search || room.title?.toLowerCase().includes(search) || room.roomCode?.toLowerCase().includes(search);
  });
  const historyAttempts = historyDetails?.attempts || [];
  const historyAnswers = historyDetails?.answers || [];
  const historyMaxScore = Math.max(1, Number(historyRoom?.questionCount || historyRoom?.questions?.length || 1) * 1000);
  const historyScoreBands = [
    { label: '0–49%', min: 0, max: 50, count: 0 },
    { label: '50–69%', min: 50, max: 70, count: 0 },
    { label: '70–84%', min: 70, max: 85, count: 0 },
    { label: '85–100%', min: 85, max: 101, count: 0 },
  ];
  historyAttempts.forEach(attempt => {
    const percent = Math.max(0, Math.min(100, Number(attempt.score || 0) / historyMaxScore * 100));
    const band = historyScoreBands.find(item => percent >= item.min && percent < item.max);
    if (band) band.count += 1;
  });
  const historyQuestionStats = (historyRoom?.questions || []).map((question, questionIndex) => {
    const answers = historyAnswers.filter(answer => Number(answer.question_index) === questionIndex);
    const correct = answers.filter(answer => answer.is_correct).length;
    const optionCounts = [0, 0, 0, 0];
    answers.forEach(answer => {
      const selected = Number(answer.selected_option);
      if (selected >= 0 && selected < 4) optionCounts[selected] += 1;
    });
    return { question, questionIndex, total: answers.length, correct, incorrect: answers.length - correct, optionCounts };
  });
  const historyCorrectCount = historyAnswers.filter(answer => answer.is_correct).length;
  const historyCorrectRate = historyAnswers.length ? Math.round(historyCorrectCount / historyAnswers.length * 100) : 0;

  const getRoomStatusText = (status) => {
    if (status === 'waiting') return 'Đang chờ';
    if (status === 'playing') return 'Phòng trực tuyến';
    if (status === 'closed' || status === 'finished') return 'Đã đóng';
    return status;
  };

  const renderRoomCard = (room) => (
    <div className="room-card" key={room.id || room.roomCode}>
      <div className="room-code-with-copy">
        <span className="room-code">#{room.roomCode}</span>
        <button type="button" className="liquid-copy-button" onClick={() => handleCopyRoomCode(room.roomCode)} title="Sao chép mã phòng" aria-label={`Sao chép mã ${room.roomCode}`}>
          {copiedRoomCode === room.roomCode ? <CheckCircle2 size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <div className="room-info">
        <b>{room.title}</b>
        <small>{room.room_type === 'assignment' ? 'Theo lịch' : 'Trực tuyến'} · {room.questionCount} câu hỏi · {room.studentCount} học sinh</small>
        {room.room_type === 'assignment' && room.opens_at && new Date(room.opens_at).getTime() > clockNow && (
          <small className="room-opening-countdown">Mở sau {formatCountdown(new Date(room.opens_at).getTime() - clockNow)}</small>
        )}
        {(room.closed_at || room.ended_at) && <small className="room-closed-at">Đóng lúc {new Date(room.closed_at || room.ended_at).toLocaleString('vi-VN')}</small>}
      </div>
      <div className={`room-status ${room.status}`}>{getRoomStatusText(room.status)}</div>
      <div className="room-actions">
        {room.room_type === 'live' && ['waiting', 'playing'].includes(room.status) && (
          <button type="button" className="room-action primary" onClick={() => handleOpenLiveRoom(room)}><Radio size={15} /> Mở phòng</button>
        )}
        {['waiting', 'playing'].includes(room.status) && (
          <button type="button" className="room-action danger" onClick={() => requestCloseRoom(room)}><DoorClosed size={15} /> Đóng phòng</button>
        )}
        {['closed', 'finished'].includes(room.status) && (
          <>
            <button type="button" className="room-action" onClick={() => { setView('history'); handleOpenHistoryDetails(room, 'details'); }}><Eye size={15} /> Chi tiết</button>
            <button type="button" className="room-action chart" onClick={() => { setView('history'); handleOpenHistoryDetails(room, 'chart'); }}><BarChart3 size={15} /> Biểu đồ</button>
            <button type="button" className="room-action reopen" disabled={myRooms.some(candidate => candidate.id !== room.id && candidate.roomCode === room.roomCode && ['waiting', 'playing'].includes(candidate.status))} onClick={() => handleReopenRoom(room)}><RotateCcw size={15} /> {myRooms.some(candidate => candidate.id !== room.id && candidate.roomCode === room.roomCode && ['waiting', 'playing'].includes(candidate.status)) ? 'Đã mở lại' : 'Mở lại'}</button>
          </>
        )}
        <button type="button" className="room-archive" onClick={() => handleArchiveRoom(room.id)} title="Ẩn phòng khỏi màn hình, vẫn giữ toàn bộ dữ liệu"><Archive size={15} /> Ẩn</button>
      </div>
    </div>
  );

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
          <button className={view === 'history' ? 'active' : ''} onClick={() => {
            setHistoryRoom(null);
            setHistoryDetails(null);
            setHistoryPanelMode('details');
            setView('history');
          }}>
            <GlassIcon tone="violet" compact><History /></GlassIcon>
            <span>Lịch sử phòng</span>
          </button>
          {activeRoom && ['waiting', 'playing'].includes(activeRoom.status) && (
            <button className={view === 'room-live' ? 'active' : ''} onClick={() => setView('room-live')}>
              <Radio className="w-4 h-4 inline-block mr-2 text-red-400 animate-pulse" />
              <span>Phòng trực tuyến</span>
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
                  <b>{activeLiveRooms.length}</b>
                  <small>Phòng trực tuyến</small>
                </div>
              </div>
              <div className="stat-card">
                <GlassIcon tone="violet"><CheckCircle2 /></GlassIcon>
                <div>
                  <b>{myRooms.filter(r => ['closed', 'finished'].includes(r.status)).length}</b>
                  <small>Phòng đã đóng</small>
                </div>
              </div>
            </div>

            <h3 className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>Phòng trực tuyến</span>
            </h3>
            {activeLiveRooms.length === 0 ? (
              <div className="empty-state">
                Chưa có phòng trực tuyến đang mở. <button onClick={() => setView('create-room')}>Tạo phòng mới →</button>
              </div>
            ) : (
              <div className="rooms-list">{activeLiveRooms.map(renderRoomCard)}</div>
            )}

            {activeAssignmentRooms.length > 0 && <>
              <h3 className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-cyan-400" /><span>Quiz theo lịch đang mở</span></h3>
              <div className="rooms-list">{activeAssignmentRooms.map(renderRoomCard)}</div>
            </>}

            <h3 className="flex items-center gap-2"><DoorClosed className="w-5 h-5 text-violet-400" /><span>Phòng đã đóng</span></h3>
            {closedRooms.length === 0 ? <div className="empty-state compact">Chưa có phòng nào đã đóng.</div> : <div className="rooms-list">{closedRooms.map(renderRoomCard)}</div>}
          </div>
        )}

        {/* HISTORY */}
        {view === 'history' && (
          <div className="teacher-history">
            <div className="history-heading">
              <div><h2><History size={24} /> Lịch sử phòng Quiz</h2><p>Toàn bộ phòng vẫn được lưu tại database, kể cả những phòng đã ẩn.</p></div>
              <label className="history-search"><Search size={17} /><input value={historySearch} onChange={event => setHistorySearch(event.target.value)} placeholder="Tìm tên hoặc mã phòng" /></label>
            </div>
            <div className={`history-layout ${historyRoom ? 'has-details' : 'list-only'}`}>
              <div className="history-list">
                {filteredHistoryRooms.length === 0 ? <div className="empty-state">Không tìm thấy phòng phù hợp.</div> : filteredHistoryRooms.map(room => (
                  <div key={room.id} className={`history-room-row ${historyRoom?.id === room.id ? 'active' : ''}`}>
                    <button type="button" className="history-room-main" onClick={() => handleOpenHistoryDetails(room, 'details')}>
                      <div><strong>{room.title}</strong><span>#{room.roomCode} · {room.room_type === 'assignment' ? 'Theo lịch' : 'Trực tuyến'}{Number(room.revision || 1) > 1 ? ` · Phiên ${room.revision}` : ''}</span></div>
                      <div><time>{new Date(room.created_at).toLocaleString('vi-VN')}</time><span className={`history-status ${room.status}`}>{getRoomStatusText(room.status)}</span></div>
                    </button>
                    <div className="history-row-actions">
                      <button type="button" onClick={() => handleOpenHistoryDetails(room, 'details')} title="Xem chi tiết"><Eye size={15} /><span>Chi tiết</span></button>
                      <button type="button" onClick={() => handleOpenHistoryDetails(room, 'chart')} title="Xem biểu đồ"><BarChart3 size={15} /><span>Biểu đồ</span></button>
                      <button type="button" onClick={async () => { await handleOpenHistoryDetails(room, 'details'); handleExportRoomExcel(room); }} title="Xuất file Excel CSV"><Download size={15} /><span>Xuất Excel</span></button>
                      {['closed', 'finished'].includes(room.status) && <button type="button" onClick={() => handleReopenRoom(room)} title="Mở lại phòng"><RotateCcw size={15} /><span>Mở lại</span></button>}
                    </div>
                  </div>
                ))}
              </div>
              {historyRoom && <aside className="history-details">
                {historyLoading ? <div className="history-placeholder">Đang tải dữ liệu phòng...</div> : (
                  <>
                    <div className="history-detail-title"><div><span>#{historyRoom.roomCode}{Number(historyRoom.revision || 1) > 1 ? ` · PHIÊN ${historyRoom.revision}` : ''}</span><h3>{historyRoom.title}</h3></div><button type="button" onClick={() => { setHistoryRoom(null); setHistoryDetails(null); }}>×</button></div>
                    <div className="history-panel-tabs">
                      <button type="button" className={historyPanelMode === 'details' ? 'active' : ''} onClick={() => setHistoryPanelMode('details')}><ListChecks size={16} /> Chi tiết</button>
                      <button type="button" className={historyPanelMode === 'chart' ? 'active' : ''} onClick={() => setHistoryPanelMode('chart')}><BarChart3 size={16} /> Biểu đồ</button>
                      <button type="button" className="excel-export-tab text-emerald-400 font-semibold" onClick={() => handleExportRoomExcel(historyRoom, historyDetails?.attempts)} title="Xuất toàn bộ điểm số học sinh ra tệp Excel CSV"><Download size={16} /> Xuất Excel (.csv)</button>
                      {['closed', 'finished'].includes(historyRoom.status) && <button type="button" className="reopen-tab" onClick={() => handleReopenRoom(historyRoom)}><RotateCcw size={16} /> Mở lại</button>}
                    </div>
                    <div className="history-metrics">
                      <div><b>{historyRoom.questionCount}</b><span>Câu hỏi</span></div>
                      <div><b>{historyDetails?.attempts.length || 0}</b><span>Học viên</span></div>
                      <div><b>{historyDetails?.answers.length || 0}</b><span>Lượt trả lời</span></div>
                    </div>
                    {historyPanelMode === 'details' ? <div className="history-panel-content">
                      <div className="history-meta"><p><b>Loại:</b> {historyRoom.room_type === 'assignment' ? 'Quiz theo lịch' : 'Phòng trực tuyến'}</p><p><b>Tạo lúc:</b> {new Date(historyRoom.created_at).toLocaleString('vi-VN')}</p><p><b>Trạng thái:</b> {getRoomStatusText(historyRoom.status)}</p></div>
                      <h4>Học viên đã tham gia</h4>
                      <div className="history-participants">{historyAttempts.length ? historyAttempts.map(attempt => <div key={attempt.id}><span>{attempt.display_name}</span><b>{attempt.score} điểm · {attempt.correct_count} đúng</b></div>) : <p>Chưa có học viên tham gia.</p>}</div>
                      <h4>Câu hỏi và đáp án</h4>
                      <div className="history-questions">{historyQuestionStats.map(({ question, questionIndex, total, correct, optionCounts }) => (
                        <article key={questionIndex} className="history-question-card">
                          <h5><span>Câu {questionIndex + 1}</span>{question.question}</h5>
                          <div className="history-answer-options">{(question.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className={Number(question.correctAnswer) === optionIndex ? 'correct' : ''}>
                              <b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span><small>{optionCounts[optionIndex] || 0} lượt chọn{Number(question.correctAnswer) === optionIndex ? ' · Đáp án đúng' : ''}</small>
                            </div>
                          ))}</div>
                          <footer>{total ? `${correct}/${total} lượt trả lời đúng (${Math.round(correct / total * 100)}%)` : 'Chưa có học viên trả lời câu này'}</footer>
                        </article>
                      ))}</div>
                    </div> : <div className="history-chart-panel">
                      <div className="history-chart-summary">
                        <div className="correct-rate-ring" style={{ '--correct-rate': `${historyCorrectRate * 3.6}deg` }}><strong>{historyCorrectRate}%</strong><span>Tỷ lệ đúng</span></div>
                        <div><h4>Tổng quan kiến thức</h4><p>{historyCorrectCount} câu trả lời đúng trên {historyAnswers.length} lượt trả lời.</p><p>{historyCorrectRate >= 80 ? 'Lớp đang nắm kiến thức tốt.' : historyCorrectRate >= 60 ? 'Lớp đã hiểu phần lớn nội dung nhưng còn điểm cần củng cố.' : 'Kiến thức còn yếu, Giáo viên nên ôn lại các câu có tỷ lệ đúng thấp.'}</p></div>
                      </div>
                      <h4>Phân bố kết quả học viên</h4>
                      <div className="score-distribution">{historyScoreBands.map(band => {
                        const maxBand = Math.max(1, ...historyScoreBands.map(item => item.count));
                        return <div key={band.label}><span>{band.label}</span><i><b style={{ width: `${band.count / maxBand * 100}%` }} /></i><strong>{band.count}</strong></div>;
                      })}</div>
                      <h4>Tỷ lệ đúng/sai từng câu</h4>
                      <div className="question-performance-chart">{historyQuestionStats.map(stat => {
                        const correctPercent = stat.total ? Math.round(stat.correct / stat.total * 100) : 0;
                        return <div key={stat.questionIndex} className={correctPercent < 50 && stat.total ? 'weak' : ''}><header><span>Câu {stat.questionIndex + 1}</span><strong>{correctPercent}% đúng</strong></header><p>{stat.question.question}</p><div className="performance-bar"><i style={{ width: `${correctPercent}%` }} /><b style={{ width: `${100 - correctPercent}%` }} /></div><small>{stat.correct} đúng · {stat.incorrect} sai · {stat.total} lượt trả lời</small></div>;
                      })}</div>
                    </div>}
                  </>
                )}
              </aside>}
            </div>
          </div>
        )}

        {/* CREATE ROOM */}
        {view === 'create-room' && (
          <div className="create-room">
            <h2 className="flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
              <span>{reopenSourceRoom ? `Mở Lại Phòng Quiz #${reopenSourceRoom.roomCode}` : 'Tạo Phòng Quiz Trắc Nghiệm Mới'}</span>
            </h2>

            {error && <div className="teacher-error"><CircleAlert size={18} /> {error}</div>}

            {reopenSourceRoom && <div className="reopen-room-banner">
              <GlassIcon tone="violet"><RotateCcw /></GlassIcon>
              <div><strong>Đang chuẩn bị mở lại #{reopenSourceRoom.roomCode}</strong><span>Hệ thống sẽ tạo một ID phiên mới, giữ nguyên mã phòng và bảo toàn toàn bộ lịch sử của phiên cũ.</span></div>
              <button type="button" onClick={() => setReopenSourceRoom(null)}>Hủy mở lại</button>
            </div>}

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
              <button disabled={Boolean(reopenSourceRoom)} className={roomType === 'live' ? 'mode-card active live-mode' : 'mode-card live-mode'} onClick={() => setRoomType('live')}>
                <GlassIcon tone="cyan"><Radio /></GlassIcon>
                <span><b>Trực tuyến có Giáo viên</b><small>Sảnh chờ, từng câu theo giờ, biểu đồ và xếp hạng trực tiếp</small></span>
                <i className="mode-check"><CheckCircle2 /></i>
              </button>
              <button disabled={Boolean(reopenSourceRoom)} className={roomType === 'assignment' ? 'mode-card active schedule-mode' : 'mode-card schedule-mode'} onClick={() => setRoomType('assignment')}>
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
                    <label>Ngày<LiquidDatePicker value={openDate} onChange={setOpenDate} label="Chọn ngày mở" minDate={todayDateValue} /></label>
                    <label>Giờ<LiquidTimePicker value={openTime} onChange={setOpenTime} label="Chọn giờ" /></label>
                  </div>
                </div>
                <div className="glass-field date-time-field">
                  <div className="field-heading"><GlassIcon tone="violet" compact><CalendarDays /></GlassIcon><span>Đóng lúc</span></div>
                  <div className="date-time-pair">
                    <label>Ngày<LiquidDatePicker value={closeDate} onChange={setCloseDate} label="Chọn ngày đóng" minDate={openDate || todayDateValue} /></label>
                    <label>Giờ<LiquidTimePicker value={closeTime} onChange={setCloseTime} label="Chọn giờ" /></label>
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
                    className={`upload-mode-button ${inputMode === 'paste' ? 'active' : ''}`}
                  >
                    <ClipboardPaste size={15} /> Dán Văn Bản (Ctrl+V)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`upload-mode-button ${inputMode === 'file' ? 'active' : ''}`}
                  >
                    <FileUp size={15} /> Upload File (.txt, .docx)
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleQuiz}
                    className="sample-quiz-button"
                  >
                    <WandSparkles size={15} /> Nạp Đề Mẫu Chuẩn
                  </button>
                  {questions.length > 0 && <button type="button" onClick={handleClearQuestions} className="clear-quiz-button"><RotateCcw size={15} /> Xóa đề đã nạp</button>}
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

                <div className="question-editor-toolbar">
                  <label className="select-all-questions"><input type="checkbox" checked={selectedQuestionIndexes.length === questions.length && questions.length > 0} onChange={event => setSelectedQuestionIndexes(event.target.checked ? questions.map((_, index) => index) : [])} /> Chọn tất cả</label>
                  <label>Font chữ<select value={questionFontFamily} onChange={event => setQuestionFontFamily(event.target.value)}><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option></select></label>
                  <label>Cỡ chữ<select value={questionFontSize} onChange={event => setQuestionFontSize(Number(event.target.value))}>{[13, 14, 15, 16, 18, 20].map(size => <option key={size} value={size}>{size}px</option>)}</select></label>
                  <button type="button" className="delete-selected-button" disabled={selectedQuestionIndexes.length === 0} onClick={handleDeleteSelectedQuestions}><Trash2 size={15} /> Xóa câu đã chọn ({selectedQuestionIndexes.length})</button>
                </div>
                <label className="shuffle-quiz-toggle">
                  <input type="checkbox" checked={shuffleQuiz} onChange={event => setShuffleQuiz(event.target.checked)} />
                  <span><b>Tự động trộn câu hỏi và đáp án theo từng học viên</b><small>Quiz theo lịch: mỗi học viên nhận thứ tự câu và đáp án riêng. Phòng trực tuyến: đáp án được đảo riêng, thứ tự câu vẫn đồng bộ với Giáo viên.</small></span>
                </label>

                <div className="question-editor-list">
                  {questions.map((q, i) => (
                    <article className={`q-preview editable-question ${selectedQuestionIndexes.includes(i) ? 'selected' : ''}`} key={i}>
                      <div className="question-editor-heading">
                        <label className="question-checkbox"><input type="checkbox" checked={selectedQuestionIndexes.includes(i)} onChange={() => toggleQuestionSelection(i)} /><span>Câu {i + 1}</span></label>
                        <button type="button" onClick={() => { setQuestions(current => current.filter((_, index) => index !== i)); setSelectedQuestionIndexes([]); }} title="Xóa câu này"><Trash2 size={15} /> Xóa câu</button>
                      </div>
                      <textarea value={q.question} onChange={event => updateQuestionText(i, event.target.value)} className="question-text-editor" style={{ fontFamily: questionFontFamily, fontSize: `${questionFontSize}px` }} rows={2} />
                      <div className="option-editor-list">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`option-editor-row ${j === q.correctAnswer ? 'correct' : ''}`}>
                            <button type="button" className="correct-answer-toggle" onClick={() => setQuestions(current => current.map((question, index) => index === i ? { ...question, correctAnswer: j } : question))} title="Đặt làm đáp án đúng">{String.fromCharCode(65 + j)}</button>
                            <input value={opt} onChange={event => updateQuestionOption(i, j, event.target.value)} style={{ fontFamily: questionFontFamily, fontSize: `${Math.max(12, questionFontSize - 1)}px` }} />
                            <div className="option-order-buttons">
                              <button type="button" disabled={j === 0} onClick={() => moveQuestionOption(i, j, -1)} aria-label={`Đưa đáp án ${String.fromCharCode(65 + j)} lên`}><ChevronUp size={15} /></button>
                              <button type="button" disabled={j === q.options.length - 1} onClick={() => moveQuestionOption(i, j, 1)} aria-label={`Đưa đáp án ${String.fromCharCode(65 + j)} xuống`}><ChevronDown size={15} /></button>
                            </div>
                            {j === q.correctAnswer && <span className="correct-answer-label">Đáp án đúng</span>}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-create-room" onClick={handleCreateRoom} disabled={loading || questions.length === 0}>
              {loading ? <><span className="button-spinner" />Đang tạo phòng...</> : <><Rocket size={20} />{reopenSourceRoom ? 'Mở Lại' : 'Tạo'} Phòng Quiz ({questions.length} câu hỏi)</>}
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
                <div className="room-code-display">Mã kết nối phòng: <strong>{activeRoom.roomCode}</strong><button type="button" className="liquid-copy-button large" onClick={() => handleCopyRoomCode(activeRoom.roomCode)} title="Sao chép mã phòng">{copiedRoomCode === activeRoom.roomCode ? <CheckCircle2 size={17} /> : <Copy size={17} />}</button></div>
              </div>
              <div className="live-room-header-actions">
                <button type="button" className={`lock-live-room-button ${activeRoom.is_locked ? 'locked' : ''}`} onClick={handleToggleRoomLock} disabled={activeRoom.status === 'playing'} title={activeRoom.status === 'playing' ? 'Phòng tự động khóa khi đã bắt đầu' : ''}>
                  {activeRoom.is_locked ? <LockKeyhole size={17} /> : <UnlockKeyhole size={17} />}
                  {activeRoom.is_locked ? 'Đã khóa' : 'Khóa phòng'}
                </button>
                <button type="button" className="close-live-room-button" onClick={() => requestCloseRoom(activeRoom)}><DoorClosed size={17} /> Đóng phòng</button>
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
                    <img src={getAvatarUrl(s.studentAvatar || s.avatar_url)} onError={handleAvatarError} alt="" className="student-chip-avatar" />
                    <span>{s.studentName}</span>
                  </div>
                ))}
                {students.length === 0 && <p className="empty-students">Đang chờ học sinh kết nối vào phòng...</p>}
              </div>
            </div>

            {/* Room Controls */}
            {quizState === 'waiting' && (
              <button className="btn-start-quiz" onClick={handleStartQuiz} disabled={students.length === 0}>
                <Play size={20} /> <span>Bắt đầu</span>
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
                <button className="btn-new-room" onClick={() => { setView('create-room'); activeRoomRef.current = null; setActiveRoom(null); setQuizState('waiting'); }}>
                  <PlusCircle size={18} /> Tạo Phòng Mới
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {pendingCloseRoom && (
        <div className="teacher-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !closingRoomId) setPendingCloseRoom(null); }}>
          <div className="teacher-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="close-room-title">
            <GlassIcon tone="rose"><DoorClosed /></GlassIcon>
            <div>
              <h3 id="close-room-title">Bạn có muốn đóng phòng này?</h3>
              <p><strong>{pendingCloseRoom.title}</strong> · #{pendingCloseRoom.roomCode}</p>
              {pendingCloseRoom.studentCount > 0 ? <div className="close-room-warning"><CircleAlert size={18} /> Hiện có {pendingCloseRoom.studentCount} học viên trong phòng. Các em sẽ được thông báo và tự động trở lại phòng chờ sau 5 giây.</div> : <div className="close-room-note">Phòng hiện chưa có học viên. Sau khi đóng, mã phòng sẽ không thể dùng để tham gia nữa.</div>}
            </div>
            <div className="teacher-modal-actions">
              <button type="button" onClick={() => setPendingCloseRoom(null)} disabled={Boolean(closingRoomId)}>Giữ phòng mở</button>
              <button type="button" className="danger" onClick={confirmCloseRoom} disabled={Boolean(closingRoomId)}>{closingRoomId ? 'Đang đóng...' : 'Đóng phòng'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
