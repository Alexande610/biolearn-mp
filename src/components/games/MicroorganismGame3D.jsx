// MicroorganismGame3D.jsx - Thế giới Vi sinh vật 3D (Lớp 6)
// Thiết kế mô hình Bacteriophage T4 chân thực, Amip biến dạng chân giả, vi khuẩn lông roi uốn lượn chuyển động, nấm men nảy chồi sinh sản, trùng giày hình chiếc dép lông tiêm và tích hợp giao diện kính hiển vi điện tử holographic.

import React, { useState, useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Play, Microscope, Award, HelpCircle, CheckCircle, Navigation } from 'lucide-react';

const MICROORGANISMS = [
  { id: 'bacteria', name: 'Vi khuẩn E. coli', kingdom: 'Khởi sinh', shape: 'rod', color: '#22c55e', size: '1 - 2 μm',
    facts: ['Tế bào nhân sơ (chưa có màng nhân và bào quan có màng)', 'Di chuyển bằng sợi roi (flagella) uốn lượn ở đuôi', 'Thành tế bào cấu tạo từ peptidoglycan cứng cáp', 'Có các lông bám (pili) giúp bám dính bề mặt'] },
  { id: 'virus', name: 'Thể thực khuẩn T4 (Virus)', kingdom: 'Chưa xếp giới', shape: 'phage', color: '#ef4444', size: '95 nm',
    facts: ['Không có cấu tạo tế bào, chỉ là dạng sống đơn giản nhất', 'Cấu trúc gồm đầu đa diện chứa ADN và đuôi bám ký sinh', 'Chỉ nhân lên khi ký sinh bắt buộc trong tế bào vật chủ (vi khuẩn)', '6 sợi đuôi bám chân nhện giúp nhận diện vi khuẩn'] },
  { id: 'amoeba', name: 'Amip biến hình (Trùng biến hình)', kingdom: 'Nguyên sinh', shape: 'blob', color: '#8b5cf6', size: '200 - 500 μm',
    facts: ['Đơn bào nhân thực, cơ thể là khối chất tế bào lỏng', 'Di chuyển và bắt mồi bằng chân giả (pseudopodia) biến hình', 'Hình thành không bào tiêu hóa để hấp thụ thức ăn nội bào', 'Sống chủ yếu ở môi trường nước ngọt ẩm ướt'] },
  { id: 'yeast', name: 'Nấm men bánh mì', kingdom: 'Nấm', shape: 'oval', color: '#f59e0b', size: '5 - 10 μm',
    facts: ['Đơn bào nhân thực, hình trứng hoặc hình bầu dục', 'Sinh sản vô tính đặc trưng bằng phương pháp nảy chồi (budding)', 'Đóng vai trò chủ chốt trong quá trình lên men rượu và bánh mì', 'Thành tế bào cấu tạo bằng chitin bền vững'] },
  { id: 'algae', name: 'Tảo lục đơn bào', kingdom: 'Nguyên sinh', shape: 'sphere', color: '#10b981', size: '10 - 20 μm',
    facts: ['Đơn bào nhân thực, chứa lục lạp hình chén lớn màu xanh', 'Có khả năng quang hợp tự dưỡng sản sinh oxy cho Trái Đất', 'Có 2 sợi roi (flagella) dài ở đỉnh đầu giúp bơi lội', 'Sống thành quần thể rực rỡ ở đầm hồ, ao nước'] },
  { id: 'paramecium', name: 'Trùng giày (Trùng thảo đế)', kingdom: 'Nguyên sinh', shape: 'elongated', color: '#06b6d4', size: '150 - 300 μm',
    facts: ['Đơn bào nhân thực hình chiếc dép dẹt đặc trưng', 'Bề mặt phủ kín hàng nghìn lông tiêm (cilia) rung động bơi lội', 'Có rãnh miệng lõm sâu để lùa vi khuẩn làm thức ăn', 'Có không bào co bóp hình hoa hướng dương điều hòa nước'] },
];

