// MolstarViewer.jsx - Tích hợp Mol* để hiển thị cấu trúc phân tử thật từ PDB
// FIX: Representation switching hoạt động đúng, bỏ MolstarExplorer
import { useRef, useEffect, useState, useCallback } from 'react';

// Utility: hex color sang int (module-level)
function hexToInt(hex) {
  const clean = (hex || '#1a1a2e').replace('#', '');
  const val = parseInt(clean, 16);
  return isNaN(val) ? 0x1a1a2e : val;
}

// Danh sách cấu trúc phân tử từ Protein Data Bank
export const PDB_STRUCTURES = {
  // DNA
  dna_bform: {
    id: '1BNA',
    name: 'ADN dạng B (xoắn kép)',
    description: 'Cấu trúc ADN xoắn kép chuẩn dạng B - dạng phổ biến nhất trong tự nhiên',
    category: 'dna',
    url: 'https://files.rcsb.org/view/1BNA.cif'
  },
  dna_zform: {
    id: '4OCB',
    name: 'ADN dạng Z',
    description: 'Cấu trúc ADN dạng Z - xoắn trái, đặc biệt',
    category: 'dna',
    url: 'https://files.rcsb.org/view/4OCB.cif'
  },
  dna_aform: {
    id: '440D',
    name: 'ADN dạng A',
    description: 'Cấu trúc ADN dạng A - ngắn và rộng hơn dạng B',
    category: 'dna',
    url: 'https://files.rcsb.org/view/440D.cif'
  },
  // RNA
  trna: {
    id: '1EHZ',
    name: 'tRNA (Phenylalanine)',
    description: 'Transfer RNA - vận chuyển amino acid Phenylalanine đến ribosome',
    category: 'rna',
    url: 'https://files.rcsb.org/view/1EHZ.cif'
  },
  // Protein
  hemoglobin: {
    id: '1A3N',
    name: 'Hemoglobin',
    description: 'Protein vận chuyển O₂ trong máu - gồm 4 tiểu đơn vị với nhóm Heme',
    category: 'protein',
    url: 'https://files.rcsb.org/view/1A3N.cif'
  },
  myoglobin: {
    id: '1MBN',
    name: 'Myoglobin',
    description: 'Protein dự trữ O₂ trong cơ bắp - cấu trúc bậc 3 điển hình',
    category: 'protein',
    url: 'https://files.rcsb.org/view/1MBN.cif'
  },
  insulin: {
    id: '4INS',
    name: 'Insulin',
    description: 'Hormone điều hòa đường huyết - do tế bào beta tuyến tụy tiết ra',
    category: 'protein',
    url: 'https://files.rcsb.org/view/4INS.cif'
  },
  atp_synthase: {
    id: '5ARA',
    name: 'ATP Synthase',
    description: 'Enzyme tổng hợp ATP - "động cơ quay" phân tử trong ti thể',
    category: 'protein',
    url: 'https://files.rcsb.org/view/5ARA.cif'
  },
  // Virus
  covid_spike: {
    id: '6VSB',
    name: 'COVID-19 Spike Protein',
    description: 'Protein gai SARS-CoV-2 - chìa khóa virus bám vào tế bào người (ACE2)',
    category: 'virus',
    url: 'https://files.rcsb.org/view/6VSB.cif'
  },
  hiv_capsid: {
    id: '3J3Q',
    name: 'HIV Capsid',
    description: 'Vỏ protein HIV - bảo vệ RNA virus bên trong',
    category: 'virus',
    url: 'https://files.rcsb.org/view/3J3Q.cif'
  },
  influenza: {
    id: '6Q23',
    name: 'Influenza Hemagglutinin',
    description: 'Hemagglutinin - protein trên bề mặt virus cúm giúp bám vào tế bào chủ',
    category: 'virus',
    url: 'https://files.rcsb.org/view/6Q23.cif'
  },
  // Enzyme
  dna_polymerase: {
    id: '1TAU',
    name: 'DNA Polymerase III',
    description: 'Enzyme nhân đôi ADN - sao chép mạch mới từ mạch khuôn',
    category: 'enzyme',
    url: 'https://files.rcsb.org/view/1TAU.cif'
  },
  rna_polymerase: {
    id: '1I6H',
    name: 'RNA Polymerase II',
    description: 'Enzyme phiên mã - tổng hợp mRNA từ ADN khuôn',
    category: 'enzyme',
    url: 'https://files.rcsb.org/view/1I6H.cif'
  },
  lysozyme: {
    id: '1AKI',
    name: 'Lysozyme',
    description: 'Enzyme bảo vệ trong nước bọt và nước mắt - phân hủy thành vi khuẩn',
    category: 'enzyme',
    url: 'https://files.rcsb.org/view/1AKI.cif'
  },
  // Cell-related proteins
  actin: {
    id: '1ATN',
    name: 'Actin',
    description: 'Protein khung xương tế bào - tạo vi sợi, tham gia vận động tế bào và phân bào',
    category: 'cell',
    url: 'https://files.rcsb.org/view/1ATN.cif'
  },
  tubulin: {
    id: '1TUB',
    name: 'Tubulin (α/β)',
    description: 'Protein tạo vi ống - thoi phân bào, vận chuyển nội bào, cấu trúc lông roi/tiên mao',
    category: 'cell',
    url: 'https://files.rcsb.org/view/1TUB.cif'
  },
  aquaporin: {
    id: '1J4N',
    name: 'Aquaporin (kênh nước)',
    description: 'Protein kênh xuyên màng tế bào - cho nước đi qua bằng thẩm thấu',
    category: 'cell',
    url: 'https://files.rcsb.org/view/1J4N.cif'
  },
  photosystem2: {
    id: '1JB0',
    name: 'Photosystem II',
    description: 'Phức hệ quang hợp II - chứa chlorophyll, tách H₂O tạo O₂ trong pha sáng',
    category: 'cell',
    url: 'https://files.rcsb.org/view/1JB0.cif'
  },
  rubisco: {
    id: '1RCX',
    name: 'RuBisCO',
    description: 'Enzyme phổ biến nhất Trái Đất - cố định CO₂ trong chu trình Calvin (quang hợp)',
    category: 'cell',
    url: 'https://files.rcsb.org/view/1RCX.cif'
  }
};

