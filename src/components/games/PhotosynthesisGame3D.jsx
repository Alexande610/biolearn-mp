// PhotosynthesisGame3D.jsx - Quang hợp 3D (Lớp 10)
// Fixed: Stable materials, proper chloroplast model
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles, Sun, Droplets, Wind, Leaf } from 'lucide-react';

// Molecule types
const MOLECULES = {
  co2: { name: 'CO₂', color: '#6b7280', icon: '💨' },
  h2o: { name: 'H₂O', color: '#3b82f6', icon: '💧' },
  light: { name: 'Ánh sáng', color: '#fbbf24', icon: '☀️' },
  o2: { name: 'O₂', color: '#22c55e', icon: '🫧' },
  glucose: { name: 'C₆H₁₂O₆', color: '#f97316', icon: '🍬' },
  atp: { name: 'ATP', color: '#ef4444', icon: '⚡' },
};

// Particle component
function Particle3D({ type, position, targetPosition, speed = 1 }) {
  const ref = useRef();
  const molecule = MOLECULES[type];
  const progress = useRef(0);
  
  useFrame((state, delta) => {
    if (ref.current && targetPosition) {
      progress.current = Math.min(1, progress.current + delta * speed);
      const t = progress.current;
      
      ref.current.position.x = position[0] + (targetPosition[0] - position[0]) * t;
      ref.current.position.y = position[1] + (targetPosition[1] - position[1]) * t;
      ref.current.position.z = position[2] + (targetPosition[2] - position[2]) * t;
    } else if (ref.current) {
      ref.current.position.y += Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.003;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={molecule.color} emissive={molecule.color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Chloroplast 3D
function Chloroplast3D({ lightIntensity, co2Level, waterLevel, producing }) {
  const ref = useRef();
  const thylakoidsRef = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (thylakoidsRef.current && producing) {
      thylakoidsRef.current.children.forEach((thylakoid, i) => {
        thylakoid.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.1;
      });
    }
  });

  const glowIntensity = producing ? 0.5 : 0.1;

  return (
    <group ref={ref}>
      {/* Outer membrane */}
      <mesh>
        <capsuleGeometry args={[0.8, 1.5, 16, 32]} />
        <meshStandardMaterial 
          color="#22c55e" 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner membrane */}
      <mesh scale={0.9}>
        <capsuleGeometry args={[0.75, 1.4, 16, 32]} />
        <meshStandardMaterial 
          color="#4ade80" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Thylakoid stacks (grana) */}
      <group ref={thylakoidsRef}>
        {[-0.5, 0, 0.5].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            {[0, 0.1, 0.2, 0.3, 0.4].map((y, j) => (
              <mesh key={j} position={[0, y - 0.2, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                <meshStandardMaterial 
                  color="#15803d"
                  emissive={producing ? '#22c55e' : '#000'}
                  emissiveIntensity={producing ? glowIntensity : 0}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      
      {/* Stroma (matrix) particles */}
      {producing && (
        <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={i}
              position={[
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 0.8
              ]}
            >
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
          ))}
        </Float>
      )}
      
      {/* Labels */}
      <Html position={[0, 1.2, 0]} center distanceFactor={10}>
        <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
          Lục lạp
        </div>
      </Html>
    </group>
  );
}

// Sun light rays
function SunLight({ intensity }) {
  const raysRef = useRef();
  
  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[-3, 2, 0]}>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      
      {/* Rays */}
      <group ref={raysRef}>
        {intensity > 0 && [...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[0.3 * intensity, 0.05, 0.05]} />
              <meshBasicMaterial color="#fde047" transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>
      
      {/* Light beam to chloroplast */}
      {intensity > 0.5 && (
        <mesh position={[1.2, -0.8, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.02, 0.15, 2.5, 8]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// Water molecules
function WaterInput({ level }) {
  return (
    <group position={[0, -2, 0]}>
      <mesh>
        <boxGeometry args={[1.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      
      {/* Water level */}
      <mesh position={[0, 0.2, 0]} scale={[level, 1, 1]}>
        <boxGeometry args={[1.4, 0.2, 0.4]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.7} />
      </mesh>
      
      <Html position={[0, -0.4, 0]} center>
        <div className="text-blue-400 text-xs">H₂O ({Math.round(level * 100)}%)</div>
      </Html>
    </group>
  );
}

// CO2 cloud
function CO2Cloud({ level }) {
  return (
    <group position={[3, 1, 0]}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
        {[...Array(Math.floor(level * 5))].map((_, i) => (
          <mesh 
            key={i}
            position={[(Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#6b7280" transparent opacity={0.6} />
          </mesh>
        ))}
      </Float>
      
      <Html position={[0, 0.6, 0]} center>
        <div className="text-gray-400 text-xs">CO₂ ({Math.round(level * 100)}%)</div>
      </Html>
    </group>
  );
}

// Output products
function ProductsOutput({ glucoseProduced, oxygenProduced }) {
  return (
    <group position={[2.5, -1.5, 0]}>
      {/* Glucose */}
      <group position={[-0.5, 0, 0]}>
        {[...Array(Math.min(glucoseProduced, 5))].map((_, i) => (
          <mesh key={i} position={[i * 0.2, 0, 0]}>
            <dodecahedronGeometry args={[0.12]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        ))}
        <Html position={[0, -0.4, 0]} center>
          <div className="text-orange-400 text-xs">Glucose: {glucoseProduced}</div>
        </Html>
      </group>
      
      {/* Oxygen bubbles */}
      <group position={[0.8, 0.5, 0]}>
        <Float speed={3}>
          {[...Array(Math.min(oxygenProduced, 8))].map((_, i) => (
            <mesh 
              key={i}
              position={[(Math.random() - 0.5) * 0.5, i * 0.15, (Math.random() - 0.5) * 0.3]}
            >
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#22c55e" transparent opacity={0.7} />
            </mesh>
          ))}
        </Float>
        <Html position={[0, 1.2, 0]} center>
          <div className="text-green-400 text-xs">O₂: {oxygenProduced}</div>
        </Html>
      </group>
    </group>
  );
}

// Scene
function PhotosynthesisScene({ lightIntensity, co2Level, waterLevel, producing, glucoseProduced, oxygenProduced }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-3, 2, 2]} intensity={lightIntensity} color="#fbbf24" />
      
      <Chloroplast3D 
        lightIntensity={lightIntensity}
        co2Level={co2Level}
        waterLevel={waterLevel}
        producing={producing}
      />
      
      <SunLight intensity={lightIntensity} />
      <WaterInput level={waterLevel} />
      <CO2Cloud level={co2Level} />
      <ProductsOutput glucoseProduced={glucoseProduced} oxygenProduced={oxygenProduced} />
      
      <OrbitControls 
        enablePan={false}
        minDistance={4}
        maxDistance={12}
      />
    </>
  );
}

// Quiz questions
const QUIZ = [
  {
    question: 'Quang hợp diễn ra ở bào quan nào?',
    options: ['Ti thể', 'Lục lạp', 'Nhân', 'Ribosome'],
    answer: 1,
  },
  {
    question: 'Sản phẩm của pha sáng là gì?',
    options: ['Glucose', 'ATP và NADPH', 'CO₂', 'Protein'],
    answer: 1,
  },
  {
    question: 'Pha tối diễn ra ở đâu trong lục lạp?',
    options: ['Thylakoid', 'Chất nền (stroma)', 'Màng ngoài', 'Grana'],
    answer: 1,
  },
  {
    question: 'Công thức quang hợp đúng là?',
    options: [
      '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
      'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
      '6CO₂ + 6O₂ → C₆H₁₂O₆ + 6H₂O',
      'C₆H₁₂O₆ → 6CO₂ + 6H₂O'
    ],
    answer: 0,
  },
  {
    question: 'O₂ trong quang hợp được sinh ra từ đâu?',
    options: ['CO₂', 'H₂O', 'Glucose', 'ATP'],
    answer: 1,
  },
];

// Main Component
export default function PhotosynthesisGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(0.5);
  const [co2Level, setCo2Level] = useState(0.5);
  const [waterLevel, setWaterLevel] = useState(0.5);
  const [glucoseProduced, setGlucoseProduced] = useState(0);
  const [oxygenProduced, setOxygenProduced] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Check if photosynthesis can occur
  const canProduce = lightIntensity > 0.3 && co2Level > 0.2 && waterLevel > 0.2;

  // Production effect
  const produceRef = useRef(null);
  useEffect(() => {
    if (canProduce && !produceRef.current) {
      produceRef.current = setInterval(() => {
        setGlucoseProduced(prev => prev + 1);
        setOxygenProduced(prev => prev + 6);
        setWaterLevel(prev => Math.max(0, prev - 0.05));
        setCo2Level(prev => Math.max(0, prev - 0.05));
      }, 2000);
    } else if (!canProduce && produceRef.current) {
      clearInterval(produceRef.current);
      produceRef.current = null;
    }
    return () => {
      if (produceRef.current) clearInterval(produceRef.current);
    };
  }, [canProduce]);

  const handleProduce = useCallback(() => {
    if (canProduce) {
      setGlucoseProduced(prev => prev + 1);
      setOxygenProduced(prev => prev + 6);
      setWaterLevel(prev => Math.max(0.1, prev - 0.1));
      setCo2Level(prev => Math.max(0.1, prev - 0.1));
      setScore(prev => prev + 50);
    }
  }, [canProduce]);

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
      setFeedback({ type: 'success', message: 'Đúng rồi! 🌱' });
    } else {
      setFeedback({ type: 'error', message: `Sai! Đáp án: ${currentQuestion.options[currentQuestion.answer]}` });
    }
    
    setShowQuiz(false);
    setQuestionsAnswered(prev => prev + 1);
    
    if (questionsAnswered + 1 >= QUIZ.length) {
      setTimeout(() => setGameComplete(true), 1500);
    } else {
      setTimeout(() => setFeedback(null), 1500);
    }
  }, [currentQuestion, questionsAnswered]);

  const handleReset = () => {
    setLightIntensity(0.5);
    setCo2Level(0.5);
    setWaterLevel(0.5);
    setGlucoseProduced(0);
    setOxygenProduced(0);
    setScore(0);
    setQuestionsAnswered(0);
    setShowQuiz(false);
    setGameComplete(false);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌱</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Quang hợp 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Điều khiển quá trình quang hợp trong lục lạp!
          </p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-left">
            <p className="text-sm text-green-400 mb-2">📚 Phương trình quang hợp:</p>
            <div className="text-center text-white text-sm">
              6CO₂ + 6H₂O + Ánh sáng → C₆H₁₂O₆ + 6O₂
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <Sun className="w-6 h-6 text-yellow-400 mx-auto" />
                <span className="text-gray-400">Ánh sáng</span>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 text-gray-400 mx-auto" />
                <span className="text-gray-400">CO₂</span>
              </div>
              <div className="text-center">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto" />
                <span className="text-gray-400">H₂O</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-yellow-500 text-white font-bold rounded-xl"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Complete
  if (gameComplete) {
    const stars = score >= 400 ? 3 : score >= 250 ? 2 : 1;
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Nhà sinh học thực vật! 🌿</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-2xl font-bold text-green-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm</p>
            <div className="mt-2 text-xs text-gray-300">
              Glucose: {glucoseProduced} | O₂: {oxygenProduced}
            </div>
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
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a1a0a']} />
        <PhotosynthesisScene
          lightIntensity={lightIntensity}
          co2Level={co2Level}
          waterLevel={waterLevel}
          producing={canProduce}
          glucoseProduced={glucoseProduced}
          oxygenProduced={oxygenProduced}
        />
      </Canvas>

      {/* UI */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-green-500/20 px-3 py-1.5 rounded-full">
            <span className="text-green-400 font-semibold text-sm">🏆 {score}</span>
          </div>
        </div>
        <button onClick={handleReset} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Status */}
      <div className="absolute top-32 left-4 right-4">
        <div className={`rounded-xl p-3 text-center ${canProduce ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
          <p className="text-white text-sm font-semibold">
            {canProduce ? '🌱 Đang quang hợp...' : '⚠️ Thiếu nguyên liệu!'}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`absolute top-48 left-4 right-4 p-3 rounded-xl text-center font-semibold ${
          feedback.type === 'success' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-32 left-4 right-4 space-y-3">
        {/* Light */}
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
              className="flex-1 accent-yellow-400"
            />
            <span className="text-yellow-400 text-sm w-12">{Math.round(lightIntensity * 100)}%</span>
          </div>
        </div>
        
        {/* CO2 */}
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={co2Level}
              onChange={(e) => setCo2Level(parseFloat(e.target.value))}
              className="flex-1 accent-gray-400"
            />
            <span className="text-gray-400 text-sm w-12">{Math.round(co2Level * 100)}%</span>
          </div>
        </div>
        
        {/* Water */}
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={waterLevel}
              onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
              className="flex-1 accent-blue-400"
            />
            <span className="text-blue-400 text-sm w-12">{Math.round(waterLevel * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4">
          <div className="flex gap-3">
            <button
              onClick={handleProduce}
              disabled={!canProduce}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Leaf className="w-5 h-5" /> Quang hợp
            </button>
            <button
              onClick={handleAskQuestion}
              disabled={questionsAnswered >= QUIZ.length}
              className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              Câu hỏi ({questionsAnswered}/{QUIZ.length})
            </button>
          </div>
        </div>
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
