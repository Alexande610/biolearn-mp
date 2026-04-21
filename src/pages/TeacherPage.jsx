import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './TeacherPage.css';

export default function TeacherPage({ user }) {
  const navigate = useNavigate();
  const channelRef = useRef(null);

  const [view, setView] = useState('dashboard'); // 'dashboard' | 'create-room' | 'room-live'
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room state
  const [roomTitle, setRoomTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [quizState, setQuizState] = useState('waiting'); // 'waiting'|'question'|'result'|'ended'
  const [currentQ, setCurrentQ] = useState(null);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  // Guard: redirect if not teacher
  useEffect(() => {
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user]);

  // Load my rooms
  useEffect(() => {
    if (user) fetchMyRooms();
  }, [user]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const fetchMyRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedRooms = data.map(r => ({
        ...r,
        roomCode: r.room_code,
        questionCount: r.questions ? r.questions.length : 0,
        studentCount: r.participants ? r.participants.length : 0
      }));
      setMyRooms(formattedRooms);
    } catch(e) { console.error(e); }
  };

  // ── File upload (Xử lý đọc file cục bộ thay vì gọi API) ─────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus('⏳ Đang đọc file...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const blocks = text.split(/\n\s*\n/);
        const parsedQ = [];
        
        for (let block of blocks) {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length < 5) continue;
          
          const qLine = lines.find(l => l.startsWith('Q:'));
          if (!qLine) continue;
          
          const question = qLine.substring(2).trim();
          const options = [];
          for (let i = 0; i < 4; i++) {
            const optLine = lines.find(l => l.startsWith(`${String.fromCharCode(65+i)}:`));
            if (optLine) options.push(optLine.substring(2).trim());
          }
          if (options.length < 2) continue;
          
          const ansLine = lines.find(l => l.startsWith('Answer:'));
          let correctAnswer = 0;
          if (ansLine) {
            const ansChar = ansLine.substring(7).trim().toUpperCase();
            correctAnswer = ansChar.charCodeAt(0) - 65;
          }
          
          parsedQ.push({ question, options, correctAnswer, timeLimit: 20 });
        }
        
        setQuestions(parsedQ);
        setUploadStatus(`✅ Đọc được ${parsedQ.length} câu hỏi từ file`);
      } catch (err) {
        setUploadStatus('❌ Lỗi khi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // ── Create room ──────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (questions.length === 0) { setError('Cần ít nhất 1 câu hỏi'); return; }
    setLoading(true); setError('');
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      
      const { data, error } = await supabase.from('quiz_rooms').insert([{
        room_code: code,
        teacher_id: user.id,
        title: roomTitle || 'Phòng thi đấu Sinh Học',
        status: 'waiting',
        questions: questions,
        settings: { timePerQuestion: 20 }
      }]).select().single();

      if (error) throw error;

      const roomData = { ...data, roomCode: data.room_code };
      openRoomSocket(roomData);
      setActiveRoom(roomData);
      setView('room-live');
      fetchMyRooms();
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Supabase Realtime cho Server (Giáo Viên) ────────────────────────────
  const openRoomSocket = (room) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    
    // Tạo mảng học sinh local tracking
    let currentStudents = [];
    let currentLb = [];
    
    const channel = supabase.channel(`room:${room.roomCode}`, {
      config: { presence: { key: user.id } }
    });
    
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'student_join' }, ({ payload }) => {
        currentStudents.push(payload);
        setStudents([...currentStudents]);
      })
      .on('broadcast', { event: 'student_answer' }, ({ payload }) => {
        // Cập nhật điểm cho Học sinh
        const std = currentStudents.find(s => s.studentId === payload.studentId);
        if (std) {
          std.score = (std.score || 0) + payload.score;
          std.lastAnswerTime = payload.timeLeft;
        }
      })
      .subscribe();
      
    // Gắn state lên ref để truy cập trong interval
    channel.currentStudents = currentStudents;
  };

  const handleStartQuiz = async () => {
    if (!channelRef.current || !activeRoom) return;
    
    await supabase.from('quiz_rooms').update({ status: 'playing', current_question_index: 0 }).eq('id', activeRoom.id);
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_started',
      payload: { startedAt: Date.now() }
    });
    
    setQuizState('playing');
    setTimeout(() => {
      playQuestion(0);
    }, 2000);
  };

  const playQuestion = (qIndex) => {
    const qData = activeRoom.questions[qIndex];
    if (!qData) {
       // Hết câu hỏi -> kết thúc
       handleEndQuiz();
       return;
    }
    
    const questionPayload = {
      ...qData,
      questionIndex: qIndex,
      totalQuestions: activeRoom.questions.length,
      timeLimit: 20
    };
    
    setCurrentQ(questionPayload);
    setQuizState('question');
    setTimer(questionPayload.timeLimit);
    
    // Bắn sang cho HS
    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_question',
      payload: questionPayload
    });
    
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { 
        if (t <= 1) { 
          clearInterval(timerRef.current); 
          // Hết giờ -> Show kết quả (Bảng xếp hạng local)
          showResult(qIndex);
          return 0; 
        } 
        return t - 1; 
      });
    }, 1000);
  };
  
  const showResult = async (qIndex) => {
    const lb = channelRef.current.currentStudents
                 .sort((a,b) => b.score - a.score || b.lastAnswerTime - a.lastAnswerTime);
    setLeaderboard([...lb]);
    setQuizState('result');
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_result',
      payload: { leaderboard: lb }
    });
  };

  const handleNextQuestion = async () => {
    if (!activeRoom || !currentQ) return;
    const nextIdx = currentQ.questionIndex + 1;
    await supabase.from('quiz_rooms').update({ current_question_index: nextIdx }).eq('id', activeRoom.id);
    playQuestion(nextIdx);
  };
  
  const handleEndQuiz = async () => {
    await supabase.from('quiz_rooms').update({ status: 'finished' }).eq('id', activeRoom.id);
    setQuizState('ended');
    const finalLb = channelRef.current.currentStudents.sort((a,b) => b.score - a.score);
    channelRef.current.send({
      type: 'broadcast',
      event: 'quiz_ended',
      payload: { leaderboard: finalLb }
    });
  };

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  if (!user) return null;

  return (
    <div className="teacher-page">
      {/* Sidebar */}
      <aside className="teacher-sidebar">
        <div className="sidebar-logo">
          <span>🏫</span>
          <div>
            <div className="sidebar-name">{user.displayName || user.username}</div>
            <div className="sidebar-role">Giáo viên</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>📊 Bảng điều khiển</button>
          <button className={view === 'create-room' ? 'active' : ''} onClick={() => setView('create-room')}>➕ Tạo phòng Quiz</button>
          {activeRoom && <button className={view === 'room-live' ? 'active' : ''} onClick={() => setView('room-live')}>🔴 Phòng đang mở</button>}
        </nav>
        <button className="sidebar-logout" onClick={() => navigate('/')}>← Về trang chủ</button>
      </aside>

      {/* Main content */}
      <main className="teacher-main">

        {/* ── DASHBOARD ── */}
        {view === 'dashboard' && (
          <div className="teacher-dashboard">
            <h2>📊 Bảng điều khiển</h2>
            <div className="dash-stats">
              <div className="stat-card"><span>🏠</span><div><b>{myRooms.length}</b><small>Tổng phòng</small></div></div>
              <div className="stat-card"><span>▶️</span><div><b>{myRooms.filter(r => r.status === 'playing').length}</b><small>Đang chạy</small></div></div>
              <div className="stat-card"><span>✅</span><div><b>{myRooms.filter(r => r.status === 'finished').length}</b><small>Đã kết thúc</small></div></div>
            </div>

            <h3>📋 Phòng gần đây</h3>
            {myRooms.length === 0 ? (
              <div className="empty-state">Chưa có phòng nào. <button onClick={() => setView('create-room')}>Tạo ngay →</button></div>
            ) : (
              <div className="rooms-list">
                {myRooms.map(room => (
                  <div className="room-card" key={room.roomCode}>
                    <div className="room-code">#{room.roomCode}</div>
                    <div className="room-info">
                      <b>{room.title}</b>
                      <small>{room.questionCount} câu · {room.studentCount} học sinh</small>
                    </div>
                    <div className={`room-status ${room.status}`}>{room.status === 'waiting' ? '⏳ Chờ' : room.status === 'playing' ? '🔴 Live' : '✅ Xong'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CREATE ROOM ── */}
        {view === 'create-room' && (
          <div className="create-room">
            <h2>➕ Tạo phòng Quiz mới</h2>
            {error && <div className="teacher-error">❌ {error}</div>}

            <div className="form-section">
              <label>Tên phòng Quiz</label>
              <input value={roomTitle} onChange={e => setRoomTitle(e.target.value)} placeholder="VD: Ôn tập Chương 1 - Tế bào" className="teacher-input" />
            </div>

            <div className="upload-section">
              <h3>📁 Upload file câu hỏi</h3>
              <div className="upload-format">
                <p><b>Format file TXT/Word/PDF:</b></p>
                <pre>{`Q: Câu hỏi của bạn?
A: Đáp án A
B: Đáp án B
C: Đáp án C
D: Đáp án D
Answer: A

Q: Câu hỏi tiếp theo?
...`}</pre>
              </div>
              <label className="upload-btn">
                📎 Chọn file (TXT, PDF, DOCX)
                <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} hidden />
              </label>
              {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
            </div>

            {questions.length > 0 && (
              <div className="questions-preview">
                <h3>📝 Preview {questions.length} câu hỏi</h3>
                {questions.slice(0, 5).map((q, i) => (
                  <div className="q-preview" key={i}>
                    <b>{i+1}. {q.question}</b>
                    <div className="q-options">
                      {q.options.map((opt, j) => (
                        <span key={j} className={j === q.correctAnswer ? 'correct' : ''}>{String.fromCharCode(65+j)}. {opt}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {questions.length > 5 && <p className="q-more">... và {questions.length - 5} câu nữa</p>}
              </div>
            )}

            <button className="btn-create-room" onClick={handleCreateRoom} disabled={loading || questions.length === 0}>
              {loading ? '⏳ Đang tạo...' : `🚀 Tạo phòng (${questions.length} câu)`}
            </button>
          </div>
        )}

        {/* ── ROOM LIVE ── */}
        {view === 'room-live' && activeRoom && (
          <div className="room-live">
            <div className="room-header">
              <div>
                <h2>🔴 {activeRoom.title}</h2>
                <div className="room-code-display">Mã phòng: <strong>{activeRoom.roomCode}</strong></div>
              </div>
              <div className="room-qr">
                <div className="qr-placeholder">📱 Học sinh nhập mã: <b>{activeRoom.roomCode}</b></div>
              </div>
            </div>

            {/* Student list */}
            <div className="students-joined">
              <h3>👥 Học sinh đã vào ({students.length})</h3>
              <div className="student-chips">
                {students.map(s => (
                  <div className="student-chip" key={s.studentId}>
                    <span>{s.studentAvatar || '🐸'}</span> {s.studentName}
                  </div>
                ))}
                {students.length === 0 && <p className="empty-students">Chờ học sinh vào phòng...</p>}
              </div>
            </div>

            {/* Controls */}
            {quizState === 'waiting' && (
              <button className="btn-start-quiz" onClick={handleStartQuiz} disabled={students.length === 0}>
                ▶ Bắt đầu Quiz {students.length > 0 ? `(${students.length} người)` : '(Chờ học sinh)'}
              </button>
            )}

            {quizState === 'question' && currentQ && (
              <div className="live-question">
                <div className="q-progress">Câu {currentQ.questionIndex + 1}/{currentQ.totalQuestions}</div>
                <div className="q-timer" style={{ '--pct': `${(timer / currentQ.timeLimit) * 100}%` }}>{timer}s</div>
                <div className="q-text">{currentQ.question}</div>
                <div className="q-options-grid">
                  {currentQ.options.map((opt, i) => (
                    <div className="q-option-box" key={i} style={{ background: ['#e74c3c','#3498db','#2ecc71','#f39c12'][i] }}>
                      <span>{['▲','◆','●','■'][i]}</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizState === 'result' && (
              <div className="live-result">
                <h3>📊 Sau câu hỏi này</h3>
                <div className="leaderboard">
                  {leaderboard.slice(0, 5).map((s, i) => (
                    <div className="lb-row" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#fff' }}>{i+1}</span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-next-q" onClick={handleNextQuestion}>▶ Câu tiếp theo</button>
              </div>
            )}

            {quizState === 'ended' && (
              <div className="quiz-ended">
                <h2>🏆 Quiz kết thúc!</h2>
                <div className="final-leaderboard">
                  {leaderboard.map((s, i) => (
                    <div className="lb-row final" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#aaa', fontSize: i < 3 ? '24px' : '18px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                      </span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-new-room" onClick={() => { setView('create-room'); setActiveRoom(null); setQuizState('waiting'); }}>
                  ➕ Tạo phòng mới
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
