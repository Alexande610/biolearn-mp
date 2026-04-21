// DNABuilderGame3D.jsx - Xây dựng ADN 3D (Lớp 9)
// Redesigned: Beautiful DNA helix like biology3d/DNAHelix.jsx
import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles } from 'lucide-react';

// Màu sắc giống DNAHelix.jsx trong biology3d
const BASE_COLORS = {
  A: '#ff6b6b', // Adenine - đỏ
  T: '#4ecdc4', // Thymine - xanh cyan
  G: '#ffe66d', // Guanine - vàng
  C: '#95e1d3', // Cytosine - xanh mint
};

const BASES = {
  A: { name: 'Adenine', color: BASE_COLORS.A, pair: 'T' },
  T: { name: 'Thymine', color: BASE_COLORS.T, pair: 'A' },
  G: { name: 'Guanine', color: BASE_COLORS.G, pair: 'C' },
  C: { name: 'Cytosine', color: BASE_COLORS.C, pair: 'G' },
};

// Generate random sequence
const generateSequence = (length) => {
  const bases = ['A', 'T', 'G', 'C'];
  return Array.from({ length }, () => bases[Math.floor(Math.random() * 4)]);
};

// Component cho một nucleotide - hình cầu như DNAHelix.jsx
function Nucleotide({ position, color, label, showLabel, isTarget, isPulsing }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && isPulsing) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.4}
          emissive={isTarget ? color : '#000000'}
          emissiveIntensity={isTarget ? 0.5 : 0}
        />
      </mesh>
      {showLabel && (
        <Html position={[0, 0.5, 0]} center distanceFactor={15}>
          <div className={`px-2 py-1 rounded text-xs font-bold ${
            isTarget ? 'bg-yellow-500 text-black' : 'bg-black/70 text-white'
          }`}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// Placeholder cho vị trí cần ghép
function PlaceholderNucleotide({ position }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          transparent 
          opacity={0.4}
          emissive="#fbbf24"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html position={[0, 0, 0]} center distanceFactor={15}>
        <div className="text-yellow-400 text-lg font-bold animate-pulse">?</div>
      </Html>
    </group>
  );
}

// Component cho cầu nối hydrogen - giống DNAHelix.jsx
function HydrogenBond({ start, end }) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.6} transparent linewidth={2} />
    </line>
  );
}

// Component cho xương sống phosphate-đường - giống DNAHelix.jsx
function Backbone({ points, color }) {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const curvePoints = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(curvePoints);
  }, [points]);

  if (!curve) return null;

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.08, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

// DNA Helix structure - Beautiful version
function DNAHelixGame({ sequence, placedBases, currentIndex }) {
  const groupRef = useRef();
  const basePairCount = sequence.length;
  const helixRadius = 1.5;
  const helixPitch = 0.5;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Tạo cấu trúc DNA
  const dnaStructure = useMemo(() => {
    const leftNucleotides = [];
    const rightNucleotides = [];
    const bonds = [];
    const backbone1Points = [];
    const backbone2Points = [];

    for (let i = 0; i < basePairCount; i++) {
      const angle = (i / basePairCount) * Math.PI * 4; // 2 vòng xoắn
      const y = (i - basePairCount / 2) * helixPitch;
      
      const base = sequence[i];
      const pairBase = BASES[base].pair;
      
      // Vị trí nucleotide trái (mạch gốc - template)
      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;
      
      // Vị trí nucleotide phải (mạch bổ sung - cần ghép)
      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;

      // Nucleotide trái (luôn hiển thị)
      leftNucleotides.push({
        position: [x1, y, z1],
        color: BASES[base].color,
        label: base,
        isTarget: i === currentIndex,
      });

      // Nucleotide phải (chỉ hiển thị nếu đã ghép)
      const isPlaced = placedBases.includes(i);
      const isCurrentTarget = i === currentIndex;
      
      rightNucleotides.push({
        position: [x2, y, z2],
        color: BASES[pairBase].color,
        label: pairBase,
        isPlaced,
        isCurrentTarget,
      });

      // Cầu nối hydrogen (chỉ khi đã ghép)
      if (isPlaced) {
        bonds.push({
          start: [x1, y, z1],
          end: [x2, y, z2]
        });
      }

      // Điểm cho xương sống
      backbone1Points.push([x1, y, z1]);
      if (isPlaced) {
        backbone2Points.push([x2, y, z2]);
      }
    }

    return { leftNucleotides, rightNucleotides, bonds, backbone1Points, backbone2Points };
  }, [sequence, basePairCount, helixRadius, helixPitch, placedBases, currentIndex]);

  return (
    <group ref={groupRef}>
      {/* Xương sống mạch trái (template) - luôn hiển thị */}
      <Backbone points={dnaStructure.backbone1Points} color="#6366f1" />
      
      {/* Xương sống mạch phải (bổ sung) - chỉ hiển thị phần đã ghép */}
      {dnaStructure.backbone2Points.length >= 2 && (
        <Backbone points={dnaStructure.backbone2Points} color="#8b5cf6" />
      )}

      {/* Các nucleotide mạch trái (template) */}
      {dnaStructure.leftNucleotides.map((nuc, idx) => (
        <Nucleotide
          key={`left-${idx}`}
          position={nuc.position}
          color={nuc.color}
          label={nuc.label}
          showLabel={true}
          isTarget={nuc.isTarget}
          isPulsing={nuc.isTarget}
        />
      ))}

      {/* Các nucleotide mạch phải (bổ sung) */}
      {dnaStructure.rightNucleotides.map((nuc, idx) => (
        nuc.isPlaced ? (
          <Nucleotide
            key={`right-${idx}`}
            position={nuc.position}
            color={nuc.color}
            label={nuc.label}
            showLabel={true}
            isTarget={false}
            isPulsing={false}
          />
        ) : nuc.isCurrentTarget ? (
          <PlaceholderNucleotide
            key={`placeholder-${idx}`}
            position={nuc.position}
          />
        ) : null
      ))}

      {/* Cầu nối hydrogen */}
      {dnaStructure.bonds.map((bond, idx) => (
        <HydrogenBond key={`bond-${idx}`} start={bond.start} end={bond.end} />
      ))}
    </group>
  );
}

