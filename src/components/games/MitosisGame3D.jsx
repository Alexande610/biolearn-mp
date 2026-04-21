// MitosisGame3D.jsx - Nguyên phân 3D (Lớp 10)
// Fixed: Stable materials, proper cell/chromosome rendering
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles, Play, FastForward } from 'lucide-react';

// Mitosis phases
const PHASES = [
  {
    id: 'interphase',
    name: 'Kỳ trung gian',
    description: 'Tế bào chuẩn bị cho phân chia, ADN nhân đôi.',
    color: '#3b82f6',
    cellScale: 1,
    chromosomeState: 'chromatin',
  },
  {
    id: 'prophase',
    name: 'Kỳ đầu',
    description: 'Nhiễm sắc thể đóng xoắn, màng nhân tan rã.',
    color: '#8b5cf6',
    cellScale: 1.1,
    chromosomeState: 'condensed',
  },
  {
    id: 'metaphase',
    name: 'Kỳ giữa',
    description: 'Nhiễm sắc thể xếp thành hàng ở mặt phẳng xích đạo.',
    color: '#f59e0b',
    cellScale: 1.2,
    chromosomeState: 'aligned',
  },
  {
    id: 'anaphase',
    name: 'Kỳ sau',
    description: 'Các chromatid tách nhau và di chuyển về 2 cực.',
    color: '#ef4444',
    cellScale: 1.3,
    chromosomeState: 'separating',
  },
  {
    id: 'telophase',
    name: 'Kỳ cuối',
    description: 'Màng nhân tái hình thành, tế bào chất phân chia.',
    color: '#22c55e',
    cellScale: 1.1,
    chromosomeState: 'decondensed',
  },
];

// Chromosome 3D
function Chromosome3D({ position, rotation, color, isDouble = true, separating = false }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (!isDouble) {
    return (
      <mesh position={position} rotation={rotation}>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  const offset = separating ? 0.3 : 0.05;

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Sister chromatid 1 */}
      <mesh position={[-offset, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.25, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Sister chromatid 2 */}
      <mesh position={[offset, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.25, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Centromere */}
      {!separating && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
}

// Spindle fibers
function SpindleFibers({ phase }) {
  if (phase !== 'metaphase' && phase !== 'anaphase') return null;
  
  const points = useMemo(() => {
    const fibers = [];
    const count = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.15;
      const centerY = 0;
      
      // Top pole
      fibers.push({
        start: [0, 1.2, 0],
        end: [Math.cos(angle) * radius, centerY, Math.sin(angle) * radius],
      });
      
      // Bottom pole
      fibers.push({
        start: [0, -1.2, 0],
        end: [Math.cos(angle) * radius, centerY, Math.sin(angle) * radius],
      });
    }
    
    return fibers;
  }, []);

  return (
    <group>
      {points.map((fiber, i) => {
        const positions = new Float32Array([...fiber.start, ...fiber.end]);
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={positions}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#60a5fa" transparent opacity={0.5} />
          </line>
        );
      })}
      
      {/* Centrioles */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 6]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 6]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
    </group>
  );
}

// Cell membrane
function CellMembrane({ phase, dividing }) {
  const ref = useRef();
  const phaseData = PHASES.find(p => p.id === phase);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(phaseData?.cellScale || 1);
    }
  });

  const divisionProgress = dividing ? 0.5 : 0;

  return (
    <group ref={ref}>
      {/* Main cell body */}
      {!dividing ? (
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#a5f3fc" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : (
        <>
          {/* Dividing cells */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial color="#a5f3fc" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial color="#a5f3fc" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Cleavage furrow */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.03, 8, 32]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        </>
      )}
    </group>
  );
}

// Nucleus
function Nucleus({ phase, visible }) {
  if (!visible) return null;
  
  return (
    <mesh>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial 
        color="#6366f1" 
        transparent 
        opacity={phase === 'interphase' ? 0.6 : 0.2}
      />
    </mesh>
  );
}

