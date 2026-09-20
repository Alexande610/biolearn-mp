import { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, MessageCircle, Send, X, Dna } from 'lucide-react';
import { supabase } from '../lib/supabase';

const normalizeText = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const buildHistoryPayload = (messages) => (
  messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-10)
    .map((msg) => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.text }] }))
);

const BIOLOGY_TOPICS = {
  6: '/document/Khoa học tự nhiên 6 kết nối tri thức với cuộc sống.txt',
  7: '/document/SGK KHTN 7 KNTT.txt',
  8: '/document/SGK KHTN 8 KNTT.txt',
  9: '/document/sach-giao-khoa-khoa-hoc-tu-nhien-9-ket-noi-tri-thuc-pdf.txt',
  10: '/document/sach-giao-khoa-sinh-hoc-10-ket-noi-tri-thuc-voi-cuoc-song.txt',
  11: '/document/Pdf sgk sinh 11 KNTT.txt',
  12: '/document/SGK Sinh 12 Kết Nối Tri Thức.txt',
};

const BIO_KEYWORDS = [
  'sinh hoc', 'te bao', 'gen', 'di truyen', 'he sinh thai', 'trao doi chat',
  'ho hap', 'quang hop', 'tieu hoa', 'tuan hoan', 'than kinh', 'noi tiet',
  'sinh san', 'tien hoa', 'vi sinh vat', 'virus', 'vi khuan', 'nam', 'thuc vat',
  'dong vat', 'da dang sinh hoc', 'bao ve moi truong', 'nguyen phan', 'giam phan',
  'dna', 'rna', 'protein', 'enzyme', 'cacbonhidrat', 'lipid', 'axit nucleic',
  'co the nguoi', 'suc khoe', 'benh', 'vac xin', 'khang the', 'mien dich'
];

const GREETINGS_LIST = [
  'hi', 'hello', 'helo', 'chao', 'xin chao', 'alo', 'chao ban', 'ê', 'hey', 'hola', 'hi ban', 'chao bot', 'chao ai'
];

// TẦNG 0: SMART CACHING LAYER
const getCachedAnswer = (query) => {
  try {
    const key = `bio_cache_${normalizeText(query).trim()}`;
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const setCachedAnswer = (query, answer) => {
  try {
    const key = `bio_cache_${normalizeText(query).trim()}`;
    sessionStorage.setItem(key, answer);
  } catch (e) {}
};

// COMPONENT ĐỊNH DẠNG VĂN BẢN (Loại bỏ các dấu sao *** và định dạng gạch đầu dòng chuẩn đẹp)
const FormattedMessage = ({ text, isUser }) => {
  if (!text) return null;
  if (isUser) return <span>{text}</span>;

  // Xử lý xuống dòng cho các đoạn gạch đầu dòng bị dính liền: ví dụ "* **Phần 1" -> "\n- **Phần 1"
  const preparedText = text
    .replace(/([^\n])\s*\*\s+\*\*/g, '$1\n- **')
    .replace(/([^\n])\s*\*\s+([A-ZÀ-Ỹ])/g, '$1\n- $2');

  const lines = preparedText.split('\n');

  const renderInline = (str) => {
    const parts = [];
    let remaining = str;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index).replace(/\*{1,3}/g, ''));
        }
        parts.push(
          <span key={key++} className="font-bold text-emerald-300">
            {boldMatch[1].replace(/\*{1,3}/g, '')}
          </span>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining.replace(/\*{1,3}/g, ''));
        break;
      }
    }
    return parts;
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Nhận diện gạch đầu dòng: -, *, •, hoặc 1., 2.
        const bulletMatch = trimmed.match(/^([*\-•]|\d+\.)\s+(.*)/);
        if (bulletMatch) {
          const isNum = /^\d+\./.test(bulletMatch[1]);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-emerald-400 font-bold select-none text-xs mt-0.5 shrink-0">
                {isNum ? bulletMatch[1] : '•'}
              </span>
              <div className="flex-1">{renderInline(bulletMatch[2])}</div>
            </div>
          );
        }

        return (
          <div key={idx} className="my-0.5">
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
};

