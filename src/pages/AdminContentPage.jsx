import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Lock, Microscope, RefreshCw, Unlock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { useContentControls } from '../hooks/useContentControls';
import { SIMULATION_GAMES } from './SimulationsPage';
import { BIOLOGY_3D_MODELS } from './Biology3DPage';

const TABS = [
  { id: 'simulation_game', label: 'Game mô phỏng 3D', icon: Gamepad2 },
  { id: 'biology_model', label: 'Mô hình 3D', icon: Microscope }
];

export default function AdminContentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('simulation_game');
  const [savingId, setSavingId] = useState('');
  const { loading, reload, getControl } = useContentControls(tab);

  const items = useMemo(() => {
    if (tab === 'simulation_game') {
      return Object.values(SIMULATION_GAMES).map(game => ({ id: game.id, title: `Lớp ${game.grade} · ${game.name}`, meta: { grade: game.grade } }));
    }
    return BIOLOGY_3D_MODELS.map(model => ({ id: model.id, title: model.name, meta: { grades: model.grades } }));
  }, [tab]);

  const toggleItem = async (item) => {
    const current = getControl(item.id);
    const nextEnabled = current?.is_enabled === false;
    setSavingId(item.id);
    const { error } = await supabase.from('content_controls').upsert({
      content_type: tab,
      item_id: item.id,
      title: item.title,
      metadata: item.meta,
      is_enabled: nextEnabled,
      maintenance_message: 'Nội dung đang được bảo trì. Vui lòng quay lại sau.',
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'content_type,item_id' });
    setSavingId('');
    if (error) {
      showToast(`Không thể cập nhật: ${error.message}`, 'error');
      return;
    }
    await reload();
    showToast(nextEnabled ? 'Đã mở nội dung.' : 'Đã khóa nội dung để bảo trì.', 'success');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="game-card mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ArrowLeft /></button>
            <div><h1 className="text-xl font-black">Quản lý nội dung 3D</h1><p className="text-sm text-gray-400">Khóa nội dung cần bảo trì và mở lại khi đã sẵn sàng.</p></div>
          </div>
          <button onClick={reload} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {TABS.map(item => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => setTab(item.id)} className={`game-card flex items-center justify-center gap-2 ${tab === item.id ? '!border-cyan-400 !bg-cyan-500/20' : ''}`}><Icon className="w-5 h-5" />{item.label}</button>;
          })}
        </div>

        <div className="space-y-3">
          {items.map(item => {
            const enabled = getControl(item.id)?.is_enabled !== false;
            return <div key={item.id} className="game-card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{enabled ? <Unlock /> : <Lock />}</div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{item.title}</p><p className="text-xs text-gray-400">{enabled ? 'Đang hoạt động' : 'Đang khóa để bảo trì'}</p></div>
              <button disabled={savingId === item.id} onClick={() => toggleItem(item)} className={`px-4 py-2 rounded-xl font-bold disabled:opacity-50 ${enabled ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{enabled ? 'Khóa' : 'Mở'}</button>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