// Chromosomes arrangement
function ChromosomeSet({ phase }) {
  const chromosomes = useMemo(() => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];
    const result = [];
    
    switch (phase) {
      case 'interphase':
        // Chromatin - scattered
        for (let i = 0; i < 8; i++) {
          result.push({
            position: [
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5,
            ],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
            color: colors[i % colors.length],
            isDouble: false,
          });
        }
        break;
        
      case 'prophase':
        // Condensed chromosomes
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          result.push({
            position: [Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0],
            rotation: [0, 0, angle],
            color: colors[i],
            isDouble: true,
          });
        }
        break;
        
      case 'metaphase':
        // Aligned at equator
        for (let i = 0; i < 4; i++) {
          const x = (i - 1.5) * 0.2;
          result.push({
            position: [x, 0, 0],
            rotation: [0, 0, Math.PI / 2],
            color: colors[i],
            isDouble: true,
          });
        }
        break;
        
      case 'anaphase':
        // Separating to poles
        for (let i = 0; i < 4; i++) {
          const x = (i - 1.5) * 0.15;
          // Moving to top
          result.push({
            position: [x, 0.6, 0],
            rotation: [0, 0, 0],
            color: colors[i],
            isDouble: false,
          });
          // Moving to bottom
          result.push({
            position: [x, -0.6, 0],
            rotation: [0, 0, 0],
            color: colors[i],
            isDouble: false,
          });
        }
        break;
        
      case 'telophase':
        // At poles, decondensing
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          // Top group
          result.push({
            position: [Math.cos(angle) * 0.2, 0.6 + Math.sin(angle) * 0.2, 0],
            rotation: [0, 0, angle],
            color: colors[i],
            isDouble: false,
          });
          // Bottom group
          result.push({
            position: [Math.cos(angle) * 0.2, -0.6 + Math.sin(angle) * 0.2, 0],
            rotation: [0, 0, angle],
            color: colors[i],
            isDouble: false,
          });
        }
        break;
    }
    
    return result;
  }, [phase]);

  return (
    <group>
      {chromosomes.map((chr, i) => (
        <Chromosome3D
          key={i}
          position={chr.position}
          rotation={chr.rotation}
          color={chr.color}
          isDouble={chr.isDouble}
          separating={phase === 'anaphase'}
        />
      ))}
    </group>
  );
}

// Main cell component
function MitosisCell({ phase }) {
  const phaseData = PHASES.find(p => p.id === phase);
  const showNucleus = phase === 'interphase' || phase === 'telophase';
  const isDividing = phase === 'telophase';
  
  return (
    <group>
      <CellMembrane phase={phase} dividing={isDividing} />
      <Nucleus phase={phase} visible={showNucleus} />
      <ChromosomeSet phase={phase} />
      <SpindleFibers phase={phase} />
    </group>
  );
}

// Scene
function MitosisScene({ phase }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 3, 3]} intensity={0.4} color="#8b5cf6" />
      
      <group ref={groupRef}>
        <MitosisCell phase={phase} />
      </group>
      
      <OrbitControls 
        enablePan={false}
        minDistance={3}
        maxDistance={10}
      />
    </>
  );
}

// Quiz
const QUIZ_QUESTIONS = [
  {
    question: 'Kỳ nào nhiễm sắc thể xếp thành hàng ở mặt phẳng xích đạo?',
    options: ['Kỳ đầu', 'Kỳ giữa', 'Kỳ sau', 'Kỳ cuối'],
    answer: 1,
  },
  {
    question: 'Kỳ nào các chromatid tách nhau ra?',
    options: ['Kỳ đầu', 'Kỳ giữa', 'Kỳ sau', 'Kỳ cuối'],
    answer: 2,
  },
  {
    question: 'ADN nhân đôi ở kỳ nào?',
    options: ['Kỳ trung gian', 'Kỳ đầu', 'Kỳ giữa', 'Kỳ sau'],
    answer: 0,
  },
  {
    question: 'Màng nhân tan rã ở kỳ nào?',
    options: ['Kỳ trung gian', 'Kỳ đầu', 'Kỳ giữa', 'Kỳ sau'],
    answer: 1,
  },
  {
    question: 'Tế bào chất phân chia ở kỳ nào?',
    options: ['Kỳ đầu', 'Kỳ giữa', 'Kỳ sau', 'Kỳ cuối'],
    answer: 3,
  },
  {
    question: 'Thoi phân bào hình thành hoàn chỉnh ở kỳ nào?',
    options: ['Kỳ trung gian', 'Kỳ đầu', 'Kỳ giữa', 'Kỳ sau'],
    answer: 2,
  },
];

