// NervousSystemGame3D.jsx - Hệ Thần kinh 3D (Lớp 8)
import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { BookOpen, HelpCircle, CheckCircle, Play, ArrowRight, Home } from 'lucide-react';

const PARTS = [
  {
    id: 'brain',
    name: 'Đại não (Cerebrum)',
    position: [0, 2.5, 0],
    color: '#fda4af',
    scale: 1,
    facts: [
      'Trung tâm thần kinh cao nhất, chiếm 80% trọng lượng não.',
      'Chia làm 2 bán cầu não: Bán cầu trái (tư duy logic, ngôn ngữ, toán học) và Bán cầu phải (sáng tạo, nghệ thuật, không gian).',
      'Bề mặt có nhiều nếp nhăn (khe và rãnh) làm tăng diện tích bề mặt chứa chất xám chứa tới hàng chục tỷ neuron.',
      'Điều khiển các hoạt động có ý thức: tư duy, trí nhớ, giác quan, ngôn ngữ và cảm xúc.'
    ]
  },
  {
    id: 'cerebellum',
    name: 'Tiểu não (Cerebellum)',
    position: [0, 1.1, -0.6],
    color: '#d8b4fe',
    scale: 0.7,
    facts: [
      'Nằm phía sau đại não, ngay trên thân não.',
      'Bề mặt có các nếp nhăn chạy song song cực kỳ đặc trưng (các vân tiểu não).',
      'Chức năng chính: Điều hòa và phối hợp các cử động phức tạp của cơ vân.',
      'Giúp duy trì thăng bằng cơ thể và tư thế khi di chuyển, đứng hoặc ngồi.'
    ]
  },
  {
    id: 'brainstem',
    name: 'Thân não (Brainstem)',
    position: [0, 0.4, -0.2],
    color: '#93c5fd',
    scale: 0.6,
    facts: [
      'Nối liền đại não và tiểu não với tủy sống.',
      'Gồm 3 phần chính: Não giữa, Cầu não và Hành não.',
      'Hành não chứa các trung khu thần kinh thực vật cực kỳ quan trọng điều khiển nhịp tim, hô hấp, huyết áp, phản xạ nuốt, ho, hắt hơi.',
      'Là trạm trung chuyển dẫn truyền xung thần kinh giữa não và toàn bộ cơ thể.'
    ]
  },
  {
    id: 'spinal',
    name: 'Tủy sống (Spinal Cord)',
    position: [0, -1.5, -0.2],
    color: '#a7f3d0',
    scale: 0.5,
    facts: [
      'Nằm bên trong ống xương sống, kéo dài từ hành não xuống vùng thắt lưng.',
      'Cấu tạo gồm: Chất xám ở trong (hình cánh bướm) điều khiển các phản xạ không điều kiện; Chất trắng ở ngoài dẫn truyền xung thần kinh cảm giác và vận động.',
      'Từ tủy sống phát đi 31 đôi dây thần kinh tủy phối hợp cảm giác và vận động chi/thân.'
    ]
  },
  {
    id: 'neuron',
    name: 'Neuron (Tế bào thần kinh)',
    position: [2.8, 1.2, 0],
    color: '#fef08a',
    scale: 0.9,
    facts: [
      'Đơn vị cấu tạo và chức năng cơ bản của hệ thần kinh.',
      'Thân neuron chứa nhân và bào quan; các sợi nhánh (dendrites) tiếp nhận kích thích.',
      'Sợi trục (axon) dài, được bao bọc bởi bao Myelin (chất cách điện) giúp truyền xung thần kinh siêu nhanh.',
      'Giữa các bao Myelin có eo Ranvier giúp xung điện nhảy cóc qua tăng tốc độ dẫn truyền.',
      'Synapse là đầu tận cùng của sợi trục, truyền tín hiệu hóa học sang tế bào tiếp theo.'
    ]
  },
  {
    id: 'reflex',
    name: 'Cung phản xạ (Reflex Arc)',
    position: [-2.8, 1.2, 0],
    color: '#86efac',
    scale: 0.9,
    facts: [
      'Đường đi của xung thần kinh từ cơ quan thụ cảm qua trung ương thần kinh đến cơ quan phản ứng.',
      'Gồm 5 bộ phận chính: (1) Thụ quan cảm giác -> (2) Neuron hướng tâm (cảm giác) -> (3) Trung ương thần kinh (tủy sống/não) -> (4) Neuron ly tâm (vận động) -> (5) Cơ quan phản ứng (cơ/tuyến).',
      'Giúp cơ thể phản ứng lập tức, tự động trước kích thích để tự bảo vệ (ví dụ: rút tay khi chạm vật nóng).'
    ]
  },
];

