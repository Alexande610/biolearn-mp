import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Braces, Lock, Plus, RefreshCw, Save, Unlock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { classData, LEVELS_PER_LESSON, PRACTICE_LEVELS_PER_CHAPTER } from './MapPage';
import { MAP_STAGE_TYPES, validateMapGame } from '../utils/mapStages';

const EMPTY_GAME = [
  {
    type: 'multiple-choice',
    question: 'Nhập nội dung câu hỏi',
    options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
    correctAnswer: 0,
    explanation: ''
  }
];

const TYPE_OPTIONS = [
  { value: MAP_STAGE_TYPES.LESSON, label: 'Màn học' },
  { value: MAP_STAGE_TYPES.PRACTICE, label: 'Màn thực hành' },
  { value: MAP_STAGE_TYPES.SKIP_CHALLENGE, label: 'Màn học vượt' }
];

function formatGame(game) {
  const value = Array.isArray(game) ? game : game?.quizzes || EMPTY_GAME;
  return JSON.stringify(value, null, 2);
}

export default function AdminMapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [grade, setGrade] = useState(6);
  const chapters = classData[grade]?.chapters || [];
  const [chapterId, setChapterId] = useState(chapters[0]?.id || 1);
  const [stageType, setStageType] = useState(MAP_STAGE_TYPES.LESSON);
  const chapter = chapters.find(item => Number(item.id) === Number(chapterId)) || chapters[0];
  const lessons = chapter?.lessons || [];
  const [lessonId, setLessonId] = useState(lessons[0]?.id || 1);
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theory, setTheory] = useState('');
  const [gameJson, setGameJson] = useState(formatGame(EMPTY_GAME));
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [enabled, setEnabled] = useState(true);
  const loadSequence = useRef(0);

  const identity = useMemo(() => {
    if (stageType === MAP_STAGE_TYPES.SKIP_CHALLENGE) return { lessonId: 0, level: 0 };
    if (stageType === MAP_STAGE_TYPES.PRACTICE) return { lessonId: 99, level };
    return { lessonId: Number(lessonId), level };
  }, [stageType, lessonId, level]);

  const controlId = stageType === MAP_STAGE_TYPES.SKIP_CHALLENGE
    ? `${grade}:${chapterId}:review:0`
    : `${grade}:${chapterId}:${identity.lessonId}:${identity.level}`;

  const loadStage = async () => {
    const requestSequence = ++loadSequence.current;
    setLoading(true);
    setLoadError('');
    const [contentResult, controlResult] = await Promise.all([
      supabase.from('lesson_questions').select('*')
        .eq('class_id', grade).eq('chapter_id', Number(chapterId))
        .eq('stage_type', stageType).eq('lesson_id', identity.lessonId)
        .eq('level', identity.level).maybeSingle(),
      supabase.from('content_controls').select('is_enabled')
        .eq('content_type', 'map_level').eq('item_id', controlId).maybeSingle()
    ]);
    if (requestSequence !== loadSequence.current) return;
    setLoading(false);
    if (contentResult.error) {
      setRecord(null);
      setLoadError(contentResult.error.code === '42703'
        ? 'Cơ sở dữ liệu chưa được nâng cấp. Hãy chạy file supabase_admin_map_management_upgrade.sql trước.'
        : contentResult.error.message);
      return;
    }
    const data = contentResult.data;
    setRecord(data || null);
    setTitle(data?.title || '');
    setDescription(data?.description || '');
    setTheory(data?.theory || '');
    setGameJson(formatGame(data?.game || EMPTY_GAME));
    setEnabled(controlResult.data?.is_enabled !== false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => loadStage(), 0);
    return () => window.clearTimeout(timer);
  }, [grade, chapterId, stageType, identity.lessonId, identity.level]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeGrade = event => {
    const nextGrade = Number(event.target.value);
    const firstChapter = classData[nextGrade]?.chapters?.[0];
    setGrade(nextGrade);
    setChapterId(firstChapter?.id || 1);
    setLessonId(firstChapter?.lessons?.[0]?.id || 1);
    setLevel(0);
  };

  const changeChapter = event => {
    const nextChapterId = Number(event.target.value);
    const nextChapter = (classData[grade]?.chapters || []).find(item => Number(item.id) === nextChapterId);
    setChapterId(nextChapterId);
    setLessonId(nextChapter?.lessons?.[0]?.id || 1);
    setLevel(0);
  };

  const changeStageType = event => {
    setStageType(event.target.value);
    setLevel(0);
  };

  const saveStage = async () => {
    let parsed;
    try {
      parsed = JSON.parse(gameJson);
    } catch (error) {
      showToast(`JSON chưa hợp lệ: ${error.message}`, 'error');
      return;
    }
    const validationError = validateMapGame(parsed);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('lesson_questions').upsert({
      class_id: grade,
      chapter_id: Number(chapterId),
      stage_type: stageType,
      lesson_id: identity.lessonId,
      level: identity.level,
      title: title.trim(),
      description: description.trim(),
      theory: theory.trim(),
      game: parsed,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'class_id,chapter_id,stage_type,lesson_id,level' }).select().single();
    setSaving(false);
    if (error) {
      showToast(`Không thể lưu màn: ${error.message}`, 'error');
      return;
    }
    setRecord(data);
    showToast('Đã lưu đúng màn chơi đang chọn.', 'success');
  };

  const toggleStage = async () => {
    const nextEnabled = !enabled;
    const label = stageType === MAP_STAGE_TYPES.SKIP_CHALLENGE
      ? `Lớp ${grade} · ${chapter?.name} · Học vượt`
      : `Lớp ${grade} · ${chapter?.name} · ${stageType === MAP_STAGE_TYPES.PRACTICE ? 'Thực hành' : lessons.find(item => Number(item.id) === Number(identity.lessonId))?.name || 'Bài học'} · Ải ${identity.level + 1}`;
    const { error } = await supabase.from('content_controls').upsert({
      content_type: 'map_level', item_id: controlId, title: label,
      metadata: { grade, chapterId: Number(chapterId), stageType, lessonId: identity.lessonId, level: identity.level },
      is_enabled: nextEnabled,
      maintenance_message: 'Ải này đang được bảo trì. Vui lòng quay lại sau.',
      updated_by: user?.id || null, updated_at: new Date().toISOString()
    }, { onConflict: 'content_type,item_id' });
    if (error) return showToast(`Không thể cập nhật trạng thái: ${error.message}`, 'error');
    setEnabled(nextEnabled);
    showToast(nextEnabled ? 'Đã mở màn chơi.' : 'Đã khóa màn chơi.', 'success');
  };

  const addTemplate = type => {
    let current;
    try { current = JSON.parse(gameJson); } catch { current = []; }
    if (!Array.isArray(current)) current = current?.quizzes || [];
    const templates = {
      'multiple-choice': { type, question: 'Nhập câu hỏi', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: '' },
      matching: { type, question: 'Nối các nội dung tương ứng', pairs: [{ term: 'Vế 1', definition: 'Nghĩa 1' }, { term: 'Vế 2', definition: 'Nghĩa 2' }] },
      ordering: { type, question: 'Sắp xếp theo đúng thứ tự', correctOrder: ['Bước 1', 'Bước 2'] },
      fillblank: { type, question: 'Điền từ còn thiếu', sentence: 'Nội dung ______.', correctAnswer: 'đáp án' }
    };
    setGameJson(formatGame([...current, templates[type]]));
  };

  const maxLevel = stageType === MAP_STAGE_TYPES.PRACTICE ? PRACTICE_LEVELS_PER_CHAPTER : LEVELS_PER_LESSON;

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="game-card mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ArrowLeft /></button>
            <div><h1 className="text-xl font-black">Quản lý Map</h1><p className="text-sm text-gray-400">Chỉnh đúng dữ liệu của từng màn học, thực hành và học vượt.</p></div>
          </div>
          <button onClick={loadStage} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center" title="Tải lại"><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
        </header>

        <section className="game-card mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="text-xs text-gray-400">Lớp<select value={grade} onChange={changeGrade} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/20 p-2 text-white">{[6,7,8,9,10,11,12].map(v => <option key={v} value={v}>Lớp {v}</option>)}</select></label>
          <label className="text-xs text-gray-400">Chương<select value={chapterId} onChange={changeChapter} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/20 p-2 text-white">{chapters.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
          <label className="text-xs text-gray-400">Loại màn<select value={stageType} onChange={changeStageType} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/20 p-2 text-white">{TYPE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
          <label className="text-xs text-gray-400">Bài<select disabled={stageType !== MAP_STAGE_TYPES.LESSON} value={lessonId} onChange={e => setLessonId(Number(e.target.value))} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/20 p-2 text-white disabled:opacity-40">{lessons.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
          <label className="text-xs text-gray-400">Màn<select disabled={stageType === MAP_STAGE_TYPES.SKIP_CHALLENGE} value={level} onChange={e => setLevel(Number(e.target.value))} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/20 p-2 text-white disabled:opacity-40">{Array.from({ length: maxLevel }, (_, i) => <option key={i} value={i}>Ải {i + 1}</option>)}</select></label>
        </section>

        {loadError && <div className="game-card mb-5 border border-red-400/50 text-red-300">{loadError}</div>}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.3fr)] gap-5">
          <section className="game-card space-y-4">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">Thông tin màn</h2><p className={`text-xs mt-1 ${record ? 'text-emerald-300' : 'text-amber-300'}`}>{record ? 'Nguồn: Supabase · đã có dữ liệu' : stageType === MAP_STAGE_TYPES.PRACTICE ? 'Chưa có bản ghi · trò chơi hiện có thể dùng fallback từ tài liệu' : 'Chưa có dữ liệu cho màn này'}</p></div><button onClick={toggleStage} className={`px-3 py-2 rounded-xl flex items-center gap-2 ${enabled ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{enabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}{enabled ? 'Khóa' : 'Mở'}</button></div>
            <label className="block text-sm">Tiêu đề<input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl bg-black/20 border border-white/15 p-3" /></label>
            <label className="block text-sm">Mô tả<textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-xl bg-black/20 border border-white/15 p-3" /></label>
            <label className="block text-sm">Lý thuyết<textarea value={theory} onChange={e => setTheory(e.target.value)} rows={8} className="mt-1 w-full rounded-xl bg-black/20 border border-white/15 p-3" /></label>
            <div className="rounded-xl bg-black/20 p-3 text-xs text-gray-400"><p>ID dữ liệu: {grade}/{chapterId}/{stageType}/{identity.lessonId}/{identity.level}</p><p>ID khóa bảo trì: {controlId}</p></div>
          </section>

          <section className="game-card min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><Braces className="w-5 h-5 text-cyan-300" /><h2 className="font-black">Câu hỏi và trò chơi</h2></div><div className="flex flex-wrap gap-2">{[['multiple-choice','Trắc nghiệm'],['matching','Nối'],['ordering','Sắp xếp'],['fillblank','Điền từ']].map(([type,label]) => <button key={type} onClick={() => addTemplate(type)} className="px-2 py-1 rounded-lg bg-white/10 text-xs flex items-center gap-1"><Plus className="w-3 h-3" />{label}</button>)}</div></div>
            <p className="text-xs text-gray-400 mb-3">Mỗi phần tử là một trò chơi. Hệ thống kiểm tra câu hỏi và đáp án trước khi lưu.</p>
            <textarea value={gameJson} onChange={e => setGameJson(e.target.value)} spellCheck={false} className="w-full min-h-[520px] rounded-xl bg-slate-950/80 border border-white/15 p-4 font-mono text-xs text-cyan-50" />
            <button disabled={saving || loading || Boolean(loadError)} onClick={saveStage} className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black flex items-center justify-center gap-2"><Save className="w-5 h-5" />{saving ? 'Đang lưu...' : 'Lưu màn đang chọn'}</button>
          </section>
        </div>
      </div>
    </div>
  );
}