// Main Component
export default function MitosisGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentPhase = PHASES[currentPhaseIndex];

  const handleNextPhase = useCallback(() => {
    if (currentPhaseIndex < PHASES.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      setCurrentPhaseIndex(0);
    }
  }, [currentPhaseIndex]);

  const handlePrevPhase = useCallback(() => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(prev => prev - 1);
    }
  }, [currentPhaseIndex]);

  const handleAskQuestion = useCallback(() => {
    const availableQuestions = QUIZ_QUESTIONS.filter((_, i) => i >= questionsAnswered);
    if (availableQuestions.length > 0) {
      setCurrentQuestion(QUIZ_QUESTIONS[questionsAnswered]);
      setShowQuiz(true);
    }
  }, [questionsAnswered]);

  const handleAnswer = useCallback((answerIndex) => {
    const isCorrect = answerIndex === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(prev => prev + 100);
      setFeedback({ type: 'success', message: 'Đúng rồi! 🎉' });
    } else {
      setFeedback({ type: 'error', message: `Sai! Đáp án: ${currentQuestion.options[currentQuestion.answer]}` });
      setScore(prev => Math.max(0, prev - 20));
    }
    
    setShowQuiz(false);
    setQuestionsAnswered(prev => prev + 1);
    
    if (questionsAnswered + 1 >= QUIZ_QUESTIONS.length) {
      setTimeout(() => setGameComplete(true), 1500);
    } else {
      setTimeout(() => setFeedback(null), 1500);
    }
  }, [currentQuestion, questionsAnswered]);

  const handleReset = () => {
    setCurrentPhaseIndex(0);
    setIsPlaying(false);
    setScore(0);
    setQuestionsAnswered(0);
    setShowQuiz(false);
    setGameComplete(false);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentPhaseIndex(prev => (prev + 1) % PHASES.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔬</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Nguyên phân 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Khám phá quá trình phân chia tế bào nguyên phân!
          </p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-left">
            <p className="text-sm text-blue-400 mb-2">📚 Các kỳ nguyên phân:</p>
            <div className="space-y-1 text-xs">
              {PHASES.map((phase, i) => (
                <div key={phase.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: phase.color }}>
                    {i + 1}
                  </span>
                  <span className="text-white">{phase.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl"
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Chuyên gia tế bào! 🔬</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-2xl font-bold text-blue-400">{score}</p>
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
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a1628']} />
        <MitosisScene phase={currentPhase.id} />
      </Canvas>

      {/* UI */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 px-3 py-1.5 rounded-full">
            <span className="text-blue-400 font-semibold text-sm">🏆 {score}</span>
          </div>
        </div>
        <button onClick={handleReset} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Phase info */}
      <div className="absolute top-32 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-4" style={{ borderLeft: `4px solid ${currentPhase.color}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentPhase.color }}>
              {currentPhaseIndex + 1}
            </span>
            <h3 className="text-white font-bold">{currentPhase.name}</h3>
          </div>
          <p className="text-gray-300 text-sm">{currentPhase.description}</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`absolute top-52 left-4 right-4 p-3 rounded-xl text-center font-semibold ${
          feedback.type === 'success' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Phase timeline */}
      <div className="absolute bottom-32 left-4 right-4">
        <div className="flex justify-center gap-2">
          {PHASES.map((phase, i) => (
            <button
              key={phase.id}
              onClick={() => setCurrentPhaseIndex(i)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                i === currentPhaseIndex ? 'scale-125 ring-2 ring-white' : 'opacity-60'
              }`}
              style={{ backgroundColor: phase.color }}
            >
              <span className="text-white text-xs font-bold">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4">
          <div className="flex gap-3">
            <button
              onClick={handlePrevPhase}
              disabled={currentPhaseIndex === 0}
              className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl disabled:opacity-30"
            >
              ◀ Trước
            </button>
            <button
              onClick={handleAskQuestion}
              disabled={questionsAnswered >= QUIZ_QUESTIONS.length}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Trả lời ({questionsAnswered}/{QUIZ_QUESTIONS.length})
            </button>
            <button
              onClick={handleNextPhase}
              className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl"
            >
              Sau ▶
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
