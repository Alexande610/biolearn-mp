import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Clock, Trophy, Leaf, RotateCcw, 
  CheckCircle, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// 14 hình ảnh cho 7 lớp (mỗi lớp 2 hình) - sử dụng trực tiếp tiếng Việt và emoji chuẩn
const BIOLOGY_IMAGES = [
  { id: 'c6_1', emoji: '🌱', name: 'Tế bào' }, 
  { id: 'c6_2', emoji: '🦠', name: 'Vi sinh vật' }, 
  { id: 'c7_1', emoji: '☀️', name: 'Quang hợp' }, 
  { id: 'c7_2', emoji: '🫁', name: 'Hô hấp' }, 
  { id: 'c8_1', emoji: '❤️', name: 'Tim mạch' }, 
  { id: 'c8_2', emoji: '🧠', name: 'Thần kinh' }, 
  { id: 'c9_1', emoji: '🧬', name: 'ADN' }, 
  { id: 'c9_2', emoji: '✖️', name: 'NST' }, 
  { id: 'c10_1', emoji: '⚡', name: 'Ti thể' }, 
  { id: 'c10_2', emoji: '🟢', name: 'Lục lạp' }, 
  { id: 'c11_1', emoji: '🌿', name: 'Sinh lý' }, 
  { id: 'c11_2', emoji: '💧', name: 'Thoát nước' }, 
  { id: 'c12_1', emoji: '🧪', name: 'Gen' }, 
  { id: 'c12_2', emoji: '🔬', name: 'Đột biến' }, 
];

// Tạo 28 thẻ từ 14 hình (mỗi hình tạo 2 thẻ giống nhau)
function createCards() {
  const cards = [];
  BIOLOGY_IMAGES.forEach((img) => {
    // Tạo 2 thẻ cho mỗi hình
    cards.push({
      id: `${img.id}-a`,
      pairId: img.id,
      emoji: img.emoji,
      name: img.name,
    });
    cards.push({
      id: `${img.id}-b`,
      pairId: img.id,
      emoji: img.emoji,
      name: img.name,
    });
  });
  // Shuffle
  return cards.sort(() => Math.random() - 0.5);
}

