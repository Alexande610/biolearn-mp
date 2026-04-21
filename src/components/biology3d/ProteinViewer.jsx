// ProteinViewer.jsx - Hiển thị cấu trúc protein thật từ PDB bằng Mol*
// FIX: Thêm nút thu gọn/mở rộng cho selector panel
import { useState } from 'react';
import MolstarViewer, { PDB_STRUCTURES } from './MolstarViewer';

const PROTEIN_STRUCTURES = {
  hemoglobin: PDB_STRUCTURES.hemoglobin,
  myoglobin: PDB_STRUCTURES.myoglobin,
  insulin: PDB_STRUCTURES.insulin,
  atp_synthase: PDB_STRUCTURES.atp_synthase,
  lysozyme: PDB_STRUCTURES.lysozyme,
};

const PROTEIN_KNOWLEDGE = {
  hemoglobin: {
    title: 'Hemoglobin - Protein vận chuyển O₂',
    facts: [
      'Có trong hồng cầu, vận chuyển O₂ từ phổi đến mô',
      'Cấu trúc bậc 4: 4 tiểu đơn vị (2α + 2β)',
      'Mỗi tiểu đơn vị chứa 1 nhóm Heme với Fe²⁺',
      'Mỗi phân tử gắn tối đa 4 O₂',
      'Hiệu ứng hợp tác: gắn O₂ đầu tiên tăng ái lực cho O₂ tiếp theo',
      'CO gắn Hemoglobin mạnh gấp 200 lần O₂ → ngộ độc CO'
    ]
  },
  myoglobin: {
    title: 'Myoglobin - Dự trữ O₂ trong cơ',
    facts: [
      'Protein dự trữ O₂ trong tế bào cơ',
      'Cấu trúc bậc 3: 1 chuỗi polypeptide + 1 nhóm Heme',
      'Ái lực O₂ cao hơn hemoglobin',
      'Tạo màu đỏ cho thịt',
      'Đầu tiên có cấu trúc 3D được giải bởi X-ray (1958)',
      'John Kendrew nhận Nobel nhờ giải cấu trúc myoglobin'
    ]
  },
  insulin: {
    title: 'Insulin - Hormone điều hòa đường huyết',
    facts: [
      'Do tế bào beta đảo Langerhans (tuyến tụy) tiết ra',
      'Giảm đường huyết bằng cách kích thích tế bào hấp thu glucose',
      'Cấu trúc: 2 chuỗi A (21 aa) và B (30 aa) nối bằng cầu disulfide',
      'Thiếu insulin → Đái tháo đường type 1',
      'Kháng insulin → Đái tháo đường type 2',
      'Frederick Banting phát hiện insulin năm 1921 → Nobel 1923'
    ]
  },
  atp_synthase: {
    title: 'ATP Synthase - Động cơ phân tử',
    facts: [
      'Enzyme tổng hợp ATP từ ADP + Pi',
      'Nằm trên màng trong ti thể',
      'Hoạt động như "động cơ quay" phân tử nano',
      'Quay ~100 vòng/giây nhờ gradient H⁺',
      'Tạo ~3 ATP mỗi vòng quay',
      'Cơ thể tổng hợp ~40kg ATP mỗi ngày!',
      'Paul Boyer & John Walker nhận Nobel 1997'
    ]
  },
  lysozyme: {
    title: 'Lysozyme - Enzyme bảo vệ',
    facts: [
      'Có trong nước bọt, nước mắt, mũi, sữa mẹ',
      'Phân hủy peptidoglycan thành tế bào vi khuẩn',
      'Hàng rào miễn dịch bẩm sinh đầu tiên',
      'Alexander Fleming phát hiện 1922 (trước penicillin)',
      'Enzyme đầu tiên được giải cấu trúc 3D hoàn chỉnh (1965)',
      '129 amino acid, khối lượng ~14.3 kDa'
    ]
  }
};

export default function ProteinViewer({ 
  width = "100%", 
  height = "100%",
  backgroundColor = "#1a0a1e"
}) {
  const [selectedProtein, setSelectedProtein] = useState('hemoglobin');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const currentKnowledge = PROTEIN_KNOWLEDGE[selectedProtein];
  const currentStructure = PROTEIN_STRUCTURES[selectedProtein];

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      
      <MolstarViewer
        key={selectedProtein}
        structureKey={selectedProtein}
        width="100%"
        height="100%"
        backgroundColor={backgroundColor}
        showControls={true}
        showInfo={false}
      />

      {/* Protein selector - bên phải, có nút thu gọn */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="mb-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg text-xs text-gray-300 hover:bg-black/80 transition border border-white/10 flex items-center gap-1.5"
        >
          🔴 {selectorOpen ? '◀ Ẩn danh sách' : '▶ Chọn protein'}
        </button>

        {selectorOpen && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10">
            <p className="text-gray-400 text-xs px-2 mb-1.5">🔴 Chọn protein:</p>
            {Object.entries(PROTEIN_STRUCTURES).map(([key, structure]) => (
              <button
                key={key}
                onClick={() => { setSelectedProtein(key); setSelectorOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all mb-1 ${
                  selectedProtein === key
                    ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                🔴 {structure.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔴</span>
                <h3 className="font-bold text-red-300">{currentStructure?.name}</h3>
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                  PDB: {currentStructure?.id}
                </span>
              </div>
              <p className="text-sm text-gray-300">{currentStructure?.description}</p>
            </div>
            <button
              onClick={() => setShowKnowledge(!showKnowledge)}
              className="flex-shrink-0 px-3 py-1.5 bg-red-500/20 rounded-lg text-xs text-red-300 hover:bg-red-500/30 transition"
            >
              📚 {showKnowledge ? 'Ẩn' : 'Kiến thức'}
            </button>
          </div>

          {showKnowledge && currentKnowledge && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm font-semibold text-red-300 mb-2">{currentKnowledge.title}</p>
              <ul className="space-y-1">
                {currentKnowledge.facts.map((fact, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-600 mt-2">
            🔬 Cấu trúc protein thật từ Protein Data Bank (RCSB) • Mol* Viewer
          </p>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🔴 Cấu trúc protein thật từ PDB</p>
      </div>
    </div>
  );
}
