// CellAssemblyGame3D.jsx - Game lắp ghép tế bào 3D (Lớp 6)
// Thiết kế lại toàn bộ bào quan 3D theo giải phẫu sinh học thực tế: Nhân lộ nhân con, ti thể có nếp gấp, lục lạp có đĩa thylakoid xếp cột, lưới nội chất đính hạt, Golgi xếp nếp, thành tế bào lục giác 3D cứng cáp.

import { useState, useRef, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Trophy, ArrowRight, Check, Sparkles, HelpCircle } from 'lucide-react';

// Định nghĩa các bào quan khoa học
const ORGANELLES = {
  nucleus: {
    id: 'nucleus', name: 'Nhân tế bào', description: 'Chứa chất di truyền ADN, trung tâm điều khiển mọi hoạt động sống của tế bào',
    color: '#8b5cf6', position: [0, 0, 0], size: 0.6, inAnimal: true, inPlant: true
  },
  mitochondria: {
    id: 'mitochondria', name: 'Ti thể', description: 'Nhà máy năng lượng của tế bào, thực hiện hô hấp tế bào để sản sinh năng lượng ATP',
    color: '#ef4444', position: [1.1, 0.5, 0.2], size: 0.3, inAnimal: true, inPlant: true
  },
  ribosome: {
    id: 'ribosome', name: 'Ribosome', description: 'Bào quan nhỏ bé không màng, chịu trách nhiệm tổng hợp protein cho tế bào',
    color: '#f59e0b', position: [-0.9, -0.6, 0.5], size: 0.16, inAnimal: true, inPlant: true
  },
  er: {
    id: 'er', name: 'Lưới nội chất', description: 'Hệ thống màng xếp nếp vận chuyển chất hữu cơ, lưới hạt tổng hợp protein, lưới trơn tổng hợp lipid',
    color: '#10b981', position: [0.6, -0.5, -0.3], size: 0.38, inAnimal: true, inPlant: true
  },
  golgi: {
    id: 'golgi', name: 'Bộ máy Golgi', description: 'Trung tâm đóng gói, chế biến và phân phối các sản phẩm hữu cơ xuất khẩu của tế bào',
    color: '#3b82f6', position: [-1.0, 0.6, -0.2], size: 0.35, inAnimal: true, inPlant: true
  },
  lysosome: {
    id: 'lysosome', name: 'Lysosome', description: 'Bao tiêu hóa chứa enzyme mạnh phân giải các chất hữu cơ dư thừa và tế bào già lỗi',
    color: '#ec4899', position: [0.5, 0.8, 0.4], size: 0.22, inAnimal: true, inPlant: false
  },
  chloroplast: {
    id: 'chloroplast', name: 'Lục lạp', description: 'Bào quan quang hợp chứa chất diệp lục hấp thụ ánh sáng mặt trời để tạo ra đường glucose',
    color: '#22c55e', position: [-0.7, 0.2, 0.6], size: 0.38, inAnimal: false, inPlant: true
  },
  vacuole: {
    id: 'vacuole', name: 'Không bào lớn', description: 'Không bào trung tâm chứa đầy dịch tế bào giúp điều hòa áp suất thẩm thấu và trữ nước',
    color: '#06b6d4', position: [0.1, -0.3, 0.1], size: 0.95, inAnimal: false, inPlant: true
  }
};

// --- COMPONENT MÔ HÌNH BÀO QUAN CHI TIẾT GIẢI PHẪU SINH HỌC ---

