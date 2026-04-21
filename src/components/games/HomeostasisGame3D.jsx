// HomeostasisGame3D.jsx - Cân bằng nội môi 3D (Lớp 11)
// Fixed: Stable materials, proper body model
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles, Heart, Thermometer, Droplet, Activity } from 'lucide-react';

// Body parameters
const PARAMETERS = {
  temperature: {
    name: 'Nhiệt độ',
    unit: '°C',
    normal: 37,
    min: 35,
    max: 40,
    color: '#ef4444',
    icon: Thermometer,
  },
  bloodSugar: {
    name: 'Đường huyết',
    unit: 'mg/dL',
    normal: 100,
    min: 60,
    max: 180,
    color: '#f59e0b',
    icon: Activity,
  },
  waterLevel: {
    name: 'Nước',
    unit: '%',
    normal: 60,
    min: 45,
    max: 75,
    color: '#3b82f6',
    icon: Droplet,
  },
  heartRate: {
    name: 'Nhịp tim',
    unit: 'BPM',
    normal: 72,
    min: 50,
    max: 120,
    color: '#ec4899',
    icon: Heart,
  },
};

// Organ 3D component
function Organ3D({ type, position, health, isActive }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      if (type === 'heart' && isActive) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
        ref.current.scale.setScalar(scale);
      }
    }
  });

  const colors = {
    heart: '#ef4444',
    brain: '#f472b6',
    liver: '#92400e',
    kidney: '#7c3aed',
    lungs: '#f472b6',
  };

  const shapes = {
    heart: (
      <mesh ref={ref}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={colors.heart} emissive={isActive ? colors.heart : '#000'} emissiveIntensity={isActive ? 0.5 : 0} />
      </mesh>
    ),
    brain: (
      <mesh ref={ref}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color={colors.brain} />
      </mesh>
    ),
    liver: (
      <mesh ref={ref}>
        <boxGeometry args={[0.4, 0.25, 0.15]} />
        <meshStandardMaterial color={colors.liver} />
      </mesh>
    ),
    kidney: (
      <group ref={ref}>
        <mesh position={[-0.15, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.15, 8, 8]} />
          <meshStandardMaterial color={colors.kidney} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.15, 8, 8]} />
          <meshStandardMaterial color={colors.kidney} />
        </mesh>
      </group>
    ),
    lungs: (
      <group ref={ref}>
        <mesh position={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color={colors.lungs} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color={colors.lungs} transparent opacity={0.8} />
        </mesh>
      </group>
    ),
  };

  return (
    <group position={position}>
      {shapes[type]}
      <Html position={[0, 0.4, 0]} center distanceFactor={10}>
        <div className={`px-2 py-0.5 rounded text-xs ${health > 0.7 ? 'bg-green-500' : health > 0.4 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
          {type === 'heart' ? '❤️' : type === 'brain' ? '🧠' : type === 'liver' ? '🫁' : type === 'kidney' ? '💜' : '🫁'}
        </div>
      </Html>
    </group>
  );
}

// Human body silhouette
function HumanBody3D({ parameters, activeOrgan }) {
  const isHealthy = (param) => {
    const p = PARAMETERS[param];
    const val = parameters[param];
    return Math.abs(val - p.normal) / (p.max - p.min) < 0.2;
  };

  const overallHealth = Object.keys(PARAMETERS).filter(isHealthy).length / Object.keys(PARAMETERS).length;

  return (
    <group>
      {/* Body outline */}
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.4, 1, 8, 16]} />
        <meshStandardMaterial 
          color={overallHealth > 0.7 ? '#86efac' : overallHealth > 0.4 ? '#fde047' : '#fca5a5'}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.7, 0.7, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      <mesh position={[0.7, 0.7, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.2, -0.8, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      <mesh position={[0.2, -0.8, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      
      {/* Organs */}
      <Organ3D type="brain" position={[0, 1.5, 0.2]} health={isHealthy('temperature') ? 1 : 0.5} isActive={activeOrgan === 'brain'} />
      <Organ3D type="heart" position={[-0.1, 0.7, 0.2]} health={isHealthy('heartRate') ? 1 : 0.5} isActive={activeOrgan === 'heart'} />
      <Organ3D type="lungs" position={[0, 0.5, 0.15]} health={1} isActive={activeOrgan === 'lungs'} />
      <Organ3D type="liver" position={[0.15, 0.2, 0.2]} health={isHealthy('bloodSugar') ? 1 : 0.5} isActive={activeOrgan === 'liver'} />
      <Organ3D type="kidney" position={[0, -0.1, 0.2]} health={isHealthy('waterLevel') ? 1 : 0.5} isActive={activeOrgan === 'kidney'} />
    </group>
  );
}

// Parameter gauge
function ParameterGauge3D({ param, value, position }) {
  const data = PARAMETERS[param];
  const normalizedValue = (value - data.min) / (data.max - data.min);
  const normalizedNormal = (data.normal - data.min) / (data.max - data.min);
  const isNormal = Math.abs(value - data.normal) / (data.max - data.min) < 0.15;

  return (
    <group position={position}>
      {/* Background bar */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.15, 1.5, 0.05]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Normal zone */}
      <mesh position={[0, (normalizedNormal - 0.5) * 1.5, 0]}>
        <boxGeometry args={[0.18, 0.3, 0.06]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.3} />
      </mesh>
      
      {/* Current value indicator */}
      <mesh position={[0, (normalizedValue - 0.5) * 1.5, 0.05]}>
        <boxGeometry args={[0.2, 0.08, 0.08]} />
        <meshStandardMaterial 
          color={isNormal ? '#22c55e' : '#ef4444'} 
          emissive={isNormal ? '#22c55e' : '#ef4444'}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <Html position={[0, 1, 0]} center distanceFactor={10}>
        <div className="text-center">
          <p className="text-xs text-gray-400">{data.name}</p>
          <p className={`text-sm font-bold ${isNormal ? 'text-green-400' : 'text-red-400'}`}>
            {value.toFixed(1)} {data.unit}
          </p>
        </div>
      </Html>
    </group>
  );
}

// Scene
function HomeostasisScene({ parameters, activeOrgan }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <pointLight position={[-3, 3, 3]} intensity={0.4} color="#8b5cf6" />
      
      <HumanBody3D parameters={parameters} activeOrgan={activeOrgan} />
      
      {/* Parameter gauges */}
      <ParameterGauge3D param="temperature" value={parameters.temperature} position={[-2, 0, 0]} />
      <ParameterGauge3D param="bloodSugar" value={parameters.bloodSugar} position={[-1.3, 0, 0]} />
      <ParameterGauge3D param="waterLevel" value={parameters.waterLevel} position={[1.3, 0, 0]} />
      <ParameterGauge3D param="heartRate" value={parameters.heartRate} position={[2, 0, 0]} />
      
      <OrbitControls 
        enablePan={false}
        minDistance={4}
        maxDistance={12}
      />
    </>
  );
}

// Actions
const ACTIONS = [
  { id: 'drink', name: 'Uống nước', icon: '💧', effect: { waterLevel: 5 } },
  { id: 'eat', name: 'Ăn', icon: '🍎', effect: { bloodSugar: 15 } },
  { id: 'exercise', name: 'Vận động', icon: '🏃', effect: { heartRate: 15, temperature: 0.5, bloodSugar: -10, waterLevel: -5 } },
  { id: 'rest', name: 'Nghỉ ngơi', icon: '😴', effect: { heartRate: -10, temperature: -0.3 } },
  { id: 'coolDown', name: 'Làm mát', icon: '❄️', effect: { temperature: -0.5 } },
  { id: 'warmUp', name: 'Sưởi ấm', icon: '🔥', effect: { temperature: 0.5 } },
];

// Quiz
const QUIZ = [
  {
    question: 'Nhiệt độ cơ thể bình thường là bao nhiêu?',
    options: ['35°C', '37°C', '39°C', '40°C'],
    answer: 1,
  },
  {
    question: 'Cơ quan nào điều hòa đường huyết?',
    options: ['Tim', 'Gan', 'Thận', 'Phổi'],
    answer: 1,
  },
  {
    question: 'Insulin có tác dụng gì?',
    options: ['Tăng đường huyết', 'Giảm đường huyết', 'Tăng nhịp tim', 'Giảm nhiệt độ'],
    answer: 1,
  },
  {
    question: 'Thận có chức năng chính là gì?',
    options: ['Bơm máu', 'Lọc máu', 'Tiêu hóa', 'Hô hấp'],
    answer: 1,
  },
  {
    question: 'Khi nhiệt độ cơ thể tăng, phản ứng nào xảy ra?',
    options: ['Co mạch máu', 'Giãn mạch máu', 'Run', 'Dựng lông'],
    answer: 1,
  },
];

// Main Component
export default function HomeostasisGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [parameters, setParameters] = useState({
    temperature: 37,
    bloodSugar: 100,
    waterLevel: 60,
    heartRate: 72,
  });
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [activeOrgan, setActiveOrgan] = useState(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Random fluctuations
  useEffect(() => {
    if (showTutorial || gameComplete) return;
    
    const interval = setInterval(() => {
      setParameters(prev => ({
        temperature: Math.max(35, Math.min(40, prev.temperature + (Math.random() - 0.5) * 0.3)),
        bloodSugar: Math.max(60, Math.min(180, prev.bloodSugar + (Math.random() - 0.5) * 5)),
        waterLevel: Math.max(45, Math.min(75, prev.waterLevel + (Math.random() - 0.5) * 2)),
        heartRate: Math.max(50, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 3)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [showTutorial, gameComplete]);

  // Score for maintaining balance
  useEffect(() => {
    if (showTutorial || gameComplete) return;
    
    const interval = setInterval(() => {
      let balanceScore = 0;
      Object.entries(PARAMETERS).forEach(([key, data]) => {
        const val = parameters[key];
        if (Math.abs(val - data.normal) / (data.max - data.min) < 0.15) {
          balanceScore += 10;
        }
      });
      if (balanceScore > 0) {
        setScore(prev => prev + balanceScore);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [parameters, showTutorial, gameComplete]);

  // Timer
  useEffect(() => {
    if (showTutorial || gameComplete) return;
    
    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          setGameComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTutorial, gameComplete]);

  const handleAction = useCallback((action) => {
    setParameters(prev => {
      const newParams = { ...prev };
      Object.entries(action.effect).forEach(([key, val]) => {
        const data = PARAMETERS[key];
        newParams[key] = Math.max(data.min, Math.min(data.max, prev[key] + val));
      });
      return newParams;
    });
    
    // Set active organ based on action
    if (action.effect.heartRate) setActiveOrgan('heart');
    else if (action.effect.bloodSugar) setActiveOrgan('liver');
    else if (action.effect.waterLevel) setActiveOrgan('kidney');
    else if (action.effect.temperature) setActiveOrgan('brain');
    
    setTimeout(() => setActiveOrgan(null), 1000);
  }, []);

  const handleAskQuestion = useCallback(() => {
    if (questionsAnswered < QUIZ.length) {
      setCurrentQuestion(QUIZ[questionsAnswered]);
      setShowQuiz(true);
    }
  }, [questionsAnswered]);

  const handleAnswer = useCallback((answerIndex) => {
    const isCorrect = answerIndex === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(prev => prev + 100);
      setFeedback({ type: 'success', message: 'Đúng rồi! 💪' });
    } else {
      setFeedback({ type: 'error', message: `Sai! Đáp án: ${currentQuestion.options[currentQuestion.answer]}` });
    }
    
    setShowQuiz(false);
    setQuestionsAnswered(prev => prev + 1);
    setTimeout(() => setFeedback(null), 1500);
  }, [currentQuestion]);

  const handleReset = () => {
    setParameters({ temperature: 37, bloodSugar: 100, waterLevel: 60, heartRate: 72 });
    setScore(0);
    setTime(60);
    setActiveOrgan(null);
    setQuestionsAnswered(0);
    setShowQuiz(false);
    setGameComplete(false);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-pink-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❤️</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Cân bằng nội môi 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Duy trì các chỉ số cơ thể trong vùng bình thường!
          </p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-left">
            <p className="text-sm text-pink-400 mb-2">📊 Các chỉ số cần duy trì:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(PARAMETERS).map(([key, data]) => (
                <div key={key} className="flex items-center gap-2">
                  <data.icon className="w-4 h-4" style={{ color: data.color }} />
                  <span className="text-white">{data.name}: {data.normal} {data.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-600 text-white font-bold rounded-xl"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Complete
  if (gameComplete) {
    const stars = score >= 500 ? 3 : score >= 300 ? 2 : 1;
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-pink-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Bác sĩ tài ba! 🏥</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-2xl font-bold text-pink-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Lại
            </button>
            <button
              onClick={() => onComplete(score)}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl"
            >
              Xong
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a0a1e']} />
        <HomeostasisScene parameters={parameters} activeOrgan={activeOrgan} />
      </Canvas>

      {/* UI */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500/20 px-3 py-1.5 rounded-full">
            <span className="text-pink-400 font-semibold text-sm">🏆 {score}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full">
            <span className="text-gray-300 text-sm">⏱️ {time}s</span>
          </div>
        </div>
        <button onClick={handleReset} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`absolute top-32 left-4 right-4 p-3 rounded-xl text-center font-semibold ${
          feedback.type === 'success' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Actions */}
      <div className="absolute bottom-24 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-md rounded-2xl p-3">
          <p className="text-white text-xs text-center mb-2">Hành động:</p>
          <div className="grid grid-cols-6 gap-2">
            {ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="flex flex-col items-center gap-1 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-white text-[10px]">{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz button */}
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={handleAskQuestion}
          disabled={questionsAnswered >= QUIZ.length}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-600 text-white font-bold rounded-xl disabled:opacity-50"
        >
          Câu hỏi ({questionsAnswered}/{QUIZ.length})
        </button>
      </div>

      {/* Quiz Modal */}
      {showQuiz && currentQuestion && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-4">{currentQuestion.question}</h3>
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition text-left px-4"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
