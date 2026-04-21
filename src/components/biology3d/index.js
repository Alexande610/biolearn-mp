// index.js - Export tất cả components 3D sinh học (phiên bản nâng cấp)
export { default as DNAHelix, DNAHelixModel } from './DNAHelix';
export { default as AnimalCell, AnimalCellModel, ORGANELLES_INFO } from './AnimalCell';
export { default as PlantCell, PlantCellModel, PLANT_ORGANELLES_INFO } from './PlantCell';
export { default as MicroscopeView, MicroscopeScene, MICROORGANISMS } from './MicroscopeView';
export { default as Photosynthesis } from './Photosynthesis';
export { default as HumanBody, ANATOMY_MODELS, AnatomyScene } from './HumanBody';
export { default as MolstarViewer, PDB_STRUCTURES, PDB_CATEGORIES } from './MolstarViewer';
export { default as VirusViewer } from './VirusViewer';
export { default as ProteinViewer } from './ProteinViewer';

// Thông tin về các mô phỏng - CẬP NHẬT với mô hình thật
export const SIMULATIONS_INFO = {
  dnaHelix: {
    id: 'dna-helix',
    name: 'Cấu trúc ADN/ARN (Mol*)',
    description: 'Cấu trúc ADN xoắn kép THẬT từ Protein Data Bank. Dữ liệu khoa học phòng thí nghiệm.',
    grades: [9, 10, 12],
    topics: ['Di truyền học', 'Cơ sở phân tử'],
    thumbnail: '/images/simulations/dna.png',
    component: 'DNAHelix',
    isScientific: true
  },
  animalCell: {
    id: 'animal-cell',
    name: 'Tế bào động vật 3D',
    description: 'Tế bào động vật với bào quan chi tiết: nhân, ti thể, ER, Golgi, lysosome, trung thể.',
    grades: [6, 7, 8, 10],
    topics: ['Tế bào học', 'Cấu tạo tế bào'],
    thumbnail: '/images/simulations/animal-cell.png',
    component: 'AnimalCell'
  },
  plantCell: {
    id: 'plant-cell',
    name: 'Tế bào thực vật 3D',
    description: 'Tế bào thực vật với lục lạp, thành tế bào, không bào trung tâm lớn.',
    grades: [6, 7, 10],
    topics: ['Tế bào học', 'Cấu tạo tế bào thực vật'],
    thumbnail: '/images/simulations/plant-cell.png',
    component: 'PlantCell'
  },
  microscopeView: {
    id: 'microscope',
    name: 'Kính hiển vi - Vi sinh vật',
    description: 'Quan sát vi sinh vật dưới kính hiển vi: trùng roi, trùng biến hình, vi khuẩn...',
    grades: [6, 7, 10],
    topics: ['Vi sinh vật học', 'Đa dạng thế giới sống'],
    thumbnail: '/images/simulations/microscope.png',
    component: 'MicroscopeView'
  },
  photosynthesis: {
    id: 'photosynthesis',
    name: 'Quá trình quang hợp',
    description: 'Mô phỏng quang hợp: pha sáng và chu trình Calvin.',
    grades: [7, 10, 11],
    topics: ['Chuyển hóa vật chất', 'Quang hợp'],
    thumbnail: '/images/simulations/photosynthesis.png',
    component: 'Photosynthesis'
  },
  humanBody: {
    id: 'human-body',
    name: 'Giải phẫu Cơ thể người (GLB)',
    description: 'Mô hình giải phẫu 3D THẬT: hệ cơ, đường hô hấp, hệ bạch huyết từ file GLB.',
    grades: [8, 11],
    topics: ['Sinh học cơ thể người', 'Các hệ cơ quan'],
    thumbnail: '/images/simulations/human-body.png',
    component: 'HumanBody',
    isScientific: true
  },
  virusViewer: {
    id: 'virus-viewer',
    name: 'Cấu trúc Virus (Mol*)',
    description: 'Cấu trúc virus THẬT: COVID-19 Spike, HIV Capsid, Influenza từ Protein Data Bank.',
    grades: [10, 11, 12],
    topics: ['Vi sinh vật học', 'Virus học'],
    thumbnail: '/images/simulations/virus.png',
    component: 'VirusViewer',
    isScientific: true
  },
  proteinViewer: {
    id: 'protein-viewer',
    name: 'Cấu trúc Protein (Mol*)',
    description: 'Protein THẬT: Hemoglobin, Insulin, ATP Synthase, Lysozyme từ Protein Data Bank.',
    grades: [10, 11, 12],
    topics: ['Sinh hóa học', 'Cấu trúc protein'],
    thumbnail: '/images/simulations/protein.png',
    component: 'ProteinViewer',
    isScientific: true
  }
};

// Lấy danh sách mô phỏng theo lớp
export function getSimulationsByGrade(grade) {
  return Object.values(SIMULATIONS_INFO).filter(sim => 
    sim.grades.includes(grade)
  );
}

// Lấy tất cả mô phỏng
export function getAllSimulations() {
  return Object.values(SIMULATIONS_INFO);
}

// Lấy mô phỏng khoa học (dùng dữ liệu thật)
export function getScientificSimulations() {
  return Object.values(SIMULATIONS_INFO).filter(sim => sim.isScientific);
}
