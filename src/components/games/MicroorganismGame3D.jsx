// MicroorganismGame3D.jsx - Thế giới Vi sinh vật 3D (Lớp 6)
import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Play, Microscope } from 'lucide-react';

const MICROORGANISMS = [
  { id: 'bacteria', name: 'Vi khuẩn', kingdom: 'Khởi sinh', shape: 'rod', color: '#22c55e',
    facts: ['Nhân sơ (không có màng nhân)', 'Sinh sản bằng phân đôi', 'Có thành peptidoglycan', 'Kích thước 0.2-10 μm'] },
  { id: 'virus', name: 'Virus', kingdom: 'Chưa xếp giới', shape: 'icosahedron', color: '#ef4444',
    facts: ['Không phải tế bào', 'Ký sinh bắt buộc', 'Có vỏ protein (capsid)', 'Chứa ADN hoặc ARN'] },
  { id: 'amoeba', name: 'Amip', kingdom: 'Nguyên sinh', shape: 'blob', color: '#8b5cf6',
    facts: ['Đơn bào nhân thực', 'Di chuyển bằng chân giả', 'Tiêu hóa nội bào', 'Sinh sản vô tính'] },
  { id: 'yeast', name: 'Nấm men', kingdom: 'Nấm', shape: 'oval', color: '#f59e0b',
    facts: ['Đơn bào nhân thực', 'Sinh sản nảy chồi', 'Lên men rượu/bánh mì', 'Có thành chitin'] },
  { id: 'algae', name: 'Tảo lục', kingdom: 'Nguyên sinh', shape: 'sphere', color: '#10b981',
    facts: ['Có lục lạp, quang hợp', 'Sống trong nước', 'Đơn bào hoặc đa bào', 'Sản xuất O₂ cho Trái Đất'] },
  { id: 'paramecium', name: 'Trùng giày', kingdom: 'Nguyên sinh', shape: 'elongated', color: '#06b6d4',
    facts: ['Đơn bào, hình giày', 'Di chuyển bằng lông (tiêm mao)', 'Có không bào co bóp', '2 nhân: nhân lớn, nhân nhỏ'] },
];

const QUIZ = [
  { q: 'Vi khuẩn thuộc giới nào?', opts: ['Nguyên sinh', 'Khởi sinh', 'Nấm'], correct: 1 },
  { q: 'Virus có phải tế bào không?', opts: ['Có', 'Không', 'Tùy loại'], correct: 1 },
  { q: 'Nấm men sinh sản bằng cách nào?', opts: ['Phân đôi', 'Nảy chồi', 'Bào tử'], correct: 1 },
  { q: 'Sinh vật nào di chuyển bằng chân giả?', opts: ['Trùng giày', 'Amip', 'Vi khuẩn'], correct: 1 },
  { q: 'Tảo lục có khả năng gì đặc biệt?', opts: ['Lên men', 'Quang hợp', 'Ký sinh'], correct: 1 },
  { q: 'Trùng giày di chuyển bằng gì?', opts: ['Chân giả', 'Roi', 'Tiêm mao (lông)'], correct: 2 },
  { q: 'Thành tế bào nấm men chứa gì?', opts: ['Cellulose', 'Chitin', 'Peptidoglycan'], correct: 1 },
];

