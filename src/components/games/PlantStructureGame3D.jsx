// PlantStructureGame3D.jsx - Cấu tạo Thực vật 3D (Lớp 7 - Sách Kết nối tri thức)
import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Float, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { 
  BookOpen, Play, ArrowRight, Home, ChevronRight, ChevronLeft, 
  RotateCcw, Sparkles, Check, CheckCircle2, Droplet, Sprout, Info,
  Sun, CloudRain, Thermometer, ShieldAlert, Sliders, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

// --- KỸ THUẬT SỐ LIỆU HỌC TẬP (SGK KẾT NỐI TRI THỨC) ---
const PLANT_DATA = {
  pea: {
    name: 'Đậu Hà Lan (Pisum sativum)',
    description: 'Cây thân leo thảo hằng năm, nổi tiếng trong nghiên cứu di truyền học của Mendel. Có hệ rễ cọc đặc trưng hợp tác với vi khuẩn cố định đạm.',
    stages: {
      1: {
        name: 'Hạt nảy mầm',
        desc: 'Hạt hút nước trương nở, nứt vỏ. Rễ mầm đâm xuống đất, thân mầm vươn lên mang theo lá mầm.',
        organs: {
          seed: { name: 'Hạt Đậu', desc: 'Chứa phôi và chất dinh dưỡng dự trữ (lá mầm dày).' },
          radicle: { name: 'Rễ mầm', desc: 'Bộ phận đầu tiên của phôi nhô ra khỏi hạt, phát triển thành rễ chính hướng xuống dưới để hút nước.' },
          hypocotyl: { name: 'Thân mầm', desc: 'Phần thân dưới lá mầm, sinh trưởng nhanh kéo lá mầm và chồi mầm lên khỏi mặt đất.' }
        }
      },
      2: {
        name: 'Cây con',
        desc: 'Lá thật đầu tiên xuất hiện thực hiện quang hợp. Hệ rễ cọc bắt đầu phân nhánh hình thành các rễ bên.',
        organs: {
          root: { name: 'Rễ non', desc: 'Hệ rễ cọc non bắt đầu hình thành lông hút để tự lập hấp thụ dinh dưỡng.' },
          stem: { name: 'Thân non', desc: 'Thân thảo mềm màu xanh, chứa các mạch dẫn sơ khai.' },
          leaf: { name: 'Lá non', desc: 'Lá kép gồm các lá chét mỏng giúp tối ưu hóa diện tích nhận ánh sáng.' }
        }
      },
      3: {
        name: 'Cây trưởng thành',
        desc: 'Cây phát triển chiều cao vượt trội, hình thành các tua cuốn để leo bám nâng đỡ thân thảo. Rễ xuất hiện các nốt sần sinh học.',
        organs: {
          root: { name: 'Rễ & Nốt sần', desc: 'Rễ cọc sâu. Đặc biệt có các nốt sần chứa vi khuẩn Rhizobium cộng sinh, giúp cố định nitơ tự do từ không khí thành đạm amoni cung cấp cho cây.' },
          stem: { name: 'Thân leo & Tua cuốn', desc: 'Thân thảo yếu ớt cần các tua cuốn (biến dạng của lá chét đầu cành) quấn chặt vào giàn gỗ để vươn cao đón ánh sáng.' },
          leaf: { name: 'Lá kép', desc: 'Lá kép lông chim. Biểu bì lá có nhiều khí khổng thực hiện thoát hơi nước tạo động lực kéo dòng mạch gỗ từ rễ lên.' }
        }
      },
      4: {
        name: 'Ra hoa & Kết quả',
        desc: 'Xuất hiện hoa lưỡng tính tự thụ phấn nghiêm ngặt. Bầu nhụy phát triển thành quả đậu chứa các hạt bên trong.',
        organs: {
          root: { name: 'Hệ Rễ', desc: 'Rễ cọc phát triển hoàn chỉnh, tiếp tục cung cấp đạm và nước nuôi quả.' },
          stem: { name: 'Thân cây', desc: 'Hệ mạch dẫn hoạt động với công suất tối đa để vận chuyển chất dinh dưỡng tích lũy vào hạt.' },
          leaf: { name: 'Lá quang hợp', desc: 'Quang hợp liên tục tạo ra đường glucose, chuyển hóa thành tinh bột và protein dự trữ trong hạt đậu.' },
          flower: { name: 'Hoa Đậu', desc: 'Hoa lưỡng tính có tràng hoa hình cánh bướm. Nhị hoa chứa hạt phấn thụ phấn cho núm nhụy của cùng một hoa (tự thụ phấn).' },
          fruit: { name: 'Quả & Hạt', desc: 'Quả tự mở (quả giáp) hình thành từ bầu nhụy. Quả chứa chuỗi hạt đậu giàu protein, chất xơ và vitamin.' }
        }
      }
    }
  },
  rose: {
    name: 'Hoa hồng (Rosa)',
    description: 'Cây bụi gỗ nhỏ, thân có nhiều gai sắc nhọn để tự vệ và leo bám. Lá kép lông chim lẻ có răng cưa ở mép lá.',
    stages: {
      1: {
        name: 'Hạt nảy mầm',
        desc: 'Hạt nảy mầm chậm do vỏ hạt cứng. Khi đủ ẩm và nhiệt độ, rễ mầm phá vỡ vỏ hạt đâm sâu xuống đất.',
        organs: {
          seed: { name: 'Hạt giống', desc: 'Vỏ hạt dày cứng bảo vệ phôi bên trong khỏi điều kiện khắc nghiệt.' },
          radicle: { name: 'Rễ mầm', desc: 'Đâm thẳng xuống đất để cố định vị trí gieo hạt.' },
          hypocotyl: { name: 'Thân mầm', desc: 'Vươn thẳng lên mang theo hai lá mầm nhỏ màu xanh nhạt.' }
        }
      },
      2: {
        name: 'Cây con',
        desc: 'Cây non phát triển lá kép đầu tiên, thân bắt đầu xuất hiện những chiếc gai nhỏ mềm màu đỏ bảo vệ.',
        organs: {
          root: { name: 'Rễ cây con', desc: 'Phát triển nhanh chóng để hút nước nuôi các lá non đầu tiên.' },
          stem: { name: 'Thân gai non', desc: 'Thân nhỏ màu hồng nhạt hoặc xanh, có các gai non mềm.' },
          leaf: { name: 'Lá răng cưa', desc: 'Lá kép với mép lá khía răng cưa đặc trưng bắt đầu quang hợp.' }
        }
      },
      3: {
        name: 'Cây trưởng thành',
        desc: 'Thân hóa gỗ một phần cứng cáp, gai nhọn sắc bén phân bố dày đặc. Lá kép lông chim mọc xen kẽ xanh bóng.',
        organs: {
          root: { name: 'Hệ Rễ cọc', desc: 'Rễ ăn sâu và lan rộng trong đất giúp nâng đỡ cây bụi gỗ vững chãi.' },
          stem: { name: 'Thân gỗ có gai', desc: 'Thân gỗ bụi khỏe mạnh, chứa nhiều gai nhọn sắc bén có tác dụng tự vệ chống động vật ăn lá và hỗ trợ leo bám.' },
          leaf: { name: 'Lá kép lông chim', desc: 'Lá kép gồm 3-7 lá chét, mặt trên xanh bóng, mép có răng cưa nhọn.' }
        }
      },
      4: {
        name: 'Ra hoa',
        desc: 'Bông hoa hồng nở rộ ở đầu cành với nhiều lớp cánh xếp chồng, hương thơm quyến rũ thu hút côn trùng thụ phấn.',
        organs: {
          root: { name: 'Hệ Rễ bụi', desc: 'Hút nước và muối khoáng tối đa phục vụ quá trình nở hoa.' },
          stem: { name: 'Thân nâng đỡ', desc: 'Vận chuyển nước và chất dinh dưỡng lên các nụ hoa ở đầu cành.' },
          leaf: { name: 'Lá xanh', desc: 'Cung cấp năng lượng quang hợp nuôi dưỡng bông hoa nở rực rỡ.' },
          flower: { name: 'Bông hoa hồng', desc: 'Hoa lưỡng tính, cánh hoa xếp nhiều lớp đồng tâm. Nhị và nhụy nằm ở tâm hoa, đế hoa hình chén nâng đỡ toàn bộ cấu trúc.' }
        }
      }
    }
  },
  tomato: {
    name: 'Cây Cà chua (Solanum lycopersicum)',
    description: 'Cây thân thảo hằng năm, toàn thân phủ lớp lông tơ mịn đặc trưng để giảm thoát hơi nước và xua đuổi côn trùng.',
    stages: {
      1: {
        name: 'Hạt nảy mầm',
        desc: 'Hạt cà chua nảy mầm nhanh trong vòng 5-7 ngày gieo. Lá mầm dạng kim dài xuất hiện đón ánh sáng.',
        organs: {
          seed: { name: 'Hạt cà chua', desc: 'Kích thước nhỏ, dẹt, có lớp màng nhầy tự nhiên bảo vệ hạt.' },
          radicle: { name: 'Rễ mầm', desc: 'Mọc nhanh xuống đất để hút nước tức thì.' },
          hypocotyl: { name: 'Thân mầm', desc: 'Mọc thẳng đứng uốn cong chữ U trước khi vươn lên mặt đất.' }
        }
      },
      2: {
        name: 'Cây con',
        desc: 'Thân cây mảnh có lông tơ mịn màng xuất hiện. Các lá thật đầu tiên có thùy xẻ sâu.',
        organs: {
          root: { name: 'Rễ non', desc: 'Hệ rễ phát triển nhiều sợi rễ phụ mịn tăng diện tích tiếp xúc.' },
          stem: { name: 'Thân thảo non', desc: 'Thân non mềm màu xanh lục nhạt mọc thẳng.' },
          leaf: { name: 'Lá xẻ thùy', desc: 'Lá thật có phiến xẻ thùy sâu, phủ lông tơ lấm tấm.' }
        }
      },
      3: {
        name: 'Cây trưởng thành',
        desc: 'Thân thảo lớn phân nhiều nhánh, phủ đầy lông tơ dày đặc. Lá có mùi thơm nồng khi chạm vào.',
        organs: {
          root: { name: 'Rễ chùm rộng', desc: 'Hệ rễ ăn nông nhưng lan rất rộng để hấp thụ nước bề mặt.' },
          stem: { name: 'Thân phủ lông tơ', desc: 'Thân thảo chứa đầy nước, phủ lớp lông tơ (trichomes) tiết ra tinh dầu bảo vệ cây khỏi côn trùng và giữ ẩm.' },
          leaf: { name: 'Lá cà chua', desc: 'Lá kép lông chim xẻ thùy sâu, phiến lá có mùi thơm đặc trưng từ các tuyến lông.' }
        }
      },
      4: {
        name: 'Ra hoa & Kết quả',
        desc: 'Hoa màu vàng mọc thành chùm. Quả cà chua phát triển từ bầu nhụy, từ màu xanh chuyển sang đỏ mọng khi chín chứa nhiều lycopene.',
        organs: {
          root: { name: 'Hệ Rễ mạnh', desc: 'Hấp thụ lượng lớn nước và kali để nuôi dưỡng quả mọng nước.' },
          stem: { name: 'Thân chịu lực', desc: 'Trở nên dày và nặng để đỡ sức nặng của các chùm quả chín.' },
          leaf: { name: 'Lá già', desc: 'Tập trung quang hợp tạo đường chuyển hóa vào quả làm tăng độ ngọt.' },
          flower: { name: 'Hoa vàng', desc: 'Hoa màu vàng mọc thành chùm, cánh hoa tràng nhọn hướng ra ngoài ôm sát bao phấn hình nón.' },
          fruit: { name: 'Quả cà chua chín', desc: 'Quả mọng nước chứa nhiều hạt dẹt. Khi chín vỏ chuyển sang màu đỏ rực chứa nhiều Vitamin C và Lycopene tốt cho sức khỏe.' }
        }
      }
    }
  }
};

// --- ROOT NODULE COMPONENT (Nốt sần rễ đậu) ---
function RootNodule({ position }) {
  return (
    <mesh position={position} scale={0.04}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#fca5a5" roughness={0.8} />
    </mesh>
  );
}

// --- FERTILIZER CANISTER ICON ---
const FertilizerCanisterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M35 25 h30 a5 5 0 0 1 5 5 v5 h15 a5 5 0 0 1 5 5 v45 a5 5 0 0 1-5 5 h-50 a5 5 0 0 1-5-5 v-50 a5 5 0 0 1 5-5 z" />
    <path d="M45 15 h10 v10 h-10 z" />
    <path d="M70 30 v15 h10 v-15 z" />
    <path d="M40 75 c0-10 10-10 10-10 s10 0 10 10" /> 
    <path d="M50 65 v-15" /> 
    <path d="M50 55 c-3-3-3-7 0-7 c3 0 3 4 0 7" /> 
    <path d="M50 60 c-3-1-6-1-8 1" /> 
    <path d="M50 58 c3-1 6-1 8 1" /> 
  </svg>
);

