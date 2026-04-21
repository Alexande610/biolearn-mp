// InvertebrateGame3D.jsx - Phân loại Động vật 3D (Lớp 7)
// 10 mô hình GLB + 10 âm thanh động vật
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { clone as SkeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Trophy, ArrowRight, ArrowLeft, RotateCcw, Volume2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

// =========== DATA ===========

const ANIMALS = [
  // Có xương sống (5) - manualScale tính từ 1.8/maxDim thực tế (Cloudinary + Local Fallback)
  { id: 'bird',  name: 'Chim',    phylum: 'Dây sống', hasSpine: true,  color: '#60a5fa',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607143/bird_grey.glb', fallbackModel: '/models/animals/bird_grey.glb', sound: '/music/bird.mp3', manualScale: 1800,
    facts: ['Động vật có xương sống', 'Máu nóng, đẻ trứng', 'Lông vũ, bay bằng cánh', 'Tim 4 ngăn, hô hấp bằng phổi'] },
  { id: 'cat',   name: 'Mèo',     phylum: 'Dây sống', hasSpine: true,  color: '#f97316',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607148/cat.glb', fallbackModel: '/models/animals/cat.glb', sound: '/music/meow.mp3', manualScale: 0.055,
    facts: ['Thú (Mammalia)', 'Máu nóng, đẻ con, nuôi bằng sữa', 'Bộ xương trong (xương sống)', 'Thính giác và khứu giác phát triển'] },
  { id: 'dog',   name: 'Chó',     phylum: 'Dây sống', hasSpine: true,  color: '#eab308',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611622/dog.glb', fallbackModel: '/models/animals/dog.glb', sound: '/music/dog.mp3', manualScale: 1.93,
    facts: ['Thú (Mammalia)', 'Máu nóng, 4 chân', 'Bộ xương trong hoàn chỉnh', 'Trung thành, thuần hóa sớm nhất'] },
  { id: 'frog',  name: 'Ếch',     phylum: 'Dây sống', hasSpine: true,  color: '#22c55e',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607151/frog.glb', fallbackModel: '/models/animals/frog.glb', sound: '/music/frog.mp3', manualScale: 1.4,
    facts: ['Lưỡng cư (Amphibia)', 'Sống 2 môi trường: nước + cạn', 'Biến thái: nòng nọc → ếch', 'Tim 3 ngăn, hô hấp phổi + da'] },
  { id: 'fish',  name: 'Cá',      phylum: 'Dây sống', hasSpine: true,  color: '#38bdf8',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607152/small_fish.glb', fallbackModel: '/models/animals/small_fish.glb', sound: '/music/fish.mp3', manualScale: 6.8,
    facts: ['Cá xương (Osteichthyes)', 'Hô hấp bằng mang', 'Bơi bằng vây, máu lạnh', 'Tim 2 ngăn, tuần hoàn đơn'] },
  // Không xương sống (5)
  { id: 'crab',      name: 'Cua',       phylum: 'Chân khớp', hasSpine: false, color: '#3b82f6',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611619/blue_crab.glb', fallbackModel: '/models/animals/blue_crab.glb', sound: '/music/crab.mp3', manualScale: 0.9,
    facts: ['Giáp xác (Crustacea)', 'Bộ xương ngoài chitin', '10 chân, 2 càng', 'Hô hấp bằng mang'] },
  { id: 'jellyfish', name: 'Sứa',       phylum: 'Ruột khoang', hasSpine: false, color: '#a78bfa',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607146/blue_jellyfish.glb', fallbackModel: '/models/animals/blue_jellyfish.glb', sound: '/music/jellyfish.mp3', manualScale: 0.8,
    facts: ['Ruột khoang (Cnidaria)', 'Đối xứng tỏa tròn', 'Có tế bào gai (cnidocyte)', 'Cơ thể 95% là nước'] },
  { id: 'butterfly', name: 'Bướm',      phylum: 'Chân khớp', hasSpine: false, color: '#f472b6',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607147/butterfly.glb', fallbackModel: '/models/animals/butterfly.glb', sound: '/music/butterfly.mp3', manualScale: 0.014,
    facts: ['Côn trùng (Insecta)', '6 chân, 2 cánh có vẩy', 'Biến thái hoàn toàn', 'Trứng → Sâu → Nhộng → Bướm'] },
  { id: 'snail',     name: 'Ốc sên',    phylum: 'Thân mềm', hasSpine: false, color: '#34d399',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611624/snail.glb', fallbackModel: '/models/animals/snail.glb', sound: '/music/snail.mp3', manualScale: 1.9,
    facts: ['Thân mềm (Mollusca)', 'Vỏ xoắn CaCO₃', 'Chân cơ, di chuyển chậm', 'Tiết nhầy bảo vệ cơ thể'] },
  { id: 'sponge',    name: 'Bọt biển',   phylum: 'Thân lỗ', hasSpine: false, color: '#fbbf24',
    model: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611626/yellow_tube_sea_sponge.glb', fallbackModel: '/models/animals/yellow_tube_sea_sponge.glb', sound: '/music/Sponge.mp3', manualScale: 0.01,
    facts: ['Thân lỗ (Porifera)', 'Động vật đa bào đơn giản nhất', 'Sống cố định, lọc thức ăn', 'Không có mô/cơ quan thật sự'] },
];

const QUIZ = [
  { q: 'Động vật nào sau đây có xương sống?', opts: ['Sứa', 'Ếch', 'Bọt biển'], correct: 1 },
  { q: 'Bướm thuộc lớp nào?', opts: ['Giáp xác', 'Côn trùng', 'Thân mềm'], correct: 1 },
  { q: 'Con cua hô hấp bằng gì?', opts: ['Phổi', 'Da', 'Mang'], correct: 2 },
  { q: 'Ốc sên thuộc ngành nào?', opts: ['Chân khớp', 'Thân mềm', 'Ruột khoang'], correct: 1 },
  { q: 'Tim cá có mấy ngăn?', opts: ['2', '3', '4'], correct: 0 },
  { q: 'Sứa thuộc ngành nào?', opts: ['Thân lỗ', 'Ruột khoang', 'Giun đốt'], correct: 1 },
  { q: 'Mèo thuộc lớp nào?', opts: ['Bò sát', 'Lưỡng cư', 'Thú'], correct: 2 },
  { q: 'Động vật nào KHÔNG xương sống?', opts: ['Chim', 'Cua', 'Chó'], correct: 1 },
  { q: 'Ếch hô hấp bằng gì?', opts: ['Mang', 'Phổi + Da', 'Chỉ phổi'], correct: 1 },
  { q: 'Bọt biển thuộc ngành nào?', opts: ['Thân lỗ', 'Thân mềm', 'Chân khớp'], correct: 0 },
];

// Preload all GLB models (Cloudinary)
ANIMALS.forEach(a => useGLTF.preload(a.model));

// =========== 3D ANIMAL - SkeletonUtils.clone + manualScale đáng tin cậy ===========

function AnimalGLB({ animal, position, isActive, onClick }) {
  const { scene } = useGLTF(animal.model);
  const groupRef = useRef();
  const baseScaleRef = useRef(animal.manualScale);

  const { clonedScene, centerOffset } = useMemo(() => {
    // SkeletonUtils.clone giữ đúng skeleton/SkinnedMesh bindings
    const clone = SkeletonClone(scene);
    // Fix materials - giữ nguyên màu gốc, KHÔNG đè emissive
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
          child.material.metalness = Math.min(child.material.metalness, 0.4);
          child.material.roughness = Math.max(child.material.roughness, 0.4);
          child.material.envMapIntensity = 1.0;
          // Xóa emissive để giữ màu nguyên bản
          child.material.emissive = new THREE.Color('#000000');
          child.material.emissiveIntensity = 0;
        }
      }
    });
    // Scale clone trước rồi tính center (cho chính xác với mọi manualScale)
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(animal.manualScale);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    const center = new THREE.Vector3();
    box.getCenter(center);
    // Trả center ở world space (sau scale)
    wrapper.remove(clone);
    return { clonedScene: clone, centerOffset: center };
  }, [scene, animal.manualScale]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += isActive ? 0.015 : 0.004;
    const base = baseScaleRef.current;
    const pulse = isActive ? Math.sin(state.clock.elapsedTime * 3) * 0.04 : 0;
    groupRef.current.scale.setScalar(base * (1 + pulse));
  });

  return (
    <Float speed={1.5} floatIntensity={0.15}>
      <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        {/* Dịch ngược center ở world space (sau scale) */}
        <group position={[-centerOffset.x, -centerOffset.y, -centerOffset.z]}>
          <group ref={groupRef} scale={animal.manualScale}>
            <primitive object={clonedScene} />
          </group>
        </group>
        {/* Tên động vật */}
        <Html position={[0, 1.4, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
            style={{ backgroundColor: animal.color + '80', color: '#fff', border: `1px solid ${animal.color}` }}
          >
            {animal.name}
          </div>
        </Html>
      </group>
    </Float>
  );
}

// =========== SCENE (hiển thị 1 con duy nhất, centered) ===========

function ClassifyScene({ animal }) {
  return (
    <>
      {/* Ánh sáng mạnh - không dùng Environment preset (gây trắng màn hình) */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <directionalLight position={[-8, 10, -5]} intensity={1.0} />
      <directionalLight position={[0, -5, 10]} intensity={0.6} />
      <pointLight position={[-8, 6, 8]} intensity={0.8} color="#93c5fd" />
      <pointLight position={[8, -4, 8]} intensity={0.6} color="#86efac" />
      <hemisphereLight args={['#ffffff', '#1e3a5f', 1.0]} />

      {animal && (
        <AnimalGLB
          key={animal.id}
          animal={animal}
          position={[0, 0, 0]}
          isActive={true}
          onClick={() => {}}
        />
      )}

      <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
    </>
  );
}

// =========== MAIN GAME ===========

export default function InvertebrateGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selected, setSelected] = useState(null);
  const [explored, setExplored] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [classified, setClassified] = useState({});
  const [playingSound, setPlayingSound] = useState(null);
  const soundRef = useRef(null);

  const current = ANIMALS.find(a => a.id === selected);

  useEffect(() => {
    return () => {
      if (soundRef.current) { soundRef.current.pause(); soundRef.current.src = ''; }
    };
  }, []);

  const currentIndex = ANIMALS.findIndex(a => a.id === selected);

  const handleExplore = useCallback((id) => {
    setSelected(id);
    if (!explored.includes(id)) setExplored(p => [...p, id]);
  }, [explored]);

  const goPrev = useCallback(() => {
    const idx = currentIndex <= 0 ? ANIMALS.length - 1 : currentIndex - 1;
    handleExplore(ANIMALS[idx].id);
  }, [currentIndex, handleExplore]);

  const goNext = useCallback(() => {
    const idx = currentIndex >= ANIMALS.length - 1 ? 0 : currentIndex + 1;
    handleExplore(ANIMALS[idx].id);
  }, [currentIndex, handleExplore]);

  const playAnimalSound = useCallback((animal) => {
    if (soundRef.current) { soundRef.current.pause(); soundRef.current.currentTime = 0; }
    const savedSfxMuted = localStorage.getItem('sfxMuted') === 'true';
    const savedSfxVol = localStorage.getItem('sfxVolume');
    const vol = savedSfxMuted ? 0 : (savedSfxVol !== null ? Number(savedSfxVol) / 100 : 0.5);
    const audio = new Audio(animal.sound);
    audio.volume = vol;
    audio.play().catch(() => {});
    soundRef.current = audio;
    setPlayingSound(animal.id);
    audio.addEventListener('ended', () => setPlayingSound(null), { once: true });
  }, []);

  const handleClassify = useCallback((id, guess) => {
    const animal = ANIMALS.find(a => a.id === id);
    const correct = animal.hasSpine === guess;
    setClassified(prev => ({ ...prev, [id]: correct }));
    if (correct) setScore(s => s + 50);
  }, []);

  const handleQuizAnswer = useCallback((idx) => {
    if (idx === QUIZ[quizIdx].correct) {
      setScore(s => s + 100);
      setFeedback({ type: 'success', msg: 'Đúng! 🎉' });
    } else {
      setFeedback({ type: 'error', msg: 'Sai rồi! 😅' });
    }
    setTimeout(() => {
      setFeedback(null);
      if (quizIdx < QUIZ.length - 1) setQuizIdx(i => i + 1);
      else setPhase('complete');
    }, 1200);
  }, [quizIdx]);

  const handleReset = () => {
    setPhase('intro');
    setSelected(null);
    setExplored([]);
    setQuizIdx(0);
    setScore(0);
    setFeedback(null);
    setClassified({});
    setPlayingSound(null);
  };

  // Auto-select con đầu tiên khi vào explore
  useEffect(() => {
    if (phase === 'explore' && !selected) handleExplore(ANIMALS[0].id);
  }, [phase, selected, handleExplore]);

  // ========= INTRO =========
  if (phase === 'intro') return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🦋</div>
        <h2 className="text-2xl font-bold text-white mb-3">Phân loại Động vật 3D</h2>
        <p className="text-gray-300 text-sm mb-2">Khám phá 10 loài động vật với mô hình 3D thực tế!</p>
        <p className="text-gray-400 text-xs mb-4">Bấm vào mô hình để xem thông tin. Nghe tiếng kêu. Phân loại có/không xương sống. Rồi làm quiz!</p>
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {ANIMALS.map(a => (
            <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: a.color + '30', color: a.color }}>
              {a.name}
            </span>
          ))}
        </div>
        <button onClick={() => setPhase('explore')} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition">
          Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
        </button>
      </div>
    </div>
  );

  // ========= COMPLETE =========
  if (phase === 'complete') {
    const stars = score >= 1200 ? 3 : score >= 800 ? 2 : 1;
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🦋</h2>
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-3xl font-bold text-blue-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm số</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex-1 py-2.5 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition">
              <RotateCcw className="w-4 h-4" /> Chơi lại
            </button>
            <button onClick={() => onComplete(score)} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition">
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========= QUIZ =========
  if (phase === 'quiz') {
    const q = QUIZ[quizIdx];
    return (
      <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-30">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-xs">Câu {quizIdx + 1}/{QUIZ.length}</span>
            <span className="text-yellow-400 text-sm font-bold">🏆 {score}</span>
          </div>
          <p className="text-white text-lg font-bold mb-5">{q.q}</p>
          <div className="space-y-3">
            {q.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleQuizAnswer(i)}
                className="w-full p-4 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-white rounded-xl text-left transition-all duration-200 flex items-center gap-3"
              >
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
          {feedback && (
            <div className={`mt-4 text-center py-2.5 rounded-xl font-semibold ${
              feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {feedback.msg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========= EXPLORE (hiển thị 1 con tại trung tâm, kéo trái/phải chuyển con) =========
  return (
    <div className="absolute inset-0 bg-slate-900">
      {/* 3D Canvas - hiển thị DUY NHẤT 1 con */}
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <ClassifyScene animal={current} />
      </Canvas>

      {/* Nút Prev / Next ở 2 bên màn hình */}
      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Header */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto">
          <span className="text-yellow-400 font-bold">🏆 {score}</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-2">
          <span className="text-gray-300 text-sm">{currentIndex + 1}/{ANIMALS.length}</span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          {explored.length >= 6 && (
            <button
              onClick={() => setPhase('quiz')}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition"
            >
              Quiz →
            </button>
          )}
          <button
            onClick={handleReset}
            className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Indicator dots */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {ANIMALS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => handleExplore(a.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              selected === a.id
                ? 'scale-125'
                : explored.includes(a.id)
                  ? 'bg-green-400/60'
                  : 'bg-white/25'
            }`}
            style={selected === a.id ? { backgroundColor: a.color } : {}}
            title={a.name}
          />
        ))}
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        {/* Nút chọn nhanh (scroll ngang) */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {ANIMALS.map(a => (
            <button
              key={a.id}
              onClick={() => handleExplore(a.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                selected === a.id
                  ? 'text-white border border-white/30'
                  : explored.includes(a.id)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
              style={selected === a.id ? { backgroundColor: a.color + '30' } : {}}
            >
              {a.name}
            </button>
          ))}
        </div>

        {/* Chi tiết động vật đã chọn */}
        {current && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-base">{current.name}</span>
                <button
                  onClick={() => playAnimalSound(current)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    playingSound === current.id
                      ? 'bg-green-500 text-white animate-pulse'
                      : 'bg-white/15 text-gray-300 hover:bg-white/25'
                  }`}
                  title="Nghe tiếng kêu"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: current.color + '30', color: current.color }}
                >
                  {current.phylum}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  current.hasSpine ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {current.hasSpine ? '🦴 Có xương sống' : '🐛 Không xương sống'}
                </span>
              </div>

              {classified[current.id] === undefined && (
                <div className="flex gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleClassify(current.id, false)}
                    className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition"
                  >
                    Không XS
                  </button>
                  <button
                    onClick={() => handleClassify(current.id, true)}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition"
                  >
                    Có XS
                  </button>
                </div>
              )}
              {classified[current.id] !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                  classified[current.id] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {classified[current.id] ? '✓ Đúng!' : '✗ Sai!'}
                </span>
              )}
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
