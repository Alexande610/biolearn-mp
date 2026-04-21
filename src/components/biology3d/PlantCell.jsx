// PlantCell.jsx - Tế bào thực vật 3D bằng React Three Fiber
// Mô hình tế bào hình hộp với: thành TB, không bào trung tâm, lục lạp, nhân, ti thể, ER, Golgi
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Thông tin bào quan tế bào thực vật
const PLANT_ORGANELLES = {
  cell_wall: {
    name: 'Thành tế bào (Cell Wall)',
    description: 'Lớp ngoài cùng cứng chắc từ cellulose - BẢO VỆ và tạo hình dạng cố định cho tế bào thực vật.',
    color: '#a3e635',
    icon: '🟩',
    details: [
      'Thành phần chính: cellulose (~30%), hemicellulose, pectin',
      'Cellulose: polymer glucose, sợi bền nhất tự nhiên',
      'Thành sơ cấp: mỏng, linh hoạt (tế bào đang lớn)',
      'Thành thứ cấp: dày, cứng (lignin) - tế bào trưởng thành',
      'Plasmodesmata: kênh xuyên thành nối tế bào chất',
      'CHỈ CÓ Ở TẾ BÀO THỰC VẬT - động vật KHÔNG có!'
    ]
  },
  membrane: {
    name: 'Màng sinh chất',
    description: 'Nằm sát bên trong thành tế bào - màng phospholipid kép điều hòa vận chuyển chất.',
    color: '#60a5fa',
    icon: '🔵',
    details: [
      'Nằm ngay bên trong thành tế bào',
      'Cấu trúc lớp phospholipid kép + protein xuyên màng',
      'Tính thấm chọn lọc: kiểm soát chất ra vào',
      'Co nguyên sinh: TB mất nước → màng tách khỏi thành',
      'Phản co nguyên sinh: nước vào → màng áp sát thành'
    ]
  },
  vacuole: {
    name: 'Không bào trung tâm',
    description: 'Bào quan LỚN NHẤT chiếm 80-90% thể tích - dự trữ nước, duy trì áp suất trương.',
    color: '#a78bfa',
    icon: '💜',
    details: [
      'Chiếm 80-90% thể tích tế bào thực vật trưởng thành',
      'Màng không bào (tonoplast) bao bọc',
      'Dự trữ: nước, ion, đường, amino acid, sắc tố',
      'Áp suất trương → đẩy TB chất áp sát thành → cây đứng thẳng',
      'Sắc tố anthocyanin: tạo màu đỏ/tím cho hoa/quả',
      'Mất nước → mất áp trương → cây héo',
      'CHỈ CÓ Ở TV (lớn) - ĐV không bào nhỏ hoặc không có'
    ]
  },
  nucleus: {
    name: 'Nhân tế bào',
    description: 'Trung tâm điều khiển - chứa ADN, điều hòa mọi hoạt động sống. Bị đẩy ra rìa bởi không bào.',
    color: '#7c3aed',
    icon: '🟣',
    details: [
      'Thường bị đẩy ra rìa tế bào bởi không bào trung tâm',
      'Chứa nhiễm sắc thể (ADN + histone)',
      'Màng nhân kép có lỗ nhân',
      'Nhân con (nucleolus): tổng hợp rRNA',
      'Điều khiển phân bào, tổng hợp protein, điều hòa gene'
    ]
  },
  chloroplast: {
    name: 'Lục lạp (Chloroplast)',
    description: 'Bào quan QUANG HỢP - chuyển đổi năng lượng ánh sáng thành glucose (đường).',
    color: '#22c55e',
    icon: '🌿',
    details: [
      'Màng kép: màng ngoài + màng trong',
      'Thylakoid: túi dẹt chứa chlorophyll (pha sáng)',
      'Grana: chồng thylakoid xếp lên nhau',
      'Stroma: chất nền - nơi diễn ra chu trình Calvin (pha tối)',
      '6CO₂ + 6H₂O + ánh sáng → C₆H₁₂O₆ + 6O₂',
      'Có ADN riêng - giả thuyết nội cộng sinh',
      'CHỈ CÓ Ở TV VÀ TẢO - động vật không có!'
    ]
  },
  mitochondria: {
    name: 'Ti thể (Mitochondria)',
    description: 'Nhà máy năng lượng - phân giải glucose tạo ATP qua hô hấp hiếu khí.',
    color: '#ef4444',
    icon: '🔴',
    details: [
      'Màng kép: màng ngoài trơn + màng trong nếp gấp (cristae)',
      'Hô hấp tế bào: glucose → CO₂ + H₂O + 36-38 ATP',
      'Có CẢ ở thực vật VÀ động vật',
      'TV quang hợp BAN NGÀY, nhưng hô hấp SUỐT NGÀY ĐÊM',
      'Có ADN riêng (mtDNA), di truyền theo mẹ'
    ]
  },
  er: {
    name: 'Lưới nội chất (ER)',
    description: 'Hệ thống màng nối liền nhân với tế bào chất - tổng hợp, vận chuyển protein và lipid.',
    color: '#3b82f6',
    icon: '🔷',
    details: [
      'ER hạt: có ribosome, tổng hợp protein',
      'ER trơn: không ribosome, tổng hợp lipid',
      'Liên tục với màng nhân ngoài',
      'Vận chuyển chất đến bộ máy Golgi',
      'ER trơn tổng hợp phospholipid cho màng TB'
    ]
  },
  golgi: {
    name: 'Bộ máy Golgi',
    description: 'Phân loại, chế biến, đóng gói protein và polysaccharide — đặc biệt tạo vách TB mới khi phân bào.',
    color: '#f59e0b',
    icon: '🟡',
    details: [
      'Chế biến và đóng gói protein từ ER',
      'Tạo túi tiết chứa pectin → xây thành tế bào mới',
      'Phragmoplast: tạo vách ngăn mới khi phân bào TV',
      'TV phân bào khác ĐV: KHÔNG co thắt mà tạo vách ngăn',
      'Glycosyl hóa protein cho xuất bào'
    ]
  }
};

