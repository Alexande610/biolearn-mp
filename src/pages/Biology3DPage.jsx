// Biology3DPage.jsx - Trang mô phỏng 3D Sinh học - Phiên bản nâng cấp
// Tích hợp: GLB models (giải phẫu) + Mol* (phân tử/DNA/Virus) + Three.js (tế bào)
import { useState, Suspense, lazy, useCallback, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Dna, Circle, Leaf, Microscope, Sun, Heart,
  ChevronRight, X, Maximize2, Minimize2, Info, BookOpen, Star,
  Bug, Atom, FlaskConical, AlertTriangle, RotateCcw
} from 'lucide-react';

// Lazy load các components 3D
const DNAHelix = lazy(() => import('../components/biology3d/DNAHelix'));
const AnimalCell = lazy(() => import('../components/biology3d/AnimalCell'));
const PlantCell = lazy(() => import('../components/biology3d/PlantCell'));
const MicroscopeView = lazy(() => import('../components/biology3d/MicroscopeView'));
const Photosynthesis = lazy(() => import('../components/biology3d/Photosynthesis'));
const HumanBody = lazy(() => import('../components/biology3d/HumanBody'));
const VirusViewer = lazy(() => import('../components/biology3d/VirusViewer'));
const ProteinViewer = lazy(() => import('../components/biology3d/ProteinViewer'));

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Biology3D Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Có lỗi xảy ra</h3>
            <p className="text-gray-400 text-sm mb-4">
              Không thể tải mô hình 3D. Hãy kiểm tra kết nối mạng (cho Mol*) hoặc thử lại.
            </p>
            <button
              onClick={this.props.onReset}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" /> Quay lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Thông tin các mô phỏng 3D - ĐẦY ĐỦ với models mới
const BIOLOGY_3D_MODELS = [
  {
    id: 'human-body',
    name: 'Giải phẫu Cơ thể người',
    description: 'Mô hình 3D THẬT từ file GLB: hệ cơ toàn thân, đường hô hấp, hệ bạch huyết. Xoay, zoom chi tiết.',
    icon: Heart,
    color: 'from-rose-500 to-red-600',
    bgColor: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    grades: [8, 11],
    topics: ['Sinh học cơ thể người', 'Các hệ cơ quan'],
    component: 'HumanBody',
    features: ['📦 Mô hình GLB thật', '🏥 4 hệ cơ quan', '🔄 Xoay 360°'],
    badge: '🔥 GLB THẬT',
    badgeColor: 'bg-red-500'
  },
  {
    id: 'dna-helix',
    name: 'Cấu trúc ADN / ARN',
    description: 'Dữ liệu ADN THẬT từ Protein Data Bank (RCSB). Xoắn kép B-DNA, Z-DNA, tRNA, DNA Polymerase.',
    icon: Dna,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    grades: [9, 10, 12],
    topics: ['Di truyền học', 'Cơ sở phân tử'],
    component: 'DNAHelix',
    features: ['🔬 Dữ liệu PDB thật', '⚛️ Mol* Viewer', '🧬 6 cấu trúc'],
    badge: '🔬 MOL* KHOA HỌC',
    badgeColor: 'bg-purple-500'
  },
  {
    id: 'virus-viewer',
    name: 'Cấu trúc Virus',
    description: 'Virus THẬT từ PDB: COVID-19 Spike Protein, HIV Capsid, Influenza Hemagglutinin.',
    icon: Bug,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    grades: [10, 11, 12],
    topics: ['Vi sinh vật học', 'Virus học'],
    component: 'VirusViewer',
    features: ['🦠 Virus thật', '⚛️ Mol* Viewer', '📊 Dữ liệu PDB'],
    badge: '🔬 MOL* KHOA HỌC',
    badgeColor: 'bg-amber-500'
  },
  {
    id: 'protein-viewer',
    name: 'Cấu trúc Protein',
    description: 'Protein THẬT: Hemoglobin, Insulin, ATP Synthase, Myoglobin, Lysozyme từ PDB.',
    icon: Atom,
    color: 'from-red-500 to-pink-600',
    bgColor: 'bg-red-500/20',
    iconColor: 'text-red-400',
    grades: [10, 11, 12],
    topics: ['Sinh hóa học', 'Cấu trúc protein'],
    component: 'ProteinViewer',
    features: ['🔴 Protein thật', '⚛️ Mol* Viewer', '5 cấu trúc'],
    badge: '🔬 MOL* KHOA HỌC',
    badgeColor: 'bg-red-500'
  },
  {
    id: 'animal-cell',
    name: 'Tế bào động vật 3D',
    description: 'Mô hình tế bào động vật 3D với 9 bào quan: nhân, ti thể, ER hạt & trơn, Golgi, lysosome, ribosome, trung thể.',
    icon: Circle,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    grades: [6, 7, 8, 10],
    topics: ['Tế bào học', 'Cấu tạo tế bào'],
    component: 'AnimalCell',
    features: ['🔬 9 bào quan', '📦 3D ThreeJS', 'Click chọn bào quan'],
    badge: '🧬 TẾ BÀO 3D',
    badgeColor: 'bg-violet-500'
  },
  {
    id: 'plant-cell',
    name: 'Tế bào thực vật 3D',
    description: 'Mô hình tế bào thực vật 3D: thành TB, không bào trung tâm lớn, lục lạp, ti thể, nhân bị đẩy ra rìa.',
    icon: Leaf,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/20',
    iconColor: 'text-green-400',
    grades: [6, 7, 10],
    topics: ['Tế bào học', 'Cấu tạo tế bào thực vật'],
    component: 'PlantCell',
    features: ['🌿 8 bào quan', '📦 3D ThreeJS', 'Click chọn bào quan'],
    badge: '🧬 TẾ BÀO 3D',
    badgeColor: 'bg-green-500'
  },
  {
    id: 'microscope',
    name: 'Kính hiển vi - Vi sinh vật',
    description: 'Quan sát vi sinh vật dưới kính hiển vi: trùng roi, trùng biến hình, vi khuẩn, tảo.',
    icon: Microscope,
    color: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    grades: [6, 7, 10],
    topics: ['Vi sinh vật học', 'Đa dạng thế giới sống'],
    component: 'MicroscopeView',
    features: ['Phóng đại', 'Nhiều mẫu vật', 'Di chuyển vi sinh'],
    badge: null
  },
  {
    id: 'photosynthesis',
    name: 'Quá trình quang hợp',
    description: 'Mô phỏng quá trình quang hợp: pha sáng ở thylakoid và chu trình Calvin ở chất nền.',
    icon: Sun,
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    grades: [7, 10, 11],
    topics: ['Chuyển hóa vật chất', 'Quang hợp'],
    component: 'Photosynthesis',
    features: ['Pha sáng', 'Chu trình Calvin', 'ATP & NADPH'],
    badge: null
  },
];

