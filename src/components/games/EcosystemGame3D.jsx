// EcosystemGame3D.jsx - Game hệ sinh thái 3D (Lớp 6)
// Fixed: Không dùng MeshDistortMaterial, camera và sizing hợp lý
import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Plus, Sparkles, Leaf, Bug } from 'lucide-react';

// Loại sinh vật
const ORGANISM_TYPES = {
  tree: { name: 'Cây xanh', type: 'producer', color: '#22c55e', energy: 100, icon: '🌳' },
  grass: { name: 'Cỏ', type: 'producer', color: '#84cc16', energy: 50, icon: '🌿' },
  flower: { name: 'Hoa', type: 'producer', color: '#f472b6', energy: 30, icon: '🌸' },
  rabbit: { name: 'Thỏ', type: 'herbivore', color: '#fbbf24', energy: 80, icon: '🐰' },
  deer: { name: 'Hươu', type: 'herbivore', color: '#d97706', energy: 100, icon: '🦌' },
  fox: { name: 'Cáo', type: 'carnivore', color: '#ef4444', energy: 120, icon: '🦊' },
  mushroom: { name: 'Nấm', type: 'decomposer', color: '#a855f7', energy: 20, icon: '🍄' },
};

// Component Cây 3D
function Tree3D({ position, scale = 1 }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.35, 0.7, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Component Cỏ 3D
function Grass3D({ position }) {
  return (
    <group position={position}>
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0]} rotation={[0, 0, (i - 1) * 0.2]}>
          <coneGeometry args={[0.03, 0.3, 4]} />
          <meshStandardMaterial color="#84cc16" />
        </mesh>
      ))}
    </group>
  );
}

// Component Hoa 3D
function Flower3D({ position }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* Petals */}
      <group ref={ref} position={[0, 0.35, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * Math.PI * 0.4) * 0.08, 0, Math.sin(i * Math.PI * 0.4) * 0.08]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#f472b6" />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>
    </group>
  );
}

// Component Động vật 3D
function Animal3D({ type, position }) {
  const ref = useRef();
  const data = ORGANISM_TYPES[type];
  
  useFrame((state) => {
    if (ref.current) {
      // Breathing animation
      ref.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      // Slight movement
      ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime + position[2]) * 0.1;
    }
  });

  const bodySize = type === 'fox' ? 0.25 : type === 'deer' ? 0.3 : 0.18;

  return (
    <Float speed={1} floatIntensity={0.1}>
      <group ref={ref} position={position}>
        {/* Body */}
        <mesh position={[0, bodySize, 0]}>
          <sphereGeometry args={[bodySize, 16, 16]} />
          <meshStandardMaterial color={data.color} roughness={0.7} />
        </mesh>
        {/* Head */}
        <mesh position={[bodySize * 0.8, bodySize * 1.2, 0]}>
          <sphereGeometry args={[bodySize * 0.6, 12, 12]} />
          <meshStandardMaterial color={data.color} roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[bodySize * 1.1, bodySize * 1.3, bodySize * 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[bodySize * 1.1, bodySize * 1.3, -bodySize * 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
    </Float>
  );
}

// Component Nấm 3D
function Mushroom3D({ position }) {
  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.15, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
    </group>
  );
}

// Ground
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#3d5a3d" roughness={1} />
    </mesh>
  );
}

// Render organism
function Organism({ type, position }) {
  switch (type) {
    case 'tree': return <Tree3D position={position} />;
    case 'grass': return <Grass3D position={position} />;
    case 'flower': return <Flower3D position={position} />;
    case 'rabbit':
    case 'deer':
    case 'fox': return <Animal3D type={type} position={position} />;
    case 'mushroom': return <Mushroom3D position={position} />;
    default: return null;
  }
}

// Main Scene
function EcosystemScene({ organisms }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} intensity={1} castShadow />
      
      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} />
      
      {/* Ground */}
      <Ground />
      
      {/* Organisms */}
      {organisms.map((org, i) => (
        <Organism key={i} type={org.type} position={org.position} />
      ))}
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI * 0.45}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

