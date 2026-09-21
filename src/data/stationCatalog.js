export const STATION_GAME_TYPES = Object.freeze([
  'quiz',
  'match',
  'fill',
  'category',
  'dragdrop',
]);

const futureStation = (grade) => ({
  id: `g${grade}_future`,
  name: 'Trạm Khai Phá - Sắp Ra Mắt',
  subtitle: 'Vùng biển tri thức nâng cao đang được xây dựng...',
  daysCount: 10,
  startDay: 31,
  icon: 'hourglass',
  isFuture: true,
});

export const STATION_CATALOG = Object.freeze({
  6: Object.freeze([
    { id: 'g6_st1', name: 'Trạm 1: Kính Hiển Vi & Tế Bào', subtitle: 'Kính hiển vi quang học, tế bào và các thành phần của tế bào', daysCount: 10, startDay: 1, icon: 'microscope' },
    { id: 'g6_st2', name: 'Trạm 2: Từ Tế Bào Đến Cơ Thể', subtitle: 'Cơ thể đơn bào, đa bào, mô, cơ quan và hệ cơ quan', daysCount: 10, startDay: 11, icon: 'sprout' },
    { id: 'g6_st3', name: 'Trạm 3: Đa Dạng Thế Giới Sống', subtitle: 'Phân loại, virus, vi khuẩn, nguyên sinh vật, nấm, thực vật và động vật', daysCount: 10, startDay: 21, icon: 'tree' },
    futureStation(6),
  ]),
  7: Object.freeze([
    { id: 'g7_st1', name: 'Trạm 1: Quang Hợp & Dinh Dưỡng Thực Vật', subtitle: 'Quang hợp, nước, chất dinh dưỡng và vận chuyển ở thực vật', daysCount: 10, startDay: 1, icon: 'leaf' },
    { id: 'g7_st2', name: 'Trạm 2: Hô Hấp & Trao Đổi Ở Sinh Vật', subtitle: 'Hô hấp tế bào, trao đổi khí và dinh dưỡng ở động vật', daysCount: 10, startDay: 11, icon: 'atom' },
    { id: 'g7_st3', name: 'Trạm 3: Cảm Ứng, Sinh Trưởng & Sinh Sản', subtitle: 'Cảm ứng, tập tính, sinh trưởng, phát triển và sinh sản', daysCount: 10, startDay: 21, icon: 'heart' },
    futureStation(7),
  ]),
  8: Object.freeze([
    { id: 'g8_st1', name: 'Trạm 1: Vận Động, Dinh Dưỡng & Tuần Hoàn', subtitle: 'Khái quát cơ thể người, vận động, tiêu hoá, máu và tuần hoàn', daysCount: 10, startDay: 1, icon: 'heart' },
    { id: 'g8_st2', name: 'Trạm 2: Điều Hoà Cơ Thể Người', subtitle: 'Hô hấp, bài tiết, nội môi, thần kinh, nội tiết, da và sinh sản', daysCount: 10, startDay: 11, icon: 'microscope' },
    { id: 'g8_st3', name: 'Trạm 3: Sinh Vật & Môi Trường', subtitle: 'Quần thể, quần xã, hệ sinh thái, sinh quyển và bảo vệ môi trường', daysCount: 10, startDay: 21, icon: 'tree' },
    futureStation(8),
  ]),
  9: Object.freeze([
    { id: 'g9_st1', name: 'Trạm 1: Mendel, Nucleic Acid & Gene', subtitle: 'Di truyền học, quy luật Mendel, DNA, RNA và biểu hiện gene', daysCount: 10, startDay: 1, icon: 'dna' },
    { id: 'g9_st2', name: 'Trạm 2: Gene, Nhiễm Sắc Thể & Di Truyền Người', subtitle: 'Đột biến, phân bào, giới tính, liên kết gene và công nghệ di truyền', daysCount: 10, startDay: 11, icon: 'microscope' },
    { id: 'g9_st3', name: 'Trạm 3: Tiến Hoá', subtitle: 'Chọn lọc, cơ chế tiến hoá và sự phát sinh, phát triển của sự sống', daysCount: 10, startDay: 21, icon: 'tree' },
    futureStation(9),
  ]),
  10: Object.freeze([
    { id: 'g10_st1', name: 'Trạm 1: Thành Phần Hoá Học & Cấu Trúc Tế Bào', subtitle: 'Nước, phân tử sinh học, tế bào nhân sơ và tế bào nhân thực', daysCount: 10, startDay: 1, icon: 'flask' },
    { id: 'g10_st2', name: 'Trạm 2: Trao Đổi & Chuyển Hoá Trong Tế Bào', subtitle: 'Màng tế bào, truyền tin, enzyme và chuyển hoá năng lượng', daysCount: 10, startDay: 11, icon: 'atom' },
    { id: 'g10_st3', name: 'Trạm 3: Phân Bào, Vi Sinh Vật & Virus', subtitle: 'Chu kì tế bào, công nghệ tế bào, vi sinh vật và virus', daysCount: 10, startDay: 21, icon: 'dna' },
    futureStation(10),
  ]),
  11: Object.freeze([
    { id: 'g11_st1', name: 'Trạm 1: Trao Đổi Chất & Chuyển Hoá Năng Lượng', subtitle: 'Trao đổi ở thực vật và động vật, miễn dịch và cân bằng nội môi', daysCount: 10, startDay: 1, icon: 'leaf' },
    { id: 'g11_st2', name: 'Trạm 2: Cảm Ứng, Sinh Trưởng & Phát Triển', subtitle: 'Cảm ứng, tập tính, sinh trưởng và phát triển ở sinh vật', daysCount: 10, startDay: 11, icon: 'heart' },
    { id: 'g11_st3', name: 'Trạm 3: Sinh Sản & Tích Hợp Sinh Lí', subtitle: 'Sinh sản, mối liên hệ giữa các quá trình sinh lí và ngành nghề', daysCount: 10, startDay: 21, icon: 'sprout' },
    futureStation(11),
  ]),
  12: Object.freeze([
    { id: 'g12_st1', name: 'Trạm 1: Di Truyền Phân Tử & Nhiễm Sắc Thể', subtitle: 'DNA, gene, biểu hiện gene, Mendel và di truyền nhiễm sắc thể', daysCount: 10, startDay: 1, icon: 'dna' },
    { id: 'g12_st2', name: 'Trạm 2: Di Truyền Mở Rộng & Tiến Hoá', subtitle: 'Di truyền ngoài nhân, quần thể, chọn lọc và tiến hoá', daysCount: 10, startDay: 11, icon: 'atom' },
    { id: 'g12_st3', name: 'Trạm 3: Sinh Thái, Bảo Tồn & Phát Triển Bền Vững', subtitle: 'Quần thể, quần xã, hệ sinh thái, bảo tồn và phát triển bền vững', daysCount: 10, startDay: 21, icon: 'tree' },
    futureStation(12),
  ]),
});

export const ACTIVE_STATIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(STATION_CATALOG).map(([grade, stations]) => [
      Number(grade),
      Object.freeze(stations.filter((station) => !station.isFuture)),
    ]),
  ),
);

export const getStationsForGrade = (grade, { includeFuture = true } = {}) => {
  const normalizedGrade = Number(grade);
  const stations = STATION_CATALOG[normalizedGrade] || STATION_CATALOG[6];
  return includeFuture ? stations : stations.filter((station) => !station.isFuture);
};

export const getStationById = (grade, stationId) => (
  getStationsForGrade(grade).find((station) => station.id === stationId) || null
);
