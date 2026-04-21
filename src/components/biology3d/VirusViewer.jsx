// VirusViewer.jsx - Hiển thị cấu trúc virus thật từ PDB bằng Mol*
// FIX: Thêm nút thu gọn/mở rộng cho selector panel
import { useState } from 'react';
import MolstarViewer, { PDB_STRUCTURES } from './MolstarViewer';

const VIRUS_STRUCTURES = {
  covid_spike: PDB_STRUCTURES.covid_spike,
  hiv_capsid: PDB_STRUCTURES.hiv_capsid,
  influenza: PDB_STRUCTURES.influenza,
};

const VIRUS_KNOWLEDGE = {
  covid_spike: {
    title: 'SARS-CoV-2 Spike Protein',
    facts: [
      'Protein gai (Spike) trên bề mặt virus Corona',
      'Bám vào thụ thể ACE2 trên tế bào người',
      'Dạng trimer (3 tiểu đơn vị)',
      'Mục tiêu chính của vaccine mRNA (Pfizer, Moderna)',
      'Đột biến ở protein gai tạo biến thể mới (Delta, Omicron)',
      'Kích thước: ~10nm chiều dài'
    ]
  },
  hiv_capsid: {
    title: 'Vỏ protein HIV (Capsid)',
    facts: [
      'Vỏ protein bảo vệ RNA virus bên trong',
      'Hình dạng hình nón (conical)',
      'Cấu tạo từ ~1500 protein CA (capsid protein)',
      'Phân rã khi vào tế bào chủ để giải phóng RNA',
      'HIV thuộc nhóm Retrovirus, dùng reverse transcriptase',
      'Lây nhiễm tế bào CD4+ T (hệ miễn dịch)'
    ]
  },
  influenza: {
    title: 'Hemagglutinin - Virus cúm',
    facts: [
      'Protein trên bề mặt virus cúm (Influenza)',
      'Giúp virus bám vào acid sialic trên tế bào đường hô hấp',
      'Dạng trimer, mỗi monomer gồm HA1 và HA2',
      'Là kháng nguyên chính trong vaccine cúm',
      'Đột biến kháng nguyên gây dịch cúm mùa hàng năm',
      '18 phân nhóm HA (H1-H18) đã được phát hiện'
    ]
  }
};

export default function VirusViewer({ 
  width = "100%", 
  height = "100%",
  backgroundColor = "#1a0a2e"
}) {
  const [selectedVirus, setSelectedVirus] = useState('covid_spike');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const currentKnowledge = VIRUS_KNOWLEDGE[selectedVirus];
  const currentStructure = VIRUS_STRUCTURES[selectedVirus];

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      
      <MolstarViewer
        key={selectedVirus}
        structureKey={selectedVirus}
        width="100%"
        height="100%"
        backgroundColor={backgroundColor}
        showControls={true}
        showInfo={false}
      />

      {/* Virus selector - bên phải, có nút thu gọn */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="mb-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg text-xs text-gray-300 hover:bg-black/80 transition border border-white/10 flex items-center gap-1.5"
        >
          🦠 {selectorOpen ? '◀ Ẩn danh sách' : '▶ Chọn virus'}
        </button>

        {selectorOpen && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10">
            <p className="text-gray-400 text-xs px-2 mb-1.5">🦠 Chọn virus:</p>
            {Object.entries(VIRUS_STRUCTURES).map(([key, structure]) => (
              <button
                key={key}
                onClick={() => { setSelectedVirus(key); setSelectorOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all mb-1 ${
                  selectedVirus === key
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                🦠 {structure.name}
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
                <span className="text-lg">🦠</span>
                <h3 className="font-bold text-amber-300">{currentStructure?.name}</h3>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  PDB: {currentStructure?.id}
                </span>
              </div>
              <p className="text-sm text-gray-300">{currentStructure?.description}</p>
            </div>
            <button
              onClick={() => setShowKnowledge(!showKnowledge)}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/30 transition"
            >
              📚 {showKnowledge ? 'Ẩn' : 'Kiến thức'}
            </button>
          </div>

          {showKnowledge && currentKnowledge && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm font-semibold text-amber-300 mb-2">{currentKnowledge.title}</p>
              <ul className="space-y-1">
                {currentKnowledge.facts.map((fact, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-600 mt-2">
            🔬 Cấu trúc virus thật từ Protein Data Bank (RCSB) • Mol* Viewer
          </p>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🦠 Cấu trúc virus thật từ PDB</p>
      </div>
    </div>
  );
}