const QUIZ = [
  { q: 'Cấu trúc của Vi khuẩn có điểm gì đặc biệt nhất?', opts: ['Chưa có cấu tạo tế bào', 'Có nhân sơ, chưa có màng nhân', 'Có lục lạp để quang hợp'], correct: 1 },
  { q: 'Thể thực khuẩn T4 (Virus) nhân lên bằng cách nào?', opts: ['Lên men chất hữu cơ', 'Phân đôi tế bào', 'Ký sinh bắt buộc trong vật chủ'], correct: 2 },
  { q: 'Trùng biến hình (Amip) di chuyển và bắt mồi nhờ bộ phận nào?', opts: ['Các sợi lông tiêm', 'Các chân giả biến hình', 'Sợi roi dài ở đuôi'], correct: 1 },
  { q: 'Nấm men bánh mì sinh sản vô tính bằng hình thức đặc trưng nào?', opts: ['Nảy chồi', 'Phân đôi', 'Tạo bào tử'], correct: 0 },
  { q: 'Tảo lục đơn bào có vai trò gì quan trọng cho sinh giới?', opts: ['Ký sinh gây bệnh', 'Quang hợp tạo chất hữu cơ và Oxy', 'Lên men bia rượu'], correct: 1 },
  { q: 'Trùng giày lùa thức ăn vào cơ thể qua bộ phận nào?', opts: ['Khí khổng', 'Chân giả', 'Rãnh miệng'], correct: 2 },
  { q: 'Bào quan nào chiếm diện tích lớn nhất ở tảo lục đơn bào?', opts: ['Lục lạp hình chén', 'Không bào co bóp', 'Bao myelin'], correct: 0 },
];

// Base starting coordinates for microorganisms
const BASE_POSITIONS = {
  bacteria: [-2.0, 0.8, 0],
  virus: [-0.6, 1.4, 0.5],
  amoeba: [1.3, 0.8, -0.3],
  yeast: [-1.4, -1.0, 0.3],
  algae: [0.5, -1.3, 0],
  paramecium: [2.0, -0.6, 0.4]
};

// Calculate coordinates procedurally so both model positioning and camera tracking stay perfectly synchronized
function getOrganismPosition(id, t) {
  const base = BASE_POSITIONS[id] || [0, 0, 0];
  const idx = MICROORGANISMS.findIndex(m => m.id === id);
  
  // Custom swimming frequencies and amplitudes for organic paths
  const speed = 0.45;
  const amp = 0.7;
  const x = base[0] + Math.sin(t * speed + idx * 1.5) * amp;
  const y = base[1] + Math.cos(t * speed * 0.8 + idx * 2.0) * amp * 0.6;
  const z = base[2] + Math.sin(t * speed * 1.1 + idx * 1.0) * amp * 0.4;
  
  return new THREE.Vector3(x, y, z);
}

// --- 3D SUB-COMPONENTS ---

// 1. Vi khuẩn E. coli
const BacteriaModel = memo(function BacteriaModel({ isActive }) {
  const flagellaRef1 = useRef();
  const flagellaRef2 = useRef();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime * 8;
    if (flagellaRef1.current) {
      flagellaRef1.current.rotation.y = Math.sin(t) * 0.25;
      flagellaRef1.current.rotation.z = Math.cos(t) * 0.15;
    }
    if (flagellaRef2.current) {
      flagellaRef2.current.rotation.y = Math.cos(t + 1) * 0.25;
      flagellaRef2.current.rotation.z = Math.sin(t + 1) * 0.15;
    }
  });

  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[0.22, 0.65, 16, 16]} />
        <meshStandardMaterial 
          color={isActive ? '#4ade80' : '#16a34a'} 
          emissive={isActive ? '#22c55e' : '#000'} 
          emissiveIntensity={isActive ? 0.35 : 0}
          roughness={0.4} 
        />
      </mesh>

      {/* Pili (Lông bám) */}
      {Array.from({ length: 14 }).map((_, i) => {
        const phi = Math.acos(-1 + (2 * i) / 14);
        const theta = Math.sqrt(14 * Math.PI) * phi;
        const x = 0.23 * Math.cos(theta) * Math.sin(phi);
        const y = 0.45 * Math.cos(phi);
        const z = 0.23 * Math.sin(theta) * Math.sin(phi);
        return (
          <mesh key={i} position={[x, y, z]} rotation={[phi, theta, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.08, 4]} />
            <meshBasicMaterial color="#a7f3d0" />
          </mesh>
        );
      })}

      {/* Flagella 1 */}
      <group ref={flagellaRef1} position={[0, -0.45, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.008, 0.004, 0.6, 6]} />
          <meshBasicMaterial color="#86efac" />
        </mesh>
        <mesh position={[0.08, -0.75, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.004, 0.002, 0.4, 6]} />
          <meshBasicMaterial color="#86efac" />
        </mesh>
      </group>

      {/* Flagella 2 */}
      <group ref={flagellaRef2} position={[0.08, -0.45, -0.05]}>
        <mesh position={[0, -0.3, 0]} rotation={[0, 0.2, -0.15]}>
          <cylinderGeometry args={[0.008, 0.004, 0.55, 6]} />
          <meshBasicMaterial color="#86efac" />
        </mesh>
      </group>
    </group>
  );
});

