// OxygenJourneyGame3D.jsx - Hành trình Oxy 3D (Lớp 8)
// GLB models + Sound effects for each organ station
import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Sparkles, Play, Heart } from 'lucide-react';

// Các trạm - dàn rộng 6 units giữa mỗi trạm để GLB models lớn không chồng
const STATIONS = [
  { id: 'lungs', name: 'Phổi', description: 'O₂ từ không khí vào phế nang', position: [-15, 2, 0], color: '#3b82f6' },
  { id: 'pulmonary_vein', name: 'Tĩnh mạch phổi', description: 'Máu giàu O₂ về tim', position: [-9, -1, 0], color: '#ef4444' },
  { id: 'left_heart', name: 'Tim trái', description: 'Tâm thất trái bơm máu đi', position: [-3, 2, 0], color: '#dc2626' },
  { id: 'aorta', name: 'Động mạch chủ', description: 'Máu đi khắp cơ thể', position: [3, -1, 0], color: '#f97316' },
  { id: 'arteries', name: 'Động mạch', description: 'Phân nhánh đến các mô', position: [9, 2, 0], color: '#eab308' },
  { id: 'capillaries', name: 'Mao mạch', description: 'Trao đổi O₂ với tế bào', position: [15, -1, 0], color: '#22c55e' },
  { id: 'cells', name: 'Tế bào', description: 'O₂ được sử dụng cho hô hấp', position: [21, 2, 0], color: '#06b6d4' },
];

// Âm thanh cho mỗi trạm
const STATION_SOUNDS = {
  lungs: '/music/whoosh.mp3',
  pulmonary_vein: '/music/gentle liquid flow.mp3',
  left_heart: '/music/heartbeat.mp3',
  aorta: '/music/liquid flow.mp3',
  arteries: '/music/tiny bubble.mp3',
  capillaries: '/music/magic sparkle.mp3',
  cells: '/music/magic sparkle.mp3',
};

// Models GLB — targetSize (world units) sẽ tự động scale bằng bounding box
// Models GLB (Cloudinary + Local Fallback)
const ORGAN_MODELS = {
  lungs: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611646/lung.glb', fallbackUrl: '/models/organs/lung.glb', targetSize: 3, anim: 'breathe' },
  left_heart: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611645/heart.glb', fallbackUrl: '/models/organs/heart.glb', targetSize: 2.5, anim: 'beat' },
  aorta: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611640/arota.glb', fallbackUrl: '/models/organs/arota.glb', targetSize: 2.5, anim: 'pulse' },
  arteries: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611641/artery.glb', fallbackUrl: '/models/organs/artery.glb', targetSize: 3, anim: 'pulse' },
  capillaries: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611643/capillary_network.glb', fallbackUrl: '/models/organs/capillary_network.glb', targetSize: 3, anim: 'pulse' },
  cells: { url: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776611642/body%20cell.glb', fallbackUrl: '/models/organs/body cell.glb', targetSize: 2.5, anim: 'pulse' },
};

// =============== 3D ORGAN (GLB — Auto Center & Auto Scale) ===============

function OrganGLB({ modelKey, position, isActive, isVisited, stationColor }) {
  const config = ORGAN_MODELS[modelKey];
  // Simplest usage to avoid hook errors in React 19
  const { scene } = useGLTF(config.url);
  const groupRef = useRef();
  const baseScaleRef = useRef(1);

  const { clonedScene, autoScale, centerOffset } = useMemo(() => {
    const clone = scene.clone(true);
    // Tính bounding box CHỈ từ mesh (bỏ qua bones/empties)
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
          child.material.emissive = new THREE.Color(stationColor || '#3b82f6');
          child.material.emissiveIntensity = 0.4;
        } else if (isVisited) {
          child.material.emissive = new THREE.Color('#22c55e');
          child.material.emissiveIntensity = 0.25;
        } else {
          child.material.emissive = new THREE.Color(stationColor || '#3b82f6');
          child.material.emissiveIntensity = 0.1;
        }
      }
    });
  }, [isActive, isVisited, clonedScene, stationColor]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const base = baseScaleRef.current;
    if (config.anim === 'breathe') {
      groupRef.current.scale.setScalar(base * (1 + Math.sin(t * 0.8) * 0.06));
    } else if (config.anim === 'beat') {
      groupRef.current.scale.setScalar(base * (1 + Math.sin(t * 6) * 0.1));
    } else if (config.anim === 'pulse') {
      groupRef.current.scale.setScalar(base * (1 + Math.sin(t * 2) * 0.04));
    }
    if (isActive) groupRef.current.rotation.y += 0.005;
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
          <meshBasicMaterial color={stationColor || '#3b82f6'} transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
}

