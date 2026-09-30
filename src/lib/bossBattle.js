import { supabase } from './supabase';

export const bossFeatureEnabled = import.meta.env.VITE_BOSS_V2_ENABLED === 'true';
let unavailable = false;
export async function bossRpc(name, args = {}) {
  if (!bossFeatureEnabled || unavailable) return null;
  const { data, error } = await supabase.rpc(name,args);
  if (error) {
    if (['PGRST202','42883'].includes(error.code)) { unavailable=true; return null; }
    throw new Error(error.message || 'Không thể kết nối trận boss.');
  }
  return data;
}
export function notifyBossEncounter(encounter) {
  if (encounter?.status === 'offered' || encounter?.status === 'active') {
    window.dispatchEvent(new CustomEvent('boss-encounter',{ detail:encounter }));
  }
}
export const bossUrl = e => `/boss/${e.classId}/${e.chapterId}/${e.lessonId}?encounter=${encodeURIComponent(e.id)}`;
export function remainingSeconds(deadline, now = Date.now()) {
  return Math.max(0,Math.ceil((Date.parse(deadline)-now)/1000)) || 0;
}
export function formatBossTime(seconds) {
  return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
}
