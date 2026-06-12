import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Heart, Clock, Trophy, Star, Zap, 
  Bot, Users, CheckCircle, XCircle, Swords
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Sample questions - sẽ được load từ server theo lớp
const sampleQuestions = {
  6: [
    { id: 1, question: 'Đơn vị cơ bản cấu tạo nên cơ thể sinh vật là gì?', options: ['Mô', 'Tế bào', 'Cơ quan', 'Hệ cơ quan'], correct: 1 },
    { id: 2, question: 'Tế bào thực vật khác tế bào động vật ở điểm nào?', options: ['Có nhân', 'Có thành tế bào', 'Có ti thể', 'Có ribosome'], correct: 1 },
    { id: 3, question: 'Lục lạp có vai trò gì?', options: ['Hô hấp', 'Quang hợp', 'Tiêu hóa', 'Bài tiết'], correct: 1 },
    { id: 4, question: 'Sinh vật nào thuộc giới Thực vật?', options: ['Vi khuẩn', 'Nấm men', 'Rêu', 'Trùng đế giày'], correct: 2 },
    { id: 5, question: 'Virus thuộc giới sinh vật nào?', options: ['Giới Khởi sinh', 'Giới Nguyên sinh', 'Không thuộc giới nào', 'Giới Nấm'], correct: 2 },
    { id: 6, question: 'Bào quan nào chứa vật chất di truyền?', options: ['Ti thể', 'Lục lạp', 'Nhân tế bào', 'Ribosome'], correct: 2 },
    { id: 7, question: 'Mô là gì?', options: ['Tập hợp tế bào giống nhau', 'Một tế bào lớn', 'Cơ quan của cơ thể', 'Hệ cơ quan'], correct: 0 },
    { id: 8, question: 'Cơ thể đơn bào là cơ thể có bao nhiêu tế bào?', options: ['Một', 'Hai', 'Ba', 'Nhiều'], correct: 0 },
    { id: 9, question: 'Sinh vật nào là đơn bào?', options: ['Con người', 'Cây lúa', 'Trùng roi', 'Con ếch'], correct: 2 },
    { id: 10, question: 'Nhiễm sắc thể nằm ở đâu trong tế bào?', options: ['Tế bào chất', 'Nhân', 'Màng sinh chất', 'Thành tế bào'], correct: 1 },
  ],
  7: [
    { id: 1, question: 'Quang hợp xảy ra ở đâu trong tế bào?', options: ['Ti thể', 'Nhân', 'Lục lạp', 'Ribosome'], correct: 2 },
    { id: 2, question: 'Sản phẩm của quang hợp là gì?', options: ['O2 và nước', 'CO2 và glucose', 'O2 và glucose', 'CO2 và nước'], correct: 2 },
    { id: 3, question: 'Hô hấp tế bào xảy ra ở đâu?', options: ['Lục lạp', 'Ti thể', 'Nhân', 'Ribosome'], correct: 1 },
    { id: 4, question: 'Cảm ứng ở thực vật gọi là gì?', options: ['Phản xạ', 'Hướng động', 'Co cơ', 'Phân bào'], correct: 1 },
    { id: 5, question: 'Sinh sản vô tính là gì?', options: ['Có sự kết hợp giao tử', 'Không có sự kết hợp giao tử', 'Chỉ có ở động vật', 'Chỉ có ở thực vật'], correct: 1 },
    { id: 6, question: 'Ví dụ về sinh sản vô tính?', options: ['Thụ phấn', 'Giâm cành', 'Thụ tinh', 'Giao phối'], correct: 1 },
    { id: 7, question: 'Enzym có vai trò gì?', options: ['Cung cấp năng lượng', 'Xúc tác phản ứng', 'Vận chuyển chất', 'Bảo vệ cơ thể'], correct: 1 },
    { id: 8, question: 'ATP là gì?', options: ['Protein', 'Chất mang năng lượng', 'Lipid', 'Glucid'], correct: 1 },
    { id: 9, question: 'Sinh trưởng là gì?', options: ['Tăng kích thước', 'Giảm kích thước', 'Sinh sản', 'Hô hấp'], correct: 0 },
    { id: 10, question: 'Phát triển bao gồm?', options: ['Chỉ sinh trưởng', 'Sinh trưởng và phân hóa', 'Chỉ phân hóa', 'Chỉ sinh sản'], correct: 1 },
  ],
  8: [
    { id: 1, question: 'Hệ vận động gồm những bộ phận nào?', options: ['Xương và cơ', 'Tim và phổi', 'Dạ dày và ruột', 'Não và tủy sống'], correct: 0 },
    { id: 2, question: 'Máu được bơm đi từ đâu?', options: ['Phổi', 'Tim', 'Gan', 'Thận'], correct: 1 },
    { id: 3, question: 'Hồng cầu có chức năng gì?', options: ['Bảo vệ cơ thể', 'Vận chuyển O2', 'Đông máu', 'Tiêu hóa'], correct: 1 },
    { id: 4, question: 'Phổi có chức năng gì?', options: ['Bơm máu', 'Trao đổi khí', 'Tiêu hóa', 'Bài tiết'], correct: 1 },
    { id: 5, question: 'Dạ dày thuộc hệ cơ quan nào?', options: ['Hô hấp', 'Tuần hoàn', 'Tiêu hóa', 'Bài tiết'], correct: 2 },
    { id: 6, question: 'Thận có chức năng gì?', options: ['Hô hấp', 'Lọc máu', 'Tiêu hóa', 'Vận động'], correct: 1 },
    { id: 7, question: 'Hệ thần kinh điều khiển hoạt động gì?', options: ['Chỉ vận động', 'Chỉ tiêu hóa', 'Mọi hoạt động', 'Chỉ hô hấp'], correct: 2 },
    { id: 8, question: 'Tế bào thần kinh gọi là gì?', options: ['Neuron', 'Hồng cầu', 'Bạch cầu', 'Tiểu cầu'], correct: 0 },
    { id: 9, question: 'Nội tiết tố là gì?', options: ['Enzyme', 'Hormone', 'Kháng thể', 'Vitamin'], correct: 1 },
    { id: 10, question: 'Tuyến giáp sản xuất hormone gì?', options: ['Insulin', 'Thyroxin', 'Adrenalin', 'Glucagon'], correct: 1 },
  ],
  9: [
    { id: 1, question: 'Mendel được gọi là cha đẻ của ngành nào?', options: ['Sinh thái học', 'Di truyền học', 'Tiến hóa', 'Phân loại học'], correct: 1 },
    { id: 2, question: 'Gen nằm ở đâu?', options: ['Tế bào chất', 'Nhiễm sắc thể', 'Ribosome', 'Ti thể'], correct: 1 },
    { id: 3, question: 'ADN có cấu trúc như thế nào?', options: ['Đơn xoắn', 'Kép xoắn', 'Thẳng', 'Vòng'], correct: 1 },
    { id: 4, question: 'Đột biến gen là gì?', options: ['Thay đổi số lượng NST', 'Thay đổi cấu trúc gen', 'Thay đổi môi trường', 'Thay đổi tế bào'], correct: 1 },
    { id: 5, question: 'Bệnh máu khó đông do gen nào gây ra?', options: ['Gen trội', 'Gen lặn trên NST X', 'Gen trên NST Y', 'Gen ti thể'], correct: 1 },
    { id: 6, question: 'Tiến hóa là gì?', options: ['Sự biến đổi của sinh vật', 'Sự sinh sản', 'Sự sinh trưởng', 'Sự hô hấp'], correct: 0 },
    { id: 7, question: 'Darwin đề xuất học thuyết nào?', options: ['Di truyền', 'Chọn lọc tự nhiên', 'Tế bào', 'Sinh thái'], correct: 1 },
    { id: 8, question: 'Hệ sinh thái bao gồm?', options: ['Chỉ sinh vật', 'Sinh vật và môi trường', 'Chỉ môi trường', 'Chỉ thực vật'], correct: 1 },
    { id: 9, question: 'Chuỗi thức ăn bắt đầu từ?', options: ['Động vật ăn thịt', 'Sinh vật sản xuất', 'Sinh vật tiêu thụ', 'Sinh vật phân giải'], correct: 1 },
    { id: 10, question: 'Ô nhiễm môi trường gây hại gì?', options: ['Tăng đa dạng sinh học', 'Giảm đa dạng sinh học', 'Không ảnh hưởng', 'Tăng số loài'], correct: 1 },
  ],
};

