import { X } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const formatNumber = value => Number(value || 0).toLocaleString('vi-VN');
const formatDate = value => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

export default function PresentationUserDetail({ person, onClose }) {
  return (
    <aside className="w-full lg:w-[42%] lg:fixed lg:right-4 lg:top-24 lg:bottom-4 bg-slate-900/90 border border-white/10 rounded-3xl p-6 overflow-y-auto z-40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <h3 className="text-white font-black text-sm uppercase tracking-wider">Thông tin hồ sơ</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center" aria-label="Đóng hồ sơ"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <img src={getAvatarUrl(person.avatar_url)} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        <div className="min-w-0">
          <h4 className="text-white font-bold truncate">{person.display_name}</h4>
          <p className="text-gray-300 text-xs">{person.role === 'teacher' ? 'Giáo viên' : 'Học sinh'} · Khối {person.grade}</p>
          <p className="text-amber-200 text-xs">Dữ liệu mẫu · Chỉ xem</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3"><dt className="text-gray-400">Tổng điểm</dt><dd className="text-white font-bold">{formatNumber(person.total_score)}</dd></div>
        <div className="rounded-xl bg-white/5 p-3"><dt className="text-gray-400">Bài hoàn thành</dt><dd className="text-white font-bold">{formatNumber(person.completed_lessons)}</dd></div>
        <div className="rounded-xl bg-white/5 p-3"><dt className="text-gray-400">Điểm tuần</dt><dd className="text-white font-bold">{formatNumber(Number(person.weekly_map_score || 0) + Number(person.weekly_pvp_score || 0))}</dd></div>
        <div className="rounded-xl bg-white/5 p-3"><dt className="text-gray-400">PvP thắng / thua</dt><dd className="text-white font-bold">{formatNumber(person.pvp_wins)} / {formatNumber(person.pvp_losses)}</dd></div>
      </dl>
      <div className="mt-5 text-gray-300 text-xs space-y-1">
        <p>Ngày tạo: {formatDate(person.created_at)}</p>
        <p>Hoạt động gần nhất: {formatDate(person.last_active_at)}</p>
      </div>
      <p className="text-gray-400 text-xs mt-5">Hồ sơ này không có tài khoản đăng nhập, không nhận thưởng hoặc thư và không thể ghép trận.</p>
    </aside>
  );
}
