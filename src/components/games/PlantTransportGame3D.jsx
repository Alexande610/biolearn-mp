// PlantTransportGame3D.jsx - Vận chuyển chất trong Thực vật 3D (Lớp 11)
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, ArrowRight } from 'lucide-react';

const PARTS = [
  { id: 'root_hair', name: 'Lông hút (Rễ)', position: [0, -3, 0], color: '#92400e',
    facts: ['Hấp thụ nước + ion khoáng từ đất', 'Thẩm thấu: nước đi từ nơi nồng độ thấp → cao', 'Vận chuyển chủ động: bơm ion khoáng', 'Bề mặt lông hút rất lớn'] },
  { id: 'xylem', name: 'Mạch gỗ (Xylem)', position: [-0.8, -0.5, 0], color: '#3b82f6',
    facts: ['Vận chuyển nước + muối khoáng lên trên', 'Gồm tế bào chết, vách dày lignin', 'Dòng mạch gỗ: rễ → thân → lá', 'Động lực: thoát hơi nước + áp suất rễ'] },
  { id: 'phloem', name: 'Mạch rây (Phloem)', position: [0.8, -0.5, 0], color: '#22c55e',
    facts: ['Vận chuyển chất hữu cơ (đường saccharose)', 'Gồm tế bào sống: ống rây + tế bào kèm', 'Dòng mạch rây: lá → các cơ quan', 'Theo cơ chế dòng khối (mass flow)'] },
  { id: 'stomata', name: 'Khí khổng (Lá)', position: [0, 2.5, 0], color: '#14b8a6',
    facts: ['Thoát hơi nước tạo lực hút', 'Mở/đóng nhờ tế bào bảo vệ (guard cells)', 'Ánh sáng → mở; thiếu nước → đóng', 'Thoát hơi nước = động lực chính kéo nước lên'] },
  { id: 'transpiration', name: 'Thoát hơi nước', position: [0, 4, 0], color: '#06b6d4',
    facts: ['90% qua khí khổng, 10% qua cutin', 'Tạo lực kéo dòng mạch gỗ (lực hút)', 'Làm mát lá vào trưa nắng', 'Điều hòa bởi: ánh sáng, nhiệt độ, gió, độ ẩm'] },
];

const QUIZ = [
  { q: 'Mạch gỗ vận chuyển chất gì?', opts: ['Đường saccharose', 'Nước + ion khoáng', 'Amino acid'], correct: 1 },
  { q: 'Mạch rây gồm tế bào sống hay chết?', opts: ['Tế bào chết', 'Tế bào sống', 'Cả hai'], correct: 1 },
  { q: 'Động lực chính kéo nước lên cao?', opts: ['Áp suất rễ', 'Thoát hơi nước', 'Trọng lực'], correct: 1 },
  { q: 'Khí khổng mở khi nào?', opts: ['Ban đêm', 'Thiếu nước', 'Có ánh sáng'], correct: 2 },
  { q: 'Lông hút hấp thụ nước theo cơ chế?', opts: ['Thẩm thấu', 'Chủ động', 'Nội bào'], correct: 0 },
  { q: 'Mạch rây vận chuyển theo hướng nào?', opts: ['Chỉ lên', 'Chỉ xuống', 'Lá → các cơ quan'], correct: 2 },
  { q: 'Lignin có trong mạch nào?', opts: ['Mạch rây', 'Mạch gỗ', 'Cả hai'], correct: 1 },
];

function WaterParticles({ from, to, count = 8 }) {
  const ref = useRef();
  const particles = useRef(Array.from({ length: count }, (_, i) => ({ offset: i / count, speed: 0.3 + Math.random() * 0.3 })));
  useFrame((s) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position;
    particles.current.forEach((p, i) => {
      const t = (s.clock.elapsedTime * p.speed + p.offset) % 1;
      positions.setXYZ(i,
        from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.1,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t + (Math.random() - 0.5) * 0.1,
      );
    });
    positions.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={new Float32Array(count * 3)} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="#60a5fa" size={0.06} transparent opacity={0.8} />
    </points>
  );
}