// 3D Components
function Bacterium({ position, isActive }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 2) * 0.3; });
  return (
    <Float speed={2} floatIntensity={0.3}>
      <group ref={ref} position={position}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
          <meshStandardMaterial color={isActive ? '#4ade80' : '#22c55e'} emissive={isActive ? '#22c55e' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} />
        </mesh>
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[0.3 * Math.cos(i * 2.1), 0.3 * Math.sin(i * 2.1), 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#86efac" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function VirusModel({ position, isActive }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y += 0.02; });
  return (
    <Float speed={1.5} floatIntensity={0.4}>
      <group ref={ref} position={position}>
        <mesh>
          <icosahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={isActive ? '#f87171' : '#ef4444'} emissive={isActive ? '#ef4444' : '#000'} emissiveIntensity={isActive ? 0.5 : 0} metalness={0.3} />
        </mesh>
        {[...Array(12)].map((_, i) => {
          const phi = Math.acos(-1 + (2 * i) / 12);
          const theta = Math.sqrt(12 * Math.PI) * phi;
          return (
            <mesh key={i} position={[0.32 * Math.cos(theta) * Math.sin(phi), 0.32 * Math.sin(theta) * Math.sin(phi), 0.32 * Math.cos(phi)]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color="#fca5a5" />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

function AmoebaModel({ position, isActive }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.elapsedTime;
      ref.current.scale.set(1 + Math.sin(t) * 0.1, 1 + Math.cos(t * 0.7) * 0.1, 1);
    }
  });
  return (
    <Float speed={1} floatIntensity={0.2}>
      <group ref={ref} position={position}>
        <mesh>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color={isActive ? '#a78bfa' : '#8b5cf6'} transparent opacity={0.7} emissive={isActive ? '#8b5cf6' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} />
        </mesh>
        <mesh position={[0.05, 0.05, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#4c1d95" />
        </mesh>
      </group>
    </Float>
  );
}

function GenericMicrobe({ position, isActive, color, shape }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y += 0.01; });
  return (
    <Float speed={2} floatIntensity={0.3}>
      <group ref={ref} position={position}>
        <mesh>
          {shape === 'oval' ? <sphereGeometry args={[0.25, 24, 16]} /> : <sphereGeometry args={[0.3, 32, 32]} />}
          <meshStandardMaterial color={color} transparent opacity={0.8} emissive={isActive ? color : '#000'} emissiveIntensity={isActive ? 0.4 : 0} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#1e1b4b" />
        </mesh>
      </group>
    </Float>
  );
}

function MicroScene({ selected, organisms }) {
  const positions = [[-2, 1, 0], [-0.5, 1.5, 0.5], [1.5, 1, -0.3], [-1.5, -1, 0.3], [0.5, -1.2, 0], [2, -0.5, 0.5]];
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 3]} intensity={0.4} color="#60a5fa" />
      {organisms.map((org, i) => {
        const pos = positions[i] || [0, 0, 0];
        const isActive = selected === org.id;
        if (org.id === 'bacteria') return <Bacterium key={org.id} position={pos} isActive={isActive} />;
        if (org.id === 'virus') return <VirusModel key={org.id} position={pos} isActive={isActive} />;
        if (org.id === 'amoeba') return <AmoebaModel key={org.id} position={pos} isActive={isActive} />;
        return <GenericMicrobe key={org.id} position={pos} isActive={isActive} color={org.color} shape={org.shape} />;
      })}
      <OrbitControls enablePan minDistance={3} maxDistance={10} />
    </>
  );
}

export default function MicroorganismGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro'); // intro, explore, quiz, complete
  const [selected, setSelected] = useState(null);
  const [explored, setExplored] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = MICROORGANISMS.find(m => m.id === selected);

  const handleExplore = (id) => {
    setSelected(id);
    if (!explored.includes(id)) setExplored(prev => [...prev, id]);
  };

  const handleQuizAnswer = (idx) => {
    const q = QUIZ[quizIdx];
    if (idx === q.correct) {
      setScore(s => s + 100);
      setFeedback({ type: 'success', msg: 'Đúng rồi! 🎉' });
    } else {
      setFeedback({ type: 'error', msg: 'Sai rồi! 😅' });
    }
    setTimeout(() => {
      setFeedback(null);
      if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1);
      else setPhase('complete');
    }, 1200);
  };

  if (phase === 'intro') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">🔬</div>
          <h2 className="text-2xl font-bold text-white mb-3">Thế giới Vi sinh vật</h2>
          <p className="text-gray-300 text-sm mb-4">Khám phá các dạng vi sinh vật dưới kính hiển vi 3D! Tìm hiểu đặc điểm rồi trả lời câu hỏi.</p>
          <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl">
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🎉</h2>
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-3xl font-bold text-green-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm số</p>
          </div>
          <button onClick={() => onComplete(score)} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">Hoàn thành</button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = QUIZ[quizIdx];
    return (
      <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-30">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
          <p className="text-gray-400 text-xs mb-2">Câu {quizIdx + 1}/{QUIZ.length}</p>
          <p className="text-white text-lg font-bold mb-4">{q.q}</p>
          <div className="space-y-2">
            {q.opts.map((opt, i) => (
              <button key={i} onClick={() => handleQuizAnswer(i)} className="w-full p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-xl text-left transition">
                <span className="mr-2 font-bold">{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            ))}
          </div>
          {feedback && <div className={`mt-3 text-center py-2 rounded-lg font-semibold ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{feedback.msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <color attach="background" args={['#0a0a1e']} />
        <MicroScene selected={selected} organisms={MICROORGANISMS} />
      </Canvas>

      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">
          Đã khám phá: {explored.length}/{MICROORGANISMS.length}
        </div>
        {explored.length >= 4 && (
          <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">
            Làm bài Quiz →
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {MICROORGANISMS.map(org => (
            <button key={org.id} onClick={() => handleExplore(org.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${selected === org.id ? 'text-white border border-white/30' : explored.includes(org.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={selected === org.id ? { backgroundColor: org.color + '30' } : {}}>
              {org.name}
            </button>
          ))}
        </div>
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white">{current.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: current.color + '30', color: current.color }}>{current.kingdom}</span>
            </div>
            <ul className="text-gray-400 text-xs space-y-0.5">
              {current.facts.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
