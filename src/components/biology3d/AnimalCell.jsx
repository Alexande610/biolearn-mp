// AnimalCell.jsx - Tế bào động vật 3D bằng React Three Fiber
// Mô hình tế bào thật với các bào quan: nhân, ti thể, lưới nội chất, Golgi, lysosome, ribosome, trung thể
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Thông tin bào quan tế bào động vật
const ORGANELLES = {
  membrane: {
    name: 'Màng tế bào',
    description: 'Màng phospholipid kép bao bọc tế bào, điều hòa vận chuyển chất ra vào.',
    color: '#60a5fa',
    icon: '🔵',
    details: [
      'Cấu trúc: lớp phospholipid kép + protein xuyên màng',
      'Dày ~7-8nm, tính thấm chọn lọc',
      'Mô hình khảm lỏng (Singer & Nicolson, 1972)',
      'Chức năng: bảo vệ, trao đổi chất, nhận tín hiệu',
      'Protein kênh, protein vận chuyển, protein thụ thể'
    ]
  },
  nucleus: {
    name: 'Nhân tế bào',
    description: 'Trung tâm điều khiển tế bào, chứa ADN (nhiễm sắc thể) và nhân con.',
    color: '#7c3aed',
    icon: '🟣',
    details: [
      'Chứa toàn bộ thông tin di truyền (ADN)',
      'Màng nhân kép có lỗ nhân (nuclear pore)',
      'Nhân con (nucleolus): tổng hợp rRNA',
      'Chất nhiễm sắc: ADN + histone protein',
      'Điều khiển mọi hoạt động sống của tế bào'
    ]
  },
  mitochondria: {
    name: 'Ti thể (Mitochondria)',
    description: 'Nhà máy năng lượng - tổng hợp ATP qua hô hấp tế bào hiếu khí.',
    color: '#ef4444',
    icon: '🔴',
    details: [
      'Màng kép: màng ngoài trơn + màng trong gấp nếp (cristae)',
      'Hô hấp tế bào: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 36-38 ATP',
      'Có ADN riêng (mtDNA) - di truyền theo mẹ',
      'Giả thuyết nội cộng sinh: từ vi khuẩn hiếu khí cổ đại',
      'Tế bào cơ và gan có nhiều ti thể nhất (~2000/tế bào)'
    ]
  },
  er_rough: {
    name: 'Lưới nội chất hạt (RER)',
    description: 'Hệ thống màng có ribosome gắn - tổng hợp và vận chuyển protein.',
    color: '#3b82f6',
    icon: '🔷',
    details: [
      'Bề mặt gắn ribosome → tổng hợp protein',
      'Protein đi qua lumen → gấp cuộn → glycosyl hóa',
      'Vận chuyển protein đến Golgi bằng túi vận chuyển',
      'Phát triển mạnh ở tế bào tiết (tuyến tụy, gan)',
      'Liên tục với màng nhân ngoài'
    ]
  },
  er_smooth: {
    name: 'Lưới nội chất trơn (SER)',
    description: 'Hệ thống màng không ribosome - tổng hợp lipid, giải độc, dự trữ Ca²⁺.',
    color: '#06b6d4',
    icon: '🔹',
    details: [
      'Không có ribosome gắn trên bề mặt',
      'Tổng hợp lipid và steroid hormone',
      'Giải độc: chuyển hóa thuốc, rượu (tế bào gan)',
      'Dự trữ Ca²⁺ (SER đặc biệt ở tế bào cơ)',
      'Tổng hợp phospholipid cho màng tế bào'
    ]
  },
  golgi: {
    name: 'Bộ máy Golgi',
    description: 'Trung tâm phân loại, chế biến và đóng gói protein/lipid để xuất bào.',
    color: '#f59e0b',
    icon: '🟡',
    details: [
      'Cấu trúc: 4-8 túi dẹt xếp chồng (cisternae)',
      'Mặt cis: nhận protein từ ER',
      'Mặt trans: xuất túi tiết ra khỏi tế bào',
      'Glycosyl hóa: gắn chuỗi đường vào protein',
      'Tạo lysosome chứa enzyme tiêu hóa'
    ]
  },
  lysosome: {
    name: 'Lysosome',
    description: 'Túi tiêu hóa nội bào - chứa enzyme thủy phân pH acid để phân hủy chất thải.',
    color: '#a855f7',
    icon: '🟣',
    details: [
      'Chứa ~50 loại enzyme thủy phân (hydrolase)',
      'pH acid (~4.5-5) nhờ bơm H⁺ trên màng',
      'Tiêu hóa nội bào: thực bào, tự thực bào (autophagy)',
      'Apoptosis: tự hủy tế bào có chương trình',
      'Bệnh tích lũy lysosome: Gaucher, Tay-Sachs'
    ]
  },
  ribosome: {
    name: 'Ribosome',
    description: 'Nhà máy protein - dịch mã mRNA thành chuỗi polypeptide (protein).',
    color: '#10b981',
    icon: '🟢',
    details: [
      'Gồm 2 tiểu đơn vị: lớn (60S) + nhỏ (40S) → 80S',
      'Dịch mã: mRNA → protein theo bộ ba mã di truyền',
      'Ribosome tự do: tổng hợp protein cho tế bào chất',
      'Ribosome gắn RER: tổng hợp protein xuất bào/màng',
      'Mỗi tế bào có hàng triệu ribosome'
    ]
  },
  centrosome: {
    name: 'Trung thể (Centrosome)',
    description: 'Trung tâm tổ chức vi ống - tạo thoi phân bào trong nguyên phân và giảm phân.',
    color: '#f97316',
    icon: '🔶',
    details: [
      'Gồm 2 trung tử (centriole) vuông góc nhau',
      'Mỗi trung tử: 9 bộ ba vi ống xếp vòng (9+0)',
      'Tạo thoi phân bào kéo nhiễm sắc thể trong phân bào',
      'Tạo thể gốc cho lông roi và tiên mao',
      'Nhân đôi ở pha S của chu kì tế bào',
      'TẾ BÀO THỰC VẬT KHÔNG CÓ trung thể!'
    ]
  }
};