function SugarParticles({ from, to, count = 6 }) {
  const ref = useRef();
  const pts = useRef(Array.from({ length: count }, (_, i) => ({ offset: i / count, speed: 0.2 + Math.random() * 0.2 })));
  useFrame((s) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position;
    pts.current.forEach((p, i) => {
      const t = (s.clock.elapsedTime * p.speed + p.offset) % 1;
      positions.setXYZ(i,
        from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.1,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t + (Math.random() - 0.5) * 0.1,
      );
    });
    positions.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={new Float32Array(count * 3)} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="#4ade80" size={0.07} transparent opacity={0.8} />
    </points>
  );
}

function PlantPart({ part, isActive, isVisited }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    if (isActive) ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.05);
    else ref.current.scale.setScalar(1);
  });
  const emissive = isActive ? part.color : isVisited ? '#111' : '#000';
  const emI = isActive ? 0.5 : isVisited ? 0.1 : 0;

  if (part.id === 'root_hair') return (
    <group ref={ref} position={part.position}>
      <mesh><cylinderGeometry args={[0.25, 0.35, 0.6, 12]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh>
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => <mesh key={i} position={[x, -0.2, 0]} rotation={[0, 0, x * 0.5]}><cylinderGeometry args={[0.015, 0.01, 0.6, 4]} /><meshStandardMaterial color="#b45309" /></mesh>)}
    </group>
  );
  if (part.id === 'xylem') return (
    <group ref={ref} position={part.position}><mesh><cylinderGeometry args={[0.08, 0.08, 5, 8]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} transparent opacity={0.6} /></mesh></group>
  );
  if (part.id === 'phloem') return (
    <group ref={ref} position={part.position}><mesh><cylinderGeometry args={[0.08, 0.08, 5, 8]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} transparent opacity={0.6} /></mesh></group>
  );
  if (part.id === 'stomata') return (
    <group ref={ref} position={part.position}>
      <mesh><sphereGeometry args={[0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#16a34a" emissive={emissive} emissiveIntensity={emI} side={THREE.DoubleSide} /></mesh>
      {[-0.15, 0.15].map((x, i) => <mesh key={i} position={[x, -0.05, 0.1]}><capsuleGeometry args={[0.04, 0.15, 4, 8]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} /></mesh>)}
    </group>
  );
  // transpiration
  return (
    <group ref={ref} position={part.position}>
      {[0, 0.2, -0.2, 0.4, -0.4].map((x, i) => <mesh key={i} position={[x, Math.random() * 0.3, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color={part.color} emissive={emissive} emissiveIntensity={emI} transparent opacity={0.5} /></mesh>)}
    </group>
  );
}

function TransportScene({ parts, selectedIdx, visited }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />
      {/* Stem trunk */}
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.15, 0.2, 6, 12]} /><meshStandardMaterial color="#4a2c0a" roughness={0.8} /></mesh>
      {parts.map((p, i) => <PlantPart key={p.id} part={p} isActive={i === selectedIdx} isVisited={visited.includes(p.id)} />)}
      {/* Water flow animation up xylem */}
      <WaterParticles from={[-0.8, -3, 0]} to={[-0.8, 2, 0]} />
      {/* Sugar flow down phloem */}
      <SugarParticles from={[0.8, 2.5, 0]} to={[0.8, -3, 0]} />
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.3, 0]}><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#3b2507" /></mesh>
      <OrbitControls enablePan minDistance={4} maxDistance={14} />
    </>
  );
}

export default function PlantTransportGame3D({ onComplete }) {
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
    if (idx === QUIZ[quizIdx].correct) { setScore(s => s + 100); setFeedback({ type: 'success', msg: 'Chính xác! 🌱' }); }
    else setFeedback({ type: 'error', msg: 'Sai rồi 😅' });
    setTimeout(() => { setFeedback(null); if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1); else setPhase('complete'); }, 1200);
  };

  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🌿</div>
        <h2 className="text-2xl font-bold text-white mb-3">Vận chuyển Thực vật 3D</h2>
        <p className="text-gray-300 text-sm mb-4">Khám phá mạch gỗ, mạch rây và quá trình vận chuyển nước trong cây!</p>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" /></button>
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
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <TransportScene parts={PARTS} selectedIdx={selectedIdx} visited={visited} />
      </Canvas>
      <div className="absolute top-16 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto text-white text-sm">🏆 {score}</div>
        {visited.length >= 4 && <button onClick={() => setPhase('quiz')} className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-xl text-white text-sm font-bold pointer-events-auto">Quiz →</button>}
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
