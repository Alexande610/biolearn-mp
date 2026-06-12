import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Clock, Trophy, Leaf, RotateCcw, 
  CheckCircle, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// 14 hÄ‚Â¬nh Ă¡ÂºÂ£nh cho 7 lĂ¡Â»â€ºp (mĂ¡Â»â€”i lĂ¡Â»â€ºp 2 hÄ‚Â¬nh) - tĂ¡ÂºÂ¡o 14 cĂ¡ÂºÂ·p = 28 thĂ¡ÂºÂ»
const BIOLOGY_IMAGES = [
  { id: 'c6_1', emoji: 'Ä‘Å¸â€Â¬', name: 'TĂ¡ÂºÂ¿ bÄ‚Â o' },
  { id: 'c6_2', emoji: 'Ä‘Å¸Â¦Â ', name: 'Vi sinh vĂ¡ÂºÂ­t' },
  { id: 'c7_1', emoji: 'Ă¢Ëœâ‚¬Ă¯Â¸Â', name: 'Quang hĂ¡Â»Â£p' },
  { id: 'c7_2', emoji: 'Ä‘Å¸â€™Â¨', name: 'HÄ‚Â´ hĂ¡ÂºÂ¥p' },
  { id: 'c8_1', emoji: 'Ă¢ÂÂ¤Ă¯Â¸Â', name: 'Tim mĂ¡ÂºÂ¡ch' },
  { id: 'c8_2', emoji: 'Ä‘Å¸Â§Â ', name: 'ThĂ¡ÂºÂ§n kinh' },
  { id: 'c9_1', emoji: 'Ä‘Å¸Â§Â¬', name: 'ADN' },
  { id: 'c9_2', emoji: 'Ä‘Å¸â€â€”', name: 'NST' },
  { id: 'c10_1', emoji: 'Ă¢ÂÂ¡', name: 'Ti thĂ¡Â»Æ’' },
  { id: 'c10_2', emoji: 'Ä‘Å¸Å¸Â¢', name: 'LĂ¡Â»Â¥c lĂ¡ÂºÂ¡p' },
  { id: 'c11_1', emoji: 'Ä‘Å¸Å’Â¿', name: 'Sinh lÄ‚Â½' },
  { id: 'c11_2', emoji: 'Ä‘Å¸â€™Â§', name: 'ThoÄ‚Â¡t nĂ†Â°Ă¡Â»â€ºc' },
  { id: 'c12_1', emoji: 'Ä‘Å¸Â§Âª', name: 'Gen' },
  { id: 'c12_2', emoji: 'Ä‘Å¸Â§Â«', name: 'Ă„ÂĂ¡Â»â„¢t biĂ¡ÂºÂ¿n' },
];

