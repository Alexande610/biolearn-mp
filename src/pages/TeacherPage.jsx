import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

  async function fetchMyRooms() {
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
  }

  // â”€â”€ File upload (Xá»­ lĂ½ Ä‘á»c file cá»¥c bá»™ thay vĂ¬ gá»i API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus('â³ Äang Ä‘á»c file...');
    
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
        setUploadStatus(`âœ… Äá»c Ä‘Æ°á»£c ${parsedQ.length} cĂ¢u há»i tá»« file`);
      } catch (err) {
        setUploadStatus('âŒ Lá»—i khi Ä‘á»c file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // â”€â”€ Create room â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCreateRoom = async () => {
    if (questions.length === 0) { setError('Cáº§n Ă­t nháº¥t 1 cĂ¢u há»i'); return; }
    setLoading(true); setError('');
    try {
      const code = createRoomCode();
      
      const { data, error } = await supabase.from('quiz_rooms').insert([{
        room_code: code,
        teacher_id: user.id,
        title: roomTitle || 'PhĂ²ng thi Ä‘áº¥u Sinh Há»c',
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

  // â”€â”€ Supabase Realtime cho Server (GiĂ¡o ViĂªn) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openRoomSocket = (room) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    
    // Táº¡o máº£ng há»c sinh local tracking
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
        const std = currentStudents.find(s => s.studentId === payload.studentId);
        if (std) {
          std.score = (std.score || 0) + payload.score;
          std.lastAnswerTime = payload.timeLeft;
        }
        setStudents([...currentStudents]);
        broadcastStudentList();
      })
      .subscribe();
      
    // Gáº¯n state lĂªn ref Ä‘á»ƒ truy cáº­p trong interval
    channel.currentStudents = currentStudents;
  };

  const handleStartQuiz = async () => {
    if (!channelRef.current || !activeRoom) return;
    
    await supabase.from('quiz_rooms').update({ status: 'playing', current_question_index: 0 }).eq('id', activeRoom.id);
    
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
       // Háº¿t cĂ¢u há»i -> káº¿t thĂºc
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
    
    // Báº¯n sang cho HS
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
          // Háº¿t giá» -> Show káº¿t quáº£ (Báº£ng xáº¿p háº¡ng local)
          showResult();
          return 0; 
        } 
        return t - 1; 
      });
    }, 1000);
  };
  
  const showResult = async () => {
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
    const finalLb = channelRef.current.currentStudents.sort((a,b) => b.score - a.score);
    try {
      await supabase
        .from('quiz_rooms')
        .update({ 
          status: 'finished',
          participants: finalLb
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error updating quiz participants in DB:', err);
    }
    setQuizState('ended');
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
          <span>đŸ«</span>
          <div>
            <div className="sidebar-name">{user.displayName || user.username}</div>
            <div className="sidebar-role">GiĂ¡o viĂªn</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>đŸ“ Báº£ng Ä‘iá»u khiá»ƒn</button>
          <button className={view === 'create-room' ? 'active' : ''} onClick={() => setView('create-room')}>â• Táº¡o phĂ²ng Quiz</button>
          {activeRoom && <button className={view === 'room-live' ? 'active' : ''} onClick={() => setView('room-live')}>đŸ”´ PhĂ²ng Ä‘ang má»Ÿ</button>}
        </nav>
        <button className="sidebar-logout" onClick={() => navigate('/')}>â† Vá» trang chá»§</button>
      </aside>

      {/* Main content */}
      <main className="teacher-main">

        {/* â”€â”€ DASHBOARD â”€â”€ */}
        {view === 'dashboard' && (
          <div className="teacher-dashboard">
            <h2>đŸ“ Báº£ng Ä‘iá»u khiá»ƒn</h2>
            <div className="dash-stats">
              <div className="stat-card"><span>đŸ </span><div><b>{myRooms.length}</b><small>Tá»•ng phĂ²ng</small></div></div>
              <div className="stat-card"><span>â–¶ï¸</span><div><b>{myRooms.filter(r => r.status === 'playing').length}</b><small>Äang cháº¡y</small></div></div>
              <div className="stat-card"><span>âœ…</span><div><b>{myRooms.filter(r => r.status === 'finished').length}</b><small>ÄĂ£ káº¿t thĂºc</small></div></div>
            </div>

            <h3>đŸ“‹ PhĂ²ng gáº§n Ä‘Ă¢y</h3>
            {myRooms.length === 0 ? (
              <div className="empty-state">ChÆ°a cĂ³ phĂ²ng nĂ o. <button onClick={() => setView('create-room')}>Táº¡o ngay â†’</button></div>
            ) : (
              <div className="rooms-list">
                {myRooms.map(room => (
                  <div className="room-card" key={room.roomCode}>
                    <div className="room-code">#{room.roomCode}</div>
                    <div className="room-info">
                      <b>{room.title}</b>
                      <small>{room.questionCount} cĂ¢u Â· {room.studentCount} há»c sinh</small>
                    </div>
                    <div className={`room-status ${room.status}`}>{room.status === 'waiting' ? 'â³ Chá»' : room.status === 'playing' ? 'đŸ”´ Live' : 'âœ… Xong'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ CREATE ROOM â”€â”€ */}
        {view === 'create-room' && (
          <div className="create-room">
            <h2>â• Táº¡o phĂ²ng Quiz má»›i</h2>
            {error && <div className="teacher-error">âŒ {error}</div>}

            <div className="form-section">
              <label>TĂªn phĂ²ng Quiz</label>
              <input value={roomTitle} onChange={e => setRoomTitle(e.target.value)} placeholder="VD: Ă”n táº­p ChÆ°Æ¡ng 1 - Táº¿ bĂ o" className="teacher-input" />
            </div>

            <div className="upload-section">
              <h3>đŸ“ Upload file cĂ¢u há»i</h3>
              <div className="upload-format">
                <p><b>Format file TXT/Word/PDF:</b></p>
                <pre>{`Q: CĂ¢u há»i cá»§a báº¡n?
A: ÄĂ¡p Ă¡n A
B: ÄĂ¡p Ă¡n B
C: ÄĂ¡p Ă¡n C
D: ÄĂ¡p Ă¡n D
Answer: A

Q: CĂ¢u há»i tiáº¿p theo?
...`}</pre>
              </div>
              <label className="upload-btn">
                đŸ“ Chá»n file (TXT, PDF, DOCX)
                <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} hidden />
              </label>
              {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
            </div>

            {questions.length > 0 && (
              <div className="questions-preview">
                <h3>đŸ“ Preview {questions.length} cĂ¢u há»i</h3>
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
                {questions.length > 5 && <p className="q-more">... vĂ  {questions.length - 5} cĂ¢u ná»¯a</p>}
              </div>
            )}

            <button className="btn-create-room" onClick={handleCreateRoom} disabled={loading || questions.length === 0}>
              {loading ? 'â³ Äang táº¡o...' : `đŸ€ Táº¡o phĂ²ng (${questions.length} cĂ¢u)`}
            </button>
          </div>
        )}

        {/* â”€â”€ ROOM LIVE â”€â”€ */}
        {view === 'room-live' && activeRoom && (
          <div className="room-live">
            <div className="room-header">
              <div>
                <h2>đŸ”´ {activeRoom.title}</h2>
                <div className="room-code-display">MĂ£ phĂ²ng: <strong>{activeRoom.roomCode}</strong></div>
              </div>
              <div className="room-qr">
                <div className="qr-placeholder">đŸ“± Há»c sinh nháº­p mĂ£: <b>{activeRoom.roomCode}</b></div>
              </div>
            </div>

            {/* Student list */}
            <div className="students-joined">
              <h3>đŸ‘¥ Há»c sinh Ä‘Ă£ vĂ o ({students.length})</h3>
              <div className="student-chips">
                {students.map(s => (
                  <div className="student-chip" key={s.studentId}>
                    <span>{s.studentAvatar || 'đŸ¸'}</span> {s.studentName}
                  </div>
                ))}
                {students.length === 0 && <p className="empty-students">Chá» há»c sinh vĂ o phĂ²ng...</p>}
              </div>
            </div>

            {/* Controls */}
            {quizState === 'waiting' && (
              <button className="btn-start-quiz" onClick={handleStartQuiz} disabled={students.length === 0}>
                â–¶ Báº¯t Ä‘áº§u Quiz {students.length > 0 ? `(${students.length} ngÆ°á»i)` : '(Chá» há»c sinh)'}
              </button>
            )}

            {quizState === 'question' && currentQ && (
              <div className="live-question">
                <div className="q-progress">CĂ¢u {currentQ.questionIndex + 1}/{currentQ.totalQuestions}</div>
                <div className="q-timer" style={{ '--pct': `${(timer / currentQ.timeLimit) * 100}%` }}>{timer}s</div>
                <div className="q-text">{currentQ.question}</div>
                <div className="q-options-grid">
                  {currentQ.options.map((opt, i) => (
                    <div className="q-option-box" key={i} style={{ background: ['#e74c3c','#3498db','#2ecc71','#f39c12'][i] }}>
                      <span>{['â–²','â—†','â—','â– '][i]}</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizState === 'result' && (
              <div className="live-result">
                <h3>đŸ“ Sau cĂ¢u há»i nĂ y</h3>
                <div className="leaderboard">
                  {leaderboard.slice(0, 5).map((s, i) => (
                    <div className="lb-row" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#fff' }}>{i+1}</span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-next-q" onClick={handleNextQuestion}>â–¶ CĂ¢u tiáº¿p theo</button>
              </div>
            )}

            {quizState === 'ended' && (
              <div className="quiz-ended">
                <h2>đŸ† Quiz káº¿t thĂºc!</h2>
                <div className="final-leaderboard">
                  {leaderboard.map((s, i) => (
                    <div className="lb-row final" key={s.studentId}>
                      <span className="lb-rank" style={{ color: medalColors[i] || '#aaa', fontSize: i < 3 ? '24px' : '18px' }}>
                        {i === 0 ? 'đŸ¥‡' : i === 1 ? 'đŸ¥ˆ' : i === 2 ? 'đŸ¥‰' : `${i+1}.`}
                      </span>
                      <span className="lb-name">{s.studentName}</span>
                      <span className="lb-score">{s.score} pts</span>
                    </div>
                  ))}
                </div>
                <button className="btn-new-room" onClick={() => { setView('create-room'); setActiveRoom(null); setQuizState('waiting'); }}>
                  â• Táº¡o phĂ²ng má»›i
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