const QUIZ = [
  { q: 'Bộ phận nào chiếm khoảng 80% trọng lượng não bộ và điều khiển tư duy, trí nhớ?', opts: ['Tiểu não', 'Đại não', 'Thân não', 'Tủy sống'], correct: 1 },
  { q: 'Chức năng chủ yếu của tiểu não là gì?', opts: ['Điều khiển cảm xúc', 'Dẫn truyền xung thần kinh lên chi', 'Điều hòa thăng bằng và phối hợp cử động cơ vân', 'Điều khiển nhịp tim và nhịp thở'], correct: 2 },
  { q: 'Đơn vị cấu tạo cơ bản của hệ thần kinh là gì?', opts: ['Neuron', 'Tế bào cơ', 'Tủy sống', 'Bao myelin'], correct: 0 },
  { q: 'Cấu trúc nào trên sợi trục neuron giúp xung thần kinh dẫn truyền nhảy cóc nhanh hơn?', opts: ['Thân neuron', 'Eo Ranvier giữa các bao Myelin', 'Sợi nhánh', 'Cúc synapse'], correct: 1 },
  { q: 'Một cung phản xạ hoàn chỉnh gồm mấy bộ phận chính?', opts: ['3 bộ phận', '4 bộ phận', '5 bộ phận', '6 bộ phận'], correct: 2 },
  { q: 'Khi vô tình chạm tay vào vật nóng, phản xạ rút tay lại do bộ phận nào trực tiếp xử lý nhanh?', opts: ['Vỏ đại não', 'Chất xám ở tủy sống', 'Tiểu não', 'Hành não'], correct: 1 },
  { q: 'Trung khu điều khiển các hoạt động sống còn như hô hấp, tuần hoàn nằm ở đâu?', opts: ['Thân não', 'Đại não', 'Tiểu não', 'Tủy sống'], correct: 0 },
];

// --- 3D SUB-COMPONENTS ---