// 2. Thể thực khuẩn T4 (Virus)
const VirusT4Model = memo(function VirusT4Model({ isActive }) {
  const headRef = useRef();
  
  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group>
      <mesh ref={headRef} position={[0, 0.4, 0]} castShadow>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial 
          color={isActive ? '#f87171' : '#dc2626'} 
          emissive={isActive ? '#ef4444' : '#000'}
          emissiveIntensity={isActive ? 0.4 : 0}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} />
      </mesh>

      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.46, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
      </mesh>

      {[-0.2, -0.1, 0, 0.1].map((y, idx) => (
        <mesh key={idx} position={[0, y - 0.08, 0]}>
          <torusGeometry args={[0.05, 0.012, 4, 12]} />
          <meshStandardMaterial color="#fca5a5" />
        </mesh>
      ))}

      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 6]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.7} />
      </mesh>

      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]} position={[0, -0.32, 0]}>
            <mesh position={[0.12, -0.06, 0]} rotation={[0, 0, -0.5]} castShadow>
              <cylinderGeometry args={[0.01, 0.008, 0.26, 4]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.27, -0.22, 0]} rotation={[0, 0, 0.6]} castShadow>
              <cylinderGeometry args={[0.008, 0.004, 0.32, 4]} />
              <meshStandardMaterial color="#fca5a5" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});

// 3. Amip biến hình
const AmoebaModel = memo(function AmoebaModel({ isActive }) {
  const blobRef = useRef();
  
  useFrame((state) => {
    if (blobRef.current) {
      const t = state.clock.elapsedTime * 1.5;
      blobRef.current.scale.set(
        1 + Math.sin(t) * 0.08,
        1 + Math.cos(t * 0.8) * 0.1,
        1 + Math.sin(t * 1.2) * 0.06
      );
      blobRef.current.rotation.y = Math.sin(t * 0.2) * 0.4;
    }
  });

  return (
    <group ref={blobRef}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.34, 2]} />
        <meshStandardMaterial 
          color={isActive ? '#a78bfa' : '#8b5cf6'} 
          transparent 
          opacity={0.65} 
          emissive={isActive ? '#7c3aed' : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          roughness={0.1}
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      <mesh position={[0.04, 0.05, -0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.7} />
      </mesh>

      <mesh position={[-0.15, -0.08, 0.05]} scale={0.6}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.1, -0.15, 0.1]} scale={0.5}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.8} />
      </mesh>
    </group>
  );
});

