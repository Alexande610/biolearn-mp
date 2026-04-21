// MicroscopeView.jsx - Góc nhìn kính hiển vi với vi sinh vật di chuyển
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Thông tin vi sinh vật
const MICROORGANISMS = {
  amoeba: {
    name: 'Trùng biến hình (Amoeba)',
    description: 'Động vật nguyên sinh, di chuyển bằng chân giả, ăn vi khuẩn và tảo',
    color: '#a78bfa'
  },
  paramecium: {
    name: 'Trùng đế giày (Paramecium)',
    description: 'Động vật nguyên sinh có lông mao, di chuyển xoay tròn',
    color: '#22d3ee'
  },
  euglena: {
    name: 'Trùng roi (Euglena)',
    description: 'Vừa quang hợp vừa dị dưỡng, có roi để di chuyển',
    color: '#4ade80'
  },
  bacteria: {
    name: 'Vi khuẩn (Bacteria)',
    description: 'Sinh vật đơn bào nhân sơ, có nhiều hình dạng khác nhau',
    color: '#fbbf24'
  },
  spirogyra: {
    name: 'Tảo xoắn (Spirogyra)',
    description: 'Tảo lục sợi, có lục lạp xoắn đặc trưng',
    color: '#16a34a'
  }
};

// Component Amoeba (trùng biến hình)
function Amoeba({ position, onClick, isSelected }) {
  const meshRef = useRef();
  const [vertices, setVertices] = useState([]);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta;
    if (meshRef.current) {
      // Di chuyển chậm
      meshRef.current.position.x += Math.sin(time.current * 0.5) * 0.002;
      meshRef.current.position.z += Math.cos(time.current * 0.3) * 0.002;
      
      // Biến dạng hình dạng
      const geometry = meshRef.current.geometry;
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const offset = Math.sin(time.current * 2 + i * 0.1) * 0.05;
        positions.setXYZ(i, x + offset * 0.1, y, z + offset * 0.1);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={position} onClick={() => onClick('amoeba')}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial 
        color={isSelected === 'amoeba' ? '#c4b5fd' : MICROORGANISMS.amoeba.color}
        transparent
        opacity={0.7}
      />
      {/* Nhân */}
      <mesh position={[0.1, 0, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      {/* Không bào co bóp */}
      <mesh position={[-0.15, 0.1, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#c084fc" transparent opacity={0.5} />
      </mesh>
    </mesh>
  );
}

// Component Paramecium (trùng đế giày)
function Paramecium({ position, onClick, isSelected }) {
  const groupRef = useRef();
  const time = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Di chuyển theo đường cong
      groupRef.current.position.x = position[0] + Math.sin(time.current * 0.8) * 0.5;
      groupRef.current.position.z = position[2] + Math.cos(time.current * 0.6) * 0.3;
      // Xoay khi di chuyển
      groupRef.current.rotation.y = time.current * 2;
      groupRef.current.rotation.z = Math.sin(time.current) * 0.2;
    }
  });

  // Tạo lông mao
  const cilia = useMemo(() => {
    const count = 40;
    const result = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      result.push({
        position: [Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.1],
        rotation: [0, 0, angle]
      });
    }
    return result;
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {/* Thân hình đế giày */}
      <mesh onClick={() => onClick('paramecium')}>
        <capsuleGeometry args={[0.15, 0.5, 8, 16]} />
        <meshStandardMaterial 
          color={isSelected === 'paramecium' ? '#67e8f9' : MICROORGANISMS.paramecium.color}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Nhân lớn */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      {/* Nhân nhỏ */}
      <mesh position={[0.05, 0.1, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
      {/* Lông mao */}
      {cilia.map((c, i) => (
        <mesh key={i} position={c.position} rotation={c.rotation}>
          <cylinderGeometry args={[0.005, 0.005, 0.08, 4]} />
          <meshStandardMaterial color="#a5f3fc" />
        </mesh>
      ))}
    </group>
  );
}

// Component Euglena (trùng roi)
function Euglena({ position, onClick, isSelected }) {
  const groupRef = useRef();
  const flagellumRef = useRef();
  const time = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Di chuyển hướng ánh sáng
      groupRef.current.position.x = position[0] + Math.sin(time.current * 0.4) * 0.8;
      groupRef.current.position.z = position[2] + Math.cos(time.current * 0.5) * 0.4;
      groupRef.current.rotation.y = time.current * 0.5;
    }
    if (flagellumRef.current) {
      // Roi quất qua lại
      flagellumRef.current.rotation.x = Math.sin(time.current * 10) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Thân hình giọt nước */}
      <mesh onClick={() => onClick('euglena')}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={isSelected === 'euglena' ? '#86efac' : MICROORGANISMS.euglena.color}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Lục lạp */}
      {[0.05, -0.05].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, i * 0.5, 0]}>
          <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      ))}
      {/* Điểm mắt (cảm quang) */}
      <mesh position={[0.15, 0.08, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Roi */}
      <group ref={flagellumRef} position={[0.2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.01, 0.005, 0.3, 4]} />
          <meshStandardMaterial color="#bbf7d0" />
        </mesh>
      </group>
    </group>
  );
}

