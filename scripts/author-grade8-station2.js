import fs from 'node:fs';
import { replacePlaceholderStationHints } from '../src/utils/stationHints.js';

const source = (lesson) => [{ source: 'SGK Khoa học tự nhiên 8 - Kết nối tri thức với cuộc sống', publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];
const stages = [
  {
    objective: 'Sắp xếp đường đi của không khí qua hệ hô hấp ở người.', lesson: 'Bài 34. Hệ hô hấp ở người',
    quiz: ['Sau khí quản, không khí đi vào cấu trúc nào?', ['Phế quản', 'Thực quản', 'Dạ dày', 'Động mạch chủ'], 0, 'Cấu trúc này chia nhánh dẫn khí vào phổi.', 'Không khí qua khí quản rồi vào phế quản trước khi đến phổi.'],
    match: [['Mũi', 'Lọc bớt bụi và làm ấm không khí'], ['Khí quản', 'Dẫn khí đến phế quản'], ['Phổi', 'Chứa các phế nang trao đổi khí']],
    fill: ['Không khí từ khí quản đi tiếp vào [blank] trước khi đến phế nang.', 'phế quản'],
    category: [['Đường dẫn khí', 'Nơi trao đổi khí'], [['Mũi', 0], ['Khí quản', 0], ['Phế quản', 0], ['Phế nang', 1]]],
    drag: ['Các [blank] trong phổi là nơi trao đổi oxygen và carbon dioxide với máu.', ['phế nang', 'khớp', 'lông ruột'], 'phế nang'],
  },
  {
    objective: 'Giải thích trao đổi khí tại phế nang và bảo vệ hệ hô hấp.', lesson: 'Bài 34. Hệ hô hấp ở người',
    quiz: ['Ở phế nang, oxygen chủ yếu khuếch tán theo chiều nào?', ['Từ không khí phế nang vào máu', 'Từ máu vào không khí phế nang', 'Từ dạ dày vào máu', 'Từ xương vào khí quản'], 0, 'Máu cần nhận oxygen để vận chuyển tới tế bào.', 'Oxygen khuếch tán từ không khí ở phế nang vào máu.'],
    match: [['Phế nang', 'Nơi trao đổi khí với máu'], ['Mao mạch phổi', 'Nhận oxygen từ phế nang'], ['Tránh khói thuốc', 'Giúp giảm tác hại với hệ hô hấp']],
    fill: ['Carbon dioxide từ máu đi vào [blank] để được thở ra.', 'phế nang'],
    category: [['Bảo vệ hệ hô hấp', 'Gây hại hệ hô hấp'], [['Tránh khói thuốc', 0], ['Giữ không khí trong lành', 0], ['Vận động phù hợp', 0], ['Hít khói thuốc thường xuyên', 1]]],
    drag: ['Khi hít vào, cơ thể nhận khí [blank] để cung cấp cho tế bào.', ['oxygen', 'carbon dioxide', 'methane'], 'oxygen'],
  },
  {
    objective: 'Nhận biết cơ quan và chức năng chính của hệ bài tiết nước tiểu.', lesson: 'Bài 35. Hệ bài tiết ở người',
    quiz: ['Cơ quan nào tạo nước tiểu?', ['Thận', 'Phổi', 'Tim', 'Dạ dày'], 0, 'Cơ quan này lọc máu.', 'Thận lọc máu và tạo nước tiểu.'],
    match: [['Thận', 'Lọc máu và tạo nước tiểu'], ['Ống dẫn nước tiểu', 'Dẫn nước tiểu đến bóng đái'], ['Bóng đái', 'Chứa nước tiểu trước khi thải ra']],
    fill: ['Nước tiểu được tạo ra chủ yếu ở [blank].', 'thận'],
    category: [['Thuộc hệ bài tiết nước tiểu', 'Không thuộc hệ bài tiết nước tiểu'], [['Thận', 0], ['Ống dẫn nước tiểu', 0], ['Bóng đái', 0], ['Tim', 1]]],
    drag: ['Từ thận, nước tiểu đi qua ống dẫn nước tiểu đến [blank].', ['bóng đái', 'phổi', 'dạ dày'], 'bóng đái'],
  },
  {
    objective: 'Nêu vai trò giữ ổn định môi trường trong cơ thể và phối hợp của các cơ quan.', lesson: 'Bài 36. Điều hoà môi trường trong của cơ thể người',
    quiz: ['Vì sao cơ thể cần điều hoà môi trường trong?', ['Để tế bào hoạt động trong điều kiện tương đối ổn định', 'Để máu ngừng lưu thông', 'Để không cần trao đổi chất', 'Để cơ thể không cần nước'], 0, 'Các tế bào cần điều kiện phù hợp.', 'Môi trường trong ổn định tạo điều kiện cho tế bào hoạt động bình thường.'],
    match: [['Máu', 'Vận chuyển nhiều chất trong môi trường trong'], ['Thận', 'Tham gia điều chỉnh lượng nước và chất tan'], ['Phổi', 'Thải carbon dioxide ra môi trường']],
    fill: ['Duy trì các điều kiện bên trong cơ thể tương đối ổn định gọi là cân bằng [blank].', 'nội môi'],
    category: [['Tham gia điều hoà môi trường trong', 'Không phải cơ quan người'], [['Thận', 0], ['Phổi', 0], ['Tim và mạch máu', 0], ['Mạch gỗ của cây', 1]]],
    drag: ['Hệ bài tiết góp phần duy trì sự ổn định của môi trường [blank].', ['trong', 'ngoài vũ trụ', 'đất trồng'], 'trong'],
  },
  {
    objective: 'Mô tả các bộ phận chính và chức năng điều khiển của hệ thần kinh.', lesson: 'Bài 37. Hệ thần kinh và các giác quan ở người',
    quiz: ['Bộ phận nào là trung ương của hệ thần kinh?', ['Não và tuỷ sống', 'Tim và mạch máu', 'Phổi và khí quản', 'Dạ dày và ruột'], 0, 'Xét nơi xử lí thông tin thần kinh.', 'Não và tuỷ sống tạo nên hệ thần kinh trung ương.'],
    match: [['Não', 'Xử lí nhiều thông tin và điều khiển hoạt động'], ['Tuỷ sống', 'Dẫn truyền và tham gia một số phản xạ'], ['Dây thần kinh', 'Liên hệ trung ương với các bộ phận cơ thể']],
    fill: ['Hệ thần kinh trung ương gồm não và [blank] sống.', 'tuỷ'],
    category: [['Hệ thần kinh trung ương', 'Hệ thần kinh ngoại biên'], [['Não', 0], ['Tuỷ sống', 0], ['Dây thần kinh', 1], ['Hạch thần kinh', 1]]],
    drag: ['Các [blank] thần kinh truyền thông tin giữa trung ương và cơ thể.', ['dây', 'mạch', 'ống tiêu hoá'], 'dây'],
  },
  {
    objective: 'Nhận biết vai trò của mắt và tai trong tiếp nhận kích thích.', lesson: 'Bài 37. Hệ thần kinh và các giác quan ở người',
    quiz: ['Cơ quan cảm giác nào tiếp nhận ánh sáng?', ['Mắt', 'Tai', 'Lưỡi', 'Mũi'], 0, 'Nhờ cơ quan này ta nhìn thấy vật.', 'Mắt tiếp nhận kích thích ánh sáng.'],
    match: [['Mắt', 'Tiếp nhận ánh sáng'], ['Tai', 'Tiếp nhận âm thanh'], ['Thụ thể cảm giác', 'Nhận kích thích từ môi trường']],
    fill: ['Cơ quan cảm giác tiếp nhận âm thanh là [blank].', 'tai'],
    category: [['Liên quan thị giác', 'Liên quan thính giác'], [['Ánh sáng', 0], ['Mắt', 0], ['Âm thanh', 1], ['Tai', 1]]],
    drag: ['Đọc sách ở nơi đủ ánh sáng giúp bảo vệ [blank].', ['mắt', 'tai', 'thận'], 'mắt'],
  },
  {
    objective: 'Phân biệt tuyến nội tiết với hormone và nêu vai trò điều hoà của hormone.', lesson: 'Bài 38. Hệ nội tiết ở người',
    quiz: ['Tuyến nội tiết tiết sản phẩm nào vào máu?', ['Hormone', 'Nước tiểu', 'Thức ăn', 'Không khí'], 0, 'Chất này tham gia điều hoà hoạt động cơ thể.', 'Tuyến nội tiết tiết hormone vào máu để điều hoà các hoạt động.'],
    match: [['Tuyến nội tiết', 'Tiết hormone vào máu'], ['Hormone', 'Chất truyền tín hiệu điều hoà'], ['Máu', 'Vận chuyển hormone đến cơ quan đích']],
    fill: ['Sản phẩm của tuyến nội tiết được gọi là [blank].', 'hormone'],
    category: [['Tuyến nội tiết', 'Không phải tuyến nội tiết'], [['Tuyến yên', 0], ['Tuyến giáp', 0], ['Tuyến thượng thận', 0], ['Tuyến mồ hôi', 1]]],
    drag: ['Hormone được máu vận chuyển tới cơ quan [blank].', ['đích', 'rễ', 'lá'], 'đích'],
  },
  {
    objective: 'Nêu chức năng bảo vệ của da và cơ chế điều hoà thân nhiệt.', lesson: 'Bài 39. Da và điều hoà thân nhiệt ở người',
    quiz: ['Khi trời nóng, cơ thể thường tăng tiết mồ hôi để làm gì?', ['Tăng thải nhiệt khi mồ hôi bay hơi', 'Ngừng tuần hoàn máu', 'Tăng nhiệt độ cơ thể mãi mãi', 'Ngừng trao đổi khí'], 0, 'Bay hơi lấy nhiệt.', 'Mồ hôi bay hơi giúp cơ thể toả nhiệt.'],
    match: [['Da', 'Bảo vệ cơ thể và cảm nhận kích thích'], ['Mồ hôi bay hơi', 'Góp phần làm mát cơ thể'], ['Mạch máu dưới da giãn', 'Tăng tỏa nhiệt khi trời nóng']],
    fill: ['Da giúp bảo vệ cơ thể và góp phần điều hoà thân [blank].', 'nhiệt'],
    category: [['Khi trời nóng', 'Khi trời lạnh'], [['Tăng tiết mồ hôi', 0], ['Tăng tỏa nhiệt qua da', 0], ['Giảm tiết mồ hôi', 1], ['Giảm tỏa nhiệt qua da', 1]]],
    drag: ['Mồ hôi [blank] giúp cơ thể tỏa nhiệt.', ['bay hơi', 'đông đặc', 'hoá đá'], 'bay hơi'],
  },
  {
    objective: 'Nêu chức năng của cơ quan sinh sản và quá trình thụ tinh ở người.', lesson: 'Bài 40. Sinh sản ở người',
    quiz: ['Thụ tinh ở người là sự kết hợp của những tế bào nào?', ['Tinh trùng và trứng', 'Hai hồng cầu', 'Hai tế bào da', 'Một tế bào cơ và một bạch cầu'], 0, 'Hai loại giao tử kết hợp.', 'Sự kết hợp của tinh trùng và trứng tạo thành hợp tử.'],
    match: [['Tinh trùng', 'Giao tử đực'], ['Trứng', 'Giao tử cái'], ['Hợp tử', 'Được tạo sau thụ tinh']],
    fill: ['Tinh trùng kết hợp với trứng tạo thành [blank].', 'hợp tử'],
    category: [['Trước thụ tinh', 'Sau thụ tinh'], [['Tạo tinh trùng', 0], ['Tạo trứng', 0], ['Giao tử kết hợp', 0], ['Hợp tử phân chia', 1]]],
    drag: ['Sự kết hợp giữa tinh trùng và trứng gọi là [blank].', ['thụ tinh', 'quang hợp', 'bài tiết'], 'thụ tinh'],
  },
  {
    objective: 'Nhận biết thay đổi cơ thể ở tuổi dậy thì và thói quen chăm sóc vệ sinh cá nhân.', lesson: 'Bài 40. Sinh sản ở người',
    quiz: ['Thay đổi nào thường xuất hiện ở cả nam và nữ trong tuổi dậy thì?', ['Tăng trưởng về chiều cao', 'Mọi người đều giống hệt nhau', 'Ngừng phát triển cơ thể', 'Không cần vệ sinh cá nhân'], 0, 'Đây là giai đoạn cơ thể phát triển nhanh.', 'Ở tuổi dậy thì, nhiều người có giai đoạn tăng trưởng chiều cao.'],
    match: [['Dậy thì', 'Giai đoạn cơ thể có nhiều thay đổi'], ['Vệ sinh cá nhân', 'Giúp giữ cơ thể sạch sẽ'], ['Dinh dưỡng và vận động phù hợp', 'Hỗ trợ phát triển khỏe mạnh']],
    fill: ['Ở tuổi dậy thì, cần giữ vệ sinh [blank] đều đặn.', 'cá nhân'],
    category: [['Thói quen chăm sóc bản thân', 'Thói quen không có lợi'], [['Giữ vệ sinh cơ thể', 0], ['Ngủ đủ thời gian phù hợp', 0], ['Ăn uống đa dạng', 0], ['Bỏ vệ sinh cơ thể kéo dài', 1]]],
    drag: ['Cơ thể có nhiều thay đổi về hình thái và sinh lí ở tuổi [blank].', ['dậy thì', 'sơ sinh mãi mãi', 'sau khi chết'], 'dậy thì'],
  },
];

const gamesFor = (stage, dayIndex) => {
  const common = `Dựa vào kiến thức của ải ${dayIndex}.`;
  const [question, options, answerIndex, hint, explanation] = stage.quiz;
  const [categories, categoryPairs] = stage.category;
  const [textWithBlanks, bankWords, correctWord] = stage.drag;
  return [
    { type: 'quiz', title: 'Chọn đáp án chính xác', data: { question, options, answerIndex, hint, explanation } },
    { type: 'match', title: 'Nối khái niệm với đặc điểm', data: { pairs: stage.match.map(([left, right]) => ({ left, right })), hint: common, explanation: stage.match.map(([left, right]) => `${left}: ${right}`).join('; ') + '.' } },
    { type: 'fill', title: 'Hoàn thiện kiến thức', data: { sentence: stage.fill[0], correctAnswer: stage.fill[1], hint: common, explanation: `Từ cần điền là “${stage.fill[1]}”.` } },
    { type: 'category', title: 'Phân loại đúng nhóm', data: { categories, items: categoryPairs.map(([name, catIndex]) => ({ name, catIndex })), hint: common, explanation: categoryPairs.map(([name, catIndex]) => `${name} thuộc nhóm ${categories[catIndex]}`).join('; ') + '.' } },
    { type: 'dragdrop', title: 'Kéo từ hoàn thành câu', data: { textWithBlanks, bankWords, correctWord, hint: common, explanation: `Từ đúng là “${correctWord}”.` } },
  ];
};

const document = {
  schemaVersion: 1, releaseVersion: 'g8-st2-2026.1', grade: 8, stationId: 'g8_st2',
  title: 'Lớp 8 - Trạm 2: Điều hoà cơ thể người', status: 'draft',
  notes: 'Nội dung soạn theo các Bài 34–40 của SGK KHTN 8 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({ dayIndex: index + 1, learningObjective: stage.objective, sourceRefs: source(stage.lesson), games: gamesFor(stage, index + 1) })),
};
fs.mkdirSync('content/stations/grade-08', { recursive: true });
fs.writeFileSync('content/stations/grade-08/station-02.json', `${JSON.stringify(replacePlaceholderStationHints(document), null, 2)}\n`);
console.log('Đã tạo content/stations/grade-08/station-02.json');