// 4. Nấm men nảy chồi
const YeastModel = memo(function YeastModel({ isActive }) {
  return (
    <group rotation={[0.4, 0.2, 0.3]}>
      <mesh castShadow>
        <sphereGeometry args={[0.26, 24, 16]} />
        <meshStandardMaterial 
          color={isActive ? '#fbbf24' : '#d97706'} 
          emissive={isActive ? '#f59e0b' : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          roughness={0.5} 
        />
      </mesh>
      <mesh scale={1.05}>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color="#fde68a" transparent opacity={0.12} wireframe />
      </mesh>

      <group position={[0.22, 0.22, 0]} scale={0.55}>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} />
        </mesh>
        <mesh position={[-0.1, -0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
      </group>
      
      <mesh position={[-0.05, -0.05, 0]} scale={0.8}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
});

// 5. Tảo lục đơn bào
const AlgaeModel = memo(function AlgaeModel({ isActive }) {
  const flagellaRef = useRef();
  
  useFrame((state) => {
    if (flagellaRef.current) {
      flagellaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 6) * 0.2;
    }
  });

  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshStandardMaterial 
          color={isActive ? '#34d399' : '#059669'} 
          emissive={isActive ? '#10b981' : '#000'}
          emissiveIntensity={isActive ? 0.35 : 0}
          roughness={0.4} 
        />
      </mesh>

      <mesh scale={[0.9, 0.8, 0.9]} position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#064e3b" roughness={0.6} />
      </mesh>

      <group ref={flagellaRef} position={[0, 0.28, 0]}>
        <mesh position={[-0.14, 0.25, 0]} rotation={[0, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.006, 0.003, 0.5, 6]} />
          <meshBasicMaterial color="#a7f3d0" />
        </mesh>
        <mesh position={[0.14, 0.25, 0]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.006, 0.003, 0.5, 6]} />
          <meshBasicMaterial color="#a7f3d0" />
        </mesh>
      </group>
    </group>
  );
});

// 6. Trùng giày
const ParameciumModel = memo(function ParameciumModel({ isActive }) {
  const bodyRef = useRef();

  useFrame((state) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y = state.clock.elapsedTime * 0.6;
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={bodyRef} rotation={[0, 0, 0.3]}>
      <mesh castShadow scale={[0.6, 1.4, 0.4]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial 
          color={isActive ? '#22d3ee' : '#0891b2'} 
          emissive={isActive ? '#06b6d4' : '#000'}
          emissiveIntensity={isActive ? 0.35 : 0}
          roughness={0.3} 
        />
      </mesh>

      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x = 0.17 * Math.cos(angle);
        const y = 0.36 * Math.sin(angle);
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle + Math.PI/2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.04, 4]} />
            <meshBasicMaterial color="#cffafe" />
          </mesh>
        );
      })}

      <mesh position={[0.07, 0.05, 0.08]} scale={[0.3, 0.4, 0.2]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#164e63" />
      </mesh>

      <group position={[-0.05, 0.2, 0.06]} scale={0.5}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#22d3ee" />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0]} rotation={[0, 0, a]}>
              <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
              <meshBasicMaterial color="#a5f3fc" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
});

// A wrapper component that handles continuous swimming movement for each organism
function MovingOrganism({ id, isActive, children }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const currentPos = getOrganismPosition(id, t);
    groupRef.current.position.copy(currentPos);
  });

  return <group ref={groupRef}>{children}</group>;
}

// Camera Controller Component to automatically lerp camera position and look-at target to track the active organism
function CameraController({ selectedId, controlsRef }) {
  const lastTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (!controlsRef.current) return;

    if (selectedId) {
      // Calculate current moving position of targeted organism
      const t = state.clock.elapsedTime;
      const targetPos = getOrganismPosition(selectedId, t);
      
      // Lerp the OrbitControls look-at target to track the organism exactly
      controlsRef.current.target.lerp(targetPos, 0.08);
      
      // Calculate a comfortable zoom position
      const desiredCamPos = new THREE.Vector3(
        targetPos.x,
        targetPos.y,
        targetPos.z + 1.8
      );
      state.camera.position.lerp(desiredCamPos, 0.08);
    } else {
      // Return target back to center of scene
      const center = new THREE.Vector3(0, 0, 0);
      controlsRef.current.target.lerp(center, 0.08);
      
      // Return camera back to default zoom out view
      const defaultCamPos = new THREE.Vector3(0, 0, 5);
      state.camera.position.lerp(defaultCamPos, 0.08);
    }
    
    controlsRef.current.update();
  });

  return null;
}

