// DigestiveGame3D.jsx - Hành trình thức ăn qua Hệ tiêu hóa 3D (Lớp 8)
// GLB models + Sound effects + Camera follow (giống OxygenJourneyGame3D)
import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles, Play } from 'lucide-react';

// Các cơ quan - bố trí dọc từ trên xuống, gan lệch sang trái
const ORGANS = [
  { id: 'mouth', name: 'Khoang miệng', position: [0, 8, 0], color: '#ef4444',
    process: 'Tiêu hóa cơ học + enzyme amylase',
    facts: ['Răng nghiền nhỏ thức ăn (tiêu hóa cơ học)', 'Enzyme amylase phân giải tinh bột → mantose', 'Lưỡi trộn thức ăn với nước bọt', 'Tạo viên thức ăn dễ nuốt'] },
  { id: 'esophagus', name: 'Thực quản', position: [0, 4.5, 0], color: '#f97316',
    process: 'Co bóp nhu động đẩy thức ăn',
    facts: ['Dài ~25cm', 'Cơ trơn co bóp nhu động', 'Đẩy thức ăn xuống dạ dày', 'Không tiêu hóa hóa học'] },
  { id: 'stomach', name: 'Dạ dày', position: [0.8, 1, 0], color: '#eab308',
    process: 'Acid HCl + pepsin phân giải protein',
    facts: ['Dung tích ~1.5 lít', 'HCl (pH 1.5-2) tiêu diệt vi khuẩn', 'Pepsin phân giải protein → peptide', 'Co bóp trộn thức ăn với dịch vị'] },
  { id: 'small_intestine', name: 'Ruột non', position: [0, -2.5, 0], color: '#22c55e',
    process: 'Hấp thụ chính: mật + enzyme + nhung mao',
    facts: ['Dài 6-7m, đường kính 3cm', 'Nhung mao (villi) tăng diện tích hấp thụ 600x', 'Dịch tụy + dịch mật phân giải lipid', 'Hấp thụ glucose, amino acid, acid béo'] },
  { id: 'liver', name: 'Gan & Mật', position: [-3, 0, 0], color: '#a855f7',
    process: 'Tiết mật nhũ tương hóa lipid',
    facts: ['Gan = cơ quan lớn nhất (~1.5kg)', 'Mật nhũ tương hóa lipid → giọt nhỏ', 'Giải độc chất có hại', 'Dự trữ glycogen'] },
  { id: 'large_intestine', name: 'Ruột già', position: [0, -6, 0], color: '#06b6d4',
    process: 'Hấp thụ nước, tạo phân',
    facts: ['Dài ~1.5m, đường kính 6cm', 'Hấp thụ nước và muối khoáng', 'Vi khuẩn ruột tổng hợp vitamin K, B', 'Tạo và lưu trữ phân'] },
];

// Âm thanh whoosh cho mỗi cơ quan
const ORGAN_SOUNDS = {
  mouth: '/music/whoosh.mp3',
  esophagus: '/music/whoosh.mp3',
  stomach: '/music/whoosh.mp3',
  small_intestine: '/music/whoosh.mp3',
  liver: '/music/whoosh.mp3',
  large_intestine: '/music/whoosh.mp3',
};

// GLB models cho mỗi cơ quan (trừ esophagus → tube geometry)
// GLB models cho mỗi cơ quan (trừ esophagus → tube geometry) (Cloudinary + Local Fallback)
const ORGAN_MODELS = {
  mouth: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611628/mouth.glb', fallbackUrl: '/models/digestive/mouth.glb', targetSize: 3 },
  stomach: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611630/stomatch.glb', fallbackUrl: '/models/digestive/stomatch.glb', targetSize: 3 },
  small_intestine: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611630/Small%20Intestine.glb', fallbackUrl: '/models/digestive/Small Intestine.glb', targetSize: 3 },
  liver: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607164/liver.glb', fallbackUrl: '/models/digestive/liver.glb', targetSize: 3 },
  large_intestine: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607163/large_intestine1.glb', fallbackUrl: '/models/digestive/large_intestine1.glb', targetSize: 3 },
};