// --- 3D ORGANELLE COMPONENTS ---

// Màng tế bào - hình cầu bán trong suốt (không raycast → cho phép click bào quan bên trong)
function CellMembrane({ selected }) {
  const meshRef = useRef();
  useEffect(() => {
    // Tắt raycast để click xuyên qua đến bào quan bên trong
    if (meshRef.current) meshRef.current.raycast = () => {};
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[3, 64, 64]} />
      <meshPhysicalMaterial
        color="#60a5fa"
        transparent
        opacity={selected === 'membrane' ? 0.22 : 0.1}
        roughness={0.1}
        transmission={0.85}
        thickness={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Nhân tế bào - hình cầu lớn ở trung tâm
function Nucleus({ selected, onClick }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick('nucleus'); }}>
      {/* Màng nhân */}
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshPhysicalMaterial
          color="#7c3aed"
          transparent
          opacity={selected === 'nucleus' ? 0.7 : 0.4}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {/* Nhân con (nucleolus) */}
      <mesh position={[0.2, 0.15, 0.2]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#581c87" roughness={0.5} />
      </mesh>
      {/* Chất nhiễm sắc */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 2) * 0.5,
          Math.sin(i * 0.7) * 0.3,
          Math.sin(i * Math.PI / 2) * 0.5
        ]}>
          <torusGeometry args={[0.18, 0.04, 8, 16]} />
          <meshStandardMaterial color="#4c1d95" />
        </mesh>
      ))}
    </group>
  );
}

// Ti thể - hình capsule có nếp gấp bên trong
function Mitochondrion({ position, rotation, selected, onClick }) {
  return (
    <group position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick('mitochondria'); }}>
      <mesh>
        <capsuleGeometry args={[0.22, 0.55, 8, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={selected === 'mitochondria' ? 0.9 : 0.7}
          roughness={0.4}
        />
      </mesh>
      {/* Cristae - nếp gấp màng trong */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, (i - 1) * 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.3, 0.16]} />
          <meshStandardMaterial color="#991b1b" />
        </mesh>
      ))}
    </group>
  );
}

