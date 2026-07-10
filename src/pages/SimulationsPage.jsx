// SimulationsPage.jsx - Trang game mô phỏng 3D sinh học
import { useState, Suspense, lazy, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Play, Atom, Gamepad2,
  Brain, Droplets, TreePine, Users, Loader2, AlertTriangle,
  Dna, Leaf, RotateCcw, Bug, Utensils, Zap, FlaskConical, Sprout, Skull, Microscope
} from 'lucide-react';

// Lazy load các game 3D components
const CellAssemblyGame3D = lazy(() => import('../components/games/CellAssemblyGame3D'));
const DNABuilderGame3D = lazy(() => import('../components/games/DNABuilderGame3D'));
const OxygenJourneyGame3D = lazy(() => import('../components/games/OxygenJourneyGame3D'));
const PhotosynthesisGame3D = lazy(() => import('../components/games/PhotosynthesisGame3D'));
const MitosisGame3D = lazy(() => import('../components/games/MitosisGame3D'));
const EcosystemGame3D = lazy(() => import('../components/games/EcosystemGame3D'));
const MendelGame3D = lazy(() => import('../components/games/MendelGame3D'));
const HomeostasisGame3D = lazy(() => import('../components/games/HomeostasisGame3D'));
const MicroorganismGame3D = lazy(() => import('../components/games/MicroorganismGame3D'));
const PlantStructureGame3D = lazy(() => import('../components/games/PlantStructureGame3D'));
const InvertebrateGame3D = lazy(() => import('../components/games/InvertebrateGame3D'));
const DigestiveGame3D = lazy(() => import('../components/games/DigestiveGame3D'));
const NervousSystemGame3D = lazy(() => import('../components/games/NervousSystemGame3D'));
const EnzymeGame3D = lazy(() => import('../components/games/EnzymeGame3D'));
const PlantTransportGame3D = lazy(() => import('../components/games/PlantTransportGame3D'));
const EvolutionGame3D = lazy(() => import('../components/games/EvolutionGame3D'));
const MutationGame3D = lazy(() => import('../components/games/MutationGame3D'));

// Error Boundary Class
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Có lỗi xảy ra</h3>
            <p className="text-gray-400 text-sm mb-4">
              Game không thể tải. WebGL hoặc trình duyệt không hỗ trợ.
            </p>
            <button
              onClick={this.props.onReset}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" /> Quay lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Danh sách 16 game mô phỏng 3D - Lớp 6 đến 12