// Complete 3D Scene
function MicroScene({ selected, organisms, controlsRef }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} castShadow />
      <pointLight position={[0, 0, 4]} intensity={0.6} color="#06b6d4" />
      <hemisphereLight args={['#ffffff', '#0a0a23', 0.9]} />
      
      {organisms.map((org) => {
        const isActive = selected === org.id;
        return (
          <MovingOrganism key={org.id} id={org.id} isActive={isActive}>
            <Float speed={isActive ? 3.0 : 1.5} rotationIntensity={0.3} floatIntensity={0.4}>
              <group>
                {isActive && (
                  <mesh position={[0, -0.52, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.42, 0.46, 16]} />
                    <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
                  </mesh>
                )}
                {org.id === 'bacteria' && <BacteriaModel isActive={isActive} />}
                {org.id === 'virus' && <VirusT4Model isActive={isActive} />}
                {org.id === 'amoeba' && <AmoebaModel isActive={isActive} />}
                {org.id === 'yeast' && <YeastModel isActive={isActive} />}
                {org.id === 'algae' && <AlgaeModel isActive={isActive} />}
                {org.id === 'paramecium' && <ParameciumModel isActive={isActive} />}
              </group>
            </Float>
          </MovingOrganism>
        );
      })}
      
      <CameraController selectedId={selected} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enablePan={true} minDistance={2} maxDistance={10} />
    </>
  );
}

// --- MAIN CONTROLLER ---