// Category info
export const PDB_CATEGORIES = {
  dna: { name: 'ADN', icon: '🧬', color: '#8b5cf6', description: 'Acid Deoxyribonucleic - vật chất di truyền' },
  rna: { name: 'ARN', icon: '🔬', color: '#06b6d4', description: 'Acid Ribonucleic - phiên mã và dịch mã' },
  protein: { name: 'Protein', icon: '🔴', color: '#ef4444', description: 'Đại phân tử sinh học đa chức năng' },
  virus: { name: 'Virus', icon: '🦠', color: '#f59e0b', description: 'Cấu trúc protein virus gây bệnh' },
  enzyme: { name: 'Enzyme', icon: '⚡', color: '#22c55e', description: 'Chất xúc tác sinh học' },
  cell: { name: 'Tế bào', icon: '🔵', color: '#3b82f6', description: 'Protein cấu trúc & chức năng tế bào' }
};

// Mol* Viewer Component
export default function MolstarViewer({
  structureKey = 'dna_bform',
  customUrl = null,
  width = '100%',
  height = '100%',
  backgroundColor = '#1a1a2e',
  showControls = true,
  showInfo = true,
  onReady = null
}) {
  const containerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const trajectoryRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [representation, setRepresentation] = useState('cartoon');
  const [isChangingRep, setIsChangingRep] = useState(false);

  const structure = PDB_STRUCTURES[structureKey];
  const url = customUrl || structure?.url;

  // Validate and normalize backgroundColor
  const validBg = (backgroundColor && backgroundColor.startsWith('#') && backgroundColor.length >= 4) 
    ? backgroundColor 
    : '#1a1a2e';

  // Initialize Mol* viewer
  const initViewer = useCallback(async () => {
    if (!containerRef.current || !url) return;

    setIsLoading(true);
    setError(null);

    try {
      const { createPluginUI } = await import('molstar/lib/mol-plugin-ui');
      const { DefaultPluginUISpec } = await import('molstar/lib/mol-plugin-ui/spec');
      const { PluginConfig } = await import('molstar/lib/mol-plugin/config');

      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.dispose();
        viewerInstanceRef.current = null;
      }

      containerRef.current.innerHTML = '';

      const spec = DefaultPluginUISpec();
      
      spec.layout = {
        initial: {
          isExpanded: false,
          showControls: false,
          controlsDisplay: 'reactive',
          regionState: {
            bottom: 'hidden',
            left: 'hidden',
            right: 'hidden',
            top: 'hidden',
          }
        }
      };

      spec.config = spec.config || [];
      spec.config.push(
        [PluginConfig.Viewport.ShowExpand, false],
        [PluginConfig.Viewport.ShowControls, false],
        [PluginConfig.Viewport.ShowSelectionMode, false],
        [PluginConfig.Viewport.ShowAnimation, false]
      );

      const plugin = await createPluginUI({
        target: containerRef.current,
        spec,
        render: (component, element) => {
          import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(element);
            root.render(component);
          });
        }
      });

      viewerInstanceRef.current = plugin;

      // Background color
      if (plugin.canvas3d) {
        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            backgroundColor: hexToInt(validBg)
          }
        });
      }

      // Load structure
      const data = await plugin.builders.data.download(
        { url, isBinary: url.endsWith('.bcif') },
        { state: { isGhost: true } }
      );

      const trajectory = await plugin.builders.structure.parseTrajectory(
        data, 
        (url.endsWith('.cif') || url.endsWith('.bcif')) ? 'mmcif' : 'pdb'
      );
      
      trajectoryRef.current = trajectory;

      await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
        structure: { name: 'model', params: {} },
        showUnitcell: false,
        representationPreset: 'auto'
      });

      setCurrentStructure(structure);
      setRepresentation('cartoon');
      setIsLoading(false);

      if (onReady) onReady(plugin);

    } catch (err) {
      console.error('Mol* initialization error:', err);
      setError(`Không thể tải cấu trúc phân tử: ${err.message}`);
      setIsLoading(false);
    }
  }, [url, structure, onReady, validBg]);

  useEffect(() => {
    initViewer();
    return () => {
      if (viewerInstanceRef.current) {
        try { viewerInstanceRef.current.dispose(); } catch (e) {}
        viewerInstanceRef.current = null;
      }
    };
  }, [initViewer]);

  // FIX: Change representation - 2-phase: xóa representation nodes → thêm mới
  const changeRepresentation = useCallback(async (repType) => {
    const plugin = viewerInstanceRef.current;
    if (!plugin || isChangingRep) return;

    setIsChangingRep(true);
    setRepresentation(repType);

    const molRepMap = {
      'cartoon': 'cartoon',
      'ball-and-stick': 'ball-and-stick',
      'spacefill': 'spacefill',
      'surface': 'molecular-surface',
      'gaussian': 'gaussian-surface'
    };

    try {
      const molRepType = molRepMap[repType] || 'cartoon';
      const colorScheme = (repType === 'ball-and-stick' || repType === 'spacefill') 
        ? 'element-symbol' 
        : 'chain-id';

      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures || structures.length === 0) throw new Error('No structures');

      // Phase 1: Xóa CHỈ representation nodes (giữ nguyên component nodes)
      let deleteBuilder = plugin.build();
      let hasDeletes = false;

      for (const s of structures) {
        for (const comp of s.components) {
          for (const rep of comp.representations) {
            if (rep.cell?.transform?.ref) {
              deleteBuilder = deleteBuilder.delete(rep.cell.transform.ref);
              hasDeletes = true;
            }
          }
        }
      }

      if (hasDeletes) {
        await deleteBuilder.commit();
      }

      // Phase 2: Lấy hierarchy mới, thêm representation mới vào các component còn nguyên
      const freshStructures = plugin.managers.structure.hierarchy.current.structures;

      for (const s of freshStructures) {
        for (const comp of s.components) {
          if (comp.cell?.obj) {
            await plugin.builders.structure.representation.addRepresentation(comp.cell, {
              type: molRepType,
              color: colorScheme
            });
          }
        }
      }
    } catch (err) {
      console.error('Representation change error:', err);
      // Fallback: tải lại hoàn toàn từ URL (browser cache)
      try {
        await plugin.clear();
        if (plugin.canvas3d) {
          plugin.canvas3d.setProps({
            renderer: { ...plugin.canvas3d.props.renderer, backgroundColor: hexToInt(validBg) }
          });
        }
        const data = await plugin.builders.data.download(
          { url, isBinary: url.endsWith('.bcif') },
          { state: { isGhost: true } }
        );
        const traj = await plugin.builders.structure.parseTrajectory(
          data,
          (url.endsWith('.cif') || url.endsWith('.bcif')) ? 'mmcif' : 'pdb'
        );
        trajectoryRef.current = traj;
        await plugin.builders.structure.hierarchy.applyPreset(traj, 'default', {
          structure: { name: 'model', params: {} },
          showUnitcell: false,
          representationPreset: 'auto'
        });
      } catch (e) {
        console.error('Fallback error:', e);
      }
    } finally {
      setIsChangingRep(false);
    }
  }, [isChangingRep, url, validBg]);

  const REPRESENTATIONS = [
    { key: 'cartoon', label: 'Cartoon', icon: '🎨' },
    { key: 'ball-and-stick', label: 'Que & Cầu', icon: '⚛️' },
    { key: 'spacefill', label: 'Không gian', icon: '🔵' },
    { key: 'surface', label: 'Bề mặt', icon: '🫧' },
    { key: 'gaussian', label: 'Gaussian', icon: '☁️' }
  ];

  const categoryInfo = structure ? PDB_CATEGORIES[structure.category] : null;

  return (
    <div className="relative" style={{ width, height, minHeight: '400px' }}>
      {/* Mol* container */}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: validBg }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold mb-1">Đang tải cấu trúc phân tử...</p>
            <p className="text-gray-400 text-sm">{structure?.name || 'Loading'} ({structure?.id || '...'})</p>
            <p className="text-gray-500 text-xs mt-2">Dữ liệu từ Protein Data Bank (RCSB)</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20">
          <div className="text-center max-w-md p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400 font-semibold mb-2">Lỗi tải cấu trúc</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button onClick={initViewer} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Representation Controls */}
      {showControls && !isLoading && !error && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-2 border border-white/10">
            <p className="text-gray-400 text-xs px-2 mb-1">
              {isChangingRep ? '⏳ Đang đổi...' : 'Kiểu hiển thị:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {REPRESENTATIONS.map(rep => (
                <button
                  key={rep.key}
                  onClick={() => changeRepresentation(rep.key)}
                  disabled={isChangingRep}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    representation === rep.key
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  } ${isChangingRep ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {rep.icon} {rep.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Structure Info */}
      {showInfo && structure && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              {categoryInfo && (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: categoryInfo.color + '30' }}>
                  {categoryInfo.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-sm truncate">{structure.name}</h3>
                  <span className="text-gray-500 text-xs flex-shrink-0">PDB: {structure.id}</span>
                </div>
                <p className="text-gray-400 text-xs">{structure.description}</p>
                <p className="text-gray-600 text-xs mt-1">Nguồn: Protein Data Bank (rcsb.org) • Dữ liệu khoa học thực</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
