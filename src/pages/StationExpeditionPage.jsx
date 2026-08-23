import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Star, Lock, Sparkles, Trophy, Coins, Zap,
  CheckCircle2, Compass, Ship, Anchor, ChevronRight,
  Gift, RefreshCw, Layers, Hourglass, Microscope, Sprout,
  Dna, HeartPulse, Leaf, Atom, TreePine, FlaskConical, Lightbulb, FileText, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// 🎨 SVG GRAPHIC RƯƠNG BÁU 3D ĐÓNG NẮP CHÂN THỰC
const ClosedTreasureChestSVG = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]">
    <rect x="8" y="24" width="48" height="32" rx="4" fill="url(#chestBodyGrad)" stroke="#78350F" strokeWidth="2" />
    <path d="M 6 24 C 6 14, 58 14, 58 24 Z" fill="url(#chestLidGrad)" stroke="#78350F" strokeWidth="2" />
    <rect x="16" y="15" width="6" height="41" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <rect x="42" y="15" width="6" height="41" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <rect x="27" y="26" width="10" height="12" rx="2" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
    <circle cx="32" cy="30" r="2" fill="#78350F" />
    <path d="M 32 32 L 32 35" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="chestBodyGrad" x1="8" y1="24" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#B45309" />
        <stop offset="0.5" stopColor="#78350F" />
        <stop offset="1" stopColor="#451A03" />
      </linearGradient>
      <linearGradient id="chestLidGrad" x1="6" y1="14" x2="58" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D97706" />
        <stop offset="1" stopColor="#78350F" />
      </linearGradient>
    </defs>
  </svg>
);

// 🎨 SVG GRAPHIC RƯƠNG BÁU 3D MỞ NẮP CHÂN THỰC
const OpenedTreasureChestSVG = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_6px_12px_rgba(16,185,129,0.7)]">
    <rect x="8" y="30" width="48" height="26" rx="4" fill="url(#opBodyGrad)" stroke="#78350F" strokeWidth="2" />
    <ellipse cx="32" cy="30" rx="22" ry="6" fill="#F59E0B" />
    <circle cx="24" cy="28" r="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    <circle cx="32" cy="27" r="4.5" fill="#FEF08A" stroke="#D97706" strokeWidth="1" />
    <circle cx="40" cy="28" r="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    <circle cx="28" cy="25" r="3.5" fill="#F32424" stroke="#991B1B" strokeWidth="1" />
    <circle cx="36" cy="24" r="3.5" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1" />
    <path d="M 6 30 C 6 12, 58 12, 58 24 L 56 12 C 56 6, 8 6, 8 12 Z" fill="url(#opLidGrad)" stroke="#78350F" strokeWidth="2" />
    <rect x="16" y="30" width="5" height="26" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <rect x="43" y="30" width="5" height="26" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <defs>
      <linearGradient id="opBodyGrad" x1="8" y1="30" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#92400E" />
        <stop offset="1" stopColor="#451A03" />
      </linearGradient>
      <linearGradient id="opLidGrad" x1="6" y1="6" x2="58" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#B45309" />
        <stop offset="1" stopColor="#78350F" />
      </linearGradient>
    </defs>
  </svg>
);

