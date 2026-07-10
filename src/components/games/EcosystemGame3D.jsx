// EcosystemGame3D.jsx - Game hệ sinh thái 3D cải tiến vượt trội (Lớp 6)
// Sửa lỗi con mồi không chết ngay bằng cơ chế cập nhật 2 bước độc lập (eatenIds Set), sửa nút bảng trái tự hủy chọn khi click lại.

import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { 
  RotateCcw, Trophy, ArrowRight, Play, Pause, Activity, RefreshCw, X, Flame, Droplets, Skull, Trash2, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';

// Định nghĩa thông số các loài sinh vật
const ORGANISM_TYPES = {
  tree: { name: 'Cây sồi', type: 'producer', color: '#15803d', energy: 250, icon: '🌳', desc: 'Sinh vật sản xuất bền bỉ. Tuổi thọ cực cao, hầu như không tự mất năng lượng.' },
  grass: { name: 'Cỏ bụi', type: 'producer', color: '#4ade80', energy: 70, icon: '🌿', desc: 'Sinh vật sản xuất. Tự quang hợp phát triển, thức ăn chính của Thỏ.' },
  flower: { name: 'Hoa rừng', type: 'producer', color: '#ec4899', energy: 60, icon: '🌸', desc: 'Sinh vật sản xuất ngọt ngào. Thu hút côn trùng và là nơi Nhái bén kiếm ăn.' },
  rabbit: { name: 'Thỏ rừng', type: 'herbivore', color: '#e2e8f0', energy: 100, icon: '🐰', desc: 'Động vật ăn cỏ nhanh nhẹn. Thức ăn chính của Cáo đỏ và Hổ rừng.' },
  deer: { name: 'Hươu sao', type: 'herbivore', color: '#b45309', energy: 180, icon: '🦌', desc: 'Động vật ăn cỏ cỡ lớn. Thức ăn ưa thích hàng đầu của Hổ rừng.' },
  frog: { name: 'Nhái bén', type: 'carnivore', color: '#22c55e', energy: 90, icon: '🐸', desc: 'Thú ăn thịt nhỏ. Cần độ ẩm sông nước để sinh tồn, săn côn trùng quanh Hoa.' },
  fox: { name: 'Cáo đỏ', type: 'carnivore', color: '#f97316', energy: 180, icon: '🦊', desc: 'Thú ăn thịt vừa. Săn thỏ rừng, nhái bén; trốn chạy trước Hổ lớn.' },
  tiger: { name: 'Hổ rừng', type: 'carnivore', color: '#ea580c', energy: 280, icon: '🐯', desc: 'Thú ăn thịt đầu bảng dũng mãnh. Săn lùng hươu sao, cáo đỏ và thỏ rừng.' },
  mushroom: { name: 'Nấm ôn đới', type: 'decomposer', color: '#a855f7', energy: 40, icon: '🍄', desc: 'Sinh vật phân giải. Hấp thụ phân hủy các xác hữu cơ để làm màu mỡ đất.' },
};

// --- CÁC COMPONENT MÔ HÌNH 3D NGHỆ THUẬT MEMOIZED ---

const Tree3D = memo(function Tree3D({ isDead = false, energy = 250 }) {
  const scale = 0.6 + (energy / 250) * 0.5;
  return (
    <group scale={isDead ? 0.5 : scale}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.2, 8]} />
        <meshStandardMaterial color={isDead ? "#5c4033" : "#78350f"} roughness={0.9} />
      </mesh>
      {!isDead && (
        <>
          <mesh position={[0, 1.4, 0]} castShadow>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#166534" roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0.4, 1.9, 0.2]} castShadow scale={0.75}>
            <dodecahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} flatShading />
          </mesh>
          <mesh position={[-0.3, 2.0, -0.3]} castShadow scale={0.7}>
            <dodecahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} flatShading />
          </mesh>
        </>
      )}
    </group>
  );
});

const Grass3D = memo(function Grass3D({ isDead = false, energy = 70 }) {
  const scale = 0.5 + (energy / 70) * 0.6;
  return (
    <group scale={scale}>
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} rotation={[0, 0, (i - 1) * 0.25]} castShadow>
          <coneGeometry args={[0.04, 0.45, 4]} />
          <meshStandardMaterial color={isDead ? "#a16207" : "#22c55e"} roughness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
});

const Flower3D = memo(function Flower3D({ isDead = false, energy = 60 }) {
  const scale = 0.5 + (energy / 60) * 0.6;
  return (
    <group scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.4, 4]} />
        <meshStandardMaterial color={isDead ? "#78350f" : "#16a34a"} />
      </mesh>
      {!isDead && (
        <group position={[0, 0.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#facc15" roughness={0.2} />
          </mesh>
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#db2777" roughness={0.4} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
});

const Rabbit3D = memo(function Rabbit3D({ stateTime = 0, isMoving = false, isChased = false }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current && isMoving) {
      const speed = isChased ? 15 : 7;
      const jump = Math.max(0, Math.sin(state.clock.elapsedTime * speed + stateTime)) * 0.3;
      groupRef.current.position.y = jump;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed + stateTime) * 0.2;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.26, 0.18, 0.18]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.15, 0.22, 0]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} flatShading />
      </mesh>
      <group position={[0.12, 0.28, 0]}>
        <mesh position={[0, 0.09, 0.04]} rotation={[-0.1, 0, -0.2]} castShadow>
          <boxGeometry args={[0.03, 0.16, 0.04]} />
          <meshStandardMaterial color="#f8fafc" flatShading />
        </mesh>
        <mesh position={[0, 0.09, -0.04]} rotation={[0.1, 0, -0.2]} castShadow>
          <boxGeometry args={[0.03, 0.16, 0.04]} />
          <meshStandardMaterial color="#f8fafc" flatShading />
        </mesh>
      </group>
    </group>
  );
});

const Deer3D = memo(function Deer3D({ stateTime = 0, isMoving = false }) {
  const bodyRef = useRef();

  useFrame((state) => {
    if (bodyRef.current && isMoving) {
      bodyRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 4 + stateTime)) * 0.1;
      bodyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4 + stateTime) * 0.06;
    } else if (bodyRef.current) {
      bodyRef.current.position.y = 0;
      bodyRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={bodyRef}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.48, 0.28, 0.24]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.24, 0.58, 0]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.1, 0.38, 0.1]} />
        <meshStandardMaterial color="#b45309" flatShading />
      </mesh>
      <mesh position={[0.32, 0.78, 0]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.12]} />
        <meshStandardMaterial color="#d97706" flatShading />
      </mesh>
      <group position={[0.28, 0.86, 0]}>
        <mesh position={[0, 0.14, 0.06]} rotation={[0.1, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.01, 0.018, 0.24, 4]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh position={[0, 0.14, -0.06]} rotation={[-0.1, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.01, 0.018, 0.24, 4]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      </group>
    </group>
  );
});