// --- CAMERA CONTROLLER ---
function CameraController({ selectedOrgan, growthStage, phase }) {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (!controls) return;
    
    let targetPos = new THREE.Vector3(0, 0.8, 5.5);
    let targetLook = new THREE.Vector3(0, -0.2, 0);
    
    if (phase === 'pot_assembly' || phase === 'fertilizing') {
      targetPos.set(0, 0, 4.2);
      targetLook.set(0, -1.2, 0);
    } else if (phase === 'growing') {
      if (selectedOrgan) {
        switch (selectedOrgan) {
          case 'root':
            targetPos.set(0, -2.1, 2.3);
            targetLook.set(0, -2.1, 0);
            break;
          case 'stem':
            targetPos.set(0, -0.4, 2.3);
            targetLook.set(0, -0.4, 0);
            break;
          case 'leaf':
            targetPos.set(-0.8, 0.2, 2.0);
            targetLook.set(-0.5, 0.2, 0);
            break;
          case 'flower':
            targetPos.set(0, 1.2, 2.0);
            targetLook.set(0, 1.2, 0);
            break;
          case 'fruit':
            targetPos.set(0.7, 0.5, 1.8);
            targetLook.set(0.5, 0.5, 0);
            break;
          case 'seed':
            targetPos.set(0, -1.5, 1.6);
            targetLook.set(0, -1.7, 0);
            break;
          case 'radicle':
            targetPos.set(0, -1.9, 1.6);
            targetLook.set(0, -2.0, 0);
            break;
          case 'hypocotyl':
            targetPos.set(0, -1.4, 1.6);
            targetLook.set(0, -1.4, 0);
            break;
          default:
            break;
        }
      } else {
        if (growthStage === 1) {
          targetPos.set(0, -1.0, 3.0);
          targetLook.set(0, -1.4, 0);
        } else if (growthStage === 2) {
          targetPos.set(0, -0.3, 3.8);
          targetLook.set(0, -0.7, 0);
        } else {
          targetPos.set(0, 0.5, 4.5);
          targetLook.set(0, 0.1, 0);
        }
      }
    }
    
    const duration = 1000;
    const startPos = camera.position.clone();
    const startLook = controls.target.clone();
    const startTime = performance.now();
    
    let animId;
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      camera.position.lerpVectors(startPos, targetPos, t);
      controls.target.lerpVectors(startLook, targetLook, t);
      controls.update();
      
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };
    
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [selectedOrgan, growthStage, phase, camera, controls]);
  
  return null;
}

