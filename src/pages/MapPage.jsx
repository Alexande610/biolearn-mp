import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Star, Lock, ChevronRight, User, Leaf, Coins,
  Trophy, BookOpen, Beaker, Crown, Zap, Target, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Avatar map - sử dụng tên file thực tế từ folder Avatar
const avatarMap = {
  'adventurer-1': '/images/Avatar/adventurer-1.png',
  'adventurer-2': '/images/Avatar/adventurer-2.png',
  'adventurer-3': '/images/Avatar/adventurer-3.png',
  'adventurer-4': '/images/Avatar/adventurer-4.png',
  'adventurer-5': '/images/Avatar/adventurer-5.png',
  'avataaars-1': '/images/Avatar/avataaars-1.png',
  'avataaars-2': '/images/Avatar/avataaars-2.png',
  'avataaars-3': '/images/Avatar/avataaars-3.png',
  'avataaars-4': '/images/Avatar/avataaars-4.png',
  'avataaars-5': '/images/Avatar/avataaars-5.png',
  'bigEars-1': '/images/Avatar/bigEars-1.png',
  'bigEars-2': '/images/Avatar/bigEars-2.png',
  'bigEars-3': '/images/Avatar/bigEars-3.png',
  'bigEars-4': '/images/Avatar/bigEars-4.png',
  'bigEars-5': '/images/Avatar/bigEars-5.png',
  'bottts-1': '/images/Avatar/bottts-1.png',
  'bottts-2': '/images/Avatar/bottts-2.png',
  'bottts-3': '/images/Avatar/bottts-3.png',
  'bottts-4': '/images/Avatar/bottts-4.png',
  'bottts-5': '/images/Avatar/bottts-5.png',
  'rings-1': '/images/Avatar/rings-1.png',
  'rings-2': '/images/Avatar/rings-2.png',
  'rings-3': '/images/Avatar/rings-3.png',
  'rings-4': '/images/Avatar/rings-4.png',
  'rings-5': '/images/Avatar/rings-5.png',
};

