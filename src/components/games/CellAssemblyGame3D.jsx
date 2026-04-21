// CellAssemblyGame3D.jsx - Game lắp ghép tế bào 3D (Lớp 6)
// Fixed: Camera, sizing, materials không gây lỗi shader
import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Check, Sparkles } from 'lucide-react';

// Định nghĩa các bào quan
const ORGANELLES = {
  nucleus: {
    id: 'nucleus', name: 'Nhân tế bào', description: 'Chứa ADN, điều khiển hoạt động tế bào',
    color: '#8B5CF6', position: [0, 0, 0], size: 0.6, inAnimal: true, inPlant: true
  },
  mitochondria: {
    id: 'mitochondria', name: 'Ti thể', description: 'Nhà máy năng lượng - sản xuất ATP',
    color: '#EF4444', position: [1, 0.4, 0.2], size: 0.25, inAnimal: true, inPlant: true
  },
  ribosome: {
    id: 'ribosome', name: 'Ribosome', description: 'Tổng hợp protein',
    color: '#F59E0B', position: [-0.8, -0.6, 0.4], size: 0.12, inAnimal: true, inPlant: true
  },
  er: {
    id: 'er', name: 'Lưới nội chất', description: 'Vận chuyển và tổng hợp chất',
    color: '#10B981', position: [0.6, -0.5, -0.2], size: 0.3, inAnimal: true, inPlant: true
  },
  golgi: {
    id: 'golgi', name: 'Bộ máy Golgi', description: 'Đóng gói và xuất chất',
    color: '#3B82F6', position: [-0.9, 0.5, -0.1], size: 0.28, inAnimal: true, inPlant: true
  },
  lysosome: {
    id: 'lysosome', name: 'Lysosome', description: 'Tiêu hóa chất thải',
    color: '#EC4899', position: [0.4, 0.8, 0.3], size: 0.18, inAnimal: true, inPlant: false
  },
  chloroplast: {
    id: 'chloroplast', name: 'Lục lạp', description: 'Quang hợp tạo đường',
    color: '#22C55E', position: [-0.6, 0.2, 0.5], size: 0.35, inAnimal: false, inPlant: true
  },
  vacuole: {
    id: 'vacuole', name: 'Không bào', description: 'Chứa nước và chất dinh dưỡng',
    color: '#06B6D4', position: [0, -0.2, 0], size: 0.9, inAnimal: false, inPlant: true
  }
};

// Màng tế bào
function CellMembrane({ cellType }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const size = cellType === 'plant' ? 2.2 : 1.8;
  const color = cellType === 'plant' ? '#86efac' : '#fda4af';
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.25} 
        side={THREE.DoubleSide}
        roughness={0.3}
      />
    </mesh>
  );
}

// Thành tế bào (plant only)
function CellWall() {
  return (
    <mesh>
      <boxGeometry args={[2.6, 2.6, 2.6]} />
      <meshStandardMaterial color="#84cc16" transparent opacity={0.15} wireframe={false} />
    </mesh>
  );
}