// --- PARABOLIC WATER WATERING ANIMATION ---
function WateringPouringSystem({ active }) {
  const groupRef = useRef();
  const canRef = useRef();
  const count = 30;
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: 0, 
        y: -0.1,
        z: 0,
        vx: (Math.random() - 0.5) * 0.02, 
        vy: -0.02 - Math.random() * 0.04,  
        vz: (Math.random() - 0.5) * 0.02,
        life: Math.random() * 30
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (canRef.current) {
      if (active) {
        canRef.current.position.y = THREE.MathUtils.lerp(canRef.current.position.y, 1.2, 0.1);
        canRef.current.rotation.z = THREE.MathUtils.lerp(canRef.current.rotation.z, 0.5, 0.1);
      } else {
        canRef.current.position.y = THREE.MathUtils.lerp(canRef.current.position.y, 2.5, 0.1);
        canRef.current.rotation.z = THREE.MathUtils.lerp(canRef.current.rotation.z, 0, 0.1);
      }
    }

    if (!groupRef.current || !active) return;
    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i];
      if (!p) return;
      
      p.x += p.vx;
      p.vy -= 0.008; // gravity
      p.y += p.vy;
      p.z += p.vz;
      p.life -= 1;

      if (p.y < -2.9 || p.life <= 0) {
        p.x = 0;
        p.y = -0.1;
        p.z = 0;
        p.vx = (Math.random() - 0.5) * 0.02;
        p.vy = -0.02 - Math.random() * 0.04;
        p.vz = (Math.random() - 0.5) * 0.02;
        p.life = 25 + Math.random() * 10;
      }
      mesh.position.set(p.x, p.y, p.z);
    });
  });

  return (
    <group>
      <group ref={canRef} position={[0.6, 2.5, 0]} visible={active}>
        <group rotation={[0, -0.3, 0]}>
          {/* Watering Can Body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
            <meshPhysicalMaterial color="#3b82f6" roughness={0.2} metalness={0.1} clearcoat={1.0} />
          </mesh>
          {/* Spout */}
          <mesh position={[-0.25, -0.05, 0]} rotation={[0, 0, 1.0]}>
            <cylinderGeometry args={[0.03, 0.06, 0.35, 16]} />
            <meshPhysicalMaterial color="#3b82f6" roughness={0.2} metalness={0.1} clearcoat={1.0} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.2, 0.05, 0]} rotation={[0, 0, -0.3]}>
            <torusGeometry args={[0.12, 0.03, 8, 16, Math.PI]} />
            <meshPhysicalMaterial color="#3b82f6" roughness={0.2} metalness={0.1} clearcoat={1.0} />
          </mesh>
        </group>
      </group>
      
      {active && (
        <group ref={groupRef} position={[0.2, 1.0, 0]}>
          {particles.map((_, idx) => (
            <mesh key={idx} scale={[0.015, 0.05, 0.015]}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshPhysicalMaterial 
                color="#7dd3fc" 
                transmission={0.9} 
                opacity={1} 
                transparent 
                roughness={0} 
                ior={1.33}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// --- FERTILIZER POURING SYSTEM ---
function FertilizerPouringSystem({ active }) {
  const groupRef = useRef();
  const bagRef = useRef();
  const count = 25;
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: 0,
        y: -0.2,
        z: 0,
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.05,
        vz: (Math.random() - 0.5) * 0.04,
        life: Math.random() * 20
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (bagRef.current) {
      if (active) {
        bagRef.current.position.y = THREE.MathUtils.lerp(bagRef.current.position.y, 1.3, 0.1);
        bagRef.current.rotation.z = THREE.MathUtils.lerp(bagRef.current.rotation.z, 0.6, 0.1);
      } else {
        bagRef.current.position.y = THREE.MathUtils.lerp(bagRef.current.position.y, 2.5, 0.1);
        bagRef.current.rotation.z = THREE.MathUtils.lerp(bagRef.current.rotation.z, 0, 0.1);
      }
    }

    if (!groupRef.current || !active) return;
    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i];
      if (!p) return;
      
      p.x += p.vx;
      p.vy -= 0.008;
      p.y += p.vy;
      p.z += p.vz;
      p.life -= 1;

      if (p.y < -3.0 || p.life <= 0) {
        p.x = 0;
        p.y = -0.2;
        p.z = 0;
        p.vx = (Math.random() - 0.5) * 0.02;
        p.vy = -0.05;
        p.vz = (Math.random() - 0.5) * 0.04;
        p.life = 20 + Math.random() * 10;
      }
      mesh.position.set(p.x, p.y, p.z);
    });
  });

  return (
    <group>
      <group ref={bagRef} position={[0.4, 2.5, 0]} visible={active}>
        {/* Fertilizer Bag */}
        <group rotation={[0, 0.2, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.4, 0.15]} />
            <meshStandardMaterial color="#d97706" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
            <meshStandardMaterial color="#b45309" roughness={0.9} />
          </mesh>
          {/* Fertilizer Label */}
          <mesh position={[0, 0, 0.076]}>
            <planeGeometry args={[0.18, 0.15]} />
            <meshBasicMaterial color="#fef3c7" />
          </mesh>
        </group>
      </group>

      {active && (
        <group ref={groupRef} position={[0.1, 1.2, 0]}>
          {particles.map((_, idx) => (
            <mesh key={idx} scale={0.025}>
              <sphereGeometry args={[1, 6, 6]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// --- SHIMMERING NATURAL SUNLIGHT BEAMS (Gently swaying) ---
function SunlightBeam({ active }) {
  const texture = useLoader(THREE.TextureLoader, '/images/SUN.svg');
  const groupRef = useRef();
  const materialRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const t = state.clock.getElapsedTime();
    // Gentle swaying left and right for heat haze effect
    groupRef.current.position.x = Math.sin(t * 0.5) * 0.2;
    groupRef.current.position.y = 3.5 + Math.cos(t * 0.3) * 0.1;
    
    // Pulsing brightness to simulate intense heat
    if (materialRef.current) {
      materialRef.current.opacity = 0.7 + Math.sin(t * 2.0) * 0.2;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[0, 3.5, -2.0]}>
      <sprite scale={[15, 15, 1]}>
        <spriteMaterial 
          ref={materialRef}
          map={texture} 
          transparent 
          opacity={0.8} 
          blending={THREE.NormalBlending} 
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

// --- RAIN DROP SYSTEM (HEAVY RAIN WEATHER) ---
function RainSystem({ active }) {
  const groupRef = useRef();
  const count = 120; // More rain
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 6, // Wider spread
        y: 3 + Math.random() * 4,
        z: (Math.random() - 0.5) * 6,
        vy: 0.3 + Math.random() * 0.1 // Faster falling speed
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!groupRef.current || !active) return;
    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i];
      if (!p) return;
      p.y -= p.vy;
      if (p.y < -2.0) {
        p.y = 3 + Math.random() * 4;
        p.x = (Math.random() - 0.5) * 6;
      }
      mesh.position.set(p.x, p.y, p.z);
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {particles.map((_, idx) => (
        <mesh key={idx} scale={1.0}>
          {/* Use thin long cylinders for rain streaks instead of tiny spheres */}
          <cylinderGeometry args={[0.003, 0.003, 0.25, 4]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// --- STEM INNER FLOW PARTICLES ---
function StemFlowParticles({ active }) {
  const group = useRef();
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        type: 'xylem',
        x: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 1.5,
        speed: 0.01 + Math.random() * 0.01,
        color: '#0ea5e9'
      });
      arr.push({
        type: 'phloem',
        x: (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 1.5,
        speed: -0.008 - Math.random() * 0.008,
        color: '#ef4444'
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!group.current || !active) return;
    group.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      child.position.y += p.speed;
      if (p.type === 'xylem' && child.position.y > 0.8) child.position.y = -0.8;
      if (p.type === 'phloem' && child.position.y < -0.8) child.position.y = 0.8;
    });
  });

  if (!active) return null;

  return (
    <group ref={group}>
      {particles.map((p, idx) => (
        <mesh key={idx} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// --- ORGANIC LEAF MODEL ---
function OrganicLeaf({ position, rotation, scale = 0.35, color }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Petiole / Stem */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      {/* Leaf Blade (Organic contoured shape using overlapping spheres/cones) */}
      <group position={[0, 0.2, 0]}>
        <mesh scale={[0.4, 0.7, 0.08]} castShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* Central Vein (Gân lá nổi bật) */}
        <mesh position={[0, 0, 0.08]} scale={[0.015, 0.7, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#a3e635" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// --- HIGHLY REALISTIC PLANT RENDERER ---
// --- PEA PLANT DETAILED COMPONENTS ---
function PeaVine() {
  return (
    <group>
      {/* Vertical wooden support stake */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} />
      </mesh>
      {/* Horizontal ties */}
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
        <meshStandardMaterial color="#a16207" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
        <meshStandardMaterial color="#a16207" roughness={0.9} />
      </mesh>
    </group>
  );
}

function PeaCompoundLeaf({ position, rotation, scale = 0.35, color }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Petiole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.5, 6]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      {/* Stipules (Lá kèm to ở nách lá ôm lấy thân) */}
      <group position={[0, 0, 0]}>
        <mesh position={[-0.08, 0.04, 0.02]} rotation={[0.2, -0.4, 0.6]} scale={[0.09, 0.13, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.08, 0.04, 0.02]} rotation={[0.2, 0.4, -0.6]} scale={[0.09, 0.13, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
      {/* Leaflet pair 1 (Lá chét) */}
      <group position={[0, 0.18, 0]}>
        <mesh position={[-0.11, 0, 0]} rotation={[0, 0.2, 0.5]} scale={[0.07, 0.12, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.11, 0, 0]} rotation={[0, -0.2, -0.5]} scale={[0.07, 0.12, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
      {/* Leaflet pair 2 */}
      <group position={[0, 0.38, 0]}>
        <mesh position={[-0.09, 0, 0]} rotation={[0, 0.2, 0.5]} scale={[0.06, 0.1, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.09, 0, 0]} rotation={[0, -0.2, -0.5]} scale={[0.06, 0.1, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
      {/* Terminal Tendril (Tua cuốn leo giàn gỗ) */}
      <group position={[0, 0.52, 0]}>
        <Float speed={3} floatIntensity={0.08}>
          <mesh rotation={[0.5, 0.5, 1]} scale={0.55}>
            <torusGeometry args={[0.06, 0.005, 6, 16, Math.PI * 2.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </Float>
      </group>
    </group>
  );
}

function PeaFlowerMesh({ color }) {
  return (
    <group>
      {/* Calyx (Đài hoa) */}
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.03, 0.08, 5]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {/* Banner / Standard petal (Cánh cờ đứng to phía sau) */}
      <mesh position={[0, 0.06, -0.02]} scale={[0.13, 0.15, 0.02]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Wing petals (Cánh bên) */}
      <mesh position={[-0.07, 0.02, 0.03]} rotation={[0.2, 0.4, -0.3]} scale={[0.07, 0.1, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.07, 0.02, 0.03]} rotation={[0.2, -0.4, 0.3]} scale={[0.07, 0.1, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Keel petal (Cánh muỗng úp kín nhị nhụy) */}
      <mesh position={[0, 0.01, 0.06]} rotation={[0.3, 0, 0]} scale={[0.04, 0.06, 0.04]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#f5f3ff" roughness={0.7} />
      </mesh>
    </group>
  );
}

function PeaPodMesh({ color, showSeeds }) {
  const seedPositions = [-0.08, -0.03, 0.02, 0.07];
  return (
    <group>
      {/* Pod shell (Base shape - slightly squashed) */}
      <mesh scale={[0.025, 0.22, 0.04]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* Bumps indicating seeds inside */}
      {seedPositions.map((y, i) => (
        <mesh key={`bump-${i}`} position={[0, y, 0.012]} scale={[0.02, 0.025, 0.035]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}

      {/* Curved tip */}
      <mesh position={[0, -0.13, 0.015]} rotation={[0.4, 0, 0]} scale={[0.015, 0.04, 0.015]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Stem connection */}
      <mesh position={[0, 0.12, -0.01]} rotation={[-0.2, 0, 0]} scale={[0.015, 0.03, 0.015]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Seeds inside pod (visible if requested) */}
      {showSeeds && (
        <group position={[0, 0, 0.02]}>
          {seedPositions.map((y, i) => (
            <mesh key={`seed-${i}`} position={[0, y, 0.015]} scale={0.025}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#a3e635" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// --- ROSE PLANT DETAILED COMPONENTS ---
function RoseCompoundLeaf({ position, rotation, scale = 0.35, color }) {
  // A single connected mesh group
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main Petiole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.5, 6]} />
        <meshStandardMaterial color="#1b4332" roughness={0.8} />
      </mesh>
      
      {/* Terminal Leaflet (at the very tip) */}
      <mesh position={[0, 0.55, 0]} scale={[0.12, 0.2, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* Leaflet Pair 1 */}
      <mesh position={[-0.1, 0.35, 0]} rotation={[0, 0, 0.6]} scale={[0.1, 0.16, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} rotation={[0, 0, -0.6]} scale={[0.1, 0.16, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* Leaflet Pair 2 */}
      <mesh position={[-0.08, 0.15, 0]} rotation={[0, 0, 0.8]} scale={[0.08, 0.14, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.08, 0.15, 0]} rotation={[0, 0, -0.8]} scale={[0.08, 0.14, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function RoseFlowerMesh({ color }) {
  const createPetal = (radius, yPos, rotY, leanBack, scaleX, scaleY, scaleZ, phiLen) => {
    return (
      <group rotation={[0, rotY, 0]}>
        <group position={[0, yPos, radius]}>
          <group rotation={[leanBack, 0, 0]}>
            <mesh rotation={[0, -phiLen / 2, 0]} scale={[scaleX, scaleY, scaleZ]}>
              <sphereGeometry args={[1, 14, 10, 0, phiLen, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group scale={1.2} position={[0, 0.05, 0]}>
      {/* Green receptacle (đế hoa) */}
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#14532d" />
      </mesh>
      
      {/* Sepals (Lá đài xòe ra) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        return (
          <mesh key={`sepal-${i}`} position={[Math.cos(angle) * 0.05, -0.04, Math.sin(angle) * 0.05]} rotation={[0.4, -angle + Math.PI/2, 0]}>
             <planeGeometry args={[0.02, 0.18]} />
             <meshStandardMaterial color="#14532d" side={THREE.DoubleSide} />
          </mesh>
        )
      })}
      
      {/* Core Bud */}
      <mesh position={[0, 0.0, 0]} scale={[0.02, 0.06, 0.02]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>

      {/* Petals Layer 1: Tight inner petals */}
      {[0, 1, 2].map(i => {
        const angle = (i * Math.PI * 2) / 3;
        return <group key={`l1-${i}`}>{createPetal(0.005, 0.08, angle, 0.1, 0.05, 0.08, 0.04, Math.PI * 1.0)}</group>;
      })}
      
      {/* Layer 2 */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i * Math.PI * 2) / 4 + 0.5;
        return <group key={`l2-${i}`}>{createPetal(0.01, 0.08, angle, 0.15, 0.06, 0.1, 0.05, Math.PI * 0.9)}</group>;
      })}

      {/* Layer 3 */}
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (i * Math.PI * 2) / 5 + 1.0;
        return <group key={`l3-${i}`}>{createPetal(0.015, 0.07, angle, 0.25, 0.08, 0.11, 0.06, Math.PI * 0.8)}</group>;
      })}

      {/* Layer 4 */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i * Math.PI * 2) / 6 + 1.5;
        return <group key={`l4-${i}`}>{createPetal(0.025, 0.06, angle, 0.4, 0.1, 0.12, 0.07, Math.PI * 0.7)}</group>;
      })}

      {/* Layer 5 */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const angle = (i * Math.PI * 2) / 7 + 2.0;
        return <group key={`l5-${i}`}>{createPetal(0.035, 0.05, angle, 0.6, 0.12, 0.13, 0.08, Math.PI * 0.6)}</group>;
      })}
    </group>
  );
}

// --- TOMATO PLANT DETAILED COMPONENTS ---
function TomatoCompoundLeaf({ position, rotation, scale = 0.35, color }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Petiole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.5, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      {/* Lobed leaflets (Pinnately lobed) */}
      <OrganicLeaf position={[0, 0.5, 0]} rotation={[0, 0, 0]} scale={0.22} color={color} />
      <OrganicLeaf position={[-0.14, 0.36, 0.04]} rotation={[0.1, 0.2, 0.65]} scale={0.16} color={color} />
      <OrganicLeaf position={[0.14, 0.36, -0.04]} rotation={[-0.1, -0.2, -0.65]} scale={0.16} color={color} />
      <OrganicLeaf position={[-0.11, 0.2, 0.04]} rotation={[0.1, 0.2, 0.65]} scale={0.14} color={color} />
      <OrganicLeaf position={[0.12, 0.2, -0.04]} rotation={[-0.1, -0.2, -0.65]} scale={0.14} color={color} />
    </group>
  );
}

function TomatoFlowerMesh() {
  return (
    <group scale={0.5}>
      {/* Calyx */}
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.025, 0.08, 5]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {/* Star petals */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 0.08, 0.01, Math.sin(angle) * 0.08]}
            rotation={[0, -angle, 0.25]}
            scale={[0.025, 0.012, 0.12]}
          >
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color="#eab308" roughness={0.6} />
          </mesh>
        );
      })}
      {/* Anther cone */}
      <mesh position={[0, 0.04, 0]} scale={[0.025, 0.07, 0.025]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.5} />
      </mesh>
    </group>
  );
}

function TomatoFruitMesh({ color, scale = 0.12 }) {
  return (
    <group>
      <mesh scale={scale} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.15} metalness={0.05} />
      </mesh>
      {/* Green sepal */}
      <group position={[0, scale - 0.01, 0]} scale={scale * 0.45} rotation={[Math.PI / 2, 0, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0]} rotation={[0, 0, angle]}>
              <coneGeometry args={[0.2, 1.2, 4]} />
              <meshStandardMaterial color="#166534" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// --- HIGHLY REALISTIC PLANT RENDERER ---
function InteractivePlant({ plantType, stage, selectedOrgan, onSelectOrgan, health, weather, fertilizerLevel }) {
  const [hovered, setHovered] = useState(null);

  // Biological adaptational properties
  const isWilted = health?.includes('dead') || weather === 'hot' || health === 'stressed_dry';
  const isPale = health === 'stressed_fertilizer' || health === 'stressed_water' || health === 'stressed_both';
  const isStunted = health === 'stressed_fertilizer' || health === 'stressed_both';

  // Tăng kích thước tổng thể để cây trông to lớn, hùng vĩ và cân đối với chậu
  const baseScale = plantType === 'pea' ? 1.4 : plantType === 'tomato' ? 1.4 : 1.3;
  // Cây bị còi cọc (stunted) do xót phân chỉ giảm nhẹ 15% kích thước, tránh bị thu nhỏ dị dạng
  const plantScale = isStunted ? baseScale * 0.85 : baseScale;

  // Tính toán độ nhô của lớp phân bón/đất để dời gốc cây lên, tránh bị chôn vùi dưới đất
  const moundHeight = (Math.min(fertilizerLevel || 0, 100) / 100) * 0.36;
  const basePositionY = -1.8 + moundHeight;

  const leafDroop = isWilted ? [0.6, 0, 0.4] : [0, 0, 0]; // Rotate leaves down
  const stemDroop = isWilted ? [0.15, 0, 0.1] : [0, 0, 0];

  // Colors based on health
  const leafColor = isWilted 
    ? '#857a48' 
    : isPale 
      ? '#a3e635' 
      : '#15803d'; 

  const stemColor = isWilted ? '#52525b' : '#166534';
  const fruitColor = isWilted ? '#7f1d1d' : (plantType === 'pea' ? '#65a30d' : '#ef4444'); 

  const getMaterial = (organId, defaultColor) => {
    const isSelected = selectedOrgan === organId;
    const isHovered = hovered === organId;
    
    let baseColor = defaultColor;
    if (organId === 'leaf') baseColor = leafColor;
    if (organId === 'stem') baseColor = stemColor;
    if (organId === 'fruit') baseColor = fruitColor;
    if (organId === 'root' && (health === 'dead_water' || health === 'stressed_water' || health === 'dead_both')) {
      baseColor = '#18181b'; // rotted black roots
    }

    return (
      <meshStandardMaterial
        color={isSelected ? '#10b981' : isHovered ? '#34d399' : baseColor}
        roughness={0.6}
        emissive={isSelected ? '#059669' : isHovered ? '#10b981' : '#000'}
        emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0}
      />
    );
  };

  const wrapInteractive = (organId, children, labelText = '') => {
    const isSelected = selectedOrgan === organId;
    const isHovered = hovered === organId;
    
    return (
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectOrgan(isSelected ? null : organId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(organId);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
          document.body.style.cursor = 'default';
        }}
      >
        {children}
        {labelText && (isSelected || isHovered) && (
          <Html distanceFactor={4} position={[0, 0.25, 0]} center pointerEvents="none">
            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow-md border transition-all ${
              isSelected 
                ? 'bg-emerald-500 border-emerald-300 text-white scale-105' 
                : 'bg-slate-900/95 border-slate-700 text-slate-300'
            }`}>
              {labelText}
            </div>
          </Html>
        )}
      </group>
    );
  };

  // --- STAGE 1: GERMINATION ---
  if (stage === 1) {
    return (
      <group position={[0, basePositionY, 0]} scale={plantScale}>
        {/* Seed */}
        {wrapInteractive('seed', (
          <mesh position={[0, plantType === 'pea' ? 0.05 : 0.15, 0]} scale={[0.15, 0.1, 0.1]}>
            <sphereGeometry args={[1, 16, 16]} />
            {getMaterial('seed', plantType === 'pea' ? '#4d7c0f' : plantType === 'rose' ? '#78350f' : '#b45309')}
          </mesh>
        ), 'Hạt giống')}

        {/* Radicle (Rễ mầm) */}
        {wrapInteractive('radicle', (
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.015, 0.005, 0.3, 8]} />
            {getMaterial('radicle', '#fef08a')}
          </mesh>
        ), 'Rễ mầm')}

        {/* Shoot / Hypocotyl (Thân mầm) */}
        {wrapInteractive('hypocotyl', (
          <group position={[0, 0.1, 0]}>
            {plantType === 'pea' ? (
              // Pea: Hypogeal (seed stays down, shoot goes up)
              <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.015, 0.02, 0.3, 8]} />
                {getMaterial('hypocotyl', '#84cc16')}
              </mesh>
            ) : (
              // Tomato/Rose: Epigeal (hypocotyl pushes seed up)
              <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0.3]}>
                <cylinderGeometry args={[0.015, 0.02, 0.2, 8]} />
                {getMaterial('hypocotyl', '#84cc16')}
              </mesh>
            )}
          </group>
        ), 'Thân mầm')}
      </group>
    );
  }

  // --- STAGE 2: SEEDLING ---
  if (stage === 2) {
    return (
      <group position={[0, basePositionY, 0]} scale={plantScale} rotation={stemDroop}>
        {/* Roots */}
        {wrapInteractive('root', (
          <group>
            <mesh position={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.02, 0.008, 0.6, 8]} />
              {getMaterial('root', '#ca8a04')}
            </mesh>
            <Line points={[[0, -0.15, 0], [-0.15, -0.3, 0.1]]} color="#ca8a04" lineWidth={1.5} />
            <Line points={[[0, -0.3, 0], [0.15, -0.45, -0.1]]} color="#ca8a04" lineWidth={1.5} />
          </group>
        ), 'Rễ non')}

        {/* Stem */}
        {wrapInteractive('stem', (
          <group>
            <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0.05]}>
              <cylinderGeometry args={[0.02, 0.025, 0.5, 8]} />
              {getMaterial('stem', '#84cc16')}
            </mesh>
            <mesh position={[-0.01, 0.65, 0]} rotation={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.015, 0.02, 0.4, 8]} />
              {getMaterial('stem', '#84cc16')}
            </mesh>
          </group>
        ), 'Thân non')}

        {/* Leaves / Cotyledons */}
        {wrapInteractive('leaf', (
          <group position={[0, 0.55, 0]}>
            {plantType === 'pea' ? (
              // Pea: First true leaves (pinnate), NO cotyledons above ground
              <group>
                 <PeaCompoundLeaf position={[-0.02, 0.1, 0.02]} rotation={[0.2, 0.4, 0.8]} scale={0.2} color={leafColor} />
                 <PeaCompoundLeaf position={[0.02, 0.3, -0.02]} rotation={[-0.2, -0.4, -0.8]} scale={0.2} color={leafColor} />
              </group>
            ) : plantType === 'tomato' ? (
              // Tomato: Long narrow lanceolate cotyledons + first true leaves
              <group>
                 {/* Cotyledons */}
                 <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.6 + leafDroop[0]]} scale={[0.15, 0.01, 0.04]}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={leafColor} />
                 </mesh>
                 <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.6 - leafDroop[0]]} scale={[0.15, 0.01, 0.04]}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={leafColor} />
                 </mesh>
                 {/* First true leaf */}
                 <TomatoCompoundLeaf position={[-0.02, 0.2, 0]} rotation={[0.2, 0.2, 0.8]} scale={0.2} color={leafColor} />
              </group>
            ) : (
              // Rose: Oval cotyledons + first true leaf
              <group>
                 {/* Cotyledons */}
                 <mesh position={[-0.1, 0, 0]} rotation={[0, 0, 0.5 + leafDroop[0]]} scale={[0.1, 0.01, 0.08]}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={leafColor} />
                 </mesh>
                 <mesh position={[0.1, 0, 0]} rotation={[0, 0, -0.5 - leafDroop[0]]} scale={[0.1, 0.01, 0.08]}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={leafColor} />
                 </mesh>
                 {/* First true leaf */}
                 <RoseCompoundLeaf position={[-0.02, 0.2, 0]} rotation={[0.2, 0.3, 0.6]} scale={0.2} color={leafColor} />
              </group>
            )}
          </group>
        ), plantType === 'pea' ? 'Lá thật' : 'Lá mầm & Lá non')}
      </group>
    );
  }

  // --- STAGE 3 & STAGE 4: MATURE / FLOWERING & FRUITING ---
  const isFruiting = stage === 4;

  // --- PEA PLANT (ĐẬU HÀ LAN) ANATOMY ---
  if (plantType === 'pea') {
    return (
      <group position={[0, basePositionY, 0]} scale={plantScale} rotation={stemDroop}>
        {/* Tri-pod Support Trellis */}
        <PeaVine />

        {/* 1. ROOT SYSTEM */}
        {wrapInteractive('root', (
          <group>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.045, 0.015, 1.0, 10]} />
              {getMaterial('root', '#ca8a04')}
            </mesh>
            {[
              { pos: [0, -0.2, 0], rot: [0, 0, -0.7], len: 0.5 },
              { pos: [0, -0.5, 0], rot: [0, 2.1, 0.6], len: 0.4 },
              { pos: [0, -0.8, 0], rot: [0, -2.1, -0.5], len: 0.4 },
            ].map((r, idx) => (
              <group key={idx} position={r.pos} rotation={r.rot}>
                <mesh position={[0, -r.len / 2, 0]}>
                  <cylinderGeometry args={[0.015, 0.005, r.len, 8]} />
                  <meshStandardMaterial color={(health?.includes('dead') || health === 'stressed_water') ? '#1c1917' : '#a16207'} />
                </mesh>
              </group>
            ))}
            <RootNodule position={[-0.08, -0.3, 0.05]} />
            <RootNodule position={[0.06, -0.45, -0.07]} />
            <RootNodule position={[-0.05, -0.7, -0.03]} />
          </group>
        ), 'Rễ cọc & Nốt sần cộng sinh')}

        {/* 2. STEM SYSTEM (Winding Vine climbing up the trellis) */}
        {wrapInteractive('stem', (
          <group>
            {/* Vine segments mimicking a zigzag climbing motion */}
            <mesh position={[0.04, 0.2, 0.04]} rotation={[0.2, 0.5, -0.3]}>
              <cylinderGeometry args={[0.018, 0.02, 0.45, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[-0.04, 0.6, -0.04]} rotation={[-0.2, 1.0, 0.3]}>
              <cylinderGeometry args={[0.016, 0.018, 0.45, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[0.03, 1.0, 0.02]} rotation={[0.1, -0.5, -0.2]}>
              <cylinderGeometry args={[0.014, 0.016, 0.45, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[-0.02, 1.4, -0.02]} rotation={[-0.1, 0.8, 0.15]}>
              <cylinderGeometry args={[0.012, 0.014, 0.45, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[0.01, 1.75, 0.01]} rotation={[0.05, -0.2, -0.1]}>
              <cylinderGeometry args={[0.01, 0.012, 0.35, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <StemFlowParticles active={selectedOrgan === 'stem'} />
          </group>
        ), 'Thân leo quấn giàn')}

        {/* 3. LEAVES (Detailed Pea Compound Leaves) */}
        {wrapInteractive('leaf', (
          <group>
            {/* Leaves attached at the joints (nodes) */}
            <PeaCompoundLeaf position={[0.08, 0.4, 0.08]} rotation={[0.2, 0.5, 0.6]} scale={0.32} color={leafColor} />
            <PeaCompoundLeaf position={[-0.08, 0.8, -0.08]} rotation={[-0.1, -2.5, -0.6]} scale={0.34} color={leafColor} />
            <PeaCompoundLeaf position={[0.05, 1.2, 0.04]} rotation={[0.15, 0.2, 0.7]} scale={0.3} color={leafColor} />
            <PeaCompoundLeaf position={[-0.03, 1.6, -0.03]} rotation={[-0.1, -1.8, -0.5]} scale={0.25} color={leafColor} />
          </group>
        ), 'Lá kép & Tua cuốn bám giàn')}

        {/* 4. FLOWER */}
        {isFruiting && wrapInteractive('flower', (
          <group>
            {/* Axillary flower at Node 3 */}
            <group position={[0.05, 1.2, 0.04]} rotation={[0.3, 0.5, 0]}>
              {/* Flower stalk */}
              <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, 1.0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.15]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <group position={[0.1, 0.1, 0]}>
                <PeaFlowerMesh color="#c084fc" />
              </group>
            </group>
            {/* Axillary flower at Node 4 */}
            <group position={[-0.03, 1.6, -0.03]} rotation={[0.1, -2.0, 0]}>
              <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, 1.0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.15]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <group position={[0.1, 0.1, 0]}>
                <PeaFlowerMesh color="#c084fc" />
              </group>
            </group>
          </group>
        ), 'Hoa Đậu tự thụ phấn')}

        {/* 5. FRUIT & SEED */}
        {isFruiting && wrapInteractive('fruit', (
          <group>
             {/* Axillary pod at Node 1 */}
             <group position={[0.08, 0.4, 0.08]} rotation={[0.4, 0.8, -0.2]}>
               <mesh position={[0.06, 0.06, 0]} rotation={[0, 0, 1.0]}>
                 <cylinderGeometry args={[0.005, 0.005, 0.18]} />
                 <meshStandardMaterial color="#166534" />
               </mesh>
               <group position={[0.12, 0.02, 0]}>
                 <PeaPodMesh color={fruitColor} showSeeds={selectedOrgan === 'fruit'} />
               </group>
             </group>
             
             {/* Axillary pod at Node 2 */}
             <group position={[-0.08, 0.8, -0.08]} rotation={[0.2, -2.2, -0.3]}>
               <mesh position={[0.06, 0.06, 0]} rotation={[0, 0, 1.0]}>
                 <cylinderGeometry args={[0.005, 0.005, 0.18]} />
                 <meshStandardMaterial color="#166534" />
               </mesh>
               <group position={[0.12, 0.02, 0]}>
                 <PeaPodMesh color={fruitColor} showSeeds={selectedOrgan === 'fruit'} />
               </group>
             </group>
          </group>
        ), 'Quả đậu & Hạt')}
      </group>
    );
  }

  // --- ROSE PLANT (HOA HỒNG) ANATOMY ---
  if (plantType === 'rose') {
    return (
      <group position={[0, basePositionY, 0]} scale={plantScale} rotation={stemDroop}>
        {/* 1. ROOT SYSTEM */}
        {wrapInteractive('root', (
          <group>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.05, 0.02, 1.0, 10]} />
              {getMaterial('root', '#78350f')}
            </mesh>
            {[
              { pos: [0, -0.2, 0], rot: [0, 0, -0.7], len: 0.5 },
              { pos: [0, -0.5, 0], rot: [0, 2.1, 0.6], len: 0.4 },
              { pos: [0, -0.8, 0], rot: [0, -2.1, -0.5], len: 0.4 },
            ].map((r, idx) => (
              <group key={idx} position={r.pos} rotation={r.rot}>
                <mesh position={[0, -r.len / 2, 0]}>
                  <cylinderGeometry args={[0.018, 0.006, r.len, 8]} />
                  <meshStandardMaterial color={(health?.includes('dead') || health === 'stressed_water') ? '#1c1917' : '#5c2d15'} />
                </mesh>
              </group>
            ))}
          </group>
        ), 'Hệ Rễ cọc')}

        {/* 2. STEM SYSTEM (Woody with thorns) */}
        {wrapInteractive('stem', (
          <group>
            {/* Segment 1 */}
            <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0.05]}>
              <cylinderGeometry args={[0.04, 0.055, 0.9, 10]} />
              {getMaterial('stem', '#1b4332')}
              {/* Thorns perfectly attached to surface of Segment 1 */}
              {[-0.3, -0.15, 0, 0.15, 0.3, 0.4].map((yLocal, idx) => {
                const angle = idx * Math.PI * 0.85; 
                return (
                  <mesh key={`t1-${idx}`} position={[Math.cos(angle) * 0.045, yLocal, Math.sin(angle) * 0.045]} rotation={[0, -angle, -Math.PI * 0.6]} scale={0.7}>
                    <coneGeometry args={[0.015, 0.08, 4]} />
                    <meshStandardMaterial color="#7f1d1d" roughness={0.9} />
                  </mesh>
                )
              })}
            </mesh>
            {/* Segment 2 */}
            <mesh position={[-0.02, 1.25, 0]} rotation={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.03, 0.04, 0.8, 10]} />
              {getMaterial('stem', '#1b4332')}
              {/* Thorns perfectly attached to surface of Segment 2 */}
              {[-0.3, -0.15, 0, 0.15, 0.3].map((yLocal, idx) => {
                const angle = (idx + 6) * Math.PI * 0.85; 
                return (
                  <mesh key={`t2-${idx}`} position={[Math.cos(angle) * 0.035, yLocal, Math.sin(angle) * 0.035]} rotation={[0, -angle, -Math.PI * 0.6]} scale={0.7}>
                    <coneGeometry args={[0.015, 0.08, 4]} />
                    <meshStandardMaterial color="#7f1d1d" roughness={0.9} />
                  </mesh>
                )
              })}
            </mesh>
            <StemFlowParticles active={selectedOrgan === 'stem'} />
          </group>
        ), 'Thân gỗ có gai')}

        {/* 3. LEAVES (Detailed Rose Compound Leaves) */}
        {wrapInteractive('leaf', (
          <group>
            {/* Positioning leaves so petiole base strictly touches the stem */}
            <RoseCompoundLeaf position={[-0.03, 0.55, 0.03]} rotation={[0.2, 0.3, 0.6]} scale={0.36} color={leafColor} />
            <RoseCompoundLeaf position={[0.02, 0.95, -0.03]} rotation={[-0.1, -0.3, -0.6]} scale={0.38} color={leafColor} />
            <RoseCompoundLeaf position={[-0.03, 1.3, 0.03]} rotation={[0.1, 0.2, 0.5]} scale={0.34} color={leafColor} />
            <RoseCompoundLeaf position={[0.02, 1.5, -0.02]} rotation={[-0.1, -0.1, -0.5]} scale={0.25} color={leafColor} />
          </group>
        ), 'Lá kép lông chim răng cưa')}

        {/* 4. FLOWER */}
        {isFruiting && wrapInteractive('flower', (
          <group position={[0, 1.75, 0]}>
            <RoseFlowerMesh color="#f43f5e" />
          </group>
        ), 'Bông hoa hồng nở rộ')}
      </group>
    );
  }

  // --- TOMATO PLANT (CÀ CHUA) ANATOMY ---
  if (plantType === 'tomato') {
    return (
      <group position={[0, basePositionY, 0]} scale={plantScale} rotation={stemDroop}>
        {/* 1. ROOT SYSTEM */}
        {wrapInteractive('root', (
          <group>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.05, 0.02, 1.0, 10]} />
              {getMaterial('root', '#ca8a04')}
            </mesh>
            {[
              { pos: [0, -0.15, 0], rot: [0, 0, -0.8], len: 0.6 },
              { pos: [0, -0.35, 0], rot: [0, 2.1, 0.7], len: 0.5 },
              { pos: [0, -0.55, 0], rot: [0, -2.1, -0.6], len: 0.5 },
              { pos: [0, -0.75, 0], rot: [0, 0.8, 0.8], len: 0.4 },
            ].map((r, idx) => (
              <group key={idx} position={r.pos} rotation={r.rot}>
                <mesh position={[0, -r.len / 2, 0]}>
                  <cylinderGeometry args={[0.015, 0.005, r.len, 8]} />
                  <meshStandardMaterial color={(health?.includes('dead') || health === 'stressed_water') ? '#1c1917' : '#a16207'} />
                </mesh>
              </group>
            ))}
          </group>
        ), 'Hệ Rễ chùm rộng')}

        {/* 2. STEM SYSTEM (Main stem + branches) */}
        {wrapInteractive('stem', (
          <group>
            {/* Main stem */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.045, 0.055, 1.2, 10]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.03, 0.045, 0.6, 10]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            
            {/* Side Branches */}
            <mesh position={[-0.15, 0.8, 0]} rotation={[0, 0, 0.8]}>
              <cylinderGeometry args={[0.02, 0.025, 0.5, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[0.15, 1.1, 0.1]} rotation={[0.4, 0, -0.7]}>
              <cylinderGeometry args={[0.015, 0.02, 0.4, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>
            <mesh position={[-0.12, 1.4, -0.1]} rotation={[-0.3, 0, 0.6]}>
              <cylinderGeometry args={[0.012, 0.015, 0.35, 8]} />
              {getMaterial('stem', '#22c55e')}
            </mesh>

            {/* Fuzzy hair wireframe */}
            <mesh position={[0, 0.9, 0]} scale={[1.08, 0.96, 1.08]}>
              <cylinderGeometry args={[0.04, 0.055, 1.8, 10]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.15} wireframe />
            </mesh>
            <StemFlowParticles active={selectedOrgan === 'stem'} />
          </group>
        ), 'Thân & cành rậm rạp')}

        {/* 3. LEAVES (Tomato Compound Leaves) */}
        {wrapInteractive('leaf', (
          <group>
            {/* Leaves on Main Stem */}
            <TomatoCompoundLeaf position={[0.05, 0.5, 0.05]} rotation={[0.1, 0.5, 0.4]} scale={0.4} color={leafColor} />
            <TomatoCompoundLeaf position={[-0.05, 1.3, -0.05]} rotation={[-0.1, 3.5, 0.5]} scale={0.35} color={leafColor} />
            
            {/* Leaves on Branches */}
            {/* Branch 1 */}
            <TomatoCompoundLeaf position={[-0.35, 1.0, 0]} rotation={[0, -0.5, -0.2]} scale={0.35} color={leafColor} />
            <TomatoCompoundLeaf position={[-0.2, 0.85, 0.1]} rotation={[0.2, 0.5, 0.4]} scale={0.3} color={leafColor} />
            
            {/* Branch 2 */}
            <TomatoCompoundLeaf position={[0.3, 1.25, 0.2]} rotation={[0.5, 1.5, -0.3]} scale={0.3} color={leafColor} />
            <TomatoCompoundLeaf position={[0.15, 1.15, -0.05]} rotation={[-0.2, 2.5, 0.4]} scale={0.25} color={leafColor} />

            {/* Branch 3 */}
            <TomatoCompoundLeaf position={[-0.25, 1.55, -0.2]} rotation={[-0.4, 0.2, -0.2]} scale={0.25} color={leafColor} />
          </group>
        ), 'Lá kép xẻ thùy')}

        {/* 4. FLOWER TRUSSES */}
        {isFruiting && wrapInteractive('flower', (
          <group>
            {/* Flower Truss on Branch 2 */}
            <group position={[0.15, 1.05, 0.1]} rotation={[0.4, 0.8, -0.5]}>
              <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.005, 0.005, 0.1]} />
                 <meshStandardMaterial color="#166534" />
              </mesh>
              <group position={[0.1, 0, 0]}>
                 <group position={[0, 0, 0]}><TomatoFlowerMesh /></group>
                 <group position={[0.04, -0.04, 0.04]} rotation={[0.2, 0, 0.2]}><TomatoFlowerMesh /></group>
                 <group position={[0.04, -0.04, -0.04]} rotation={[-0.2, 0, 0.2]}><TomatoFlowerMesh /></group>
              </group>
            </group>

            {/* Flower Truss on upper main stem */}
            <group position={[0.04, 1.6, 0.04]} rotation={[-0.2, -1.0, -0.4]}>
              <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.005, 0.005, 0.1]} />
                 <meshStandardMaterial color="#166534" />
              </mesh>
              <group position={[0.1, 0, 0]}>
                 <group position={[0, 0, 0]}><TomatoFlowerMesh /></group>
                 <group position={[0.03, -0.03, 0.03]} rotation={[0.3, 0.2, 0.1]}><TomatoFlowerMesh /></group>
              </group>
            </group>
          </group>
        ), 'Chùm hoa vàng')}

        {/* 5. FRUIT CLUSTERS (Trusses) */}
        {isFruiting && wrapInteractive('fruit', (
          <group>
             {/* Truss 1 on lower main stem */}
             <group position={[0, 0.65, 0]} rotation={[0, 0.8, 0]}>
                {/* Main truss stalk branching OUT from stem */}
                <mesh position={[0.15, -0.03, 0]} rotation={[0, 0, 1.4]}>
                   <cylinderGeometry args={[0.005, 0.007, 0.3]} />
                   <meshStandardMaterial color="#166534" />
                </mesh>
                
                {/* Tomato 1 (Ripe Red) */}
                <group position={[0.08, 0, 0]}>
                  <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.003, 0.003, 0.08]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.08, 0]}>
                    <TomatoFruitMesh color={fruitColor} scale={0.08} />
                  </group>
                </group>

                {/* Tomato 2 (Ripe Red) */}
                <group position={[0.18, -0.03, 0.02]} rotation={[0.1, 0, 0]}>
                  <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.003, 0.003, 0.08]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.08, 0]}>
                    <TomatoFruitMesh color={fruitColor} scale={0.075} />
                  </group>
                </group>

                {/* Tomato 3 (Orange/Ripening) */}
                <group position={[0.27, -0.06, -0.02]} rotation={[-0.1, 0, 0]}>
                  <mesh position={[0, -0.03, 0]}><cylinderGeometry args={[0.003, 0.003, 0.06]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.06, 0]}>
                    <TomatoFruitMesh color="#f97316" scale={0.06} />
                  </group>
                </group>
             </group>
             
             {/* Truss 2 on Branch 1 */}
             <group position={[-0.15, 0.9, 0]} rotation={[0, -1.2, 0]}>
                <mesh position={[0.12, -0.02, 0]} rotation={[0, 0, 1.4]}>
                   <cylinderGeometry args={[0.004, 0.006, 0.24]} />
                   <meshStandardMaterial color="#166534" />
                </mesh>

                {/* Tomato 1 (Orange/Ripening) */}
                <group position={[0.08, -0.01, 0.01]}>
                  <mesh position={[0, -0.03, 0]}><cylinderGeometry args={[0.003, 0.003, 0.06]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.06, 0]}>
                    <TomatoFruitMesh color="#f97316" scale={0.07} />
                  </group>
                </group>

                {/* Tomato 2 (Unripe Green) */}
                <group position={[0.18, -0.03, -0.01]}>
                  <mesh position={[0, -0.03, 0]}><cylinderGeometry args={[0.003, 0.003, 0.06]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.06, 0]}>
                    <TomatoFruitMesh color="#84cc16" scale={0.06} />
                  </group>
                </group>
             </group>

             {/* Truss 3 on Branch 2 */}
             <group position={[0.15, 1.15, 0.1]} rotation={[0, 2.5, 0]}>
                <mesh position={[0.1, -0.02, 0]} rotation={[0, 0, 1.3]}>
                   <cylinderGeometry args={[0.004, 0.005, 0.2]} />
                   <meshStandardMaterial color="#166534" />
                </mesh>

                {/* Tomato 1 (Unripe Green) */}
                <group position={[0.08, -0.02, 0]}>
                  <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.002, 0.002, 0.04]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.04, 0]}>
                    <TomatoFruitMesh color="#84cc16" scale={0.05} />
                  </group>
                </group>

                {/* Tomato 2 (Small Green) */}
                <group position={[0.16, -0.04, 0]}>
                  <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.002, 0.002, 0.04]}/><meshStandardMaterial color="#166534" /></mesh>
                  <group position={[0, -0.04, 0]}>
                    <TomatoFruitMesh color="#84cc16" scale={0.04} />
                  </group>
                </group>
             </group>
          </group>
        ), 'Chùm quả nhiều giai đoạn trải dài')}
      </group>
    );
  }
}

// --- MAIN WEB APP COMPONENT ---
export default function PlantStructureGame3D({ onComplete }) {
  // Theme responsive state
  const [isLightTheme, setIsLightTheme] = useState(document.body.classList.contains('light-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightTheme(document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Game state
  const [phase, setPhase] = useState('intro'); // 'intro', 'pot_assembly', 'fertilizing', 'planting', 'watering', 'growing', 'complete'
  const [plantType, setPlantType] = useState('pea'); // 'pea', 'rose', 'tomato'
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [growthStage, setGrowthStage] = useState(1);
  
  // Custom HUD visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isWeatherPanelOpen, setIsWeatherPanelOpen] = useState(true);

  // Environmental Toggles & Levels
  const [weather, setWeather] = useState('normal'); 
  const [fertilizerLevel, setFertilizerLevel] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);

  // Animation states
  const [isFertilizing, setIsFertilizing] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  
  // Custom Alert Modal for Plant Death
  const [deadAlert, setDeadAlert] = useState(null);

  // Custom Glass Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  // 1. Pot Assembly State
  const [assembledPieces, setAssembledPieces] = useState([]);
  const potPieces = {
    p1: { thetaStart: 0, label: 'Mảnh chậu Đông', scatter: [-1.6, -1.8, 1.2], rot: [0.2, 0.4, -0.2] },
    p2: { thetaStart: Math.PI / 2, label: 'Mảnh chậu Bắc', scatter: [-1.2, -1.8, -1.5], rot: [-0.1, -0.3, 0.1] },
    p3: { thetaStart: Math.PI, label: 'Mảnh chậu Tây', scatter: [1.3, -1.8, -1.2], rot: [0.1, 0.5, -0.3] },
    p4: { thetaStart: Math.PI * 1.5, label: 'Mảnh chậu Nam', scatter: [1.5, -1.8, 1.4], rot: [-0.2, -0.4, 0.2] }
  };

  // We no longer need fertilizerPellets as we'll use a dynamically scaling cylinder to simulate soil building up.

  // 2. Computed Plant Health Status
  const plantHealth = useMemo(() => {
    if (weather === 'hot') {
      if (waterLevel > 150 || fertilizerLevel > 150) return 'dead_hot';
      return 'stressed_dry';
    }
    if (waterLevel > 150 && fertilizerLevel > 150) return 'dead_both';
    if (waterLevel > 150) return 'dead_water';
    if (fertilizerLevel > 150) return 'dead_fertilizer';
    
    if (waterLevel > 100 && fertilizerLevel > 100) return 'stressed_both';
    if (waterLevel > 100) return 'stressed_water';
    if (fertilizerLevel > 100) return 'stressed_fertilizer';
    
    if (waterLevel < 30) return 'stressed_dry';
    if (fertilizerLevel < 30) return 'stressed_deficient';
    
    return 'healthy';
  }, [weather, waterLevel, fertilizerLevel]);

  // Handle Plant Death & Show Warning Modal
  useEffect(() => {
    if (plantHealth && plantHealth.startsWith('dead')) {
      let msg = '';
      if (plantHealth === 'dead_water') {
        msg = 'Cây đã bị thối rễ và chết do tưới quá nhiều nước! Bạn hãy trồng lại cây mới.';
      } else if (plantHealth === 'dead_fertilizer') {
        msg = 'Cây đã bị xót rễ và chết do bón quá nhiều phân! Bạn hãy trồng lại cây mới.';
      } else if (plantHealth === 'dead_both') {
        msg = 'Song trùng tai hại! Rễ cây vừa thối úng vừa bị xót phân nặng dẫn đến cây chết khô. Bạn hãy trồng lại cây mới.';
      } else {
        msg = 'Cây bị kiệt sức hoàn toàn dưới ánh nắng gay gắt kết hợp mất cân bằng dinh dưỡng và nước dẫn đến tử vong. Bạn hãy trồng lại cây mới.';
      }
      setDeadAlert(msg);
    }
  }, [plantHealth]);

  // Small Warning Alert for Exceeding Safe Limits
  const [warningAlert, setWarningAlert] = useState(null);

  useEffect(() => {
    if (plantHealth === 'stressed_fertilizer') {
      setWarningAlert('Cảnh báo: Lượng phân bón đã vượt mức an toàn!');
    } else if (plantHealth === 'stressed_water') {
      setWarningAlert('Cảnh báo: Lượng nước đã vượt mức an toàn!');
    } else if (plantHealth === 'stressed_both') {
      setWarningAlert('Cảnh báo: Lượng phân bón và nước đều vượt mức an toàn!');
    } else {
      setWarningAlert(null);
    }
  }, [plantHealth]);

  const handleResetGame = () => {
    setDeadAlert(null);
    setPhase('fertilizing');
    setFertilizerLevel(0);
    setWaterLevel(0);
    setWeather('normal');
    setGrowthStage(1);
    setSelectedOrgan(null);
    setIsSidebarOpen(false);
  };

  const handleSelectOrgan = (organId) => {
    setSelectedOrgan(organId);
    setIsSidebarOpen(!!organId);
  };

  const handleAssemblePiece = (pieceId) => {
    if (assembledPieces.includes(pieceId)) return;
    setAssembledPieces(prev => {
      const next = [...prev, pieceId];
      if (next.length === 4) {
        setTimeout(() => setPhase('fertilizing'), 1000);
      }
      return next;
    });
  };

  const startFertilizing = () => {
    if (plantHealth && plantHealth.startsWith('dead')) return;

    setIsFertilizing(true);
    setTimeout(() => {
      setIsFertilizing(false);
      setFertilizerLevel(prev => {
        const next = Math.min(200, prev + 20);
        if (phase === 'fertilizing' && next >= 100) {
          setTimeout(() => setPhase('planting'), 1000);
        }
        return next;
      });
    }, 1000);
  };

  const handleSelectSeed = (type) => {
    setPlantType(type);
    setShowSeedModal(false);
    setPhase('watering');
  };

  const handleSeedButtonClick = () => {
    if (phase === 'growing') {
      setConfirmModal({
        isOpen: true,
        message: 'Bạn có muốn trồng lại hạt giống mới không? Hệ thống sẽ thiết lập lại toàn bộ chu trình từ bước bón phân.',
        onConfirm: () => {
          handleResetGame();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => setShowSeedModal(true), 200);
        }
      });
    } else {
      setShowSeedModal(true);
    }
  };

  const startWatering = () => {
    if (plantHealth && plantHealth.startsWith('dead')) return;

    setIsWatering(true);
    setTimeout(() => {
      setIsWatering(false);
      setWaterLevel(prev => {
        const next = Math.min(200, prev + 20);
        if (phase === 'watering' && next >= 100) {
          setTimeout(() => setPhase('growing'), 1000);
        }
        return next;
      });
    }, 1000);
  };

  // Get current active organ data
  const currentOrganData = useMemo(() => {
    if (!selectedOrgan) return null;
    const stageData = PLANT_DATA[plantType]?.stages[growthStage];
    return stageData?.organs[selectedOrgan] || null;
  }, [plantType, growthStage, selectedOrgan]);

  // Explanation of plant physiological state
  const healthExplanation = {
    healthy: {
      title: 'Cây phát triển tốt',
      desc: 'Cân bằng dinh dưỡng và nước lý tưởng. Các mạch dẫn hoạt động bình thường.',
      class: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
    },
    stressed_dry: {
      title: 'Thiếu nước (Héo rủ)',
      desc: 'Cây bị khô hạn, lá mất sức trương co rút héo rủ để giảm thiểu thoát hơi nước.',
      class: 'border-amber-500/20 text-amber-500 bg-amber-500/5'
    },
    stressed_deficient: {
      title: 'Thiếu phân bón (Còi cọc)',
      desc: 'Thiếu chất khoáng thiết yếu khiến cây bị hạn chế chiều cao, lá nhỏ và nhạt màu.',
      class: 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
    },
    stressed_water: {
      title: 'Dư nước (Ngập úng)',
      desc: 'Đất úng lâu ngày làm rễ thiếu oxy. Rễ bắt đầu thối rữa và phân hủy, lá vàng nhạt.',
      class: 'border-sky-500/20 text-sky-500 bg-sky-500/5'
    },
    stressed_fertilizer: {
      title: 'Dư phân bón (Xót phân)',
      desc: 'Nồng độ muối khoáng đất cao hơn dịch tế bào rễ, làm nước bị hút ngược từ rễ ra ngoài. Rìa lá bị cháy.',
      class: 'border-rose-400/20 text-rose-400 bg-rose-500/5'
    },
    stressed_both: {
      title: 'Đa ngập úng & Xót phân',
      desc: 'Cực kỳ nguy kịch! Rễ vừa thối do ngập úng vừa mất nước nghiêm trọng do xót phân.',
      class: 'border-red-500/20 text-red-400 bg-red-500/5'
    }
  };

  // UI Theme Variables
  const themeClasses = {
    panel: isLightTheme 
      ? 'bg-white/95 border-slate-250 text-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.05)]' 
      : 'bg-slate-950/85 border-slate-850 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    btnActive: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20',
    btnInactive: isLightTheme 
      ? 'bg-slate-100 hover:bg-slate-250 border-slate-250 text-slate-700' 
      : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400',
    textMuted: isLightTheme ? 'text-slate-500' : 'text-slate-400'
  };

  return (
    <div className={`absolute inset-0 text-white font-sans overflow-hidden select-none transition-colors duration-500 ${
      isLightTheme ? 'bg-slate-100' : 'bg-[#050806]'
    }`}>
      {/* 3D CANVAS VIEWPORT */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ position: [0, 0.8, 5.5], fov: 45 }}>
          <Suspense fallback={null}>
            <color attach="background" args={[isLightTheme ? '#e2e8f0' : '#050806']} />
            
            <ambientLight intensity={isLightTheme ? 0.95 : 0.65} />
            <directionalLight position={[5, 10, 5]} intensity={isLightTheme ? 1.8 : 1.4} castShadow />
            <pointLight position={[0, 1.5, 2.5]} intensity={0.5} color="#10b981" />

            <CameraController selectedOrgan={selectedOrgan} growthStage={growthStage} phase={phase} />

          {/* 1. POT ASSEMBLY PHASE (Hollow cylindrical pot - no staircase) */}
          {phase === 'pot_assembly' && (
            <group>
              {/* Target Ghost Pot Outline */}
              <mesh position={[0, -1.8, 0]}>
                <cylinderGeometry args={[1.1, 0.85, 0.9, 32, 1, true]} />
                <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.15} />
              </mesh>

              {/* Scattered Pieces with glowing cracked veins */}
              {Object.entries(potPieces).map(([id, p]) => {
                const isSnapped = assembledPieces.includes(id);
                const pos = isSnapped ? [0, -1.8, 0] : p.scatter;
                const rot = isSnapped ? [0, 0, 0] : p.rot;

                return (
                  <group 
                    key={id} 
                    position={pos} 
                    rotation={rot}
                    onClick={() => handleAssemblePiece(id)}
                  >
                    <mesh castShadow>
                      <cylinderGeometry 
                        args={[1.1, 0.85, 0.9, 16, 2, true, p.thetaStart, Math.PI / 2 - 0.08]} 
                      />
                      <meshStandardMaterial 
                        color={isSnapped ? '#7c2d12' : '#9a3412'} 
                        roughness={0.8} 
                        side={THREE.DoubleSide}
                      />
                    </mesh>

                    {/* Glowing Crack Lines */}
                    {!isSnapped && (
                      <group rotation={[0, p.thetaStart, 0]}>
                        <Line
                          points={[[1.1, 0.45, 0], [0.85, -0.45, 0]]}
                          color="#f97316"
                          lineWidth={2}
                        />
                        <Line
                          points={[[0, 0.45, 1.1], [0, -0.45, 0.85]]}
                          color="#f97316"
                          lineWidth={2}
                        />
                      </group>
                    )}

                    {!isSnapped && (
                      <Html position={[Math.cos(p.thetaStart + 0.7) * 1.2, 0, Math.sin(p.thetaStart + 0.7) * 1.2]} center>
                        <button className="bg-emerald-500/90 hover:bg-emerald-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-emerald-300/30 whitespace-nowrap uppercase tracking-wider cursor-pointer">
                          {p.label}
                        </button>
                      </Html>
                    )}
                  </group>
                );
              })}
            </group>
          )}

          {/* 2. ASSEMBLED POT & SOIL (Hollow pot with deep soil) */}
          {phase !== 'pot_assembly' && (
            <group>
              {/* Assembled Pot Walls (Hollow) */}
              <mesh position={[0, -1.8, 0]} castShadow>
                <cylinderGeometry args={[1.1, 0.85, 0.9, 32, 1, true]} />
                <meshStandardMaterial color="#7c2d12" roughness={0.8} side={THREE.DoubleSide} />
              </mesh>
              {/* Pot Base */}
              <mesh position={[0, -2.2, 0]}>
                <cylinderGeometry args={[0.84, 0.84, 0.05, 32]} />
                <meshStandardMaterial color="#522415" roughness={0.9} />
              </mesh>

              {/* Soil inside the pot (Lying deep down, showing hollow pot walls) */}
              <mesh position={[0, -1.95, 0]}>
                <cylinderGeometry args={[0.92, 0.86, 0.4, 24]} />
                <meshStandardMaterial 
                  color={
                    weather === 'hot' || plantHealth === 'stressed_dry'
                      ? '#78716c' 
                      : waterLevel >= 100 
                        ? '#1b1008' 
                        : '#451a03' 
                  } 
                  roughness={0.9} 
                />
              </mesh>

              {/* Lớp phân bón vun lên như đất (Vun đầy tự nhiên theo dạng Hemisphere) */}
              {fertilizerLevel > 0 && (
                <mesh position={[0, -1.75, 0]} scale={[1, (Math.min(fertilizerLevel, 100) / 100) * 0.4, 1]}>
                  <sphereGeometry args={[0.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#3d2112" roughness={0.9} />
                </mesh>
              )}

              {/* Parabolic water pouring animation */}
              <WateringPouringSystem active={isWatering} />

              {/* Fertilizer pouring animation */}
              <FertilizerPouringSystem active={isFertilizing} />

              {/* Shimmering Sunbeam and Rain Weather Systems */}
              <SunlightBeam active={weather === 'hot'} />
              <RainSystem active={weather === 'rain'} />

              {/* Seed placing animation */}
              {phase === 'planting' && (
                <mesh position={[0, -1.72, 0]} scale={0.07}>
                  <sphereGeometry args={[1, 16, 16]} />
                  <meshStandardMaterial color="#84cc16" />
                </mesh>
              )}

              {/* 3. INTERACTIVE PLANT */}
              {phase === 'growing' && (
                <InteractivePlant 
                  plantType={plantType} 
                  stage={growthStage} 
                  selectedOrgan={selectedOrgan} 
                  onSelectOrgan={handleSelectOrgan}
                  health={plantHealth}
                  weather={weather}
                  fertilizerLevel={fertilizerLevel}
                />
              )}
            </group>
          )}

          <OrbitControls 
            enablePan={false} 
            minDistance={2.0} 
            maxDistance={8.0} 
            target={[0, -0.2, 0]} 
          />
          </Suspense>
        </Canvas>
      </div>

      {/* --- LIQUID GLASS UI OVERLAYS --- */}

      {/* SMALL WARNING TOAST */}
      {warningAlert && !deadAlert && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="bg-amber-500/90 text-white px-6 py-3 rounded-full shadow-lg shadow-amber-500/20 border border-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-sm">
            <AlertTriangle className="w-4 h-4" />
            {warningAlert}
          </div>
        </div>
      )}
      
      {/* 1. INTRO SCREEN */}
      {phase === 'intro' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-emerald-900/20 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🪴</div>
            <h2 className="text-2xl font-bold text-white mb-3">Cấu Tạo Thực Vật 3D</h2>
            <p className="text-gray-300 text-sm mb-2">Trải nghiệm thực tế quá trình gieo trồng!</p>
            <p className="text-gray-400 text-xs mb-4">Lắp ráp chậu, chọn hạt giống, tưới nước và bón phân để quan sát cây lớn lên từng ngày.</p>
            
            <div className="flex flex-wrap gap-1 justify-center mb-4">
              {['Hạt giống', 'Tưới nước', 'Bón phân', 'Lắp ráp'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-400">
                  {tag}
                </span>
              ))}
            </div>

            <button 
              onClick={() => setPhase('pot_assembly')} 
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center"
            >
              Bắt đầu gieo trồng <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* TOP LEFT CORNER - CURRENT PLANT INFO */}
      {phase === 'growing' && (
        <div className="absolute top-16 left-4 z-40 pointer-events-none">
          <div className={`border px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-3 transition-colors pointer-events-auto ${themeClasses.panel}`}>
            <span className="text-2xl">
              {plantType === 'pea' ? '🫛' : plantType === 'rose' ? '🌹' : '🍅'}
            </span>
            <div>
              <p className="text-[8px] text-emerald-500 uppercase tracking-widest font-black">Cây đang trồng</p>
              <h3 className="text-xs font-bold">{PLANT_DATA[plantType]?.name.split(' (')[0]}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 2. POT ASSEMBLY HUD */}
      {phase === 'pot_assembly' && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl border text-center max-w-sm w-full mx-4 z-10 transition-colors ${themeClasses.panel}`}>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Giai đoạn 1</h4>
          <h3 className="text-sm font-bold mb-2">Lắp ráp Chậu Cây Rỗng</h3>
          <p className={`text-[10px] leading-relaxed mb-3 ${themeClasses.textMuted}`}>
            Click vào các mảnh chậu hình vòng cung để ráp lại thành một chiếc chậu hoàn chỉnh.
          </p>
          <div className="flex justify-center gap-1.5">
            {['p1', 'p2', 'p3', 'p4'].map((p) => (
              <div 
                key={p} 
                className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                  assembledPieces.includes(p) 
                    ? 'bg-emerald-500 border-emerald-400' 
                    : 'bg-slate-300 dark:bg-slate-800 border-slate-400 dark:border-slate-750'
                }`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. FERTILIZER HUD */}
      {phase === 'fertilizing' && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl border text-center max-w-sm w-full mx-4 z-10 transition-colors ${themeClasses.panel}`}>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Giai đoạn 2</h4>
          <h3 className="text-sm font-bold mb-2">Chuẩn bị Đất & Bón Phân</h3>
          <p className={`text-[10px] leading-relaxed ${themeClasses.textMuted}`}>
            Sử dụng công cụ <b>Bón Phân</b> ở thanh bên trái để thêm dưỡng chất vào chậu. Hãy bón vừa đủ 100% để tạo môi trường gieo hạt tốt nhất.
          </p>
        </div>
      )}

      {/* 4. WATERING HUD */}
      {(phase === 'planting' || phase === 'watering') && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl border text-center max-w-sm w-full mx-4 z-10 transition-colors ${themeClasses.panel}`}>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Giai đoạn 3</h4>
          <h3 className="text-sm font-bold mb-2">Gieo Hạt & Tưới Nước</h3>
          <p className={`text-[10px] leading-relaxed ${themeClasses.textMuted}`}>
            {phase === 'planting' 
              ? "Hãy chọn loại hạt giống ở thanh bên trái để gieo trồng."
              : "Sử dụng công cụ Tưới Nước để tạo độ ẩm kích thích hạt nảy mầm (đạt 100%)."}
          </p>
        </div>
      )}

      {/* 3. INTERACTIVE LEFT TOOL PANEL */}
      {phase !== 'intro' && phase !== 'pot_assembly' && phase !== 'complete' && (
        <div className={`absolute left-4 top-40 z-40 transition-all duration-300 ${
          isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+16px)]'
        }`}>
          <button 
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className={`absolute right-[-32px] top-1/2 -translate-y-1/2 p-2 rounded-r-xl border-t border-b border-r transition-all cursor-pointer z-10 ${
              isLightTheme 
                ? 'bg-white border-slate-200 text-slate-700' 
                : 'bg-slate-950/90 border-slate-850 text-slate-300'
            }`}
          >
            {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className={`w-24 p-3 rounded-2xl border flex flex-col gap-3 transition-colors ${themeClasses.panel}`}>
            <p className="text-[8px] font-black uppercase text-center tracking-wider text-emerald-500">Dụng cụ</p>
            
            {/* Tool 1: Fertilizer */}
            <button
              onClick={startFertilizing}
              disabled={isFertilizing || phase === 'pot_assembly' || phase === 'planting'}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-[9px] font-bold uppercase cursor-pointer ${
                fertilizerLevel >= 150 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : fertilizerLevel >= 100 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:scale-105'
              }`}
            >
              <FertilizerCanisterIcon />
              <span>Bón Phân</span>
              <span className="text-[8px] font-black">{fertilizerLevel}%</span>
            </button>

            {/* Tool 2: Seeds */}
            <button
              onClick={handleSeedButtonClick}
              disabled={phase === 'pot_assembly' || phase === 'fertilizing'}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-[9px] font-bold uppercase cursor-pointer ${
                phase === 'planting' || phase === 'growing'
                  ? 'bg-lime-500/10 border-lime-500/30 text-lime-500 hover:scale-105'
                  : 'opacity-40 cursor-not-allowed border-transparent'
              }`}
            >
              <span className="text-xl">
                {plantType === 'pea' ? '🫛' : plantType === 'rose' ? '🌹' : '🍅'}
              </span>
              <span>Hạt Giống</span>
            </button>

            {/* Tool 3: Water */}
            <button
              onClick={startWatering}
              disabled={isWatering || phase === 'pot_assembly' || phase === 'fertilizing' || phase === 'planting'}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-[9px] font-bold uppercase cursor-pointer ${
                waterLevel >= 150
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : waterLevel >= 100
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-500 hover:scale-105'
              }`}
            >
              <Droplet className="w-5 h-5 text-sky-500" />
              <span>Tưới Nước</span>
              <span className="text-[8px] font-black">{waterLevel}%</span>
            </button>
          </div>
        </div>
      )}

      {/* SEED SELECTION MODAL */}
      {showSeedModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className={`border rounded-[2.5rem] p-8 max-w-xl w-full text-center shadow-2xl transition-colors ${themeClasses.panel}`}>
            <h2 className="text-xl font-black mb-2">Chọn Loại Hạt Giống</h2>
            <p className={`text-xs mb-6 ${themeClasses.textMuted}`}>Hãy chọn một hạt giống để gieo trồng.</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(PLANT_DATA).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleSelectSeed(key)}
                  className={`border rounded-2xl p-4 text-center transition-all hover:scale-[1.03] flex flex-col justify-between cursor-pointer group ${
                    isLightTheme 
                      ? 'bg-slate-50 hover:bg-emerald-50/20 border-slate-250 hover:border-emerald-500/40' 
                      : 'bg-slate-900/60 hover:bg-emerald-950/20 border-slate-850 hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <span className="text-3xl block mb-2 group-hover:animate-bounce">
                      {key === 'pea' ? '🫛' : key === 'rose' ? '🌹' : '🍅'}
                    </span>
                    <h3 className="text-xs font-black mb-1">{data.name.split(' (')[0]}</h3>
                  </div>
                  <div className="mt-4 py-1 bg-emerald-500/10 rounded-lg text-[8px] text-emerald-500 font-bold uppercase tracking-wider">
                    Chọn
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowSeedModal(false)}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* 4. WEATHER & ENVIRONMENT BOTTOM LEFT PANEL */}
      {phase === 'growing' && (
        <div className={`absolute bottom-6 left-4 z-40 transition-all duration-300 ${
          isWeatherPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+16px)]'
        }`}>
          <button 
            onClick={() => setIsWeatherPanelOpen(!isWeatherPanelOpen)}
            className={`absolute right-[-32px] top-1/2 -translate-y-1/2 p-2 rounded-r-xl border-t border-b border-r transition-all cursor-pointer z-10 ${
              isLightTheme 
                ? 'bg-white border-slate-200 text-slate-700' 
                : 'bg-slate-950/90 border-slate-850 text-slate-300'
            }`}
          >
            {isWeatherPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className={`w-72 p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${themeClasses.panel}`}>
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Điều kiện môi trường
            </h4>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'normal', label: 'Bình thường', icon: <Sun className="w-3.5 h-3.5" /> },
                { id: 'hot', label: 'Quá nóng', icon: <Thermometer className="w-3.5 h-3.5 text-amber-500" /> },
                { id: 'rain', label: 'Mưa nhiều', icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> }
              ].map((w) => {
                const isActive = weather === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWeather(w.id)}
                    className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isActive 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' 
                        : isLightTheme
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-250 text-slate-700'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400'
                    }`}
                  >
                    {w.icon}
                    <span>{w.label}</span>
                  </button>
                );
              })}
            </div>

            {healthExplanation[plantHealth] && (
              <div className={`border p-2.5 rounded-xl text-[9px] leading-relaxed transition-all ${healthExplanation[plantHealth].class}`}>
                <span className="font-black block mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {healthExplanation[plantHealth].title}
                </span>
                <span>{healthExplanation[plantHealth].desc}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. GROWTH STAGES BOTTOM TIMELINE (Centered) */}
      {phase === 'growing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-35">
          <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-3 transition-colors ${themeClasses.panel}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5" />
                Giai đoạn phát triển
              </span>
              <span className="text-[9px] font-bold">Thời kỳ {growthStage}/4</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((s) => {
                const isActive = growthStage === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setGrowthStage(s);
                      setSelectedOrgan(null);
                      setIsSidebarOpen(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isActive ? themeClasses.btnActive : themeClasses.btnInactive
                    }`}
                  >
                    {s === 1 ? 'Mầm' : s === 2 ? 'Cây con' : s === 3 ? 'Trưởng thành' : 'Hoa & Quả'}
                  </button>
                );
              })}
            </div>

            <p className={`text-[10px] leading-relaxed p-2 rounded-xl text-center border border-white/5 ${
              isLightTheme ? 'bg-slate-50' : 'bg-slate-900/40'
            }`}>
              {PLANT_DATA[plantType]?.stages[growthStage]?.desc}
            </p>
          </div>
        </div>
      )}

      {/* SAFE BOTTOM RIGHT CORNER: COMPLETE STUDY BUTTON */}
      {phase !== 'intro' && phase !== 'complete' && (
        <div className="absolute bottom-6 right-6 z-40 pointer-events-auto">
          <button
            onClick={() => setPhase('complete')}
            className="bg-emerald-500 hover:bg-emerald-450 border border-emerald-400/30 px-5 py-3 rounded-2xl text-xs font-black uppercase text-white shadow-xl shadow-emerald-500/15 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          >
            Hoàn thành học tập
          </button>
        </div>
      )}

      {/* PLANT DEATH MODAL WARNING */}
      {deadAlert && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-slate-900 border-2 border-red-500/30 rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-white mb-2 uppercase tracking-wide">Cây đã chết!</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {deadAlert}
            </p>
            <button
              onClick={handleResetGame}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Bắt đầu trồng lại cây mới
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM GLASS CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className={`border rounded-[2.5rem] p-6 max-w-sm w-full text-center shadow-2xl transition-colors ${themeClasses.panel}`}>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ❓
            </div>
            <h3 className="text-sm font-black mb-2 uppercase tracking-wider">Xác nhận gieo trồng</h3>
            <p className={`text-xs leading-relaxed mb-6 ${themeClasses.textMuted}`}>
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Đồng ý
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. COMPLETE CARD */}
      {phase === 'complete' && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-[#0a120c]/90 to-emerald-950/90 flex items-center justify-center p-4 z-55 backdrop-blur-md">
          <div className="bg-[#0c130e]/95 border border-emerald-500/20 rounded-[2rem] p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-xl relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-emerald-500/25">🌻</div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Hoàn thành gieo trồng!</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Chúc mừng em đã hoàn thành toàn bộ bài học mô phỏng về chu kỳ sinh trưởng và giải phẫu sinh học thực vật 3D.
            </p>

            <button 
              onClick={() => onComplete && onComplete(10)} 
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-lime-600 hover:from-emerald-400 hover:to-lime-500 text-white font-black rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              Quay lại bảng điều khiển <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- SLIDING SIDEBAR CHÚ THÍCH CƠ QUAN BÊN PHẢI --- */}
      <div 
        className={`w-full md:w-96 border-l backdrop-blur-xl flex flex-col h-full absolute right-0 top-0 z-45 shadow-2xl transition-transform duration-500 ease-in-out ${
          isSidebarOpen && currentOrganData ? 'translate-x-0' : 'translate-x-full'
        } ${
          isLightTheme ? 'bg-white/95 border-slate-250 text-slate-850' : 'bg-slate-950/95 border-slate-850 text-white'
        }`}
      >
        {isSidebarOpen && currentOrganData && (
          <button 
            onClick={() => handleSelectOrgan(null)}
            className={`absolute left-[-40px] top-1/2 -translate-y-1/2 border-l border-t border-b p-2.5 rounded-l-xl transition-all md:flex hidden z-20 cursor-pointer ${
              isLightTheme ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-800' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div className={`p-5 border-b flex items-center justify-between ${isLightTheme ? 'border-slate-155' : 'border-slate-850'}`}>
          <div>
            <p className="text-[8px] text-emerald-500 uppercase tracking-widest font-black">Chi tiết giải phẫu học</p>
            <h3 className="text-sm font-bold mt-0.5">Khám Phá Cơ Quan</h3>
          </div>
          <button 
            onClick={() => handleSelectOrgan(null)}
            className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {currentOrganData && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div>
              <span className="text-[8px] uppercase tracking-widest font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                Bộ phận: {selectedOrgan}
              </span>
              <h2 className="text-xl font-black mt-2 leading-tight">{currentOrganData.name}</h2>
            </div>

            <div className={`border p-4 rounded-2xl space-y-3 ${
              isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-white/5'
            }`}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                Đặc điểm cấu tạo & Vai trò
              </h4>
              <p className={`text-xs leading-relaxed ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>
                {currentOrganData.desc}
              </p>
            </div>

            {selectedOrgan === 'stem' && (
              <div className="bg-emerald-550/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
                <h4 className="text-[9px] text-emerald-500 font-black uppercase tracking-wider">Cơ chế vận chuyển mạch dẫn</h4>
                <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                    <span>Mạch gỗ (Xylem): Vận chuyển nước và muối khoáng hướng đi lên.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                    <span>Mạch rây (Phloem): Vận chuyển chất hữu cơ dinh dưỡng đi xuống.</span>
                  </p>
                </div>
              </div>
            )}

            {selectedOrgan === 'leaf' && growthStage >= 3 && (
              <div className="bg-emerald-550/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
                <h4 className="text-[9px] text-emerald-500 font-black uppercase tracking-wider">Cơ chế thoát hơi nước ở lá</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 leading-relaxed">
                  Tế bào bảo vệ hình hạt đậu (khí khổng) co giãn khi hút nước, tạo ra khe hở đóng mở cho CO₂ đi vào quang hợp và thoát hơi nước ra ngoài.
                </p>
              </div>
            )}
          </div>
        )}

        <div className={`p-5 border-t ${isLightTheme ? 'border-slate-155' : 'border-slate-850'}`}>
          <button 
            onClick={() => handleSelectOrgan(null)}
            className="w-full py-3 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            Quay lại xem toàn cảnh
          </button>
        </div>
      </div>
    </div>
  );
}
