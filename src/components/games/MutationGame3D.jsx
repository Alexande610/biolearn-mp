// MutationGame3D.jsx - Đột biến Gen & Nhiễm sắc thể 3D (Lớp 12)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, ArrowRight } from 'lucide-react';

const MUTATION_TYPES = [
  { id: 'point_sub', name: 'Thay thế nucleotide', type: 'Đột biến gen', position: [-2, 2, 0], color: '#ef4444',
    facts: ['Thay 1 cặp nucleotide bằng cặp khác', 'VD: A-T → G-C', 'Có thể: đồng nghĩa, sai nghĩa, vô nghĩa', 'Bệnh hồng cầu hình liềm (HbS)'] },
  { id: 'point_insert', name: 'Thêm nucleotide', type: 'Đột biến gen', position: [0, 2, 0], color: '#f97316',
    facts: ['Thêm 1+ cặp nucleotide vào gen', 'Dịch khung đọc (frameshift)', 'Thay đổi toàn bộ axit amin phía sau', 'Thường gây hậu quả nghiêm trọng'] },
  { id: 'point_delete', name: 'Mất nucleotide', type: 'Đột biến gen', position: [2, 2, 0], color: '#eab308',
    facts: ['Mất 1+ cặp nucleotide khỏi gen', 'Dịch khung đọc (frameshift)', 'Protein bị thay đổi cấu trúc', 'VD: bệnh xơ nang (CF) mất 3 nucleotide'] },
  { id: 'chromo_number', name: 'Đột biến số lượng NST', type: 'Đột biến NST', position: [-2, -1, 0], color: '#22c55e',
    facts: ['Đa bội: 3n, 4n... (phổ biến ở thực vật)', 'Lệch bội: 2n+1, 2n-1', 'VD: Hội chứng Down (3 NST 21 = trisomy 21)', 'Nguyên nhân: NST không phân li'] },
  { id: 'chromo_struct', name: 'Đột biến cấu trúc NST', type: 'Đột biến NST', position: [2, -1, 0], color: '#3b82f6',
    facts: ['4 dạng: mất đoạn, lặp đoạn, đảo đoạn, chuyển đoạn', 'Mất đoạn: mất vật chất di truyền', 'Lặp đoạn: tăng số gen → tăng sản phẩm', 'Chuyển đoạn: giữa 2 NST không tương đồng'] },
  { id: 'mutagen', name: 'Tác nhân gây đột biến', type: 'Nguyên nhân', position: [0, -1, 0], color: '#a855f7',
    facts: ['Vật lý: tia UV, tia X, phóng xạ', 'Hóa học: 5-BU, EMS, colchicine', 'Sinh học: virus chèn vào DNA', 'Colchicine → ức chế thoi vô sắc → đa bội'] },
];

const QUIZ = [
  { q: 'Đột biến thay thế nucleotide thuộc loại?', opts: ['Đột biến NST', 'Đột biến gen', 'Đột biến số lượng'], correct: 1 },
  { q: 'Hội chứng Down là do?', opts: ['Thừa 1 NST 21', 'Mất đoạn NST', 'Đột biến gen'], correct: 0 },
  { q: 'Đột biến dịch khung xảy ra khi?', opts: ['Thay thế nucleotide', 'Thêm/mất nucleotide', 'Đảo đoạn NST'], correct: 1 },
  { q: 'Colchicine gây ra đột biến gì?', opts: ['Đột biến gen', 'Đa bội thể', 'Mất đoạn NST'], correct: 1 },
  { q: 'Đột biến cấu trúc NST có mấy dạng?', opts: ['2', '3', '4'], correct: 2 },
  { q: 'Tia UV gây đột biến theo cơ chế?', opts: ['Hóa học', 'Vật lý', 'Sinh học'], correct: 1 },
  { q: 'Đột biến đồng nghĩa là?', opts: ['Thay nucleotide nhưng không đổi axit amin', 'Mất toàn bộ gen', 'Thêm NST'], correct: 0 },
];

