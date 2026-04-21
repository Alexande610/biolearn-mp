// DNAHelix.jsx - Hiển thị cấu trúc ADN/ARN thật từ PDB bằng Mol*
// FIX: Thêm nút thu gọn/mở rộng cho selector panel
import { useState } from 'react';
import MolstarViewer, { PDB_STRUCTURES, PDB_CATEGORIES } from './MolstarViewer';

const DNA_RNA_STRUCTURES = {
  dna_bform: PDB_STRUCTURES.dna_bform,
  dna_zform: PDB_STRUCTURES.dna_zform,
  dna_aform: PDB_STRUCTURES.dna_aform,
  trna: PDB_STRUCTURES.trna,
  dna_polymerase: PDB_STRUCTURES.dna_polymerase,
  rna_polymerase: PDB_STRUCTURES.rna_polymerase,
};

const DNA_KNOWLEDGE = {
  dna_bform: {
    title: 'ADN dạng B - Watson & Crick',
    facts: [
      'Phát hiện bởi Watson & Crick năm 1953',
      'Xoắn phải, 10 cặp base mỗi vòng xoắn',
      'Đường kính 2nm, bước xoắn 3.4nm',
      'Cặp base bổ sung: A-T (2 liên kết H), G-C (3 liên kết H)',
      'Hai mạch đơn đối song song (antiparallel)',
      'Dạng phổ biến nhất trong tế bào'
    ]
  },
  dna_zform: {
    title: 'ADN dạng Z - xoắn trái đặc biệt',
    facts: [
      'Xoắn trái (ngược với dạng B)',
      'Cấu trúc zigzag của bộ khung',
      'Xuất hiện trong vùng giàu GC',
      'Có vai trò trong điều hòa gene',
      'Đường kính hẹp hơn dạng B (~1.8nm)'
    ]
  },
  dna_aform: {
    title: 'ADN dạng A - ngắn và rộng',
    facts: [
      'Xoắn phải nhưng ngắn và rộng hơn dạng B',
      '11 cặp base mỗi vòng xoắn',
      'Xuất hiện khi DNA mất nước',
      'Dạng lai DNA-RNA thường có cấu trúc dạng A',
      'Rãnh lớn sâu và hẹp, rãnh nhỏ nông và rộng'
    ]
  },
  trna: {
    title: 'tRNA - Vận chuyển amino acid',
    facts: [
      'Cấu trúc hình lá chẻ ba (cloverleaf)',
      'Mang amino acid đến ribosome',
      'Anticodon bổ sung với codon trên mRNA',
      'Mỗi loại tRNA mang một amino acid đặc hiệu',
      '75-95 nucleotide, nhiều base biến đổi'
    ]
  },
  dna_polymerase: {
    title: 'DNA Polymerase III - Enzyme nhân đôi ADN',
    facts: [
      'Enzyme chính trong nhân đôi ADN',
      'Tổng hợp mạch mới theo chiều 5\'→3\'',
      'Có hoạt tính sửa sai (proofreading)',
      'Cần primer (đoạn mồi) để bắt đầu',
      'Tốc độ: ~1000 nucleotide/giây ở E. coli'
    ]
  },
  rna_polymerase: {
    title: 'RNA Polymerase II - Enzyme phiên mã',
    facts: [
      'Phiên mã ADN thành mRNA',
      'Không cần primer (đoạn mồi)',
      'Nhận diện promoter để bắt đầu phiên mã',
      'Tổng hợp ARN theo chiều 5\'→3\'',
      'Cần các yếu tố phiên mã (transcription factors)'
    ]
  }
};

export default function DNAHelix({ 
  width = "100%", 
  height = "100%",
  showLabels = true,
  backgroundColor = "#1a1a2e"
}) {
  const [selectedStructure, setSelectedStructure] = useState('dna_bform');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const currentKnowledge = DNA_KNOWLEDGE[selectedStructure];
  const currentStructure = DNA_RNA_STRUCTURES[selectedStructure];

  return (
    <div className="relative" style={{ width, height, minHeight: height === '100%' ? '100%' : undefined, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : undefined }}>
      
      <MolstarViewer
        key={selectedStructure}
        structureKey={selectedStructure}
        width="100%"
        height="100%"
        backgroundColor={backgroundColor}
        showControls={true}
        showInfo={false}
      />

      {/* Structure selector - bên phải, có nút thu gọn */}
      <div className="absolute top-4 right-4 z-20">
        {/* Toggle button */}
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="mb-2 px-3 py-2 bg-black/70 backdrop-blur-md rounded-lg text-xs text-gray-300 hover:bg-black/80 transition border border-white/10 flex items-center gap-1.5"
        >
          🧬 {selectorOpen ? '◀ Ẩn danh sách' : '▶ Chọn cấu trúc'}
        </button>

        {/* Selector panel */}
        {selectorOpen && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 animate-in slide-in-from-right">
            <p className="text-gray-400 text-xs px-2 mb-1.5">🧬 Chọn cấu trúc:</p>
            {Object.entries(DNA_RNA_STRUCTURES).map(([key, structure]) => {
              const catInfo = PDB_CATEGORIES[structure.category];
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedStructure(key); setSelectorOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all mb-1 ${
                    selectedStructure === key
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1">{catInfo?.icon}</span>
                  {structure.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info panel phía dưới */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧬</span>
                <h3 className="font-bold text-purple-300">{currentStructure?.name}</h3>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  PDB: {currentStructure?.id}
                </span>
              </div>
              <p className="text-sm text-gray-300">{currentStructure?.description}</p>
            </div>
            <button
              onClick={() => setShowKnowledge(!showKnowledge)}
              className="flex-shrink-0 px-3 py-1.5 bg-purple-500/20 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition"
            >
              📚 {showKnowledge ? 'Ẩn' : 'Kiến thức'}
            </button>
          </div>

          {showKnowledge && currentKnowledge && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm font-semibold text-purple-300 mb-2">{currentKnowledge.title}</p>
              <ul className="space-y-1">
                {currentKnowledge.facts.map((fact, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="text-xs text-gray-600 mt-2">
            🔬 Dữ liệu khoa học thực từ Protein Data Bank (RCSB) • Mol* Viewer
          </p>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <p className="text-white/50 text-xs">🔬 Cấu trúc phân tử thật từ PDB</p>
      </div>
    </div>
  );
}

export function DNAHelixModel() {
  return null;
}
