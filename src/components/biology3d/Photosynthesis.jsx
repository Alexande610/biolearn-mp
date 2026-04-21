// Photosynthesis.jsx - Mô phỏng quá trình quang hợp 3D
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

// Phân tử nước (H2O)
function WaterMolecule({ position, targetPosition, speed = 1 }) {
  const groupRef = useRef();
  const [currentPos, setCurrentPos] = useState(position);

  useFrame((state, delta) => {
    if (groupRef.current && targetPosition) {
      // Di chuyển từ từ đến vị trí đích
      groupRef.current.position.x += (targetPosition[0] - groupRef.current.position.x) * delta * speed;
      groupRef.current.position.y += (targetPosition[1] - groupRef.current.position.y) * delta * speed;
      groupRef.current.position.z += (targetPosition[2] - groupRef.current.position.z) * delta * speed;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Oxygen - đỏ */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Hydrogen 1 */}
      <mesh position={[0.15, 0.1, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Hydrogen 2 */}
      <mesh position={[-0.15, 0.1, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Phân tử CO2
function CO2Molecule({ position, targetPosition, speed = 1 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current && targetPosition) {
      groupRef.current.position.x += (targetPosition[0] - groupRef.current.position.x) * delta * speed;
      groupRef.current.position.y += (targetPosition[1] - groupRef.current.position.y) * delta * speed;
      groupRef.current.position.z += (targetPosition[2] - groupRef.current.position.z) * delta * speed;
    }
    if (groupRef.current) {
      groupRef.current.rotation.z += delta;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Carbon - đen */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Oxygen 1 */}
      <mesh position={[0.25, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Oxygen 2 */}
      <mesh position={[-0.25, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// Phân tử O2
function O2Molecule({ position, velocity }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current && velocity) {
      groupRef.current.position.x += velocity[0] * delta;
      groupRef.current.position.y += velocity[1] * delta;
      groupRef.current.position.z += velocity[2] * delta;
      groupRef.current.rotation.x += delta * 2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0.1, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[-0.1, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

// Phân tử Glucose
function GlucoseMolecule({ position, isVisible }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
      const scale = isVisible ? 1 : 0;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Cấu trúc vòng 6 carbon */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        );
      })}
      {/* Các nhóm -OH */}
      {[0, 2, 4].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={`oh-${i}`} position={[Math.cos(angle) * 0.45, 0.1, Math.sin(angle) * 0.45]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        );
      })}
    </group>
  );
}

// Lục lạp
function Chloroplast({ position }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Nhịp thở nhẹ
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Vỏ ngoài */}
      <mesh>
        <capsuleGeometry args={[0.8, 2, 16, 32]} />
        <meshStandardMaterial color="#16a34a" transparent opacity={0.7} />
      </mesh>
      {/* Grana (chồng thylakoid) */}
      {[-0.6, -0.2, 0.2, 0.6].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          {[0, 1, 2, 3].map((j) => (
            <mesh key={j} position={[0, j * 0.08, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Stroma (chất nền) */}
      <mesh>
        <capsuleGeometry args={[0.6, 1.6, 16, 32]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Ánh sáng mặt trời
function Sunlight({ isActive }) {
  const groupRef = useRef();
  const [rays, setRays] = useState([]);

  useEffect(() => {
    if (isActive) {
      const newRays = [];
      for (let i = 0; i < 20; i++) {
        newRays.push({
          id: i,
          startX: -3 + Math.random() * 0.5,
          startY: 3 + Math.random() * 0.5,
          delay: Math.random() * 2
        });
      }
      setRays(newRays);
    }
  }, [isActive]);

  return (
    <group ref={groupRef}>
      {isActive && rays.map((ray) => (
        <SunRay key={ray.id} start={[ray.startX, ray.startY, 0]} delay={ray.delay} />
      ))}
    </group>
  );
}

function SunRay({ start, delay }) {
  const meshRef = useRef();
  const time = useRef(-delay);

  useFrame((state, delta) => {
    time.current += delta;
    if (meshRef.current && time.current > 0) {
      meshRef.current.position.x = start[0] + time.current * 2;
      meshRef.current.position.y = start[1] - time.current * 2;
      meshRef.current.material.opacity = Math.max(0, 1 - time.current * 0.5);
      
      if (time.current > 2) {
        time.current = -delay;
        meshRef.current.position.x = start[0];
        meshRef.current.position.y = start[1];
      }
    }
  });

  return (
    <mesh ref={meshRef} position={start}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#fde047" transparent />
    </mesh>
  );
}

// Scene quang hợp chính
function PhotosynthesisScene({ phase, setPhase }) {
  const [waterMolecules, setWaterMolecules] = useState([]);
  const [co2Molecules, setCO2Molecules] = useState([]);
  const [o2Molecules, setO2Molecules] = useState([]);
  const [showGlucose, setShowGlucose] = useState(false);

  useEffect(() => {
    // Khởi tạo phân tử ban đầu
    const waters = [];
    const co2s = [];
    for (let i = 0; i < 6; i++) {
      waters.push({
        id: i,
        position: [-2, -2 + i * 0.3, Math.random() - 0.5],
        target: [0, 0, 0]
      });
    }
    for (let i = 0; i < 6; i++) {
      co2s.push({
        id: i,
        position: [2, 2 - i * 0.3, Math.random() - 0.5],
        target: [0, 0.5, 0]
      });
    }
    setWaterMolecules(waters);
    setCO2Molecules(co2s);
  }, []);

  useEffect(() => {
    if (phase === 'light-reaction') {
      // Pha sáng: nước bị tách
      setTimeout(() => {
        setO2Molecules([
          { id: 1, position: [0, 0, 0], velocity: [0, 2, 0.5] },
          { id: 2, position: [0.2, 0, 0.1], velocity: [0, 2, -0.5] },
          { id: 3, position: [-0.2, 0, -0.1], velocity: [0, 2, 0.3] },
        ]);
      }, 2000);
    } else if (phase === 'calvin-cycle') {
      // Chu trình Calvin: tạo glucose
      setTimeout(() => {
        setShowGlucose(true);
      }, 2000);
    }
  }, [phase]);

  return (
    <>
      {/* Ánh sáng mặt trời */}
      <Sunlight isActive={phase === 'light-reaction'} />

      {/* Lục lạp */}
      <Chloroplast position={[0, 0, 0]} />

      {/* Phân tử nước */}
      {waterMolecules.map((w) => (
        <WaterMolecule 
          key={w.id} 
          position={w.position} 
          targetPosition={phase !== 'initial' ? w.target : null}
        />
      ))}

      {/* Phân tử CO2 */}
      {co2Molecules.map((c) => (
        <CO2Molecule 
          key={c.id} 
          position={c.position} 
          targetPosition={phase === 'calvin-cycle' ? c.target : null}
        />
      ))}

      {/* Phân tử O2 (sản phẩm) */}
      {o2Molecules.map((o) => (
        <O2Molecule key={o.id} position={o.position} velocity={o.velocity} />
      ))}

      {/* Glucose */}
      <GlucoseMolecule position={[0, -1, 0]} isVisible={showGlucose} />

      {/* Labels */}
      <Html position={[-2.5, -2, 0]}>
        <div className="text-blue-400 text-xs bg-black/50 px-2 py-1 rounded">H₂O (Nước)</div>
      </Html>
      <Html position={[2.5, 2, 0]}>
        <div className="text-gray-400 text-xs bg-black/50 px-2 py-1 rounded">CO₂</div>
      </Html>
      {o2Molecules.length > 0 && (
        <Html position={[0, 2.5, 0]}>
          <div className="text-blue-300 text-xs bg-black/50 px-2 py-1 rounded">O₂ (Thoát ra)</div>
        </Html>
      )}
      {showGlucose && (
        <Html position={[0, -2, 0]}>
          <div className="text-yellow-400 text-xs bg-black/50 px-2 py-1 rounded">C₆H₁₂O₆ (Glucose)</div>
        </Html>
      )}
    </>
  );
}

// Component chính
export default function Photosynthesis({ 
  width = "100%", 
  height = "100%",
  backgroundColor = "#0f172a"
}) {
  const [phase, setPhase] = useState('initial');
  const [isPlaying, setIsPlaying] = useState(false);

  const phases = [
    { id: 'initial', name: 'Bắt đầu', description: 'Nguyên liệu: H₂O từ rễ, CO₂ từ khí khổng' },
    { id: 'light-reaction', name: 'Pha sáng', description: 'Ánh sáng tách H₂O → O₂ + H⁺ + e⁻ → ATP + NADPH' },
    { id: 'calvin-cycle', name: 'Chu trình Calvin', description: 'CO₂ + ATP + NADPH → C₆H₁₂O₆ (Glucose)' },
  ];

  const currentPhaseInfo = phases.find(p => p.id === phase);

  const handlePlay = () => {
    setIsPlaying(true);
    setPhase('initial');
    
    setTimeout(() => setPhase('light-reaction'), 2000);
    setTimeout(() => setPhase('calvin-cycle'), 6000);
    setTimeout(() => setIsPlaying(false), 10000);
  };

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      <div style={{ width: '100%', height: '100%', background: backgroundColor, overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[-5, 5, 5]} intensity={1} color="#fde047" />
          <pointLight position={[5, -5, 5]} intensity={0.5} color="#22c55e" />
          
          <PhotosynthesisScene phase={phase} setPhase={setPhase} />
          
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">
            🌱 Quang hợp: {currentPhaseInfo?.name}
          </h3>
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`px-4 py-2 rounded-lg font-semibold ${
              isPlaying 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isPlaying ? '⏳ Đang chạy...' : '▶ Mô phỏng'}
          </button>
        </div>
        <p className="text-sm text-gray-300">{currentPhaseInfo?.description}</p>
        
        {/* Timeline */}
        <div className="flex mt-3 gap-2">
          {phases.map((p, i) => (
            <div
              key={p.id}
              className={`flex-1 h-2 rounded-full ${
                phases.findIndex(x => x.id === phase) >= i
                  ? 'bg-green-500'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Phương trình */}
      <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-4 py-2 text-white">
        <p className="text-xs text-gray-400">Phương trình quang hợp:</p>
        <p className="text-sm font-mono">6CO₂ + 6H₂O + Ánh sáng → C₆H₁₂O₆ + 6O₂</p>
      </div>
    </div>
  );
}