function DNAStrand({ yOffset = 0, mutated = false, isActive }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * (isActive ? 0.4 : 0.1); });
  const count = 15;
  const color1 = mutated ? '#ef4444' : '#60a5fa';
  const color2 = mutated ? '#f97316' : '#34d399';
  return (
    <group ref={ref} position={[0, yOffset, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const t = (i / count) * Math.PI * 3;
        const y = (i / count) * 4 - 2;
        return (
          <group key={i}>
            <mesh position={[Math.sin(t) * 0.5, y, Math.cos(t) * 0.5]}>
              <sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={color1} emissive={isActive ? color1 : '#000'} emissiveIntensity={isActive ? 0.3 : 0} />
            </mesh>
            <mesh position={[-Math.sin(t) * 0.5, y, -Math.cos(t) * 0.5]}>
              <sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={color2} emissive={isActive ? color2 : '#000'} emissiveIntensity={isActive ? 0.3 : 0} />
            </mesh>
            {/* Base pair bridge */}
            {i % 2 === 0 && <mesh position={[0, y, 0]} rotation={[0, t, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 1, 4]} /><meshStandardMaterial color={mutated && i === 7 ? '#ff0000' : '#475569'} transparent opacity={0.5} />
            </mesh>}
          </group>
        );
      })}
    </group>
  );
}

function MutationNode({ mut, isActive, isVisited }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    if (isActive) ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.06);
    else ref.current.scale.setScalar(1);
  });
  const emissive = isActive ? mut.color : isVisited ? '#111' : '#000';
  const emI = isActive ? 0.5 : isVisited ? 0.1 : 0;
  return (
    <Float speed={1.5} floatIntensity={0.15}>
      <group ref={ref} position={mut.position}>
        <mesh><octahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color={mut.color} emissive={emissive} emissiveIntensity={emI} transparent opacity={isActive ? 1 : 0.6} /></mesh>
        {isActive && <mesh><sphereGeometry args={[0.5, 16, 16]} /><meshBasicMaterial color={mut.color} transparent opacity={0.08} /></mesh>}
      </group>
    </Float>
  );
}

function MutationScene({ types, selectedIdx, visited }) {
  const current = types[selectedIdx];
  const isMutated = current?.type === 'Đột biến gen';
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 5]} intensity={0.6} />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#a855f7" />
      <DNAStrand yOffset={0} mutated={isMutated} isActive={selectedIdx >= 0} />
      {types.map((m, i) => <MutationNode key={m.id} mut={m} isActive={i === selectedIdx} isVisited={visited.includes(m.id)} />)}
      <OrbitControls enablePan minDistance={4} maxDistance={14} />
    </>
  );
}

export default function MutationGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visited, setVisited] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = MUTATION_TYPES[selectedIdx];
  const handleSelect = (i) => {
    setSelectedIdx(i);
    if (!visited.includes(MUTATION_TYPES[i].id)) { setVisited(p => [...p, MUTATION_TYPES[i].id]); setScore(s => s + 50); }
  };

  const handleQuiz = (idx) => {
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Chính xác! 🧬' }); }
    else setFeedback({ type: 'error', msg: 'Sai mất rồi 😅' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🧬</div>
        <h2 className="text-2xl font-bold text-white mb-3">Đột biến Gen & NST 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Tìm hiểu các loại đột biến gen, đột biến NST và tác nhân gây đột biến!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
      </div>
    </div>
  );

  if (phase === 'complete') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🧬</h2>
        <div className="bg-white/5 rounded-xl p-3 mb-4"><p className="text-3xl font-bold text-red-400">{score}</p><p className="text-xs text-gray-400">Điểm số</p></div>
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
        <MutationScene types={MUTATION_TYPES} selectedIdx={selectedIdx} visited={visited} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">🏆 {score}</div>
        {visited.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-red-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {MUTATION_TYPES.map((m, i) => (
            <button key={m.id} onClick={() => handleSelect(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${i === selectedIdx ? 'text-white border border-white/30' : visited.includes(m.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={i === selectedIdx ? { backgroundColor: m.color + '30' } : {}}>{m.name}</button>
          ))}
        </div>
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-sm">{current.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: current.color + '20', color: current.color }}>{current.type}</span>
            </div>
            <ul className="text-gray-400 text-xs space-y-0.5">{current.facts.map((f, i) => <li key={i}>• {f}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
