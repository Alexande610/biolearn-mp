// NervousSystemGame3D.jsx - Hệ Thần kinh 3D (Lớp 8)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, ArrowRight } from 'lucide-react';

const PARTS = [
  { id: 'brain', name: 'Đại não', position: [0, 2.5, 0], color: '#f472b6', scale: 1,
    facts: ['Trung tâm thần kinh cao nhất', '2 bán cầu: trái (logic) & phải (sáng tạo)', 'Chứa ~86 tỷ neuron', 'Điều khiển: tư duy, ngôn ngữ, trí nhớ'] },
  { id: 'cerebellum', name: 'Tiểu não', position: [0, 1.3, -0.3], color: '#c084fc', scale: 0.6,
    facts: ['Nằm phía sau, dưới đại não', 'Điều hòa thăng bằng cơ thể', 'Phối hợp các cử động cơ', 'Duy trì tư thế đứng'] },
  { id: 'brainstem', name: 'Thân não', position: [0, 0.5, 0], color: '#818cf8', scale: 0.5,
    facts: ['Nối não với tủy sống', 'Trung khu hô hấp & tuần hoàn', 'Điều khiển phản xạ nuốt, ho', 'Gồm: não trung gian, não giữa, cầu não, hành não'] },
  { id: 'spinal', name: 'Tủy sống', position: [0, -1.2, 0], color: '#60a5fa', scale: 0.4,
    facts: ['Nằm trong cột sống', 'Dẫn truyền xung thần kinh lên/xuống', 'Trung khu phản xạ không điều kiện', 'Chất xám trong, chất trắng ngoài'] },
  { id: 'neuron', name: 'Neuron (Tế bào TK)', position: [2.5, 1.5, 0], color: '#fbbf24', scale: 0.7,
    facts: ['Đơn vị chức năng của hệ TK', 'Gồm: thân (soma), sợi nhánh, sợi trục', 'Truyền xung thần kinh = điện hóa', 'Synapse: chỗ tiếp nối giữa 2 neuron'] },
  { id: 'reflex', name: 'Cung phản xạ', position: [-2.5, 1.5, 0], color: '#34d399', scale: 0.7,
    facts: ['5 bộ phận: thụ quan → TK hướng tâm → TK trung ương → TK ly tâm → cơ quan effector', 'Phản xạ = phản ứng với kích thích', 'PX có điều kiện (học được) vs PX không điều kiện (bẩm sinh)', 'VD: rút tay khi chạm nóng = PX không ĐK'] },
];

const QUIZ = [
  { q: 'Đại não điều khiển chức năng gì?', opts: ['Thăng bằng', 'Tư duy, ngôn ngữ', 'Hô hấp'], correct: 1 },
  { q: 'Tiểu não có chức năng chính?', opts: ['Điều hòa thăng bằng', 'Tư duy trừu tượng', 'Truyền xung TK'], correct: 0 },
  { q: 'Neuron gồm những phần nào?', opts: ['Nhân, ribosome, lưới nội chất', 'Thân, sợi nhánh, sợi trục', 'Não, tủy, dây TK'], correct: 1 },
  { q: 'Tủy sống nằm ở đâu?', opts: ['Trong hộp sọ', 'Trong cột sống', 'Trong lồng ngực'], correct: 1 },
  { q: 'Cung phản xạ có mấy bộ phận?', opts: ['3', '5', '7'], correct: 1 },
  { q: 'Rút tay khi chạm nóng là phản xạ gì?', opts: ['Có điều kiện', 'Không điều kiện', 'Tự chủ'], correct: 1 },
  { q: 'Trung khu hô hấp nằm ở đâu?', opts: ['Đại não', 'Tiểu não', 'Thân não'], correct: 2 },
];