// 1. Nhân tế bào cắt góc lộ nhân con
const NucleusModel = memo(function NucleusModel({ color, size, isTarget }) {
  return (
    <group>
      {/* Màng nhân ngoài cắt 1/4 góc để nhìn vào trong */}
      <mesh castShadow>
        <sphereGeometry args={[size, 32, 24, 0, Math.PI * 1.5, 0, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Lớp cắt phẳng màu đỏ cam sẫm */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[size * 0.98, 16, 12, Math.PI * 1.5, Math.PI * 0.5]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.7} />
      </mesh>
      {/* Nhân con (Nucleolus) tròn sẫm màu bên trong */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[size * 0.36, 16, 16]} />
        <meshStandardMaterial color="#311042" roughness={0.9} emissive="#4c1d95" emissiveIntensity={0.2} />
      </mesh>
      {/* Các hạt nhiễm sắc rải rác */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i) * size * 0.5, Math.cos(i) * size * 0.5, 0.05]} scale={0.4}>
          <dodecahedronGeometry args={[size * 0.2, 0]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      ))}
    </group>
  );
});

// 2. Ti thể có nếp gấp Cristae
const MitochondriaModel = memo(function MitochondriaModel({ color, size }) {
  const points = useMemo(() => {
    // Tạo màng trong uốn lượn hình răng cưa zigzag
    const pts = [];
    for (let i = 0; i < 10; i++) {
      pts.push(new THREE.Vector3(Math.sin(i * 1.5) * size * 0.4, (i / 10 - 0.5) * size * 1.4, 0));
    }
    return pts;
  }, [size]);

  return (
    <group rotation={[0.5, 0.3, 0.8]}>
      {/* Màng ngoài bao viên (Capsule) mờ trong suốt */}
      <mesh castShadow>
        <capsuleGeometry args={[size * 0.5, size * 0.9, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.45} roughness={0.2} />
      </mesh>
      {/* Lõi trong màu đỏ sẫm */}
      <mesh>
        <capsuleGeometry args={[size * 0.44, size * 0.84, 12, 12]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
      {/* Nếp gấp Cristae (Màng trong gấp nếp màu cam phát sáng) */}
      <group position={[0, 0, 0]}>
        {[-0.3, -0.15, 0, 0.15, 0.3].map((y, idx) => (
          <mesh key={idx} position={[0, y * size * 1.5, 0]} rotation={[0.4, 0, 0.2]}>
            <torusGeometry args={[size * 0.26, size * 0.06, 6, 16, Math.PI * 1.6]} />
            <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
});

// 3. Lục lạp chứa cột đĩa Thylakoid xếp Grana
const ChloroplastModel = memo(function ChloroplastModel({ color, size }) {
  return (
    <group rotation={[0.7, -0.4, 0.3]}>
      {/* Màng bọc ngoài màu lục mờ trong suốt */}
      <mesh castShadow>
        <sphereGeometry args={[size * 0.7, 24, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.45} roughness={0.3} />
      </mesh>
      {/* Thể đệm chất nền bên trong màu xanh lục sẫm */}
      <mesh scale={[0.95, 0.6, 0.95]}>
        <sphereGeometry args={[size * 0.64, 16, 16]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      {/* Các cột đĩa Thylakoid (Grana) xếp chồng màu lục nhạt phát sáng */}
      {[-0.2, 0, 0.2].map((x, colIdx) => (
        <group key={colIdx} position={[x * size * 1.0, 0, (colIdx % 2 === 0 ? 0.1 : -0.1) * size]}>
          {[-0.15, -0.05, 0.05, 0.15].map((y, discIdx) => (
            <mesh key={discIdx} position={[0, y * size * 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[size * 0.16, size * 0.16, size * 0.04, 8]} />
              <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
});

// 4. Lưới nội chất (ER) xếp nếp ôm quanh nhân
const ERModel = memo(function ERModel({ color, size }) {
  return (
    <group rotation={[0, 0.5, 0.2]}>
      {/* Các phiến màng uốn lượn xếp lớp chồng chéo */}
      {[0.7, 0.85, 1.0].map((r, i) => (
        <mesh key={i} castShadow>
          <torusGeometry args={[size * r * 0.6, size * 0.08, 6, 24, Math.PI * 1.25]} />
          <meshStandardMaterial color={color} roughness={0.5} flatShading />
        </mesh>
      ))}
      {/* Các hạt Ribosome đính trên bề mặt lưới nội chất hạt */}
      {Array.from({ length: 12 }).map((_, idx) => {
        const angle = (idx / 12) * Math.PI * 1.2;
        const radius = size * 0.55;
        return (
          <mesh key={idx} position={[Math.cos(angle) * radius, (Math.random() - 0.5) * 0.15, Math.sin(angle) * radius]} scale={0.4}>
            <sphereGeometry args={[size * 0.1, 8, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
});

// 5. Bộ máy Golgi dẹt xếp song song nảy chồi bóng vận chuyển
const GolgiModel = memo(function GolgiModel({ color, size }) {
  return (
    <group rotation={[0.4, 0.8, -0.4]}>
      {/* Các túi dẹt uốn cong hình vòng cung song song */}
      {[-0.2, -0.07, 0.07, 0.2].map((x, idx) => {
        const scaleX = 1 - Math.abs(x) * 0.5;
        return (
          <group key={idx} position={[x * size * 0.8, 0, 0]} scale={[1, scaleX, 1]}>
            <mesh castShadow>
              <torusGeometry args={[size * 0.45, size * 0.05, 6, 20, Math.PI * 0.9]} />
              <meshStandardMaterial color={color} roughness={0.4} flatShading />
            </mesh>
          </group>
        );
      })}
      {/* Các túi bóng vận chuyển (Vesicle) đang nảy chồi ở rìa bộ máy */}
      {[-0.4, 0.4].map((z, idx) => (
        <group key={idx} position={[z * size * 0.8, (idx === 0 ? 0.35 : -0.35) * size, 0]}>
          <mesh castShadow scale={0.8}>
            <sphereGeometry args={[size * 0.08, 8, 8]} />
            <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// 6. Ribosome (Các cụm kép hạt lớn hạt nhỏ)
const RibosomeModel = memo(function RibosomeModel({ color, size }) {
  return (
    <group>
      {/* Render 3 cụm Ribosome dạng hai tiểu phần (lớn & nhỏ) liên kết */}
      {[[0, 0, 0], [0.3, 0.2, -0.2], [-0.2, -0.3, 0.1]].map((offset, idx) => (
        <group key={idx} position={offset}>
          {/* Tiểu phần lớn phía trên */}
          <mesh position={[0, 0.06 * size, 0]} castShadow>
            <sphereGeometry args={[size * 0.38, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* Tiểu phần nhỏ phía dưới */}
          <mesh position={[0, -0.07 * size, 0]} castShadow>
            <sphereGeometry args={[size * 0.28, 12, 12]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// 7. Lysosome tiêu hóa
const LysosomeModel = memo(function LysosomeModel({ color, size }) {
  return (
    <group>
      {/* Lớp vỏ màng trong suốt chứa enzyme */}
      <mesh castShadow>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} roughness={0.3} />
      </mesh>
      {/* Lõi sẫm chứa hạt phân giải enzyme tròn nhỏ */}
      <mesh>
        <sphereGeometry args={[size * 0.82, 12, 12]} />
        <meshStandardMaterial color="#be185d" roughness={0.7} />
      </mesh>
      {/* Các đốm phát sáng enzyme bên trong */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * size * 0.9, (Math.random() - 0.5) * size * 0.9, (Math.random() - 0.5) * size * 0.9]} scale={0.3}>
          <sphereGeometry args={[size * 0.2, 6, 6]} />
          <meshBasicMaterial color="#fbcfe8" />
        </mesh>
      ))}
    </group>
  );
});

// 8. Không bào lớn chứa dịch
const VacuoleModel = memo(function VacuoleModel({ color, size }) {
  const shapeRef = useRef();
  
  useFrame((state) => {
    if (shapeRef.current) {
      // Co bóp nhẹ gợn sóng như túi dịch lỏng tế bào thực tế
      const t = state.clock.elapsedTime * 2.0;
      shapeRef.current.scale.set(
        1 + Math.sin(t) * 0.03,
        1 + Math.cos(t * 1.2) * 0.04,
        1 + Math.sin(t * 0.8) * 0.03
      );
    }
  });

  return (
    <group ref={shapeRef} scale={[1, 0.85, 1]}>
      {/* Khối dịch nước bán trong suốt tuyệt đẹp */}
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[size * 0.82, 2]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.55} 
          roughness={0.1} 
          metalness={0.2}
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
});

// Màng tế bào sinh động
function CellMembrane({ cellType }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const size = cellType === 'plant' ? 2.3 : 1.85;
  const color = cellType === 'plant' ? '#86efac' : '#fda4af';
  
  return (
    <mesh ref={meshRef}>
      {/* Sử dụng khối cầu kính mờ để hiển thị màng lipid kép cao cấp */}
      <sphereGeometry args={[size, 36, 36]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.16} 
        side={THREE.DoubleSide}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

// Thành tế bào thực vật lục giác 3D cứng cáp (Hexagonal/Prism Frame)
function CellWall() {
  const frameRef = useRef();
  
  return (
    <group ref={frameRef}>
      {/* Khung thành tế bào cứng cáp dày dặn bao bọc bên ngoài */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 2.8, 6, 1, true]} />
        <meshStandardMaterial 
          color="#84cc16" 
          transparent 
          opacity={0.22} 
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Khung xương chịu lực viền xanh sẫm */}
      <mesh>
        <cylinderGeometry args={[2.54, 2.54, 2.84, 6, 1, true]} />
        <meshStandardMaterial 
          color="#15803d" 
          wireframe 
          transparent 
          opacity={0.4} 
        />
      </mesh>
    </group>
  );
}

// Component tích hợp Bào quan 3D tổng hợp có logic Snap và Hover
function Organelle3D({ organelle, isPlaced, isTarget, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  // Quyết định vị trí: nếu chưa lắp ráp thì lơ lửng ngoài màng, nếu đặt đúng thì snap vào vị trí giải phẫu chuẩn
  const position = isPlaced 
    ? organelle.position 
    : [organelle.position[0] * 2.1, organelle.position[1] + 2.5, organelle.position[2] * 1.5];

  return (
    <Float speed={isPlaced ? 0.4 : 1.8} rotationIntensity={isPlaced ? 0.15 : 0.4} floatIntensity={isPlaced ? 0.08 : 0.6}>
      <group
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Vòng tương tác trong suốt giúp nhấp chọn dễ dàng */}
        <mesh 
          onClick={onClick}
          onPointerDown={onClick}
        >
          <sphereGeometry args={[organelle.size * 1.2, 12, 12]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Render mô hình 3D thực tế theo mã định danh bào quan */}
        <group>
          {organelle.id === 'nucleus' && <NucleusModel color={organelle.color} size={organelle.size} isTarget={isTarget} />}
          {organelle.id === 'mitochondria' && <MitochondriaModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'chloroplast' && <ChloroplastModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'er' && <ERModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'golgi' && <GolgiModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'ribosome' && <RibosomeModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'lysosome' && <LysosomeModel color={organelle.color} size={organelle.size} />}
          {organelle.id === 'vacuole' && <VacuoleModel color={organelle.color} size={organelle.size} />}
        </group>
        
        {/* Glow phát hào quang rực rỡ khi là bào quan cần đặt hoặc được chọn */}
        {(hovered || isTarget) && !isPlaced && (
          <mesh>
            <sphereGeometry args={[organelle.size * 1.32, 16, 16]} />
            <meshBasicMaterial 
              color={isTarget ? '#f59e0b' : '#3b82f6'} 
              transparent 
              opacity={0.16}
            />
          </mesh>
        )}
        
        {/* Nhãn nổi (HTML Tooltip) mô tả khoa học */}
        {(hovered || isTarget) && !isPlaced && (
          <Html position={[0, organelle.size + 0.35, 0]} center distanceFactor={8}>
            <div className="bg-slate-900/95 border border-white/10 backdrop-blur-md text-white px-3 py-2.5 rounded-2xl text-center shadow-2xl w-44 select-none pointer-events-none animate-in fade-in zoom-in duration-200">
              <p className="font-black text-xs text-yellow-400 mb-0.5">{organelle.name}</p>
              <p className="text-[9px] text-gray-300 leading-tight">{organelle.description}</p>
            </div>
          </Html>
        )}
        
        {/* Đánh dấu tích xanh lục nhỏ khi đã lắp ráp thành công */}
        {isPlaced && (
          <Html position={[0, organelle.size + 0.15, 0]} center distanceFactor={7}>
            <div className="bg-emerald-500 rounded-full p-0.5 shadow-lg select-none pointer-events-none">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

// Drop zone chỉ báo vị trí lắp ráp (Holographic Torus)
function DropZone({ position, size, isActive }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });
  
  if (!isActive) return null;
  
  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[size * 1.1, 0.015, 8, 32]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.65} />
    </mesh>
  );
}

// Main Scene
function CellScene({ cellType, placedOrganelles, currentOrganelle, onPlaceOrganelle }) {
  const organelleList = useMemo(() => {
    return Object.values(ORGANELLES).filter(org => 
      cellType === 'plant' ? org.inPlant : org.inAnimal
    );
  }, [cellType]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 8, 6]} intensity={1.4} castShadow />
      <directionalLight position={[-6, 4, -6]} intensity={0.6} />
      <pointLight position={[0, 0, 4]} intensity={0.5} color="#60a5fa" />
      <hemisphereLight args={['#ffffff', '#1e293b', 0.85]} />
      
      {/* Cell membrane */}
      <CellMembrane cellType={cellType} />
      
      {/* Cell wall (plant only) */}
      {cellType === 'plant' && <CellWall />}
      
      {/* Organelles */}
      {organelleList.map(organelle => (
        <group key={organelle.id}>
          <DropZone 
            position={organelle.position}
            size={organelle.size}
            isActive={currentOrganelle?.id === organelle.id && !placedOrganelles.includes(organelle.id)}
          />
          <Organelle3D
            organelle={organelle}
            isPlaced={placedOrganelles.includes(organelle.id)}
            isTarget={currentOrganelle?.id === organelle.id}
            onClick={() => {
              // Snap ghép nối bào quan khi người dùng click đúng loại đang cần lắp
              if (currentOrganelle?.id === organelle.id && !placedOrganelles.includes(organelle.id)) {
                onPlaceOrganelle(organelle.id);
              }
            }}
          />
        </group>
      ))}
      
      <OrbitControls 
        enablePan={true}
        minDistance={3.5}
        maxDistance={11}
        autoRotate={placedOrganelles.length === 0}
        autoRotateSpeed={0.25}
        maxPolarAngle={Math.PI * 0.82}
        minPolarAngle={Math.PI * 0.18}
        target={[0, 0, 0]}
      />
    </>
  );
}

// Main Game Component
export default function CellAssemblyGame3D({ onComplete }) {
  const [cellType, setCellType] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [placedOrganelles, setPlacedOrganelles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const organelleList = useMemo(() => {
    if (!cellType) return [];
    return Object.values(ORGANELLES).filter(org => 
      cellType === 'plant' ? org.inPlant : org.inAnimal
    );
  }, [cellType]);

  const currentOrganelle = organelleList[currentIndex];
  const totalOrganelles = organelleList.length;
  const progress = totalOrganelles > 0 ? (placedOrganelles.length / totalOrganelles) * 100 : 0;

  const handlePlaceOrganelle = useCallback((organelleId) => {
    if (placedOrganelles.includes(organelleId)) return;
    
    setPlacedOrganelles(prev => [...prev, organelleId]);
    
    if (placedOrganelles.length + 1 >= totalOrganelles) {
      setTimeout(() => setGameComplete(true), 900);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [placedOrganelles, totalOrganelles]);

  const handleReset = () => {
    setPlacedOrganelles([]);
    setCurrentIndex(0);
    setGameComplete(false);
    setCellType(null);
    setShowTutorial(true);
  };

  // Màn hình chọn loại tế bào & Hướng dẫn học tập
  if (showTutorial || !cellType) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🧬</div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Lắp Ghép Tế Bào 3D</h2>
          <p className="text-gray-300 text-sm mb-2">Thực hành giải phẫu tế bào nhân thực!</p>
          <p className="text-gray-400 text-xs mb-4">Click vào bào quan lơ lửng để ghép vào đúng vị trí và tìm hiểu chức năng.</p>
          
          <div className="flex flex-wrap gap-1 justify-center mb-6">
            {Object.values(ORGANELLES).map((org) => (
              <span key={org.id} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: org.color + '30', color: org.color }}>
                {org.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setCellType('animal'); setShowTutorial(false); }}
              className="py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">🐾</span> Động vật
            </button>
            <button
              onClick={() => { setCellType('plant'); setShowTutorial(false); }}
              className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">🌱</span> Thực vật
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hoàn thành lắp ráp xuất sắc
  if (gameComplete) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-yellow-500/25 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-bounce">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2.5xl font-black text-white mb-2 uppercase tracking-wide">Xuất Sắc! 🎉</h2>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6">Em đã hoàn thành mô hình tế bào hoàn hảo</p>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
            <button
              onClick={() => onComplete(100)}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
            >
              Xong
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 select-none overflow-hidden font-sans">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 6.5], fov: 48 }}
        style={{ width: '100%', height: '100%' }}
        shadows
      >
        <color attach="background" args={['#050510']} />
        <CellScene 
          cellType={cellType}
          placedOrganelles={placedOrganelles}
          currentOrganelle={currentOrganelle}
          onPlaceOrganelle={handlePlaceOrganelle}
        />
      </Canvas>

      {/* UI Bảng điều khiển góc trên */}
      <div className="absolute top-20 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${
            cellType === 'plant' ? 'bg-green-500/10 border border-green-500/25 text-green-400 animate-pulse' : 'bg-pink-500/10 border border-pink-500/25 text-pink-400 animate-pulse'
          }`}>
            {cellType === 'plant' ? '🌱 Tế bào Thực vật' : '🐾 Tế bào Động vật'}
          </div>
        </div>
        
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-slate-900/90 border border-white/10 rounded-full flex items-center justify-center hover:bg-slate-800 pointer-events-auto transition shadow-lg active:scale-95 cursor-pointer"
          title="Chọn lại loại tế bào"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Progress Bar & Hướng dẫn lắp ráp bào quan hiện tại */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-slate-900/95 border border-white/10 backdrop-blur-md rounded-[2rem] p-5 shadow-2xl max-w-xl mx-auto space-y-4">
          {currentOrganelle ? (
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner flex-shrink-0"
                style={{ backgroundColor: currentOrganelle.color + '20' }}
              >
                <div 
                  className="w-5 h-5 rounded-full animate-ping"
                  style={{ backgroundColor: currentOrganelle.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white font-black text-sm uppercase tracking-wide">{currentOrganelle.name}</p>
                  <span className="text-gray-400 text-xs font-bold bg-white/5 px-2 py-0.5 rounded-full">
                    Bào quan {placedOrganelles.length + 1}/{totalOrganelles}
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{currentOrganelle.description}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-emerald-400 font-bold text-xs">Đang hoàn thành lắp ráp...</div>
          )}
          
          <div className="space-y-1">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 font-black uppercase tracking-wider px-1">
              <span>Bắt đầu</span>
              <span>{Math.round(progress)}% Hoàn thành</span>
              <span>Hoàn hảo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
