import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Save, CheckCircle2, 
  HelpCircle, Layers, Settings, Gamepad2, AlertCircle, RefreshCw, X, Lightbulb, FileText, Sun, Moon,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { reportSystemError } from '../lib/observability';
import { ACTIVE_STATIONS } from '../data/stationCatalog';
import { validatePublishedStage } from '../utils/stationContent';
import { stationReleaseVersion, toAdminStationGame } from '../utils/stationAdminView';

const GAME_TYPES = [
  { id: 'quiz', name: 'Trắc Nghiệm (Quiz)' },
  { id: 'match', name: 'Nối Chữ (Word Matching)' },
  { id: 'fill', name: 'Điền Từ Còn Thiếu' },
  { id: 'category', name: 'Phân Loại Nhóm' },
  { id: 'dragdrop', name: 'Kéo Thả Hoàn Thành Câu' }
];

export default function AdminStationPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAuth();
  const { showToast } = useToast();

  const [selectedGrade, setSelectedGrade] = useState(6);
  const [selectedStationId, setSelectedStationId] = useState('g6_st1');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedGameTypeToAdd, setSelectedGameTypeToAdd] = useState('quiz');

  const [loadingDB, setLoadingDB] = useState(false);
  const [savingDB, setSavingDB] = useState(false);
  const [dataMode, setDataMode] = useState('v2');
  const [release, setRelease] = useState(null);
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);

  // Danh sách trò chơi trong Ải
  const [gamesList, setGamesList] = useState([]);

  // Modal State Chỉnh Sửa Chi Tiết Mini-Game
  const [editingGame, setEditingGame] = useState(null);
  const stationOptions = ACTIVE_STATIONS[selectedGrade] || ACTIVE_STATIONS[6];
  const selectedStation = stationOptions.find(station => station.id === selectedStationId) || stationOptions[0];
  const stationDays = Array.from(
    { length: selectedStation.daysCount },
    (_, index) => index + 1
  );
  const selectedDayDisplay = selectedStation.startDay + selectedDay - 1;

  // 1. TẢI CÂU HỎI THỰC TẾ TỪ SUPABASE DATABASE
  const fetchQuestionsFromSupabase = async () => {
    const sequence = ++loadSequence.current;
    setLoadingDB(true);
    setGamesList([]);
    setRelease(null);
    setLoadError('');
    try {
      if (dataMode === 'v2') {
        const version = stationReleaseVersion(selectedGrade, selectedStationId);
        const { data: releaseRow, error: releaseError } = await supabase
          .from('station_content_releases')
          .select('id, version, title, status, notes')
          .eq('version', version)
          .eq('grade', selectedGrade)
          .eq('station_id', selectedStationId)
          .single();
        if (releaseError) throw releaseError;
        const { data: items, error: itemsError } = await supabase
          .from('station_content_items')
          .select('id, game_index, game_type, title, learning_objective, public_content, answer_key, source_refs')
          .eq('release_id', releaseRow.id)
          .eq('day_index', selectedDay)
          .order('game_index', { ascending: true });
        if (itemsError) throw itemsError;
        if (!items || items.length !== 5 || new Set(items.map(item => item.game_type)).size !== 5) {
          throw new Error('Ải V2 chưa có đủ năm trò chơi khác loại.');
        }
        if (sequence !== loadSequence.current) return;
        setRelease(releaseRow);
        setGamesList(items.map(toAdminStationGame));
        return;
      }
      const { data, error } = await supabase
        .from('station_questions')
        .select('*')
        .eq('grade', selectedGrade)
        .eq('station_id', selectedStationId)
        .eq('day_index', selectedDay)
        .order('game_index', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        if (sequence !== loadSequence.current) return;
        setGamesList(data.map(item => ({
          id: item.id || Date.now(),
          type: item.game_type,
          title: item.title,
          data: item.content
        })));
      } else {
        if (sequence === loadSequence.current) setLoadError('Bảng câu hỏi cũ không có dữ liệu cho ải này.');
      }
    } catch (err) {
      if (sequence !== loadSequence.current) return;
      console.error('Lỗi tải dữ liệu trạm:', err);
      reportSystemError(err, {
        action: 'station_content_load_failed',
        component: 'AdminStationPage',
        operation: 'fetchQuestionsFromSupabase',
        supabaseCode: err.code,
      });
      setLoadError(`Không tải được dữ liệu ${dataMode === 'v2' ? 'V2' : 'cũ'}: ${err.message || 'Lỗi không xác định'}`);
    }
    finally { if (sequence === loadSequence.current) setLoadingDB(false); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestionsFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedStationId, selectedDay, dataMode]);

  // NÚT THÊM TRÒ CHƠI LUÔN LUÔN HIỂN THỊ (CÓ SELECT CHỌN LOẠI GAME)
  const handleAddGame = () => {
    if (gamesList.length >= 5) {
      showToast('🚫 CẢNH BÁO TRÒ CHƠI TỐI ĐA TRONG ẢI ĐẠT MỨC 5 TRÒ CHƠI KHÔNG THỂ THÊM!', 'error');
      return;
    }
    if (gamesList.some((game) => game.type === selectedGameTypeToAdd)) {
      showToast('Mỗi ải chỉ được có một trò chơi cho mỗi loại.', 'error');
      return;
    }
    
    let defaultData = {};
    if (selectedGameTypeToAdd === 'quiz') {
      defaultData = { question: 'Câu hỏi mới?', options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'], answerIndex: 0, hint: 'Gợi ý câu trả lời...', explanation: 'Giải thích chi tiết khi trả lời sai...' };
    } else if (selectedGameTypeToAdd === 'match') {
      defaultData = { pairs: [{ left: 'Từ A', right: 'Nghĩa A' }, { left: 'Từ B', right: 'Nghĩa B' }], hint: 'Gợi ý...', explanation: 'Giải thích...' };
    } else if (selectedGameTypeToAdd === 'fill') {
      defaultData = { sentence: 'Điền [blank] vào chỗ trống.', correctAnswer: 'đáp án', hint: 'Gợi ý...', explanation: 'Giải thích...' };
    } else if (selectedGameTypeToAdd === 'category') {
      defaultData = { categories: ['Nhóm 1', 'Nhóm 2'], items: [{ name: 'Mục 1', catIndex: 0 }, { name: 'Mục 2', catIndex: 1 }], hint: 'Gợi ý...', explanation: 'Giải thích...' };
    } else if (selectedGameTypeToAdd === 'dragdrop') {
      defaultData = { textWithBlanks: 'Kéo từ [blank] vào câu.', bankWords: ['đúng', 'sai'], correctWord: 'đúng', hint: 'Gợi ý...', explanation: 'Giải thích...' };
    }

    const newGame = {
      id: Date.now(),
      type: selectedGameTypeToAdd,
      title: `Trò chơi Mới (${GAME_TYPES.find(t => t.id === selectedGameTypeToAdd)?.name})`,
      data: defaultData
    };

    setGamesList(prev => [...prev, newGame]);
    showToast(`Đã thêm trò chơi dạng ${GAME_TYPES.find(t => t.id === selectedGameTypeToAdd)?.name}!`, 'success');
  };

  const handleDeleteGame = (id) => {
    setGamesList(prev => prev.filter(g => g.id !== id));
    showToast('Đã xóa trò chơi khỏi danh sách chỉnh sửa!', 'info');
  };

  const handleMoveGame = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gamesList.length) return;
    setGamesList(current => {
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
    showToast('Đã chuyển trò chơi ' + (direction < 0 ? 'lên trên' : 'xuống dưới') + '. Hãy bấm Lưu Cấu Hình Database để áp dụng.', 'info');
  };

  // 3. LƯU CẤU HÌNH THỰC TẾ 100% VÀO SUPABASE DATABASE (BẢNG STATION_QUESTIONS)
  const handleSaveToDatabase = async () => {
    setSavingDB(true);
    try {
      const validationErrors = validatePublishedStage({
        grade: selectedGrade,
        stationId: selectedStationId,
        dayIndex: selectedDay,
        games: gamesList,
      });
      if (validationErrors.length > 0) {
        showToast(`Không thể lưu: ${validationErrors[0]}`, 'error');
        setSavingDB(false);
        return;
      }

      // 1. Xóa tất cả câu hỏi có game_index vượt quá số lượng game hiện tại (nếu Admin đã bấm xóa)
      await supabase
        .from('station_questions')
        .delete()
        .eq('grade', selectedGrade)
        .eq('station_id', selectedStationId)
        .eq('day_index', selectedDay)
        .gt('game_index', gamesList.length);

      // 2. Chuẩn bị payload cho Supabase
      const payload = gamesList.map((g, idx) => ({
        grade: selectedGrade,
        station_id: selectedStationId,
        day_index: selectedDay,
        game_index: idx + 1,
        game_type: g.type,
        title: g.title,
        content: g.data,
        updated_at: new Date().toISOString()
      }));

      if (payload.length > 0) {
        const { error } = await supabase
          .from('station_questions')
          .upsert(payload, { onConflict: 'station_id,day_index,game_index' });

        if (error) throw error;
      }

      showToast('🚀 Đã lưu 100% cấu hình câu hỏi vào Supabase Database thành công!', 'success');
    } catch (err) {
      console.error("Lỗi lưu Supabase station_questions:", err);
      reportSystemError(err, {
        action: 'station_questions_save_failed',
        component: 'AdminStationPage',
        operation: 'saveToDatabase',
        supabaseCode: err.code,
      });
      showToast('Không thể lưu cấu hình trò chơi: ' + (err.message || 'Lỗi database chưa xác định.'), 'error');
    }
    setSavingDB(false);
  };

  // Cập nhật sau khi sửa trong Modal
  const handleSaveEditedGame = (updatedGame) => {
    setGamesList(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
    setEditingGame(null);
    showToast('Đã cập nhật chi tiết trò chơi!', 'success');
  };

  return (
    <div className="min-h-screen relative text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER ĐỒNG BỘ 100% VỚI ADMIN USERS KÈM TOGGLE THEME */}
        <header className="admin-station-card p-6 rounded-3xl border border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition active:scale-95 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                <Settings className="w-6 h-6 text-cyan-400" /> Quản Lý Trạm Sinh Học (Admin)
              </h1>
              <p className="text-xs text-slate-400 font-medium">Kiểm tra nội dung V2 theo từng ải; bản nháp chỉ để xem tại đây.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-slate-800" /> : <Sun className="w-5 h-5 text-yellow-400 animate-pulse" />}
            </button>

            {dataMode === 'legacy' && <button
              onClick={handleSaveToDatabase}
              disabled={savingDB || loadingDB || Boolean(loadError)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${savingDB ? 'animate-spin' : ''}`} />
              <span>{savingDB ? 'Đang Lưu DB...' : 'Lưu Bảng Cũ'}</span>
            </button>}
          </div>
        </header>

        <div className="admin-station-card p-4 rounded-2xl border border-white/10 mb-6 text-sm" role="status">
          <div className="flex flex-wrap items-center gap-3">
            <strong>Nguồn dữ liệu: {dataMode === 'v2' ? 'Nội dung V2' : 'Bảng cũ station_questions'}</strong>
            <button type="button" onClick={() => setDataMode(dataMode === 'v2' ? 'legacy' : 'v2')}
              className="rounded-lg border border-cyan-400/50 px-3 py-1 text-cyan-200">
              {dataMode === 'v2' ? 'Xem bảng cũ' : 'Trở về nội dung V2'}
            </button>
          </div>
          {dataMode === 'v2' && <p className="mt-2 text-amber-200">
            {release ? `${release.version} · ${release.status} · Chỉ xem; nội dung trên trang này không được lưu vào V2.` : 'Đang tải bản phát hành V2 của trạm.'}
          </p>}
          {dataMode === 'legacy' && <p className="mt-2 text-amber-200">Chế độ bảng cũ. Mọi thao tác lưu ở đây không sửa bản nháp V2.</p>}
          {loadError && <p className="mt-2 text-rose-300" role="alert">{loadError}</p>}
        </div>

        {/* BỘ LỌC KHỐI LỚP, TRẠM & ẢI NGÀY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="admin-station-card p-4 rounded-2xl border border-white/10">
            <label className="text-xs font-bold text-slate-400 block mb-2">Chọn Khối Lớp:</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                const nextGrade = Number(e.target.value);
                const firstStation = (ACTIVE_STATIONS[nextGrade] || ACTIVE_STATIONS[6])[0];
                setSelectedGrade(nextGrade);
                setSelectedStationId(firstStation.id);
                setSelectedDay(1);
              }}
              className="admin-station-input w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none"
            >
              {[6, 7, 8, 9, 10, 11, 12].map(g => (
                <option key={g} value={g}>Sinh Học Lớp {g}</option>
              ))}
            </select>
          </div>

          <div className="admin-station-card p-4 rounded-2xl border border-white/10">
            <label className="text-xs font-bold text-slate-400 block mb-2">Chọn Trạm Sinh Học:</label>
            <select
              value={selectedStationId}
              onChange={(e) => {
                const nextStation = stationOptions.find(station => station.id === e.target.value) || stationOptions[0];
                setSelectedStationId(nextStation.id);
                setSelectedDay(1);
              }}
              className="admin-station-input w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none"
            >
              {stationOptions.map(station => <option key={station.id} value={station.id}>{station.name}</option>)}
            </select>
          </div>

          <div className="admin-station-card p-4 rounded-2xl border border-white/10">
            <label className="text-xs font-bold text-slate-400 block mb-2">Chọn Ải Ngày ({selectedStation.startDay}-{selectedStation.startDay + selectedStation.daysCount - 1}):</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="admin-station-input w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none"
            >
              {stationDays.map(d => (
                <option key={d} value={d}>Ải Ngày {selectedStation.startDay + d - 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CỤM NÚT "THÊM TRÒ CHƠI" LUÔN LUÔN HIỂN THỊ KÈM DROPDOWN CHỌN LOẠI GAME MONG MUỐN */}
        <div className="admin-station-card p-5 rounded-3xl border border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-base font-black flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" /> Danh Sách Trò Chơi Trong Ải Ngày {selectedDayDisplay} ({gamesList.length} trò chơi)
            {loadingDB && <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" aria-label="Đang tải dữ liệu" />}
          </h2>

          {dataMode === 'legacy' && <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* SELECT CHỌN LOẠI TRÒ CHƠI MONG MUỐN THÊM */}
            <select
              value={selectedGameTypeToAdd}
              onChange={(e) => setSelectedGameTypeToAdd(e.target.value)}
              className="admin-station-input bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none"
            >
              {GAME_TYPES.map(t => (
                <option key={t.id} value={t.id}>Dạng {t.name}</option>
              ))}
            </select>

            {/* NÚT THÊM TRÒ CHƠI MÀU CYAN / BLUE DẠ QUANG RỰC RỠ */}
            <button
              onClick={handleAddGame}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-lg shadow-cyan-500/30 whitespace-nowrap border border-cyan-300 hover:brightness-110"
            >
              <Plus className="w-4 h-4" /> Thêm Trò Chơi
            </button>
          </div>}
        </div>

        {/* DANH SÁCH CÁC THẺ TRÒ CHƠI */}
        <div className="space-y-4">
          {gamesList.map((game, idx) => (
            <div key={game.id} className="admin-station-card p-6 rounded-3xl border border-white/10 relative transition-all hover:border-cyan-400/50">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/30">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{game.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      theme === 'light'
                        ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                        : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                    }`}>
                      {GAME_TYPES.find(t => t.id === game.type)?.name}
                    </span>
                  </div>
                </div>

                {dataMode === 'legacy' && <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1" aria-label="Sắp xếp trò chơi">
                    <button
                      type="button"
                      onClick={() => handleMoveGame(idx, -1)}
                      disabled={idx === 0}
                      className="station-order-button p-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Di chuyển trò chơi lên trên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveGame(idx, 1)}
                      disabled={idx === gamesList.length - 1}
                      className="station-order-button p-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Di chuyển trò chơi xuống dưới"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  {/* NÚT CHỈNH SỬA CHI TIẾT */}
                  <button
                    onClick={() => setEditingGame({ ...game })}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh Sửa Chi Tiết
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Xóa trò chơi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>}
              </div>

              {/* TÓM TẮT NỘI DUNG VỚI HINT & EXPLANATION */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 text-xs space-y-2">
                {dataMode === 'v2' && <>
                  <p><strong>Mục tiêu học tập:</strong> {game.learningObjective}</p>
                  <p><strong>Nguồn:</strong> {game.sourceRefs?.map(ref => [ref.source, ref.lesson, ref.pages].filter(Boolean).join(' · ')).join('; ')}</p>
                </>}
                {game.type === 'quiz' && (
                  <div>
                    <p className="font-bold mb-1">Câu hỏi: {game.data.question}</p>
                    <p className="text-emerald-400 font-bold mb-1">Đáp án đúng: {game.data.options?.[game.data.answerIndex]}</p>
                    {game.data.hint && <p className="text-amber-400 font-semibold mb-1">💡 Gợi ý: {game.data.hint}</p>}
                    {game.data.explanation && <p className="text-cyan-300 font-semibold">📖 Giải thích khi sai: {game.data.explanation}</p>}
                  </div>
                )}
                {game.type === 'match' && (
                  <div>
                    <p className="font-bold mb-1">Cặp từ nối ({game.data.pairs?.length} cặp):</p>
                    {game.data.pairs?.map((p, pIdx) => (
                      <p key={pIdx} className="text-slate-300">• {p.left} ➔ {p.right}</p>
                    ))}
                    {game.data.hint && <p className="text-amber-400 font-semibold mt-1">💡 Gợi ý: {game.data.hint}</p>}
                    {game.data.explanation && <p className="text-cyan-300 font-semibold mt-1">📖 Giải thích khi sai: {game.data.explanation}</p>}
                  </div>
                )}
                {game.type === 'fill' && (
                  <div>
                    <p className="font-bold mb-1">Câu điền: {game.data.sentence}</p>
                    <p className="text-emerald-400 font-bold mb-1">Từ đúng: {game.data.correctAnswer}</p>
                    {game.data.hint && <p className="text-amber-400 font-semibold mb-1">💡 Gợi ý: {game.data.hint}</p>}
                    {game.data.explanation && <p className="text-cyan-300 font-semibold">📖 Giải thích khi sai: {game.data.explanation}</p>}
                  </div>
                )}
                {game.type === 'category' && (
                  <div>
                    <p className="font-bold mb-1">Nhóm: {game.data.categories?.join(' | ')}</p>
                    <p className="text-slate-300 mb-1">Items: {game.data.items?.map(i => `${i.name} (${game.data.categories?.[i.catIndex]})`).join(', ')}</p>
                    {game.data.hint && <p className="text-amber-400 font-semibold mb-1">💡 Gợi ý: {game.data.hint}</p>}
                    {game.data.explanation && <p className="text-cyan-300 font-semibold">📖 Giải thích khi sai: {game.data.explanation}</p>}
                  </div>
                )}
                {game.type === 'dragdrop' && (
                  <div>
                    <p className="font-bold mb-1">Câu kéo thả: {game.data.textWithBlanks}</p>
                    <p className="text-emerald-400 font-bold mb-1">Từ đúng: {game.data.correctWord} (Kho từ: {game.data.bankWords?.join(', ')})</p>
                    {game.data.hint && <p className="text-amber-400 font-semibold mb-1">💡 Gợi ý: {game.data.hint}</p>}
                    {game.data.explanation && <p className="text-cyan-300 font-semibold">📖 Giải thích khi sai: {game.data.explanation}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ✏️ MODAL CHỈNH SỬA CHI TIẾT TRÒ CHƠI (CÂU HỎI, ĐÁP ÁN, GỢI Ý & GIẢI THÍCH KHI SAI) */}
      {dataMode === 'legacy' && editingGame && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="admin-station-card w-full max-w-2xl bg-slate-900 border border-cyan-400/40 p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" /> Chỉnh Sửa Chi Tiết Trò Chơi ({GAME_TYPES.find(t => t.id === editingGame.type)?.name})
              </h3>
              <button onClick={() => setEditingGame(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* TIÊU ĐỀ TRÒ CHƠI */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tên Tiêu Đề Trò Chơi:</label>
                <input
                  type="text"
                  value={editingGame.title}
                  onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                  className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white"
                />
              </div>

              {/* DẠNG 1: QUIZ TRẮC NGHIỆM */}
              {editingGame.type === 'quiz' && (
                <>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Nội dung Câu hỏi Trắc nghiệm:</label>
                    <textarea
                      rows={3}
                      value={editingGame.data.question}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, question: e.target.value } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">4 Lựa chọn Đáp án:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {editingGame.data.options?.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...editingGame.data.options];
                            newOpts[oIdx] = e.target.value;
                            setEditingGame({ ...editingGame, data: { ...editingGame.data, options: newOpts } });
                          }}
                          className="admin-station-input bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Đáp án Đúng (0 đến 3):</label>
                    <select
                      value={editingGame.data.answerIndex}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, answerIndex: Number(e.target.value) } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-emerald-400"
                    >
                      {editingGame.data.options?.map((opt, oIdx) => (
                        <option key={oIdx} value={oIdx}>Lựa chọn {oIdx + 1}: {opt}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* DẠNG 2: NỐI CHỮ */}
              {editingGame.type === 'match' && (
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Các cặp từ nối (Bên trái ➔ Bên phải):</label>
                  <div className="space-y-2">
                    {editingGame.data.pairs?.map((p, pIdx) => (
                      <div key={pIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={p.left}
                          onChange={(e) => {
                            const newPairs = [...editingGame.data.pairs];
                            newPairs[pIdx].left = e.target.value;
                            setEditingGame({ ...editingGame, data: { ...editingGame.data, pairs: newPairs } });
                          }}
                          className="admin-station-input w-1/2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Bên trái"
                        />
                        <input
                          type="text"
                          value={p.right}
                          onChange={(e) => {
                            const newPairs = [...editingGame.data.pairs];
                            newPairs[pIdx].right = e.target.value;
                            setEditingGame({ ...editingGame, data: { ...editingGame.data, pairs: newPairs } });
                          }}
                          className="admin-station-input w-1/2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Bên phải"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DẠNG 3: ĐIỀN TỪ CÒN THIẾU */}
              {editingGame.type === 'fill' && (
                <>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Câu văn chứa chỗ trống (dùng [blank]):</label>
                    <input
                      type="text"
                      value={editingGame.data.sentence}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, sentence: e.target.value } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-emerald-400 block mb-1">Từ đáp án chính xác:</label>
                    <input
                      type="text"
                      value={editingGame.data.correctAnswer}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, correctAnswer: e.target.value } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-emerald-400"
                    />
                  </div>
                </>
              )}

              {/* DẠNG 4: PHÂN LOẠI NHÓM */}
              {editingGame.type === 'category' && (
                <>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Tên 2 Nhóm Phân Loại:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingGame.data.categories?.[0]}
                        onChange={(e) => {
                          const newCats = [...editingGame.data.categories];
                          newCats[0] = e.target.value;
                          setEditingGame({ ...editingGame, data: { ...editingGame.data, categories: newCats } });
                        }}
                        className="admin-station-input w-1/2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-cyan-300 font-bold"
                      />
                      <input
                        type="text"
                        value={editingGame.data.categories?.[1]}
                        onChange={(e) => {
                          const newCats = [...editingGame.data.categories];
                          newCats[1] = e.target.value;
                          setEditingGame({ ...editingGame, data: { ...editingGame.data, categories: newCats } });
                        }}
                        className="admin-station-input w-1/2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-purple-300 font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* DẠNG 5: KÉO THẢ HOÀN THÀNH CÂU */}
              {editingGame.type === 'dragdrop' && (
                <>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Câu văn chứa [blank]:</label>
                    <input
                      type="text"
                      value={editingGame.data.textWithBlanks}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, textWithBlanks: e.target.value } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-emerald-400 block mb-1">Từ đáp án đúng:</label>
                    <input
                      type="text"
                      value={editingGame.data.correctWord}
                      onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, correctWord: e.target.value } })}
                      className="admin-station-input w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-emerald-400"
                    />
                  </div>
                </>
              )}

              {/* GỢI Ý HINT (ÁP DỤNG BẮT BUỘC CHO TẤT CẢ LOẠI GAME) */}
              <div className="pt-2 border-t border-white/10">
                <label className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Gợi Ý (Hint) Khi Học Sinh Gặp Khó Khăn:
                </label>
                <input
                  type="text"
                  placeholder="Nhập gợi ý cho câu hỏi..."
                  value={editingGame.data.hint || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, hint: e.target.value } })}
                  className="admin-station-input w-full bg-slate-950 border border-amber-400/40 rounded-xl p-3 text-xs text-amber-200"
                />
              </div>

              {/* GIẢI THÍCH ĐÁP ÁN ĐÚNG KHI TRẢ LỜI SAI (EXPLANATION - ÁP DỤNG CÁCH NỔI BẬT) */}
              <div>
                <label className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-cyan-300" /> Đáp Án Đúng & Giải Thích Chi Tiết Hiển Thị Khi Trả Lời Sai:
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập giải thích chi tiết đáp án đúng khi học sinh trả lời sai..."
                  value={editingGame.data.explanation || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, data: { ...editingGame.data, explanation: e.target.value } })}
                  className="admin-station-input w-full bg-slate-950 border border-cyan-400/40 rounded-xl p-3 text-xs text-cyan-100"
                />
              </div>

            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setEditingGame(null)} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer">
                Hủy Bỏ
              </button>
              <button onClick={() => handleSaveEditedGame(editingGame)} className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-cyan-500/20">
                Lưu Thay Đổi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
