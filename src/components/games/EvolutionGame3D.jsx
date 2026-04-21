// EvolutionGame3D.jsx - Tiến hóa & Chọn lọc tự nhiên 3D (Lớp 12)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, ArrowRight } from 'lucide-react';

const CONCEPTS = [
  { id: 'darwin', name: 'Học thuyết Darwin', position: [-2.5, 2, 0], color: '#f59e0b',
    facts: ['Chọn lọc tự nhiên (CLTN) = động lực tiến hóa', 'Biến dị cá thể → cạnh tranh → sống sót', 'Loài thích nghi tốt nhất = sống sót', 'Tác phẩm: "Nguồn gốc các loài" (1859)'] },
  { id: 'modern', name: 'Thuyết tiến hóa hiện đại', position: [2.5, 2, 0], color: '#a855f7',
    facts: ['Kết hợp Darwin + Di truyền học', 'Đơn vị tiến hóa = quần thể', 'Nhân tố tiến hóa: đột biến, CLTN, di nhập gen, giao phối không ngẫu nhiên, biến động di truyền', 'Nguồn biến dị: đột biến + biến dị tổ hợp'] },
  { id: 'natural_selection', name: 'Chọn lọc tự nhiên', position: [0, 0, 0], color: '#ef4444',
    facts: ['3 hình thức: ổn định, vận động, phân ly', 'CLTN ổn định: giữ dạng trung bình', 'CLTN vận động: chuyển dạng thích nghi', 'CLTN phân ly: tạo 2+ dạng mới'] },
  { id: 'speciation', name: 'Hình thành loài', position: [-2, -1.5, 0], color: '#22c55e',
    facts: ['Cách ly địa lí → loài mới (phổ biến nhất)', 'Cách ly sinh sản = tiêu chuẩn loài', 'Hình thành loài cùng khu vực (đa bội)', 'VD: chim sẻ Darwin ở Galápagos'] },
  { id: 'evidence', name: 'Bằng chứng tiến hóa', position: [2, -1.5, 0], color: '#06b6d4',
    facts: ['Cơ quan tương đồng (cùng nguồn gốc)', 'Cơ quan thoái hóa (ruột thừa, xương cụt)', 'Hóa thạch: ghi chép lịch sử sự sống', 'Sinh học phân tử: so sánh DNA, protein'] },
];

const QUIZ = [
  { q: 'Đơn vị tiến hóa theo thuyết hiện đại?', opts: ['Cá thể', 'Quần thể', 'Loài'], correct: 1 },
  { q: 'CLTN ổn định có tác dụng gì?', opts: ['Tạo dạng mới', 'Giữ dạng trung bình', 'Loại dạng trung bình'], correct: 1 },
  { q: 'Hình thành loài bằng cách ly gì phổ biến nhất?', opts: ['Cách ly sinh thái', 'Cách ly địa lí', 'Đa bội hóa'], correct: 1 },
  { q: 'Cơ quan thoái hóa ở người?', opts: ['Tim', 'Ruột thừa', 'Phổi'], correct: 1 },
  { q: 'Darwin xuất bản "Nguồn gốc các loài" năm nào?', opts: ['1859', '1900', '1953'], correct: 0 },
  { q: 'Nhân tố nào KHÔNG phải nhân tố tiến hóa?', opts: ['Đột biến', 'CLTN', 'Sinh sản vô tính'], correct: 2 },
  { q: 'Bằng chứng nào trực tiếp nhất?', opts: ['Cơ quan tương đồng', 'Hóa thạch', 'Phôi sinh học'], correct: 1 },
];

