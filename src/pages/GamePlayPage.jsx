import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, Star, Lightbulb, Coins, Leaf,
  CheckCircle, XCircle, Trophy, Zap, Shuffle, Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Mapping classId sang file tài liệu tương ứng trong /document/
const documentMap = {
  '6': 'Khoa học tự nhiên 6 kết nối tri thức với cuộc sống.txt',
  '7': 'SGK KHTN 7 KNTT.txt',
  '8': 'SGK KHTN 8 KNTT.txt',
  '9': 'sach-giao-khoa-khoa-hoc-tu-nhien-9-ket-noi-tri-thuc-pdf.txt',
  '10': 'sach-giao-khoa-sinh-hoc-10-ket-noi-tri-thuc-voi-cuoc-song.txt',
  '11': 'Pdf sgk sinh 11 KNTT.txt',
  '12': 'SGK Sinh 12 Kết Nối Tri Thức.txt'
};

// Hàm chuyển số sang La Mã (I, II, III, IV, V...) để search trong TXT
const toRoman = (num) => {
  const map = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let result = '';
  for (let key in map) {
    const repeat = Math.floor(num / map[key]);
    if (repeat > 0) {
      result += key.repeat(repeat);
      num %= map[key];
    }
  }
  return result;
};

// Hàm lấy nội dung bổ sung từ document nếu DB không có (Dành cho màn Thực hành)
const fetchFallbackPracticalQuestions = async (classId, chapterId) => {
  try {
    const fileName = documentMap[String(classId)];
    if (!fileName) return null;

    const response = await fetch(`/document/${encodeURIComponent(fileName)}`);
    if (!response.ok) return null;
    
    const fullText = await response.text();
    
    // Tìm vị trí của chương trong text - HỖ TRỢ CẢ SỐ LÀ MÃ VÀ SỐ THƯỜNG
    const romanChapter = toRoman(parseInt(chapterId));
    const chapterPatterns = [
      `CHƯƠNG ${romanChapter}`,
      `Chương ${romanChapter}`,
      `CHƯƠNG ${chapterId}`,
      `Chương ${chapterId}`,
      `BÀI TẬP ÔN TẬP CHƯƠNG ${romanChapter}`,
      `PHẦN ${romanChapter}`,
      `CHƯƠNG ${romanChapter}.`
    ];
    
    let chapterStart = -1;
    for (const pattern of chapterPatterns) {
      chapterStart = fullText.indexOf(pattern);
      if (chapterStart !== -1) break;
    }
    
    // Nếu vẫn không tìm thấy, thử tìm "Bài X" (Vì đôi khi thực hành nằm trong một bài cụ thể)
    if (chapterStart === -1) {
      chapterStart = 0; // Fallback về đầu file nếu ko tìm thấy chương
    }
    
    // Tìm các đoạn Thực hành/Thí nghiệm trong phạm vi chương đó (hoặc bài lân cận)
    const practiceKeywords = ["Thực hành:", "THỰC HÀNH", "Bài Thực hành", "Thí nghiệm:", "Quan sát", "Tiến hành thí nghiệm"];
    let practiceStart = -1;
    let foundKeyword = "";
    
    for (const kw of practiceKeywords) {
      practiceStart = fullText.indexOf(kw, chapterStart);
      if (practiceStart !== -1) {
        foundKeyword = kw;
        break;
      }
    }
    
    // Trích xuất nội dung thực hành (khoảng 5000 ký tự để parse)
    const contentToParse = practiceStart !== -1 
      ? fullText.substring(practiceStart, practiceStart + 5000)
      : fullText.substring(chapterStart, chapterStart + 5000);

    // Parse nội dung để tìm các bước (Bước 1, Bước 2...)
    const steps = [];
    const stepRegex = /(?:Bước|Bước)\s*(\d+)[:.]?\s*([^]*?)(?=(?:Bước|Bước)\s*\d+|$)/gi;
    let match;
    while ((match = stepRegex.exec(contentToParse)) !== null && steps.length < 5) {
      const stepText = match[2].trim().split('\n')[0]; // Lấy dòng đầu tiên của bước
      if (stepText.length > 10) steps.push(stepText);
    }

    // Nếu không tìm thấy bước cụ thể, dùng logic giả lập cao cấp hơn dựa trên keyword
    const finalQuizzes = [];

    if (steps.length >= 3) {
      // 1. Câu hỏi Ordering dựa trên các bước thực tế tìm thấy
      finalQuizzes.push({
        question: 'Hãy sắp xếp đúng thứ tự các bước tiến hành thực hành/thí nghiệm sau đây:',
        type: 'ordering',
        correctOrder: steps.slice(0, 4)
      });
    }

    // Các câu hỏi MCQ dựa trên nội dung Lab
    finalQuizzes.push({
      question: `Mục đích quan trọng nhất của bài ${foundKeyword || 'thực hành'} này là:`,
      type: 'multiple-choice',
      options: [
        'Học sinh tự khám phá và kiểm chứng lý thuyết qua thực tiễn',
        'Lấy điểm số cao trong tiết học',
        'Chỉ để quan sát cho biết',
        'Tất cả đều sai'
      ],
      correctAnswer: 0,
      explanation: 'Thực hành sinh học giúp học sinh rèn luyện kĩ năng quan sát và tư duy khoa học.'
    });

    // Tìm dụng cụ (nếu có các từ như: ống nghiệm, kính hiển vi, panh, kéo...)
    const tools = [];
    const commonTools = ["kính hiển vi", "ống nghiệm", "panh", "kéo", "lam kính", "lamen", "đèn cồn", "giá sắt", "chậu thủy tinh"];
    commonTools.forEach(tool => {
      if (contentToParse.toLowerCase().includes(tool)) tools.push(tool);
    });

    if (tools.length > 0) {
      finalQuizzes.push({
        question: 'Dụng cụ/Hóa chất nào sau đây CẦN THIẾT cho bài thực hành này?',
        type: 'multiple-choice',
        options: [tools[0], 'Máy tính xách tay', 'Thủy tinh thể nhân tạo', 'Vệ tinh nhân tạo'],
        correctAnswer: 0
      });
    }

    // Câu hỏi Matching giả lập chức năng dụng cụ
    finalQuizzes.push({
      id: 4,
      type: 'matching',
      question: 'Nối các dụng cụ thực hành với chức năng tương ứng:',
      pairs: [
        { term: 'Kính hiển vi', definition: 'Dùng để quan sát các vật có kích thước siêu nhỏ' },
        { term: 'Ống hút nhỏ giọt', definition: 'Dùng để lấy và chuyển một lượng nhỏ chất lỏng' },
        { term: 'Lam kính', definition: 'Dùng để đặt mẫu vật lên quan sát' }
      ]
    });

    // Câu hỏi điền khuyết
    finalQuizzes.push({
      question: 'Điền từ còn thiếu vào nhận xét sau:',
      type: 'fillblank',
      sentence: 'Cần tuân thủ các quy tắc ______ khi làm việc trong phòng thực hành.',
      correctAnswer: 'an toàn'
    });

    return {
      title: `Thực hành: ${foundKeyword || ('Chương ' + chapterId)}`,
      game: finalQuizzes
    };
  } catch (err) {
    console.error("Lỗi khi fetch document fallback:", err);
    return null;
  }
};

