// MendelGame3D.jsx - Di truyền Mendel 3D (Lớp 9)
// Redesigned: Sandbox mode - Học sinh tự lai tạo, không câu hỏi bắt buộc
// Beautiful 3D plants with detailed visuals
import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, ArrowRight, Shuffle, ChevronDown, ChevronUp, Dna, Sprout, FlaskConical, History, X, Check, Info } from 'lucide-react';

// =============== TRAITS DATA ===============
const TRAITS = {
  seed_shape: {
    name: 'Hình dạng hạt',
    dominant: { allele: 'R', name: 'Tròn', color: '#22c55e', description: 'Hạt tròn, đầy đặn' },
    recessive: { allele: 'r', name: 'Nhăn', color: '#84cc16', description: 'Hạt nhăn, khô' },
    icon: '🫘',
  },
  seed_color: {
    name: 'Màu hạt',
    dominant: { allele: 'Y', name: 'Vàng', color: '#fbbf24', description: 'Hạt màu vàng' },
    recessive: { allele: 'y', name: 'Xanh', color: '#22c55e', description: 'Hạt màu xanh' },
    icon: '🟡',
  },
  flower_color: {
    name: 'Màu hoa',
    dominant: { allele: 'P', name: 'Tím', color: '#a855f7', description: 'Hoa màu tím' },
    recessive: { allele: 'p', name: 'Trắng', color: '#f5f5f5', description: 'Hoa màu trắng' },
    icon: '🌸',
  },
  stem_height: {
    name: 'Chiều cao thân',
    dominant: { allele: 'T', name: 'Cao', color: '#059669', description: 'Thân cao (khoảng 2m)' },
    recessive: { allele: 't', name: 'Thấp', color: '#10b981', description: 'Thân thấp (khoảng 0.5m)' },
    icon: '📏',
  },
  pod_shape: {
    name: 'Hình dạng quả',
    dominant: { allele: 'I', name: 'Phồng', color: '#06b6d4', description: 'Quả phồng, căng' },
    recessive: { allele: 'i', name: 'Thắt', color: '#0891b2', description: 'Quả thắt eo' },
    icon: '🥜',
  },
  pod_color: {
    name: 'Màu quả',
    dominant: { allele: 'G', name: 'Xanh', color: '#16a34a', description: 'Quả màu xanh' },
    recessive: { allele: 'g', name: 'Vàng', color: '#eab308', description: 'Quả màu vàng' },
    icon: '🫛',
  },
};

// =============== HELPER FUNCTIONS ===============

// Kiểm tra kiểu hình từ kiểu gen
const getPhenotype = (genotype, trait) => {
  const traitData = TRAITS[trait];
  const hasDominant = genotype.includes(traitData.dominant.allele);
  return hasDominant ? 'dominant' : 'recessive';
};

// Lấy màu từ kiểu gen
const getColorFromGenotype = (genotype, trait) => {
  const traitData = TRAITS[trait];
  const phenotype = getPhenotype(genotype, trait);
  return traitData[phenotype].color;
};

// Thực hiện lai 2 cá thể
const performCross = (parent1Genotype, parent2Genotype, trait) => {
  const traitData = TRAITS[trait];
  const D = traitData.dominant.allele;
  
  const offspring = [];
  const alleles1 = [parent1Genotype[0], parent1Genotype[1]];
  const alleles2 = [parent2Genotype[0], parent2Genotype[1]];
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const a1 = alleles1[j];
      const a2 = alleles2[i];
      // Sắp xếp để allele trội đứng trước
      const sorted = [a1, a2].sort((x, y) => (x === D ? -1 : 1));
      offspring.push({
        genotype: sorted.join(''),
        fromParent1: a1,
        fromParent2: a2,
      });
    }
  }
  
  return offspring;
};

