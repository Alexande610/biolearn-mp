// PlantStructureGame3D.jsx - Cấu tạo Thực vật 3D (Lớp 7)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Play } from 'lucide-react';

const PLANT_PARTS = [
  { id: 'root', name: 'Rễ', color: '#92400e', description: 'Hấp thụ nước và muối khoáng từ đất',
    knowledge: ['Rễ chính và rễ phụ', 'Lông hút hấp thụ nước', 'Vận chuyển qua mạch gỗ', 'Cố định cây trong đất'] },
  { id: 'stem', name: 'Thân', color: '#16a34a', description: 'Vận chuyển nước và chất dinh dưỡng',
    knowledge: ['Mạch gỗ: nước đi lên', 'Mạch rây: chất hữu cơ đi xuống', 'Thân gỗ có tầng sinh vỏ', 'Nâng đỡ lá và hoa'] },
  { id: 'leaf', name: 'Lá', color: '#22c55e', description: 'Quang hợp tạo chất hữu cơ',
    knowledge: ['Biểu bì có khí khổng', 'Mô giậu chứa nhiều lục lạp', 'Thoát hơi nước qua khí khổng', 'CO₂ + H₂O → C₆H₁₂O₆ + O₂'] },
  { id: 'flower', name: 'Hoa', color: '#ec4899', description: 'Cơ quan sinh sản hữu tính',
    knowledge: ['Nhị: cơ quan sinh sản đực', 'Nhụy: cơ quan sinh sản cái', 'Thụ phấn nhờ gió/côn trùng', 'Hoa → Quả → Hạt'] },
  { id: 'fruit', name: 'Quả', color: '#f97316', description: 'Bảo vệ và phát tán hạt',
    knowledge: ['Quả phát triển từ bầu nhụy', 'Vỏ quả: bảo vệ hạt', 'Phát tán: gió, nước, ĐV', 'Quả mọng vs quả khô'] },
];

const QUIZ = [
  { q: 'Bộ phận nào hấp thụ nước và muối khoáng?', opts: ['Lá', 'Rễ', 'Thân'], correct: 1 },
  { q: 'Mạch gỗ vận chuyển gì?', opts: ['Chất hữu cơ', 'Nước và muối khoáng', 'CO₂'], correct: 1 },
  { q: 'Quang hợp diễn ra chủ yếu ở đâu?', opts: ['Rễ', 'Thân', 'Lá'], correct: 2 },
  { q: 'Nhị hoa là cơ quan sinh sản gì?', opts: ['Cái', 'Đực', 'Cả hai'], correct: 1 },
  { q: 'Khí khổng có chức năng gì?', opts: ['Hấp thụ muối', 'Thoát hơi nước + trao đổi khí', 'Quang hợp'], correct: 1 },
  { q: 'Quả phát triển từ phần nào của hoa?', opts: ['Đài hoa', 'Bầu nhụy', 'Cánh hoa'], correct: 1 },
];

// 3D Components
function Root3D({ isActive }) {
  return (
    <group position={[0, -2.5, 0]}>
      <mesh><cylinderGeometry args={[0.08, 0.15, 1.5, 8]} /><meshStandardMaterial color={isActive ? '#b45309' : '#92400e'} emissive={isActive ? '#92400e' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} /></mesh>
      {[-0.4, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.5 - i * 0.2, (i - 1) * 0.15]} rotation={[0, 0, (i - 1) * 0.4]}>
          <cylinderGeometry args={[0.03, 0.05, 0.8, 6]} /><meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
    </group>
  );
}

function Stem3D({ isActive }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh><cylinderGeometry args={[0.1, 0.12, 3.5, 12]} /><meshStandardMaterial color={isActive ? '#22c55e' : '#16a34a'} emissive={isActive ? '#16a34a' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} /></mesh>
    </group>
  );
}

function Leaf3D({ position, rotation, isActive }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[1, 0.15, 0.6]}>
        <sphereGeometry args={[0.5, 16, 12]} /><meshStandardMaterial color={isActive ? '#4ade80' : '#22c55e'} emissive={isActive ? '#22c55e' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.015, 0.015, 0.5, 6]} /><meshStandardMaterial color="#15803d" /></mesh>
    </group>
  );
}

function Flower3D({ isActive }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y += 0.01; });
  return (
    <group ref={ref} position={[0, 2.3, 0]}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI * 2 / 5) * 0.25, 0, Math.sin(i * Math.PI * 2 / 5) * 0.25]} rotation={[0.3, i * Math.PI * 2 / 5, 0]}>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshStandardMaterial color={isActive ? '#f472b6' : '#ec4899'} emissive={isActive ? '#ec4899' : '#000'} emissiveIntensity={isActive ? 0.5 : 0} />
        </mesh>
      ))}
      <mesh><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#fbbf24" /></mesh>
    </group>
  );
}