// Base selector - nút chọn base
function BaseSelector({ onSelect, currentBase, disabled }) {
  const correctPair = BASES[currentBase]?.pair;
  
  return (
    <div className="absolute bottom-4 left-4 right-4">
      <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4">
        <p className="text-white text-sm mb-3 text-center">
          Chọn base bổ sung cho <span className="font-bold" style={{ color: BASES[currentBase]?.color }}>{currentBase}</span>:
        </p>
        <div className="flex justify-center gap-3">
          {Object.entries(BASES).map(([base, data]) => (
            <button
              key={base}
              onClick={() => onSelect(base)}
              disabled={disabled}
              className="w-14 h-14 rounded-full font-bold text-lg text-white transition-all hover:scale-110 disabled:opacity-50 shadow-lg"
              style={{ 
                backgroundColor: data.color,
                boxShadow: base === correctPair ? `0 0 20px ${data.color}` : 'none'
              }}
            >
              {base}
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-xs text-center mt-3">
          💡 A ↔ T | G ↔ C (Nguyên tắc bổ sung)
        </p>
      </div>
    </div>
  );
}

// Main Scene
function DNAScene({ sequence, placedBases, currentIndex }) {
  return (
    <>
      {/* Lighting - giống DNAHelix.jsx */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* DNA Helix */}
      <DNAHelixGame
        sequence={sequence}
        placedBases={placedBases}
        currentIndex={currentIndex}
      />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        autoRotate={false}
      />
    </>
  );
}

// Main Game Component
export default function DNABuilderGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState(() => generateSequence(8));
  const [placedBases, setPlacedBases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const handleSelectBase = useCallback((selectedBase) => {
    const correctBase = BASES[sequence[currentIndex]].pair;
    
    if (selectedBase === correctBase) {
      setPlacedBases(prev => [...prev, currentIndex]);
      setScore(prev => prev + 100);
      setFeedback({ type: 'success', message: 'Đúng rồi! 🎉' });
      
      setTimeout(() => setFeedback(null), 800);
      
      if (currentIndex + 1 >= sequence.length) {
        // Level complete
        if (level < 3) {
          setTimeout(() => {
            setLevel(prev => prev + 1);
            const newLength = 8 + level * 2; // 8, 10, 12
            setSequence(generateSequence(newLength));
            setPlacedBases([]);
            setCurrentIndex(0);
          }, 1000);
        } else {
          setTimeout(() => setGameComplete(true), 1000);
        }
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setMistakes(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 25));
      setFeedback({ type: 'error', message: `Sai! ${sequence[currentIndex]} ghép với ${correctBase}` });
      setTimeout(() => setFeedback(null), 1500);
    }
  }, [currentIndex, sequence, level]);

  const handleReset = () => {
    setLevel(1);
    setSequence(generateSequence(8));
    setPlacedBases([]);
    setCurrentIndex(0);
    setScore(0);
    setGameComplete(false);
    setMistakes(0);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🧬</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Xây dựng ADN 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Hoàn thành chuỗi xoắn kép ADN bằng cách chọn base bổ sung đúng!
          </p>
          
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-sm text-purple-400 mb-3 font-semibold">📚 Nguyên tắc bổ sung:</p>
            <div className="flex justify-center items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: BASE_COLORS.A }}>A</span>
                <span className="text-white">↔</span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: BASE_COLORS.T }}>T</span>
              </div>
              <span className="text-gray-500">|</span>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold" style={{ backgroundColor: BASE_COLORS.G }}>G</span>
                <span className="text-white">↔</span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold" style={{ backgroundColor: BASE_COLORS.C }}>C</span>
              </div>
            </div>
          </div>
          
          <div className="text-gray-400 text-xs mb-4">
            🖱️ Kéo để xoay ADN | Scroll để zoom
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Game Complete
  if (gameComplete) {
    const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành ADN! 🧬</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-3xl font-bold text-purple-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm số</p>
            <p className="text-xs text-gray-500 mt-1">Sai: {mistakes} lần</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition"
            >
              <RotateCcw className="w-4 h-4" /> Chơi lại
            </button>
            <button
              onClick={() => onComplete(score)}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentBase = sequence[currentIndex];

  return (
    <div className="absolute inset-0 bg-slate-900">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <DNAScene
          sequence={sequence}
          placedBases={placedBases}
          currentIndex={currentIndex}
        />
      </Canvas>

      {/* Header UI */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-purple-400 font-bold">🏆 {score}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-gray-300 text-sm">Level {level}/3</span>
          </div>
        </div>
        <button 
          onClick={handleReset} 
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Progress */}
      <div className="absolute top-32 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Đang ghép:</span>
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: BASES[currentBase]?.color }}
              >
                {currentBase}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-yellow-400 font-bold">?</span>
            </div>
            <span className="text-gray-400 text-sm">{placedBases.length}/{sequence.length}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(placedBases.length / sequence.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`absolute top-48 left-4 right-4 p-3 rounded-xl text-center font-semibold transition-all ${
          feedback.type === 'success' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Base selector */}
      <BaseSelector 
        onSelect={handleSelectBase}
        currentBase={currentBase}
        disabled={gameComplete}
      />
    </div>
  );
}