// --- 3D ORGANELLE COMPONENTS ---

// Thành tế bào - hình hộp cứng (không raycast → click xuyên qua)
function CellWall({ selected }) {
  const ref1 = useRef();
  const ref2 = useRef();
  useEffect(() => {
    if (ref1.current) ref1.current.raycast = () => {};
    if (ref2.current) ref2.current.raycast = () => {};
  }, []);

  return (
    <group>
      <mesh ref={ref1}>
        <boxGeometry args={[6, 5, 5]} />
        <meshStandardMaterial
          color="#a3e635"
          transparent
          opacity={selected === 'cell_wall' ? 0.18 : 0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ref2}>
        <boxGeometry args={[6, 5, 5]} />
        <meshStandardMaterial color="#a3e635" wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// Màng sinh chất - bên trong thành TB (không raycast)
function PlantMembrane({ selected }) {
  const meshRef = useRef();
  useEffect(() => {
    if (meshRef.current) meshRef.current.raycast = () => {};
  }, []);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[5.6, 4.6, 4.6]} />
      <meshPhysicalMaterial
        color="#60a5fa"
        transparent
        opacity={selected === 'membrane' ? 0.14 : 0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Không bào trung tâm - rất lớn (không raycast → click xuyên qua đến bào quan)
function CentralVacuole({ selected }) {
  const meshRef = useRef();
  useEffect(() => {
    if (meshRef.current) meshRef.current.raycast = () => {};
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshPhysicalMaterial
        color="#a78bfa"
        transparent
        opacity={selected === 'vacuole' ? 0.28 : 0.13}
        roughness={0.1}
        transmission={0.8}
        thickness={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Nhân tế bào - bị đẩy sang rìa bởi không bào
function PlantNucleus({ selected, onClick }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref} position={[-2.0, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick('nucleus'); }}>
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial
          color="#7c3aed"
          transparent
          opacity={selected === 'nucleus' ? 0.7 : 0.4}
        />
      </mesh>
      {/* Nhân con */}
      <mesh position={[0.1, 0.1, 0.1]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#581c87" />
      </mesh>
    </group>
  );
}

// Lục lạp - hình đĩa dẹt xanh (đặc trưng TV)
function Chloroplast({ position, rotation, selected, onClick }) {
  return (
    <group position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick('chloroplast'); }}>
      {/* Hình đĩa dẹt */}
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 0.14, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={selected === 'chloroplast' ? 0.9 : 0.7}
          roughness={0.4}
        />
      </mesh>
      {/* Grana (chồng thylakoid) */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[(i - 1) * 0.14, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.11, 8]} />
          <meshStandardMaterial color="#166534" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Ti thể thực vật
function PlantMitochondrion({ position, rotation, selected, onClick }) {
  return (
    <group position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick('mitochondria'); }}>
      <mesh>
        <capsuleGeometry args={[0.17, 0.4, 8, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={selected === 'mitochondria' ? 0.9 : 0.7}
          roughness={0.4}
        />
      </mesh>
      {/* Cristae */}
      {[0, 1].map(i => (
        <mesh key={i} position={[0, (i - 0.5) * 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.015, 0.22, 0.1]} />
          <meshStandardMaterial color="#991b1b" />
        </mesh>
      ))}
    </group>
  );
}

// Lưới nội chất
function PlantER({ position, selected, onClick }) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick('er'); }}>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, i * 0.09 - 0.09, 0]}>
          <boxGeometry args={[0.55, 0.022, 0.35]} />
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={selected === 'er' ? 0.85 : 0.55}
          />
        </mesh>
      ))}
      {/* Ribosome trên ER hạt */}
      {[...Array(6)].map((_, i) => (
        <mesh key={`r${i}`} position={[
          Math.cos(i * 1.0) * 0.22,
          Math.floor(i / 2) * 0.09 - 0.06,
          Math.sin(i * 1.0) * 0.14
        ]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      ))}
    </group>
  );
}