const Frog3D = memo(function Frog3D({ stateTime = 0, isMoving = false }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current && isMoving) {
      const jumpCycle = (state.clock.elapsedTime * 6 + stateTime) % (Math.PI * 2);
      const hop = jumpCycle < Math.PI ? Math.sin(jumpCycle) * 0.25 : 0;
      groupRef.current.position.y = hop;
      groupRef.current.scale.z = hop > 0.05 ? 1.2 : 1.0;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
      groupRef.current.scale.z = 1.0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.2, 0.11, 0.16]} />
        <meshStandardMaterial color="#22c55e" roughness={0.4} flatShading />
      </mesh>
      <mesh position={[0.08, 0.14, 0.05]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh position={[0.08, 0.14, -0.05]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
    </group>
  );
});

const Fox3D = memo(function Fox3D({ stateTime = 0, isMoving = false, isHunting = false }) {
  const foxRef = useRef();

  useFrame((state) => {
    if (foxRef.current && isMoving) {
      const runSpeed = isHunting ? 14 : 7;
      foxRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * runSpeed + stateTime)) * 0.14;
      foxRef.current.rotation.z = Math.sin(state.clock.elapsedTime * runSpeed + stateTime) * 0.1;
    } else if (foxRef.current) {
      foxRef.current.position.y = 0;
      foxRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={foxRef}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.44, 0.2, 0.18]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.28, 0.34, 0]} castShadow>
        <boxGeometry args={[0.15, 0.14, 0.14]} />
        <meshStandardMaterial color="#f97316" flatShading />
      </mesh>
      <group position={[-0.24, 0.22, 0]} rotation={[0, 0, -0.4]}>
        <mesh position={[-0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.12]} />
          <meshStandardMaterial color="#ea580c" flatShading />
        </mesh>
        <mesh position={[-0.24, 0, 0]} scale={0.8}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
});

const Tiger3D = memo(function Tiger3D({ stateTime = 0, isMoving = false, isHunting = false }) {
  const tigerRef = useRef();

  useFrame((state) => {
    if (tigerRef.current && isMoving) {
      const speed = isHunting ? 15 : 6;
      tigerRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * speed + stateTime)) * 0.16;
      tigerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * speed + stateTime) * 0.08;
    } else if (tigerRef.current) {
      tigerRef.current.position.y = 0;
      tigerRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={tigerRef}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.68, 0.34, 0.3]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.44, 0.52, 0]} castShadow>
        <boxGeometry args={[0.24, 0.24, 0.22]} />
        <meshStandardMaterial color="#ea580c" flatShading />
      </mesh>
      <group position={[-0.34, 0.35, 0]} rotation={[0, 0, -0.6]}>
        <mesh position={[-0.15, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial color="#ea580c" />
        </mesh>
      </group>
      <mesh position={[0, 0.53, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.31]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.16, 0.53, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.31]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.16, 0.53, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.31]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
    </group>
  );
});

const Mushroom3D = memo(function Mushroom3D({ energy = 40 }) {
  const scale = 0.6 + (energy / 40) * 0.5;
  return (
    <group scale={scale}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.2, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.11, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} flatShading />
      </mesh>
    </group>
  );
});

const DeadOrganism3D = memo(function DeadOrganism3D({ type }) {
  const bodySize = type === 'tiger' ? 0.38 : type === 'deer' ? 0.3 : type === 'fox' ? 0.22 : 0.16;
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.06, 0]}>
      <mesh castShadow>
        <boxGeometry args={[bodySize * 1.8, bodySize, bodySize]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} flatShading transparent opacity={0.6} />
      </mesh>
    </group>
  );
});

// --- ĐỊA HÌNH THUNG LŨNG 3D ---
const TerrainAndRiver = memo(function TerrainAndRiver({ weather, onGroundClick, onGroundPointerMove, onGroundPointerUp }) {
  const riverWidth = weather === 'drought' ? 1.1 : 3.4;
  
  const groundColor = useMemo(() => {
    if (weather === 'drought') return '#5c533c';
    if (weather === 'acid_rain') return '#2d4a0a';
    return '#1b4314';
  }, [weather]);

  const riverColor = useMemo(() => {
    if (weather === 'drought') return '#65a30d';
    if (weather === 'acid_rain') return '#3f6212';
    return '#0284c7';
  }, [weather]);

  const hillMeshes = useMemo(() => {
    return [
      { pos: [-13.5, 0.8, -4], rot: [0, 0.1, 0.4], size: [4, 4, 12], color: weather === 'drought' ? '#453f30' : '#166534' },
      { pos: [-13.2, 1.2, 6], rot: [0, -0.1, 0.45], size: [4, 5, 14], color: weather === 'drought' ? '#3d372a' : '#14532d' },
      { pos: [13.5, 0.8, -5], rot: [0, -0.1, -0.4], size: [4, 4, 12], color: weather === 'drought' ? '#453f30' : '#166534' },
      { pos: [13.2, 1.2, 5], rot: [0, 0.1, -0.45], size: [4, 5, 14], color: weather === 'drought' ? '#3d372a' : '#14532d' },
    ];
  }, [weather]);

  const decorativeStones = useMemo(() => {
    return [
      { pos: [-2.2, 0.1, -8], scale: 0.3, rot: [0.2, 0.5, 0.8] },
      { pos: [-2.0, 0.05, -7.5], scale: 0.2, rot: [0.9, 0.1, 0.3] },
      { pos: [2.3, 0.1, -3], scale: 0.35, rot: [0.5, 0.2, 1.1] },
      { pos: [2.1, 0.08, 5], scale: 0.28, rot: [1.2, 0.6, 0.1] },
      { pos: [-2.1, 0.1, 8], scale: 0.4, rot: [0.1, 0.9, 0.4] },
      { pos: [2.2, 0.05, 9], scale: 0.22, rot: [0.4, 0.3, 0.7] },
    ];
  }, []);

  const waterRef = useRef();
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.04 + Math.sin(state.clock.elapsedTime * 1.5) * 0.012;
    }
  });

  return (
    <group>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick(e);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          onGroundPointerMove(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onGroundPointerUp(e);
        }}
      >
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color={groundColor} roughness={0.85} />
      </mesh>

      <mesh 
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.04, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick(e);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          onGroundPointerMove(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onGroundPointerUp(e);
        }}
      >
        <planeGeometry args={[riverWidth, 26]} />
        <meshStandardMaterial 
          color={riverColor} 
          roughness={0.1} 
          metalness={0.85} 
          transparent 
          opacity={weather === 'drought' ? 0.6 : 0.85} 
        />
      </mesh>

      {weather !== 'drought' && [-10, -5, 2, 7].map((z, idx) => (
        <mesh key={idx} position={[Math.sin(z) * 0.4, -0.02, z]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[0.22, 8]} />
          <meshStandardMaterial color="#065f46" roughness={0.9} />
        </mesh>
      ))}

      {hillMeshes.map((h, i) => (
        <mesh key={i} position={h.pos} rotation={h.rot} castShadow receiveShadow>
          <boxGeometry args={h.size} />
          <meshStandardMaterial color={h.color} roughness={1.0} flatShading />
        </mesh>
      ))}

      {decorativeStones.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} scale={s.scale} castShadow>
          <dodecahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial color="#78716c" roughness={0.8} flatShading />
        </mesh>
      ))}

      <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.08, 1.8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.35, -0.85]} castShadow>
          <boxGeometry args={[3.8, 0.05, 0.05]} />
          <meshStandardMaterial color="#713f12" />
        </mesh>
        <mesh position={[0, 0.35, 0.85]} castShadow>
          <boxGeometry args={[3.8, 0.05, 0.05]} />
          <meshStandardMaterial color="#713f12" />
        </mesh>
        {[-1.8, -0.9, 0, 0.9, 1.8].map((x, idx) => (
          <group key={idx}>
            <mesh position={[x, 0.2, -0.85]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.34, 4]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
            <mesh position={[x, 0.2, 0.85]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.34, 4]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});

// Đường truyền năng lượng 3D chạy dọc mũi tên
const EnergyFlowArrow3D = memo(function EnergyFlowArrow3D({ start, end }) {
  const ref = useRef();
  
  const points = useMemo(() => {
    const pStart = new THREE.Vector3(start[0], start[1] + 0.3, start[2]);
    const pEnd = new THREE.Vector3(end[0], end[1] + 0.3, end[2]);
    return { start: pStart, end: pEnd };
  }, [start, end]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.dashOffset = -state.clock.elapsedTime * 2.0;
    }
  });

  const direction = new THREE.Vector3().subVectors(points.end, points.start);
  const length = direction.length();
  const midPoint = new THREE.Vector3().addVectors(points.start, points.end).multiplyScalar(0.5);

  return (
    <group position={midPoint}>
      <object3D ref={ref} onUpdate={(self) => self.lookAt(points.end)}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, length, 6]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, length / 2 - 0.1, 0]}>
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </object3D>
    </group>
  );
});