// Lưới nội chất - các lớp màng xếp chồng
function EndoplasmicReticulum({ type, position, selected, onClick }) {
  const color = type === 'rough' ? '#3b82f6' : '#06b6d4';
  const organelleKey = type === 'rough' ? 'er_rough' : 'er_smooth';

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(organelleKey); }}>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, i * 0.11 - 0.17, 0]}>
          <boxGeometry args={[0.75 - i * 0.08, 0.025, 0.45 - i * 0.04]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={selected === organelleKey ? 0.85 : 0.55}
            roughness={0.5}
          />
        </mesh>
      ))}
      {/* Ribosome trên ER hạt */}
      {type === 'rough' && [...Array(10)].map((_, i) => (
        <mesh key={`r${i}`} position={[
          Math.cos(i * 1.2) * 0.3,
          Math.floor(i / 3) * 0.11 - 0.14,
          Math.sin(i * 1.2) * 0.18 + 0.03
        ]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      ))}
    </group>
  );
}

// Bộ máy Golgi - túi dẹt xếp chồng
function GolgiApparatus({ position, selected, onClick }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={ref} position={position} onClick={(e) => { e.stopPropagation(); onClick('golgi'); }}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[0, i * 0.09 - 0.18, 0]}>
          <cylinderGeometry args={[0.28 + i * 0.02, 0.28 + i * 0.02, 0.022, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            transparent
            opacity={selected === 'golgi' ? 0.9 : 0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* Túi tiết */}
      {[0, 1, 2].map(i => (
        <mesh key={`v${i}`} position={[
          Math.cos(i * 2.1) * 0.42,
          Math.sin(i * 1.3) * 0.12 + 0.28,
          Math.sin(i * 2.1) * 0.18
        ]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
    </group>
  );
}

// Lysosome
function Lysosomes({ positions, selected, onClick }) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick('lysosome'); }}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial
            color="#a855f7"
            transparent
            opacity={selected === 'lysosome' ? 0.9 : 0.65}
            roughness={0.4}
            emissive="#a855f7"
            emissiveIntensity={selected === 'lysosome' ? 0.3 : 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

// Ribosome rải rác trong tế bào chất
function FreeRibosomes({ selected, onClick }) {
  const positions = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 30; i++) {
      const r = 1.3 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pts.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]);
    }
    return pts;
  }, []);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick('ribosome'); }}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={selected === 'ribosome' ? 0.5 : 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Trung thể - 2 trung tử vuông góc
function Centrosome({ position, selected, onClick }) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick('centrosome'); }}>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 0.22, 9]} />
        <meshStandardMaterial color="#f97316" transparent opacity={selected === 'centrosome' ? 0.9 : 0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.11, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.22, 9]} />
        <meshStandardMaterial color="#f97316" transparent opacity={selected === 'centrosome' ? 0.9 : 0.7} />
      </mesh>
      {/* Vi ống tỏa ra */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 3) * 0.2,
          0,
          Math.sin(i * Math.PI / 3) * 0.2
        ]} rotation={[0, 0, Math.cos(i) * 0.5]}>
          <cylinderGeometry args={[0.008, 0.008, 0.35, 4]} />
          <meshStandardMaterial color="#fb923c" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// --- CELL SCENE ---