// 1. Brain: Detailed hemispheres with overlapping wrinkled structures
function DetailedBrain({ isActive, color }) {
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    if (isActive) {
      const t = s.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 4) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  // Wrinkle data to make the brain look realistic
  const folds = useMemo(() => {
    const list = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const isLeft = i < count / 2;
      const xOffset = isLeft ? -0.35 : 0.35;
      const y = (Math.random() - 0.5) * 0.9;
      const z = (Math.random() - 0.5) * 1.1;
      const rx = Math.random() * Math.PI;
      const ry = Math.random() * Math.PI;
      const rz = Math.random() * Math.PI;
      const size = 0.22 + Math.random() * 0.15;
      list.push({ x: xOffset + (Math.random() - 0.5) * 0.2, y, z, rx, ry, rz, size });
    }
    return list;
  }, []);

  const baseMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.1,
    bumpScale: 0.05,
  });

  return (
    <group ref={groupRef}>
      {/* Left Hemisphere Base */}
      <mesh position={[-0.35, 0, 0]} scale={[1, 0.8, 1.2]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <primitive object={baseMat} attach="material" />
      </mesh>
      {/* Right Hemisphere Base */}
      <mesh position={[0.35, 0, 0]} scale={[1, 0.8, 1.2]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Brain Wrinkles (Gyri) */}
      {folds.map((f, i) => (
        <mesh
          key={i}
          position={[f.x, f.y, f.z]}
          rotation={[f.rx, f.ry, f.rz]}
          scale={[1, 0.5, 1.5]}
        >
          <torusGeometry args={[f.size, 0.08, 8, 16]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            emissive={isActive ? '#fda4af' : '#000'}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </mesh>
      ))}

      {/* Longitudinal Fissure (Rãnh dọc não bộ) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 1.1, 1.5]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.9} opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

// 2. Cerebellum: Ribbed/striped structure
function DetailedCerebellum({ isActive, color }) {
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    if (isActive) {
      const t = s.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 4) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh scale={[1.2, 0.8, 1]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Parallel ridged plates representing striped folia */}
      {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.48 - Math.abs(y) * 0.4, 0.04, 6, 24]} />
          <meshStandardMaterial
            color={isActive ? '#f3e8ff' : color}
            roughness={0.7}
            emissive={isActive ? '#c084fc' : '#000'}
            emissiveIntensity={isActive ? 0.4 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3. Brainstem: Segmented structure
function DetailedBrainstem({ isActive, color }) {
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    if (isActive) {
      const t = s.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 4) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Midbrain (Não giữa) - Top segment */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.3, 12]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.5} />
      </mesh>

      {/* Pons (Cầu não) - Middle bulging segment */}
      <mesh position={[0, 0.05, 0.05]} scale={[1.2, 1, 1.2]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={isActive ? '#dbeafe' : '#60a5fa'}
          roughness={0.4}
          emissive={isActive ? '#3b82f6' : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>

      {/* Medulla Oblongata (Hành não) - Bottom tapering segment */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.18, 0.12, 0.5, 12]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
      </mesh>

      {/* Nerve tract lines flowing down */}
      {[-0.08, 0.08].map((x, idx) => (
        <mesh key={idx} position={[x, 0, 0.15]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
          <meshBasicMaterial color="#eff6ff" opacity={0.8} transparent />
        </mesh>
      ))}
    </group>
  );
}

// 4. Spinal Cord: Butterfly grey matter and nerve branches
function DetailedSpinalCord({ isActive, color }) {
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    if (isActive) {
      const t = s.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 4) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main white matter cord (Outer cylinder) */}
      <mesh>
        <cylinderGeometry args={[0.18, 0.16, 2.8, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Top Cross Section - Grey Matter Butterfly Shape */}
      <group position={[0, 1.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Left Wing */}
        <mesh position={[-0.06, 0, 0]} scale={[1.2, 0.6, 1]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Right Wing */}
        <mesh position={[0.06, 0, 0]} scale={[1.2, 0.6, 1]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Central Commissure */}
        <mesh position={[0, 0, 0]} scale={[0.8, 0.4, 1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Branching Spinal Nerves (Dây thần kinh tủy) extending laterally */}
      {[-1.0, -0.5, 0, 0.5, 1.0].map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          {/* Left Nerve */}
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.02, 0.01, 0.6, 6]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={isActive ? 0.5 : 0.1} />
          </mesh>
          {/* Right Nerve */}
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.02, 0.01, 0.6, 6]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={isActive ? 0.5 : 0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 5. Neuron: Detailed Soma, Dendrites, Axon with Myelin Sheaths and Ranvier Nodes
function DetailedNeuron({ isActive }) {
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;
    if (isActive) {
      const scale = 1 + Math.sin(t * 3.5) * 0.04;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Star-like Soma (Thân tế bào) */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>

        {/* Nucleus (Nhân) - Translucent outer, solid inner */}
        <mesh scale={0.5}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.6} />
        </mesh>
        <mesh scale={0.2}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#7f1d1d" />
        </mesh>

        {/* Dendrites (Sợi nhánh) branching off in star pattern */}
        {[0, 60, 120, 180, 240, 300].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const x = Math.cos(rad) * 0.4;
          const y = Math.sin(rad) * 0.4;
          return (
            <group key={i} rotation={[0, 0, rad]} position={[x * 0.5, y * 0.5, 0]}>
              <mesh>
                <cylinderGeometry args={[0.03, 0.015, 0.3, 6]} />
                <meshStandardMaterial color="#eab308" />
              </mesh>
              {/* Secondary branch */}
              <mesh position={[0.05, 0.2, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.015, 0.005, 0.2, 4]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
              <mesh position={[-0.05, 0.2, 0]} rotation={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.015, 0.005, 0.2, 4]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Long Axon (Sợi trục) extending downwards */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
        <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.2} />
      </mesh>

      {/* Blue Myelin Sheaths (Bao Myelin) - Sausage shaped sections */}
      {[0.5, -0.1, -0.7].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.45, 12]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.1} />
        </mesh>
      ))}

      {/* Nodes of Ranvier (Eo Ranvier) are the exposed yellow gaps between sheaths */}

      {/* Axon Terminals (Chùy Synapse) at the bottom */}
      <group position={[0, -1.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.01, 0.3, 6]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        {/* Branching terminals with buttons */}
        {[-0.15, 0, 0.15].map((x, idx) => (
          <group key={idx} position={[x, -0.2, 0]} rotation={[0, 0, x * 2]}>
            <mesh>
              <cylinderGeometry args={[0.01, 0.005, 0.25, 4]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>
            <mesh position={[0, -0.15, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#fb7185" emissive="#e11d48" emissiveIntensity={isActive ? 0.8 : 0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 6. Reflex Arc: Animated neural impulse flowing along sensory/motor paths
function DetailedReflexArc({ isActive }) {
  const groupRef = useRef();
  const impulseRef = useRef();
  const muscleRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;

    // Animate the neural impulse running along the arc path
    if (impulseRef.current) {
      const cycle = (t * 1.5) % 3.0; // 3-second loop
      if (cycle < 1.0) {
        // Phase 1: Receptor -> Spinal Cord (Sensory neuron, red path)
        const progress = cycle;
        const x = -1.2 + progress * 1.2;
        const y = -0.5 + progress * 1.3; // travel up to spinal cord
        impulseRef.current.position.set(x, y, 0);
        impulseRef.current.material.color.set('#f43f5e'); // Red impulse
      } else if (cycle < 1.5) {
        // Phase 2: Inside Spinal Cord (Interneuron, yellow path)
        const progress = (cycle - 1.0) * 2; // 0 to 1
        const x = 0;
        const y = 0.8 - progress * 0.4;
        impulseRef.current.position.set(x, y, 0.05);
        impulseRef.current.material.color.set('#fbbf24'); // Yellow impulse
      } else if (cycle < 2.5) {
        // Phase 3: Spinal Cord -> Muscle (Motor neuron, blue path)
        const progress = (cycle - 1.5); // 0 to 1
        const x = progress * 1.2;
        const y = 0.4 - progress * 1.1; // travel down to muscle
        impulseRef.current.position.set(x, y, 0);
        impulseRef.current.material.color.set('#3b82f6'); // Blue impulse
      } else {
        // Phase 4: Muscle Twitch (Effector reaction)
        const progress = (cycle - 2.5) * 2; // 0 to 1
        impulseRef.current.position.set(1.2, -0.7, 0);
        // Muscle contracts (bulges and twitches)
        if (muscleRef.current) {
          const twitch = 1 + Math.sin(progress * Math.PI) * 0.25;
          muscleRef.current.scale.set(twitch, 1.0, twitch);
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Skin Receptor (Cơ quan thụ cảm) - Hot Plate / Skin Patch on Left */}
      <group position={[-1.2, -0.6, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
          <meshStandardMaterial color="#fda4af" roughness={0.7} />
        </mesh>
        {/* Heat/Stimulus needles */}
        {[-0.1, 0.1].map((x, idx) => (
          <mesh key={idx} position={[x, 0.1, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.04, 0.15, 6]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
        ))}
      </group>

      {/* 2. Sensory Pathway (Đường cảm giác - Red line) */}
      <mesh position={[-0.6, 0.15, 0]} rotation={[0, 0, -0.8]}>
        <cylinderGeometry args={[0.02, 0.02, 1.7, 6]} />
        <meshBasicMaterial color="#ef4444" opacity={0.6} transparent />
      </mesh>

      {/* 3. Central Synapse / Spinal Cord section in middle */}
      <group position={[0, 0.6, 0]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.4, 12]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.4} />
        </mesh>
        {/* Butterfly grey matter inside */}
        <mesh position={[0, 0, 0]} scale={[1, 0.2, 1]}>
          <boxGeometry args={[0.2, 0.1, 0.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* 4. Motor Pathway (Đường vận động - Blue line) */}
      <mesh position={[0.6, -0.15, 0]} rotation={[0, 0, 0.8]}>
        <cylinderGeometry args={[0.02, 0.02, 1.7, 6]} />
        <meshBasicMaterial color="#3b82f6" opacity={0.6} transparent />
      </mesh>

      {/* 5. Effector Muscle (Cơ quan phản ứng - Muscle spindle) on Right */}
      <group position={[1.2, -0.7, 0]}>
        <mesh ref={muscleRef} scale={[1, 1, 1]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} bumpScale={0.05} />
        </mesh>
        {/* Muscle tendon attachments */}
        {[-0.3, 0.3].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.15, 6]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
        ))}
      </group>

      {/* 6. Neural Impulse (Xung thần kinh chạy dọc cung) */}
      <mesh ref={impulseRef} position={[-1.2, -0.5, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

// Render appropriate part based on ID
function InteractivePart({ part, isActive }) {
  if (part.id === 'brain') return <DetailedBrain isActive={isActive} color={part.color} />;
  if (part.id === 'cerebellum') return <DetailedCerebellum isActive={isActive} color={part.color} />;
  if (part.id === 'brainstem') return <DetailedBrainstem isActive={isActive} color={part.color} />;
  if (part.id === 'spinal') return <DetailedSpinalCord isActive={isActive} color={part.color} />;
  if (part.id === 'neuron') return <DetailedNeuron isActive={isActive} />;
  return <DetailedReflexArc isActive={isActive} />;
}

// Assembly Scene with lighting and orbit controls
function NervousScene({ parts, selectedIdx, visited }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <pointLight position={[0, 2, 4]} intensity={0.6} color="#f472b6" />
      <pointLight position={[-4, -2, 2]} intensity={0.4} color="#60a5fa" />

      {/* Render all structural parts */}
      {parts.map((p, i) => {
        const isCurrent = i === selectedIdx;
        return (
          <group key={p.id} position={p.id !== 'neuron' && p.id !== 'reflex' ? [0, 0, 0] : [0, 0, 0]}>
            <InteractivePart part={p} isActive={isCurrent} />
          </group>
        );
      })}

      {/* Main anatomical support rod (translucent spinal column background) */}
      <mesh position={[0, 0.5, -0.3]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.2, 5.0, 8]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.15} wireframe />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={8.5}
        target={[0, 0.8, 0]}
      />
    </>
  );
}

// --- MAIN INTERFACE ---

export default function NervousSystemGame3D({ onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visited, setVisited] = useState(['brain']);
  const [quizIdx, setQuizIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState(new Array(QUIZ.length).fill(null));

  const current = PARTS[selectedIdx];

  const handleSelect = (i) => {
    setSelectedIdx(i);
    if (!visited.includes(PARTS[i].id)) {
      setVisited(prev => [...prev, PARTS[i].id]);
    }
  };

  const handleQuizAnswer = (optIdx) => {
    if (feedback) return; // Prevent double clicking
    const isCorrect = optIdx === QUIZ[quizIdx].correct;

    // Store answer
    const nextAnswers = [...quizAnswers];
    nextAnswers[quizIdx] = isCorrect;
    setQuizAnswers(nextAnswers);

    setFeedback({
      type: isCorrect ? 'success' : 'error',
      msg: isCorrect ? 'Chính xác! Cấu tạo và chức năng rất chính xác.' : 'Chưa chính xác! Hãy đọc lại phần kiến thức nhé.'
    });

    setTimeout(() => {
      setFeedback(null);
      if (quizIdx < QUIZ.length - 1) {
        setQuizIdx(i => i + 1);
      } else {
        setPhase('complete');
      }
    }, 1600);
  };

  const correctCount = quizAnswers.filter(a => a === true).length;

  if (phase === 'intro') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-purple-500/20 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-purple-500/20">🧠</div>
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Hệ Thần Kinh 3D</h2>
          <p className="text-purple-200/80 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Hệ thống điều khiển tinh vi nhất hành tinh. Hãy tương tác trực quan 3D để khám phá bộ não, tủy sống, neuron và cung phản xạ sinh học.
          </p>

          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-8 text-left space-y-2.5">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <span className="text-purple-400 font-bold">1.</span>
              <span>Xoay, thu phóng mô hình 3D để quan sát đa chiều chân thực.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <span className="text-purple-400 font-bold">2.</span>
              <span>Lựa chọn và học sâu từng cấu trúc then chốt trong hệ thần kinh.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <span className="text-purple-400 font-bold">3.</span>
              <span>Vượt qua bài kiểm tra khoa học để hoàn thành bài học.</span>
            </div>
          </div>

          <button
            onClick={() => setPhase('explore')}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            Bắt đầu khám phá <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-emerald-500/20 animate-bounce">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành bài học!</h2>
          <p className="text-slate-400 text-sm mb-6">Bạn đã nắm vững các kiến thức nền tảng của Hệ thần kinh lớp 8.</p>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6">
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Kết quả kiểm tra</p>
            <p className="text-4xl font-black text-emerald-400">{correctCount} <span className="text-lg text-slate-500">/ {QUIZ.length}</span></p>
            <p className="text-xs text-slate-300 mt-2">Đạt yêu cầu xuất sắc chương trình sinh học.</p>
          </div>

          <button
            onClick={() => onComplete && onComplete(correctCount)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            Quay lại bảng điều khiển <Home className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = QUIZ[quizIdx];
    return (
      <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-30">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
          <div className="flex justify-between items-center mb-4">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Bài kiểm tra Hệ Thần Kinh</span>
            <span className="text-slate-400 text-xs font-medium">Câu {quizIdx + 1}/{QUIZ.length}</span>
          </div>

          {/* Quiz progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((quizIdx + 1) / QUIZ.length) * 100}%` }}
            />
          </div>

          <p className="text-white text-lg font-bold mb-6 leading-snug">{q.q}</p>

          <div className="space-y-3">
            {q.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleQuizAnswer(i)}
                className="w-full p-4 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/30 text-slate-200 hover:text-white rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-slate-800 group-hover:bg-purple-500/20 text-slate-300 group-hover:text-purple-300 rounded-lg flex items-center justify-center text-xs font-bold transition">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </div>
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center p-6 bg-slate-950/90 rounded-2xl transition-opacity duration-200`}>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {feedback.type === 'success' ? '✓' : '✗'}
                </div>
                <p className="text-white font-bold text-lg mb-2">{feedback.type === 'success' ? 'Chính xác!' : 'Chưa chính xác'}</p>
                <p className="text-slate-400 text-sm max-w-xs">{feedback.msg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col md:flex-row overflow-hidden select-none">
      {/* 3D Canvas Viewport */}
      <div className="flex-1 relative h-2/3 md:h-full">
        <Canvas camera={{ position: [0, 1.8, 6.5], fov: 48 }}>
          <color attach="background" args={['#09090b']} />
          <NervousScene parts={PARTS} selectedIdx={selectedIdx} visited={visited} />
        </Canvas>

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-850 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-semibold backdrop-blur-md pointer-events-auto flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Đã khám phá: {visited.length}/{PARTS.length} cấu trúc</span>
          </div>

          {visited.length >= 4 && (
            <button
              onClick={() => setPhase('quiz')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 rounded-xl text-white text-xs font-bold pointer-events-auto shadow-lg shadow-purple-500/20 hover:scale-[1.03] active:scale-[0.97] transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Làm kiểm tra →
            </button>
          )}
        </div>

        {/* Interactive instructions helper */}
        <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <p className="text-[10px] text-slate-400">❖ Kéo để xoay | Cuộn để phóng to</p>
        </div>
      </div>

      {/* Side Knowledge & Control Panel */}
      <div className="w-full md:w-96 bg-slate-900/85 border-t md:border-t-0 md:border-l border-slate-800 backdrop-blur-xl flex flex-col h-1/3 md:h-full relative z-10 shadow-2xl">
        {/* Horizontal Navigation List */}
        <div className="p-4 border-b border-slate-800">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Danh sách cấu trúc</p>
          <div className="flex md:grid md:grid-cols-2 gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {PARTS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelect(i)}
                className={`flex-shrink-0 md:flex-shrink-1 px-3 py-2 rounded-lg text-left text-xs font-medium transition flex items-center justify-between gap-2 ${i === selectedIdx
                    ? 'text-white border border-purple-500/40 bg-purple-500/15'
                    : visited.includes(p.id)
                      ? 'bg-slate-850 text-emerald-400 border border-emerald-500/10'
                      : 'bg-slate-850/50 text-slate-400 border border-transparent hover:bg-slate-800'
                  }`}
              >
                <span className="truncate">{p.name.split(' (')[0]}</span>
                {visited.includes(p.id) && <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Knowledge Details */}
        {current && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: current.color }}>Cấu trúc đang xem</span>
              <h3 className="text-xl font-black text-white leading-tight mt-0.5">{current.name}</h3>
            </div>

            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-850 pb-1">Kiến thức Sinh học lớp 8</span>
              <ul className="space-y-2.5">
                {current.facts.map((f, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: current.color }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Bottom Panel Actions */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Hệ Thần Kinh 3D • Lớp 8</span>
          {selectedIdx < PARTS.length - 1 ? (
            <button
              onClick={() => handleSelect(selectedIdx + 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              Cấu trúc tiếp theo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            visited.length >= 4 && (
              <button
                onClick={() => setPhase('quiz')}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                Vào làm kiểm tra <Play className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