// Component Vi khuẩn (nhiều hình dạng)
function Bacteria({ position, type = 'rod', onClick, isSelected }) {
  const groupRef = useRef();
  const time = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Di chuyển ngẫu nhiên
      groupRef.current.position.x = position[0] + Math.sin(time.current * 2) * 0.3;
      groupRef.current.position.z = position[2] + Math.cos(time.current * 1.5) * 0.2;
      groupRef.current.rotation.z = time.current * 3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh onClick={() => onClick('bacteria')}>
        {type === 'rod' ? (
          <capsuleGeometry args={[0.05, 0.15, 4, 8]} />
        ) : type === 'sphere' ? (
          <sphereGeometry args={[0.08, 8, 8]} />
        ) : (
          <torusGeometry args={[0.08, 0.03, 8, 16, Math.PI * 1.5]} />
        )}
        <meshStandardMaterial 
          color={isSelected === 'bacteria' ? '#fde047' : MICROORGANISMS.bacteria.color}
        />
      </mesh>
    </group>
  );
}

// Component Tảo xoắn
function Spirogyra({ position, onClick, isSelected }) {
  const groupRef = useRef();
  const time = useRef(0);

  const spiralPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      points.push(new THREE.Vector3(
        Math.cos(t * Math.PI * 6) * 0.1,
        t * 2 - 1,
        Math.sin(t * Math.PI * 6) * 0.1
      ));
    }
    return points;
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(spiralPoints), [spiralPoints]);

  useFrame((state, delta) => {
    time.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = time.current * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Sợi tảo */}
      <mesh onClick={() => onClick('spirogyra')}>
        <tubeGeometry args={[curve, 64, 0.08, 8, false]} />
        <meshStandardMaterial 
          color={isSelected === 'spirogyra' ? '#4ade80' : MICROORGANISMS.spirogyra.color}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Lục lạp xoắn bên trong */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.04, 8, false]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
}

// Hiệu ứng kính hiển vi
function MicroscopeEffect() {
  return (
    <>
      {/* Vòng tròn kính hiển vi */}
      <mesh position={[0, 0, -2]} rotation={[0, 0, 0]}>
        <ringGeometry args={[3.5, 5, 64]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// Scene chính
function MicroscopeScene({ onOrganismClick, selectedOrganism }) {
  return (
    <>
      {/* Nền nước */}
      <mesh position={[0, 0, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0c4a6e" transparent opacity={0.3} />
      </mesh>

      {/* Vi sinh vật */}
      <Amoeba position={[-1, 0, 0]} onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Paramecium position={[1, 0, 0.5]} onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Euglena position={[0, 0, -0.5]} onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Spirogyra position={[1.5, 0, -0.8]} onClick={onOrganismClick} isSelected={selectedOrganism} />
      
      {/* Vi khuẩn (nhiều con) */}
      <Bacteria position={[-1.5, 0, 0.8]} type="rod" onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Bacteria position={[-0.5, 0, 1]} type="sphere" onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Bacteria position={[0.5, 0, 0.8]} type="spiral" onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Bacteria position={[-1, 0, -1]} type="rod" onClick={onOrganismClick} isSelected={selectedOrganism} />
      <Bacteria position={[1.2, 0, 1.2]} type="sphere" onClick={onOrganismClick} isSelected={selectedOrganism} />

      {/* Hiệu ứng kính hiển vi */}
      <MicroscopeEffect />
    </>
  );
}

// Component chính
export default function MicroscopeView({ 
  width = "100%", 
  height = "100%",
  showInfo = true,
  backgroundColor = "#0a1628"
}) {
  const [selectedOrganism, setSelectedOrganism] = useState(null);

  const handleOrganismClick = (organism) => {
    setSelectedOrganism(organism === selectedOrganism ? null : organism);
  };

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      <div style={{ width: '100%', height: '100%', background: backgroundColor, overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 3, 3], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 5, 5]} intensity={1} color="#ffffff" />
          <pointLight position={[0, -5, 0]} intensity={0.3} color="#22d3ee" />
          
          <MicroscopeScene 
            onOrganismClick={handleOrganismClick}
            selectedOrganism={selectedOrganism}
          />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={true}
            minDistance={2}
            maxDistance={8}
          />
        </Canvas>
      </div>

      {/* Thông tin độ phóng đại - đặt thấp hơn để không bị che */}
      <div className="absolute top-16 right-4 bg-black/70 rounded-lg px-3 py-2 text-white text-sm z-10">
        🔬 x400
      </div>

      {/* Panel thông tin vi sinh vật */}
      {showInfo && selectedOrganism && MICROORGANISMS[selectedOrganism] && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-xl p-4 text-white">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">
            {MICROORGANISMS[selectedOrganism].name}
          </h3>
          <p className="text-sm text-gray-300">
            {MICROORGANISMS[selectedOrganism].description}
          </p>
        </div>
      )}

      {/* Hướng dẫn */}
      {showInfo && !selectedOrganism && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
          👆 Click vào vi sinh vật để xem thông tin
        </div>
      )}
    </div>
  );
}

export { MicroscopeScene, MICROORGANISMS };
