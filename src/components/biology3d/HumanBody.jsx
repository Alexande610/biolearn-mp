// HumanBody.jsx - Mô hình giải phẫu cơ thể người 3D từ GLB thật
import { useRef, useState, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// Danh sách mô hình GLB giải phẫu
// Danh sách mô hình GLB giải phẫu (Cloudinary + Local Fallback)
const ANATOMY_MODELS = {
  airways: {
    name: 'Giải phẫu Đường hô hấp',
    description: 'Cấu trúc chi tiết đường dẫn khí: mũi, hầu, thanh quản, khí quản, phế quản và phổi.',
    path: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607142/anatomy_of_the_airways.glb',
    localPath: '/models/anatomy_of_the_airways.glb',
    color: '#3b82f6',
    icon: '🫁',
    category: 'Hệ hô hấp',
    details: [
      'Mũi & xoang: lọc, ấm, làm ẩm không khí',
      'Thanh quản: chứa dây thanh, tạo giọng nói',
      'Khí quản: ống dẫn khí chính (10-12cm)',
      'Phế quản → Tiểu phế quản → Phế nang',
      'Phổi: ~300 triệu phế nang, trao đổi O₂/CO₂'
    ]
  },
  abdomen: {
    name: 'Giải phẫu Ổ bụng',
    description: 'Giải phẫu chi tiết ổ bụng: dạ dày, ruột non, ruột già, gan, túi mật, tuyến tụy, lách và thận.',
    path: 'https://res.cloudinary.com/de513yqvf/raw/upload/v1776607140/abdomen_anatomy.glb',
    localPath: '/models/abdomen_anatomy.glb',
    color: '#e879f9',
    icon: '🫀',
    category: 'Hệ tiêu hóa',
    details: [
      'Dạ dày: tiêu hóa cơ học và hóa học (HCl, pepsin)',
      'Ruột non: hấp thu dinh dưỡng chính (~6m)',
      'Ruột già: hấp thu nước, tạo phân (~1.5m)',
      'Gan: chuyển hóa, giải độc, sản xuất mật',
      'Tuyến tụy: tiết enzyme tiêu hóa + insulin',
      'Thận: lọc máu, tạo nước tiểu, cân bằng nội môi'
    ]
  }
};

// Auto-fit model to viewport
function AutoFitModel({ children }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    if (!groupRef.current || fitted) return;
    
    // Đợi 1 frame để mesh load xong
    const timer = setTimeout(() => {
      if (!groupRef.current) return;
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      if (size.length() === 0) return;

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.5 / maxDim;
      
      groupRef.current.scale.setScalar(scale);
      
      // Recalculate center after scaling
      const newBox = new THREE.Box3().setFromObject(groupRef.current);
      const newCenter = newBox.getCenter(new THREE.Vector3());
      groupRef.current.position.sub(newCenter);
      
      camera.position.set(0, 0.5, 5);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      
      setFitted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [camera, fitted, children]);

  return <group ref={groupRef}>{children}</group>;
}

// GLB Model Loader Component  
function AnatomyGLBModel({ modelPath, fallbackPath }) {
  const groupRef = useRef();
  
  // useGLTF - trying Cloudinary (primary)
  // We'll use local as fallback ONLY if Cloudinary fails, but handling it via ErrorBoundary
  // is cleaner for Suspenseful hooks. For now, let's just use the path.
  const { scene } = useGLTF(modelPath);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.envMapIntensity = 0.8;
          child.material.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene]);

  // Không dùng animation frame để xoay model - để OrbitControls autoRotate xử lý
  // Điều này tránh model bị trôi/rung khi autoRotate

  return (
    <AutoFitModel>
      <group ref={groupRef}>
        <primitive object={clonedScene} />
      </group>
    </AutoFitModel>
  );
}

