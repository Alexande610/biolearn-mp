import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Heart, Trophy, Star, Zap, 
  Play, Pause, RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 50;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 40;
const GROUND_HEIGHT = 100;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GAME_SPEED = 5;

// Sample boss questions
const getBossQuestions = (classId, chapterId, lessonId) => {
  return [
    {
      id: 1,
      question: 'Tế bào nào trong cơ thể người có kích thước lớn nhất?',
      answers: [
        { id: 'A', text: 'Tế bào hồng cầu' },
        { id: 'B', text: 'Tế bào trứng' },
        { id: 'C', text: 'Tế bào thần kinh' },
        { id: 'D', text: 'Tế bào cơ' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 2,
      question: 'Bào quan nào được gọi là "nhà máy năng lượng" của tế bào?',
      answers: [
        { id: 'A', text: 'Nhân' },
        { id: 'B', text: 'Ti thể' },
        { id: 'C', text: 'Lục lạp' },
        { id: 'D', text: 'Ribosome' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 3,
      question: 'Quá trình phân bào nào tạo ra 2 tế bào con giống hệt tế bào mẹ?',
      answers: [
        { id: 'A', text: 'Giảm phân' },
        { id: 'B', text: 'Nguyên phân' },
        { id: 'C', text: 'Phân đôi' },
        { id: 'D', text: 'Nảy chồi' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 4,
      question: 'Thành phần chính của màng tế bào là gì?',
      answers: [
        { id: 'A', text: 'Cellulose' },
        { id: 'B', text: 'Protein và lipid' },
        { id: 'C', text: 'ADN' },
        { id: 'D', text: 'Tinh bột' }
      ],
      correctAnswer: 'B'
    },
    {
      id: 5,
      question: 'Tế bào thực vật khác tế bào động vật ở điểm nào?',
      answers: [
        { id: 'A', text: 'Có nhân' },
        { id: 'B', text: 'Có màng tế bào' },
        { id: 'C', text: 'Có thành tế bào và lục lạp' },
        { id: 'D', text: 'Có ti thể' }
      ],
      correctAnswer: 'C'
    }
  ];
};

export default function BossBattlePage() {
  const { classId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, updateStats } = useAuth();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const playerRef = useRef({ x: 50, y: 400, vy: 0, isJumping: false });
  const obstaclesRef = useRef([]);
  const frameCountRef = useRef(0);

  const [phase, setPhase] = useState('intro'); // intro, runner, quiz, result
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [runnerScore, setRunnerScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Load questions
  useEffect(() => {
    const loadedQuestions = getBossQuestions(classId, chapterId, lessonId);
    setQuestions(loadedQuestions);
  }, [classId, chapterId, lessonId]);

  // Game loop for runner
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;
    const obstacles = obstaclesRef.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f3460');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = '#3a5a40';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Draw grass
    ctx.fillStyle = '#4a7c59';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(i + 10, CANVAS_HEIGHT - GROUND_HEIGHT - 15);
      ctx.lineTo(i + 20, CANVAS_HEIGHT - GROUND_HEIGHT);
      ctx.fill();
    }

    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    // Ground collision
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isJumping = false;
    }

    // Draw player (cute biology mascot)
    ctx.save();
    ctx.translate(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);
    
    // Body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-10, -5, 8, 0, Math.PI * 2);
    ctx.arc(10, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-10, -5, 4, 0, Math.PI * 2);
    ctx.arc(10, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 10, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.restore();

    // Spawn obstacles
    frameCountRef.current++;
    if (frameCountRef.current % 100 === 0) {
      const types = ['rock', 'spike', 'slime'];
      const type = types[Math.floor(Math.random() * types.length)];
      obstacles.push({
        x: CANVAS_WIDTH,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        type
      });
    }

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= GAME_SPEED;

      // Draw obstacle based on type
      ctx.save();
      if (obs.type === 'rock') {
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'spike') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Collision detection
      const playerBox = {
        x: player.x + 10,
        y: player.y + 10,
        width: PLAYER_SIZE - 20,
        height: PLAYER_SIZE - 20
      };

      if (
        playerBox.x < obs.x + obs.width &&
        playerBox.x + playerBox.width > obs.x &&
        playerBox.y < obs.y + obs.height &&
        playerBox.y + playerBox.height > obs.y
      ) {
        // Hit obstacle
        const newHearts = hearts - 1;
        setHearts(newHearts);
        obstacles.splice(i, 1);
        
        if (newHearts <= 0) {
          setIsPlaying(false);
          setPhase('result');
        }
        continue;
      }

      // Remove off-screen obstacles and add score
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        setRunnerScore(prev => prev + 10);
      }
    }

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Điểm: ${runnerScore}`, 20, 40);

    // Draw hearts
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < hearts ? '#ef4444' : '#4b5563';
      ctx.font = '24px Arial';
      ctx.fillText('❤️', CANVAS_WIDTH - 100 + i * 30, 40);
    }

    // Continue game loop
    if (isPlaying && phase === 'runner') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [hearts, runnerScore, isPlaying, phase]);

  // Start/stop game loop
  useEffect(() => {
    if (isPlaying && phase === 'runner') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, phase, gameLoop]);

  // Handle jump
  const handleJump = useCallback(() => {
    const player = playerRef.current;
    if (!player.isJumping && isPlaying) {
      player.vy = JUMP_FORCE;
      player.isJumping = true;
    }
  }, [isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Start runner phase
  const startRunner = () => {
    playerRef.current = { x: 50, y: 400, vy: 0, isJumping: false };
    obstaclesRef.current = [];
    frameCountRef.current = 0;
    setHearts(3);
    setRunnerScore(0);
    setPhase('runner');
    setIsPlaying(true);
  };

  // End runner, start quiz
  const endRunner = () => {
    setIsPlaying(false);
    setPhase('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Handle quiz answer
  const handleAnswerSelect = (answerId) => {
    if (showResult) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 20);
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      finishBossBattle();
    }
  };

  const finishBossBattle = async () => {
    setQuizCompleted(true);
    setPhase('result');

    // Calculate rewards based on remaining hearts
    let pointsReward = 100;
    let coinsReward = 100;
    
    if (hearts === 3) {
      pointsReward = 200;
      coinsReward = 200;
    } else if (hearts === 2) {
      pointsReward = 150;
      coinsReward = 150;
    }

    const totalScore = runnerScore + score + pointsReward;

    // Save progress
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;

      const currentClassProgress = userStats?.class_progress?.[classId] || { completedLevels: [], levelStars: {} };
      const key = `${chapterId}_${lessonId}_boss`;
      const newCompletedLevels = Array.from(new Set([...currentClassProgress.completedLevels, key]));
      
      const newCoins = (userStats?.coins || 0) + coinsReward;
      const newXp = (userStats?.xp || 0) + pointsReward;
      const newBossesDefeated = (userStats?.bosses_defeated || 0) + 1;

      await supabase
        .from('profiles')
        .update({
          coins: newCoins,
          xp: newXp,
          total_score: newXp,
          bosses_defeated: newBossesDefeated,
          class_progress: {
            ...userStats?.class_progress,
            [classId]: {
              ...currentClassProgress,
              completedLevels: newCompletedLevels
            }
          }
        })
        .eq('id', userId);

      if (updateStats) updateStats();
    } catch (err) {
      console.error('Error saving boss progress:', err);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-red-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Boss Battle
            </h1>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((h) => (
                <Heart 
                  key={h}
                  className={`w-6 h-6 ${h <= hearts ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="game-card max-w-md w-full text-center">
            <div className="w-24 h-24 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">👹</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Boss Xuất Hiện!</h2>
            <p className="text-gray-300 mb-6">
              Vượt qua chướng ngại vật và trả lời 5 câu hỏi để đánh bại Boss!
            </p>
            
            <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-white mb-2">Phần thưởng:</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>• 3 ❤️ còn lại: 200 điểm + 200 xu</p>
                <p>• 2 ❤️ còn lại: 150 điểm + 150 xu</p>
                <p>• 1 ❤️ còn lại: 100 điểm + 100 xu</p>
              </div>
            </div>

            <button
              onClick={startRunner}
              className="w-full py-4 rounded-xl font-bold bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Bắt đầu!
            </button>
          </div>
        )}

        {/* Runner Phase */}
        {phase === 'runner' && (
          <div className="text-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleJump}
              onTouchStart={handleJump}
              className="rounded-xl border-2 border-white/20 cursor-pointer touch-none"
            />
            
            <p className="text-gray-400 mt-4">Nhấn hoặc Space để nhảy!</p>
            
            <div className="flex gap-4 justify-center mt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-white font-semibold flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
              </button>
              
              {runnerScore >= 50 && (
                <button
                  onClick={endRunner}
                  className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold"
                >
                  Đến phần Quiz →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Phase */}
        {phase === 'quiz' && currentQuestion && (
          <div className="game-card max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-300">Câu {currentQuestionIndex + 1}/5</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((h) => (
                  <Heart 
                    key={h}
                    className={`w-5 h-5 ${h <= hearts ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-xl text-white font-bold mb-6">{currentQuestion.question}</h2>

            <div className="space-y-3 mb-6">
              {currentQuestion.answers.map((answer) => {
                let bgColor = 'bg-white/10 hover:bg-white/20';
                let borderColor = 'border-transparent';
                
                if (showResult) {
                  if (answer.id === currentQuestion.correctAnswer) {
                    bgColor = 'bg-green-500/30';
                    borderColor = 'border-green-500';
                  } else if (answer.id === selectedAnswer && !isCorrect) {
                    bgColor = 'bg-red-500/30';
                    borderColor = 'border-red-500';
                  }
                } else if (selectedAnswer === answer.id) {
                  bgColor = 'bg-green-600/30';
                  borderColor = 'border-green-400';
                }

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer.id)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${bgColor} ${borderColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        selectedAnswer === answer.id ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                      }`}>
                        {answer.id}
                      </span>
                      <span className="text-white">{answer.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {!showResult ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`w-full py-3 rounded-xl font-bold ${
                  selectedAnswer 
                    ? 'bg-green-500 hover:bg-green-400 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Trả lời
              </button>
            ) : (
              <div>
                <div className={`p-3 rounded-xl mb-4 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <p className={`font-semibold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                    {isCorrect ? '✓ Chính xác!' : '✗ Sai rồi!'}
                  </p>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl font-bold bg-green-500 hover:bg-green-400 text-white"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && (
          <div className="game-card max-w-md w-full text-center">
            {quizCompleted && hearts > 0 ? (
              <>
                <div className="w-24 h-24 bg-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Boss Đã Bại!</h2>
                
                {/* Stars based on hearts */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3].map((s) => (
                    <Star 
                      key={s}
                      className={`w-10 h-10 ${s <= hearts ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                    />
                  ))}
                </div>

                <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Điểm Runner</span>
                    <span className="text-white font-bold">{runnerScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Điểm Quiz</span>
                    <span className="text-white font-bold">{score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thưởng ({hearts}❤️)</span>
                    <span className="text-yellow-400 font-bold">
                      +{hearts === 3 ? 200 : hearts === 2 ? 150 : 100} xu
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">💔</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Thất Bại!</h2>
                <p className="text-gray-300 mb-6">Hãy thử lại nhé!</p>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/map/${classId}`)}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  setPhase('intro');
                  setHearts(3);
                  setScore(0);
                  setRunnerScore(0);
                  setQuizCompleted(false);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Chơi lại
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