// Chuyển đổi câu hỏi từ DB sang format game
const transformQuestionToGame = (q, index) => {
  // Normalize type to lowercase
  const qType = (q.type || '').toLowerCase();
  
  // Helper: Kiểm tra correctAnswer có phải là letter (A, B, C, D) hay number
  const isLetterAnswer = typeof q.correctAnswer === 'string' && /^[A-Da-d]$/i.test(q.correctAnswer);
  
  // Helper: Xử lý options có prefix "A. ", "B. " hay không
  const cleanOption = (opt) => {
    if (typeof opt === 'string' && /^[A-Da-d]\.\s/.test(opt)) {
      return opt.substring(3); // Bỏ prefix "A. ", "B. ", etc.
    }
    return opt;
  };
  
  // Helper: Chuyển correctAnswer thành letter
  const getCorrectLetter = () => {
    if (isLetterAnswer) {
      return q.correctAnswer.toUpperCase();
    }
    if (typeof q.correctAnswer === 'number') {
      return String.fromCharCode(65 + q.correctAnswer);
    }
    return 'A'; // default
  };
  
  // Xử lý format lesson lớp 7, 8, 9 (có answers array với id A, B, C, D)
  if (q.answers && Array.isArray(q.answers) && q.answers[0]?.id) {
    return {
      id: index + 1,
      type: 'quiz',
      question: q.question,
      answers: q.answers,
      correctAnswer: q.correctAnswer?.toUpperCase?.() || q.correctAnswer,
      hint: q.hint || '',
      explanation: q.explanation || ''
    };
  }
  
  // MATCHING
  if (qType === 'matching') {
    return {
      id: index + 1,
      type: 'matching',
      question: q.question || 'Nối các mục tương ứng:',
      pairs: (q.pairs || []).map((p, idx) => ({
        id: idx + 1,
        term: p.left || p.term || '',
        definition: p.right || p.definition || ''
      }))
    };
  }
  
  // ORDERING
  if (qType === 'ordering') {
    const items = [...(q.correctOrder || [])].sort(() => Math.random() - 0.5);
    return {
      id: index + 1,
      type: 'ordering',
      question: q.question,
      items: items,
      correctOrder: q.correctOrder || [],
      hint: q.hint || '',
      explanation: q.explanation || ''
    };
  }
  
  // FILL-IN-BLANK
  if (qType === 'fill-in-blank' || qType === 'fillblank') {
    const biologyOptions = [
      'kết thúc', 'mở đầu', 'mã hóa', 'điều hòa', 'thoái hóa',
      'tế bào', 'năng lượng', 'di truyền', 'protein', 'môi trường', 
      'sinh vật', 'quang hợp', 'hô hấp', 'phổ biến', 'đặc hiệu',
      'liên tục', 'nhân đôi', 'phiên mã', 'dịch mã', 'đột biến',
      'nhiễm sắc thể', 'nucleotide', 'codon', 'amino acid', 'enzyme'
    ];
    
    const correctAnswerLower = String(q.correctAnswer).toLowerCase().trim();
    const filteredOptions = biologyOptions.filter(o => o.toLowerCase() !== correctAnswerLower);
    const shuffledWrong = filteredOptions.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffledWrong, q.correctAnswer].sort(() => Math.random() - 0.5);
    
    return {
      id: index + 1,
      type: 'fillblank',
      sentence: q.question,
      answer: q.correctAnswer,
      hint: q.hint || '',
      explanation: q.explanation || '',
      options: allOptions
    };
  }
  
  // TRUE-FALSE
  if (qType === 'true-false') {
    return {
      id: index + 1,
      type: 'quiz',
      question: q.question,
      answers: [
        { id: 'A', text: 'Đúng' },
        { id: 'B', text: 'Sai' }
      ],
      correctAnswer: q.correctAnswer ? 'A' : 'B',
      hint: q.hint || '',
      explanation: q.explanation || ''
    };
  }
  
  // MULTIPLE-CHOICE or default with options
  if (qType === 'multiple-choice' || (q.options && Array.isArray(q.options))) {
    return {
      id: index + 1,
      type: 'quiz',
      question: q.question,
      answers: q.options.map((opt, idx) => ({ 
        id: String.fromCharCode(65 + idx), 
        text: cleanOption(opt)
      })),
      correctAnswer: getCorrectLetter(),
      hint: q.hint || '',
      explanation: q.explanation || ''
    };
  }
  
  // Default fallback
  const isCorrectAnswerString = typeof q.correctAnswer === 'string' && /^[A-D]$/i.test(q.correctAnswer);
  return {
    id: index + 1,
    type: 'quiz',
    question: q.question || 'Câu hỏi',
    answers: q.options ? q.options.map((opt, idx) => ({ id: String.fromCharCode(65 + idx), text: cleanOption(opt) })) : [{ id: 'A', text: 'Đáp án' }],
    correctAnswer: isCorrectAnswerString ? q.correctAnswer.toUpperCase() : (q.correctAnswer !== undefined && typeof q.correctAnswer === 'number' ? String.fromCharCode(65 + q.correctAnswer) : 'A'),
    hint: q.hint || '',
    explanation: q.explanation || ''
  };
};