// Component Sinh vật tổng hợp
const SimulationOrganism = memo(function SimulationOrganism({ 
  id, 
  type, 
  position, 
  rotationY = 0,
  isDead, 
  energy, 
  selectedOrganismId, 
  onClickOrganism, 
  isChased, 
  isHunting, 
  isMoving, 
  weather,
  onPointerDown 
}) {
  const isSelected = selectedOrganismId === id;
  const typeData = ORGANISM_TYPES[type];

  // Quyết định biểu tượng cảnh báo hiển thị trên đầu sinh vật
  const warningText = useMemo(() => {
    if (isDead) return null;
    if (isChased) return '⚠️ BỊ SĂN';
    
    if (weather === 'epidemic' && typeData.type !== 'producer' && typeData.type !== 'decomposer') {
      return '⚠️ BỊ BỆNH';
    }

    const isFrogFarFromWater = type === 'frog' && Math.abs(position[0]) >= 2.2;
    if (isFrogFarFromWater && energy < 65) return '⚠️ KHÔ KHÁT';
    
    if (energy < typeData.energy * 0.4 && typeData.type !== 'producer') return '⚠️ ĐÓI';
    if (energy < typeData.energy * 0.4 && typeData.type === 'producer') return '⚠️ HÉO';
    return null;
  }, [isDead, isChased, energy, typeData, type, position, weather]);

  return (
    <group 
      position={position} 
      rotation={[0, rotationY, 0]}
    >
      {/* Vòng va chạm tàng hình lớn giúp click và kéo thả (Drag/Click) nhạy bén 100% */}
      <mesh 
        position={[0, type === 'tree' ? 0.8 : 0.2, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClickOrganism(id);
        }}
      >
        <boxGeometry args={[0.8, type === 'tree' ? 2.0 : 0.7, 0.8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Nhãn nổi trên đầu (HTML Overlay) */}
      <Html position={[0, type === 'tree' || type === 'tiger' ? 1.4 : 0.8, 0]} center distanceFactor={6}>
        <div className="flex flex-col items-center select-none pointer-events-none space-y-1 w-20">
          {warningText && (
            <div className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white whitespace-nowrap animate-pulse ${
              warningText.includes('BỊ SĂN') ? 'bg-red-600' : 
              warningText.includes('BỊ BỆNH') ? 'bg-rose-700 font-bold' :
              warningText.includes('KHÔ KHÁT') ? 'bg-cyan-600' : 'bg-amber-600'
            }`}>
              {warningText}
            </div>
          )}

          {!isDead && (
            <div className="w-full bg-black/85 border border-white/10 rounded px-1 py-0.5 text-[7px] text-center text-white shadow-md">
              <div className="font-bold truncate">{typeData.name}</div>
              <div className="w-full h-1 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    energy > typeData.energy * 0.7 ? 'bg-green-500' : 
                    energy > typeData.energy * 0.35 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${Math.min(100, (energy / typeData.energy) * 100)}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      </Html>

      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.45, 0.52, 16]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {!isDead && weather === 'epidemic' && typeData.type !== 'producer' && typeData.type !== 'decomposer' && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.35, 0.38, 8]} />
          <meshBasicMaterial color="#be123c" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {isDead ? (
        type === 'mushroom' ? null : <DeadOrganism3D type={type} />
      ) : (
        <>
          {type === 'tree' && <Tree3D energy={energy} />}
          {type === 'grass' && <Grass3D energy={energy} />}
          {type === 'flower' && <Flower3D energy={energy} />}
          {type === 'rabbit' && <Rabbit3D stateTime={id.charCodeAt(0) % 5} isMoving={isMoving} isChased={isChased} />}
          {type === 'deer' && <Deer3D stateTime={id.charCodeAt(0) % 5} isMoving={isMoving} />}
          {type === 'frog' && <Frog3D stateTime={id.charCodeAt(0) % 5} isMoving={isMoving} />}
          {type === 'fox' && <Fox3D stateTime={id.charCodeAt(0) % 5} isMoving={isMoving} isHunting={isHunting} />}
          {type === 'tiger' && <Tiger3D stateTime={id.charCodeAt(0) % 5} isMoving={isMoving} isHunting={isHunting} />}
          {type === 'mushroom' && <Mushroom3D energy={energy} />}
        </>
      )}
    </group>
  );
});

// Bầu không khí và bối cảnh
function EcosystemScene({ 
  organisms, 
  selectedOrganismId, 
  onClickOrganism, 
  energyFlows, 
  onGroundClick,
  onGroundPointerMove, 
  onGroundPointerUp, 
  onOrganismPointerDown,
  isDraggingAny,
  weather
}) {
  return (
    <>
      <ambientLight 
        intensity={weather === 'acid_rain' ? 0.35 : weather === 'drought' ? 0.85 : 0.65} 
        color={weather === 'acid_rain' ? '#a7f3d0' : '#ffffff'} 
      />
      <directionalLight 
        position={[15, 22, 12]} 
        intensity={weather === 'acid_rain' ? 0.5 : weather === 'drought' ? 1.4 : 1.3} 
        color={weather === 'drought' ? '#fed7aa' : '#ffffff'}
        castShadow 
        shadow-mapSize-width={512} 
        shadow-mapSize-height={512}
      />
      
      <Sky 
        sunPosition={weather === 'drought' ? [120, 40, 120] : [90, 20, 90]} 
        turbidity={weather === 'acid_rain' ? 15 : weather === 'drought' ? 4 : 6} 
        rayleigh={weather === 'acid_rain' ? 4 : weather === 'drought' ? 0.8 : 1.2} 
      />
      
      {weather !== 'acid_rain' && (
        <Stars radius={100} depth={50} count={500} factor={2} saturation={0.5} fade speed={0.5} />
      )}
      
      <TerrainAndRiver 
        weather={weather}
        onGroundClick={onGroundClick}
        onGroundPointerMove={onGroundPointerMove}
        onGroundPointerUp={onGroundPointerUp}
      />
      
      {organisms.map((org) => (
        <SimulationOrganism 
          key={org.id}
          id={org.id}
          type={org.type}
          position={org.position}
          rotationY={org.rotationY}
          isDead={org.isDead}
          energy={org.energy}
          selectedOrganismId={selectedOrganismId}
          onClickOrganism={onClickOrganism}
          isChased={org.isChased}
          isHunting={org.isHunting}
          isMoving={org.isMoving}
          weather={weather}
          onPointerDown={onOrganismPointerDown}
        />
      ))}

      {energyFlows.map((flow, idx) => (
        <EnergyFlowArrow3D key={idx} start={flow.start} end={flow.end} />
      ))}
      
      <OrbitControls 
        enabled={!isDraggingAny}
        enablePan={!isDraggingAny}
        minDistance={4}
        maxDistance={26}
        maxPolarAngle={Math.PI * 0.45}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

// --- MAIN COMPONENT GAME HỆ SINH THÁI ---
export default function EcosystemGame3D({ onComplete }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [organisms, setOrganisms] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedOrganism, setSelectedOrganism] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [ecoStatus, setEcoStatus] = useState('Khởi động');
  const [gameComplete, setGameComplete] = useState(false);
  const [weather, setWeather] = useState('normal');
  
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  // Quản lý kéo thả
  const [draggedOrganismId, setDraggedOrganismId] = useState(null);
  const isDraggingRef = useRef(false);

  // Dữ liệu biểu đồ
  const [history, setHistory] = useState([]);
  const timeTickRef = useRef(0);
  const ticksCounterRef = useRef(0);

  const [floatingTexts, setFloatingTexts] = useState([]);

  // Thống kê số lượng sinh vật còn sống
  const counts = useMemo(() => {
    const countsMap = { producer: 0, herbivore: 0, carnivore: 0, decomposer: 0, dead: 0 };
    organisms.forEach(org => {
      if (org.isDead) {
        countsMap.dead += 1;
      } else {
        const cat = ORGANISM_TYPES[org.type].type;
        countsMap[cat] += 1;
      }
    });
    return countsMap;
  }, [organisms]);

  const [energyFlows, setEnergyFlows] = useState([]);

  // Khởi tạo bản đồ thung lũng sinh thái
  useEffect(() => {
    const defaultSetup = [
      { id: 't1', type: 'tree', position: [-6, 0, -5], rotationY: 0, age: 0, energy: 250, isDead: false, isMoving: false },
      { id: 't2', type: 'tree', position: [7, 0, 6], rotationY: 0, age: 0, energy: 250, isDead: false, isMoving: false },
      { id: 'g1', type: 'grass', position: [-4, 0, 4], rotationY: 0, age: 0, energy: 70, isDead: false, isMoving: false },
      { id: 'g2', type: 'grass', position: [-8, 0, 8], rotationY: 0, age: 0, energy: 70, isDead: false, isMoving: false },
      { id: 'f1', type: 'flower', position: [5, 0, -7], rotationY: 0, age: 0, energy: 60, isDead: false, isMoving: false },
      { id: 'r1', type: 'rabbit', position: [-2, 0, 3], rotationY: 1.5, age: 0, energy: 100, targetPosition: null, targetId: null, isChased: false, isMoving: true, wanderDelay: 0 },
      { id: 'd1', type: 'deer', position: [3, 0, 5], rotationY: -1.0, age: 0, energy: 180, targetPosition: null, targetId: null, isMoving: true, wanderDelay: 0 },
      { id: 'x1', type: 'fox', position: [-4, 0, -3], rotationY: 0.5, age: 0, energy: 180, targetPosition: null, targetId: null, isHunting: false, isMoving: true, wanderDelay: 0 },
      { id: 'm1', type: 'mushroom', position: [-5.5, 0, -4], rotationY: 0, age: 0, energy: 40, isDead: false, isMoving: false }
    ];
    setOrganisms(defaultSetup);
  }, []);

  // Hiệu ứng bong bóng mất sau 1.2s
  useEffect(() => {
    if (floatingTexts.length > 0) {
      const timer = setTimeout(() => {
        setFloatingTexts(prev => prev.slice(1));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [floatingTexts]);

  // AI HÀNH VI DI CHUYỂN, SĂN MỒI CHẾT NGAY BẰNG THUẬT TOÁN 2-PASS, CHUỖI THỨC ĂN (100ms)
  useEffect(() => {
    if (!isSimulating || gameComplete || isDraggingRef.current) return;

    const interval = setInterval(() => {
      setOrganisms((prevOrgs) => {
        // --- BƯỚC 1: TIÊU HAO NĂNG LƯỢNG & ĐẾM NGƯỢC XÁC CHẾT ---
        let nextOrgs = prevOrgs.map((org) => {
          const typeData = ORGANISM_TYPES[org.type];
          
          if (org.isDead) {
            const nextTimer = (org.deathTimer !== undefined ? org.deathTimer : 50) - 1;
            const nextEnergy = Math.max(0, org.energy - (org.energy / (nextTimer + 1)));
            return { 
              ...org, 
              deathTimer: nextTimer, 
              energy: nextEnergy, 
              isDead: true,
              isMoving: false 
            };
          }

          // Tiêu hao năng lượng nền mỗi 100ms
          let loss = 0.2;
          if (typeData.type === 'herbivore') loss = 0.35;
          if (typeData.type === 'carnivore') loss = 0.5;
          if (org.type === 'tiger') loss = 0.65;

          // Ếch mất nước khi ở xa sông
          const isFrog = org.type === 'frog';
          const isFrogFarFromWater = isFrog && Math.abs(org.position[0]) >= (weather === 'drought' ? 1.0 : 2.2);
          if (isFrogFarFromWater) {
            loss = loss * (weather === 'drought' ? 4.5 : 3.0);
          }

          if (weather === 'epidemic' && typeData.type !== 'producer' && typeData.type !== 'decomposer') {
            loss = loss * 2.2;
          }

          if (org.energy < typeData.energy * 0.4) {
            loss = loss * 1.8;
          }

          if (weather === 'drought' && typeData.type === 'producer') loss += 0.65;
          if (weather === 'acid_rain' && typeData.type === 'producer') loss += 0.85;

          let nextEnergy = org.energy - loss;
          
          if (typeData.type === 'producer' && weather === 'normal' && nextEnergy < typeData.energy) {
            nextEnergy = Math.min(typeData.energy, nextEnergy + 0.15);
          }

          const isDead = nextEnergy <= 0;
          let energyOnDeath = 40;
          if (org.type === 'tiger') energyOnDeath = 80;
          if (org.type === 'deer') energyOnDeath = 60;

          if (isDead) {
            return {
              ...org,
              energy: energyOnDeath,
              isDead: true,
              deathTimer: 50, // Đúng 5 giây biến mất
              isMoving: false,
              targetPosition: null,
              targetId: null
            };
          }

          return { ...org, energy: nextEnergy };
        });

        // Lọc xác chết đã cạn thời gian
        nextOrgs = nextOrgs.filter(org => !org.isDead || (org.deathTimer !== undefined ? org.deathTimer > 0 : true));

        // Tập hợp chứa thông tin ăn uống trung gian
        const eatenIds = new Set(); // Chứa các ID động vật bị đớp trong tick này
        const eatenPlantDamages = {}; // Chứa lượng năng lượng thực vật bị ăn trong tick này
        const activeFlows = [];
        const newFloatingTexts = [];

        // --- BƯỚC 2: AI PHÂN TÍCH DI CHUYỂN, ĐÁNH DẤU ĂN MỒI ---
        nextOrgs = nextOrgs.map((org) => {
          if (org.isDead || ORGANISM_TYPES[org.type].type === 'producer' || org.type === 'mushroom') {
            return org;
          }

          const typeData = ORGANISM_TYPES[org.type];
          const isHungry = org.energy < typeData.energy * 0.65;
          let targetPos = org.targetPosition;
          let targetId = org.targetId;
          let isHunting = false;
          let speed = 0.07;

          if (org.type === 'rabbit') speed = 0.1;
          if (org.type === 'deer') speed = 0.08;
          if (org.type === 'frog') speed = 0.06;
          if (org.type === 'fox') speed = 0.11;
          if (org.type === 'tiger') speed = 0.12;

          if (weather === 'epidemic') {
            speed = speed * 0.5;
          }

          // A1. Ếch khát nước tìm sông cứu mạng
          const isFrog = org.type === 'frog';
          const isFrogDry = isFrog && Math.abs(org.position[0]) >= (weather === 'drought' ? 1.0 : 2.2);
          if (isFrogDry && org.energy < 70) {
            targetPos = [0, 0, org.position[2]];
            targetId = null;
            speed = speed * 1.3;
          }
          // A2. Động vật ăn thịt săn tìm con mồi
          else if (typeData.type === 'carnivore' && isHungry) {
            let preyTypes = [];
            if (org.type === 'tiger') preyTypes = ['deer', 'fox', 'rabbit'];
            if (org.type === 'fox') preyTypes = ['rabbit', 'frog'];
            if (org.type === 'frog') preyTypes = ['flower'];

            const potentialPreys = nextOrgs.filter(p => !p.isDead && preyTypes.includes(p.type));
            
            if (potentialPreys.length > 0) {
              let closestPrey = potentialPreys[0];
              let minDist = Infinity;
              potentialPreys.forEach(p => {
                const dist = Math.hypot(p.position[0] - org.position[0], p.position[2] - org.position[2]);
                if (dist < minDist) { minDist = dist; closestPrey = p; }
              });

              targetPos = closestPrey.position;
              targetId = closestPrey.id;
              isHunting = true;
              speed = speed * 1.5;
            } else {
              targetId = null;
            }
          } 
          // A3. Động vật ăn cỏ kiếm cỏ/hoa
          else if (typeData.type === 'herbivore' && isHungry) {
            const potentialPlants = nextOrgs.filter(p => !p.isDead && ORGANISM_TYPES[p.type].type === 'producer');
            
            if (potentialPlants.length > 0) {
              let closestPlant = potentialPlants[0];
              let minDist = Infinity;
              potentialPlants.forEach(p => {
                const dist = Math.hypot(p.position[0] - org.position[0], p.position[2] - org.position[2]);
                if (dist < minDist) { minDist = dist; closestPlant = p; }
              });

              targetPos = closestPlant.position;
              targetId = closestPlant.id;
              speed = speed * 1.25;
            } else {
              targetId = null;
            }
          } else {
            targetId = null;
          }

          // B. ĐI TUẦN TRA TỰ NHIÊN
          if (!targetPos) {
            if (org.wanderDelay > 0) {
              return { ...org, wanderDelay: org.wanderDelay - 1, isMoving: false };
            } else {
              const rx = (Math.random() - 0.5) * 16;
              const rz = (Math.random() - 0.5) * 16;
              targetPos = [rx, 0, rz];
              targetId = null;
              org.wanderDelay = 0;
            }
          }

          // C. TÍNH TOÁN DI CHUYỂN & ĐÁNH DẤU ĂN MỒI CẬN CHIẾN
          if (targetPos) {
            const dx = targetPos[0] - org.position[0];
            const dz = targetPos[2] - org.position[2];
            const dist = Math.hypot(dx, dz);

            if (dist > 0.55) {
              const angle = Math.atan2(dx, dz);
              const nextX = org.position[0] + (dx / dist) * speed;
              const nextZ = org.position[2] + (dz / dist) * speed;

              const clampedX = Math.max(-11.0, Math.min(11.0, nextX));
              const clampedZ = Math.max(-11.0, Math.min(11.0, nextZ));

              // Cảnh báo con mồi bị săn đuổi
              if (isHunting && targetId) {
                nextOrgs = nextOrgs.map(p => {
                  if (p.id === targetId) return { ...p, isChased: true };
                  return p;
                });
              }

              return { 
                ...org, 
                position: [clampedX, 0, clampedZ], 
                rotationY: angle, 
                targetPosition: targetPos,
                targetId: targetId,
                isMoving: true,
                isHunting: isHunting
              };
            } else {
              // ĐÃ ĐẾN SÁT MỤC TIÊU: Tiến hành đánh dấu ăn mồi tức thời
              if (isHunting && targetId) {
                // Đánh dấu để ở Bước sau con mồi sẽ hóa xác chết lập tức
                eatenIds.add(targetId);

                const healAmount = org.type === 'tiger' ? 120 : org.type === 'fox' ? 80 : 40;
                org.energy = Math.min(typeData.energy, org.energy + healAmount);
                activeFlows.push({ start: targetPos, end: org.position });
                newFloatingTexts.push({
                  id: Math.random(),
                  text: `⚡ +${healAmount} kcal`,
                  pos: [org.position[0], 0.8, org.position[2]]
                });
              }
              else if (isHungry && targetId) {
                // Đánh dấu thực vật bị gặm
                eatenPlantDamages[targetId] = (eatenPlantDamages[targetId] || 0) + 25;

                const healAmount = org.type === 'deer' ? 55 : 35;
                org.energy = Math.min(typeData.energy, org.energy + healAmount);
                activeFlows.push({ start: targetPos, end: org.position });
                newFloatingTexts.push({
                  id: Math.random(),
                  text: `🌿 +${healAmount} kcal`,
                  pos: [org.position[0], 0.7, org.position[2]]
                });
              }

              return { 
                ...org, 
                targetPosition: null, 
                targetId: null,
                isMoving: false, 
                isHunting: false,
                wanderDelay: Math.floor(Math.random() * 25) + 15
              };
            }
          }

          return org;
        });

        // --- BƯỚC 3: ÁP DỤNG THAY ĐỔI TRẠNG THÁI CHẾT NGAY LẬP TỨC CHO CON MỒI (LOẠI BỎ HOÀN TOÀN LỖI PHỤC HỒI) ---
        nextOrgs = nextOrgs.map((org) => {
          // A. Con mồi bị đớp -> Chết lập tức và hóa thành xác xám
          if (eatenIds.has(org.id)) {
            return {
              ...org,
              isDead: true,
              deathTimer: 50, // Đúng 5 giây phân hủy hoàn toàn biến mất
              isMoving: false,
              targetPosition: null,
              targetId: null,
              isChased: false,
              isHunting: false,
              energy: org.type === 'tiger' ? 80 : org.type === 'deer' ? 60 : 35
            };
          }

          // B. Thực vật bị gặm mất năng lượng
          if (eatenPlantDamages[org.id]) {
            const nextEnergy = org.energy - eatenPlantDamages[org.id];
            const isDead = nextEnergy <= 0;
            if (isDead) {
              return {
                ...org,
                isDead: true,
                deathTimer: 50,
                isMoving: false,
                targetPosition: null,
                targetId: null,
                energy: 30
              };
            }
            return { ...org, energy: nextEnergy };
          }

          return org;
        });

        // --- BƯỚC 4: NẤM PHÂN GIẢI XÁC CHẾT ---
        nextOrgs = nextOrgs.map(org => {
          if (org.type === 'mushroom' && !org.isDead) {
            const deadBodies = nextOrgs.filter(t => t.isDead);
            if (deadBodies.length > 0) {
              let closestCarcass = deadBodies[0];
              let minDist = Infinity;
              deadBodies.forEach(d => {
                const dist = Math.hypot(d.position[0] - org.position[0], d.position[2] - org.position[2]);
                if (dist < minDist) { minDist = dist; closestCarcass = d; }
              });

              if (minDist < 1.6) {
                closestCarcass.energy = Math.max(0, closestCarcass.energy - 2.5);
                org.energy = Math.min(ORGANISM_TYPES.mushroom.energy, org.energy + 1.2);
                activeFlows.push({ start: closestCarcass.position, end: org.position });
              }
            }
          }
          return org;
        });

        if (activeFlows.length > 0) {
          setEnergyFlows(flows => [...flows, ...activeFlows]);
          setTimeout(() => setEnergyFlows([]), 600);
        }
        if (newFloatingTexts.length > 0) {
          setFloatingTexts(texts => [...texts, ...newFloatingTexts]);
        }

        // --- BƯỚC 5: GHI LỊCH SỬ BIỂU ĐỒ ---
        ticksCounterRef.current += 1;
        if (ticksCounterRef.current >= 20) {
          ticksCounterRef.current = 0;
          timeTickRef.current += 1;

          const tempCounts = { producer: 0, herbivore: 0, carnivore: 0, decomposer: 0 };
          nextOrgs.forEach(o => {
            if (!o.isDead) {
              const cat = ORGANISM_TYPES[o.type].type;
              tempCounts[cat] += 1;
            }
          });

          setHistory(h => {
            const nextH = [...h, {
              time: timeTickRef.current,
              producer: tempCounts.producer,
              herbivore: tempCounts.herbivore,
              carnivore: tempCounts.carnivore,
              decomposer: tempCounts.decomposer
            }];
            if (nextH.length > 25) nextH.shift();
            return nextH;
          });
        }

        return nextOrgs;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, weather, gameComplete]);

  // VÒNG LẶP KIỂM TRA ĐIỀU KIỆN CÂN BẰNG ĐỘNG
  useEffect(() => {
    if (!isSimulating || gameComplete) return;

    const checkBalance = () => {
      const isBalanced = counts.producer >= 3 && counts.herbivore >= 2 && counts.carnivore >= 1 && counts.decomposer >= 1;
      if (isBalanced) {
        setEcoStatus('Hệ sinh thái đạt CÂN BẰNG sinh thái! 🌳');
      } else {
        setEcoStatus('Hệ sinh thái mất cân bằng. Hãy sắp xếp sinh vật!');
      }
    };
    
    const balanceInterval = setInterval(checkBalance, 1000);
    return () => clearInterval(balanceInterval);
  }, [isSimulating, counts, gameComplete]);

  // CHỌN SINH VẬT 3D TRÊN BẢN ĐỒ
  const handleSelectOrganism = useCallback((id) => {
    const found = organisms.find(o => o.id === id);
    setSelectedOrganism(found || null);
  }, [organisms]);

  // KÉO THẢ SINH VẬT TRÊN CANVAS
  const handleOrganismPointerDown = useCallback((e, id) => {
    e.stopPropagation();
    setDraggedOrganismId(id);
    isDraggingRef.current = true;
    
    const found = organisms.find(o => o.id === id);
    setSelectedOrganism(found || null);
  }, [organisms]);

  const handleGroundPointerMove = useCallback((e) => {
    if (!isSimulating || gameComplete) return;

    if (isDraggingRef.current && draggedOrganismId) {
      const point = e.point;
      setOrganisms(prev => prev.map(org => {
        if (org.id === draggedOrganismId) {
          return {
            ...org,
            position: [Math.max(-12.0, Math.min(12.0, point.x)), 0, Math.max(-12.0, Math.min(12.0, point.z))],
            targetPosition: null,
            targetId: null
          };
        }
        return org;
      }));
    }
  }, [isSimulating, gameComplete, draggedOrganismId]);

  const handleGroundPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setDraggedOrganismId(null);
  }, []);

  const handleGroundClick = useCallback((e) => {
    if (selectedType) {
      if (organisms.length >= 30) {
        alert("Thung lũng sinh thái đã đạt giới hạn sinh vật tối đa (30)!");
        setSelectedType(null);
        return;
      }
      const point = e.point;
      const typeData = ORGANISM_TYPES[selectedType];
      
      const newOrg = {
        id: 'org_' + Math.random().toString(36).substr(2, 9),
        type: selectedType,
        position: [Math.max(-12.0, Math.min(12.0, point.x)), 0, Math.max(-12.0, Math.min(12.0, point.z))],
        rotationY: Math.random() * Math.PI * 2,
        age: 0,
        energy: typeData.energy,
        isDead: false,
        targetPosition: null,
        targetId: null,
        isMoving: typeData.type !== 'producer' && typeData.type !== 'decomposer',
        wanderDelay: 0
      };
      
      setOrganisms(prev => [...prev, newOrg]);
      setSelectedType(null);
    } else {
      // Click ra ngoài đất trống -> Hủy chọn sinh vật
      setSelectedOrganism(null);
    }
  }, [selectedType, organisms]);

  // HÀM XÓA SINH VẬT ĐƯỢC CHỌN
  const handleDeleteOrganism = useCallback((id) => {
    setOrganisms(prev => prev.filter(o => o.id !== id));
    setSelectedOrganism(null);
  }, []);

  // CLICK HOÀN THÀNH: KIỂM TRA ĐIỀU KIỆN
  const handleGameComplete = () => {
    const isBalanced = counts.producer >= 3 && counts.herbivore >= 2 && counts.carnivore >= 1 && counts.decomposer >= 1;
    if (isBalanced) {
      setGameComplete(true);
    } else {
      setShowBalanceWarning(true);
    }
  };

  const handleReset = () => {
    setOrganisms([
      { id: 't1', type: 'tree', position: [-6, 0, -5], rotationY: 0, age: 0, energy: 250, isDead: false, isMoving: false },
      { id: 't2', type: 'tree', position: [7, 0, 6], rotationY: 0, age: 0, energy: 250, isDead: false, isMoving: false },
      { id: 'g1', type: 'grass', position: [-4, 0, 4], rotationY: 0, age: 0, energy: 70, isDead: false, isMoving: false },
      { id: 'g2', type: 'grass', position: [-8, 0, 8], rotationY: 0, age: 0, energy: 70, isDead: false, isMoving: false },
      { id: 'f1', type: 'flower', position: [5, 0, -7], rotationY: 0, age: 0, energy: 60, isDead: false, isMoving: false },
      { id: 'r1', type: 'rabbit', position: [-2, 0, 3], rotationY: 1.5, age: 0, energy: 100, targetPosition: null, targetId: null, isChased: false, isMoving: true, wanderDelay: 0 },
      { id: 'd1', type: 'deer', position: [3, 0, 5], rotationY: -1.0, age: 0, energy: 180, targetPosition: null, targetId: null, isMoving: true, wanderDelay: 0 },
      { id: 'x1', type: 'fox', position: [-4, 0, -3], rotationY: 0.5, age: 0, energy: 180, targetPosition: null, targetId: null, isHunting: false, isMoving: true, wanderDelay: 0 },
      { id: 'm1', type: 'mushroom', position: [-5.5, 0, -4], rotationY: 0, age: 0, energy: 40, isDead: false, isMoving: false }
    ]);
    setSelectedType(null);
    setSelectedOrganism(null);
    setWeather('normal');
    setHistory([]);
    setFloatingTexts([]);
    setGameComplete(false);
    setShowBalanceWarning(false);
    ticksCounterRef.current = 0;
  };

  // Màn hình hướng dẫn
  if (showTutorial) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🌍</div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Mô Phỏng Sinh Quyển 3D</h2>
          <p className="text-gray-300 text-sm mb-2">Học về Cân bằng sinh học & Chuỗi thức ăn!</p>
          <p className="text-gray-400 text-xs mb-4">Sử dụng bảng bên trái để thêm/bớt các loài sinh vật. Sắp xếp để tạo ra một hệ sinh thái cân bằng.</p>
          
          <div className="flex flex-wrap gap-1 justify-center mb-6">
            {Object.values(ORGANISM_TYPES).map(org => (
              <span key={org.name} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: org.color + '30', color: org.color }}>
                {org.icon} {org.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center"
          >
            Bắt đầu <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Thắng cuộc
  if (gameComplete) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-green-950/40 to-slate-950 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900/95 border border-yellow-500/30 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2.5xl font-black text-white mb-2 uppercase tracking-wide">MÔ PHỎNG ĐẠT ĐIỂM 10! 🎉</h2>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6">Em đã cân bằng sinh quyển xuất sắc</p>
          
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
    <div className="absolute inset-0 bg-slate-950 overflow-hidden font-sans select-none animate-fade-in">
      
      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [12, 10, 12], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        shadows
      >
        <color attach="background" args={['#030712']} />
        <EcosystemScene 
          organisms={organisms} 
          selectedOrganismId={selectedOrganism?.id}
          onClickOrganism={handleSelectOrganism}
          energyFlows={energyFlows}
          onGroundClick={handleGroundClick}
          onGroundPointerMove={handleGroundPointerMove}
          onGroundPointerUp={handleGroundPointerUp}
          onOrganismPointerDown={handleOrganismPointerDown}
          isDraggingAny={draggedOrganismId !== null}
          weather={weather}
        />
      </Canvas>

      {/* Bong bóng kcal */}
      {floatingTexts.map(t => (
        <div 
          key={t.id}
          className="absolute text-yellow-300 font-black text-xs pointer-events-none animate-bounce bg-black/60 px-2 py-1 rounded-full border border-yellow-500/30"
          style={{
            left: `${50 + (t.pos[0] * 3.5)}%`,
            top: `${50 - (t.pos[2] * 3.5) - 35}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 1.2s ease-out',
            animation: 'floatUp 1.2s forwards'
          }}
        >
          {t.text}
        </div>
      ))}

      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -150%) scale(1.1); opacity: 0; }
        }
      `}</style>

      {/* Góc trên: Trạng thái cân bằng */}
      <div className="absolute top-20 left-4 right-4 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg">
            <span className="text-white font-bold text-xs">{ecoStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className="w-10 h-10 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-slate-800 transition shadow-lg active:scale-95 cursor-pointer"
            title={isSimulating ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {isSimulating ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />}
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-slate-800 transition shadow-lg active:scale-95 cursor-pointer"
            title="Đặt lại bản đồ"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Cột trái: Thả sinh vật */}
      <div className="absolute left-4 top-36 z-10 w-60 pointer-events-auto">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-3xl p-4 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-xs uppercase tracking-wider text-[#4ade80]">Hệ sinh vật 3D</h3>
            <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">Chọn & Thả</span>
          </div>
          
          <p className="text-[9px] text-gray-400 leading-relaxed">Chọn biểu tượng bên dưới, sau đó **nhấp chuột lên thung lũng** để đặt. **Click lại biểu tượng đang chọn để hủy đặt**.</p>
          
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(ORGANISM_TYPES).map(([key, data]) => (
              <button
                key={key}
                // HỖ TRỢ CLICK LẠI ĐỂ TỰ ĐỘNG HỦY CHỌN ĐẶT SINH VẬT (LEFT PANEL TOGGLE)
                onClick={() => setSelectedType(prev => prev === key ? null : key)}
                className={`p-2.5 rounded-xl text-xl transition-all cursor-pointer flex items-center justify-center ${
                  selectedType === key 
                    ? 'bg-emerald-500/25 border border-emerald-400 scale-105 shadow-inner' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
                title={data.name}
              >
                {data.icon}
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5 text-[9px] text-emerald-200 leading-relaxed">
              <p className="font-bold text-white mb-0.5">{ORGANISM_TYPES[selectedType].name}</p>
              <p>{ORGANISM_TYPES[selectedType].desc}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Cân bằng sinh thái */}
      <div className="absolute right-4 top-36 z-10 w-52 pointer-events-auto">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-3xl p-4 shadow-xl space-y-4">
          <h3 className="text-white font-black text-xs uppercase tracking-wider text-purple-400">Cân bằng sinh thái</h3>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-green-400 flex items-center gap-1">🌳 Sản xuất:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${counts.producer >= 3 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {counts.producer}/3
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 flex items-center gap-1">🐰 Ăn cỏ:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${counts.herbivore >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {counts.herbivore}/2
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400 flex items-center gap-1">🦊 Ăn thịt:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${counts.carnivore >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {counts.carnivore}/1
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-400 flex items-center gap-1">🍄 Phân giải:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${counts.decomposer >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {counts.decomposer}/1
              </span>
            </div>
          </div>

          <button
            onClick={handleGameComplete}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg cursor-pointer animate-pulse"
          >
            Hoàn thành mô phỏng
          </button>
        </div>
      </div>

      {/* Thử nghiệm Sinh quyển */}
      <div className="absolute right-4 bottom-24 z-10 w-52 pointer-events-auto">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-3xl p-4 shadow-xl space-y-3">
          <h3 className="text-white font-black text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <Skull className="w-4 h-4" />
            <span>Thử nghiệm sinh quyển</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setWeather(weather === 'drought' ? 'normal' : 'drought')}
              className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition cursor-pointer flex flex-col items-center gap-1 ${
                weather === 'drought' 
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-pulse font-extrabold' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Hạn hán</span>
            </button>
            <button
              onClick={() => setWeather(weather === 'acid_rain' ? 'normal' : 'acid_rain')}
              className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition cursor-pointer flex flex-col items-center gap-1 ${
                weather === 'acid_rain' 
                  ? 'bg-blue-500/25 border-blue-400 text-blue-300 animate-pulse font-extrabold' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Mưa axit</span>
            </button>
            <button
              onClick={() => setWeather(weather === 'epidemic' ? 'normal' : 'epidemic')}
              className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition cursor-pointer flex flex-col items-center gap-1 ${
                weather === 'epidemic' 
                  ? 'bg-rose-500/25 border-rose-400 text-rose-300 animate-pulse font-extrabold' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Skull className="w-4 h-4" />
              <span>Dịch bệnh</span>
            </button>
            <button
              onClick={() => setWeather('normal')}
              className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition cursor-pointer flex flex-col items-center gap-1 ${
                weather === 'normal' 
                  ? 'bg-green-500/25 border-green-400 text-green-300' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ôn hòa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Biểu đồ biến động Realtime */}
      <div className="absolute left-4 bottom-24 z-10 w-60 pointer-events-auto">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-3xl p-4 shadow-xl space-y-2.5">
          <h3 className="text-white font-black text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>Biến động quần thể</span>
          </h3>

          <div className="h-24 border-b border-l border-white/10 relative flex items-end gap-0.5 pt-4">
            {history.length === 0 ? (
              <span className="text-[9px] text-gray-500 absolute inset-0 m-auto flex items-center justify-center italic">Đang thu thập dữ liệu...</span>
            ) : (
              history.map((h, i) => {
                const total = h.producer + h.herbivore + h.carnivore + h.decomposer || 1;
                const producerPct = (h.producer / total) * 100;
                const herbivorePct = (h.herbivore / total) * 100;
                const carnivorePct = (h.carnivore / total) * 100;
                const decomposerPct = (h.decomposer / total) * 100;

                return (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end w-2">
                    <div style={{ height: `${decomposerPct}%` }} className="w-full bg-purple-500" />
                    <div style={{ height: `${carnivorePct}%` }} className="w-full bg-red-500" />
                    <div style={{ height: `${herbivorePct}%` }} className="w-full bg-yellow-500" />
                    <div style={{ height: `${producerPct}%` }} className="w-full bg-green-500" />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between text-[8px] text-gray-400">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Sản xuất</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />Ăn cỏ</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />Ăn thịt</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />Phân giải</span>
          </div>
        </div>
      </div>

      {/* Panel thông số sinh học */}
      {selectedOrganism && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 w-full max-w-lg px-4 pointer-events-auto">
          <div className="bg-slate-900/95 border border-amber-500/30 backdrop-blur-md rounded-3xl p-4 shadow-2xl relative animate-in slide-in-from-bottom duration-200">
            <button 
              onClick={() => setSelectedOrganism(null)} 
              className="absolute top-3 right-3 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="text-3xl p-2 bg-white/5 border border-white/10 rounded-2xl">
                {ORGANISM_TYPES[selectedOrganism.type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-black text-sm uppercase tracking-wider">
                    {ORGANISM_TYPES[selectedOrganism.type].name} {selectedOrganism.isDead ? '(Xác hữu cơ)' : ''}
                  </h4>
                  <button
                    onClick={() => handleDeleteOrganism(selectedOrganism.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                    title="Xóa sinh vật này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bỏ</span>
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-1">{ORGANISM_TYPES[selectedOrganism.type].desc}</p>
                
                <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/5 text-[10px]">
                  <div>
                    <span className="text-gray-500 block uppercase font-black tracking-wider">Năng lượng</span>
                    <span className={`font-bold ${
                      selectedOrganism.energy > ORGANISM_TYPES[selectedOrganism.type].energy * 0.7 ? 'text-green-400' : 
                      selectedOrganism.energy > ORGANISM_TYPES[selectedOrganism.type].energy * 0.35 ? 'text-yellow-400' : 'text-rose-400'
                    }`}>
                      {Math.max(0, Math.round(selectedOrganism.energy))} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase font-black tracking-wider">Vai trò sinh học</span>
                    <span className="text-cyan-400 font-bold uppercase">
                      {ORGANISM_TYPES[selectedOrganism.type].type === 'producer' ? 'Sản xuất' :
                       ORGANISM_TYPES[selectedOrganism.type].type === 'herbivore' ? 'Ăn cỏ' :
                       ORGANISM_TYPES[selectedOrganism.type].type === 'carnivore' ? 'Ăn thịt' : 'Phân giải'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase font-black tracking-wider">Trạng thái</span>
                    <span className="text-white font-bold">
                      {selectedOrganism.isDead ? '🏳️ Đang phân hủy' : '⚡ Hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO CHƯA ĐẠT ĐIỀU KIỆN CÂN BẰNG SINH THÁI CAO CẤP */}
      {showBalanceWarning && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900/95 border border-rose-500/40 backdrop-blur-2xl rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowBalanceWarning(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
              <div className="p-2 bg-rose-500/20 rounded-2xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Chưa Đạt Cân Bằng Sinh Thái</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Mô phỏng cần được điều chỉnh thêm</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-gray-300 leading-relaxed mb-1">
                Để thung lũng đạt trạng thái **Cân bằng sinh thái động**, em cần cung cấp đầy đủ các nhóm sinh vật sau:
              </p>

              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3.5 text-xs">
                {/* Nhóm sản xuất */}
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span>🌳</span> Sinh vật Sản xuất (Cây/Cỏ/Hoa):
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">{counts.producer}/3</span>
                    {counts.producer >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Nhóm ăn cỏ */}
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    <span>🐰</span> Động vật Ăn cỏ (Thỏ/Hươu):
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">{counts.herbivore}/2</span>
                    {counts.herbivore >= 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Nhóm ăn thịt */}
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <span>🦊</span> Động vật Ăn thịt (Cáo/Hổ/Ếch):
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">{counts.carnivore}/1</span>
                    {counts.carnivore >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Nhóm phân giải */}
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <span>🍄</span> Sinh vật Phân giải (Nấm):
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">{counts.decomposer}/1</span>
                    {counts.decomposer >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBalanceWarning(false)}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg cursor-pointer"
            >
              Tiếp tục điều chỉnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