// TĂ¡ÂºÂ¡o 28 thĂ¡ÂºÂ» tĂ¡Â»Â« 14 hÄ‚Â¬nh (mĂ¡Â»â€”i hÄ‚Â¬nh tĂ¡ÂºÂ¡o 2 thĂ¡ÂºÂ» giĂ¡Â»â€˜ng nhau)
function createCards() {
  const cards = [];
  BIOLOGY_IMAGES.forEach((img) => {
    // TĂ¡ÂºÂ¡o 2 thĂ¡ÂºÂ» cho mĂ¡Â»â€”i hÄ‚Â¬nh
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
  const [flipped, setFlipped] = useState([]); // IDs cĂ¡Â»Â§a thĂ¡ÂºÂ» Ă„â€˜ang lĂ¡ÂºÂ­t
  const [matched, setMatched] = useState([]); // pairIds Ă„â€˜Ä‚Â£ ghÄ‚Â©p Ă„â€˜Ä‚Âºng
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
        // KiĂ¡Â»Æ’m tra xem Ă„â€˜Ä‚Â£ qua ngÄ‚Â y mĂ¡Â»â€ºi chĂ†Â°a
        const today = new Date().toDateString();
        const lastActive = data.last_active_at ? new Date(data.last_active_at).toDateString() : '';
        
        let claimsToday = data.mini_game_claims_today || 0;
        if (today !== lastActive) {
          claimsToday = 0; // Reset ngÄ‚Â y mĂ¡Â»â€ºi
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

  // Click thĂ¡ÂºÂ»
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
        // Ă„ÂÄ‚Âºng cĂ¡ÂºÂ·p
        setTimeout(() => {
          setMatched(m => [...m, first.pairId]);
          setFlipped([]);
          setIsChecking(false);
          if (matched.length + 1 === 14) {
            handleWin();
          }
        }, 600);
      } else {
        // Sai - hoÄ‚Â¡n Ă„â€˜Ă¡Â»â€¢i vĂ¡Â»â€¹ trÄ‚Â­ 2 thĂ¡ÂºÂ»
        setTimeout(() => {
          setFlipped([]);
          // ChĂ¡Â»Â thĂ¡ÂºÂ» Ä‚Âºp xuĂ¡Â»â€˜ng xong rĂ¡Â»â€œi mĂ¡Â»â€ºi trÄ‚Â¡o Ă„â€˜Ă¡Â»â€¢i
          setTimeout(() => {
            swapCards(first, second);
          }, 300);
        }, 1000);
      }
    }
  };

  // HoÄ‚Â¡n Ă„â€˜Ă¡Â»â€¢i 2 thĂ¡ÂºÂ» sai vĂ¡Â»â€ºi animation
  const swapCards = (card1, card2) => {
    const idx1 = cards.findIndex(c => c.id === card1.id);
    const idx2 = cards.findIndex(c => c.id === card2.id);
    
    // TÄ‚Â­nh toÄ‚Â¡n khoĂ¡ÂºÂ£ng cÄ‚Â¡ch Ă„â€˜Ă¡Â»Æ’ CSS Translate di chuyĂ¡Â»Æ’n thĂ¡ÂºÂ»
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
    }, 600); // 600ms = thĂ¡Â»Âi gian thĂ¡ÂºÂ» "bay"
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

  // KhÄ‚Â´ng cÄ‚Â²n lĂ†Â°Ă¡Â»Â£t
  if (!canPlay) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-900 to-indigo-900">
        <header className="p-4 flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="p-2 rounded-full bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Mini Game</h1>
          <div className="w-9"></div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center max-w-sm">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">HĂ¡ÂºÂ¿t lĂ†Â°Ă¡Â»Â£t chĂ†Â¡i!</h2>
            <p className="text-gray-300 mb-4">BĂ¡ÂºÂ¡n Ă„â€˜Ä‚Â£ chĂ†Â¡i Ă„â€˜Ă¡Â»Â§ 2 lĂ†Â°Ă¡Â»Â£t hÄ‚Â´m nay</p>
            <button onClick={() => navigate('/home')} className="w-full py-3 bg-purple-500 rounded-xl text-white font-semibold">
              VĂ¡Â»Â trang chĂ¡Â»Â§
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-800 to-green-900">
      {/* Header */}
      <header className="p-3 bg-purple-800/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => gameStarted && !gameOver && !gameWon ? setShowExit(true) : navigate('/home')} 
            className="p-2 rounded-full bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Mini Game
          </h1>
          <button onClick={startNewGame} disabled={gameStarted && !gameOver && !gameWon}
            className="p-2 rounded-full bg-white/10 disabled:opacity-50">
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Stats */}
        <div className="flex justify-between max-w-2xl mx-auto mt-2 bg-white/10 rounded-xl p-2 text-sm">
          <div className="flex items-center gap-1">
            <Clock className={`w-4 h-4 ${timeLeft <= 60 ? 'text-red-400' : 'text-white'}`} />
            <span className={`font-mono ${timeLeft <= 60 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
          </div>
          <div className="text-white">LĂ†Â°Ă¡Â»Â£t: <b>{moves}</b></div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold">{matched.length}/14</span>
          </div>
        </div>
      </header>

      {/* Game */}
      <main className="flex-1 p-3">
        <div className="max-w-2xl mx-auto">
          {/* Info */}
          <div className="bg-green-500/30 border border-green-500 rounded-xl p-2 mb-3 text-center text-sm">
            <Leaf className="w-4 h-4 inline mr-1 text-green-400" />
            <span className="text-green-300 leading-relaxed">
              HoÄ‚Â n thÄ‚Â nh Ă„â€˜Ă¡Â»Æ’ nhĂ¡ÂºÂ­n +10 nĂ„Æ’ng lĂ†Â°Ă¡Â»Â£ng! 
              <span className="hidden sm:inline"> Ă¢â‚¬Â¢ </span>
              <br className="sm:hidden" />
              <strong className="text-yellow-300">Ă¢ÂÂ  ChÄ‚Âº Ä‚Â½: LĂ¡ÂºÂ­t sai 2 thĂ¡ÂºÂ» sĂ¡ÂºÂ½ bĂ¡Â»â€¹ bay trÄ‚Â¡o Ă„â€˜Ă¡Â»â€¢i vĂ¡Â»â€¹ trÄ‚Â­!</strong>
            </span>
          </div>

          {/* Grid 7x4 = 28 thĂ¡ÂºÂ» */}
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
                    ${matchedState ? 'opacity-40' : ''}
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
                    {/* MĂ¡ÂºÂ·t sau (Ä‚Âºp) */}
                    <div 
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-base">Ä‘Å¸Â§Â¬</span>
                    </div>
                    
                    {/* MĂ¡ÂºÂ·t trĂ†Â°Ă¡Â»â€ºc (ngĂ¡Â»Â­a) */}
                    <div 
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex flex-col items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-xl">{card.emoji}</span>
                      <span className="text-[6px] text-white font-bold mt-0.5 leading-none">{card.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HĂ†Â°Ă¡Â»â€ºng dĂ¡ÂºÂ«n */}
          {!gameStarted && (
            <div className="text-center mt-3 text-gray-400 text-sm">
              <p>NhĂ¡ÂºÂ¥n vÄ‚Â o thĂ¡ÂºÂ» Ă„â€˜Ă¡Â»Æ’ bĂ¡ÂºÂ¯t Ă„â€˜Ă¡ÂºÂ§u!</p>
              <p className="text-xs">GhÄ‚Â©p 2 hÄ‚Â¬nh giĂ¡Â»â€˜ng nhau (14 cĂ¡ÂºÂ·p)</p>
            </div>
          )}
          
          <p className="text-center text-gray-500 text-xs mt-2">CÄ‚Â²n {playsLeft} lĂ†Â°Ă¡Â»Â£t hÄ‚Â´m nay</p>
        </div>
      </main>

      {/* Modal thoÄ‚Â¡t */}
      {showExit && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">CĂ¡ÂºÂ£nh bÄ‚Â¡o!</h2>
            <p className="text-gray-300 mb-4">ThoÄ‚Â¡t sĂ¡ÂºÂ½ mĂ¡ÂºÂ¥t lĂ†Â°Ă¡Â»Â£t chĂ†Â¡i vÄ‚Â  khÄ‚Â´ng nhĂ¡ÂºÂ­n thĂ†Â°Ă¡Â»Å¸ng!</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowExit(false); navigate('/home'); }} 
                className="flex-1 py-2 bg-red-500 rounded-xl text-white font-semibold">ThoÄ‚Â¡t</button>
              <button onClick={() => setShowExit(false)} 
                className="flex-1 py-2 bg-green-500 rounded-xl text-white font-semibold">ChĂ†Â¡i tiĂ¡ÂºÂ¿p</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hĂ¡ÂºÂ¿t giĂ¡Â»Â */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm text-center">
            <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">HĂ¡ÂºÂ¿t thĂ¡Â»Âi gian!</h2>
            <p className="text-gray-300 mb-4">GhÄ‚Â©p Ă„â€˜Ă†Â°Ă¡Â»Â£c {matched.length}/14 cĂ¡ÂºÂ·p</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/home')} 
                className="flex-1 py-2 bg-gray-600 rounded-xl text-white font-semibold">VĂ¡Â»Â trang chĂ¡Â»Â§</button>
              {playsLeft > 0 && (
                <button onClick={startNewGame} 
                  className="flex-1 py-2 bg-purple-500 rounded-xl text-white font-semibold">ChĂ†Â¡i lĂ¡ÂºÂ¡i</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal thĂ¡ÂºÂ¯ng */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-lg font-bold text-white mb-2">TuyĂ¡Â»â€¡t vĂ¡Â»Âi!</h2>
            <p className="text-gray-300 mb-2">HoÄ‚Â n thÄ‚Â nh trong {moves} lĂ†Â°Ă¡Â»Â£t!</p>
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-3 mb-4">
              <Leaf className="w-6 h-6 text-green-400 inline mr-2" />
              <span className="text-green-300 font-bold">+10 NĂ„Æ’ng lĂ†Â°Ă¡Â»Â£ng</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">CÄ‚Â²n {playsLeft} lĂ†Â°Ă¡Â»Â£t hÄ‚Â´m nay</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/home')} 
                className="flex-1 py-2 bg-gray-600 rounded-xl text-white font-semibold">VĂ¡Â»Â trang chĂ¡Â»Â§</button>
              {playsLeft > 0 && (
                <button onClick={startNewGame} 
                  className="flex-1 py-2 bg-purple-500 rounded-xl text-white font-semibold">ChĂ†Â¡i tiĂ¡ÂºÂ¿p</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