// Scene for a specific anatomy model
function AnatomyScene({ modelKey }) {
  const model = ANATOMY_MODELS[modelKey];
  if (!model) return null;

  return (
    <>
      {/* Lighting setup cho mô hình giải phẫu - điều chỉnh cho nền tối */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.8} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.7} color="#b0c4de" />
      <pointLight position={[0, -3, 2]} intensity={0.4} color="#ffddcc" />
      
      {/* Environment for realistic reflections */}
      <Environment preset="studio" />
      
      {/* The GLB Model */}
      <Suspense fallback={
        <Html center>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white text-sm">Đ đang tải mô hình 3D...</p>
          </div>
        </Html>
      }>
        <AnatomyGLBModel 
          modelPath={model.path}
          fallbackPath={model.localPath}
        />
      </Suspense>

      {/* Shadow */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4} 
      />
    </>
  );
}

// Component chính - Giải phẫu cơ thể người
export default function HumanBody({ 
  width = "100%", 
  height = "100%",
  showInfo = true,
  backgroundColor = "#0a0a1a"
}) {
  const [selectedModel, setSelectedModel] = useState('airways');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Validate backgroundColor - THREE.js cannot use 'transparent' or invalid values
  const validBg = (backgroundColor && backgroundColor.startsWith('#') && backgroundColor.length >= 4) 
    ? backgroundColor 
    : '#0a0a1a';

  const currentModel = ANATOMY_MODELS[selectedModel];

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '100%', background: validBg, overflow: 'hidden' }}>
        <Canvas 
          camera={{ position: [0, 0.5, 5], fov: 45 }}
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={[validBg]} />
          
          <AnatomyScene 
            key={selectedModel}
            modelKey={selectedModel}
          />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={true}
            minDistance={1.5}
            maxDistance={12}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.8}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
          />
        </Canvas>
      </div>

      {/* Model selector - bên phải */}
      <div className="absolute top-16 right-3 flex flex-col gap-2 z-10 max-h-[calc(100%-130px)] overflow-y-auto">
        {Object.entries(ANATOMY_MODELS).map(([key, model]) => (
          <button
            key={key}
            onClick={() => { setSelectedModel(key); setShowDetails(false); }}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
              selectedModel === key
                ? 'bg-white text-gray-900 shadow-lg'
                : 'bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm'
            }`}
            style={{ borderLeft: `4px solid ${model.color}` }}
          >
            <span className="mr-1">{model.icon}</span>
            <span className="hidden sm:inline">{model.name.length > 20 ? model.name.substring(0, 20) + '...' : model.name}</span>
            <span className="sm:hidden">{model.icon}</span>
          </button>
        ))}

        {/* Auto rotate toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-2 rounded-lg text-xs transition-all ${
            autoRotate ? 'bg-blue-500/80 text-white' : 'bg-black/50 text-gray-300'
          }`}
        >
          🔄 {autoRotate ? 'Xoay' : 'Dừng'}
        </button>
      </div>

      {/* Panel thông tin */}
      {showInfo && currentModel && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xl">{currentModel.icon}</span>
                  <h3 className="text-lg font-bold" style={{ color: currentModel.color }}>
                    {currentModel.name}
                  </h3>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
                    {currentModel.category}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {currentModel.description}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex-shrink-0 px-3 py-1.5 bg-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/20 transition"
              >
                {showDetails ? '▲ Ẩn' : '▼ Chi tiết'}
              </button>
            </div>
            
            {/* Details */}
            {showDetails && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">📋 Kiến thức sinh học:</p>
                <ul className="space-y-1">
                  {currentModel.details.map((detail, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-600 mt-2">
              📦 Mô hình 3D thật • Kéo để xoay • Scroll để zoom
            </p>
          </div>
        </div>
      )}

      {/* Credits badge */}
      <div className="absolute top-16 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🏥 Mô hình giải phẫu 3D thật</p>
      </div>
    </div>
  );
}

export { ANATOMY_MODELS, AnatomyScene, AnatomyGLBModel };