// Loading component
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-sm">Đang tải mô hình 3D...</p>
        <p className="text-white/40 text-xs mt-1">Mô hình khoa học có thể mất vài giây</p>
      </div>
    </div>
  );
}

// Model Card component
function ModelCard({ model, onSelect, index }) {
  const Icon = model.icon;
  
  return (
    <button
      onClick={() => onSelect(model)}
      className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl border border-white/10 hover:border-white/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Badge */}
      {model.badge && (
        <div className={`absolute -top-2 -right-2 ${model.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10`}>
          {model.badge}
        </div>
      )}

      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      
      {/* Content */}
      <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">
        {model.name}
      </h3>
      <p className="text-gray-400 text-sm line-clamp-2 mb-3">
        {model.description}
      </p>
      
      {/* Grades */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {model.grades.map(grade => (
          <span 
            key={grade}
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${model.bgColor} ${model.iconColor}`}
          >
            Lớp {grade}
          </span>
        ))}
      </div>
      
      {/* Features */}
      <div className="flex flex-wrap gap-1">
        {model.features.map((feature, i) => (
          <span key={i} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
            {feature}
          </span>
        ))}
      </div>
      
      {/* Arrow */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
        <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
      </div>
    </button>
  );
}

// 3D Viewer Modal
function ModelViewer({ model, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const renderComponent = useCallback(() => {
    const commonProps = { width: '100%', height: '100%' };
    
    switch (model.component) {
      case 'DNAHelix':
        return <DNAHelix {...commonProps} />;
      case 'AnimalCell':
        return <AnimalCell {...commonProps} />;
      case 'PlantCell':
        return <PlantCell {...commonProps} />;
      case 'MicroscopeView':
        return <MicroscopeView {...commonProps} />;
      case 'Photosynthesis':
        return <Photosynthesis {...commonProps} />;
      case 'HumanBody':
        return <HumanBody {...commonProps} />;
      case 'VirusViewer':
        return <VirusViewer {...commonProps} />;
      case 'ProteinViewer':
        return <ProteinViewer {...commonProps} />;
      default:
        return <div className="text-white text-center p-8">Component không tồn tại</div>;
    }
  }, [model.component]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const Icon = model.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-3 z-20">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 flex-shrink-0 ${model.iconColor}`} />
                <h2 className="text-white font-bold text-lg truncate">{model.name}</h2>
                {model.badge && (
                  <span className={`${model.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0`}>
                    {model.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs truncate">{model.topics.join(' • ')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                showInfo ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Thông tin"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition"
              title="Đóng"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Content */}
      <div className="flex-1 relative overflow-hidden">
        <ErrorBoundary onReset={onClose}>
          <Suspense fallback={<LoadingFallback />}>
            {renderComponent()}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-20 right-4 w-72 max-h-[calc(100vh-120px)] overflow-y-auto bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 z-30">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Thông tin
          </h3>
          <p className="text-gray-300 text-sm mb-3">{model.description}</p>
          
          <div className="space-y-2">
            <div>
              <p className="text-gray-500 text-xs mb-1">Lớp học:</p>
              <div className="flex flex-wrap gap-1">
                {model.grades.map(g => (
                  <span key={g} className={`px-2 py-0.5 rounded text-xs ${model.bgColor} ${model.iconColor}`}>
                    Lớp {g}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Chủ đề:</p>
              <div className="flex flex-wrap gap-1">
                {model.topics.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Tính năng:</p>
              <div className="flex flex-wrap gap-1">
                {model.features.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">✓ {f}</span>
                ))}
              </div>
            </div>
            {model.badge && (
              <div className="mt-2 p-2 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-xs">
                  {model.badge.includes('GLB') && '📦 Mô hình 3D thật từ Sketchfab, render bằng React Three Fiber.'}
                  {model.badge.includes('MOL') && '🔬 Dữ liệu khoa học thật từ Protein Data Bank (RCSB), render bằng Mol*.'}
                  {model.badge.includes('ĐẦY ĐỦ') && '⭐ Trình duyệt phân tử đầy đủ với 15+ cấu trúc khoa học.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function Biology3DPage() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(null);
  const [filterGrade, setFilterGrade] = useState(null);
  const [filterType, setFilterType] = useState(null); // 'scientific', 'interactive', null

  let filteredModels = BIOLOGY_3D_MODELS;
  
  if (filterGrade) {
    filteredModels = filteredModels.filter(m => m.grades.includes(filterGrade));
  }
  
  if (filterType === 'scientific') {
    filteredModels = filteredModels.filter(m => m.badge);
  } else if (filterType === 'interactive') {
    filteredModels = filteredModels.filter(m => !m.badge);
  }

  const grades = [6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900/30 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-white font-bold text-xl flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  Mô phỏng Sinh học 3D
                </h1>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{BIOLOGY_3D_MODELS.length} mô hình</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        {/* Type filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-gray-300 text-sm whitespace-nowrap font-semibold">Loại:</span>
          {[
            { key: null, label: 'Tất cả', icon: '🔬' },
            { key: 'scientific', label: 'Khoa học thật (GLB + Mol*)', icon: '⚛️' },
            { key: 'interactive', label: 'Mô phỏng tương tác', icon: '🎮' },
          ].map(type => (
            <button
              key={type.key || 'all'}
              onClick={() => setFilterType(type.key)}
              className={`filter-btn ${filterType === type.key ? 'active-purple' : ''}`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-gray-300 text-sm whitespace-nowrap font-semibold">Lớp:</span>
          <button
            onClick={() => setFilterGrade(null)}
            className={`filter-btn ${filterGrade === null ? 'active-blue' : ''}`}
          >
            Tất cả
          </button>
          {grades.map(grade => (
            <button
              key={grade}
              onClick={() => setFilterGrade(grade)}
              className={`filter-btn ${filterGrade === grade ? 'active-blue' : ''}`}
            >
              Lớp {grade}
            </button>
          ))}
        </div>
      </div>

            {/* Models Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model, index) => (
            <ModelCard
              key={model.id}
              model={model}
              index={index}
              onSelect={setSelectedModel}
            />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400">Không tìm thấy mô hình phù hợp</p>
            <button
              onClick={() => { setFilterGrade(null); setFilterType(null); }}
              className="mt-3 text-blue-400 text-sm hover:underline"
            >
              Xem tất cả mô hình
            </button>
          </div>
        )}
      </div>


      {/* Model Viewer Modal */}
      {selectedModel && (
        <ModelViewer 
          model={selectedModel} 
          onClose={() => setSelectedModel(null)} 
        />
      )}
    </div>
  );
}