// ================ MATCHING GAME COMPONENT ================
function MatchingGame({ data, onComplete, onWrongAnswer }) {
  const [terms, setTerms] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    console.log('MatchingGame data:', data);
    if (data?.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
      // Đảm bảo mỗi pair có id
      const pairsWithId = data.pairs.map((p, idx) => ({
        id: p.id || idx + 1,
        term: p.term || p.left || '',
        definition: p.definition || p.right || ''
      }));
      console.log('Pairs with ID:', pairsWithId);
      const shuffledTerms = [...pairsWithId].sort(() => Math.random() - 0.5);
      const shuffledDefs = [...pairsWithId].sort(() => Math.random() - 0.5);
      setTerms(shuffledTerms);
      setDefinitions(shuffledDefs);
    }
  }, [data]);

  const handleTermClick = (term) => {
    if (matchedPairs.includes(term.id)) return;
    setSelectedTerm(term);
    setWrongPair(null);
  };

  const handleDefClick = async (def) => {
    if (!selectedTerm || matchedPairs.includes(def.id)) return;
    if (selectedTerm.id === def.id) {
      const newMatched = [...matchedPairs, def.id];
      setMatchedPairs(newMatched);
      setScore(prev => prev + 10);
      setSelectedTerm(null);
      if (newMatched.length === data.pairs.length) {
        onComplete(score + 10);
      }
    } else {
      setWrongPair({ termId: selectedTerm.id, defId: def.id });
      onWrongAnswer();
      setTimeout(() => { setWrongPair(null); setSelectedTerm(null); }, 800);
    }
  };

  if (!data?.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
    return <div className="text-white text-center p-4">Đang tải dữ liệu nối từ...</div>;
  }
  
  // Nếu terms chưa được set từ useEffect, hiển thị loading
  if (terms.length === 0) {
    return <div className="text-white text-center p-4">Đang chuẩn bị câu hỏi...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      </div>
      {/* Hiển thị câu hỏi nếu có */}
      {data.question && (
        <div className="bg-purple-500/20 rounded-xl p-4 mb-4">
          <h2 className="text-white text-lg font-bold text-center">{data.question}</h2>
        </div>
      )}
      <div className="bg-blue-500/20 rounded-xl p-3 mb-4">
        <p className="text-blue-200 text-center"><Shuffle className="inline w-4 h-4 mr-1" />Nối các thuật ngữ với định nghĩa tương ứng</p>
      </div>
      <div className="mb-4">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 transition-all" style={{ width: `${(matchedPairs.length / data.pairs.length) * 100}%` }} />
        </div>
        <p className="text-center text-white/60 text-sm mt-1">{matchedPairs.length} / {data.pairs.length} cặp đã nối</p>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="space-y-2">
          <h3 className="text-white/60 text-sm font-semibold mb-2 text-center">Thuật ngữ</h3>
          {terms.map(term => {
            const isMatched = matchedPairs.includes(term.id), isSelected = selectedTerm?.id === term.id, isWrong = wrongPair?.termId === term.id;
            return (
              <button key={term.id} onClick={() => handleTermClick(term)} disabled={isMatched} 
                className={`w-full p-3 rounded-xl text-sm font-semibold transition-all border-2 ${isMatched ? 'bg-green-500/30 border-green-500 text-green-300' : isWrong ? 'bg-red-500/30 border-red-500 animate-shake' : isSelected ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-white/10 border-transparent hover:bg-white/20 text-white'}`}>
                {term.term}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <h3 className="text-white/60 text-sm font-semibold mb-2 text-center">Định nghĩa</h3>
          {definitions.map(def => {
            const isMatched = matchedPairs.includes(def.id), isWrong = wrongPair?.defId === def.id;
            return (
              <button key={def.id} onClick={() => handleDefClick(def)} disabled={isMatched || !selectedTerm} 
                className={`w-full p-3 rounded-xl text-xs transition-all border-2 ${isMatched ? 'bg-green-500/30 border-green-500 text-green-300' : isWrong ? 'bg-red-500/30 border-red-500 animate-shake' : selectedTerm ? 'bg-white/10 border-transparent hover:bg-white/20 text-white cursor-pointer' : 'bg-white/5 border-transparent text-white/60'}`}>
                {def.definition}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================ ORDERING GAME COMPONENT ================
function OrderingGame({ data, onComplete, onWrongAnswer }) {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (data?.items) {
      setItems([...data.items]);
    }
  }, [data]);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveItem = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
    setItems(newItems);
  };

  const handleSubmit = () => {
    const correct = JSON.stringify(items) === JSON.stringify(data.correctOrder);
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(prev => prev + 30);
    } else {
      onWrongAnswer();
    }
  };

  const handleNext = () => {
    onComplete(score);
  };

  if (!data) return <div className="text-white">Đang tải...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-800/80 to-green-900/80 rounded-2xl p-6 flex flex-col">
        <h2 className="text-white text-lg font-bold mb-4 text-center">{data.question}</h2>
        
        {showHint && data.hint && (
          <div className="bg-yellow-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-200 text-sm">{data.hint}</p>
          </div>
        )}

        <div className="space-y-2 mb-6">
          {items.map((item, index) => (
            <div
              key={index}
              draggable={!showResult}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-move ${
                showResult 
                  ? items[index] === data.correctOrder[index]
                    ? 'bg-green-500/30 border-2 border-green-500'
                    : 'bg-red-500/30 border-2 border-red-500'
                  : draggedIndex === index 
                    ? 'bg-blue-500/40 border-2 border-blue-400' 
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </span>
              <span className="text-white flex-1">{item}</span>
              {!showResult && (
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => moveItem(index, -1)} 
                    disabled={index === 0}
                    className="w-6 h-6 rounded bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => moveItem(index, 1)} 
                    disabled={index === items.length - 1}
                    className="w-6 h-6 rounded bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showResult && (
          <div className={`p-4 rounded-xl mb-4 ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-300 font-bold">Chính xác!</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-400" /><span className="text-red-300 font-bold">Chưa đúng!</span></>
              )}
            </div>
            {data.explanation && <p className="text-white/80 text-sm">{data.explanation}</p>}
            {!isCorrect && (
              <p className="text-yellow-300 text-sm mt-2">
                <strong>Thứ tự đúng:</strong> {data.correctOrder.join(' → ')}
              </p>
            )}
          </div>
        )}

        <div className="game-action-bar flex gap-3 mt-auto">
          {!showHint && !showResult && (
            <button onClick={() => setShowHint(true)} className="w-12 h-12 rounded-xl bg-yellow-500/30 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
            </button>
          )}
          <button
            onClick={showResult ? handleNext : handleSubmit}
            className="game-action-button flex-1 py-3 rounded-xl font-bold"
          >
            {showResult ? 'Hoàn thành' : 'Trả lời'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================ FILL BLANK GAME COMPONENT ================
function FillBlankGame({ data, onComplete, onWrongAnswer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  
  // Lấy câu hỏi hiện tại - hỗ trợ cả data.questions array và data trực tiếp
  const questions = data?.questions || (data?.sentence ? [data] : []);
  const currentQ = questions[currentIndex];

  useEffect(() => { 
    console.log('FillBlankGame data:', data);
    console.log('FillBlankGame currentQ:', currentQ);
    if (currentQ?.options && Array.isArray(currentQ.options) && currentQ.options.length > 0) {
      setShuffledOptions([...currentQ.options].sort(() => Math.random() - 0.5)); 
    } else if (currentQ?.answer) {
      // Fallback: tạo options từ answer nếu không có options
      const biologyOptions = [
        'kết thúc', 'mở đầu', 'mã hóa', 'điều hòa', 'thoái hóa',
        'tế bào', 'năng lượng', 'di truyền', 'protein', 'môi trường'
      ];
      const correctAnswer = String(currentQ.answer).toLowerCase().trim();
      const wrongOptions = biologyOptions.filter(o => o.toLowerCase() !== correctAnswer).slice(0, 3);
      const allOptions = [...wrongOptions, currentQ.answer].sort(() => Math.random() - 0.5);
      setShuffledOptions(allOptions);
    }
  }, [currentIndex, currentQ]);

  const handleSelect = (option) => { if (!showResult) setSelectedAnswer(option); };
  
  const handleSubmit = () => {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === currentQ.answer;
    setIsCorrect(correct); 
    setShowResult(true);
    if (correct) {
      setScore(prev => prev + 10);
    } else {
      onWrongAnswer();
    }
  };
  
  const handleNext = () => {
    if (currentIndex < questions.length - 1) { 
      setCurrentIndex(prev => prev + 1); 
      setSelectedAnswer(null); 
      setShowResult(false); 
      setShowHint(false); 
    } else { 
      onComplete(score); 
    }
  };

  const renderSentence = () => {
    if (!currentQ?.sentence) return null;
    // Hỗ trợ nhiều loại placeholder: ____, ______, ___, v.v.
    const parts = currentQ.sentence.split(/_{2,}/);
    return (
      <p className="text-xl text-white leading-relaxed text-center">
        {parts[0]}
        <span className={`inline-block min-w-[80px] px-3 py-1 mx-1 rounded-lg border-2 border-dashed ${showResult && isCorrect ? 'bg-green-500/30 border-green-500' : showResult && !isCorrect ? 'bg-red-500/30 border-red-500' : selectedAnswer ? 'bg-blue-500/30 border-blue-400' : 'bg-white/10 border-white/50'}`}>
          {selectedAnswer || '...'}
        </span>
        {parts[1] || ''}
      </p>
    );
  };

  if (!currentQ) {
    return <div className="text-white text-center p-4">Đang tải câu hỏi điền từ...</div>;
  }
  
  // Nếu chưa có options, hiển thị loading
  if (shuffledOptions.length === 0) {
    return <div className="text-white text-center p-4">Đang chuẩn bị đáp án...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-green-400 transition-all" style={{ width: `${((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <p className="text-center text-white/60 text-sm mb-6">Câu {currentIndex + 1} / {questions.length}</p>
      <div className="bg-purple-500/20 rounded-xl p-3 mb-4">
        <p className="text-purple-200 text-center"><Edit3 className="inline w-4 h-4 mr-1" />Điền từ thích hợp vào chỗ trống</p>
      </div>
      <div className="game-card flex flex-col justify-center">
        {renderSentence()}
        {showHint && currentQ.hint && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200">{currentQ.hint}</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {shuffledOptions.map((option, idx) => {
            let bgColor = 'bg-white/10 hover:bg-white/20', borderColor = 'border-transparent';
            if (showResult) { 
              if (option === currentQ.answer) { bgColor = 'bg-green-500/30'; borderColor = 'border-green-500'; } 
              else if (option === selectedAnswer && !isCorrect) { bgColor = 'bg-red-500/30'; borderColor = 'border-red-500'; } 
            } else if (selectedAnswer === option) { 
              bgColor = 'bg-blue-500/30'; borderColor = 'border-blue-400'; 
            }
            return (
              <button key={idx} onClick={() => handleSelect(option)} disabled={showResult} 
                className={`p-4 rounded-xl font-semibold transition-all border-2 ${bgColor} ${borderColor} text-white`}>
                {option}
              </button>
            );
          })}
        </div>
        {showResult && (
          <div className={`mt-4 p-3 rounded-xl text-center ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {isCorrect ? '🎉 Chính xác!' : `❌ Sai! Đáp án đúng: ${currentQ.answer}`}
            </p>
          </div>
        )}
      </div>
      <div className="game-action-bar flex gap-3">
        {!showResult ? (
          <>
            <button onClick={() => setShowHint(true)} disabled={showHint} 
              className={`flex items-center gap-2 px-4 py-3 rounded-xl ${showHint ? 'bg-gray-600 cursor-not-allowed' : 'bg-yellow-500/30 hover:bg-yellow-500/50'}`}>
              <Lightbulb className="w-5 h-5 text-yellow-400" />
            </button>
            <button onClick={handleSubmit} disabled={!selectedAnswer} 
              className="game-action-button flex-1 py-3 rounded-xl font-bold disabled:cursor-not-allowed">
              Kiểm tra
            </button>
          </>
        ) : (
          <button onClick={handleNext} className="game-action-button flex-1 py-3 rounded-xl font-bold">
            {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );
}

// ================ QUIZ GAME COMPONENT ================
function QuizGame({ questions, onComplete, onWrongAnswer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const currentQuestion = questions[currentIndex];
  
  // Helper: so sánh đáp án (case-insensitive)
  const compareAnswers = (a, b) => {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return String(a).toUpperCase() === String(b).toUpperCase();
  };

  const handleAnswerSelect = (answerId) => {
    if (showResult) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || showResult) return;
    const correct = compareAnswers(selectedAnswer, currentQuestion.correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(prev => prev + 10);
    } else {
      onWrongAnswer();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      onComplete(score);
    }
  };

  if (!currentQuestion) return <div className="text-white">Đang tải...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="text-center text-white/60 text-sm mb-4">Câu {currentIndex + 1} / {questions.length}</p>
      
      <div className="game-card flex flex-col">
        <h2 className="text-xl text-white font-bold mb-6 leading-relaxed">{currentQuestion.question}</h2>
        {showHint && currentQuestion.hint && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200">{currentQuestion.hint}</span>
            </div>
          </div>
        )}
        <div className="space-y-3 flex-1">
          {currentQuestion.answers?.map((answer) => {
            const isCorrectAnswer = compareAnswers(answer.id, currentQuestion.correctAnswer);
            const isSelectedAnswer = compareAnswers(answer.id, selectedAnswer);
            let bgColor = 'bg-white/10 hover:bg-white/20', borderColor = 'border-transparent';
            if (showResult) { 
              if (isCorrectAnswer) { 
                bgColor = 'bg-green-500/30'; borderColor = 'border-green-500'; 
              } else if (isSelectedAnswer && !isCorrect) { 
                bgColor = 'bg-red-500/30'; borderColor = 'border-red-500'; 
              } 
            } else if (isSelectedAnswer) { 
              bgColor = 'bg-green-600/30'; borderColor = 'border-green-400'; 
            }
            return (
              <button key={answer.id} onClick={() => handleAnswerSelect(answer.id)} disabled={showResult} 
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${bgColor} ${borderColor}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isSelectedAnswer ? 'bg-green-500 text-white' : 'bg-white/20 text-white'}`}>
                    {answer.id}
                  </span>
                  <span className="text-white flex-1">{answer.text}</span>
                  {showResult && isCorrectAnswer && (<CheckCircle className="w-6 h-6 text-green-400" />)}
                  {showResult && isSelectedAnswer && !isCorrect && (<XCircle className="w-6 h-6 text-red-400" />)}
                </div>
              </button>
            );
          })}
        </div>
        {showResult && (
          <div className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {isCorrect ? '🎉 Chính xác!' : '❌ Sai rồi!'}
            </p>
            {/* Hiển thị đáp án đúng khi sai */}
            {!isCorrect && currentQuestion.correctAnswer && (
              <p className="text-yellow-300 mt-2">
                <strong>Đáp án đúng:</strong> {currentQuestion.correctAnswer}
                {currentQuestion.answers?.find(a => compareAnswers(a.id, currentQuestion.correctAnswer))?.text && 
                  ` - ${currentQuestion.answers.find(a => compareAnswers(a.id, currentQuestion.correctAnswer)).text}`}
              </p>
            )}
            {currentQuestion.explanation && <p className="text-white/80 mt-2">{currentQuestion.explanation}</p>}
          </div>
        )}
      </div>
      <div className="game-action-bar flex gap-3">
        {!showResult ? (
          <>
            <button onClick={() => setShowHint(true)} disabled={showHint} 
              className={`flex items-center gap-2 px-4 py-3 rounded-xl ${showHint ? 'bg-gray-600 cursor-not-allowed' : 'bg-yellow-500/30 hover:bg-yellow-500/50'}`}>
              <Lightbulb className="w-5 h-5 text-yellow-400" />
            </button>
            <button onClick={handleSubmit} disabled={!selectedAnswer} 
              className="game-action-button flex-1 py-3 rounded-xl font-bold disabled:cursor-not-allowed">
              Trả lời
            </button>
          </>
        ) : (
          <button onClick={handleNext} className="game-action-button flex-1 py-3 rounded-xl font-bold">
            {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );
}

// ================ MAIN GAME PAGE ================
export default function GamePlayPage() {
  const { classId, chapterId, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '0');
  const requestedType = searchParams.get('type') || ''; // Game type từ URL
  const navigate = useNavigate();
  const { user, userStats, updateStats } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [gameQuestions, setGameQuestions] = useState([]);
  const [gameType, setGameType] = useState('quiz');
  const [gameWon, setGameWon] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hasWrongAnswer, setHasWrongAnswer] = useState(false); // Theo dõi có sai câu nào không

  // Fetch lesson data from Supabase
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetLevel = (requestedType === 'skip-challenge' || level === 'challenge') ? 9 : parseInt(level);
        
        console.log(`Đang tải bài học: Lớp ${classId}, Chương ${chapterId}, Bài ${lessonId}, Level ${targetLevel}`);
        const { data, error } = await supabase
        .from('lesson_questions')
        .select('*')
        .eq('class_id', classId)
        .eq('chapter_id', chapterId)
        .eq('lesson_id', lessonId)
        .eq('level', targetLevel)
        .single();

      if (error || !data) {
        // FALLBACK: Nếu là màn thực hành (lessonId=99), thử load từ document
        if (lessonId === '99' || lessonId === 99) {
          const fallbackData = await fetchFallbackPracticalQuestions(classId, chapterId);
          if (fallbackData) {
            setLessonData(fallbackData);
            processLessonQuizzes(fallbackData.game);
            setLoading(false);
            return;
          }
        }

        setLoading(false);
        setError('Không tìm thấy dữ liệu cho màn chơi này. Đang quay lại bản đồ...');
        setTimeout(() => navigate(`/map/${classId}`), 3000);
        return;
      }

        setLessonData(data);
        
        // Lấy câu hỏi từ game
        let gameQuizzes = [];
        if (data.game) {
          if (Array.isArray(data.game)) {
            gameQuizzes = data.game;
          } else if (data.game.quizzes && Array.isArray(data.game.quizzes)) {
            gameQuizzes = data.game.quizzes;
          }
        }
        
        processLessonQuizzes(gameQuizzes);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Không thể tải bài học. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    // Helper function để xử lý quizzes sau khi fetch xong (dùng chung cho DB và Fallback)
    const processLessonQuizzes = (gameQuizzes) => {
        if (gameQuizzes && gameQuizzes.length > 0) {
          // Map loại game từ URL sang type trong data
          const typeMapping = {
            'quiz': ['multiple-choice', 'true-false', 'quiz'],
            'matching': ['matching'],
            'ordering': ['ordering'],
            'fillblank': ['fill-in-blank', 'fillblank'],
            'practice': ['matching', 'ordering', 'fill-in-blank', 'fillblank', 'multiple-choice'] // Practice ưu tiên interactive
          };
          
          let selectedQuizzes = [];
          
          // Nếu có requestedType, ưu tiên lọc theo type đó
          if (requestedType && typeMapping[requestedType]) {
            const allowedTypes = typeMapping[requestedType];
            const filteredByType = gameQuizzes.filter(q => 
              allowedTypes.includes(q.type?.toLowerCase())
            );
            
            if (filteredByType.length > 0) {
              // Shuffle và chọn câu hỏi theo type
              const shuffled = [...filteredByType].sort(() => Math.random() - 0.5);
              selectedQuizzes = shuffled.slice(0, 5); // Tăng lên 5 câu để đa dạng
            }
          }
          
          // Fallback: nếu không tìm thấy câu hỏi theo type, chọn ngẫu nhiên
          if (selectedQuizzes.length === 0) {
            const shuffled = [...gameQuizzes].sort(() => Math.random() - 0.5);
            selectedQuizzes = shuffled.slice(0, 5); // Tăng lên 5 câu để đa dạng
          }
          
          // Chuyển đổi format và xác định game type
          const transformed = selectedQuizzes.map((q, idx) => transformQuestionToGame(q, idx));
          console.log('Transformed questions:', transformed);
          
          // Xác định game type dựa trên câu hỏi đầu tiên
          const firstType = transformed[0]?.type || 'quiz';
          console.log('First type:', firstType);
          
          if (firstType === 'matching') {
            setGameType('matching');
            // Truyền toàn bộ data matching bao gồm question và pairs
            const matchingData = { 
              question: transformed[0].question,
              pairs: transformed[0].pairs 
            };
            console.log('Setting matching data:', matchingData);
            setGameQuestions(matchingData);
          } else if (firstType === 'ordering') {
            setGameType('ordering');
            setGameQuestions(transformed[0]); // Pass the ordering question data
          } else if (firstType === 'fillblank') {
            setGameType('fillblank');
            // Đảm bảo questions array không rỗng
            const fillblankQuestions = transformed.filter(q => q.type === 'fillblank');
            console.log('Fillblank questions:', fillblankQuestions);
            if (fillblankQuestions.length > 0) {
              const fillData = { questions: fillblankQuestions };
              console.log('Setting fillblank data:', fillData);
              setGameQuestions(fillData);
            } else {
              // Fallback nếu không có fillblank, chuyển về quiz
              setGameType('quiz');
              setGameQuestions(transformed.filter(q => q.type === 'quiz'));
            }
          } else {
            setGameType('quiz');
            setGameQuestions(transformed.filter(q => q.type === 'quiz'));
          }
        } else {
          setError('Bài học này chưa có câu hỏi');
        }
    };

    fetchLesson();
  }, [classId, chapterId, lessonId, level, requestedType]);

  // Handle energy consumption on wrong answer
  const handleWrongAnswer = async () => {
    setHasWrongAnswer(true); // Đánh dấu đã sai ít nhất một câu
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;

      // Lấy thể lực hiện tại từ profile để đảm bảo chính xác nhất
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stamina')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      const currentStamina = profile?.stamina || 0;
      const newStamina = Math.max(0, currentStamina - 1);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stamina: newStamina })
        .eq('id', userId);
      
      if (updateError) throw updateError;
        
      if (updateStats) await updateStats(); // Cập nhật lại stats ở context
    } catch (err) {
      console.error('Error consuming energy:', err);
    }
  };

  // Handle game completion
  const handleGameComplete = async (gameScore) => {
    setFinalScore(gameScore);
    setGameWon(true);
    
    // Chỉ lưu progress và thưởng khi hoàn thành màn HOÀN HẢO (không sai câu nào)
    if (!hasWrongAnswer) {
      try {
        const userId = user?.id || user?.uid;
        if (!userId) return;

        const isSkipChallenge = requestedType === 'skip-challenge';
        const currentClassProgress = userStats?.class_progress?.[classId] || { completedLevels: [], levelStars: {} };
        
        let newXp = (userStats?.xp || 0);
        let newCoins = (userStats?.coins || 0);
        let finalCompletedLevels = [...currentClassProgress.completedLevels];

        if (isSkipChallenge) {
          // Kiểm tra xem đã hoàn thành học vượt chương này chưa để tránh lạm dụng
          const isAlreadyCompleted = currentClassProgress.completedLevels.includes(`${chapterId}_review_0`);
          
          if (!isAlreadyCompleted) {
            // Thưởng lớn cho học vượt lần đầu
            newXp += 500;
            newCoins += 500;
            // Đánh dấu toàn bộ chương đã xong mốc review
            finalCompletedLevels.push(`${chapterId}_review_0`);
          } else {
            console.log("Học vượt đã hoàn thành trước đó, không cộng thêm thưởng.");
          }
        } else {
          // Thưởng bình thường - Lưu ý: level là index 0-9
          newXp += 30;
          newCoins += 30;
          const key = `${chapterId}_${lessonId}_${level}`;
          if (!finalCompletedLevels.includes(key)) {
            finalCompletedLevels.push(key);
          }
        }

        // Update via Backend RPC
        const { data: updateData, error: updateError } = await supabase.rpc('reward_user', {
          p_user_id: userId,
          p_xp_gain: isSkipChallenge ? 500 : 30,
          p_coin_gain: isSkipChallenge ? 500 : 30,
          p_reward_type: 'map',
          p_class_id: String(classId)
        });

        if (updateError) {
          console.error('RPC Error:', updateError);
        } else {
          console.log('Reward Success. Updated Daily Missions:', updateData);
        }

        // Cập nhật class_progress (RPC không lo phần này)
        await supabase
          .from('profiles')
          .update({
            class_progress: {
              ...userStats?.class_progress,
              [classId]: {
                ...currentClassProgress,
                completedLevels: Array.from(new Set(finalCompletedLevels))
              }
            }
          })
          .eq('id', userId);

        if (updateError) throw updateError;
        
        // Refresh local state
        if (updateStats) await updateStats();
      } catch (err) { 
        console.error('Error saving progress:', err); 
      }
    }
  };

  // Retry level
  const retryLevel = () => {
    setGameWon(false);
    setFinalScore(0);
    setHasWrongAnswer(false);
    // Re-fetch to get new random questions
    window.location.reload();
  };

  // Go to next level
  const goToNextLevel = () => {
    const nextLevel = level + 1;
    navigate(`/play/${classId}/${chapterId}/${lessonId}?level=${nextLevel}`);
    // Reload để fetch dữ liệu level mới
    window.location.reload();
  };

  // Get game title based on type
  const getGameTitle = () => {
    switch (gameType) {
      case 'matching': return '🔗 Nối từ';
      case 'fillblank': return '✏️ Điền từ';
      case 'ordering': return '📊 Sắp xếp';
      default: return '📝 Trắc nghiệm';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">{error}</p>
          <button onClick={() => navigate(`/map/${classId}`)} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom, #0f2d1e, #143e29, #0a1f14)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <header className="bg-green-800/50 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(`/map/${classId}`)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-white font-bold">{getGameTitle()}</h1>
                <p className="text-white/60 text-sm">{lessonData?.title || `Bài ${lessonId}`}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-700/50 px-2.5 py-1 rounded-lg">
                <Leaf className="w-4 h-4 text-green-300 animate-pulse" />
                <span className="text-white text-sm font-semibold">{userStats?.stamina ?? userStats?.energy ?? 0}</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-600/50 px-2.5 py-1 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-sm font-semibold">{userStats?.coins ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        {gameType === 'matching' && (
          <MatchingGame 
            data={gameQuestions} 
            onComplete={handleGameComplete} 
            onWrongAnswer={handleWrongAnswer}
          />
        )}
        {gameType === 'ordering' && (
          <OrderingGame 
            data={gameQuestions} 
            onComplete={handleGameComplete}
            onWrongAnswer={handleWrongAnswer}
          />
        )}
        {gameType === 'fillblank' && (
          <FillBlankGame 
            data={gameQuestions} 
            onComplete={handleGameComplete}
            onWrongAnswer={handleWrongAnswer}
          />
        )}
        {gameType === 'quiz' && gameQuestions.length > 0 && (
          <QuizGame 
            questions={gameQuestions} 
            onComplete={handleGameComplete}
            onWrongAnswer={handleWrongAnswer}
          />
        )}
      </main>

      {/* Victory Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="game-card max-w-md w-full text-center">
            <div className={`w-20 h-20 ${hasWrongAnswer ? 'bg-red-500/30' : 'bg-yellow-500/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {hasWrongAnswer ? (
                <XCircle className="w-12 h-12 text-red-400" />
              ) : (
                <Trophy className="w-12 h-12 text-yellow-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {hasWrongAnswer ? '😢 Chưa hoàn hảo!' : '🎉 Hoàn thành!'}
            </h2>
            {hasWrongAnswer ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                <p className="text-red-300 font-semibold text-lg">Bạn cần luyện tập thêm!</p>
                <p className="text-red-200/80 text-sm mt-2">Hãy củng cố kiến thức và trả lời đúng 100% để mở khóa màn chơi tiếp theo.</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <XCircle className="w-3 h-3" />
                  <span>Không nhận được điểm và tiền xu</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-2">
                {requestedType === 'skip-challenge' && userStats?.class_progress?.[classId]?.completedLevels?.includes(`${chapterId}_review_0`) ? (
                  <div className="text-green-400 font-medium py-2">
                    ✨ Chế độ luyện tập: Bạn đã hoàn thành thử thách này trước đó!
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Điểm thưởng</span>
                      <span className="text-yellow-400 font-bold">+{requestedType === 'skip-challenge' ? 500 : 30}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tiền xu</span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Coins className="w-4 h-4" />+{requestedType === 'skip-challenge' ? 500 : 30}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate(`/map/${classId}`)} className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold">
                Quay lại
              </button>
              {hasWrongAnswer ? (
                <button onClick={retryLevel} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold">
                  🔄 Chơi lại
                </button>
              ) : (
                <button onClick={goToNextLevel} className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold">
                  ➡️ Màn sau
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