function Fruit3D({ isActive }) {
  return (
    <Float speed={1.5} floatIntensity={0.1}>
      <group position={[0.5, 1.8, 0.3]}>
        <mesh><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color={isActive ? '#fb923c' : '#f97316'} emissive={isActive ? '#f97316' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.02, 0.12, 6]} /><meshStandardMaterial color="#78350f" /></mesh>
      </group>
    </Float>
  );
}

function PlantScene({ selected }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <pointLight position={[-3, 3, 3]} intensity={0.3} color="#22c55e" />
      <Root3D isActive={selected === 'root'} />
      <Stem3D isActive={selected === 'stem'} />
      <Leaf3D position={[0.6, 0.8, 0]} rotation={[0, 0, -0.5]} isActive={selected === 'leaf'} />
      <Leaf3D position={[-0.5, 1.3, 0.2]} rotation={[0, 0.5, 0.4]} isActive={selected === 'leaf'} />
      <Leaf3D position={[0.4, 1.8, -0.3]} rotation={[0, -0.3, -0.3]} isActive={selected === 'leaf'} />
      <Flower3D isActive={selected === 'flower'} />
      <Fruit3D isActive={selected === 'fruit'} />
      <mesh position={[0, -3.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} /><meshStandardMaterial color="#3f2305" />
      </mesh>
      <OrbitControls enablePan minDistance={3} maxDistance={10} target={[0, 0, 0]} />
    </>
  );
}

export default function PlantStructureGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selected, setSelected] = useState(null);
  const [explored, setExplored] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = PLANT_PARTS.find(p => p.id === selected);

  const handleExplore = (id) => { setSelected(id); if (!explored.includes(id)) setExplored(p => [...p, id]); };

  const handleQuizAnswer = (idx) => {
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Đúng! 🌿' }); }
    else setFeedback({ type: 'error', msg: 'Sai rồi! 🥲' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🌱</div>
        <h2 className="text-2xl font-bold text-white mb-3">Cấu tạo Thực vật 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Tìm hiểu 5 bộ phận chính của cây: Rễ, Thân, Lá, Hoa, Quả. Khám phá rồi làm bài kiểm tra!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-green-500 to-lime-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
      </div>
    </div>
  );

  if (phase === 'complete') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🌿</h2>
        <div className="bg-white/5 rounded-xl p-3 mb-4"><p className="text-3xl font-bold text-green-400">{score}</p><p className="text-xs text-gray-400">Điểm số</p></div>
        <button onClick={() => onComplete(score)} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">Hoàn thành</button>
      </div>
    </div>
  );

  if (phase === 'quiz') {
    const q = QUIZ[quizIdx];
    return (
      <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-30">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
          <p className="text-gray-400 text-xs mb-2">Câu {quizIdx + 1}/{QUIZ.length}</p>
          <p className="text-white text-lg font-bold mb-4">{q.q}</p>
          <div className="space-y-2">{q.opts.map((opt, i) => (
            <button key={i} onClick={() => handleQuizAnswer(i)} className="w-full p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-xl text-left transition">
              <span className="mr-2 font-bold">{String.fromCharCode(65+i)}.</span>{opt}
            </button>
          ))}</div>
          {feedback && <div className={`mt-3 text-center py-2 rounded-lg font-semibold ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{feedback.msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas camera={{ position: [3, 1, 5], fov: 50 }}>
        <color attach="background" args={['#0a1a0a']} />
        <fog attach="fog" args={['#0a1a0a', 8, 18]} />
        <PlantScene selected={selected} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">Đã khám phá: {explored.length}/{PLANT_PARTS.length}</div>
        {explored.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-green-500 to-lime-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {PLANT_PARTS.map(p => (
            <button key={p.id} onClick={() => handleExplore(p.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${selected === p.id ? 'text-white border border-white/30' : explored.includes(p.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={selected === p.id ? { backgroundColor: p.color + '30' } : {}}>{p.name}</button>
          ))}
        </div>
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 mt-2">
            <p className="font-bold text-white mb-1" style={{ color: current.color }}>{current.name}: {current.description}</p>
            <ul className="text-gray-400 text-xs space-y-0.5">{current.knowledge.map((k, i) => <li key={i}>• {k}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