// Component bào quan 3D
function Organelle3D({ organelle, isPlaced, isTarget, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulse effect khi là target
      if (isTarget && !isPlaced) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  // Vị trí: nếu chưa đặt thì ở bên ngoài
  const position = isPlaced 
    ? organelle.position 
    : [organelle.position[0] * 2.5, organelle.position[1] + 2.5, organelle.position[2]];

  return (
    <Float speed={isPlaced ? 0.5 : 2} rotationIntensity={0.2} floatIntensity={isPlaced ? 0.1 : 0.5}>
      <group
        ref={meshRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Main shape */}
        <mesh>
          <sphereGeometry args={[organelle.size, 24, 24]} />
          <meshStandardMaterial 
            color={organelle.color} 
            roughness={0.4}
            metalness={0.1}
            emissive={isTarget ? organelle.color : '#000000'}
            emissiveIntensity={isTarget ? 0.3 : 0}
          />
        </mesh>
        
        {/* Glow khi hover hoặc target */}
        {(hovered || isTarget) && !isPlaced && (
          <mesh>
            <sphereGeometry args={[organelle.size * 1.4, 16, 16]} />
            <meshBasicMaterial 
              color={isTarget ? '#fbbf24' : organelle.color} 
              transparent 
              opacity={0.25}
            />
          </mesh>
        )}
        
        {/* Label */}
        {(hovered || isTarget) && !isPlaced && (
          <Html position={[0, organelle.size + 0.3, 0]} center distanceFactor={8}>
            <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-center whitespace-nowrap shadow-xl">
              <p className="font-bold text-sm">{organelle.name}</p>
              <p className="text-xs text-gray-300 max-w-[140px]">{organelle.description}</p>
            </div>
          </Html>
        )}
        
        {/* Check mark khi đã đặt */}
        {isPlaced && (
          <Html position={[0, organelle.size + 0.15, 0]} center distanceFactor={8}>
            <div className="bg-green-500 rounded-full p-1 shadow-lg">
              <Check className="w-3 h-3 text-white" />
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

// Drop zone indicator
function DropZone({ position, size, isActive }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });
  
  if (!isActive) return null;
  
  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[size * 1.5, 0.03, 8, 32]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
    </mesh>
  );
}

// Main Scene
function CellScene({ cellType, placedOrganelles, currentOrganelle, onPlaceOrganelle }) {
  const organelleList = useMemo(() => {
    return Object.values(ORGANELLES).filter(org => 
      cellType === 'plant' ? org.inPlant : org.inAnimal
    );
  }, [cellType]);

  return (
    <>
      {/* Ánh sáng mạnh - không dùng Environment preset (gây trắng màn hình) */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />
      <pointLight position={[-5, 3, 5]} intensity={0.6} color="#60a5fa" />
      <hemisphereLight args={['#ffffff', '#e0e7ff', 0.8]} />
      
      {/* Cell membrane */}
      <CellMembrane cellType={cellType} />
      
      {/* Cell wall (plant only) */}
      {cellType === 'plant' && <CellWall />}
      
      {/* Organelles */}
      {organelleList.map(organelle => (
        <group key={organelle.id}>
          <DropZone 
            position={organelle.position}
            size={organelle.size}
            isActive={currentOrganelle?.id === organelle.id && !placedOrganelles.includes(organelle.id)}
          />
          <Organelle3D
            organelle={organelle}
            isPlaced={placedOrganelles.includes(organelle.id)}
            isTarget={currentOrganelle?.id === organelle.id}
            onClick={() => {
              if (currentOrganelle?.id === organelle.id && !placedOrganelles.includes(organelle.id)) {
                onPlaceOrganelle(organelle.id);
              }
            }}
          />
        </group>
      ))}
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        autoRotate={placedOrganelles.length === 0}
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />
    </>
  );
}

// Main Game Component
export default function CellAssemblyGame3D({ onComplete }) {
  const [cellType, setCellType] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [placedOrganelles, setPlacedOrganelles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const organelleList = useMemo(() => {
    if (!cellType) return [];
    return Object.values(ORGANELLES).filter(org => 
      cellType === 'plant' ? org.inPlant : org.inAnimal
    );
  }, [cellType]);

  const currentOrganelle = organelleList[currentIndex];
  const totalOrganelles = organelleList.length;
  const progress = totalOrganelles > 0 ? (placedOrganelles.length / totalOrganelles) * 100 : 0;

  const handlePlaceOrganelle = useCallback((organelleId) => {
    if (placedOrganelles.includes(organelleId)) return;
    
    setPlacedOrganelles(prev => [...prev, organelleId]);
    setScore(prev => prev + 100);
    
    if (placedOrganelles.length + 1 >= totalOrganelles) {
      setTimeout(() => setGameComplete(true), 800);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [placedOrganelles, totalOrganelles]);

  const handleReset = () => {
    setPlacedOrganelles([]);
    setCurrentIndex(0);
    setScore(0);
    setGameComplete(false);
    setCellType(null);
    setShowTutorial(true);
  };

  // Tutorial / Selection screen
  if (showTutorial || !cellType) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔬</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Lắp ghép Tế bào 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Click vào bào quan để đặt vào đúng vị trí. Xoay mô hình 3D để quan sát!
          </p>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-left">
            <ul className="text-sm text-gray-300 space-y-1">
              <li>🖱️ Kéo chuột để xoay</li>
              <li>🔍 Scroll để zoom</li>
              <li>✨ Click bào quan sáng để đặt</li>
            </ul>
          </div>
          
          <p className="text-gray-400 text-sm mb-3">Chọn loại tế bào:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setCellType('animal'); setShowTutorial(false); }}
              className="p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl hover:scale-105 transition-transform"
            >
              <span className="text-2xl mb-1 block">🐾</span>
              <span className="text-white font-bold text-sm">Động vật</span>
            </button>
            <button
              onClick={() => { setCellType('plant'); setShowTutorial(false); }}
              className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl hover:scale-105 transition-transform"
            >
              <span className="text-2xl mb-1 block">🌱</span>
              <span className="text-white font-bold text-sm">Thực vật</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Complete
  if (gameComplete) {
    const stars = score >= 700 ? 3 : score >= 400 ? 2 : 1;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Xuất sắc! 🎉</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-2xl font-bold text-purple-400">{score}</p>
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
        camera={{ position: [0, 2, 6], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0f172a']} />
        <CellScene 
          cellType={cellType}
          placedOrganelles={placedOrganelles}
          currentOrganelle={currentOrganelle}
          onPlaceOrganelle={handlePlaceOrganelle}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            cellType === 'plant' ? 'bg-green-500/20 text-green-400' : 'bg-pink-500/20 text-pink-400'
          }`}>
            {cellType === 'plant' ? '🌱 Thực vật' : '🐾 Động vật'}
          </div>
          <div className="bg-purple-500/20 px-3 py-1.5 rounded-full">
            <span className="text-purple-400 font-semibold text-sm">🏆 {score}</span>
          </div>
        </div>
        
        <button
          onClick={handleReset}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 pointer-events-auto"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4">
          {currentOrganelle && (
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: currentOrganelle.color + '40' }}
              >
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: currentOrganelle.color }}
                />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{currentOrganelle.name}</p>
                <p className="text-gray-400 text-xs">{currentOrganelle.description}</p>
              </div>
              <span className="text-gray-400 text-sm">{placedOrganelles.length + 1}/{totalOrganelles}</span>
            </div>
          )}
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