const SIMULATION_GAMES = {
  microorganism: {
    id: 'microorganism-3d', name: 'Vi sinh vật 3D', description: 'Khám phá vi khuẩn, virus, nấm men và các vi sinh vật',
    icon: Microscope, color: 'from-cyan-500 to-teal-600', grade: 6, duration: '8 phút', component: 'MicroorganismGame3D', isAvailable: true
  },
  cellAssembly: {
    id: 'cell-assembly-3d', name: 'Lắp ghép Tế bào 3D', description: 'Kéo thả bào quan vào tế bào động vật và thực vật',
    icon: Atom, color: 'from-pink-500 to-rose-600', grade: 6, duration: '5-10 phút', component: 'CellAssemblyGame3D', isAvailable: true
  },
  ecosystemBuilder: {
    id: 'ecosystem-3d', name: 'Hệ sinh thái 3D', description: 'Xây dựng hệ sinh thái với sinh vật sản xuất và tiêu thụ',
    icon: TreePine, color: 'from-green-500 to-emerald-600', grade: 6, duration: '10-15 phút', component: 'EcosystemGame3D', isAvailable: true
  },
  plantStructure: {
    id: 'plant-structure-3d', name: 'Cấu tạo Thực vật 3D', description: 'Khám phá rễ, thân, lá, hoa, quả của cây xanh',
    icon: Sprout, color: 'from-lime-500 to-green-600', grade: 7, duration: '8 phút', component: 'PlantStructureGame3D', isAvailable: true
  },
  invertebrate: {
    id: 'invertebrate-3d', name: 'Phân loại Động vật 3D', description: 'Phân loại có xương sống / không xương sống',
    icon: Bug, color: 'from-blue-500 to-cyan-600', grade: 7, duration: '10 phút', component: 'InvertebrateGame3D', isAvailable: true
  },
  oxygenJourney: {
    id: 'oxygen-journey-3d', name: 'Hành trình Oxy 3D', description: 'Đường đi O₂ từ phổi qua tim đến tế bào',
    icon: Droplets, color: 'from-sky-500 to-blue-600', grade: 8, duration: '10 phút', component: 'OxygenJourneyGame3D', isAvailable: true
  },
  digestive: {
    id: 'digestive-3d', name: 'Hệ Tiêu hóa 3D', description: 'Hành trình thức ăn từ miệng đến ruột già',
    icon: Utensils, color: 'from-orange-500 to-yellow-600', grade: 8, duration: '10 phút', component: 'DigestiveGame3D', isAvailable: true
  },
  nervousSystem: {
    id: 'nervous-system-3d', name: 'Hệ Thần kinh 3D', description: 'Khám phá não bộ, neuron và cung phản xạ',
    icon: Zap, color: 'from-fuchsia-500 to-purple-600', grade: 8, duration: '10 phút', component: 'NervousSystemGame3D', isAvailable: true
  },
  dnaBuilder: {
    id: 'dna-builder-3d', name: 'Xây dựng ADN 3D', description: 'Xây dựng chuỗi xoắn kép ADN với cặp base A-T, G-C',
    icon: Dna, color: 'from-purple-500 to-indigo-600', grade: 9, duration: '8 phút', component: 'DNABuilderGame3D', isAvailable: true
  },
  mendelBreeding: {
    id: 'mendel-3d', name: 'Lai giống Mendel', description: 'Mô phỏng lai giống với ô Punnett',
    icon: Users, color: 'from-violet-500 to-purple-600', grade: 9, duration: '10 phút', component: 'MendelGame3D', isAvailable: true
  },
  mitosisSort: {
    id: 'mitosis-3d', name: 'Nguyên phân 3D', description: 'Quan sát quá trình nguyên phân với nhiễm sắc thể 3D',
    icon: Atom, color: 'from-teal-500 to-cyan-600', grade: 10, duration: '5-8 phút', component: 'MitosisGame3D', isAvailable: true
  },
  photosynthesis: {
    id: 'photosynthesis-3d', name: 'Quang hợp 3D', description: 'Mô phỏng quá trình quang hợp trong lục lạp',
    icon: Leaf, color: 'from-green-500 to-lime-600', grade: 10, duration: '10 phút', component: 'PhotosynthesisGame3D', isAvailable: true
  },
  enzyme: {
    id: 'enzyme-3d', name: 'Enzyme & Chuyển hóa 3D', description: 'Mô hình ổ khóa-chìa khóa của enzyme',
    icon: FlaskConical, color: 'from-amber-500 to-orange-600', grade: 10, duration: '8 phút', component: 'EnzymeGame3D', isAvailable: true
  },
  homeostasis: {
    id: 'homeostasis-3d', name: 'Cân bằng Nội môi 3D', description: 'Điều chỉnh thân nhiệt, đường huyết, cân bằng nước',
    icon: Brain, color: 'from-indigo-500 to-blue-600', grade: 11, duration: '10-15 phút', component: 'HomeostasisGame3D', isAvailable: true
  },
  plantTransport: {
    id: 'plant-transport-3d', name: 'Vận chuyển Thực vật 3D', description: 'Mạch gỗ, mạch rây và quá trình thoát hơi nước',
    icon: Sprout, color: 'from-emerald-500 to-green-600', grade: 11, duration: '10 phút', component: 'PlantTransportGame3D', isAvailable: true
  },
  evolution: {
    id: 'evolution-3d', name: 'Tiến hóa & CLTN 3D', description: 'Học thuyết Darwin, bằng chứng tiến hóa, hình thành loài',
    icon: Skull, color: 'from-yellow-500 to-orange-600', grade: 12, duration: '10 phút', component: 'EvolutionGame3D', isAvailable: true
  },
  mutation: {
    id: 'mutation-3d', name: 'Đột biến Gen & NST 3D', description: 'Đột biến gen, đột biến NST và tác nhân gây đột biến',
    icon: Dna, color: 'from-red-500 to-purple-600', grade: 12, duration: '10 phút', component: 'MutationGame3D', isAvailable: true
  },
};

// Loading component
function Game3DLoader() {
  return (
    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <p className="text-blue-400 font-semibold">Đang tải game 3D...</p>
      </div>
    </div>
  );
}