// ⚡ EPIC CÁNH CỔNG DỊCH CHUYỂN NĂNG LƯỢNG XANH 3D (PURE PLASMA RING)
const TeleportPortalSVG = ({ onClick }) => (
  <div onClick={onClick} className="epic-plasma-portal cursor-pointer group">
    <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md shadow-[inset_0_0_20px_#38bdf8]" />
  </div>
);

// 🏝️ DANH MỤC TRẠM SINH HỌC
const GRADE_STATIONS = {
  6: [
    { id: 'g6_st1', name: 'Trạm 1: Kính Hiển Vi & Đơn Vị Tế Bào', subtitle: 'Mở đầu KHTN, an toàn phòng thực hành & cấu trúc tế bào', daysCount: 10, startDay: 1, IconComp: Microscope },
    { id: 'g6_st2', name: 'Trạm 2: Tế Bào & Tổ Chức Cơ Thể', subtitle: 'Từ tế bào đến cơ thể, mô & các hệ cơ quan', daysCount: 10, startDay: 11, IconComp: Sprout },
    { id: 'g6_st3', name: 'Trạm 3: Đa Dạng Sinh Học & Vương Quốc', subtitle: 'Phân loại thế giới sống, Virus, Vi khuẩn, Thực vật & Động vật', daysCount: 10, startDay: 21, IconComp: TreePine },
    { id: 'g6_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  7: [
    { id: 'g7_st1', name: 'Trạm 1: Quang Hợp & Trao Đổi Chất', subtitle: 'Trao đổi chất & chuyển hóa năng lượng ở cây xanh', daysCount: 10, startDay: 1, IconComp: Leaf },
    { id: 'g7_st2', name: 'Trạm 2: Hô Hấp Tế Bào & Chuyển Hóa', subtitle: 'Hô hấp tế bào, phân giải ATP & trao đổi khí', daysCount: 10, startDay: 11, IconComp: Atom },
    { id: 'g7_st3', name: 'Trạm 3: Cảm Ứng & Tập Tính Sinh Vật', subtitle: 'Cảm ứng ở thực vật & tập tính sống động vật', daysCount: 10, startDay: 21, IconComp: HeartPulse },
    { id: 'g7_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  8: [
    { id: 'g8_st1', name: 'Trạm 1: Mã Gen ADN & Phân Tử', subtitle: 'Phân tử DNA, RNA, gen & tái bản di truyền', daysCount: 10, startDay: 1, IconComp: Dna },
    { id: 'g8_st2', name: 'Trạm 2: Nhiễm Sắc Thể & Phân Bào', subtitle: 'Cấu trúc nhiễm sắc thể, nguyên phân & giảm phân', daysCount: 10, startDay: 11, IconComp: Microscope },
    { id: 'g8_st3', name: 'Trạm 3: Giải Phẫu & Cơ Thể Người', subtitle: 'Hệ vận động, tuần hoàn, hô hấp & tiêu hóa', daysCount: 10, startDay: 21, IconComp: HeartPulse },
    { id: 'g8_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  9: [
    { id: 'g9_st1', name: 'Trạm 1: Bằng Chứng Tiến Hóa', subtitle: 'Hóa thạch, cơ quan thoái hóa & học thuyết Darwin', daysCount: 10, startDay: 1, IconComp: TreePine },
    { id: 'g9_st2', name: 'Trạm 2: Hệ Sinh Thái & Chuỗi Thức Ăn', subtitle: 'Quần thể, quần xã, chuỗi thức ăn & lưới thức ăn', daysCount: 10, startDay: 11, IconComp: Leaf },
    { id: 'g9_st3', name: 'Trạm 3: Sinh Thái Học & Bảo Tồn', subtitle: 'Môi trường sống, ô nhiễm & bảo tồn đa dạng', daysCount: 10, startDay: 21, IconComp: Sprout },
    { id: 'g9_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  10: [
    { id: 'g10_st1', name: 'Trạm 1: Hóa Học Tế Bào & Nước', subtitle: 'Phân tử sinh học, nước & các nguyên tố', daysCount: 10, startDay: 1, IconComp: FlaskConical },
    { id: 'g10_st2', name: 'Trạm 2: Trao Đổi Chất Màng Tế Bào', subtitle: 'Vận chuyển qua màng, co nguyên sinh & truyền tin', daysCount: 10, startDay: 11, IconComp: Atom },
    { id: 'g10_st3', name: 'Trạm 3: Chu Kỳ Tế Bào & Phân Bào', subtitle: 'Chuyển hóa năng lượng, nguyên phân & giảm phân', daysCount: 10, startDay: 21, IconComp: Dna },
    { id: 'g10_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  11: [
    { id: 'g11_st1', name: 'Trạm 1: Quang Hợp & Dinh Dưỡng Thực Vật', subtitle: 'Hấp thụ nước, khoáng, quang hợp & hô hấp cây', daysCount: 10, startDay: 1, IconComp: Leaf },
    { id: 'g11_st2', name: 'Trạm 2: Hô Hấp & Tuần Hoàn Động Vật', subtitle: 'Dinh dưỡng, hô hấp & hệ tuần hoàn động vật', daysCount: 10, startDay: 11, IconComp: HeartPulse },
    { id: 'g11_st3', name: 'Trạm 3: Cảm Ứng & Sinh Trưởng Sinh Vật', subtitle: 'Cảm ứng, tập tính & sinh trưởng động thực vật', daysCount: 10, startDay: 21, IconComp: Sprout },
    { id: 'g11_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ],
  12: [
    { id: 'g12_st1', name: 'Trạm 1: Di Truyền Phân Tử & Tái Bản ADN', subtitle: 'Cơ chế di truyền phân tử, phiên mã & dịch mã', daysCount: 10, startDay: 1, IconComp: Dna },
    { id: 'g12_st2', name: 'Trạm 2: Quy Luật Mendel & NST', subtitle: 'Di truyền nhiễm sắc thể, Mendel & hoán vị gen', daysCount: 10, startDay: 11, IconComp: Microscope },
    { id: 'g12_st3', name: 'Trạm 3: Di Truyền Quần Thể & Đột Biến', subtitle: 'Cấu trúc gen quần thể & các dạng đột biến', daysCount: 10, startDay: 21, IconComp: Atom },
    { id: 'g12_future', isFuture: true, name: 'Trạm Khai Phá - Sắp Ra Mắt', subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...', daysCount: 10, startDay: 31, IconComp: Hourglass }
  ]
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;

const NODE_COORDS_10 = [
  { x: 200, y: 90 },
  { x: 600, y: 180 },
  { x: 180, y: 270 },
  { x: 620, y: 360 },
  { x: 180, y: 450 },
  { x: 620, y: 540 },
  { x: 180, y: 630 },
  { x: 620, y: 720 },
  { x: 200, y: 810 },
  { x: 600, y: 900 },
];

const GRAND_CHEST_COORD = { x: 400, y: 990 };
const TELEPORT_PORTAL_COORD = { x: 400, y: 1090 };

const SMALL_CHEST_COORDS_10 = [
  { x: 400, y: 135 },
  { x: 390, y: 225 },
  { x: 400, y: 315 },
  { x: 400, y: 405 },
  { x: 400, y: 495 },
  { x: 400, y: 585 },
  { x: 400, y: 675 },
  { x: 410, y: 765 },
  { x: 400, y: 855 },
];

const getDefaultFallbackGames = (grade, dayDisplayNum) => [
  {
    type: 'quiz',
    title: 'Phần 1: Trắc Nghiệm Tri Thức',
    question: `[Lớp ${grade} - Ngày ${dayDisplayNum}] Đơn vị cấu tạo nên mọi cơ thể sinh vật là gì?`,
    options: ['Tế bào', 'Mô', 'Cơ quan', 'Hệ cơ quan'],
    answerIndex: 0,
    hint: 'Đây là đơn vị nhỏ nhất thực hiện các chức năng sống cơ bản.',
    explanation: 'Đáp án đúng là Tế bào. Mọi cơ thể từ vi khuẩn đến con người đều được cấu tạo từ tế bào.'
  },
  {
    type: 'match',
    title: 'Phần 2: Nối Từ Khái Niệm Sinh Học',
    instruction: 'Hãy chọn 1 ô bên trái và nối với khái niệm đúng bên phải:',
    pairs: [
      { left: 'Nhân Tế Bào', right: 'Chứa ADN di truyền' },
      { left: 'Màng Tế Bào', right: 'Bảo vệ & kiểm soát các chất' },
      { left: 'Tế Bào Chất', right: 'Nơi diễn ra các hoạt động sống' }
    ],
    hint: 'Nhân tế bào là trung tâm điều khiển chứa ADN.',
    explanation: 'Nhân điều khiển di truyền, màng bao bọc kiểm soát chất, tế bào chất là môi trường phản ứng.'
  },
  {
    type: 'fill',
    title: 'Phần 3: Điền Từ Còn Thiếu',
    instruction: 'Gõ từ thích hợp vào ô trống bên dưới:',
    sentence: 'Kính hiển vi quang học giúp chúng ta quan sát các [blank] mà mắt thường không thấy.',
    correctAnswer: 'tế bào',
    hint: 'Từ có 2 tiếng bắt đầu bằng chữ T.',
    explanation: 'Đáp án đúng: "tế bào". Kính hiển vi dùng phóng đại hình ảnh tế bào.'
  },
  {
    type: 'category',
    title: 'Phần 4: Phân Loại Nhóm Sinh Vật',
    instruction: 'Bấm chọn từ kho bên dưới rồi xếp vào một trong hai bảng nhóm:',
    categories: ['Sinh Vật Nhân Sơ', 'Sinh Vật Nhân Thực'],
    items: [
      { name: 'Vi khuẩn E.coli', catIndex: 0 },
      { name: 'Cây lúa nước', catIndex: 1 },
      { name: 'Con mèo house cat', catIndex: 1 }
    ],
    hint: 'Vi khuẩn chưa có màng nhân chính thức (nhân sơ).',
    explanation: 'Vi khuẩn E.coli thuộc nhóm Nhân Sơ. Thực vật & Động vật thuộc nhóm Nhân Thực.'
  },
  {
    type: 'dragdrop',
    title: 'Phần 5: Hoàn Thành Câu Sinh Học',
    instruction: 'Chọn từ chính xác từ kho từ để hoàn thành câu hoàn chỉnh:',
    textWithBlanks: 'Quang hợp ở cây xanh tạo ra khí [blank] cung cấp cho sự sống.',
    bankWords: ['Oxy', 'Cacbonic', 'Nito'],
    correctWord: 'Oxy',
    hint: 'Khí mà con người hít thở hàng ngày.',
    explanation: 'Đáp án đúng là Oxy. Cây xanh nhả khí Oxy trong quá trình quang hợp.'
  }
];

// Helper Đảo Vị Trí Ngẫu Nhiên (Fisher-Yates Shuffle)
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function StationExpeditionPage() {
  const navigate = useNavigate();
  const { user, userStats, refreshUserStats } = useAuth();
  const { showToast } = useToast();

  const [selectedGrade, setSelectedGrade] = useState(6);
  const [viewMode, setViewMode] = useState('world');
  const [selectedStation, setSelectedStation] = useState(null);

  const [demoMode, setDemoMode] = useState(false);
  const [mascotType, setMascotType] = useState('turtle');

  const [stationProgress, setStationProgress] = useState({});

  // 🎮 STATES CHO MÁY CHƠI 5 DẠNG MINI-GAME VỚI LOGIC 2 LẦN THỬ
  const [activeDayQuiz, setActiveDayQuiz] = useState(null);
  const [currentGames, setCurrentGames] = useState([]);
  const [gameStep, setGameStep] = useState(0);

  // General Attempt States
  const [attemptCount, setAttemptCount] = useState(0); // 0: chưa nộp, 1: nộp lần 1, 2: nộp lần 2/hoàn thành
  const [attempt1Wrong, setAttempt1Wrong] = useState(false);
  const [attempt2Finished, setAttempt2Finished] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Specific Game States - GAME 1 QUIZ (ĐẢO ĐÁP ÁN NGẪU NHIÊN)
  const [shuffledQuizOptions, setShuffledQuizOptions] = useState([]);
  const [selectedQuizOptText, setSelectedQuizOptText] = useState(null);

  // Game 2: Matching (ĐẢO ĐÁP ÁN CỘT PHẢI NGẪU NHIÊN & HIỆU ỨNG RUNG ĐỎ 600MS)
  const [shuffledMatchRight, setShuffledMatchRight] = useState([]);
  const [selectedLeftMatch, setSelectedLeftMatch] = useState(null);
  const [wrongMatchPair, setWrongMatchPair] = useState(null); // { leftIdx, rightText }
  const [matchedPairs, setMatchedPairs] = useState([]); // [{ leftText, rightText, isCorrect }]

  // Game 3: Fill
  const [fillInputText, setFillInputText] = useState('');

  // Game 4: Category (KHO TỪ BÊN DƯỚI, TIMING THÔNG BÁO ĐỎ TRƯỚC KHI ĐẨY NỐI TỪ)
  const [unassignedItems, setUnassignedItems] = useState([]);
  const [categoryBoards, setCategoryBoards] = useState([[], []]); // [board0Items, board1Items]
  const [categoryItemStatus, setCategoryItemStatus] = useState({}); // { itemName: 'correct' | 'wrong' | 'normal' }
  const [selectedUnassignedItem, setSelectedUnassignedItem] = useState(null);

  // Game 5: Drag & Drop Sentence (ĐẢO KHO TỪ NGẪU NHIÊN)
  const [shuffledBankWords, setShuffledBankWords] = useState([]);
  const [dragWordChoice, setDragWordChoice] = useState(null);

  // Game Scores Array [g1, g2, g3, g4, g5]
  const [gameScores, setGameScores] = useState([0, 0, 0, 0, 0]);

  const [justCompletedDayNode, setJustCompletedDayNode] = useState(null);
  const [mascotPos, setMascotPos] = useState({ x: NODE_COORDS_10[0].x, y: NODE_COORDS_10[0].y });
  const [openedChests, setOpenedChests] = useState([]);
  const [showLootModal, setShowLootModal] = useState(null);

  const [isZoomingPortal, setIsZoomingPortal] = useState(false);
  const [animatingBoatStationIndex, setAnimatingBoatStationIndex] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id) return;
      try {
        const { data: stData, error: stErr } = await supabase
          .from('station_progress')
          .select('*')
          .eq('user_id', user.id);

        if (!stErr && stData && stData.length > 0) {
          const mapProg = {};
          stData.forEach(row => {
            const key = `${row.station_id}_${row.day_index}`;
            mapProg[key] = { stars: row.stars, claimedStars: row.claimed_stars };
          });
          setStationProgress(mapProg);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('station_progress')
          .eq('id', user.id)
          .single();

        if (!error && data?.station_progress) {
          setStationProgress(data.station_progress.days || {});
        }
      } catch (err) {
        console.error("Lỗi tải tiến trình station_progress:", err);
      }
    };
    fetchProgress();
  }, [user?.id]);

  const stationsForGrade = GRADE_STATIONS[selectedGrade] || GRADE_STATIONS[6];

  const getIslandStats = (stationId, totalDays) => {
    let completedDays = 0;
    let totalStars = 0;
    for (let d = 1; d <= totalDays; d++) {
      const key = `${stationId}_${d}`;
      const prog = stationProgress[key];
      if (prog && prog.stars > 0) {
        completedDays++;
        totalStars += prog.stars;
      }
    }
    return { completedDays, totalStars, maxStars: totalDays * 3 };
  };

  const getHighestActiveStationIndex = () => {
    let highestIdx = 0;
    for (let i = 0; i < stationsForGrade.length; i++) {
      const st = stationsForGrade[i];
      if (st.isFuture) break;
      const stats = getIslandStats(st.id, st.daysCount);
      if (stats.completedDays > 0 || (i > 0 && getIslandStats(stationsForGrade[i - 1].id, stationsForGrade[i - 1].daysCount).completedDays >= stationsForGrade[i - 1].daysCount)) {
        highestIdx = i;
      }
    }
    return highestIdx;
  };

  const currentActiveBoatIndex = animatingBoatStationIndex !== null ? animatingBoatStationIndex : getHighestActiveStationIndex();

  const isIslandUnlocked = (stationIndex) => {
    if (stationIndex === 0 || demoMode) return true;
    const st = stationsForGrade[stationIndex];
    if (st.isFuture) return false;

    const prevStation = stationsForGrade[stationIndex - 1];
    if (!prevStation || prevStation.isFuture) return false;

    const prevStats = getIslandStats(prevStation.id, prevStation.daysCount);
    return prevStats.completedDays >= prevStation.daysCount;
  };

  const handleOpenIslandDetail = (st, index) => {
    if (st.isFuture) {
      showToast(`⏳ Trạm Khai Phá - Sắp Ra Mắt! Hãy đón chờ các cập nhật Sinh học tiếp theo!`, 'info');
      return;
    }
    if (!isIslandUnlocked(index)) {
      showToast(`Trạm này đang bị khóa. Hãy hoàn thành Trạm trước đó để sang Trạm mới!`, 'info');
      return;
    }

    let currentPosDay = 1;
    let opened = [];
    for (let d = 1; d <= st.daysCount; d++) {
      const key = `${st.id}_${d}`;
      if (stationProgress[key]?.stars > 0) {
        currentPosDay = Math.min(st.daysCount + 1, d + 1);
        if (d <= st.daysCount) opened.push(d - 1);
      }
    }

    if (currentPosDay > st.daysCount) {
      setMascotPos(GRAND_CHEST_COORD);
      opened.push(st.daysCount - 1);
    } else {
      setMascotPos(NODE_COORDS_10[currentPosDay - 1]);
    }

    setOpenedChests(opened);
    setSelectedStation(st);
    setViewMode('detail');
  };

  // 🎯 NẠP CÂU HỎI TRẠM (KHỐNG CHẾ TỐI ĐA 5 GAME VÀ ĐẢO ĐÁP ÁN NGẪU NHIÊN CHO HỌC SINH)
  const handleStartDayQuiz = async (dayIndex) => {
    const key = `${selectedStation.id}_${dayIndex}`;
    const unlocked = dayIndex === 1 || demoMode || (stationProgress[`${selectedStation.id}_${dayIndex - 1}`]?.stars > 0) || stationProgress[key];

    if (!unlocked) {
      showToast(`Ải Ngày ${selectedStation.startDay + dayIndex - 1} đang bị khóa. Hãy hoàn thành Ngày trước đó!`, 'info');
      return;
    }

    let games = [];
    try {
      const { data, error } = await supabase
        .from('station_questions')
        .select('*')
        .eq('grade', selectedGrade)
        .eq('station_id', selectedStation.id)
        .eq('day_index', dayIndex)
        .order('game_index', { ascending: true });

      if (!error && data && data.length > 0) {
        games = data.map(item => {
          const content = item.content || {};
          return {
            type: item.game_type,
            title: item.title || content.title || '',
            question: content.question || content.text || '',
            options: content.options || [],
            answerIndex: content.answerIndex ?? content.answer ?? 0,
            pairs: content.pairs || [],
            sentence: content.sentence || '',
            correctAnswer: content.correctAnswer || '',
            categories: content.categories || ['Nhóm 1', 'Nhóm 2'],
            items: content.items || [],
            textWithBlanks: content.textWithBlanks || content.sentence || '',
            bankWords: content.bankWords || [],
            correctWord: content.correctWord || '',
            hint: content.hint || '',
            explanation: content.explanation || ''
          };
        });
      }
    } catch (err) {
      console.error("Lỗi fetch questions:", err);
    }

    if (!games || games.length === 0) {
      games = getDefaultFallbackGames(selectedGrade, selectedStation.startDay + dayIndex - 1);
    }

    // ĐẢM BẢO TỐI ĐA CHỈ LẤY 5 GAME CHO HỌC SINH
    games = games.slice(0, 5);

    setCurrentGames(games);
    setActiveDayQuiz({ stationId: selectedStation.id, dayIndex, dayDisplayNum: selectedStation.startDay + dayIndex - 1 });

    // Reset Game Engine State
    setGameStep(0);
    resetCurrentStepState(games[0]);
    setGameScores([0, 0, 0, 0, 0]);
  };

  const resetCurrentStepState = (gameObj) => {
    setAttemptCount(0);
    setAttempt1Wrong(false);
    setAttempt2Finished(false);
    setShowHintModal(false);

    setSelectedQuizOptText(null);
    setSelectedLeftMatch(null);
    setWrongMatchPair(null);
    setMatchedPairs([]);
    setFillInputText('');
    setDragWordChoice(null);

    if (!gameObj) return;

    // 🎯 ĐẢO ĐÁP ÁN QUIZ NGẪU NHIÊN CHO HỌC SINH
    if (gameObj.type === 'quiz' && gameObj.options) {
      setShuffledQuizOptions(shuffleArray(gameObj.options));
    }

    // 🎯 ĐẢO VỊ TRÍ NỐI TỪ CỘT PHẢI NGẪU NHIÊN CHO HỌC SINH
    if (gameObj.type === 'match' && gameObj.pairs) {
      const rightList = gameObj.pairs.map(p => p.right);
      setShuffledMatchRight(shuffleArray(rightList));
    }

    // 🎯 GAME 4 CATEGORY: TẤT CẢ TỪ NẰM Ở KHO BÊN DƯỚI (ĐẢO TỪ NGẪU NHIÊN)
    if (gameObj.type === 'category' && gameObj.items) {
      setUnassignedItems(shuffleArray(gameObj.items));
      setCategoryBoards([[], []]);
      setCategoryItemStatus({});
      setSelectedUnassignedItem(null);
    }

    // 🎯 GAME 5 DRAGDROP: ĐẢO KHO TỪ NGẪU NHIÊN CHO HỌC SINH
    if (gameObj.type === 'dragdrop' && gameObj.bankWords) {
      setShuffledBankWords(shuffleArray(gameObj.bankWords));
    }
  };

  // 🎯 XỬ LÝ NỘP CÂU TRẢ LỜI CHO CÁC GAME (VỚI LOGIC 2 LẦN THỬ CHUẨN XÁC)
  const handleSubmitCurrentGame = () => {
    const currentGame = currentGames[gameStep];

    // GAME 1: QUIZ TRẮC NGHIỆM
    if (currentGame.type === 'quiz') {
      const correctIdx = currentGame.answerIndex ?? currentGame.answer;
      const correctText = currentGame.options[correctIdx];
      const isCorrect = selectedQuizOptText === correctText;

      if (attemptCount === 0) {
        if (isCorrect) {
          setAttempt2Finished(true);
          setGameScores(prev => { const n = [...prev]; n[gameStep] = 1; return n; });
        } else {
          setAttemptCount(1);
          setAttempt1Wrong(true);
          setShowHintModal(true); // Mở gợi ý cho làm lần 2, TUYỆT ĐỐI CHƯA BẢO ĐÁP ÁN ĐÚNG!
        }
      } else if (attemptCount === 1) {
        setAttemptCount(2);
        setAttempt2Finished(true);
        setGameScores(prev => { const n = [...prev]; n[gameStep] = isCorrect ? 1 : 0; return n; });
      }
    }

    // GAME 2: WORD MATCHING (NỐI TỪ)
    else if (currentGame.type === 'match') {
      const allPairsCorrect = matchedPairs.every(p => p.isCorrect);
      setAttempt2Finished(true);
      setGameScores(prev => { const n = [...prev]; n[gameStep] = allPairsCorrect ? 1 : 0; return n; });
    }

    // GAME 3: FILL-IN-THE-BLANK (ĐIỀN TỪ)
    else if (currentGame.type === 'fill') {
      const isCorrect = fillInputText.trim().toLowerCase() === currentGame.correctAnswer.trim().toLowerCase();

      if (attemptCount === 0) {
        if (isCorrect) {
          setAttempt2Finished(true);
          setGameScores(prev => { const n = [...prev]; n[gameStep] = 1; return n; });
        } else {
          setAttemptCount(1);
          setAttempt1Wrong(true);
          setShowHintModal(true); // Mở gợi ý cho làm lần 2, CHƯA BẢO ĐÁP ÁN ĐÚNG!
        }
      } else if (attemptCount === 1) {
        setAttemptCount(2);
        setAttempt2Finished(true);
        setGameScores(prev => { const n = [...prev]; n[gameStep] = isCorrect ? 1 : 0; return n; });
      }
    }

    // GAME 4: CATEGORY (PHÂN LOẠI NHÓM - HIỆN VIỀN ĐỎ & THÔNG BÁO ĐỎ ĐỦ LÂU TRƯỚC KHI ĐẨY TỪ RA KHO)
    else if (currentGame.type === 'category') {
      let hasWrong = false;
      let wrongItemsToEject = [];
      let newStatuses = { ...categoryItemStatus };

      const board0 = [...categoryBoards[0]];
      const board1 = [...categoryBoards[1]];

      board0.forEach(item => {
        if (item.catIndex !== 0) {
          hasWrong = true;
          wrongItemsToEject.push(item);
          newStatuses[item.name] = 'wrong';
        } else {
          newStatuses[item.name] = 'correct';
        }
      });

      board1.forEach(item => {
        if (item.catIndex !== 1) {
          hasWrong = true;
          wrongItemsToEject.push(item);
          newStatuses[item.name] = 'wrong';
        } else {
          newStatuses[item.name] = 'correct';
        }
      });

      setCategoryItemStatus(newStatuses);

      if (attemptCount === 0) {
        if (!hasWrong) {
          setAttempt2Finished(true);
          setGameScores(prev => { const n = [...prev]; n[gameStep] = 1; return n; });
        } else {
          setAttemptCount(1);
          setAttempt1Wrong(true);
          setShowHintModal(true);

          // ⚠️ THÔNG BÁO ĐỎ NỔI BẬT ĐỦ LÂU CHO HỌC SINH ĐỌC
          showToast('🚫 CẢNH BÁO: Có từ chưa đúng nhóm! Từ sai đang hiện viền đỏ, hãy xem gợi ý để chọn lại!', 'error');

          // GIỮ VIỀN ĐỎ TRÊN BẢNG 1.2s ĐỂ HỌC SINH QUAN SÁT RỒI MỚI ĐẨY XUỐNG KHO
          setTimeout(() => {
            const cleanBoard0 = board0.filter(item => item.catIndex === 0);
            const cleanBoard1 = board1.filter(item => item.catIndex === 1);
            setCategoryBoards([cleanBoard0, cleanBoard1]);
            setUnassignedItems(prev => [...prev, ...wrongItemsToEject]);

            // Trả trạng thái từ bị đẩy về bình thường (không bị đỏ trong kho nữa)
            setCategoryItemStatus(prev => {
              const resetObj = { ...prev };
              wrongItemsToEject.forEach(it => { delete resetObj[it.name]; });
              return resetObj;
            });
          }, 1200);
        }
      } else if (attemptCount === 1) {
        setAttemptCount(2);
        setAttempt2Finished(true);
        setGameScores(prev => { const n = [...prev]; n[gameStep] = !hasWrong ? 1 : 0; return n; });
      }
    }

    // GAME 5: DRAGDROP SENTENCE (HOÀN THÀNH CÂU)
    else if (currentGame.type === 'dragdrop') {
      const isCorrect = dragWordChoice === currentGame.correctWord;

      if (attemptCount === 0) {
        if (isCorrect) {
          setAttempt2Finished(true);
          setGameScores(prev => { const n = [...prev]; n[gameStep] = 1; return n; });
        } else {
          setAttemptCount(1);
          setAttempt1Wrong(true);
          setShowHintModal(true);
        }
      } else if (attemptCount === 1) {
        setAttemptCount(2);
        setAttempt2Finished(true);
        setGameScores(prev => { const n = [...prev]; n[gameStep] = isCorrect ? 1 : 0; return n; });
      }
    }
  };

  const handleNextGameStep = () => {
    if (gameStep + 1 < currentGames.length) {
      const nextStep = gameStep + 1;
      setGameStep(nextStep);
      resetCurrentStepState(currentGames[nextStep]);
    } else {
      finishAllDayGames();
    }
  };

  // 🏆 CÔNG THỨC TÍNH SAO CHUẨN XÁC THEO MONG MUỐN:
  // 3/5 đúng -> 1 Sao ⭐
  // 4/5 đúng -> 2 Sao ⭐⭐
  // 5/5 đúng -> 3 Sao ⭐⭐⭐
  // < 3 đúng -> 0 Sao
  const finishAllDayGames = async () => {
    const completedDayIndex = activeDayQuiz.dayIndex;
    const dayDisplayNum = activeDayQuiz.dayDisplayNum;

    const totalCorrectSteps = gameScores.reduce((a, b) => a + b, 0);

    let earnedStars = 0;
    if (totalCorrectSteps === 5) earnedStars = 3;
    else if (totalCorrectSteps === 4) earnedStars = 2;
    else if (totalCorrectSteps === 3) earnedStars = 1;
    else earnedStars = 0;

    const key = `${activeDayQuiz.stationId}_${completedDayIndex}`;
    const oldProg = stationProgress[key] || { stars: 0, claimedStars: 0 };
    const newMaxStars = Math.max(oldProg.stars || 0, earnedStars);

    const isGrandChestDay = completedDayIndex === selectedStation.daysCount;

    const getRewardForStars = (sCount) => {
      if (sCount === 1) return { coins: 75, xp: 75 };
      if (sCount === 2) return { coins: 150, xp: 150 };
      if (sCount === 3) return { coins: 225, xp: 225 };
      return { coins: 0, xp: 0 };
    };

    const newTotalRewards = getRewardForStars(newMaxStars);
    const claimedRewards = getRewardForStars(oldProg.claimedStars || 0);

    const incCoins = Math.max(0, newTotalRewards.coins - claimedRewards.coins);
    const incXp = Math.max(0, newTotalRewards.xp - claimedRewards.xp);

    const updatedProgress = {
      ...stationProgress,
      [key]: { stars: newMaxStars, claimedStars: newMaxStars }
    };
    setStationProgress(updatedProgress);

    if (user?.id) {
      try {
        await supabase
          .from('station_progress')
          .upsert({
            user_id: user.id,
            station_id: activeDayQuiz.stationId,
            day_index: completedDayIndex,
            stars: newMaxStars,
            claimed_stars: newMaxStars,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,station_id,day_index' });

        await supabase.from('profiles').update({ station_progress: { days: updatedProgress } }).eq('id', user.id);

        if (incCoins > 0 || incXp > 0) {
          const currentCoins = userStats?.coins || 0;
          const currentXp = userStats?.xp || 0;
          await supabase.from('profiles').update({ coins: currentCoins + incCoins, xp: currentXp + incXp }).eq('id', user.id);
          refreshUserStats();
        }
      } catch (err) {
        console.error("Lỗi upsert station_progress Supabase:", err);
      }
    }

    setActiveDayQuiz(null);

    if (earnedStars > 0) {
      setJustCompletedDayNode(completedDayIndex);

      setTimeout(() => {
        setJustCompletedDayNode(null);

        let targetChestCoord = isGrandChestDay ? GRAND_CHEST_COORD : SMALL_CHEST_COORDS_10[completedDayIndex - 1];
        setMascotPos(targetChestCoord);

        setTimeout(() => {
          setOpenedChests(prev => [...prev, completedDayIndex - 1]);

          if (incCoins > 0 || incXp > 0) {
            setShowLootModal({
              dayIndex: dayDisplayNum,
              earnedStars,
              isGrand: isGrandChestDay,
              rewards: { coins: incCoins, xp: incXp }
            });
          }

          if (!isGrandChestDay) {
            setTimeout(() => {
              setMascotPos(NODE_COORDS_10[completedDayIndex]);
            }, 1500);
          }

        }, 1200);
      }, 1000);
    }
  };

  const handleTriggerTeleportPortal = () => {
    setIsZoomingPortal(true);

    setTimeout(() => {
      setIsZoomingPortal(false);
      setViewMode('world');

      const currentIdx = stationsForGrade.findIndex(s => s.id === selectedStation.id);
      if (currentIdx !== -1 && currentIdx + 1 < stationsForGrade.length) {
        const nextStation = stationsForGrade[currentIdx + 1];
        if (!nextStation.isFuture) {
          setAnimatingBoatStationIndex(currentIdx + 1);

          setTimeout(() => {
            setAnimatingBoatStationIndex(null);
            handleOpenIslandDetail(nextStation, currentIdx + 1);
          }, 1500);
        }
      }
    }, 1200);
  };

  const renderMascotAvatar = () => {
    if (mascotType === 'cell') return '🦠';
    if (mascotType === 'dino') return '🦖';
    return '🐢';
  };

  const totalStationCards = stationsForGrade.length;
  const seaPathWidth = 180 + (totalStationCards - 1) * 320;
  const currentGame = currentGames[gameStep] || {};

  // KIỂM TRA ĐIỀU KIỆN KHÓA NÚT "TRẢ LỜI" THEO DẠNG GAME (GAME NỐI TỪ BẮT BUỘC NỐI ĐỦ MỚI MỞ NÚT)
  const isSubmitDisabled = () => {
    if (attempt2Finished) return false;
    if (currentGame.type === 'quiz') return selectedQuizOptText === null;
    if (currentGame.type === 'match') return matchedPairs.length < (currentGame.pairs?.length || 0);
    if (currentGame.type === 'fill') return !fillInputText.trim();
    if (currentGame.type === 'category') return unassignedItems.length > 0;
    if (currentGame.type === 'dragdrop') return !dragWordChoice;
    return false;
  };

  return (
    <div className={`bg-transparent min-h-screen relative overflow-x-visible text-slate-100 pb-20 ${isZoomingPortal ? 'teleport-zoom-portal' : ''}`}>

      {/* 🚢 HEADER BAR */}
      <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10" style={{ overflow: 'visible' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (viewMode === 'detail') setViewMode('world');
                else navigate('/home');
              }}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="page-title-text text-base md:text-lg font-black flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                <span>Thế Giới Trạm Sinh Học</span>
              </h1>
              <p className="page-subtitle-text text-xs text-cyan-300 font-medium">Khám phá Trạm Sinh Học</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDemoMode(prev => !prev);
                showToast(demoMode ? 'Tắt Chế độ Thử nghiệm' : '⚡ Bật Chế độ Thử nghiệm', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${demoMode ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Demo Test</span>
            </button>

            <div className="header-coins-badge flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-black text-xs">{userStats?.coins || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 🧭 VIEW 1: WORLD MAP */}
      {viewMode === 'world' && (
        <main className="max-w-7xl mx-auto px-4 py-6" style={{ overflow: 'visible' }}>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
            {[6, 7, 8, 9, 10, 11, 12].map(gradeNum => (
              <button
                key={gradeNum}
                onClick={() => setSelectedGrade(gradeNum)}
                className={`px-5 py-3 rounded-2xl border text-xs font-black transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${selectedGrade === gradeNum
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/30'
                  : 'grade-tab-btn-inactive bg-slate-900/70 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
              >
                <Layers className="w-4 h-4 text-cyan-300" />
                <span>Sinh Học Lớp {gradeNum}</span>
              </button>
            ))}
          </div>

          <div className="text-center mb-2">
            <h2 className="page-title-text text-2xl md:text-3xl font-black tracking-tight">
              Trạm Sinh Học Lớp {selectedGrade}
            </h2>
            <p className="page-subtitle-text text-xs md:text-sm mt-1">Lướt qua từng Trạm Sinh Học 3D để chinh phục kho báu tri thức!</p>
          </div>

          <div className="relative min-h-[480px] pt-2 pb-8" style={{ overflow: 'visible' }}>

            <svg className="absolute top-14 left-0 pointer-events-none z-0" style={{ width: `${seaPathWidth + 100}px`, height: '200px', overflow: 'visible' }}>
              <line x1="160" y1="120" x2={seaPathWidth} y2="120" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="5" strokeDasharray="12 12" className="s-curve-path-glow" />
            </svg>

            <div className="horizontal-ocean-slider gap-20 md:gap-28 relative z-10 flex items-center" style={{ overflowY: 'visible' }}>
              {stationsForGrade.map((st, idx) => {
                const IconComponent = st.IconComp || Microscope;

                if (st.isFuture) {
                  return (
                    <div key={st.id} className="bio-3d-island-badge w-80 shrink-0 flex flex-col items-center cursor-not-allowed opacity-75">
                      <div className="island-water-ripple" />
                      <div className="w-28 h-28 rounded-full bg-slate-900/90 border-4 border-slate-700 flex flex-col items-center justify-center text-4xl shadow-2xl relative mb-4">
                        <IconComponent className="w-12 h-12 text-slate-500" />
                        <span className="absolute -bottom-2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-amber-300 border border-amber-400/40">Sắp Ra Mắt</span>
                      </div>
                      <div className="station-card-panel text-center p-4 rounded-2xl border w-full">
                        <h3 className="text-base font-black text-white mb-1">{st.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{st.subtitle}</p>
                      </div>
                    </div>
                  );
                }

                const stats = getIslandStats(st.id, st.daysCount);
                const unlocked = isIslandUnlocked(idx);
                const isCurrentActiveIsland = idx === currentActiveBoatIndex;

                return (
                  <div
                    key={st.id}
                    onClick={() => handleOpenIslandDetail(st, idx)}
                    className={`bio-3d-island-badge w-80 shrink-0 flex flex-col items-center cursor-pointer group relative ${unlocked ? 'opacity-100' : 'opacity-65 grayscale-[30%]'
                      }`}
                  >
                    {isCurrentActiveIsland && (
                      <div className="absolute -top-16 z-30 animate-ship-float flex flex-col items-center pointer-events-none transition-all duration-700">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 border-4 border-white flex items-center justify-center shadow-2xl shadow-amber-500/60">
                          <Ship className="w-7 h-7 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg mt-0.5 whitespace-nowrap uppercase tracking-wider border border-amber-200">
                          HIỆN TẠI
                        </span>
                      </div>
                    )}

                    <div className="island-water-ripple" />

                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 via-teal-700 to-cyan-900 border-4 border-emerald-300/80 flex flex-col items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative mb-3 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-14 h-14 text-cyan-200 filter drop-shadow-[0_4px_10px_rgba(6,182,212,0.8)]" />
                      <span className={`absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${unlocked ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300' : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}>
                        {unlocked ? `Trạm ${idx + 1}` : 'Khóa 🔒'}
                      </span>
                    </div>

                    <div className="station-card-panel backdrop-blur-md p-5 rounded-3xl border border-cyan-400/30 w-full text-center shadow-xl group-hover:border-cyan-400 transition-colors">
                      <h3 className="text-base font-black group-hover:text-cyan-300 transition-colors mb-1.5">{st.name}</h3>
                      <p className="text-[11px] leading-relaxed font-medium mb-3">{st.subtitle}</p>

                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-2 border border-white/5">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${(stats.completedDays / st.daysCount) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-amber-500 font-extrabold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {stats.totalStars} / {stats.maxStars}
                        </span>
                        <span className="text-cyan-500 font-extrabold text-[11px]">
                          {stats.completedDays}/{st.daysCount} Ngày
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* 🏝️ VIEW 2: MAP TRẠM 10 NGÀY BẢNG 3D ĐẾ ĐÁ MỞ RỘNG 500PX */}
      {viewMode === 'detail' && selectedStation && (
        <main className="max-w-4xl mx-auto px-4 py-6" style={{ overflow: 'visible' }}>

          {/* HEADER TRẠM SANG TRỌNG THEO PHONG CÁCH LIQUID GLASS ĐỒNG BỘ HỆ THỐNG */}
          <div className="card-clear-liquid-glass station-card-panel bg-white/80 dark:bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/60 dark:border-cyan-400/30 shadow-xl mb-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <button onClick={() => setViewMode('world')} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 transition cursor-pointer mb-1.5">
                <ArrowLeft className="w-4 h-4" /> Trở về Bản đồ Trạm
              </button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                {selectedStation.name}
              </h2>
            </div>

            <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-black/40 p-2.5 rounded-2xl border border-slate-300/80 dark:border-white/10 shrink-0">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-300">Linh vật:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'turtle', icon: '🐢' },
                  { id: 'cell', icon: '🦠' },
                  { id: 'dino', icon: '🦖' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMascotType(m.id)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border cursor-pointer ${mascotType === m.id ? 'bg-cyan-500/30 border-cyan-400 scale-110' : 'bg-white/60 dark:bg-white/5 border-slate-300/80 dark:border-white/10 hover:bg-white/80'
                      }`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LOGO NỔI TỰ DO NÂNG CẤP SIÊU TO & ĐỔ BÓNG NEON 3D VŨ TRỤ */}
          <div className="flex justify-center mt-1 -mb-6 relative z-20">
            <img
              src="https://res.cloudinary.com/de513yqvf/image/upload/v1787106519/IMG_7382_pkvobv.png"
              alt="Logo Trạm Sinh Học"
              className="max-w-[340px] md:max-w-[460px] w-full h-auto object-contain drop-shadow-[0_15px_40px_rgba(168,85,247,0.95)] animate-in zoom-in-95 duration-300 pointer-events-none select-none"
            />
          </div>

          <div className="w-full max-w-[800px] mx-auto relative flex justify-center pt-0 pb-4">
            <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="relative shrink-0">

              <svg viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path
                  d="M 200 90 C 450 140, 600 140, 600 180 C 600 230, 180 230, 180 270 C 180 320, 620 320, 620 360 C 620 410, 180 410, 180 450 C 180 500, 620 500, 620 540 C 620 590, 180 590, 180 630 C 180 680, 620 680, 620 720 C 620 770, 200 770, 200 810 C 200 860, 600 860, 600 900 C 600 960, 400 960, 400 990"
                  fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="22" strokeLinecap="round"
                />
                <path
                  d="M 200 90 C 450 140, 600 140, 600 180 C 600 230, 180 230, 180 270 C 180 320, 620 320, 620 360 C 620 410, 180 410, 180 450 C 180 500, 620 500, 620 540 C 620 590, 180 590, 180 630 C 180 680, 620 680, 620 720 C 620 770, 200 770, 200 810 C 200 860, 600 860, 600 900 C 600 960, 400 960, 400 990"
                  fill="none" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="6" strokeDasharray="10 10" className="railway-track-glow"
                />
              </svg>

              <div
                className="absolute z-40 flex flex-col items-center animate-mascot-walk pointer-events-none"
                style={{
                  left: `${mascotPos.x}px`,
                  top: `${mascotPos.y - 65}px`,
                  transform: 'translate(-50%, -100%)',
                  transition: 'left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <span className="text-4xl filter drop-shadow-[0_6px_14px_rgba(6,182,212,0.9)]">{renderMascotAvatar()}</span>
              </div>

              {SMALL_CHEST_COORDS_10.map((coord, idx) => {
                const isOpened = openedChests.includes(idx);
                return (
                  <div key={`small-chest-${idx}`} className="absolute z-20 flex flex-col items-center cursor-help" style={{ left: `${coord.x}px`, top: `${coord.y}px`, transform: 'translate(-50%, -50%)' }}>
                    {isOpened ? <OpenedTreasureChestSVG /> : <ClosedTreasureChestSVG />}
                  </div>
                );
              })}

              <div className="absolute z-20 flex flex-col items-center" style={{ left: `${GRAND_CHEST_COORD.x}px`, top: `${GRAND_CHEST_COORD.y}px`, transform: 'translate(-50%, -50%)' }}>
                <div className="scale-125">
                  {openedChests.includes(selectedStation.daysCount - 1) ? <OpenedTreasureChestSVG /> : <ClosedTreasureChestSVG />}
                </div>
              </div>

              {openedChests.includes(selectedStation.daysCount - 1) && (
                <div className="absolute z-30 flex flex-col items-center animate-in zoom-in-50 duration-500" style={{ left: `${TELEPORT_PORTAL_COORD.x}px`, top: `${TELEPORT_PORTAL_COORD.y}px`, transform: 'translate(-50%, -50%)' }}>
                  <TeleportPortalSVG onClick={handleTriggerTeleportPortal} />
                </div>
              )}

              {NODE_COORDS_10.map((coord, i) => {
                const dayIndex = i + 1;
                const dayDisplayNum = selectedStation.startDay + i;
                const key = `${selectedStation.id}_${dayIndex}`;
                const prog = stationProgress[key] || { stars: 0 };
                const unlocked = dayIndex === 1 || demoMode || stationProgress[`${selectedStation.id}_${dayIndex - 1}`]?.stars > 0;
                const isStarPopNode = justCompletedDayNode === dayIndex;

                return (
                  <div key={`node-${dayIndex}`} className="absolute z-30 flex flex-col items-center" style={{ left: `${coord.x}px`, top: `${coord.y}px`, transform: 'translate(-50%, -50%)' }}>
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleStartDayQuiz(dayIndex)}
                        disabled={!unlocked}
                        className={`relative w-20 h-20 day-badge-pedestal flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${unlocked
                          ? 'unlocked-node bg-gradient-to-b from-amber-500 via-amber-600 to-orange-600 border-amber-300'
                          : 'locked-node bg-gradient-to-b from-slate-700 to-slate-900 border-slate-600 opacity-85'
                          }`}
                      >
                        {!unlocked && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center shadow-md z-40">
                            <span className="text-xs">🔒</span>
                          </div>
                        )}
                        <span className="node-day-label text-[11px] font-black uppercase tracking-wider text-amber-100 drop-shadow-md">Ngày</span>
                        <span className="node-day-num text-2xl font-black text-white drop-shadow-lg">{dayDisplayNum}</span>
                      </button>

                      <div className="stone-pedestal-base w-28 h-7 -mt-2 flex items-center justify-center z-10">
                        <div className={`flex items-center gap-1 ${isStarPopNode ? 'animate-star-pop' : ''}`}>
                          {[1, 2, 3].map(s => (
                            <Star
                              key={s}
                              className={`w-6 h-6 ${s <= prog.stars
                                ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                                : 'text-slate-600 fill-slate-800'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </main>
      )}

      {/* 🎁 LOOT UNBOXING REWARD MODAL */}
      {showLootModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="quiz-modal-container w-full max-w-md bg-slate-950/90 p-6 text-center border border-amber-400/40 rounded-3xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-3xl border-2 bg-gradient-to-tr from-amber-600 to-yellow-400 border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <OpenedTreasureChestSVG />
            </div>
            <h3 className="text-2xl font-black mb-1">Mở Rương Kho Báu Sinh Học!</h3>
            <p className="text-xs text-amber-500 font-bold mb-6">Thành tích Ngày {showLootModal.dayIndex} • {showLootModal.earnedStars} Sao ⭐</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center">
                <Coins className="w-8 h-8 text-yellow-500 mb-1" />
                <span className="text-xl font-black">+{showLootModal.rewards.coins}</span>
                <span className="text-[10px] font-bold text-yellow-600">Xu Thưởng</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center">
                <Zap className="w-8 h-8 text-purple-500 mb-1" />
                <span className="text-xl font-black">+{showLootModal.rewards.xp}</span>
                <span className="text-[10px] font-bold text-purple-600">Kinh Nghiệm XP</span>
              </div>
            </div>
            <button onClick={() => setShowLootModal(null)} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-extrabold text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-amber-500/30">
              Thu Nhận Phần Thưởng
            </button>
          </div>
        </div>
      )}

      {/* 🎮 5 MULTI-TYPE MINI-GAMES MODAL ENGINE KÈM LOGIC 2 LẦN THỬ CHUẨN XÁC */}
      {activeDayQuiz && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="quiz-modal-container w-full max-w-2xl bg-slate-950/95 p-6 md:p-8 rounded-3xl border border-cyan-400/40 relative animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                  Thử thách Ngày {activeDayQuiz.dayDisplayNum} • Trò chơi {gameStep + 1}/{currentGames.length}
                </span>
                <h3 className="text-lg font-black">{currentGame.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                {currentGame.hint && (
                  <button
                    onClick={() => setShowHintModal(prev => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" /> Xem Gợi Ý
                  </button>
                )}
                <button onClick={() => setActiveDayQuiz(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">✕</button>
              </div>
            </div>

            {/* BẢNG GỢI Ý HINT (MỞ KHI LẦN 1 TRẢ LỜI SAI HOẶC BẤM XEM GỢI Ý) */}
            {showHintModal && currentGame.hint && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs animate-in fade-in duration-200 flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block mb-1">Gợi Ý Sinh Học:</span>
                  <p>{currentGame.hint}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              {[0, 1, 2, 3, 4].slice(0, currentGames.length).map(s => (
                <div key={s} className={`h-2 flex-1 rounded-full transition-all ${s === gameStep ? 'bg-cyan-400' : s < gameStep ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              ))}
            </div>

            {/* DẠNG 1: QUIZ TRẮC NGHIỆM (ĐÁO ĐÁP ÁN NGẪU NHIÊN CHO HỌC SINH) */}
            {gameStep === 0 && (
              <div>
                <h4 className="text-base font-bold mb-6">{currentGame.question}</h4>
                <div className="space-y-3 mb-6">
                  {shuffledQuizOptions.map((optText, idx) => {
                    const isSelected = selectedQuizOptText === optText;
                    const correctIdx = currentGame.answerIndex ?? currentGame.answer;
                    const correctText = currentGame.options?.[correctIdx];
                    const isCorrectOpt = optText === correctText;

                    let btnStyle = 'quiz-option-btn border-slate-700 bg-slate-900';
                    if (isSelected) {
                      if (attempt2Finished) {
                        btnStyle = isCorrectOpt ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                      } else if (attempt1Wrong) {
                        btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                      } else {
                        btnStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={attempt2Finished}
                        onClick={() => {
                          setSelectedQuizOptText(optText);
                        }}
                        className={`w-full p-4 rounded-2xl text-left text-sm transition border cursor-pointer ${btnStyle}`}
                      >
                        {optText}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DẠNG 2: NỐI CHỮ (WORD MATCHING - ĐẢO CỘT PHẢI & RUNG ĐỎ 600MS TỰ MẤT) */}
            {gameStep === 1 && (
              <div>
                <p className="text-xs text-slate-300 mb-4">{currentGame.instruction || 'Hãy chọn 1 ô bên trái và nối với khái niệm đúng bên phải:'}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* CỘT BÊN TRÁI */}
                  <div className="space-y-2">
                    {currentGame.pairs?.map((p, leftIdx) => {
                      const isMatched = matchedPairs.some(m => m.leftText === p.left);
                      const isSelected = selectedLeftMatch === leftIdx;
                      const isWrong = wrongMatchPair?.leftIdx === leftIdx;

                      return (
                        <button
                          key={leftIdx}
                          disabled={isMatched}
                          onClick={() => setSelectedLeftMatch(leftIdx)}
                          className={`w-full p-3 rounded-xl text-left text-xs font-bold border transition cursor-pointer ${isMatched
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 opacity-60'
                            : isWrong
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-shake'
                              : isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-900 border-slate-700'
                            }`}
                        >
                          {p.left}
                        </button>
                      );
                    })}
                  </div>

                  {/* CỘT BÊN PHẢI (ĐẢO VỊ TRÍ NGẪU NHIÊN) */}
                  <div className="space-y-2">
                    {shuffledMatchRight.map((rightText, rightIdx) => {
                      const matchedItem = matchedPairs.find(m => m.rightText === rightText);
                      const isMatched = !!matchedItem;
                      const isWrong = wrongMatchPair?.rightText === rightText;

                      return (
                        <button
                          key={rightIdx}
                          disabled={isMatched}
                          onClick={() => {
                            if (selectedLeftMatch !== null) {
                              const targetLeftObj = currentGame.pairs[selectedLeftMatch];
                              const isRightMatch = targetLeftObj.right === rightText;

                              if (isRightMatch) {
                                // 🎯 NỐI ĐÚNG: VIỀN XANH + MỜ KHÔNG CHO CHỌN LẠI
                                setMatchedPairs(prev => [...prev, { leftText: targetLeftObj.left, rightText, isCorrect: true }]);
                                setSelectedLeftMatch(null);
                              } else {
                                // 🎯 NỐI SAI: VIỀN ĐỎ + RUNG 600MS RỒI TỰ MẤT CHO CHỌN LẠI
                                setWrongMatchPair({ leftIdx: selectedLeftMatch, rightText });
                                setTimeout(() => {
                                  setWrongMatchPair(null);
                                  setSelectedLeftMatch(null);
                                }, 600);
                              }
                            }
                          }}
                          className={`w-full p-3 rounded-xl text-left text-xs font-bold border transition cursor-pointer ${isMatched
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : isWrong
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-shake'
                              : 'bg-slate-900 border-slate-700'
                            }`}
                        >
                          {rightText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DẠNG 3: ĐIỀN TỪ CÒN THIẾU */}
            {gameStep === 2 && (
              <div>
                <p className="text-xs text-slate-300 mb-4">{currentGame.instruction || 'Gõ từ thích hợp vào ô trống bên dưới:'}</p>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-sm font-medium">
                  {currentGame.sentence?.replace('[blank]', '_______')}
                </div>
                <input
                  type="text"
                  disabled={attempt2Finished}
                  placeholder="Gõ từ đáp án tại đây..."
                  value={fillInputText}
                  onChange={(e) => setFillInputText(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-2xl p-4 text-sm font-bold text-white mb-6 focus:outline-none ${attempt2Finished
                    ? fillInputText.trim().toLowerCase() === currentGame.correctAnswer.trim().toLowerCase()
                      ? 'border-emerald-400 text-emerald-300'
                      : 'border-rose-500 text-rose-300'
                    : attempt1Wrong
                      ? 'border-rose-500 text-rose-300'
                      : 'border-cyan-400/40 focus:border-cyan-400'
                    }`}
                />
              </div>
            )}

            {/* DẠNG 4: PHÂN LOẠI NHÓM (CÁC TỪ MẶC ĐỊNH NẰM Ở KHO BÊN DƯỚI) */}
            {gameStep === 3 && (
              <div>
                <p className="text-xs text-slate-300 mb-4">{currentGame.instruction || 'Bấm chọn từ kho bên dưới rồi xếp vào một trong hai bảng nhóm:'}</p>

                {/* 2 BẢNG PHÂN LOẠI NHÓM */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {currentGame.categories?.map((catName, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => {
                        if (selectedUnassignedItem) {
                          setCategoryBoards(prev => {
                            const newB = [...prev];
                            newB[cIdx] = [...newB[cIdx], selectedUnassignedItem];
                            return newB;
                          });
                          setUnassignedItems(prev => prev.filter(i => i.name !== selectedUnassignedItem.name));
                          setSelectedUnassignedItem(null);
                        }
                      }}
                      className={`p-4 rounded-2xl bg-slate-900 border transition-all min-h-[140px] cursor-pointer ${selectedUnassignedItem ? 'border-cyan-400 border-dashed bg-cyan-500/10' : 'border-slate-800'
                        }`}
                    >
                      <span className="text-xs font-black text-cyan-400 block mb-3">{catName} (Chạm để xếp vào)</span>
                      <div className="space-y-2">
                        {categoryBoards[cIdx]?.map((item, itemIdx) => {
                          const status = categoryItemStatus[item.name];
                          return (
                            <div
                              key={itemIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!attempt2Finished) {
                                  // Cho phép gỡ từ khỏi bảng ra lại kho
                                  setCategoryBoards(prev => {
                                    const newB = [...prev];
                                    newB[cIdx] = newB[cIdx].filter(i => i.name !== item.name);
                                    return newB;
                                  });
                                  setUnassignedItems(prev => [...prev, item]);
                                }
                              }}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${status === 'wrong'
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                : status === 'correct'
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-slate-950 border-slate-700 hover:border-rose-400'
                                }`}
                            >
                              {item.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* KHO TỪ BÊN DƯỚI BẢNG */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
                  <span className="text-xs font-bold text-slate-400 block mb-3">Kho Từ Chưa Phân Nhóm:</span>
                  <div className="flex flex-wrap gap-2">
                    {unassignedItems.length === 0 ? (
                      <span className="text-xs text-emerald-400 font-bold">✓ Tất cả các từ đã được xếp vào bảng!</span>
                    ) : (
                      unassignedItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedUnassignedItem(item)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${selectedUnassignedItem?.name === item.name
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 scale-105'
                            : 'bg-slate-900 border-slate-700 hover:border-cyan-400'
                            }`}
                        >
                          {item.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DẠNG 5: HOÀN THÀNH CÂU (ĐẢO KHO TỪ NGẪU NHIÊN) */}
            {gameStep === 4 && (
              <div>
                <p className="text-xs text-slate-300 mb-4">{currentGame.instruction || 'Chọn từ chính xác từ kho từ để hoàn thành câu:'}</p>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-sm font-bold leading-relaxed">
                  {currentGame.textWithBlanks?.replace('[blank]', dragWordChoice ? `[ ${dragWordChoice} ]` : '[ ...... ]')}
                </div>
                <div className="flex items-center gap-3 mb-6">
                  {shuffledBankWords.map((word, wIdx) => {
                    const isSelected = dragWordChoice === word;
                    return (
                      <button
                        key={wIdx}
                        disabled={attempt2Finished}
                        onClick={() => setDragWordChoice(word)}
                        className={`px-4 py-3 rounded-xl border text-xs font-black transition cursor-pointer ${isSelected
                          ? attempt2Finished
                            ? word === currentGame.correctWord
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : attempt1Wrong
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-700 hover:border-cyan-400'
                          }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ô ĐÁP ÁN ĐÚNG & GIẢI THÍCH CHI TIẾT (CHỈ HIỂN THỊ KHI ĐÃ LÀM LẦN 2 HOẶC LÀM ĐÚNG) */}
            {attempt2Finished && currentGame.explanation && (
              <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-200 text-xs animate-in fade-in duration-200 flex items-start gap-2">
                <FileText className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block mb-1">Đáp Án Đúng & Giải Thích Chi Tiết:</span>
                  <p>{currentGame.explanation}</p>
                </div>
              </div>
            )}

            {/* NÚT THỰC HIỆN "TRẢ LỜI" HOẶC "CÂU TIẾP THEO" HOẶC "HOÀN THÀNH ẢI" (TUYỆT ĐỐI KHÔNG CÓ ICON CÚP KẾ BÊN) */}
            {attempt2Finished ? (
              <button
                onClick={handleNextGameStep}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-sm uppercase tracking-wider hover:brightness-110 transition cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {gameStep + 1 < currentGames.length ? 'CÂU TIẾP THEO' : 'HOÀN THÀNH ẢI'}
              </button>
            ) : (
              <button
                disabled={isSubmitDisabled()}
                onClick={handleSubmitCurrentGame}
                className="w-full py-3.5 rounded-xl bg-cyan-500 text-black font-extrabold text-sm uppercase tracking-wider disabled:opacity-40 hover:bg-cyan-400 transition cursor-pointer"
              >
                TRẢ LỜI
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