// Dữ liệu chương theo lớp - CHI TIẾT HƠN với lessons riêng
const classData = {
  "6": {
    "name": "Lớp 6",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Mở đầu về khoa học tự nhiên",
        "color": "from-blue-400 to-indigo-600",
        "icon": "🔬",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: Giới thiệu về khoa học tự nhiên"
          },
          {
            "id": 2,
            "name": "Bài 2: An toàn trong phòng thực hành"
          },
          {
            "id": 3,
            "name": "Bài 3: Sử dụng kính lúp và kính hiển vi"
          }
        ]
      },
      {
        "id": 2,
        "name": "Chương 2: Các cấp độ tổ chức trong thế giới sống",
        "color": "from-green-400 to-emerald-600",
        "icon": "🌱",
        "lessons": [
          {
            "id": 4,
            "name": "Bài 4: Tế bào - Đơn vị cơ bản của sự sống"
          },
          {
            "id": 5,
            "name": "Bài 5: Từ tế bào đến cơ thể"
          }
        ]
      },
      {
        "id": 3,
        "name": "Chương 3: Sự đa dạng của thế giới sống",
        "color": "from-orange-400 to-amber-600",
        "icon": "🦎",
        "lessons": [
          {
            "id": 6,
            "name": "Bài 6: Phân loại thế giới sống"
          },
          {
            "id": 7,
            "name": "Bài 7: Virus và vi khuẩn"
          },
          {
            "id": 8,
            "name": "Bài 8: Protozoa và Nấm"
          },
          {
            "id": 9,
            "name": "Bài 9: Thực vật"
          },
          {
            "id": 10,
            "name": "Bài 10: Động vật"
          }
        ]
      }
    ]
  },
  "7": {
    "name": "Lớp 7",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Trao đổi chất và chuyển hóa năng lượng",
        "color": "from-red-400 to-pink-600",
        "icon": "⚡",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: Trao đổi chất và năng lượng"
          },
          {
            "id": 2,
            "name": "Bài 2: Quang hợp ở thực vật"
          },
          {
            "id": 3,
            "name": "Bài 3: Hô hấp tế bào"
          }
        ]
      },
      {
        "id": 2,
        "name": "Chương 2: Cảm ứng và tập tính",
        "color": "from-purple-400 to-violet-600",
        "icon": "🧠",
        "lessons": [
          {
            "id": 4,
            "name": "Bài 4: Cảm ứng ở sinh vật"
          },
          {
            "id": 5,
            "name": "Bài 5: Tập tính ở động vật"
          }
        ]
      }
    ]
  },
  "8": {
    "name": "Lớp 8",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Di truyền và biến dị",
        "color": "from-cyan-400 to-blue-600",
        "icon": "🧬",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: DNA và gene"
          },
          {
            "id": 2,
            "name": "Bài 2: Nhiễm sắc thể"
          },
          {
            "id": 3,
            "name": "Bài 3: Giảm phân"
          }
        ]
      }
    ]
  },
  "9": {
    "name": "Lớp 9",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Tiến hóa",
        "color": "from-emerald-400 to-green-600",
        "icon": "🦖",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: Bằng chứng tiến hóa"
          },
          {
            "id": 2,
            "name": "Bài 2: Các học thuyết tiến hóa"
          }
        ]
      }
    ]
  },
  "10": {
    "name": "Lớp 10",
    "chapters": [
      {
        "id": 1,
        "name": "Phần mở đầu",
        "color": "from-blue-400 to-indigo-600",
        "icon": "📚",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: Giới thiệu khái quát môn Sinh học"
          },
          {
            "id": 2,
            "name": "Bài 2: Phương pháp nghiên cứu và học tập"
          },
          {
            "id": 3,
            "name": "Bài 3: Các cấp độ tổ chức thế giới sống"
          }
        ]
      },
      {
        "id": 2,
        "name": "Chương 1: Thành phần hóa học của tế bào",
        "color": "from-green-400 to-emerald-600",
        "icon": "⚗️",
        "lessons": [
          {
            "id": 4,
            "name": "Bài 4: Các nguyên tố hóa học và nước"
          },
          {
            "id": 5,
            "name": "Bài 5: Các phân tử sinh học"
          },
          {
            "id": 6,
            "name": "Bài 6: Thực hành: Nhận biết phân tử sinh học"
          }
        ]
      },
      {
        "id": 3,
        "name": "Chương 2: Cấu trúc tế bào",
        "color": "from-cyan-400 to-blue-600",
        "icon": "🔬",
        "lessons": [
          {
            "id": 7,
            "name": "Bài 7: Tế bào nhân sơ"
          },
          {
            "id": 8,
            "name": "Bài 8: Tế bào nhân thực"
          },
          {
            "id": 9,
            "name": "Bài 9: Thực hành: Quan sát tế bào"
          }
        ]
      },
      {
        "id": 4,
        "name": "Chương 3: Trao đổi chất qua màng và truyền tin",
        "color": "from-purple-400 to-violet-600",
        "icon": "🔄",
        "lessons": [
          {
            "id": 10,
            "name": "Bài 10: Trao đổi chất qua màng tế bào"
          },
          {
            "id": 11,
            "name": "Bài 11: Thực hành: Co và phản co nguyên sinh"
          },
          {
            "id": 12,
            "name": "Bài 12: Truyền tin tế bào"
          }
        ]
      },
      {
        "id": 5,
        "name": "Chương 4: Chuyển hóa năng lượng",
        "color": "from-orange-400 to-red-600",
        "icon": "⚡",
        "lessons": [
          {
            "id": 13,
            "name": "Bài 13: Khái quát về chuyển hóa vật chất"
          },
          {
            "id": 14,
            "name": "Bài 14: Phân giải và tổng hợp các chất"
          }
        ]
      },
      {
        "id": 6,
        "name": "Chương 5: Chu kì tế bào và phân bào",
        "color": "from-pink-400 to-rose-600",
        "icon": "🔁",
        "lessons": [
          {
            "id": 16,
            "name": "Bài 16: Chu kì tế bào và nguyên phân"
          },
          {
            "id": 17,
            "name": "Bài 17: Giảm phân"
          },
          {
            "id": 19,
            "name": "Bài 19: Công nghệ tế bào"
          }
        ]
      },
      {
        "id": 7,
        "name": "Chương 6: Sinh học vi sinh vật",
        "color": "from-teal-400 to-cyan-600",
        "icon": "🦠",
        "lessons": [
          {
            "id": 21,
            "name": "Bài 21: Trao đổi chất và sinh sản vi sinh vật"
          },
          {
            "id": 22,
            "name": "Bài 22: Vai trò và ứng dụng vi sinh vật"
          }
        ]
      },
      {
        "id": 8,
        "name": "Chương 7: Virus",
        "color": "from-red-400 to-pink-600",
        "icon": "🔴",
        "lessons": [
          {
            "id": 24,
            "name": "Bài 24: Khái quát về virus"
          },
          {
            "id": 25,
            "name": "Bài 25: Một số bệnh do virus"
          }
        ]
      }
    ]
  },
  "11": {
    "name": "Lớp 11",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Trao đổi chất và chuyển hóa năng lượng",
        "color": "from-green-400 to-emerald-600",
        "icon": "🌱",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: Khái quát về trao đổi chất"
          },
          {
            "id": 2,
            "name": "Bài 2: Trao đổi nước ở thực vật"
          },
          {
            "id": 4,
            "name": "Bài 4: Quang hợp ở thực vật"
          },
          {
            "id": 6,
            "name": "Bài 6: Hô hấp ở thực vật"
          },
          {
            "id": 8,
            "name": "Bài 8: Dinh dưỡng ở động vật"
          },
          {
            "id": 9,
            "name": "Bài 9: Hô hấp ở động vật"
          },
          {
            "id": 10,
            "name": "Bài 10: Tuần hoàn ở động vật"
          }
        ]
      },
      {
        "id": 2,
        "name": "Chương 2: Cảm ứng ở sinh vật",
        "color": "from-blue-400 to-indigo-600",
        "icon": "🎯",
        "lessons": [
          {
            "id": 14,
            "name": "Bài 14: Khái quát về cảm ứng"
          },
          {
            "id": 15,
            "name": "Bài 15: Cảm ứng ở thực vật"
          },
          {
            "id": 17,
            "name": "Bài 17: Cảm ứng ở động vật"
          },
          {
            "id": 18,
            "name": "Bài 18: Tập tính ở động vật"
          }
        ]
      },
      {
        "id": 3,
        "name": "Chương 3: Sinh trưởng và phát triển",
        "color": "from-orange-400 to-amber-600",
        "icon": "📈",
        "lessons": [
          {
            "id": 19,
            "name": "Bài 19: Khái quát về sinh trưởng"
          },
          {
            "id": 20,
            "name": "Bài 20: Sinh trưởng ở thực vật"
          },
          {
            "id": 22,
            "name": "Bài 22: Sinh trưởng ở động vật"
          }
        ]
      },
      {
        "id": 4,
        "name": "Chương 4: Sinh sản ở sinh vật",
        "color": "from-pink-400 to-rose-600",
        "icon": "🌸",
        "lessons": [
          {
            "id": 24,
            "name": "Bài 24: Khái quát về sinh sản"
          },
          {
            "id": 25,
            "name": "Bài 25: Sinh sản ở thực vật"
          },
          {
            "id": 27,
            "name": "Bài 27: Sinh sản ở động vật"
          }
        ]
      }
    ]
  },
  "12": {
    "name": "Lớp 12",
    "chapters": [
      {
        "id": 1,
        "name": "Chương 1: Di truyền phân tử",
        "color": "from-indigo-400 to-blue-600",
        "icon": "🧬",
        "lessons": [
          {
            "id": 1,
            "name": "Bài 1: DNA và cơ chế tái bản"
          },
          {
            "id": 2,
            "name": "Bài 2: Gene và quá trình truyền đạt thông tin"
          },
          {
            "id": 3,
            "name": "Bài 3: Điều hòa biểu hiện gene"
          },
          {
            "id": 4,
            "name": "Bài 4: Đột biến gene"
          }
        ]
      },
      {
        "id": 2,
        "name": "Chương 2: Di truyền nhiễm sắc thể",
        "color": "from-purple-400 to-violet-600",
        "icon": "🔬",
        "lessons": [
          {
            "id": 6,
            "name": "Bài 6: Cấu trúc nhiễm sắc thể"
          },
          {
            "id": 7,
            "name": "Bài 7: Học thuyết Mendel"
          },
          {
            "id": 10,
            "name": "Bài 10: Di truyền giới tính"
          },
          {
            "id": 11,
            "name": "Bài 11: Liên kết gene"
          }
        ]
      },
      {
        "id": 3,
        "name": "Chương 3: Di truyền quần thể",
        "color": "from-teal-400 to-cyan-600",
        "icon": "👥",
        "lessons": [
          {
            "id": 8,
            "name": "Bài 8: Cấu trúc di truyền quần thể"
          }
        ]
      },
      {
        "id": 4,
        "name": "Chương 4: Ứng dụng di truyền học",
        "color": "from-green-400 to-emerald-600",
        "icon": "🌾",
        "lessons": [
          {
            "id": 12,
            "name": "Bài 12: Công nghệ gen"
          }
        ]
      }
    ]
  }
};

