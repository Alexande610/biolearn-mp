import fs from 'node:fs';
import { replacePlaceholderStationHints } from '../src/utils/stationHints.js';

const source = (lesson) => [{
  source: 'SGK Khoa học tự nhiên 7 - Kết nối tri thức với cuộc sống',
  publisher: 'Nhà xuất bản Giáo dục Việt Nam',
  lesson,
}];

// Each stage contains five different interactions about the same learning goal.
const stages = [
  {
    objective: 'Phân biệt trao đổi chất với chuyển hoá năng lượng và nêu vai trò của chúng.', lesson: 'Bài 21. Khái quát về trao đổi chất và chuyển hoá năng lượng',
    quiz: ['Quá trình nào là một biểu hiện của trao đổi chất ở cây?', ['Rễ hấp thụ nước từ đất', 'Lá đổi hướng do gió', 'Thân cao thêm do đo bằng thước', 'Lá rung khi chạm vào'], 0, 'Xét sự lấy chất từ môi trường.', 'Rễ lấy nước từ đất là một phần của quá trình trao đổi chất.'],
    match: [['Trao đổi chất', 'Lấy, biến đổi và thải các chất'], ['Chuyển hoá năng lượng', 'Biến đổi năng lượng từ dạng này sang dạng khác'], ['Quang hợp', 'Biến quang năng thành hoá năng']],
    fill: ['Trong quang hợp, quang năng được biến đổi thành [blank] năng tích luỹ trong chất hữu cơ.', 'hoá'],
    category: [['Trao đổi chất', 'Chuyển hoá năng lượng'], [['Rễ hấp thụ nước', 0], ['Lá nhận khí carbon dioxide', 0], ['Thải oxygen ra môi trường', 0], ['Quang năng biến thành hoá năng', 1], ['Hoá năng biến thành nhiệt năng', 1]]],
    drag: ['Sinh vật lấy chất từ môi trường, biến đổi và thải chất là quá trình [blank].', ['trao đổi chất', 'sinh sản', 'cảm ứng'], 'trao đổi chất'],
  },
  {
    objective: 'Xác định nguyên liệu, sản phẩm và điều kiện của quang hợp.', lesson: 'Bài 22. Quang hợp ở thực vật',
    quiz: ['Nguyên liệu trực tiếp của quá trình quang hợp là gì?', ['Nước và carbon dioxide', 'Glucose và oxygen', 'Nước và oxygen', 'Chất khoáng và glucose'], 0, 'Xem các chất cây lấy vào để tổng hợp chất hữu cơ.', 'Cây sử dụng nước và carbon dioxide để tạo chất hữu cơ trong quang hợp.'],
    match: [['Nước', 'Được rễ hấp thụ từ đất'], ['Carbon dioxide', 'Được lá nhận từ không khí'], ['Oxygen', 'Được tạo ra và giải phóng khi quang hợp']],
    fill: ['Quang hợp sử dụng năng lượng [blank] để tổng hợp chất hữu cơ.', 'ánh sáng'],
    category: [['Nguyên liệu quang hợp', 'Sản phẩm quang hợp'], [['Nước', 0], ['Carbon dioxide', 0], ['Chất hữu cơ', 1], ['Oxygen', 1]]],
    drag: ['Lá cây nhận khí [blank] từ không khí để quang hợp.', ['carbon dioxide', 'oxygen', 'nitrogen'], 'carbon dioxide'],
  },
  {
    objective: 'Giải thích vai trò của lá, lục lạp và khí khổng trong quang hợp.', lesson: 'Bài 22. Quang hợp ở thực vật',
    quiz: ['Quang hợp ở cây xanh diễn ra chủ yếu trong bào quan nào?', ['Lục lạp', 'Không bào', 'Nhân tế bào', 'Ty thể'], 0, 'Bào quan này chứa sắc tố quang hợp.', 'Lục lạp là bào quan thực hiện quang hợp.'],
    match: [['Lục lạp', 'Bào quan thực hiện quang hợp'], ['Khí khổng', 'Nơi trao đổi khí của lá với môi trường'], ['Phiến lá rộng', 'Giúp lá nhận nhiều ánh sáng']],
    fill: ['Quang hợp ở thực vật diễn ra chủ yếu trong [blank] của tế bào lá.', 'lục lạp'],
    category: [['Hỗ trợ lá quang hợp', 'Không trực tiếp hỗ trợ lá quang hợp'], [['Lục lạp chứa sắc tố', 0], ['Phiến lá nhận ánh sáng', 0], ['Khí khổng trao đổi khí', 0], ['Gai nhọn bảo vệ thân', 1]]],
    drag: ['Khí [blank] từ không khí đi vào lá qua khí khổng để tham gia quang hợp.', ['carbon dioxide', 'oxygen', 'hydrogen'], 'carbon dioxide'],
  },
  {
    objective: 'Nêu ảnh hưởng của ánh sáng, carbon dioxide, nước và nhiệt độ tới quang hợp.', lesson: 'Bài 23. Một số yếu tố ảnh hưởng đến quang hợp',
    quiz: ['Khi thiếu ánh sáng nghiêm trọng, quá trình quang hợp của cây thường thế nào?', ['Giảm', 'Luôn tăng', 'Không đổi trong mọi trường hợp', 'Chuyển thành hô hấp'], 0, 'Ánh sáng cung cấp năng lượng cho quang hợp.', 'Thiếu ánh sáng làm giảm quang hợp vì cây nhận ít năng lượng ánh sáng.'],
    match: [['Ánh sáng', 'Cung cấp năng lượng cho quang hợp'], ['Nước', 'Là nguyên liệu của quang hợp'], ['Carbon dioxide', 'Là nguyên liệu cây nhận từ không khí']],
    fill: ['Ngoài ánh sáng và nước, khí [blank] cũng ảnh hưởng đến quang hợp.', 'carbon dioxide'],
    category: [['Yếu tố ảnh hưởng đến quang hợp', 'Không phải yếu tố trực tiếp của quang hợp'], [['Cường độ ánh sáng', 0], ['Lượng nước', 0], ['Nhiệt độ', 0], ['Màu sơn chậu cây', 1]]],
    drag: ['Cần đặt cây ở nơi có [blank] phù hợp để cây quang hợp.', ['ánh sáng', 'bóng tối hoàn toàn', 'khói bụi'], 'ánh sáng'],
  },
  {
    objective: 'Giải thích cách dùng lá được che sáng để kiểm tra vai trò của ánh sáng đối với quang hợp.', lesson: 'Bài 24. Thực hành: Chứng minh quang hợp ở cây xanh',
    quiz: ['Trong thí nghiệm kiểm tra vai trò của ánh sáng, phần lá bị che kín dùng để làm gì?', ['Đối chứng với phần lá được chiếu sáng', 'Làm lá nhận thêm ánh sáng', 'Cung cấp tinh bột cho lá', 'Tăng lượng nước đi vào lá'], 0, 'So sánh hai vùng trên cùng một lá.', 'Phần lá bị che tạo đối chứng để so sánh với phần được chiếu sáng.'],
    match: [['Che một phần lá', 'Tạo vùng không nhận ánh sáng'], ['Phần lá được chiếu sáng', 'Có điều kiện tạo tinh bột'], ['Dung dịch iodine', 'Dùng nhận biết tinh bột']],
    fill: ['Dung dịch [blank] được dùng để nhận biết tinh bột trong lá.', 'iodine'],
    category: [['Dùng để kiểm tra vai trò ánh sáng', 'Không giúp kiểm tra vai trò ánh sáng'], [['Che kín một phần lá', 0], ['So sánh hai vùng của lá', 0], ['Thử tinh bột ở lá', 0], ['Chỉ quan sát chiều cao của chậu', 1]]],
    drag: ['Vùng lá không được chiếu sáng là vùng [blank] trong phép so sánh.', ['đối chứng', 'được bón phân', 'được tưới nước'], 'đối chứng'],
  },
  {
    objective: 'Nêu vai trò của nước và chất dinh dưỡng đối với đời sống thực vật.', lesson: 'Bài 29. Vai trò của nước và chất dinh dưỡng đối với sinh vật',
    quiz: ['Nước giúp cây thực hiện chức năng nào sau đây?', ['Vận chuyển các chất trong cơ thể', 'Thay thế hoàn toàn ánh sáng', 'Tạo ra chất khoáng từ hư không', 'Ngừng thoát hơi nước vĩnh viễn'], 0, 'Nước là môi trường hoà tan nhiều chất.', 'Nước góp phần hoà tan và vận chuyển các chất trong cây.'],
    match: [['Nước', 'Là thành phần và môi trường cho nhiều quá trình sống'], ['Chất khoáng', 'Cần cho sinh trưởng và phát triển'], ['Thiếu nước kéo dài', 'Có thể làm cây héo']],
    fill: ['Cây cần hấp thụ nước và chất [blank] từ đất để sinh trưởng.', 'khoáng'],
    category: [['Vai trò của nước', 'Biểu hiện cây thiếu nước'], [['Hoà tan chất khoáng', 0], ['Tham gia vận chuyển chất', 0], ['Lá héo rũ', 1], ['Sinh trưởng kém khi khô hạn', 1]]],
    drag: ['Nước góp phần [blank] các chất dinh dưỡng trong cơ thể cây.', ['vận chuyển', 'loại bỏ hoàn toàn', 'ngăn cản'], 'vận chuyển'],
  },
  {
    objective: 'Mô tả con đường hấp thụ nước và chất khoáng từ đất vào rễ.', lesson: 'Bài 30. Trao đổi nước và chất dinh dưỡng ở thực vật',
    quiz: ['Ở phần lớn cây trên cạn, bộ phận nào của rễ hấp thụ nước và chất khoáng chủ yếu?', ['Tế bào lông hút', 'Chóp rễ đã hoá gỗ', 'Hoa', 'Quả'], 0, 'Đây là tế bào biểu bì rễ biến dạng.', 'Tế bào lông hút hấp thụ nước và chất khoáng hoà tan từ đất.'],
    match: [['Đất', 'Chứa nước và chất khoáng hoà tan'], ['Lông hút', 'Hấp thụ nước và chất khoáng'], ['Mạch gỗ', 'Vận chuyển nước và chất khoáng lên thân lá']],
    fill: ['Nước và chất khoáng hoà tan từ đất thường đi vào rễ qua tế bào [blank].', 'lông hút'],
    category: [['Trên đường nước đi từ đất lên lá', 'Không thuộc đường đi đó'], [['Lông hút', 0], ['Mạch gỗ ở rễ', 0], ['Mạch gỗ ở thân', 0], ['Mạch rây chuyển chất hữu cơ từ lá', 1]]],
    drag: ['Nước từ đất được lông hút hấp thụ rồi đi vào [blank] để lên thân.', ['mạch gỗ', 'mạch rây', 'quả'], 'mạch gỗ'],
  },
  {
    objective: 'Phân biệt chức năng vận chuyển của mạch gỗ và mạch rây.', lesson: 'Bài 30. Trao đổi nước và chất dinh dưỡng ở thực vật',
    quiz: ['Mạch rây chủ yếu vận chuyển chất nào từ lá tới các cơ quan khác?', ['Chất hữu cơ', 'Cát', 'Đá', 'Không khí'], 0, 'Chất này được tạo ra nhờ quang hợp.', 'Mạch rây vận chuyển chất hữu cơ được tổng hợp ở lá tới các bộ phận khác của cây.'],
    match: [['Mạch gỗ', 'Đưa nước và chất khoáng từ rễ lên'], ['Mạch rây', 'Đưa chất hữu cơ từ lá tới cơ quan khác'], ['Lá', 'Nơi tạo nhiều chất hữu cơ nhờ quang hợp']],
    fill: ['Dòng vận chuyển nước và chất khoáng từ rễ lên lá diễn ra trong mạch [blank].', 'gỗ'],
    category: [['Gắn với mạch gỗ', 'Gắn với mạch rây'], [['Vận chuyển nước', 0], ['Vận chuyển chất khoáng từ rễ', 0], ['Vận chuyển chất hữu cơ từ lá', 1], ['Đưa sản phẩm quang hợp tới cơ quan khác', 1]]],
    drag: ['Chất hữu cơ do lá tạo ra được vận chuyển trong mạch [blank].', ['rây', 'gỗ', 'khí'], 'rây'],
  },
  {
    objective: 'Mô tả thoát hơi nước qua lá và vai trò đóng mở của khí khổng.', lesson: 'Bài 30. Trao đổi nước và chất dinh dưỡng ở thực vật',
    quiz: ['Phần lớn hơi nước thoát ra khỏi lá qua cấu trúc nào?', ['Khí khổng', 'Mạch gỗ trong rễ', 'Hạt', 'Hoa'], 0, 'Cấu trúc này có thể đóng và mở.', 'Khí khổng là con đường chủ yếu để hơi nước thoát ra khỏi lá.'],
    match: [['Khí khổng mở', 'Tạo điều kiện trao đổi khí và thoát hơi nước'], ['Khí khổng đóng', 'Giảm thoát hơi nước'], ['Thoát hơi nước', 'Góp phần tạo lực kéo dòng nước trong mạch gỗ']],
    fill: ['Sự đóng mở của [blank] điều tiết quá trình thoát hơi nước ở lá.', 'khí khổng'],
    category: [['Khi khí khổng mở', 'Khi khí khổng đóng'], [['Hơi nước dễ thoát ra hơn', 0], ['Carbon dioxide dễ đi vào lá hơn', 0], ['Hạn chế mất nước hơn', 1], ['Trao đổi khí qua khí khổng giảm', 1]]],
    drag: ['Thoát hơi nước ở lá góp phần kéo nước đi lên trong mạch [blank].', ['gỗ', 'rây', 'đường'], 'gỗ'],
  },
  {
    objective: 'Vận dụng kiến thức trao đổi nước để tưới và bón phân hợp lí cho cây.', lesson: 'Bài 30. Trao đổi nước và chất dinh dưỡng ở thực vật; Bài 32. Thực hành: Chứng minh thân vận chuyển nước và lá thoát hơi nước',
    quiz: ['Khi đất khô kéo dài, biện pháp nào phù hợp để chăm sóc cây?', ['Tưới nước với lượng phù hợp', 'Bón phân thật đậm đặc thay nước', 'Cắt hết rễ hút nước', 'Để cây tiếp tục thiếu nước'], 0, 'Cây cần nước để hấp thụ và vận chuyển chất.', 'Tưới đủ nước theo nhu cầu giúp cây duy trì trao đổi nước.'],
    match: [['Tưới đúng nhu cầu', 'Tránh thiếu hoặc thừa nước'], ['Bón phân hợp lí', 'Cung cấp chất khoáng ở lượng phù hợp'], ['Phủ gốc cây', 'Giúp hạn chế nước bốc hơi từ đất']],
    fill: ['Tưới quá nhiều nước liên tục có thể làm rễ thiếu [blank].', 'oxygen'],
    category: [['Chăm sóc cây hợp lí', 'Chăm sóc cây không hợp lí'], [['Quan sát độ ẩm đất trước khi tưới', 0], ['Tưới phù hợp nhu cầu loài cây', 0], ['Bón phân đúng lượng', 0], ['Bón phân đậm đặc tùy ý', 1], ['Để đất ngập úng kéo dài', 1]]],
    drag: ['Khi tưới cây cần cân nhắc nhu cầu của cây và độ [blank] của đất.', ['ẩm', 'cứng', 'mặn luôn luôn'], 'ẩm'],
  },
];

const gamesFor = (stage, dayIndex) => {
  const common = `Dựa vào nội dung của ải ${dayIndex}.`;
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
  schemaVersion: 1,
  releaseVersion: 'g7-st1-2026.1',
  grade: 7,
  stationId: 'g7_st1',
  title: 'Lớp 7 - Trạm 1: Quang hợp và dinh dưỡng thực vật',
  status: 'draft',
  notes: 'Nội dung soạn theo các Bài 21–24, 29–30, 32 của SGK KHTN 7 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({
    dayIndex: index + 1,
    learningObjective: stage.objective,
    sourceRefs: source(stage.lesson),
    games: gamesFor(stage, index + 1),
  })),
};

fs.mkdirSync('content/stations/grade-07', { recursive: true });
fs.writeFileSync('content/stations/grade-07/station-01.json', `${JSON.stringify(replacePlaceholderStationHints(document), null, 2)}\n`);
console.log('Đã tạo content/stations/grade-07/station-01.json');