const ChatboxAI = ({ user, onAchievementUnlocked }) => {
  const displayName = user?.displayName || user?.username || 'bạn';
  const userId = user?.uid || user?.firebaseUid || user?._id || user?.id || '';

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('chatboxOpen') === 'true';
  });
  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('chatboxHidden') === 'true';
  });
  const [messages, setMessages] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState('');

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const endRef = useRef(null);

  const intents = useMemo(() => ([
    {
      keywords: ['bai hoc', 'hoc tap', 'lop 10', 'lop 11', 'lop 12', 'lop 9', 'lop 8', 'lop 7', 'lop 6'],
      reply: 'Bạn có thể vào Thêm → Bài học để chọn lớp phù hợp.',
    },
    {
      keywords: ['mo phong', '3d', 'sinh hoc 3d'],
      reply: 'Bạn có thể vào Thêm → Mô phỏng 3D để xem mô phỏng.',
    },
    {
      keywords: ['game', 'tro choi', 'minigame', 'game 3d'],
      reply: 'Bạn có thể vào Thêm → Game 3D để trải nghiệm trò chơi.',
    },
    {
      keywords: ['ban do', 'map', 'ban do lop'],
      reply: 'Bạn vào Trang chủ → chọn lớp để mở bản đồ bài học.',
    },
    {
      keywords: ['nhiem vu', 'mission'],
      reply: 'Bạn vào mục Nhiệm vụ ở thanh điều hướng dưới.',
    },
    {
      keywords: ['bang xep hang', 'leaderboard'],
      reply: 'Bạn vào mục Xếp hạng/VS để xem bảng xếp hạng.',
    },
    {
      keywords: ['ho so', 'profile'],
      reply: 'Bạn vào Thêm → Hồ sơ để xem thông tin tài khoản.',
    },
  ]), []);

  const navPhrases = useMemo(
    () => [
      'mo muc',
      'mo trang',
      'vao muc',
      'vao trang',
      'den muc',
      'den trang',
      'toi muc',
      'toi trang',
      'di den',
      'di toi',
      'dan toi',
      'chi duong',
      'huong dan duong',
      'o dau',
      'tim o dau',
      'dao tao',
    ],
    []
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chatboxOpen', String(isOpen));
    }
  }, [isOpen]);

  // Load chat messages when userId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const saved = sessionStorage.getItem(`chatboxMessages_${userId}`);
      setMessages(saved ? JSON.parse(saved) : []);
      setLoadedUserId(userId);
    } else {
      setMessages([]);
      setLoadedUserId('');
    }
  }, [userId]);

  // Save chat messages only if they belong to the currently loaded user
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && loadedUserId === userId) {
      sessionStorage.setItem(`chatboxMessages_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId, loadedUserId]);

  useEffect(() => {
    if (isOpen && loadedUserId === userId && messages.length === 0) {
      setMessages([{
        id: `greet-${Date.now()}`,
        role: 'assistant',
        text: `Xin chào ${displayName}! Mình là trợ lý Sinh học BioLearn. Mình có thể hỗ trợ gì về kiến thức Sinh học từ lớp 6 đến lớp 12 cho bạn hôm nay?`,
      }]);
    }
  }, [displayName, isOpen, messages.length, userId, loadedUserId]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const resolveIntent = (text) => {
    const normalized = normalizeText(text);
    const hasNavTrigger = navPhrases.some((phrase) => normalized.includes(phrase));
    if (!hasNavTrigger) return null;
    return intents.find((intent) => intent.keywords.some((keyword) => normalized.includes(keyword)));
  };

  // TỐI ƯU HÓA LOGIC ĐỌC TÀI LIỆU SGK (SMART RAG CONTEXT WINDOW)
  const fetchKnowledge = async (text) => {
    try {
      const normalizedQuery = normalizeText(text);

      // Nếu chỉ là câu chào hoặc quá ngắn, không cần tải SGK (tiết kiệm 100% token)
      if (GREETINGS_LIST.includes(normalizedQuery) || normalizedQuery.length < 5) {
        return '';
      }

      // Xác định khối lớp nếu người dùng có chỉ định rõ
      let detectedGrade = null;
      for (let i = 6; i <= 12; i++) {
        if (
          normalizedQuery.includes(`lop ${i}`) ||
          normalizedQuery.includes(`l${i}`) ||
          normalizedQuery.includes(`khtn ${i}`) ||
          normalizedQuery.includes(`sinh ${i}`)
        ) {
          detectedGrade = i;
          break;
        }
      }

      // Tìm từ khóa sinh học trong câu hỏi
      const searchKeywords = BIO_KEYWORDS.filter((kw) => normalizedQuery.includes(normalizeText(kw)));

      // Nếu không nói rõ lớp và cũng không có từ khóa sinh học cụ thể,
      // để AI tự trả lời kiến thức chung súc tích, KHÔNG nhồi 16.000 ký tự mục lục
      if (!detectedGrade && searchKeywords.length === 0) {
        return '';
      }

      // Nếu có lớp rõ ràng thì chỉ tìm đúng lớp đó, tránh quét tràn lan
      const gradesToSearch = detectedGrade ? [detectedGrade] : [10, 11, 12, 9, 8, 7, 6];
      let matchedExcerpt = '';

      for (const grade of gradesToSearch) {
        const filePath = BIOLOGY_TOPICS[grade];
        if (!filePath) continue;

        try {
          const response = await fetch(filePath);
          if (!response.ok) continue;

          const content = await response.text();

          // Định vị đoạn văn chính xác chứa từ khóa liên quan
          if (searchKeywords.length > 0) {
            let bestIdx = -1;
            for (const kw of searchKeywords) {
              const idx = content.toLowerCase().indexOf(kw.toLowerCase());
              if (idx !== -1) {
                bestIdx = idx;
                break;
              }
            }

            if (bestIdx !== -1) {
              // Chỉ trích xuất đúng 1 đoạn văn ngắn (~1.200 ký tự), tiết kiệm 95% token
              const start = Math.max(0, bestIdx - 400);
              const end = Math.min(content.length, bestIdx + 1200);
              matchedExcerpt = `[Trích đoạn SGK Lớp ${grade}]:\n${content.substring(start, end).trim()}`;
              break; // Đã tìm thấy tài liệu phù hợp, dừng ngay không nạp thêm sách khác!
            }
          } else if (detectedGrade) {
            // Có chỉ định lớp nhưng không trùng từ khóa chính: lấy phần mở đầu ngắn (~800 ký tự)
            matchedExcerpt = `[Nội dung tổng quan Lớp ${grade}]:\n${content.substring(0, 800).trim()}`;
            break;
          }
        } catch (e) {
          console.warn(`Could not fetch textbook for grade ${grade}`, e);
        }
      }

      return matchedExcerpt.trim();
    } catch (err) {
      console.error('Error in fetchKnowledge:', err);
      return '';
    }
  };

  const fetchAiReply = async (text, context = '') => {
    // 1. Kiểm tra TẦNG 0 (Smart Cache) - nếu có sẵn trả về tức thì < 0.05s
    const cached = getCachedAnswer(text);
    if (cached) {
      console.log('⚡ [Smart Cache] Trả lời tức thì từ bộ nhớ đệm:', text);
      return cached;
    }

    try {
      console.log('🚀 Gửi yêu cầu tới BioLearn Multi-tier AI API (/api/chat)...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          context: context,
          history: messages.slice(-6),
          displayName: displayName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          // Lưu vào Smart Cache để lần sau trả lời tức thì
          setCachedAnswer(text, data.reply);
          return data.reply;
        }
      }

      throw new Error(`API Error: ${response.status}`);
    } catch (err) {
      console.warn('⚠️ Toàn bộ tầng AI online tạm thời bận, kích hoạt TẦNG 4 (Offline SGK Fallback)...', err);

      // TẦNG 4: BẢO HIỂM AN TOÀN - TRÍCH DẪN SGK OFFLINE TỰ ĐỘNG
      if (context && context.length > 30) {
        const cleanContext = context.replace(/\[Trích đoạn SGK.*?\]:/g, '').trim().substring(0, 800);
        return `📖 **Trích dẫn Sách Giáo Khoa:**\n\n${cleanContext}...\n\n*(Lưu ý: Do kết nối AI đang quá tải hoặc chập chờn, trợ lý BioLearn đã trích dẫn trực tiếp nội dung bài học từ Sách Giáo Khoa cho bạn nhé).*`;
      }

      return 'Hiện tại kết nối AI đang chập chờn hoặc quá tải. Bạn có thể mở mục **Bài học** hoặc **Mô phỏng 3D** trên thanh điều hướng để ôn tập nhé!';
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    addMessage(userMessage);
    setInput('');

    // Secret achievements are validated and awarded by the database. The
    // client never decides ownership and unaccented variants do not match.
    try {
      const { data: secretResult, error: secretError } = await supabase.rpc('unlock_chat_achievement', {
        p_phrase: trimmed,
      });

      if (!secretError && secretResult?.matched) {
        if (secretResult.awarded && onAchievementUnlocked) {
          await onAchievementUnlocked();
        }

        const achievementName = secretResult.achievement_id === 'hoang-sa-sovereignty'
          ? 'Hoàng Sa là của Việt Nam'
          : 'Trường Sa là của Việt Nam';

        addMessage({
          id: `achievement-${Date.now()}`,
          role: 'assistant',
          text: secretResult.awarded
            ? `🏅 Bạn đã mở khóa danh hiệu bí mật: **${achievementName}**!`
            : `🏅 Bạn đã sở hữu danh hiệu **${achievementName}**.`,
        });
        return;
      }
    } catch (achievementError) {
      console.warn('Không thể kiểm tra thành tựu bí mật:', achievementError);
    }

    // Xử lý các câu lệnh điều hướng nội bộ
    const intent = resolveIntent(trimmed);
    if (intent) {
      addMessage({
        id: `intent-${Date.now()}`,
        role: 'assistant',
        text: intent.reply,
      });
      return;
    }

    // Xử lý các câu chào hỏi xã giao (Phản hồi tức thì, không tốn token AI hay SGK)
    const normalized = normalizeText(trimmed);
    if (GREETINGS_LIST.includes(normalized)) {
      addMessage({
        id: `greet-${Date.now()}`,
        role: 'assistant',
        text: `Xin chào ${displayName}! Mình là trợ lý Sinh học BioLearn. Mình có thể hỗ trợ giải đáp bài học, hướng dẫn thực hành hay câu hỏi Sinh học nào cho bạn hôm nay?`,
      });
      return;
    }

    setIsTyping(true);
    try {
      const context = await fetchKnowledge(trimmed);
      const reply = await fetchAiReply(trimmed, context);

      addMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply,
      });
    } catch (error) {
      addMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'Hệ thống AI chưa sẵn sàng. Bạn vui lòng thử lại sau nhé.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };


  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        setIsHidden(false);
        localStorage.setItem('chatboxHidden', 'false');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isHidden) return undefined;
    let lastShake = 0;

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;
      const magnitude = Math.sqrt(
        (acceleration.x || 0) ** 2 +
        (acceleration.y || 0) ** 2 +
        (acceleration.z || 0) ** 2
      );

      const now = Date.now();
      if (magnitude > 26 && now - lastShake > 1200) {
        lastShake = now;
        setIsHidden(false);
        localStorage.setItem('chatboxHidden', 'false');
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isHidden]);

  const handleHide = () => {
    setShowConfirmModal(true);
  };

  const confirmHide = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        await DeviceMotionEvent.requestPermission();
      } catch (error) {
        // Ignore permission errors
      }
    }

    setIsHidden(true);
    setIsOpen(false);
    setShowConfirmModal(false);
    localStorage.setItem('chatboxHidden', 'true');
  };

  if (isHidden) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999]"
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-black/15 bg-white/70 dark:bg-white/80 backdrop-blur-xl text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Mở chatbox AI"
        >
          <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-black/5">
            <Dna className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <span className="font-bold tracking-tight text-black text-sm pr-1">BioAI</span>
        </button>
      ) : (
        <div className="chatbox-ai-container w-[90vw] max-w-[340px] h-[60vh] max-h-[450px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10"
          >
            <div>
              <p className="text-white font-semibold">ChatboxAI Sinh học</p>
              <p className="text-xs text-gray-300">Hỗ trợ bài học và hướng dẫn thực hành</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={handleHide}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Ẩn chatbox"
              >
                <EyeOff className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Đóng chatbox"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user'
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-white/10 text-gray-100'}`}
                >
                  <FormattedMessage text={message.text} isUser={message.role === 'user'} />
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-gray-200 rounded-2xl px-3 py-2 text-sm">
                  Đang soạn trả lời...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 px-3 py-3 bg-slate-900/80">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Nhập câu hỏi Sinh học..."
                className="flex-1 bg-white/5 text-white rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <EyeOff className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Ẩn Chatbox?</h3>
            <p className="text-gray-300 text-center text-sm mb-6 leading-relaxed">
              Bạn có muốn ẩn trợ lý AI? Đừng lo, bạn có thể mở lại bất cứ lúc nào:
              <br /><br />
              <span className="text-emerald-400 font-semibold">Máy tính:</span> Nhấn <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs border border-white/20">Ctrl + Shift + C</kbd>
              <br />
              <span className="text-emerald-400 font-semibold">Điện thoại:</span> <span className="text-white/80">Lắc máy</span> để gọi trợ lý.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmHide}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition"
              >
                Xác nhận ẩn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatboxAI;