// Constants cho cấu trúc level
const LEVELS_PER_LESSON = 10; // 10 màn thường mỗi bài
const PRACTICE_LEVELS_PER_CHAPTER = 2; // 2 màn thực hành cuối MỖI CHƯƠNG

export default function MapPage() {
  const { classId } = useParams();
  const parsedClassId = parseInt(classId, 10);
  const normalizedClassId = Number.isFinite(parsedClassId) ? parsedClassId : 6;
  const navigate = useNavigate();
  const { user, userStats, refreshUserStats } = useAuth();
  const [activeChapter, setActiveChapter] = useState(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Refresh stats on mount to ensure latest progress
  useEffect(() => {
    if (refreshUserStats) {
      refreshUserStats();
    }
  }, []);

  const chapters = classData[normalizedClassId]?.chapters || [];
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedChapterForSkip, setSelectedChapterForSkip] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [energy, setEnergy] = useState(0); // Track energy locally
  const [showNoEnergyModal, setShowNoEnergyModal] = useState(false); // Modal hết năng lượng
  const [progress, setProgress] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [dynamicClassInfo, setDynamicClassInfo] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ chapter: 1, lesson: 1, level: 0 });
  const mapRef = useRef(null);
  const avatarRef = useRef(null);
  
  const classInfo = dynamicClassInfo || classData[normalizedClassId] || classData[6];

  useEffect(() => {
    const fetchMapStructure = async () => {
      // Giả lập map structure từ dữ liệu local vì API server đã cũ
      setDynamicClassInfo(null);
    };

    fetchMapStructure();
  }, [normalizedClassId]);

  // Refresh userStats khi vào MapPage để lấy energy mới nhất
  useEffect(() => {
    if (refreshUserStats) {
      refreshUserStats();
    }
  }, []);
  
  // Sync energy từ userStats
  useEffect(() => {
    if (userStats) {
      // Hỗ trợ cả 2 định dạng: cũ (userStats.energy.energy) và mới (userStats.energy là số)
      const currentEnergy = typeof userStats.energy === 'object' 
        ? userStats.energy.energy 
        : (userStats.energy ?? userStats.stamina ?? 0);
      setEnergy(currentEnergy);
    }
  }, [userStats]);

  // Hàm lấy URL avatar từ ID
  const getAvatarUrl = (avatarId) => {
    if (!avatarId) return null;
    return avatarMap[avatarId] || null;
  };

  // Fetch avatar người dùng - Dữ liệu đã có trong userStats
  useEffect(() => {
    if (userStats?.avatar_url) {
      setUserAvatar(userStats.avatar_url);
    }
  }, [userStats]);

  useEffect(() => {
    // Lấy progress từ userStats (được fetch từ Supabase profiles)
    const fetchProgress = async () => {
      try {
        const classProgress = userStats?.class_progress?.[normalizedClassId] || {
          completedLevels: [],
          levelStars: {}
        };
        setProgress(classProgress);
        calculateCurrentPosition(classProgress);
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    };
    
    if (userStats) {
      fetchProgress();
    }
  }, [normalizedClassId, userStats]);

  // Scroll đến vị trí avatar hiện tại - chỉ khi có ref
  useEffect(() => {
    if (avatarRef.current && mapRef.current) {
      const timer = setTimeout(() => {
        try {
          avatarRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        } catch (e) {
          console.log('Scroll error:', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPosition]);

  // Lấy chapter đầu tiên của lớp hiện tại
  const getFirstChapterId = () => {
    const chapters = classInfo?.chapters;
    if (chapters && chapters.length > 0) {
      return chapters[0].id;
    }
    return 1; // fallback
  };

  // Tính toán vị trí hiện tại - tìm level đầu tiên chưa hoàn thành & đã mở khóa
  const calculateCurrentPosition = (prog) => {
    const firstChapterId = getFirstChapterId();
    
    if (!prog?.completedLevels?.length) {
      setCurrentPosition({ chapter: firstChapterId, lesson: 1, level: 0 });
      return;
    }
    
    const completed = new Set(prog.completedLevels);
    const chapters = classInfo.chapters;
    
    // Duyệt qua từng chapter → lesson → level để tìm level đầu tiên chưa hoàn thành
    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = chapters[ci];
      
      // NẾU CHƯƠNG NÀY ĐÃ HỌC VƯỢT => BỎ QUA TOÀN BỘ CÁC LEVEL TRONG CHƯƠNG NÀY 
      // ĐỂ ĐẶT AVATAR Ở CHƯƠNG TIẾP THEO
      if (completed.has(`${chapter.id}_review_0`)) {
        continue;
      }

      for (let li = 0; li < chapter.lessons.length; li++) {
        const lesson = chapter.lessons[li];
        for (let lv = 0; lv < LEVELS_PER_LESSON; lv++) {
          const key = `${chapter.id}_${lesson.id}_${lv}`;
          if (!completed.has(key)) {
            setCurrentPosition({ chapter: chapter.id, lesson: lesson.id, level: lv });
            return;
          }
        }
      }
      // Kiểm tra practice levels của chương
      for (let pv = 0; pv < PRACTICE_LEVELS_PER_CHAPTER; pv++) {
        const key = `${chapter.id}_99_${pv}`;
        if (!completed.has(key)) {
          setCurrentPosition({ chapter: chapter.id, lesson: 99, level: pv });
          return;
        }
      }
    }
    
    // Tất cả đã hoàn thành - đặt ở level cuối cùng
    const lastChapter = chapters[chapters.length - 1];
    const lastLesson = lastChapter.lessons[lastChapter.lessons.length - 1];
    setCurrentPosition({ chapter: lastChapter.id, lesson: lastLesson.id, level: LEVELS_PER_LESSON - 1 });
  };

  // Check if level is unlocked
  const isLevelUnlocked = (chapterId, lessonId, levelIndex) => {
    // Level đầu tiên của chương đầu tiên luôn mở khóa
    const firstChapterId = getFirstChapterId();
    if (chapterId === firstChapterId && lessonId === 1 && levelIndex === 0) return true;
    if (!progress?.completedLevels) return false;
    
    const completed = progress.completedLevels;
    
    // NẾU CHƯƠNG NÀY HOẶC CÁC CHƯƠNG SAU ĐÃ HỌC VƯỢT/HOÀN THÀNH => LUÔN MỞ KHÓA
    const chapters = classInfo.chapters;
    const currentChapterIdx = chapters.findIndex(c => c.id === chapterId);
    
    // Kiểm tra xem đã hoàn thành học vượt chương này chưa
    if (completed.includes(`${chapterId}_review_0`)) return true;
    
    // Kiểm tra xem có bất kỳ level nào ở các chương SAU đã hoàn thành chưa
    for (let i = currentChapterIdx + 1; i < chapters.length; i++) {
      const nextChapter = chapters[i];
      // Nếu đã hoàn thành học vượt chương sau, hoặc có bất kỳ bài nào của chương sau đã xong
      if (completed.includes(`${nextChapter.id}_review_0`)) return true;
      
      // Kiểm tra xem có level nào của chương sau đã hoàn thành chưa (bằng regex để nhanh)
      const hasLaterProgress = completed.some(key => key.startsWith(`${nextChapter.id}_`));
      if (hasLaterProgress) return true;
    }

    // Nếu là practice level của chương
    if (lessonId === 99 || lessonId === '99' || lessonId === 'practice') {
      if (levelIndex === 0) {
        // Practice 1: mở khi hoàn thành bài cuối của chương HOẶC học vượt xong chương đó
        const chapter = chapters[currentChapterIdx];
        if (!chapter) return false;
        const lastLesson = chapter.lessons[chapter.lessons.length - 1];
        const isLastLessonDone = completed.includes(`${chapterId}_${lastLesson.id}_${LEVELS_PER_LESSON - 1}`);
        const isChapterSkipped = completed.includes(`${chapterId}_review_0`);
        
        return isLastLessonDone || isChapterSkipped;
      } else {
        // Practice 2: mở khi hoàn thành practice 1
        return completed.includes(`${chapterId}_99_${levelIndex - 1}`) || 
               completed.includes(`${chapterId}_practice_${levelIndex - 1}`);
      }
    }
    
    // Level tiếp theo mở khi level trước hoàn thành
    if (levelIndex > 0) {
      return completed.includes(`${chapterId}_${lessonId}_${levelIndex - 1}`);
    }
    
    // Level đầu của bài mới - cần hoàn thành level cuối của bài trước HOẶC practice cuối của chương trước
    for (let ci = 0; ci <= currentChapterIdx; ci++) {
      const chapter = chapters[ci];
      for (let li = 0; li < chapter.lessons.length; li++) {
        if (chapter.id === chapterId && chapter.lessons[li].id === lessonId) {
          if (li > 0) {
            // Cùng chương, bài trước
            const prevLesson = chapter.lessons[li - 1];
            return completed.includes(`${chapterId}_${prevLesson.id}_${LEVELS_PER_LESSON - 1}`);
          } else if (ci > 0) {
            // Chương trước - cần hoàn thành chapter review CỦA CHƯƠNG TRƯỚC
            const prevChapter = chapters[ci - 1];
            return completed.includes(`${prevChapter.id}_review_0`);
          }
        }
      }
    }
    
    return false;
  };

  // Check if chapter review is unlocked
  const isChapterReviewUnlocked = (chapterId) => {
    const chapter = classInfo.chapters.find(c => c.id === chapterId);
    if (!chapter || !progress?.completedLevels) return false;
    
    // Kiểm tra đã hoàn thành 2 practice cuối chương chưa
    return progress.completedLevels.includes(`${chapterId}_practice_${PRACTICE_LEVELS_PER_CHAPTER - 1}`) || 
           progress.completedLevels.includes(`${chapterId}_99_${PRACTICE_LEVELS_PER_CHAPTER - 1}`);
  };

  // Get stars for a level
  const getLevelStars = (chapterId, lessonId, levelIndex) => {
    if (!progress?.levelStars) return 0;
    const key = `${chapterId}_${lessonId}_${levelIndex}`;
    return progress.levelStars[key] || 0;
  };

  // Check if level is completed
  const isLevelCompleted = (chapterId, lessonId, levelIndex) => {
    if (!progress?.completedLevels) return false;
    return progress.completedLevels.includes(`${chapterId}_${lessonId}_${levelIndex}`);
  };

  // Check if this is current position
  const isCurrentLevel = (chapterId, lessonId, levelIndex) => {
    return currentPosition.chapter === chapterId && 
           currentPosition.lesson === lessonId && 
           currentPosition.level === levelIndex;
  };

  // Lấy loại game cho level
  const getGameType = (levelIndex) => {
    // 0-2: quiz, 3-5: matching, 6-9: fillblank  
    if (levelIndex < 3) return 'quiz';
    if (levelIndex < 6) return 'matching';
    return 'fillblank';
  };

  // Render một node level trên map
  const renderLevelNode = (chapterId, lessonId, levelIndex, globalIndex, isPractice = false) => {
    const unlocked = isLevelUnlocked(chapterId, lessonId, levelIndex);
    const completed = isLevelCompleted(chapterId, lessonId, levelIndex);
    const stars = getLevelStars(chapterId, lessonId, levelIndex);
    const isCurrent = isCurrentLevel(chapterId, lessonId, levelIndex);
    
    // Tính toán vị trí zig-zag
    const isLeft = globalIndex % 2 === 0;
    
    // Màu sắc dựa trên trạng thái
    let bgClass = 'bg-gray-600';
    let ringClass = '';
    
    if (unlocked) {
      if (completed) {
        bgClass = isPractice ? 'bg-purple-500' : 'bg-green-500';
      } else {
        bgClass = isPractice ? 'bg-purple-600' : 'bg-green-600';
        ringClass = 'ring-2 ring-white ring-offset-2 ring-offset-transparent';
      }
    }
    
    if (isCurrent) {
      ringClass = 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-green-900 animate-pulse';
    }

    const levelNum = isPractice ? `P${levelIndex + 1}` : levelIndex + 1;
    // Hàm xử lý click vào level - kiểm tra năng lượng
    const handleLevelClick = () => {
      if (!unlocked) return;
      
      // Kiểm tra năng lượng
      if (energy <= 0) {
        setShowNoEnergyModal(true);
        return;
      }
      
      // Nếu là practice, navigate với type=practice
      if (isPractice) {
        navigate(`/play/${normalizedClassId}/${chapterId}/99?level=${levelIndex}&type=practice`);
      } else {
        navigate(`/play/${normalizedClassId}/${chapterId}/${lessonId}?level=${levelIndex}&type=${getGameType(levelIndex)}`);
      }
    };
    
    return (
      <div 
        key={`${chapterId}_${lessonId}_${levelIndex}`}
        className={`flex items-center ${isLeft ? 'justify-start' : 'justify-end'} relative`}
        ref={isCurrent ? avatarRef : null}
      >
        {/* Avatar hiển thị tại vị trí hiện tại */}
        {isCurrent && (
          <div className={`absolute ${isLeft ? '-left-16' : '-right-16'} -top-2`}>
            <div className="w-12 h-12 rounded-full border-4 border-yellow-400 overflow-hidden bg-green-600 shadow-lg animate-bounce">
              {getAvatarUrl(userAvatar) ? (
                <img src={getAvatarUrl(userAvatar)} alt="You" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-white" />
              )}
            </div>
          </div>
        )}
        
        {/* Level Button */}
        <button
          onClick={handleLevelClick}
          disabled={!unlocked}
          className={`relative w-16 h-16 rounded-full ${bgClass} ${ringClass} 
            flex flex-col items-center justify-center transition-all duration-300
            ${unlocked ? 'hover:scale-110 hover:shadow-xl cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
        >
          {unlocked ? (
            <>
              {isPractice ? (
                <Beaker className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white font-bold text-lg">{levelNum}</span>
              )}
              

              
              {/* Game type indicator */}
              {!isPractice && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  {getGameType(levelIndex) === 'quiz' && <Target className="w-3 h-3 text-white" />}
                  {getGameType(levelIndex) === 'matching' && <Zap className="w-3 h-3 text-white" />}
                  {getGameType(levelIndex) === 'fillblank' && <BookOpen className="w-3 h-3 text-white" />}
                </div>
              )}
            </>
          ) : (
            <Lock className="w-6 h-6 text-white/50" />
          )}
        </button>
      </div>
    );
  };

  // Xử lý học vượt chương
  const handleSkipChapter = async () => {
    if (skipLoading || !user) return;
    
    const chapterToSkip = selectedChapterForSkip;
    if (!chapterToSkip) return;
    
    setSkipLoading(true);
    try {
      // Chuyển hướng đến màn thử thách thay vì cộng thưởng ngay
      setShowSkipModal(false);
      const firstLessonId = chapterToSkip.lessons[0]?.id || 1;
      
      // Chế độ "skip-challenge" sẽ yêu cầu trả lời đúng 5 câu hỏi nâng cao
      navigate(`/play/${normalizedClassId}/${chapterToSkip.id}/${firstLessonId}?type=skip-challenge&mode=challenge`);
      
      setSelectedChapterForSkip(null);
    } catch (err) {
      console.error("Error skipping chapter:", err);
    }
    setSkipLoading(false);
  };

  const renderChapterReview = (chapter, isLeft, completed) => {
    return (
      <div className={`flex items-center ${isLeft ? 'justify-start' : 'justify-end'} my-4`}>
        <button
          onClick={() => {
            setSelectedChapterForSkip(chapter);
            setShowSkipModal(true);
          }}
          className={`relative w-20 h-20 rounded-2xl 
            ${completed ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-yellow-500 to-orange-600'} 
            flex flex-col items-center justify-center transition-all duration-300
            hover:scale-110 hover:shadow-xl cursor-pointer ring-2 ring-yellow-300`}
        >
          <Crown className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-bold mt-1">HỌC VƯỢT</span>
        </button>
      </div>
    );
  };

  // Tính tổng số level đã hoàn thành và tổng
  const calculateStats = () => {
    let totalLevels = 0;
    let completedLevels = progress?.completedLevels?.length || 0;
    
    classInfo.chapters.forEach(chapter => {
      totalLevels += chapter.lessons.length * LEVELS_PER_LESSON; // Levels của các bài
      totalLevels += PRACTICE_LEVELS_PER_CHAPTER; // 2 practice cuối chương
      totalLevels += 1; // Chapter review
    });
    
    return { completed: completedLevels, total: totalLevels };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-emerald-900">
      {/* Header cố định */}
      <header className="bg-green-800/80 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/home')}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">{classInfo.name}</h1>
                <p className="text-green-300 text-xs">Kết nối tri thức</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${energy <= 0 ? 'bg-red-600/50' : 'bg-green-700/50'} px-2 py-1 rounded-lg`}>
                <Leaf className={`w-4 h-4 ${energy <= 0 ? 'text-red-300' : 'text-green-300'}`} />
                <span className={`text-sm ${energy <= 0 ? 'text-red-200' : 'text-white'}`}>{energy}</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-600/50 px-2 py-1 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-sm">{userStats?.coins || 0}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1">
              <span>Tiến độ</span>
              <span>{stats.completed}/{stats.total} levels</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Map Container - Scrollable */}
      <main ref={mapRef} className="max-w-lg mx-auto px-6 py-8">
        {/* Render từng chương */}
        {classInfo.chapters.map((chapter, chapterIndex) => {
          let globalLevelIndex = 0;
          
          // Tính globalIndex từ các chương trước
          for (let i = 0; i < chapterIndex; i++) {
            globalLevelIndex += classInfo.chapters[i].lessons.length * LEVELS_PER_LESSON + PRACTICE_LEVELS_PER_CHAPTER + 1; // +1 cho chapter review
          }

          // Lấy chương trước để hiện "Học vượt" ở đầu chương này
          const prevChapter = chapterIndex > 0 ? classInfo.chapters[chapterIndex - 1] : null;
          
          return (
            <div key={chapter.id} className="mb-12">
              {/* Học vượt từ chương trước - nằm ở ĐẦU chương mới */}
              {prevChapter && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-yellow-400/30"></div>
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">HỌC VƯỢT - {prevChapter.name}</span>
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <div className="flex-1 h-px bg-yellow-400/30"></div>
                  </div>
                  <div className="flex justify-center">
                    {renderChapterReview(prevChapter, globalLevelIndex - 1, progress?.completedLevels?.includes(`${prevChapter.id}_review_0`))}
                  </div>
                </div>
              )}

              {/* Chapter Header - STICKY khi scroll */}
              <div className={`bg-gradient-to-r ${chapter.color} rounded-2xl p-4 mb-8 shadow-2xl sticky top-28 z-40 backdrop-blur-md border border-white/10`}>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{chapter.icon}</div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{chapter.name}</h2>
                    <p className="text-white/80 text-sm">{chapter.lessons.length} bài học • {chapter.lessons.length * LEVELS_PER_LESSON + PRACTICE_LEVELS_PER_CHAPTER} levels</p>
                  </div>
                </div>
              </div>

              {/* Lessons and Levels */}
              {chapter.lessons.map((lesson, lessonIndex) => {
                const lessonGlobalStart = globalLevelIndex + lessonIndex * LEVELS_PER_LESSON;
                
                return (
                  <div key={lesson.id} className="mb-8">
                    {/* Lesson Header */}
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <BookOpen className="w-5 h-5 text-green-400" />
                      <h3 className="text-white font-semibold text-sm">{lesson.name}</h3>
                    </div>
                    
                    {/* Level Path - Zigzag */}
                    <div className="relative space-y-4 px-8">
                      {/* 10 màn học thường */}
                      {Array.from({ length: LEVELS_PER_LESSON }).map((_, levelIndex) => (
                        renderLevelNode(
                          chapter.id, 
                          lesson.id, 
                          levelIndex, 
                          lessonGlobalStart + levelIndex
                        )
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* 2 MÀN THỰC HÀNH CUỐI CHƯƠNG */}
              <div className="mb-8">
                {/* Divider trước Practice */}
                <div className="flex items-center gap-2 py-4 px-4">
                  <div className="flex-1 h-px bg-purple-400/50"></div>
                  <div className="flex items-center gap-2 bg-purple-600/30 rounded-full px-4 py-2">
                    <Beaker className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-300 text-sm font-bold">THỰC HÀNH CHƯƠNG</span>
                    <Beaker className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 h-px bg-purple-400/50"></div>
                </div>
                
                {/* 2 màn thực hành cuối chương */}
                <div className="relative space-y-4 px-8">
                  {Array.from({ length: PRACTICE_LEVELS_PER_CHAPTER }).map((_, practiceIndex) => {
                    const practiceGlobalIndex = globalLevelIndex + chapter.lessons.length * LEVELS_PER_LESSON + practiceIndex;
                    return renderLevelNode(
                      chapter.id, 
                      99, // Sử dụng 99 làm lessonId (INTEGER) cho thực hành chương
                      practiceIndex,
                      practiceGlobalIndex,
                      true // isPractice = true
                    );
                  })}
                </div>
              </div>

              {/* Chapter Separator */}
              {chapterIndex < classInfo.chapters.length - 1 && (
                <div className="flex items-center gap-4 mt-8 mb-4">
                  <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
              )}

              {/* Học vượt cho chương CUỐI CÙNG - hiện ở cuối */}
              {chapterIndex === classInfo.chapters.length - 1 && (
                <div className="mt-8 mb-4">
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-yellow-400/30"></div>
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">CUỐI CHƯƠNG</span>
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <div className="flex-1 h-px bg-yellow-400/30"></div>
                  </div>
                  <div className="flex justify-center">
                    {renderChapterReview(chapter, globalLevelIndex + chapter.lessons.length * LEVELS_PER_LESSON + PRACTICE_LEVELS_PER_CHAPTER, progress?.completedLevels?.includes(`${chapter.id}_review_0`))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* End of Map */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-6 py-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-white font-bold">Hoàn thành {classInfo.name}!</span>
          </div>
        </div>
      </main>

      {/* Quick Navigation FAB */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button 
          onClick={() => avatarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="w-12 h-12 bg-green-600 hover:bg-green-500 rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Về vị trí hiện tại"
        >
          <Target className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Modal Học vượt */}
      {showSkipModal && selectedChapterForSkip && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-yellow-900 to-orange-900 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-12 h-12 text-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">🎓 Học vượt</h2>
            <h3 className="text-yellow-300 font-semibold mb-4">{selectedChapterForSkip.name}</h3>

            {progress?.completedLevels?.includes(`${selectedChapterForSkip.id}_review_0`) ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-6">
                <p className="text-green-300 font-bold">✨ Bạn đã hoàn thành! ✨</p>
                <p className="text-white text-sm mt-2">
                  Bạn đã thực hiện học vượt chương này trước đó. Bạn có thể vào chơi lại để luyện tập nhưng sẽ không nhận thêm quà tặng.
                </p>
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
                <p className="text-white mb-3">
                  Bạn đã nắm vững kiến thức chương này? Hoàn thành học vượt để:
                </p>
                <ul className="text-yellow-200 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Mở khóa tất cả level trong chương
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Nhận +500 điểm thưởng
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Nhận +500 xu thưởng
                  </li>
                </ul>
              </div>
            )}

            {!progress?.completedLevels?.includes(`${selectedChapterForSkip.id}_review_0`) && (
              <div className="bg-red-500/20 rounded-xl p-3 mb-6">
                <p className="text-red-300 text-sm">
                  ⚠️ Lưu ý: Bạn cần trả lời đúng 5 câu hỏi nâng cao để hoàn thành
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowSkipModal(false); setSelectedChapterForSkip(null); }}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleSkipChapter()}
                disabled={skipLoading}
                className={`flex-1 py-3 rounded-xl ${progress?.completedLevels?.includes(`${selectedChapterForSkip.id}_review_0`) ? 'bg-green-600 hover:bg-green-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400'} text-white font-semibold flex items-center justify-center gap-2`}
              >
                {skipLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {progress?.completedLevels?.includes(`${selectedChapterForSkip.id}_review_0`) ? <Sparkles className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                    {progress?.completedLevels?.includes(`${selectedChapterForSkip.id}_review_0`) ? 'Luyện tập' : 'Bắt đầu'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hết năng lượng */}
      {showNoEnergyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="game-card max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hết năng lượng!</h2>
            <p className="text-gray-300 mb-6">
              Bạn đã hết năng lượng để chơi. Hãy chơi Mini Game để nhận thêm năng lượng nhé!
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoEnergyModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={() => navigate('/minigame')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Mini Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