function ConceptNode({ concept, isActive, isVisited }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.rotation.y = t * (isActive ? 0.3 : 0.05);
    if (isActive) ref.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.06);
    else ref.current.scale.setScalar(1);
  });
  const emissive = isActive ? concept.color : isVisited ? '#111' : '#000';
  const emI = isActive ? 0.5 : isVisited ? 0.1 : 0;

  return (
    <Float speed={1.5} floatIntensity={0.15}>
      <group ref={ref} position={concept.position}>
        <mesh><dodecahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color={concept.color} emissive={emissive} emissiveIntensity={emI} wireframe={!isActive} transparent opacity={isActive ? 1 : 0.6} /></mesh>
        {isActive && <mesh><sphereGeometry args={[0.6, 16, 16]} /><meshBasicMaterial color={concept.color} transparent opacity={0.08} /></mesh>}
        {/* Inner core */}
        <mesh><icosahedronGeometry args={[0.2, 0]} /><meshStandardMaterial color="#fff" emissive={concept.color} emissiveIntensity={emI * 0.4} transparent opacity={0.3} /></mesh>
      </group>
    </Float>
  );
}

function EvolutionScene({ concepts, selectedIdx, visited }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 5]} intensity={0.6} />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#f59e0b" />
      {concepts.map((c, i) => <ConceptNode key={c.id} concept={c} isActive={i === selectedIdx} isVisited={visited.includes(c.id)} />)}
      {/* Connection lines between concepts */}
      {concepts.slice(0, -1).map((c, i) => {
        const next = concepts[i + 1];
        const mid = [(c.position[0]+next.position[0])/2, (c.position[1]+next.position[1])/2, 0];
        const len = Math.hypot(next.position[0]-c.position[0], next.position[1]-c.position[1], next.position[2]-c.position[2]);
        const angle = Math.atan2(next.position[1]-c.position[1], next.position[0]-c.position[0]);
        return <mesh key={i} position={mid} rotation={[0, 0, angle + Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, len * 0.7, 4]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.4} />
        </mesh>;
      })}
      {/* DNA helix decoration */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = i / 20 * Math.PI * 4;
        return <mesh key={i} position={[Math.sin(t) * 0.3 + 4.5, (i / 20) * 5 - 2.5, Math.cos(t) * 0.3]}>
          <sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#6366f1" transparent opacity={0.3} />
        </mesh>;
      })}
      <OrbitControls enablePan minDistance={4} maxDistance={14} />
    </>
  );
}

export default function EvolutionGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visited, setVisited] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = CONCEPTS[selectedIdx];
  const handleSelect = (i) => {
    setSelectedIdx(i);
    if (!visited.includes(CONCEPTS[i].id)) { setVisited(p => [...p, CONCEPTS[i].id]); setScore(s => s + 50); }
  };

  const handleQuiz = (idx) => {
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Chính xác! 🧬' }); }
    else setFeedback({ type: 'error', msg: 'Sai mất rồi 😅' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-yellow-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🦕</div>
        <h2 className="text-2xl font-bold text-white mb-3">Tiến hóa & Chọn lọc TN 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Khám phá học thuyết Darwin, bằng chứng tiến hóa và hình thành loài!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
      </div>
    </div>
  );

  if (phase === 'complete') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🦕</h2>
        <div className="bg-white/5 rounded-xl p-3 mb-4"><p className="text-3xl font-bold text-yellow-400">{score}</p><p className="text-xs text-gray-400">Điểm số</p></div>
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
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <EvolutionScene concepts={CONCEPTS} selectedIdx={selectedIdx} visited={visited} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">🏆 {score}</div>
        {visited.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {CONCEPTS.map((c, i) => (
            <button key={c.id} onClick={() => handleSelect(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${i === selectedIdx ? 'text-white border border-white/30' : visited.includes(c.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={i === selectedIdx ? { backgroundColor: c.color + '30' } : {}}>{c.name}</button>
          ))}
        </div>
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 mt-2">
            <span className="font-bold text-white text-sm">{current.name}</span>
            <ul className="text-gray-400 text-xs space-y-0.5 mt-1">{current.facts.map((f, i) => <li key={i}>• {f}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