// Card component cho game
function GameCard({ game, onPlay }) {
  const IconComponent = game.icon;
  
  return (
    <div 
      className={`relative bg-gradient-to-br ${game.color} rounded-2xl overflow-hidden game-card-liquid-glass-colored transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}
      onClick={() => game.isAvailable && onPlay(game)}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
      
      <div className="absolute top-3 right-3">
        <div className="bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="text-xs text-white font-bold">3D</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate">{game.name}</h3>
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{game.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 text-white/80 text-xs">
          <span className="bg-white/20 px-2 py-1 rounded-full">Lớp {game.grade}</span>
          <span>{game.duration}</span>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <button className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all">
            <Play className="w-4 h-4" /> Chơi
          </button>
        </div>
      </div>
    </div>
  );
}

// Game Player Component
function GamePlayer({ game, onClose, onComplete }) {
  const [key, setKey] = useState(0);
  const voyageMusicRef = useRef(null);
  const { pauseBgMusic, resumeBgMusic } = useAuth();

  useEffect(() => {
    // Pause bg music & play voyage music
    if (pauseBgMusic) pauseBgMusic();
    const audio = new Audio('/music/Microscopic Voyage.mp3');
    audio.loop = true;
    audio.volume = 0.2;
    audio.play().catch(() => {});
    voyageMusicRef.current = audio;
    return () => {
      if (voyageMusicRef.current) { voyageMusicRef.current.pause(); voyageMusicRef.current = null; }
      if (resumeBgMusic) resumeBgMusic();
    };
  }, []);
  
  const handleComplete = (score) => {
    onComplete(game.id, score);
    onClose();
  };

  const gameComponents = {
    'CellAssemblyGame3D': CellAssemblyGame3D,
    'DNABuilderGame3D': DNABuilderGame3D,
    'OxygenJourneyGame3D': OxygenJourneyGame3D,
    'PhotosynthesisGame3D': PhotosynthesisGame3D,
    'MitosisGame3D': MitosisGame3D,
    'EcosystemGame3D': EcosystemGame3D,
    'MendelGame3D': MendelGame3D,
    'HomeostasisGame3D': HomeostasisGame3D,
    'MicroorganismGame3D': MicroorganismGame3D,
    'PlantStructureGame3D': PlantStructureGame3D,
    'InvertebrateGame3D': InvertebrateGame3D,
    'DigestiveGame3D': DigestiveGame3D,
    'NervousSystemGame3D': NervousSystemGame3D,
    'EnzymeGame3D': EnzymeGame3D,
    'PlantTransportGame3D': PlantTransportGame3D,
    'EvolutionGame3D': EvolutionGame3D,
    'MutationGame3D': MutationGame3D,
  };

  const GameComponent = gameComponents[game.component];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <h2 className="text-white font-bold">{game.name}</h2>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg text-white/70 text-sm">
            Lớp {game.grade}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <ErrorBoundary onReset={onClose}>
        <Suspense fallback={<Game3DLoader />}>
          {GameComponent && (
            <GameComponent 
              key={key}
              onComplete={handleComplete}
              onRestart={() => setKey(k => k + 1)}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Main Page
export default function SimulationsPage() {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);

  const handleGameComplete = async (gameId, score) => {
    // Try save to server
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/users/simulation-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ gameId, score })
        }).catch(() => {});
      }
    } catch (e) { /* silent */ }
  };

  const grades = [6, 7, 8, 9, 10, 11, 12];
  
  const filteredGames = Object.values(SIMULATION_GAMES).filter(game => 
    selectedGrade === null || game.grade === selectedGrade
  );

  if (currentGame) {
    return (
      <GamePlayer 
        game={currentGame} 
        onClose={() => setCurrentGame(null)}
        onComplete={handleGameComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-header backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 btn-back-liquid-glass flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-blue-400" />
                Game Mô phỏng 3D
              </h1>
              <p className="text-gray-400 text-sm">
                {Object.keys(SIMULATION_GAMES).length} trò chơi sinh học từ lớp 6 đến 12
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Filter */}
      <div className="max-w-6xl mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedGrade(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap btn-filter-glass ${
              selectedGrade === null ? 'active-blue' : ''
            }`}
          >
            Tất cả
          </button>
          {grades.map(grade => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap btn-filter-glass ${
                selectedGrade === grade ? 'active-blue' : ''
              }`}
            >
              Lớp {grade}
            </button>
          ))}
        </div>
      </div>

            {/* Games Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              onPlay={setCurrentGame}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