export default function MicroorganismGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro'); // intro, explore, quiz, complete
  const [selected, setSelected] = useState(null);
  const [explored, setExplored] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Track selected answer index
  
  const controlsRef = useRef();

  const current = MICROORGANISMS.find(m => m.id === selected);

  const handleExplore = (id) => {
    if (selected === id) {
      // Toggle off selection if clicked again as requested
      setSelected(null);
    } else {
      setSelected(id);
      if (!explored.includes(id)) setExplored(prev => [...prev, id]);
    }
  };

  const handleQuizAnswer = (idx) => {
    if (selectedAnswer !== null) return; // Prevent double clicking during feedback
    setSelectedAnswer(idx);
    
    const q = QUIZ[quizIdx];
    const isCorrect = idx === q.correct;
    
    if (isCorrect) {
      setFeedback({ type: 'success', msg: 'Chính xác. Cấu trúc vi sinh vật đã được ghi nhớ rất tốt.' });
    } else {
      setFeedback({ type: 'error', msg: 'Chưa chính xác. Hãy đọc kỹ đáp án màu xanh lá để bổ sung kiến thức.' });
    }

    // Correct answer is displayed instantly; delay moving to the next question based on correctness
    const delay = isCorrect ? 2000 : 5000;

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      if (quizIdx < QUIZ.length - 1) {
        setQuizIdx(i => i + 1);
      } else {
        setPhase('complete');
      }
    }, delay);
  };

  if (phase === 'intro') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-teal-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🦠</div>
          <h2 className="text-2xl font-bold text-white mb-3">Thế Giới Vi Sinh Vật 3D</h2>
          <p className="text-gray-300 text-sm mb-2">Khám phá thế giới siêu vi qua kính hiển vi 3D!</p>
          <p className="text-gray-400 text-xs mb-4">Bấm chọn vi sinh vật để quan sát. Khám phá 4 loài để làm quiz!</p>
          
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {MICROORGANISMS.map(m => (
              <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: m.color + '30', color: m.color }}>
                {m.name.split(' (')[0]}
              </span>
            ))}
          </div>

          <button 
            onClick={() => setPhase('explore')} 
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-teal-950/40 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-yellow-500/25 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-bounce">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-5 animate-pulse" />
          <h2 className="text-2.5xl font-black text-white mb-2 uppercase tracking-wide">Hoàn Thành! 🎉</h2>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6">Em đã đạt chứng chỉ nghiên cứu vi sinh vật</p>
          
          <button 
            onClick={() => onComplete(100)} 
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-lg active:scale-95 cursor-pointer"
          >
            Hoàn thành bài học
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = QUIZ[quizIdx];
    return (
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-fade-in">
        {/* local stylesheet to dynamically support light & dark themes seamlessly and override global overrides */}
        <style>{`
          .quiz-card {
            background: rgba(21, 19, 60, 0.96);
            border: 2px solid rgba(99, 102, 241, 0.3);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            color: #ffffff;
          }
          .quiz-question {
            color: #ffffff !important;
          }
          .quiz-option {
            background: rgba(30, 27, 75, 0.85);
            border: 1px solid rgba(99, 102, 241, 0.25);
            color: #f1f5f9 !important;
            transition: all 0.2s ease;
          }
          .quiz-option:hover {
            background: rgba(49, 46, 129, 0.9);
            border-color: rgba(45, 212, 191, 0.5);
            color: #ffffff !important;
          }
          .quiz-option-correct {
            background: #10b981 !important;
            border-color: #34d399 !important;
            color: #ffffff !important;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.4) !important;
          }
          .quiz-option-incorrect {
            background: #f43f5e !important;
            border-color: #fb7185 !important;
            color: #ffffff !important;
            box-shadow: 0 0 15px rgba(244, 63, 94, 0.4) !important;
          }
          .quiz-option-dimmed {
            opacity: 0.25 !important;
            pointer-events: none;
          }
          .quiz-feedback-success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #34d399 !important;
          }
          .quiz-feedback-error {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.2);
            color: #fda4af !important;
          }

          /* LIGHT THEME OVERRIDES */
          body.light-theme .quiz-card {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12) !important;
            color: #0f172a !important;
          }
          body.light-theme .quiz-question {
            color: #0f172a !important;
          }
          body.light-theme .quiz-option {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: #334155 !important;
          }
          body.light-theme .quiz-option:hover {
            background: #f1f5f9 !important;
            border-color: #14b8a6 !important;
            color: #0f172a !important;
          }
          body.light-theme .quiz-option-correct {
            background: #10b981 !important;
            border-color: #059669 !important;
            color: #ffffff !important;
          }
          body.light-theme .quiz-option-incorrect {
            background: #ef4444 !important;
            border-color: #dc2626 !important;
            color: #ffffff !important;
          }
          body.light-theme .quiz-feedback-success {
            background: rgba(16, 185, 129, 0.08) !important;
            border: 1px solid rgba(16, 185, 129, 0.2) !important;
            color: #059669 !important;
          }
          body.light-theme .quiz-feedback-error {
            background: rgba(239, 68, 68, 0.08) !important;
            border: 1px solid rgba(239, 68, 68, 0.2) !important;
            color: #dc2626 !important;
          }
          .quiz-header-title {
            color: #ffffff !important;
            font-weight: 900;
          }
          body.light-theme .quiz-header-title {
            color: #000000 !important;
          }
        `}</style>

        {/* QUIZ CARD CONTAINER */}
        <div className="quiz-card rounded-[2rem] p-8 max-w-lg w-full transition-all duration-300">
          
          {/* Header of quiz */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
            <span className="quiz-header-title text-xs tracking-widest uppercase font-black">
              Bài kiểm tra trắc nghiệm
            </span>
            <span className="text-xs font-extrabold bg-indigo-950/50 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-200">
              Câu {quizIdx + 1}/{QUIZ.length}
            </span>
          </div>
          
          {/* High Contrast Question text - Styled with custom class for theme support */}
          <p className="quiz-question text-lg font-black mb-6 leading-relaxed">{q.q}</p>
          
          <div className="space-y-3">
            {q.opts.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = q.correct === i;
              const hasAnswered = selectedAnswer !== null;
              
              // Apply dynamic theme-adaptive CSS classes
              let statusClass = "quiz-option";
              let badgeStyle = "bg-indigo-900/50 text-indigo-200";
              
              if (hasAnswered) {
                if (isCorrect) {
                  statusClass = "quiz-option-correct";
                  badgeStyle = "bg-white text-emerald-800";
                } else if (isSelected) {
                  statusClass = "quiz-option-incorrect";
                  badgeStyle = "bg-white text-rose-800";
                } else {
                  statusClass = "quiz-option-dimmed";
                  badgeStyle = "bg-slate-900 text-white/20";
                }
              }

              return (
                <button 
                  key={i} 
                  onClick={() => handleQuizAnswer(i)} 
                  disabled={hasAnswered}
                  className={`w-full p-4 rounded-2xl text-left text-sm font-bold flex items-center gap-3.5 cursor-pointer ${statusClass}`}
                >
                  <span className={`w-7 h-7 font-black rounded-xl flex items-center justify-center text-xs transition duration-200 ${badgeStyle}`}>
                    {String.fromCharCode(65+i)}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
          
          {/* Static Liquid Glass Feedback Alert Banner */}
          {feedback && (
            <div className={`mt-5 text-center py-4 rounded-2xl font-black text-xs uppercase tracking-widest border ${
              feedback.type === 'success' ? 'quiz-feedback-success' : 'quiz-feedback-error'
            }`}>
              <p className="mb-1">{feedback.msg}</p>
              {feedback.type === 'error' && (
                <p className="text-[9px] opacity-70 font-medium tracking-normal normal-case">
                  Tự động chuyển câu tiếp theo sau 5 giây...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden font-sans select-none animate-fade-in">
      
      {/* 3D Canvas - Clean Fullscreen Viewport without large glass plate background */}
      <Canvas camera={{ position: [0, 0, 5], fov: 48 }}>
        <color attach="background" args={['#060613']} />
        <MicroScene selected={selected} organisms={MICROORGANISMS} controlsRef={controlsRef} />
      </Canvas>

      {/* Góc trên: Tiến trình khám phá & Nút làm bài kiểm tra */}
      <div className="absolute top-20 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-2 pointer-events-auto text-white text-xs font-bold shadow-lg flex items-center gap-2">
          <Microscope className="w-4 h-4 text-teal-400" />
          <span>Đã khám phá: {explored.length}/{MICROORGANISMS.length} tiêu bản</span>
        </div>
        {explored.length >= 4 && (
          <button 
            onClick={() => setPhase('quiz')} 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 rounded-2xl text-white text-xs font-black uppercase tracking-wider pointer-events-auto shadow-lg transition active:scale-95 cursor-pointer animate-pulse"
          >
            Làm bài kiểm tra →
          </button>
        )}
      </div>

      {/* CỘT NÚT TÊN SINH VẬT DI CHUYỂN QUA PHÍA BÊN TRÁI DỌC SIDEBAR */}
      <div className="absolute left-4 top-36 bottom-20 flex flex-col gap-2.5 justify-center z-10 w-44 pointer-events-none">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1 text-left select-none px-1">
          Danh mục siêu vi
        </p>
        <div className="flex flex-col gap-2 pointer-events-auto overflow-y-auto pr-2 max-h-[65vh] scrollbar-thin">
          {MICROORGANISMS.map(org => (
            <button 
              key={org.id} 
              onClick={() => handleExplore(org.id)}
              className={`w-full px-3.5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition cursor-pointer flex items-center justify-between border ${
                selected === org.id 
                  ? 'text-white border-teal-400 bg-teal-900/35 shadow-[0_0_12px_rgba(20,184,166,0.3)]' 
                  : explored.includes(org.id) 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                    : 'bg-slate-900/80 border-white/5 text-gray-300 hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{org.name.split(' (')[0]}</span>
              {explored.includes(org.id) && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* BẢNG PHÂN TÍCH CHI TIẾT DƯỚI ĐÁY KHI CHỌN SINH VẬT (NHƯ HÌNH 2) */}
      <div className="absolute bottom-6 left-4 right-4 md:left-52 md:right-6 z-10 pointer-events-none">
        {current && (
          <div className="max-w-3xl mx-auto bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 pointer-events-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{current.id === 'virus' ? '👾' : '🦠'}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-base text-white uppercase tracking-wide">{current.name}</h3>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-950/40 text-purple-300 border border-purple-500/20">
                    GIỚI: {current.kingdom.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-black text-teal-400 bg-teal-950/40 border border-teal-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Kích thước: {current.size}
              </div>
            </div>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300 text-[11px] leading-relaxed">
              {current.facts.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-400 font-black flex-shrink-0 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hướng dẫn thao tác góc màn hình */}
      <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/40 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
        <p className="text-[9px] text-slate-400">❖ Chuột trái để xoay mô hình tự do</p>
      </div>

    </div>
  );
}