// Bộ máy Golgi
function PlantGolgi({ position, selected, onClick }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={ref} position={position} onClick={(e) => { e.stopPropagation(); onClick('golgi'); }}>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, i * 0.08 - 0.12, 0]}>
          <cylinderGeometry args={[0.2 + i * 0.015, 0.2 + i * 0.015, 0.018, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            transparent
            opacity={selected === 'golgi' ? 0.9 : 0.6}
          />
        </mesh>
      ))}
      {/* Túi tiết */}
      {[0, 1].map(i => (
        <mesh key={`v${i}`} position={[Math.cos(i * 3) * 0.3, 0.2, Math.sin(i * 3) * 0.15]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
    </group>
  );
}

// --- PLANT CELL SCENE ---
function PlantCellScene({ selected, onSelect }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} color="#b0c4de" />
      <pointLight position={[0, 0, 0]} intensity={0.2} color="#22c55e" distance={5} />
      <hemisphereLight intensity={0.3} groundColor="#0a1a0a" />

      <CellWall selected={selected} />
      <PlantMembrane selected={selected} />
      <CentralVacuole selected={selected} />
      <PlantNucleus selected={selected} onClick={onSelect} />

      {/* Lục lạp - rải rác quanh không bào */}
      <Chloroplast position={[2.1, 1.3, 0.5]} rotation={[0.3, 0.5, 0]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[-0.6, 1.8, 1.4]} rotation={[0.5, 1.0, 0.2]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[1.6, -1.6, 0.8]} rotation={[0, 0.3, 0.5]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[-1.6, -1.4, -1.0]} rotation={[0.2, 0.8, 0]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[0.5, 0.6, 1.9]} rotation={[0.4, 0, 0.3]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[-2.1, 0.6, -0.5]} rotation={[0, 0.5, 0.5]} selected={selected} onClick={onSelect} />
      <Chloroplast position={[1.0, -0.3, -1.8]} rotation={[0.3, -0.2, 0.4]} selected={selected} onClick={onSelect} />

      {/* Ti thể */}
      <PlantMitochondrion position={[2.1, -0.5, -1.0]} rotation={[0.3, 0.5, 0]} selected={selected} onClick={onSelect} />
      <PlantMitochondrion position={[-1.0, 1.7, -0.8]} rotation={[0, 1.2, 0.5]} selected={selected} onClick={onSelect} />
      <PlantMitochondrion position={[0.6, -1.9, 1.3]} rotation={[0.5, 0, -0.3]} selected={selected} onClick={onSelect} />

      {/* ER */}
      <PlantER position={[-1.6, -0.4, 1.4]} selected={selected} onClick={onSelect} />

      {/* Golgi */}
      <PlantGolgi position={[1.6, 0.4, -1.4]} selected={selected} onClick={onSelect} />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        autoRotate
        autoRotateSpeed={0.8}
        minDistance={4}
        maxDistance={15}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// --- MAIN COMPONENT ---
export default function PlantCell({
  width = "100%",
  height = "100%",
  showInfo = true,
  backgroundColor = "#0a1a0a"
}) {
  const [selected, setSelected] = useState('chloroplast');
  const [showDetails, setShowDetails] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const current = PLANT_ORGANELLES[selected];
  const validBg = (backgroundColor && backgroundColor.startsWith('#') && backgroundColor.length >= 4)
    ? backgroundColor
    : '#0a1a0a';

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: validBg }}
      >
        <color attach="background" args={[validBg]} />
        <PlantCellScene selected={selected} onSelect={setSelected} />
      </Canvas>

      {/* Organelle selector - bên phải, có nút thu gọn */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="mb-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg text-xs text-gray-300 hover:bg-black/80 transition border border-white/10 flex items-center gap-1.5"
        >
          🌿 {selectorOpen ? '◀ Ẩn bào quan' : '▶ Chọn bào quan'}
        </button>

        {selectorOpen && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10 max-h-60 overflow-y-auto w-48">
            <p className="text-gray-500 text-[10px] px-1.5 mb-1">Bào quan tế bào TV:</p>
            {Object.entries(PLANT_ORGANELLES).map(([key, org]) => (
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
              🌿 Mô hình tế bào thực vật 3D • Click bào quan để chọn • Kéo để xoay • Scroll để zoom
            </p>
          </div>
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🌿 Tế bào thực vật 3D • 8 bào quan</p>
      </div>
    </div>
  );
}

// Export cho tương thích
export { PLANT_ORGANELLES as PLANT_ORGANELLES_INFO };
export function PlantCellModel() {
  return null;
}