// Tĩnh mạch phổi - tube geometry (không có GLB)
function PulmonaryVein3D({ position, isActive, isVisited }) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(0, 0.5, 0.3),
      new THREE.Vector3(1.2, 0, 0),
    ]);
  }, []);

  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.25, 16, false]} />
        <meshStandardMaterial
          color={isActive ? '#f87171' : isVisited ? '#22c55e' : '#ef4444'}
          metalness={0.3}
          roughness={0.5}
          emissive={isActive ? '#ef4444' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      {isActive && (
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
}

// =============== O2 MOLECULE ===============

function OxygenMolecule({ position, visitedStations, travelDuration = 2 }) {
  const ref = useRef();
  const startPos = useRef(new THREE.Vector3(...position));
  const targetPos = useRef(new THREE.Vector3(...position));
  const animStartTime = useRef(-1);
  const durRef = useRef(travelDuration);

  // Tìm vị trí hiện tại dựa trên visited stations
  const currentStation = useMemo(() => {
    if (visitedStations.length === 0) return STATIONS[0];
    const lastVisited = visitedStations[visitedStations.length - 1];
    const idx = STATIONS.findIndex(s => s.id === lastVisited);
    return STATIONS[Math.min(idx + 1, STATIONS.length - 1)];
  }, [visitedStations]);

  // Khi station thay đổi → bắt đầu animation mới, thời gian = travelDuration (sync với âm thanh)
  useEffect(() => {
    targetPos.current.set(...currentStation.position);
    animStartTime.current = -1; // đánh dấu cần lấy startTime ở frame tiếp theo
    durRef.current = travelDuration;
  }, [currentStation, travelDuration]);

  useFrame((state) => {
    if (!ref.current) return;

    // Lấy vị trí bắt đầu ở frame đầu tiên sau khi target thay đổi
    if (animStartTime.current < 0) {
      startPos.current.copy(ref.current.position);
      animStartTime.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - animStartTime.current;
    const t = Math.min(elapsed / durRef.current, 1);
    // Smoothstep cho chuyển động tự nhiên (tăng tốc rồi giảm tốc)
    const smoothT = t * t * (3 - 2 * t);

    ref.current.position.lerpVectors(startPos.current, targetPos.current, smoothT);

    // Floating animation
    ref.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.003;
    ref.current.rotation.z = state.clock.elapsedTime * 2;
  });

  return (
    <Float speed={3} floatIntensity={0.2}>
      <group ref={ref} position={position}>
        {/* O atom 1 */}
        <mesh position={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444" 
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        {/* O atom 2 */}
        <mesh position={[0.1, 0, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444" 
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        {/* Bond */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
          <meshStandardMaterial color="#fca5a5" />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

// =============== BLOOD PATH ===============

function BloodPath({ visitedStations }) {
  const pathCurve = useMemo(() => {
    const points = STATIONS.map(s => new THREE.Vector3(...s.position));
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  return (
    <group>
      {/* Đường đi chính - màu nhạt */}
      <mesh>
        <tubeGeometry args={[pathCurve, 200, 0.06, 8, false]} />
        <meshStandardMaterial 
          color="#7f1d1d" 
          transparent 
          opacity={0.4}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      {/* Đường đã đi qua - màu đậm */}
      {visitedStations.length > 0 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(
              STATIONS.slice(0, visitedStations.length + 1).map(s => new THREE.Vector3(...s.position)),
              false, 'catmullrom', 0.5
            ),
            100, 0.08, 8, false
          ]} />
          <meshStandardMaterial 
            color="#dc2626" 
            emissive="#ef4444"
            emissiveIntensity={0.3}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

// =============== RENDER STATION BY TYPE ===============

function RenderStation({ station, isActive, isVisited }) {
  // Nếu có GLB model → dùng OrganGLB
  if (ORGAN_MODELS[station.id]) {
    return <OrganGLB modelKey={station.id} position={station.position} isActive={isActive} isVisited={isVisited} stationColor={station.color} />;
  }
  // Tĩnh mạch phổi → tube geometry
  if (station.id === 'pulmonary_vein') {
    return <PulmonaryVein3D position={station.position} isActive={isActive} isVisited={isVisited} />;
  }
  return null;
}

// =============== CAMERA RIG — theo dõi O₂ ===============

function CameraRig({ currentStationIndex }) {
  const controlsRef = useRef();
  const targetVec = useRef(new THREE.Vector3(...STATIONS[0].position));

  useFrame((state) => {
    if (!controlsRef.current) return;
    const pos = STATIONS[currentStationIndex]?.position || STATIONS[0].position;
    targetVec.current.set(...pos);
    // Mượt di chuyển target
    controlsRef.current.target.lerp(targetVec.current, 0.04);
    // Mượt di chuyển camera theo target
    const desiredCam = targetVec.current.clone().add(new THREE.Vector3(0, 2, 8));
    state.camera.position.lerp(desiredCam, 0.03);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableRotate={true}
      enableZoom={true}
      minDistance={4}
      maxDistance={20}
    />
  );
}

// =============== MAIN SCENE ===============

function JourneyScene({ currentStation, currentStationIndex, visitedStations, showQuiz, travelDuration }) {
  return (
    <>
      {/* Ánh sáng mạnh - không dùng Environment preset (gây trắng màn hình) */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} />
      <directionalLight position={[-8, 10, -5]} intensity={1.0} />
      <directionalLight position={[0, -5, 10]} intensity={0.6} />
      <pointLight position={[-10, 8, 8]} intensity={0.8} color="#ef4444" />
      <pointLight position={[10, -5, 8]} intensity={0.6} color="#3b82f6" />
      <hemisphereLight args={['#ffffff', '#1e3a5f', 1.0]} />
      
      {/* Blood path */}
      <BloodPath visitedStations={visitedStations} />
      
      {/* Stations */}
      {STATIONS.map((station) => (
        <RenderStation
          key={station.id}
          station={station}
          isActive={currentStation === station.id && !showQuiz}
          isVisited={visitedStations.includes(station.id)}
        />
      ))}
      
      {/* O2 Molecule */}
      <OxygenMolecule 
        position={STATIONS[0].position}
        visitedStations={visitedStations}
        travelDuration={travelDuration}
      />
      
      {/* Camera follow */}
      <CameraRig currentStationIndex={currentStationIndex} />
    </>
  );
}

// =============== QUIZ MODAL - RIÊNG BIỆT ===============

function QuizModal({ station, onAnswer }) {
  const questions = {
    lungs: { q: 'Tại phổi, O₂ đi vào đâu?', options: ['Phế nang', 'Khí quản', 'Phế quản'], correct: 0 },
    pulmonary_vein: { q: 'Tĩnh mạch phổi mang máu gì?', options: ['Máu nghèo O₂', 'Máu giàu O₂', 'Bạch huyết'], correct: 1 },
    left_heart: { q: 'Tim trái bơm máu đi đâu?', options: ['Phổi', 'Toàn thân', 'Não'], correct: 1 },
    aorta: { q: 'Động mạch chủ xuất phát từ?', options: ['Tâm nhĩ phải', 'Tâm thất trái', 'Tâm nhĩ trái'], correct: 1 },
    arteries: { q: 'Động mạch mang máu gì?', options: ['Giàu O₂', 'Nghèo O₂', 'Cả hai'], correct: 0 },
    capillaries: { q: 'Mao mạch có chức năng gì?', options: ['Bơm máu', 'Trao đổi chất', 'Lọc máu'], correct: 1 },
    cells: { q: 'Tế bào dùng O₂ để làm gì?', options: ['Quang hợp', 'Hô hấp tế bào', 'Phân bào'], correct: 1 },
  };
  
  const data = questions[station];
  const stationInfo = STATIONS.find(s => s.id === station);
  if (!data || !stationInfo) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
        {/* Header với màu của station */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: stationInfo.color + '30' }}
          >
            <div 
              className="w-5 h-5 rounded-full animate-pulse"
              style={{ backgroundColor: stationInfo.color }}
            />
          </div>
          <div>
            <span 
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: stationInfo.color, color: '#fff' }}
            >
              O₂
            </span>
            <h3 className="text-white font-bold mt-1">{stationInfo.name}</h3>
          </div>
        </div>
        
        {/* Question */}
        <p className="text-gray-200 mb-5 text-base">{data.q}</p>
        
        {/* Options */}
        <div className="space-y-3">
          {data.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(i === data.correct)}
              className="w-full p-4 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-white rounded-xl text-left transition-all duration-200 flex items-center gap-3"
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
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

export default function OxygenJourneyGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [visitedStations, setVisitedStations] = useState([]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [travelDuration, setTravelDuration] = useState(2);
  const soundsRef = useRef({});

  const currentStation = STATIONS[currentStationIndex]?.id;

  // Preload sounds - đọc sfxVolume từ localStorage
  useEffect(() => {
    const savedSfxMuted = localStorage.getItem('sfxMuted') === 'true';
    const savedSfxVol = localStorage.getItem('sfxVolume');
    const sfxVol = savedSfxMuted ? 0 : (savedSfxVol !== null ? Number(savedSfxVol) / 100 : 0.5);

    Object.entries(STATION_SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = sfxVol;
      soundsRef.current[key] = audio;
    });
    return () => {
      Object.values(soundsRef.current).forEach(a => { a.pause(); a.src = ''; });
    };
  }, []);

  // Play sound khi đổi station + đồng bộ thời gian di chuyển O₂ với âm thanh
  useEffect(() => {
    if (currentStation && soundsRef.current[currentStation]) {
      Object.values(soundsRef.current).forEach(a => { a.pause(); a.currentTime = 0; });
      const audio = soundsRef.current[currentStation];
      // Lấy duration âm thanh để sync với animation O₂
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
  }, [currentStation]);

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 100);
      setVisitedStations(prev => [...prev, currentStation]);
      setFeedback({ type: 'success', message: 'Đúng rồi! 🎉' });
      setShowQuiz(false);
      
      setTimeout(() => {
        setFeedback(null);
        if (currentStationIndex < STATIONS.length - 1) {
          setCurrentStationIndex(prev => prev + 1);
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
    setCurrentStationIndex(0);
    setVisitedStations([]);
    setScore(0);
    setGameComplete(false);
    setShowQuiz(false);
    setFeedback(null);
    setShowTutorial(true);
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Hành trình Oxy 3D</h2>
          <p className="text-gray-300 text-sm mb-4">
            Theo dõi phân tử O₂ từ phổi đến tế bào qua hệ tuần hoàn!
          </p>
          
          <div className="bg-white/5 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-red-400 mb-3 font-semibold">🩸 Đường đi của O₂:</p>
            <div className="flex flex-wrap gap-1 text-xs">
              {STATIONS.map((s, i) => (
                <span key={s.id} className="flex items-center gap-1">
                  <span 
                    className="px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: s.color + '40', color: s.color }}
                  >
                    {s.name}
                  </span>
                  {i < STATIONS.length - 1 && <span className="text-gray-500">→</span>}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-gray-400 text-xs mb-4">
            🖱️ Kéo để xoay | Scroll để zoom
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Game Complete
  if (gameComplete) {
    const stars = score >= 600 ? 3 : score >= 400 ? 2 : 1;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">O₂ đã đến Tế bào! 🎉</h2>
          
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3].map(i => (
              <Sparkles key={i} className={`w-8 h-8 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-3xl font-bold text-red-400">{score}</p>
            <p className="text-xs text-gray-400">Điểm số</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition"
            >
              <RotateCcw className="w-4 h-4" /> Chơi lại
            </button>
            <button
              onClick={() => onComplete(score)}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition"
            >
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
      <Canvas
        camera={{ position: [-15, 4, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0f172a']} />
        <JourneyScene
          currentStation={currentStation}
          currentStationIndex={currentStationIndex}
          visitedStations={visitedStations}
          showQuiz={showQuiz}
          travelDuration={travelDuration}
        />
      </Canvas>

      {/* Quiz Modal - hiển thị riêng biệt, không bị chèn */}
      {showQuiz && <QuizModal station={currentStation} onAnswer={handleQuizAnswer} />}

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
          <span className="text-red-400 font-bold">🏆 {score}</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
          <span className="text-gray-300 text-sm">{visitedStations.length}/{STATIONS.length}</span>
        </div>
        <button 
          onClick={handleReset} 
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition pointer-events-auto"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Current station info - ở dưới cùng */}
      {!showQuiz && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: STATIONS[currentStationIndex]?.color + '30' }}
              >
                <div 
                  className="w-6 h-6 rounded-full animate-pulse"
                  style={{ backgroundColor: STATIONS[currentStationIndex]?.color }}
                />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{STATIONS[currentStationIndex]?.name}</p>
                <p className="text-gray-400 text-sm">{STATIONS[currentStationIndex]?.description}</p>
              </div>
              {!visitedStations.includes(currentStation) && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition"
                >
                  <Play className="w-4 h-4" /> Trả lời
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
