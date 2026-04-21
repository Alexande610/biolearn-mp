// EnzymeGame3D.jsx - Enzyme và Chuyển hóa 3D (Lớp 10)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, ArrowRight } from 'lucide-react';

const ENZYMES = [
  { id: 'amylase', name: 'Amylase', substrate: 'Tinh bột', product: 'Maltose', location: 'Tuyến nước bọt, tụy', color: '#f59e0b',
    facts: ['Phân giải tinh bột → maltose', 'Hoạt động ở pH 6.7-7', 'Có trong nước bọt & dịch tụy', 'Bị bất hoạt ở pH thấp (dạ dày)'] },
  { id: 'pepsin', name: 'Pepsin', substrate: 'Protein', product: 'Peptide', location: 'Dạ dày', color: '#ef4444',
    facts: ['Phân cắt liên kết peptide', 'pH tối ưu: 1.5-2 (acid)', 'Tiết ra dạng tiền enzyme (pepsinogen)', 'HCl hoạt hóa pepsinogen → pepsin'] },
  { id: 'lipase', name: 'Lipase', substrate: 'Lipid', product: 'Glycerol + Acid béo', location: 'Tụy, ruột non', color: '#22c55e',
    facts: ['Phân giải liên kết ester trong lipid', 'Cần muối mật nhũ tương hóa trước', 'pH tối ưu: 7-8', 'Sản phẩm: glycerol + acid béo'] },
  { id: 'catalase', name: 'Catalase', substrate: 'H₂O₂', product: 'H₂O + O₂', location: 'Peroxisome', color: '#60a5fa',
    facts: ['Phân giải H₂O₂ độc → H₂O + O₂', 'Enzyme nhanh nhất (40M phản ứng/s)', 'Có trong peroxisome', 'Bảo vệ tế bào khỏi stress oxy hóa'] },
  { id: 'atp_synthase', name: 'ATP Synthase', substrate: 'ADP + Pi', product: 'ATP', location: 'Ty thể', color: '#a855f7',
    facts: ['Tổng hợp ATP từ ADP + Pi', 'Nằm ở màng trong ty thể', 'Hoạt động nhờ gradient H⁺', 'Quay như turbine phân tử'] },
];

const QUIZ = [
  { q: 'Amylase phân giải chất gì?', opts: ['Protein', 'Lipid', 'Tinh bột'], correct: 2 },
  { q: 'pH tối ưu của pepsin?', opts: ['1.5-2', '7', '9-10'], correct: 0 },
  { q: 'Lipase cần gì để hoạt động tốt?', opts: ['HCl', 'Muối mật', 'Kiềm mạnh'], correct: 1 },
  { q: 'Catalase phân giải chất gì?', opts: ['Glucose', 'H₂O₂', 'Protein'], correct: 1 },
  { q: 'ATP synthase nằm ở đâu?', opts: ['Ribosome', 'Nhân', 'Ty thể'], correct: 2 },
  { q: 'Enzyme có tính chất gì đặc biệt?', opts: ['Tính đặc hiệu cơ chất', 'Không bị ảnh hưởng bởi pH', 'Luôn hoạt động ở 100°C'], correct: 0 },
  { q: 'Pepsinogen cần gì để hoạt hóa?', opts: ['Muối mật', 'HCl', 'Nước'], correct: 1 },
];

function EnzymeLock({ enzyme, isActive, isVisited }) {
  const ref = useRef();
  const subRef = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.rotation.y = t * (isActive ? 0.5 : 0.1);
    if (isActive && subRef.current) {
      subRef.current.position.x = Math.sin(t * 2) * 0.5 + 0.5;
      subRef.current.position.y = Math.cos(t * 2) * 0.2;
    }
  });
  const emissive = isActive ? enzyme.color : isVisited ? '#111' : '#000';
  const emI = isActive ? 0.5 : isVisited ? 0.1 : 0;
  return (
    <Float speed={1.5} floatIntensity={0.15}>
      <group ref={ref}>
        {/* Enzyme (lock) */}
        <mesh><torusGeometry args={[0.35, 0.12, 16, 32]} /><meshStandardMaterial color={enzyme.color} emissive={emissive} emissiveIntensity={emI} roughness={0.4} /></mesh>
        {/* Active site notch */}
        <mesh position={[0.35, 0, 0]}><boxGeometry args={[0.15, 0.1, 0.1]} /><meshStandardMaterial color="#1e293b" /></mesh>
        {/* Substrate (key) */}
        <group ref={subRef}>
          <mesh position={[0.8, 0, 0]}><boxGeometry args={[0.12, 0.08, 0.08]} /><meshStandardMaterial color="#fbbf24" emissive={isActive ? '#fbbf24' : '#000'} emissiveIntensity={isActive ? 0.4 : 0} /></mesh>
        </group>
        {/* Glow */}
        {isActive && <mesh><sphereGeometry args={[0.6, 16, 16]} /><meshBasicMaterial color={enzyme.color} transparent opacity={0.08} /></mesh>}
      </group>
    </Float>
  );
}

function EnzymeScene({ enzymes, selectedIdx, visited }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#fbbf24" />
      {enzymes.map((e, i) => {
        const angle = (i / enzymes.length) * Math.PI * 2;
        const r = 2;
        return (
          <group key={e.id} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}>
            <EnzymeLock enzyme={e} isActive={i === selectedIdx} isVisited={visited.includes(e.id)} />
          </group>
        );
      })}
      <OrbitControls enablePan minDistance={4} maxDistance={12} />
    </>
  );
}

export default function EnzymeGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visited, setVisited] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = ENZYMES[selectedIdx];
  const handleSelect = (i) => {
    setSelectedIdx(i);
    if (!visited.includes(ENZYMES[i].id)) { setVisited(p => [...p, ENZYMES[i].id]); setScore(s => s + 50); }
  };

  const handleQuiz = (idx) => {
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Đúng rồi! 🧪' }); }
    else setFeedback({ type: 'error', msg: 'Sai mất rồi 😅' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🧪</div>
        <h2 className="text-2xl font-bold text-white mb-3">Enzyme & Chuyển hóa 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Khám phá các enzyme quan trọng, mô hình ổ khóa - chìa khóa trong sinh học!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
      </div>
    </div>
  );

  if (phase === 'complete') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🧪</h2>
        <div className="bg-white/5 rounded-xl p-3 mb-4"><p className="text-3xl font-bold text-amber-400">{score}</p><p className="text-xs text-gray-400">Điểm số</p></div>
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
            <button key={i} onClick={() => handleQuiz(i)} className="w-full p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-xl text-left transition">
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
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <EnzymeScene enzymes={ENZYMES} selectedIdx={selectedIdx} visited={visited} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">🏆 {score}</div>
        {visited.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {ENZYMES.map((e, i) => (
            <button key={e.id} onClick={() => handleSelect(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${i === selectedIdx ? 'text-white border border-white/30' : visited.includes(e.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={i === selectedIdx ? { backgroundColor: e.color + '30' } : {}}>{e.name}</button>
          ))}
        </div>
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-sm">{current.name}</span>
              <span className="text-xs text-gray-400">📍 {current.location}</span>
            </div>
            <div className="text-xs text-amber-400 mb-1">{current.substrate} → {current.product}</div>
            <ul className="text-gray-400 text-xs space-y-0.5">{current.facts.map((f, i) => <li key={i}>• {f}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