export default function MiniGamePage() {
  const navigate = useNavigate();
  const { user, updateStats } = useAuth();

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); // IDs của thẻ đang lật
  const [matched, setMatched] = useState([]); // pairIds đã ghép đúng
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [canPlay, setCanPlay] = useState(true);
  const [playsLeft, setPlaysLeft] = useState(2);
  const [showExit, setShowExit] = useState(false);
  const [animatingSwap, setAnimatingSwap] = useState(null);
  const cardRefs = useRef([]);

  const startNewGame = () => {
    setCards(createCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeLeft(300);
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    setIsChecking(false);
    setAnimatingSwap(null);
  };

  const checkPlaysLeft = async () => {
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('mini_game_claims_today, last_active_at')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        // Kiểm tra xem đã qua ngày mới chưa
        const today = new Date().toDateString();
        const lastActive = data.last_active_at ? new Date(data.last_active_at).toDateString() : '';
        
        let claimsToday = data.mini_game_claims_today || 0;
        if (today !== lastActive) {
          claimsToday = 0; // Reset ngày mới
        }
        
        setPlaysLeft(Math.max(0, 2 - claimsToday));
        setCanPlay(claimsToday < 2);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Khởi tạo game
  useEffect(() => {
    startNewGame();
    checkPlaysLeft();
  }, []);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, gameWon]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // Click thẻ
  const handleClick = (card) => {
    if (isChecking || animatingSwap) return;
    if (flipped.includes(card.id)) return;
    if (matched.includes(card.pairId)) return;
    if (flipped.length >= 2) return;

    if (!gameStarted) setGameStarted(true);

    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);

      const first = cards.find(c => c.id === newFlipped[0]);
      const second = cards.find(c => c.id === newFlipped[1]);

      if (first.pairId === second.pairId) {
        // Đúng cặp
        setTimeout(() => {
          setMatched(m => [...m, first.pairId]);
          setFlipped([]);
          setIsChecking(false);
          if (matched.length + 1 === 14) {
            handleWin();
          }
        }, 600);
      } else {
        // Sai - hoán đổi vị trí 2 thẻ
        setTimeout(() => {
          setFlipped([]);
          // Chờ thẻ úp xuống xong rồi mới tráo đổi
          setTimeout(() => {
            swapCards(first, second);
          }, 300);
        }, 1000);
      }
    }
  };

  // Hoán đổi 2 thẻ sai với animation
  const swapCards = (card1, card2) => {
    const idx1 = cards.findIndex(c => c.id === card1.id);
    const idx2 = cards.findIndex(c => c.id === card2.id);
    
    // Tính toán khoảng cách để CSS Translate di chuyển thẻ
    const el1 = cardRefs.current[idx1];
    const el2 = cardRefs.current[idx2];
    
    if (el1 && el2) {
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();
      
      setAnimatingSwap({ 
        idx1, 
        idx2,
        deltaX1: rect2.left - rect1.left,
        deltaY1: rect2.top - rect1.top,
        deltaX2: rect1.left - rect2.left,
        deltaY2: rect1.top - rect2.top
      });
    } else {
      setAnimatingSwap({ idx1, idx2, deltaX1: 0, deltaY1: 0, deltaX2: 0, deltaY2: 0 });
    }
    
    setTimeout(() => {
      setCards(prev => {
        const newCards = [...prev];
        [newCards[idx1], newCards[idx2]] = [newCards[idx2], newCards[idx1]];
        return newCards;
      });
      setAnimatingSwap(null);
      setIsChecking(false);
    }, 600); // 600ms = thời gian thẻ "bay"
  };

  const handleWin = async () => {
    setGameWon(true);
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('stamina, max_stamina, energy, mini_game_claims_today, last_active_at')
        .eq('id', userId)
        .single();

      const today = new Date().toDateString();
      const lastActive = profile?.last_active_at ? new Date(profile.last_active_at).toDateString() : '';
      
      let claimsToday = profile?.mini_game_claims_today || 0;
      if (today !== lastActive) {
        claimsToday = 0;
      }

      if (claimsToday < 2) {
        const currentStamina = profile?.stamina ?? profile?.energy ?? 0;
        const maxStamina = profile?.max_stamina ?? 20;
        const newEnergy = Math.min(maxStamina, currentStamina + 10);
        const newClaims = claimsToday + 1;

        await supabase
          .from('profiles')
          .update({
            stamina: newEnergy,
            energy: newEnergy,
            mini_game_claims_today: newClaims,
            last_active_at: new Date().toISOString()
          })
          .eq('id', userId);

        setPlaysLeft(2 - newClaims);
        setCanPlay(newClaims < 2);
        if (updateStats) updateStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isFlipped = (card) => flipped.includes(card.id) || matched.includes(card.pairId);
  const isMatched = (card) => matched.includes(card.pairId);

  // Không còn lượt
  if (!canPlay) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <header className="p-4 flex items-center justify-between border-b border-slate-200/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl">
          <button onClick={() => navigate('/home')} className="p-2 rounded-full bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200/80 dark:hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-white" />
          </button>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white">Mini Game</h1>
          <div className="w-9"></div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/80 dark:bg-white/10 backdrop-blur border border-slate-200 dark:border-white/20 rounded-2xl p-6 text-center max-w-sm shadow-xl">
            <Clock className="w-16 h-16 text-slate-500 dark:text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-2">Hết lượt chơi!</h2>
            <p className="text-slate-700 dark:text-gray-300 mb-4">Bạn đã chơi đủ 2 lượt hôm nay</p>
            <button onClick={() => navigate('/home')} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-600/35 transition-all">
              Về trang chủ
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Header */}
      <header className="p-3 border-b border-slate-200/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => gameStarted && !gameOver && !gameWon ? setShowExit(true) : navigate('/home')} 
            className="p-2 rounded-full bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200/80 dark:hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-white" />
          </button>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> Mini Game
          </h1>
          <button onClick={startNewGame} disabled={gameStarted && !gameOver && !gameWon}
            className="p-2 rounded-full bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200/80 dark:hover:bg-white/20 disabled:opacity-50 transition-all">
            <RotateCcw className="w-5 h-5 text-slate-800 dark:text-white" />
          </button>
        </div>
        
        {/* Stats */}
        <div className="flex justify-between max-w-2xl mx-auto mt-2 bg-white/80 dark:bg-black/20 rounded-xl p-2 text-sm border border-slate-200 dark:border-white/20 shadow-sm">
          <div className="flex items-center gap-1">
            <Clock className={`w-4 h-4 ${timeLeft <= 60 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-white'}`} />
            <span className={`font-mono ${timeLeft <= 60 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-white'}`}>{formatTime(timeLeft)}</span>
          </div>
          <div className="text-slate-850 dark:text-white">Lượt: <b className="text-slate-950 dark:text-white">{moves}</b></div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-slate-850 dark:text-white font-bold">{matched.length}/14</span>
          </div>
        </div>
      </header>

      {/* Game */}
      <main className="flex-1 p-3">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <div className="bg-white/90 dark:bg-slate-900/60 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-3 mb-4 text-center shadow-md backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-sm">
              <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-900 dark:text-emerald-300 font-medium">
                Hoàn thành để nhận +10 năng lượng!
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Chú ý: Lật sai 2 thẻ sẽ bị bay tráo đổi vị trí!
              </span>
            </div>
          </div>

          {/* Grid 7x4 = 28 thẻ */}
          <div className="grid grid-cols-7 gap-1.5">
            {cards.map((card, idx) => {
              const flippedState = isFlipped(card);
              const matchedState = isMatched(card);
              const isSwapping1 = animatingSwap && animatingSwap.idx1 === idx;
              const isSwapping2 = animatingSwap && animatingSwap.idx2 === idx;
              
              let transformStyle = { perspective: '600px' };
              let additionalClasses = 'transition-all duration-300';
              
              if (isSwapping1) {
                transformStyle.transform = `translate(${animatingSwap.deltaX1}px, ${animatingSwap.deltaY1}px) scale(1.1) rotate(3deg)`;
                transformStyle.zIndex = 50;
                transformStyle.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                additionalClasses = 'shadow-2xl shadow-black/60 opacity-90';
              } else if (isSwapping2) {
                transformStyle.transform = `translate(${animatingSwap.deltaX2}px, ${animatingSwap.deltaY2}px) scale(1.1) rotate(-3deg)`;
                transformStyle.zIndex = 40;
                transformStyle.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                additionalClasses = 'shadow-2xl shadow-black/60 opacity-90';
              } else if (animatingSwap) {
                additionalClasses += ' opacity-80';
              }
              
              return (
                <div
                  key={card.id}
                  ref={el => cardRefs.current[idx] = el}
                  onClick={() => handleClick(card)}
                  className={`
                    aspect-square cursor-pointer 
                    ${matchedState ? 'opacity-40 pointer-events-none' : ''}
                    ${additionalClasses}
                  `}
                  style={transformStyle}
                >
                  <div
                    className={`
                      relative w-full h-full transition-transform duration-500
                      ${flippedState ? 'rotate-y-180' : ''}
                    `}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: flippedState ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Mặt sau (úp) */}
                    <div 
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 dark:from-purple-600 dark:to-purple-800 flex items-center justify-center backface-hidden shadow-md"
                      style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #a855f7, #6b21a8)' }}
                    >
                      <span className="text-xl" style={{ color: '#ffffff' }}>🧬</span>
                    </div>
                    
                    {/* Mặt trước (ngửa) */}
                    <div 
                      className="absolute inset-0 rounded-lg flex flex-col items-center justify-center backface-hidden shadow-md"
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      }}
                    >
                      <span className="text-lg sm:text-xl" style={{ color: '#ffffff' }}>{card.emoji}</span>
                      <span className="text-[8px] sm:text-[9px] font-bold mt-1 leading-none text-center px-0.5" style={{ color: '#ffffff' }}>{card.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hướng dẫn */}
          {!gameStarted && (
            <div className="text-center mt-4 text-slate-800 dark:text-slate-300 text-sm bg-white/40 dark:bg-black/10 p-2 rounded-xl border border-slate-200/20 backdrop-blur-sm">
              <p className="font-semibold">Nhấn vào thẻ để bắt đầu!</p>
              <p className="text-xs text-slate-700 dark:text-gray-400 mt-0.5">Ghép 2 hình giống nhau (14 cặp)</p>
            </div>
          )}
          
          <p className="text-center text-slate-800 dark:text-slate-350 text-xs mt-3 font-bold">Còn {playsLeft} lượt hôm nay</p>
        </div>
      </main>

      {/* Modal thoát */}
      {showExit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Cảnh báo!</h2>
            <p className="text-slate-700 dark:text-gray-300 mb-4">Thoát sẽ mất lượt chơi và không nhận thưởng!</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowExit(false); navigate('/home'); }} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-550 rounded-xl text-white font-semibold shadow-md shadow-red-500/20 transition-all">Thoát</button>
              <button onClick={() => setShowExit(false)} 
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold shadow-md shadow-green-500/20 transition-all">Chơi tiếp</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hết giờ */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
            <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Hết thời gian!</h2>
            <p className="text-slate-700 dark:text-gray-300 mb-4">Ghép được {matched.length}/14 cặp</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/home')} 
                className="flex-1 py-2.5 bg-slate-500 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all">Về trang chủ</button>
              {playsLeft > 0 && (
                <button onClick={startNewGame} 
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold shadow-md shadow-purple-500/20 transition-all">Chơi lại</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal thắng */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 animate-bounce" />
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Tuyệt vời!</h2>
            <p className="text-slate-700 dark:text-gray-300 mb-2">Hoàn thành trong {moves} lượt!</p>
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-3 mb-4">
              <Leaf className="w-6 h-6 text-green-500 inline mr-2 animate-pulse" />
              <span className="text-green-700 dark:text-green-400 font-bold">+10 Năng lượng</span>
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-sm mb-3">Còn {playsLeft} lượt hôm nay</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/home')} 
                className="flex-1 py-2.5 bg-slate-500 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all">Về trang chủ</button>
              {playsLeft > 0 && (
                <button onClick={startNewGame} 
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold shadow-md shadow-purple-500/20 transition-all">Chơi tiếp</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