function CellScene({ selected, onSelect }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} color="#b0c4de" />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#7c3aed" distance={5} />
      <hemisphereLight intensity={0.3} groundColor="#1a1a2e" />

      <CellMembrane selected={selected} />
      <Nucleus selected={selected} onClick={onSelect} />

      {/* Ti thể - rải rác */}
      <Mitochondrion position={[1.6, 0.5, 0.8]} rotation={[0.3, 0.5, 0]} selected={selected} onClick={onSelect} />
      <Mitochondrion position={[-1.3, -0.8, 1.1]} rotation={[0, 1.2, 0.5]} selected={selected} onClick={onSelect} />
      <Mitochondrion position={[0.8, -1.5, -0.5]} rotation={[0.5, 0, -0.3]} selected={selected} onClick={onSelect} />
      <Mitochondrion position={[-0.6, 1.3, -1.2]} rotation={[-0.2, 0.8, 0]} selected={selected} onClick={onSelect} />
      <Mitochondrion position={[1.0, 0.0, -1.8]} rotation={[0.4, -0.3, 0.2]} selected={selected} onClick={onSelect} />

      {/* Lưới nội chất */}
      <EndoplasmicReticulum type="rough" position={[0.6, -0.6, 1.3]} selected={selected} onClick={onSelect} />
      <EndoplasmicReticulum type="smooth" position={[-1.6, 0.4, -0.5]} selected={selected} onClick={onSelect} />

      {/* Bộ máy Golgi */}
      <GolgiApparatus position={[-1.1, -0.4, 1.6]} selected={selected} onClick={onSelect} />

      {/* Lysosome */}
      <Lysosomes
        positions={[[1.8, 0.2, -0.6], [-0.6, 1.6, 0.7], [0.4, -1.8, -1.1], [-1.5, -1.2, 0.3]]}
        selected={selected}
        onClick={onSelect}
      />

      {/* Ribosome tự do */}
      <FreeRibosomes selected={selected} onClick={onSelect} />

      {/* Trung thể */}
      <Centrosome position={[1.6, 1.5, -0.4]} selected={selected} onClick={onSelect} />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        autoRotate
        autoRotateSpeed={0.8}
        minDistance={3}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// --- MAIN COMPONENT ---
export default function AnimalCell({
  width = "100%",
  height = "100%",
  showInfo = true,
  backgroundColor = "#0a0a1e"
}) {
  const [selected, setSelected] = useState('nucleus');
  const [showDetails, setShowDetails] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const current = ORGANELLES[selected];
  const validBg = (backgroundColor && backgroundColor.startsWith('#') && backgroundColor.length >= 4)
    ? backgroundColor
    : '#0a0a1e';

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: validBg }}
      >
        <color attach="background" args={[validBg]} />
        <CellScene selected={selected} onSelect={setSelected} />
      </Canvas>

      {/* Organelle selector - bên phải, có nút thu gọn */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="mb-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg text-xs text-gray-300 hover:bg-black/80 transition border border-white/10 flex items-center gap-1.5"
        >
          🔬 {selectorOpen ? '◀ Ẩn bào quan' : '▶ Chọn bào quan'}
        </button>

        {selectorOpen && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10 max-h-60 overflow-y-auto w-48">
            <p className="text-gray-500 text-[10px] px-1.5 mb-1">Bào quan tế bào ĐV:</p>
            {Object.entries(ORGANELLES).map(([key, org]) => (
              <button
                key={key}
                onClick={() => { setSelected(key); setSelectorOpen(false); setShowDetails(false); }}
                className={`w-full text-left px-1.5 py-1 rounded text-[11px] transition-all mb-0.5 truncate ${
                  selected === key ? 'text-white border' : 'text-gray-300 hover:bg-white/10'
                }`}
                style={selected === key ? { backgroundColor: org.color + '30', borderColor: org.color + '60' } : {}}
              >
                <span className="mr-1">{org.icon}</span>
                {org.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info panel phía dưới */}
      {showInfo && current && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-lg">{current.icon}</span>
                  <h3 className="font-bold" style={{ color: current.color }}>{current.name}</h3>
                </div>
                <p className="text-sm text-gray-300">{current.description}</p>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition"
                style={{ backgroundColor: current.color + '30', color: current.color }}
              >
                📚 {showDetails ? 'Ẩn' : 'Chi tiết'}
              </button>
            </div>

            {showDetails && current.details && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <ul className="space-y-1">
                  {current.details.map((detail, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span style={{ color: current.color }} className="mt-0.5 flex-shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-600 mt-2">
              🔬 Mô hình tế bào động vật 3D • Click bào quan để chọn • Kéo để xoay • Scroll để zoom
            </p>
          </div>
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🔬 Tế bào động vật 3D • 9 bào quan</p>
      </div>
    </div>
  );
}

// Export cho tương thích
export { ORGANELLES as ORGANELLES_INFO };
export function AnimalCellModel() {
  return null;
}