// Phân tích kết quả lai
const analyzeOffspring = (offspring, trait) => {
  const traitData = TRAITS[trait];
  const D = traitData.dominant.allele;
  const r = traitData.recessive.allele;
  
  const stats = {
    dominant: 0,
    recessive: 0,
    homozygousDominant: 0, // DD
    heterozygous: 0, // Dd
    homozygousRecessive: 0, // dd
  };
  
  offspring.forEach(o => {
    const g = o.genotype;
    if (g.includes(D)) {
      stats.dominant++;
      if (g === `${D}${D}`) {
        stats.homozygousDominant++;
      } else {
        stats.heterozygous++;
      }
    } else {
      stats.recessive++;
      stats.homozygousRecessive++;
    }
  });
  
  return stats;
};

// =============== 3D COMPONENTS ===============

// Cây đậu Hà Lan 3D đẹp
function PeaPlant3D({ genotype, trait, position, scale = 1, isSelected, onClick, label }) {
  const groupRef = useRef();
  const traitData = TRAITS[trait];
  const phenotype = getPhenotype(genotype, trait);
  const phenotypeData = traitData[phenotype];
  
  // Chiều cao thân dựa vào tính trạng
  const stemHeight = trait === 'stem_height' 
    ? (phenotype === 'dominant' ? 1.8 : 0.8)
    : 1.2;
  
  useFrame((state) => {
    if (groupRef.current) {
      // Animation nhẹ nhàng
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      {/* Đất/chậu */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      
      {/* Thân chính */}
      <mesh position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.06, stemHeight, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>
      
      {/* Lá 1 */}
      <group position={[0.2, stemHeight * 0.4, 0]} rotation={[0.2, 0, -0.6]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.6} />
        </mesh>
      </group>
      
      {/* Lá 2 */}
      <group position={[-0.18, stemHeight * 0.6, 0.05]} rotation={[0.1, 0.3, 0.5]}>
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
      </group>
      
      {/* Lá 3 */}
      <group position={[0.15, stemHeight * 0.8, -0.05]} rotation={[-0.1, -0.2, -0.4]}>
        <mesh>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.6} />
        </mesh>
      </group>
      
      {/* Hoa/Quả/Hạt - tùy theo tính trạng */}
      <group position={[0, stemHeight + 0.2, 0]}>
        {/* Hoa */}
        {(trait === 'flower_color') && (
          <>
            {/* Cánh hoa */}
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh 
                key={i} 
                position={[
                  Math.cos((i / 5) * Math.PI * 2) * 0.15,
                  0,
                  Math.sin((i / 5) * Math.PI * 2) * 0.15
                ]}
                rotation={[Math.PI / 6, 0, (i / 5) * Math.PI * 2]}
              >
                <sphereGeometry args={[0.1, 12, 12]} />
                <meshStandardMaterial 
                  color={phenotypeData.color} 
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            ))}
            {/* Nhụy */}
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>
          </>
        )}
        
        {/* Quả đậu */}
        {(trait === 'pod_shape' || trait === 'pod_color') && (
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <capsuleGeometry args={[0.08, 0.35, 8, 16]} />
            <meshStandardMaterial 
              color={phenotypeData.color}
              roughness={0.5}
            />
          </mesh>
        )}
        
        {/* Hạt */}
        {(trait === 'seed_shape' || trait === 'seed_color') && (
          <group>
            <mesh position={[-0.08, 0, 0]}>
              <sphereGeometry args={[trait === 'seed_shape' && phenotype === 'recessive' ? 0.09 : 0.1, 16, 16]} />
              <meshStandardMaterial 
                color={phenotypeData.color}
                roughness={trait === 'seed_shape' && phenotype === 'recessive' ? 0.9 : 0.4}
              />
            </mesh>
            <mesh position={[0.08, 0.02, 0]}>
              <sphereGeometry args={[trait === 'seed_shape' && phenotype === 'recessive' ? 0.08 : 0.09, 16, 16]} />
              <meshStandardMaterial 
                color={phenotypeData.color}
                roughness={trait === 'seed_shape' && phenotype === 'recessive' ? 0.9 : 0.4}
              />
            </mesh>
          </group>
        )}
        
        {/* Chiều cao - hiển thị đặc biệt */}
        {trait === 'stem_height' && (
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={phenotypeData.color} />
          </mesh>
        )}
      </group>
      
      {/* Glow khi được chọn */}
      {isSelected && (
        <mesh position={[0, stemHeight / 2 + 0.2, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

// Ô Punnett 3D
function PunnettCell3D({ genotype, position, trait, isHighlighted, onClick }) {
  const meshRef = useRef();
  const color = getColorFromGenotype(genotype, trait);
  
  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.9, 0.9, 0.15]} />
        <meshStandardMaterial 
          color={isHighlighted ? '#fbbf24' : color}
          metalness={0.2}
          roughness={0.5}
          emissive={isHighlighted ? '#fbbf24' : color}
          emissiveIntensity={isHighlighted ? 0.3 : 0.1}
        />
      </mesh>
    </group>
  );
}

// Bảng Punnett 3D
function PunnettSquare3D({ parent1, parent2, offspring, trait, onSelectOffspring, selectedOffspring }) {
  const traitData = TRAITS[trait];
  const alleles1 = [parent1[0], parent1[1]];
  const alleles2 = [parent2[0], parent2[1]];

  return (
    <group position={[0, 0, 0]}>
      {/* Header row - Bố mẹ 1 */}
      {alleles1.map((a, i) => (
        <group key={`h1-${i}`} position={[i * 1.1 - 0.55, 1.3, 0]}>
          <mesh>
            <boxGeometry args={[0.7, 0.5, 0.1]} />
            <meshStandardMaterial 
              color={a === traitData.dominant.allele ? traitData.dominant.color : traitData.recessive.color}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* Header column - Bố mẹ 2 */}
      {alleles2.map((a, i) => (
        <group key={`h2-${i}`} position={[-1.3, -i * 1.1 + 0.55, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.7, 0.1]} />
            <meshStandardMaterial 
              color={a === traitData.dominant.allele ? traitData.dominant.color : traitData.recessive.color}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* Offspring cells */}
      {offspring.map((o, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        return (
          <PunnettCell3D
            key={idx}
            genotype={o.genotype}
            position={[col * 1.1 - 0.55, -row * 1.1 + 0.55, 0]}
            trait={trait}
            isHighlighted={selectedOffspring === idx}
            onClick={() => onSelectOffspring(idx)}
          />
        );
      })}

      {/* Frame */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[2.5, 2.5, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

// Main 3D Scene
function MendelScene({ parent1, parent2, offspring, trait, selectedOffspring, onSelectOffspring, crossHistory }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 5]} intensity={0.4} color="#22c55e" />
      
      {/* Background gradient effect */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#0a1a0a" />
      </mesh>
      
      {/* Parent 1 */}
      <PeaPlant3D 
        genotype={parent1}
        trait={trait}
        position={[-4, -1, 0]}
        scale={0.9}
        label="P1"
      />
      
      {/* Parent 2 */}
      <PeaPlant3D 
        genotype={parent2}
        trait={trait}
        position={[4, -1, 0]}
        scale={0.9}
        label="P2"
      />
      
      {/* Punnett Square */}
      <PunnettSquare3D
        parent1={parent1}
        parent2={parent2}
        offspring={offspring}
        trait={trait}
        selectedOffspring={selectedOffspring}
        onSelectOffspring={onSelectOffspring}
      />
      
      {/* Offspring plants visualization */}
      {offspring.map((o, idx) => (
        <Float key={idx} speed={2} floatIntensity={0.2}>
          <PeaPlant3D
            genotype={o.genotype}
            trait={trait}
            position={[-1.5 + idx * 1, -3, 0]}
            scale={0.5}
            isSelected={selectedOffspring === idx}
            onClick={() => onSelectOffspring(idx)}
          />
        </Float>
      ))}
      
      <OrbitControls 
        enablePan={true}
        minDistance={5}
        maxDistance={18}
        target={[0, -0.5, 0]}
      />
    </>
  );
}

// =============== UI COMPONENTS ===============

// Panel chọn kiểu gen
function GenotypeSelector({ trait, value, onChange, label }) {
  const traitData = TRAITS[trait];
  const D = traitData.dominant.allele;
  const r = traitData.recessive.allele;
  const options = [`${D}${D}`, `${D}${r}`, `${r}${r}`];
  
  const getLabel = (g) => {
    if (g === `${D}${D}`) return `${g} (Đồng hợp trội)`;
    if (g === `${D}${r}`) return `${g} (Dị hợp)`;
    return `${g} (Đồng hợp lặn)`;
  };

  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <div className="flex gap-2">
        {options.map(g => (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
              value === g 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 mt-1 text-center">
        {getLabel(value)}
      </p>
    </div>
  );
}

// Panel thông tin tính trạng
function TraitInfoPanel({ trait, isOpen, onToggle }) {
  const traitData = TRAITS[trait];
  
  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{traitData.icon}</span>
          <span className="text-white font-semibold">{traitData.name}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: traitData.dominant.color }}
            />
            <div>
              <p className="text-white text-sm font-semibold">
                {traitData.dominant.allele} - {traitData.dominant.name} 
                <span className="text-green-400 text-xs ml-2">(TRỘI)</span>
              </p>
              <p className="text-gray-400 text-xs">{traitData.dominant.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: traitData.recessive.color }}
            />
            <div>
              <p className="text-white text-sm font-semibold">
                {traitData.recessive.allele} - {traitData.recessive.name}
                <span className="text-orange-400 text-xs ml-2">(lặn)</span>
              </p>
              <p className="text-gray-400 text-xs">{traitData.recessive.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Panel kết quả lai
function ResultPanel({ offspring, trait, selectedOffspring, onSelectForNextCross }) {
  const stats = analyzeOffspring(offspring, trait);
  const traitData = TRAITS[trait];
  
  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl p-4">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-green-400" />
        Kết quả lai (F1)
      </h3>
      
      {/* Offspring grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {offspring.map((o, idx) => (
          <button
            key={idx}
            onClick={() => onSelectForNextCross(idx)}
            className={`p-2 rounded-lg text-center transition-all ${
              selectedOffspring === idx 
                ? 'bg-yellow-500/30 border-2 border-yellow-500' 
                : 'bg-white/5 border border-transparent hover:bg-white/10'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-full mx-auto mb-1"
              style={{ backgroundColor: getColorFromGenotype(o.genotype, trait) }}
            />
            <p className="text-white text-xs font-mono">{o.genotype}</p>
          </button>
        ))}
      </div>
      
      {/* Statistics */}
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-sm text-gray-300 mb-2">Tỷ lệ kiểu hình:</p>
        <div className="flex justify-between text-sm">
          <span style={{ color: traitData.dominant.color }}>
            {traitData.dominant.name}: {stats.dominant}
          </span>
          <span style={{ color: traitData.recessive.color }}>
            {traitData.recessive.name}: {stats.recessive}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-1 text-center">
          Tỷ lệ: {stats.dominant}:{stats.recessive}
        </p>
        
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-sm text-gray-300 mb-2">Tỷ lệ kiểu gen:</p>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{traitData.dominant.allele}{traitData.dominant.allele}: {stats.homozygousDominant}</span>
            <span>{traitData.dominant.allele}{traitData.recessive.allele}: {stats.heterozygous}</span>
            <span>{traitData.recessive.allele}{traitData.recessive.allele}: {stats.homozygousRecessive}</span>
          </div>
        </div>
      </div>
      
      {selectedOffspring !== null && (
        <p className="text-yellow-400 text-xs mt-3 text-center">
          ✨ Đã chọn {offspring[selectedOffspring].genotype} để lai tiếp
        </p>
      )}
    </div>
  );
}

// Lịch sử lai
function HistoryPanel({ history, isOpen, onToggle, onSelectFromHistory }) {
  if (history.length === 0) return null;
  
  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">Lịch sử lai ({history.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 max-h-48 overflow-y-auto space-y-2">
          {history.map((h, idx) => (
            <button
              key={idx}
              onClick={() => onSelectFromHistory(h)}
              className="w-full p-2 bg-white/5 rounded-lg text-left hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">#{idx + 1}</span>
                <span className="text-white text-sm font-mono">{h.parent1} × {h.parent2}</span>
                <span className="text-gray-400 text-xs">→ {h.trait}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============== MAIN COMPONENT ===============

export default function MendelGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentTrait, setCurrentTrait] = useState('seed_shape');
  const [parent1Genotype, setParent1Genotype] = useState('Rr');
  const [parent2Genotype, setParent2Genotype] = useState('Rr');
  const [offspring, setOffspring] = useState([]);
  const [selectedOffspring, setSelectedOffspring] = useState(null);
  const [crossHistory, setCrossHistory] = useState([]);
  const [showTraitInfo, setShowTraitInfo] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [generation, setGeneration] = useState(0);

  // Thực hiện phép lai
  const handleCross = useCallback(() => {
    const newOffspring = performCross(parent1Genotype, parent2Genotype, currentTrait);
    setOffspring(newOffspring);
    setSelectedOffspring(null);
    setGeneration(prev => prev + 1);
    
    // Lưu vào lịch sử
    setCrossHistory(prev => [...prev, {
      parent1: parent1Genotype,
      parent2: parent2Genotype,
      trait: TRAITS[currentTrait].name,
      offspring: newOffspring,
    }]);
  }, [parent1Genotype, parent2Genotype, currentTrait]);

  // Chọn con để lai tiếp
  const handleSelectForNextCross = (idx) => {
    setSelectedOffspring(idx);
  };

  // Lai tiếp với con đã chọn
  const handleCrossWithSelected = () => {
    if (selectedOffspring !== null) {
      const selectedGenotype = offspring[selectedOffspring].genotype;
      setParent1Genotype(selectedGenotype);
      // Có thể giữ nguyên parent2 hoặc đổi
    }
  };

  // Đổi tính trạng
  const handleChangeTrait = (newTrait) => {
    const traitData = TRAITS[newTrait];
    const D = traitData.dominant.allele;
    const r = traitData.recessive.allele;
    setCurrentTrait(newTrait);
    setParent1Genotype(`${D}${r}`);
    setParent2Genotype(`${D}${r}`);
    setOffspring([]);
    setSelectedOffspring(null);
    setGeneration(0);
  };

  // Reset
  const handleReset = () => {
    setCurrentTrait('seed_shape');
    setParent1Genotype('Rr');
    setParent2Genotype('Rr');
    setOffspring([]);
    setSelectedOffspring(null);
    setCrossHistory([]);
    setGeneration(0);
    setShowTutorial(true);
  };

  // Chọn từ lịch sử
  const handleSelectFromHistory = (historyItem) => {
    // Có thể implement để load lại phép lai cũ
  };

  // Tutorial
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Dna className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Phòng thí nghiệm Mendel</h2>
            <p className="text-gray-300 text-sm">Khám phá di truyền học qua lai tạo cây đậu Hà Lan!</p>
          </div>
          
          {/* Bảng tính trạng */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              7 cặp tính trạng của Mendel
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(TRAITS).map(([key, data]) => (
                <div key={key} className="bg-white/5 rounded-lg p-2 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{data.icon}</span>
                    <span className="text-white font-semibold">{data.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: data.dominant.color }}>
                      {data.dominant.allele}: {data.dominant.name}
                    </span>
                    <span style={{ color: data.recessive.color }}>
                      {data.recessive.allele}: {data.recessive.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-sm text-gray-300">
            <p className="mb-2">🧬 <strong>Cách chơi:</strong></p>
            <ul className="space-y-1 text-xs">
              <li>1. Chọn tính trạng muốn nghiên cứu</li>
              <li>2. Chọn kiểu gen cho bố mẹ (P)</li>
              <li>3. Nhấn "Lai tạo" để xem kết quả F1</li>
              <li>4. Chọn con F1 để lai tiếp sang F2, F3...</li>
            </ul>
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Sprout className="w-5 h-5" />
            Bắt đầu thí nghiệm
          </button>
        </div>
      </div>
    );
  }

  const traitData = TRAITS[currentTrait];

  return (
    <div className="absolute inset-0 bg-slate-900 flex">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-black/40 backdrop-blur-md p-4 overflow-y-auto flex flex-col gap-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Dna className="w-5 h-5 text-green-400" />
            Phòng TN Mendel
          </h2>
          <button 
            onClick={handleReset}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Generation counter */}
        {generation > 0 && (
          <div className="bg-green-500/20 rounded-lg px-3 py-2 text-center">
            <span className="text-green-400 text-sm font-semibold">Thế hệ F{generation}</span>
          </div>
        )}
        
        {/* Trait selector */}
        <div>
          <p className="text-gray-400 text-xs mb-2">Chọn tính trạng:</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TRAITS).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleChangeTrait(key)}
                className={`p-2 rounded-lg text-center transition-all ${
                  currentTrait === key 
                    ? 'bg-green-500/30 border border-green-500' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{data.icon}</span>
                <p className="text-[10px] text-gray-300 mt-1 truncate">{data.name}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Trait info panel */}
        <TraitInfoPanel 
          trait={currentTrait} 
          isOpen={showTraitInfo} 
          onToggle={() => setShowTraitInfo(!showTraitInfo)} 
        />
        
        {/* Parent selectors */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm">Chọn bố mẹ (P)</h3>
          <GenotypeSelector
            trait={currentTrait}
            value={parent1Genotype}
            onChange={setParent1Genotype}
            label="🌱 Bố mẹ 1"
          />
          <GenotypeSelector
            trait={currentTrait}
            value={parent2Genotype}
            onChange={setParent2Genotype}
            label="🌿 Bố mẹ 2"
          />
        </div>
        
        {/* Cross button */}
        <button
          onClick={handleCross}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Shuffle className="w-5 h-5" />
          Lai tạo
        </button>
        
        {/* Results */}
        {offspring.length > 0 && (
          <ResultPanel
            offspring={offspring}
            trait={currentTrait}
            selectedOffspring={selectedOffspring}
            onSelectForNextCross={handleSelectForNextCross}
          />
        )}
        
        {/* Use selected for next cross */}
        {selectedOffspring !== null && (
          <button
            onClick={handleCrossWithSelected}
            className="w-full py-2 bg-yellow-500/20 text-yellow-400 font-semibold rounded-xl hover:bg-yellow-500/30 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Dùng {offspring[selectedOffspring].genotype} làm P1
          </button>
        )}
        
        {/* History */}
        <HistoryPanel
          history={crossHistory}
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onSelectFromHistory={handleSelectFromHistory}
        />
      </div>

      {/* Right - 3D View */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 2, 12], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#0a1a0a']} />
          <fog attach="fog" args={['#0a1a0a', 10, 25]} />
          <MendelScene
            parent1={parent1Genotype}
            parent2={parent2Genotype}
            offspring={offspring}
            trait={currentTrait}
            selectedOffspring={selectedOffspring}
            onSelectOffspring={handleSelectForNextCross}
            crossHistory={crossHistory}
          />
        </Canvas>
        
        {/* Overlay labels for 3D scene */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="text-white text-sm font-mono">P1: {parent1Genotype}</p>
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="text-white text-sm font-mono">P2: {parent2Genotype}</p>
        </div>
        
        {/* Instructions */}
        {offspring.length === 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-xl px-6 py-3">
            <p className="text-gray-300 text-sm text-center">
              👈 Chọn kiểu gen bố mẹ và nhấn <span className="text-green-400 font-semibold">"Lai tạo"</span>
            </p>
          </div>
        )}
        
        {/* Punnett square labels */}
        {offspring.length > 0 && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-purple-400 text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                Bảng Punnett
              </p>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-gray-400 text-xs bg-black/50 px-3 py-2 rounded-lg">
                Click vào cây con để chọn lai tiếp
              </p>
            </div>
          </>
        )}
        
        {/* Complete button */}
        <button
          onClick={() => onComplete(crossHistory.length * 50)}
          className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
        >
          Hoàn thành
        </button>
      </div>
    </div>
  );
}