// Main Game Component
export default function EcosystemGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [organisms, setOrganisms] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [counts, setCounts] = useState({ producer: 0, herbivore: 0, carnivore: 0, decomposer: 0 });

  const handleAddOrganism = useCallback(() => {
    if (!selectedType || organisms.length >= 20) return;
    
    const data = ORGANISM_TYPES[selectedType];
    const newOrg = {
      type: selectedType,
      position: [
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      ]
    };
    
    setOrganisms(prev => [...prev, newOrg]);
    setCounts(prev => ({ ...prev, [data.type]: prev[data.type] + 1 }));
    setScore(prev => prev + 50);
  }, [selectedType, organisms.length]);

  const checkBalance = useCallback(() => {
    const { producer, herbivore, carnivore, decomposer } = counts;
    return producer >= 3 && herbivore >= 2 && carnivore >= 1 && decomposer >= 1;
  }, [counts]);

  const handleComplete = () => {
    if (checkBalance()) {
      setScore(prev => prev + 200);
      setGameComplete(true);
    }
  };

  const handleReset = () => {
    setOrganisms([]);
    setScore(0);
    setCounts({ producer: 0, herbivore: 0, carnivore: 0, decomposer: 0 });
    setSelectedType(null);
    setGameComplete(false);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌲</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Hệ sinh thái 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Xây dựng hệ sinh thái cân bằng với đủ các thành phần!
          </p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-left">
            <p className="text-sm text-green-400 mb-2">📚 Cần có:</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>🌳 Sinh vật sản xuất (3+): Cây, cỏ, hoa</li>
              <li>🐰 Động vật ăn cỏ (2+): Thỏ, hươu</li>
              <li>🦊 Động vật ăn thịt (1+): Cáo</li>
              <li>🍄 Sinh vật phân giải (1+): Nấm</li>
            </ul>
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Game Complete
  if (gameComplete) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Hệ sinh thái cân bằng! 🎉</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-2xl font-bold text-green-400">{score}</p>
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
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [8, 8, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        shadows
      >
        <color attach="background" args={['#1a2f1a']} />
        <EcosystemScene organisms={organisms} />
      </Canvas>

      {/* UI */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between">
        <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-2">
          <span className="text-green-400 font-semibold text-sm">🏆 {score}</span>
        </div>
        
        <button
          onClick={handleReset}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Organism selector */}
      <div className="absolute left-4 top-32 z-10">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 w-56">
          <p className="text-white font-bold text-sm mb-2">Thêm sinh vật:</p>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {Object.entries(ORGANISM_TYPES).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`p-2 rounded-lg text-xl transition-all ${
                  selectedType === key ? 'bg-white/30 scale-110' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={data.name}
              >
                {data.icon}
              </button>
            ))}
          </div>
          
          {selectedType && (
            <button
              onClick={handleAddOrganism}
              disabled={organisms.length >= 20}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Thêm {ORGANISM_TYPES[selectedType].name}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="absolute right-4 top-32 z-10">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 w-48">
          <p className="text-white font-bold text-sm mb-2">Trạng thái:</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-green-400">🌳 Sản xuất:</span>
              <span className={counts.producer >= 3 ? 'text-green-400' : 'text-gray-400'}>{counts.producer}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-400">🐰 Ăn cỏ:</span>
              <span className={counts.herbivore >= 2 ? 'text-green-400' : 'text-gray-400'}>{counts.herbivore}/2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">🦊 Ăn thịt:</span>
              <span className={counts.carnivore >= 1 ? 'text-green-400' : 'text-gray-400'}>{counts.carnivore}/1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">🍄 Phân giải:</span>
              <span className={counts.decomposer >= 1 ? 'text-green-400' : 'text-gray-400'}>{counts.decomposer}/1</span>
            </div>
          </div>
          
          <button
            onClick={handleComplete}
            disabled={!checkBalance()}
            className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
          >
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}