// BOT AI logic
const botAnswer = (difficulty, correctIndex) => {
  const accuracyRates = {
    easy: 0.4,
    medium: 0.6,
    hard: 0.85
  };
  
  const accuracy = accuracyRates[difficulty] || 0.6;
  
  if (Math.random() < accuracy) {
    return correctIndex;
  } else {
    // Random wrong answer
    let wrongIndex;
    do {
      wrongIndex = Math.floor(Math.random() * 4);
    } while (wrongIndex === correctIndex);
    return wrongIndex;
  }
};

export default function BattlePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Battle params
  const mode = searchParams.get('mode') || 'pve'; // pvp or pve
  const classId = parseInt(searchParams.get('class')) || 6;
  const difficulty = searchParams.get('difficulty') || 'medium';
  const roomId = searchParams.get('room');
  const opponentName = searchParams.get('opponent') || 'Đối thủ';
  
  // Xác định tên đối thủ hiển thị
  const displayOpponentName = mode === 'pvp' ? opponentName : 'BOT';
  
  // Game state
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [playerAnswer, setPlayerAnswer] = useState(null);
  const [botAnswer_, setBotAnswer_] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  
  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        // Try to load from Supabase if table exists, else fallback
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('class_id', classId);

        if (!error && data && data.length >= 10) {
          const shuffled = data.sort(() => Math.random() - 0.5);
          setQuestions(shuffled.slice(0, 10));
        } else {
          throw new Error('Not enough questions in DB');
        }
      } catch (err) {
        // Use sample questions
        const classQuestions = sampleQuestions[classId] || sampleQuestions[6];
        const shuffled = [...classQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 10));
      }
      setLoading(false);
    };
    
    loadQuestions();
  }, [classId]);
  
  // Timer
  useEffect(() => {
    if (loading || gameOver || showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, gameOver, showResult, currentQuestion]);
  
  const handleTimeout = () => {
    if (isAnswering) return;
    setIsAnswering(true);
    
    // BOT answers
    const correctIdx = questions[currentQuestion]?.correct;
    const botChoice = botAnswer(difficulty, correctIdx);
    setBotAnswer_(botChoice);
    
    // Player didn't answer
    setPlayerAnswer(-1);
    
    // BOT gets point if correct
    if (botChoice === correctIdx) {
      setBotScore(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };
  
  const handleAnswer = useCallback((answerIndex) => {
    if (isAnswering || showResult) return;
    setIsAnswering(true);
    
    const correctIdx = questions[currentQuestion]?.correct;
    
    // Player answer
    setPlayerAnswer(answerIndex);
    
    // BOT answer (with delay for realism)
    const botDelay = mode === 'pve' ? Math.random() * 1000 + 500 : 0;
    setTimeout(() => {
      const botChoice = botAnswer(difficulty, correctIdx);
      setBotAnswer_(botChoice);
      
      // Calculate scores
      if (answerIndex === correctIdx) {
        setPlayerScore(prev => prev + 1);
      }
      if (botChoice === correctIdx) {
        setBotScore(prev => prev + 1);
      }
      
      setShowResult(true);
      
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }, botDelay);
  }, [isAnswering, showResult, currentQuestion, questions, difficulty, mode]);
  
  const nextQuestion = () => {
    if (currentQuestion >= 9) {
      setGameOver(true);
      saveResult();
      return;
    }
    
    setCurrentQuestion(prev => prev + 1);
    setPlayerAnswer(null);
    setBotAnswer_(null);
    setShowResult(false);
    setTimeLeft(15);
    setIsAnswering(false);
  };
  
  const saveResult = async () => {
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;
      const won = playerScore > botScore;
      
      const xpGain = won ? 50 : 10;
      const coinsGain = won ? 50 : 5;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, total_score, weekly_score, coins')
        .eq('id', userId)
        .single();
        
      await supabase
        .from('profiles')
        .update({
          xp: (profile?.xp || 0) + xpGain,
          total_score: (profile?.total_score || 0) + xpGain,
          level: Math.max(profile?.level || 1, Math.floor(((profile?.total_score || 0) + xpGain) / 1000) + 1),
          weekly_score: (profile?.weekly_score || 0) + xpGain,
          coins: (profile?.coins || 0) + coinsGain,
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateStats) updateStats();
    } catch (err) {
      console.error('Error saving battle result:', err);
    }
  };
  
  const getResultMessage = () => {
    if (playerScore > botScore) {
      return { text: 'CHIẾN THẮNG!', color: 'text-green-400', icon: '🎉' };
    } else if (playerScore < botScore) {
      return { text: 'THUA CUỘC', color: 'text-red-400', icon: '😢' };
    }
    return { text: 'HÒA', color: 'text-yellow-400', icon: '🤝' };
  };
  
  const getDifficultyLabel = () => {
    const labels = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
    return labels[difficulty] || 'Trung bình';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }
  
  if (gameOver) {
    const result = getResultMessage();
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card text-center max-w-md w-full">
          <div className="text-6xl mb-4">{result.icon}</div>
          <h1 className={`text-3xl font-bold ${result.color} mb-4`}>{result.text}</h1>
          
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-bold text-2xl">{playerScore}</p>
              <p className="text-gray-400">Bạn</p>
            </div>
            
            <div className="flex items-center">
              <Swords className="w-8 h-8 text-purple-400" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bot className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-bold text-2xl">{botScore}</p>
              <p className="text-gray-400">{displayOpponentName} {mode === 'pve' && `(${getDifficultyLabel()})`}</p>
            </div>
          </div>
          
          <p className="text-gray-400 mb-6">Lớp {classId} • 10 câu hỏi</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home', { replace: true })}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold"
            >
              Về trang chủ
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 rounded-xl text-white font-semibold"
            >
              Chơi lại
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-purple-700/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/home', { replace: true })}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center">
              <h1 className="text-lg font-bold text-white">
                {mode === 'pvp' ? 'Đối kháng PvP' : 'Đối kháng BOT'}
              </h1>
              <p className="text-purple-300 text-sm">Lớp {classId} • {mode === 'pvp' ? 'Realtime' : getDifficultyLabel()}</p>
            </div>

            <div className="flex items-center gap-1 bg-red-500/30 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 text-red-300" />
              <span className={`text-white font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Score Board */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Bạn</p>
              <p className="text-2xl font-bold text-green-400">{playerScore}</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400">Câu {currentQuestion + 1}/10</p>
            <Swords className="w-8 h-8 text-purple-400 mx-auto" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-semibold">{displayOpponentName}</p>
              <p className="text-2xl font-bold text-red-400">{botScore}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="game-card mb-6">
          <h2 className="text-xl text-white font-semibold mb-4">
            {currentQ?.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ?.options.map((option, index) => {
            let bgClass = 'bg-white/10 hover:bg-white/20';
            let borderClass = 'border border-white/20';
            
            if (showResult) {
              if (index === currentQ.correct) {
                bgClass = 'bg-green-500/30';
                borderClass = 'border-2 border-green-500';
              } else if (index === playerAnswer && playerAnswer !== currentQ.correct) {
                bgClass = 'bg-red-500/30';
                borderClass = 'border-2 border-red-500';
              }
            } else if (playerAnswer === index) {
              bgClass = 'bg-purple-500/30';
              borderClass = 'border-2 border-purple-500';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult || isAnswering}
                className={`w-full p-4 rounded-xl text-left transition-all ${bgClass} ${borderClass} ${
                  showResult || isAnswering ? 'cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white flex-1">{option}</span>
                  
                  {showResult && (
                    <>
                      {index === currentQ.correct && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      {index === playerAnswer && playerAnswer !== currentQ.correct && (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      {index === botAnswer_ && (
                        <div className="flex items-center gap-1 text-xs">
                          <Bot className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400">BOT</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Result indicator */}
        {showResult && (
          <div className="mt-4 text-center">
            {playerAnswer === currentQ?.correct ? (
              <p className="text-green-400 font-semibold">✓ Chính xác!</p>
            ) : playerAnswer === -1 ? (
              <p className="text-yellow-400 font-semibold">⏱ Hết giờ!</p>
            ) : (
              <p className="text-red-400 font-semibold">✗ Sai rồi!</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