const QUIZ = [
  { q: 'Enzyme amylase phân giải chất gì?', opts: ['Protein', 'Tinh bột', 'Lipid'], correct: 1 },
  { q: 'pH trong dạ dày khoảng bao nhiêu?', opts: ['5-6', '1.5-2', '7-8'], correct: 1 },
  { q: 'Cơ quan nào hấp thụ chất dinh dưỡng chính?', opts: ['Dạ dày', 'Ruột non', 'Ruột già'], correct: 1 },
  { q: 'Mật có chức năng gì?', opts: ['Phân giải tinh bột', 'Nhũ tương hóa lipid', 'Phân giải protein'], correct: 1 },
  { q: 'Nhung mao (villi) ở đâu?', opts: ['Dạ dày', 'Thực quản', 'Ruột non'], correct: 2 },
  { q: 'Ruột già hấp thụ chủ yếu gì?', opts: ['Glucose', 'Nước', 'Protein'], correct: 1 },
  { q: 'Pepsin phân giải chất gì?', opts: ['Tinh bột', 'Lipid', 'Protein'], correct: 2 },
];

// =============== 3D ORGAN GLB (Auto Center & Auto Scale) ===============

function OrganGLB({ modelKey, position, isActive, isVisited, organColor }) {
  const config = ORGAN_MODELS[modelKey];
  const { scene } = useGLTF(config.url);
  const groupRef = useRef();
  const baseScaleRef = useRef(1);

  const { clonedScene, autoScale, centerOffset } = useMemo(() => {
    const clone = scene.clone(true);
    const meshBox = new THREE.Box3();
    let hasMesh = false;
    clone.traverse((child) => {
      if (child.isMesh) {
        hasMesh = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
            child.material.metalness = Math.min(child.material.metalness, 0.5);
            child.material.roughness = Math.max(child.material.roughness, 0.3);
            child.material.envMapIntensity = 1.5;
          }
        }
        child.updateWorldMatrix(true, false);
        const childBox = new THREE.Box3().setFromObject(child);
        meshBox.union(childBox);
      }
    });
    if (!hasMesh) meshBox.setFromObject(clone);
    const size = new THREE.Vector3();
    meshBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? config.targetSize / maxDim : 1;
    const center = new THREE.Vector3();
    meshBox.getCenter(center);
    baseScaleRef.current = s;
    return { clonedScene: clone, autoScale: s, centerOffset: center };
  }, [scene, config.targetSize]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (isActive) {
          child.material.emissive = new THREE.Color(organColor);
          child.material.emissiveIntensity = 0.4;
        } else if (isVisited) {
          child.material.emissive = new THREE.Color('#22c55e');
          child.material.emissiveIntensity = 0.25;
        } else {
          child.material.emissive = new THREE.Color(organColor);
          child.material.emissiveIntensity = 0.1;
        }
      }
    });
  }, [isActive, isVisited, clonedScene, organColor]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const base = baseScaleRef.current;
    groupRef.current.scale.setScalar(base * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.04));
  });

  return (
    <group position={position}>
      <group ref={groupRef} scale={autoScale}>
        <primitive
          object={clonedScene}
          position={[-centerOffset.x, -centerOffset.y, -centerOffset.z]}
        />
      </group>
      {isActive && (
        <mesh>
          <sphereGeometry args={[config.targetSize * 0.65, 16, 16]} />
          <meshBasicMaterial color={organColor} transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
}

// Thực quản - tube dọc (không có GLB)
function Esophagus3D({ position, isActive, isVisited }) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(0.1, 0, 0.15),
      new THREE.Vector3(0, -1.2, 0),
    ]);
  }, []);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.2, 16, false]} />
        <meshStandardMaterial
          color={isActive ? '#fb923c' : isVisited ? '#22c55e' : '#f97316'}
          metalness={0.3}
          roughness={0.5}
          emissive={isActive ? '#f97316' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      {isActive && (
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
}

// =============== FOOD PARTICLE (viên thức ăn di chuyển) ===============

function FoodParticle({ position, visitedOrgans, travelDuration = 2 }) {
  const ref = useRef();
  const startPos = useRef(new THREE.Vector3(...position));
  const targetPos = useRef(new THREE.Vector3(...position));
  const animStartTime = useRef(-1);
  const durRef = useRef(travelDuration);

  const currentOrgan = useMemo(() => {
    if (visitedOrgans.length === 0) return ORGANS[0];
    const lastVisited = visitedOrgans[visitedOrgans.length - 1];
    const idx = ORGANS.findIndex(s => s.id === lastVisited);
    return ORGANS[Math.min(idx + 1, ORGANS.length - 1)];
  }, [visitedOrgans]);

  useEffect(() => {
    targetPos.current.set(...currentOrgan.position);
    animStartTime.current = -1;
    durRef.current = travelDuration;
  }, [currentOrgan, travelDuration]);

  useFrame((state) => {
    if (!ref.current) return;
    if (animStartTime.current < 0) {
      startPos.current.copy(ref.current.position);
      animStartTime.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - animStartTime.current;
    const t = Math.min(elapsed / durRef.current, 1);
    const smoothT = t * t * (3 - 2 * t);
    ref.current.position.lerpVectors(startPos.current, targetPos.current, smoothT);
    ref.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.003;
    ref.current.rotation.z = state.clock.elapsedTime * 2;
  });

  return (
    <Float speed={3} floatIntensity={0.2}>
      <group ref={ref} position={position}>
        {/* Viên thức ăn */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

// =============== DIGESTIVE PATH ===============

function DigestivePath({ visitedOrgans }) {
  const pathCurve = useMemo(() => {
    const points = ORGANS.map(s => new THREE.Vector3(...s.position));
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[pathCurve, 200, 0.06, 8, false]} />
        <meshStandardMaterial color="#78350f" transparent opacity={0.4} metalness={0.2} roughness={0.6} />
      </mesh>
      {visitedOrgans.length > 0 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(
              ORGANS.slice(0, visitedOrgans.length + 1).map(s => new THREE.Vector3(...s.position)),
              false, 'catmullrom', 0.5
            ),
            100, 0.08, 8, false
          ]} />
          <meshStandardMaterial color="#f97316" emissive="#fbbf24" emissiveIntensity={0.3} metalness={0.3} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

// =============== RENDER ORGAN BY TYPE ===============

function RenderOrgan({ organ, isActive, isVisited }) {
  if (ORGAN_MODELS[organ.id]) {
    return <OrganGLB modelKey={organ.id} position={organ.position} isActive={isActive} isVisited={isVisited} organColor={organ.color} />;
  }
  if (organ.id === 'esophagus') {
    return <Esophagus3D position={organ.position} isActive={isActive} isVisited={isVisited} />;
  }
  return null;
}

// =============== CAMERA RIG — theo dõi thức ăn ===============

function CameraRig({ currentOrganIndex }) {
  const controlsRef = useRef();
  const targetVec = useRef(new THREE.Vector3(...ORGANS[0].position));

  useFrame((state) => {
    if (!controlsRef.current) return;
    const pos = ORGANS[currentOrganIndex]?.position || ORGANS[0].position;
    targetVec.current.set(...pos);
    controlsRef.current.target.lerp(targetVec.current, 0.04);
    // Camera nhìn thẳng vào cơ quan, lệch lên 1 unit và cách xa 10 units
    const desiredCam = targetVec.current.clone().add(new THREE.Vector3(0, 1, 10));
    state.camera.position.lerp(desiredCam, 0.03);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableRotate={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={25}
    />
  );
}

// =============== MAIN SCENE ===============

function DigestiveScene({ currentOrgan, currentOrganIndex, visitedOrgans, showQuiz, travelDuration }) {
  return (
    <>
      {/* Ánh sáng mạnh - không dùng Environment preset */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} />
      <directionalLight position={[-8, 10, -5]} intensity={1.0} />
      <directionalLight position={[0, -5, 10]} intensity={0.6} />
      <pointLight position={[-10, 8, 8]} intensity={0.8} color="#f97316" />
      <pointLight position={[10, -5, 8]} intensity={0.6} color="#eab308" />
      <hemisphereLight args={['#ffffff', '#78350f', 1.0]} />

      {/* Đường đi tiêu hóa */}
      <DigestivePath visitedOrgans={visitedOrgans} />

      {/* Các cơ quan */}
      {ORGANS.map((organ) => (
        <RenderOrgan
          key={organ.id}
          organ={organ}
          isActive={currentOrgan === organ.id && !showQuiz}
          isVisited={visitedOrgans.includes(organ.id)}
        />
      ))}

      {/* Viên thức ăn di chuyển */}
      <FoodParticle
        position={ORGANS[0].position}
        visitedOrgans={visitedOrgans}
        travelDuration={travelDuration}
      />

      {/* Camera follow */}
      <CameraRig currentOrganIndex={currentOrganIndex} />
    </>
  );
}

// =============== QUIZ MODAL ===============

function QuizModal({ organId, onAnswer }) {
  const questions = {
    mouth: { q: 'Enzyme amylase phân giải chất gì?', options: ['Protein', 'Tinh bột', 'Lipid'], correct: 1 },
    esophagus: { q: 'Thực quản dài khoảng bao nhiêu?', options: ['~10cm', '~25cm', '~50cm'], correct: 1 },
    stomach: { q: 'pH trong dạ dày khoảng bao nhiêu?', options: ['5-6', '1.5-2', '7-8'], correct: 1 },
    small_intestine: { q: 'Cơ quan nào hấp thụ chất dinh dưỡng chính?', options: ['Dạ dày', 'Ruột non', 'Ruột già'], correct: 1 },
    liver: { q: 'Mật có chức năng gì?', options: ['Phân giải tinh bột', 'Nhũ tương hóa lipid', 'Phân giải protein'], correct: 1 },
    large_intestine: { q: 'Ruột già hấp thụ chủ yếu gì?', options: ['Glucose', 'Nước', 'Protein'], correct: 1 },
  };

  const data = questions[organId];
  const organInfo = ORGANS.find(s => s.id === organId);
  if (!data || !organInfo) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: organInfo.color + '30' }}>
            <div className="w-5 h-5 rounded-full animate-pulse" style={{ backgroundColor: organInfo.color }} />
          </div>
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: organInfo.color, color: '#fff' }}>🍔</span>
            <h3 className="text-white font-bold mt-1">{organInfo.name}</h3>
          </div>
        </div>
        <p className="text-gray-200 mb-5 text-base">{data.q}</p>
        <div className="space-y-3">
          {data.options.map((opt, i) => (
            <button key={i} onClick={() => onAnswer(i === data.correct)}
              className="w-full p-4 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-white rounded-xl text-left transition-all duration-200 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============== MAIN GAME COMPONENT ===============

// Preload tất cả GLB models (Chỉ preload Cloudinary)
Object.values(ORGAN_MODELS).forEach(m => useGLTF.preload(m.url));

export default function DigestiveGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentOrganIndex, setCurrentOrganIndex] = useState(0);
  const [visitedOrgans, setVisitedOrgans] = useState([]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [travelDuration, setTravelDuration] = useState(2);
  const soundsRef = useRef({});

  const currentOrgan = ORGANS[currentOrganIndex]?.id;

  // Preload sounds
  useEffect(() => {
    const savedSfxMuted = localStorage.getItem('sfxMuted') === 'true';
    const savedSfxVol = localStorage.getItem('sfxVolume');
    const sfxVol = savedSfxMuted ? 0 : (savedSfxVol !== null ? Number(savedSfxVol) / 100 : 0.5);

    Object.entries(ORGAN_SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = sfxVol;
      soundsRef.current[key] = audio;
    });
    return () => {
      Object.values(soundsRef.current).forEach(a => { a.pause(); a.src = ''; });
    };
  }, []);

  // Play whoosh sound khi đổi organ + sync thời gian di chuyển
  useEffect(() => {
    if (currentOrgan && soundsRef.current[currentOrgan]) {
      Object.values(soundsRef.current).forEach(a => { a.pause(); a.currentTime = 0; });
      const audio = soundsRef.current[currentOrgan];
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setTravelDuration(dur);
      } else {
        setTravelDuration(2);
        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration && isFinite(audio.duration)) {
            setTravelDuration(audio.duration);
          }
        }, { once: true });
      }
      audio.play().catch(() => {});
    }
  }, [currentOrgan]);

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 100);
      setVisitedOrgans(prev => [...prev, currentOrgan]);
      setFeedback({ type: 'success', message: 'Đúng rồi! 🎉' });
      setShowQuiz(false);

      setTimeout(() => {
        setFeedback(null);
        if (currentOrganIndex < ORGANS.length - 1) {
          setCurrentOrganIndex(prev => prev + 1);
        } else {
          setGameComplete(true);
        }
      }, 1000);
    } else {
      setScore(prev => Math.max(0, prev - 20));
      setFeedback({ type: 'error', message: 'Sai rồi! Thử lại nhé 😅' });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleReset = () => {
    setCurrentOrganIndex(0);
    setVisitedOrgans([]);
    setScore(0);
    setGameComplete(false);
    setShowQuiz(false);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-orange-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🍔</div>
          <h2 className="text-2xl font-bold text-white mb-3">Hệ Tiêu hóa 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Theo dõi hành trình thức ăn từ miệng đến ruột già qua hệ tiêu hóa!
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-orange-400 mb-3 font-semibold">🍔 Hành trình thức ăn:</p>
            <div className="flex flex-wrap gap-1 text-xs">
              {ORGANS.map((s, i) => (
                <span key={s.id} className="flex items-center gap-1">
                  <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: s.color + '40', color: s.color }}>
                    {s.name}
                  </span>
                  {i < ORGANS.length - 1 && <span className="text-gray-500">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="text-gray-400 text-xs mb-4">🖱️ Kéo để xoay | Scroll để zoom</div>
          <button onClick={() => setShowTutorial(false)} className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-600 text-white font-bold rounded-xl hover:opacity-90 transition">
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Game Complete
  if (gameComplete) {
    const stars = score >= 500 ? 3 : score >= 300 ? 2 : 1;
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-orange-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành! 🍔</h2>
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-3xl font-bold text-orange-400">{score}</p>
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

  return (
    <div className="absolute inset-0 bg-slate-900">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 10, 14], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#0f172a']} />
        <DigestiveScene
          currentOrgan={currentOrgan}
          currentOrganIndex={currentOrganIndex}
          visitedOrgans={visitedOrgans}
          showQuiz={showQuiz}
          travelDuration={travelDuration}
        />
      </Canvas>

      {/* Quiz Modal */}
      {showQuiz && <QuizModal organId={currentOrgan} onAnswer={handleQuizAnswer} />}

      {/* Feedback toast */}
      {feedback && (
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-xl font-semibold z-40 ${
          feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Header UI */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-auto">
          <span className="text-orange-400 font-bold">🏆 {score}</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
          <span className="text-gray-300 text-sm">{visitedOrgans.length}/{ORGANS.length}</span>
        </div>
        <button onClick={handleReset}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition pointer-events-auto">
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Current organ info */}
      {!showQuiz && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: ORGANS[currentOrganIndex]?.color + '30' }}>
                <div className="w-6 h-6 rounded-full animate-pulse" style={{ backgroundColor: ORGANS[currentOrganIndex]?.color }} />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{ORGANS[currentOrganIndex]?.name}</p>
                <p className="text-gray-400 text-sm">{ORGANS[currentOrganIndex]?.process}</p>
              </div>
              {!visitedOrgans.includes(currentOrgan) && (
                <button onClick={() => setShowQuiz(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition">
                  <Play className="w-4 h-4" /> Trả lời
                </button>
              )}
            </div>
            <ul className="text-gray-400 text-xs space-y-0.5 mt-2">
              {ORGANS[currentOrganIndex]?.facts.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