function BrainPart({ part, isActive, isVisited }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    if (isActive) ref.current.scale.setScalar(part.scale * (1 + Math.sin(t * 3) * 0.06));
    else ref.current.scale.setScalar(part.scale);
  });
  const emissive = isActive ? part.color : isVisited ? '#1a1a3e' : '#000';
  const emI = isActive ? 0.6 : isVisited ? 0.15 : 0;

  if (part.id === 'brain') return (
    <group ref={ref} position={part.position}>
      <mesh><sphereGeometry args={[0.9, 32, 24]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.01]}><planeGeometry args={[0.02, 1.6]} /><meshBasicMaterial color="#e879a8" /></mesh>
    </group>
  );
  if (part.id === 'cerebellum') return (
    <group ref={ref} position={part.position}><mesh><sphereGeometry args={[0.5, 20, 20]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} roughness={0.7} /></mesh></group>
  );
  if (part.id === 'brainstem') return (
    <group ref={ref} position={part.position}><mesh><cylinderGeometry args={[0.18, 0.25, 0.9, 12]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh></group>
  );
  if (part.id === 'spinal') return (
    <group ref={ref} position={part.position}><mesh><cylinderGeometry args={[0.08, 0.08, 2.5, 12]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh></group>
  );
  if (part.id === 'neuron') return (
    <group ref={ref} position={part.position}>
      <mesh><sphereGeometry args={[0.25, 16, 16]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh>
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <mesh key={i} rotation={[0, 0, (a * Math.PI) / 180]} position={[Math.cos((a * Math.PI) / 180) * 0.4, Math.sin((a * Math.PI) / 180) * 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.01, 0.35, 4]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI * 0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.6, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.7, 6]} /><meshStandardMaterial color="#fde68a" emissive={isActive ? '#fbbf24' : '#000'} emissiveIntensity={emI * 0.4} /></mesh>
    </group>
  );
  // reflex arc
  return (
    <group ref={ref} position={part.position}>
      <mesh><torusGeometry args={[0.4, 0.05, 8, 24, Math.PI * 1.5]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh>
      <mesh position={[0.4, 0, 0]}><coneGeometry args={[0.08, 0.15, 8]} /><meshStandardMaterial color={part.color} /></mesh>
    </group>
  );
}

function NervousScene({ parts, selectedIdx, visited }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 5]} intensity={0.7} />
      <pointLight position={[0, 2, 3]} intensity={0.4} color="#f472b6" />
      {parts.map((p, i) => <BrainPart key={p.id} part={p} isActive={i === selectedIdx} isVisited={visited.includes(p.id)} />)}
      <mesh position={[0, -1.2, 0]}><cylinderGeometry args={[0.15, 0.12, 5, 6]} /><meshStandardMaterial color="#334155" transparent opacity={0.2} /></mesh>
      <OrbitControls enablePan minDistance={4} maxDistance={14} />
    </>
  );
}

export default function NervousSystemGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visited, setVisited] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const current = PARTS[selectedIdx];
  const handleSelect = (i) => {
    setSelectedIdx(i);
    if (!visited.includes(PARTS[i].id)) { setVisited(p => [...p, PARTS[i].id]); setScore(s => s + 50); }
  };

  const handleQuiz = (idx) => {
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Chính xác! 🧠' }); }
    else setFeedback({ type: 'error', msg: 'Sai rồi! 😅' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🧠</div>
        <h2 className="text-2xl font-bold text-white mb-3">Hệ Thần kinh 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Khám phá cấu tạo não bộ, neuron và cung phản xạ!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
      </div>
    </div>
  );

  if (phase === 'complete') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🧠</h2>
        <div className="bg-white/5 rounded-xl p-3 mb-4"><p className="text-3xl font-bold text-purple-400">{score}</p><p className="text-xs text-gray-400">Điểm số</p></div>
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
              <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          ))}</div>
          {feedback && <div className={`mt-3 text-center py-2 rounded-lg font-semibold ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{feedback.msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas camera={{ position: [0, 1, 7], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <NervousScene parts={PARTS} selectedIdx={selectedIdx} visited={visited} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">🏆 {score}</div>
        {visited.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {PARTS.map((p, i) => (
            <button key={p.id} onClick={() => handleSelect(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${i === selectedIdx ? 'text-white border border-white/30' : visited.includes(p.id) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}
              style={i === selectedIdx ? { backgroundColor: p.color + '30' } : {}}>{p.name}</button>
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
