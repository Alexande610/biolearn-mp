import fs from 'node:fs';

const book = (pages, lesson) => [{
  source: 'SGK Khoa học tự nhiên 6 - Kết nối tri thức với cuộc sống',
  publisher: 'Nhà xuất bản Giáo dục Việt Nam',
  lesson,
  pages,
}];

const stages = [
  {
    dayIndex: 1,
    objective: 'Nêu được sự cần thiết của phân loại và nhận biết các bậc phân loại cơ bản.',
    source: book('106-109', 'Bài 1. Hệ thống phân loại sinh vật'),
    quiz: ['Đơn vị phân loại cơ sở của thế giới sống là gì?', ['Loài', 'Giới', 'Ngành', 'Lớp'], 0, 'Đây là bậc phân loại nhỏ và cơ bản nhất.', 'Loài là đơn vị phân loại cơ sở của thế giới sống.'],
    match: [['Giới Khởi sinh', 'Vi khuẩn'], ['Giới Nấm', 'Nấm men và nấm mũ'], ['Giới Động vật', 'Các loài động vật']],
    fill: ['Việc sắp xếp sinh vật vào các nhóm dựa trên đặc điểm chung gọi là [blank] sinh vật.', 'phân loại'],
    category: [['Bậc phân loại lớn hơn họ', 'Bậc phân loại nhỏ hơn họ'], [['Giới', 0], ['Ngành', 0], ['Lớp', 0], ['Chi', 1], ['Loài', 1]]],
    drag: ['Các bậc phân loại từ nhỏ đến lớn bắt đầu bằng [blank].', ['loài', 'giới', 'ngành'], 'loài'],
  },
  {
    dayIndex: 2,
    objective: 'Sử dụng được khoá lưỡng phân đơn giản để nhận biết sinh vật.',
    source: book('110-111', 'Bài 2. Khoá lưỡng phân'),
    quiz: ['Mỗi bước trong khoá lưỡng phân thường đưa ra bao nhiêu lựa chọn đối lập?', ['Hai', 'Một', 'Ba', 'Bốn'], 0, '“Lưỡng” có nghĩa là hai.', 'Mỗi bước của khoá lưỡng phân gồm hai đặc điểm đối lập để lựa chọn.'],
    match: [['Có cánh', 'Đi theo nhánh có cánh'], ['Không có cánh', 'Đi theo nhánh không cánh'], ['Đặc điểm đối lập', 'Tách đối tượng thành hai nhóm']],
    fill: ['Khoá lưỡng phân gồm các cặp đặc điểm [blank] nhau.', 'đối lập'],
    category: [['Đặc điểm phù hợp làm cặp phân đôi', 'Đặc điểm không tạo cặp phân đôi rõ'], [['Có xương sống / không xương sống', 0], ['Có cánh / không có cánh', 0], ['Sống dưới nước / không sống dưới nước', 0], ['Đẹp / không đẹp', 1]]],
    drag: ['Sau mỗi lựa chọn, khoá lưỡng phân dẫn tới một [blank] tiếp theo hoặc tên sinh vật.', ['nhánh', 'phép đo', 'nhiệt độ'], 'nhánh'],
  },
  {
    dayIndex: 3,
    objective: 'Mô tả được đặc điểm chính, vai trò có ích và tác hại của vi khuẩn.',
    source: book('112-117', 'Bài 3-4. Vi khuẩn và thực hành quan sát vi khuẩn'),
    quiz: ['Vi khuẩn có đặc điểm nào sau đây?', ['Cơ thể đơn bào, cấu tạo nhân sơ', 'Cơ thể luôn đa bào', 'Có nhân hoàn chỉnh', 'Chỉ sống trong cơ thể người'], 0, 'Vi khuẩn thuộc giới Khởi sinh.', 'Vi khuẩn là cơ thể đơn bào có cấu tạo nhân sơ và sống ở nhiều môi trường.'],
    match: [['Vi khuẩn lactic', 'Tham gia làm sữa chua'], ['Vi khuẩn cố định đạm', 'Góp phần cung cấp đạm cho cây'], ['Vi khuẩn gây bệnh', 'Có thể làm người hoặc sinh vật mắc bệnh']],
    fill: ['Vi khuẩn chưa có [blank] hoàn chỉnh.', 'nhân'],
    category: [['Vai trò có ích của vi khuẩn', 'Tác hại của vi khuẩn'], [['Làm sữa chua', 0], ['Phân huỷ xác sinh vật', 0], ['Gây sâu răng', 1], ['Làm hỏng thức ăn', 1]]],
    drag: ['Quan sát hình thái vi khuẩn trong sữa chua thường cần dùng [blank].', ['kính hiển vi', 'thước cuộn', 'kính thiên văn'], 'kính hiển vi'],
  },
  {
    dayIndex: 4,
    objective: 'Mô tả được cấu tạo đơn giản, cách nhân lên và một số tác hại của virus.',
    source: book('118-121', 'Bài 5. Virus'),
    quiz: ['Virus chỉ có thể nhân lên khi nào?', ['Khi ở trong tế bào vật chủ', 'Khi ở ngoài không khí', 'Khi nằm trên đá', 'Khi được chiếu sáng'], 0, 'Virus phụ thuộc vào tế bào sống.', 'Virus chỉ nhân lên được trong tế bào vật chủ.'],
    match: [['Vật chất di truyền', 'Mang thông tin di truyền'], ['Vỏ protein', 'Bao bọc vật chất di truyền'], ['Tế bào vật chủ', 'Nơi virus nhân lên']],
    fill: ['Virus có cấu tạo rất đơn giản và không có cấu tạo [blank].', 'tế bào'],
    category: [['Bệnh có thể do virus gây ra', 'Không phải bệnh do virus gây ra'], [['Cúm', 0], ['Sởi', 0], ['Bệnh khảm thuốc lá', 0], ['Sâu răng do vi khuẩn', 1]]],
    drag: ['Virus kí sinh bắt buộc bên trong [blank] vật chủ.', ['tế bào', 'hòn đá', 'giọt nước cất'], 'tế bào'],
  },
  {
    dayIndex: 5,
    objective: 'Nhận biết được đặc điểm và một số đại diện của nguyên sinh vật.',
    source: book('122-127', 'Bài 6-7. Nguyên sinh vật và thực hành quan sát'),
    quiz: ['Phần lớn nguyên sinh vật có đặc điểm nào?', ['Cơ thể đơn bào, nhân thực', 'Cơ thể đa bào có hệ cơ quan', 'Không có cấu tạo tế bào', 'Đều nhìn thấy rõ bằng mắt thường'], 0, 'Chúng thường sống ở nước hoặc nơi ẩm.', 'Phần lớn nguyên sinh vật là cơ thể đơn bào nhân thực có kích thước hiển vi.'],
    match: [['Trùng biến hình', 'Di chuyển bằng chân giả'], ['Trùng roi', 'Di chuyển bằng roi'], ['Trùng giày', 'Di chuyển bằng lông bơi']],
    fill: ['Nguyên sinh vật thường sống trong môi trường nước hoặc nơi [blank].', 'ẩm'],
    category: [['Nguyên sinh vật có khả năng quang hợp', 'Nguyên sinh vật không quang hợp'], [['Trùng roi xanh', 0], ['Tảo lục đơn bào', 0], ['Trùng biến hình', 1], ['Trùng giày', 1]]],
    drag: ['Để quan sát nguyên sinh vật trong nước ao cần dùng [blank].', ['kính hiển vi', 'cân', 'nhiệt kế'], 'kính hiển vi'],
  },
  {
    dayIndex: 6,
    objective: 'Nhận biết được đặc điểm, sự đa dạng, vai trò và tác hại của nấm.',
    source: book('128-137', 'Bài 8-10. Nấm, thực hành và ôn tập'),
    quiz: ['Nấm lấy chất dinh dưỡng chủ yếu bằng cách nào?', ['Hấp thụ chất hữu cơ từ môi trường', 'Tự quang hợp như cây xanh', 'Nuốt thức ăn bằng miệng', 'Chỉ uống nước'], 0, 'Nấm không có diệp lục để quang hợp.', 'Nấm sống dị dưỡng và hấp thụ chất hữu cơ từ môi trường.'],
    match: [['Nấm men', 'Có thể dùng làm bánh và lên men'], ['Nấm mốc', 'Thường tạo lớp mốc trên thức ăn'], ['Nấm ăn', 'Được sử dụng làm thực phẩm']],
    fill: ['Nấm không có [blank] nên không tự quang hợp.', 'diệp lục'],
    category: [['Vai trò có ích của nấm', 'Tác hại của nấm'], [['Làm thực phẩm', 0], ['Lên men', 0], ['Phân huỷ chất hữu cơ', 0], ['Gây mốc thức ăn', 1], ['Gây bệnh ngoài da', 1]]],
    drag: ['Nhiều loài nấm sinh sản bằng [blank].', ['bào tử', 'hạt', 'trứng'], 'bào tử'],
  },
  {
    dayIndex: 7,
    objective: 'Phân biệt được các nhóm thực vật chính dựa trên đặc điểm sinh sản và cấu tạo.',
    source: book('138-147', 'Bài 11-12. Thực vật và thực hành phân biệt nhóm thực vật'),
    quiz: ['Nhóm thực vật nào có hoa và quả?', ['Thực vật hạt kín', 'Rêu', 'Dương xỉ', 'Thực vật hạt trần'], 0, 'Hạt của nhóm này nằm trong quả.', 'Thực vật hạt kín có hoa, tạo quả và hạt nằm trong quả.'],
    match: [['Rêu', 'Chưa có mạch dẫn'], ['Dương xỉ', 'Sinh sản bằng bào tử, có mạch dẫn'], ['Hạt trần', 'Có hạt nhưng không có quả'], ['Hạt kín', 'Có hoa và quả']],
    fill: ['Cây thông thuộc nhóm thực vật hạt [blank].', 'trần'],
    category: [['Sinh sản bằng bào tử', 'Sinh sản bằng hạt'], [['Rêu', 0], ['Dương xỉ', 0], ['Cây thông', 1], ['Cây lúa', 1]]],
    drag: ['Ở thực vật hạt kín, hạt được bảo vệ trong [blank].', ['quả', 'rễ', 'thân'], 'quả'],
  },
  {
    dayIndex: 8,
    objective: 'Phân biệt được động vật không xương sống và động vật có xương sống.',
    source: book('148-157', 'Bài 13-14. Động vật và thực hành nhận biết nhóm động vật'),
    quiz: ['Đặc điểm dùng để chia động vật thành hai nhóm lớn là gì?', ['Có hay không có cột sống', 'Màu sắc cơ thể', 'Kích thước cơ thể', 'Nơi kiếm ăn'], 0, 'Tên hai nhóm là có xương sống và không xương sống.', 'Sự có mặt của cột sống là căn cứ chia động vật thành hai nhóm lớn.'],
    match: [['Cá', 'Sống dưới nước, thở bằng mang'], ['Chim', 'Có lông vũ'], ['Giun đất', 'Cơ thể dài và phân đốt'], ['Bướm', 'Cơ thể có ba phần và ba đôi chân']],
    fill: ['Thú là nhóm động vật có [blank] sống.', 'xương'],
    category: [['Động vật không xương sống', 'Động vật có xương sống'], [['Sứa', 0], ['Ốc sên', 0], ['Tôm', 0], ['Ếch', 1], ['Chim', 1], ['Mèo', 1]]],
    drag: ['Côn trùng thuộc nhóm động vật [blank] xương sống.', ['không', 'có', 'nhiều'], 'không'],
  },
  {
    dayIndex: 9,
    objective: 'Nêu được ý nghĩa của đa dạng sinh học và một số biện pháp bảo vệ.',
    source: book('158-161', 'Bài 15. Đa dạng sinh học'),
    quiz: ['Việc nào góp phần bảo vệ đa dạng sinh học?', ['Bảo vệ môi trường sống của sinh vật', 'Săn bắt động vật quý hiếm', 'Phá rừng tự nhiên', 'Thả chất thải chưa xử lí'], 0, 'Sinh vật cần nơi sống phù hợp để tồn tại.', 'Bảo vệ môi trường sống là biện pháp quan trọng để duy trì đa dạng sinh học.'],
    match: [['Rừng', 'Nơi sống của nhiều loài'], ['Đa dạng sinh học', 'Cung cấp nguồn thực phẩm và dược liệu'], ['Khu bảo tồn', 'Góp phần bảo vệ loài và sinh cảnh']],
    fill: ['Sự phong phú về số lượng loài và môi trường sống tạo nên tính đa dạng [blank].', 'sinh học'],
    category: [['Hành động bảo vệ đa dạng sinh học', 'Hành động làm suy giảm đa dạng sinh học'], [['Trồng và bảo vệ rừng', 0], ['Thành lập khu bảo tồn', 0], ['Khai thác hợp lí', 0], ['Săn bắt trái phép', 1], ['Phá huỷ sinh cảnh', 1]]],
    drag: ['Không săn bắt động vật quý hiếm góp phần bảo vệ đa dạng [blank].', ['sinh học', 'khoáng vật', 'nhiệt độ'], 'sinh học'],
  },
  {
    dayIndex: 10,
    objective: 'Vận dụng quy trình quan sát để tìm hiểu và ghi chép sinh vật ngoài thiên nhiên.',
    source: book('162-169', 'Bài 16-17. Tìm hiểu sinh vật ngoài thiên nhiên và ôn tập'),
    quiz: ['Khi tìm hiểu sinh vật ngoài thiên nhiên, hành động nào phù hợp?', ['Quan sát, ghi chép và hạn chế làm ảnh hưởng sinh vật', 'Bẻ cây để mang về', 'Bắt mọi động vật nhìn thấy', 'Phá tổ để quan sát rõ hơn'], 0, 'Quan sát khoa học cần đi cùng bảo vệ sinh vật.', 'Cần quan sát và ghi chép đầy đủ nhưng không làm tổn hại sinh vật hoặc môi trường sống.'],
    match: [['Sổ ghi chép', 'Ghi đặc điểm và nơi gặp sinh vật'], ['Máy ảnh', 'Lưu lại hình ảnh quan sát'], ['Kính lúp', 'Quan sát chi tiết nhỏ']],
    fill: ['Khi khảo sát ngoài thiên nhiên cần tuân thủ quy định về [blank].', 'an toàn'],
    category: [['Nên thực hiện khi khảo sát', 'Không nên thực hiện khi khảo sát'], [['Đi theo nhóm', 0], ['Ghi chép kết quả', 0], ['Giữ vệ sinh môi trường', 0], ['Chạm vào sinh vật lạ', 1], ['Thu mẫu tuỳ tiện', 1]]],
    drag: ['Sau khi quan sát cần sắp xếp dữ liệu và viết [blank].', ['báo cáo', 'đáp án trước', 'quảng cáo'], 'báo cáo'],
  },
];

const gamesFor = (stage) => {
  const common = `Dựa vào kiến thức của ải ${stage.dayIndex}.`;
  const [question, options, answerIndex, quizHint, quizExplanation] = stage.quiz;
  const [categories, categoryPairs] = stage.category;
  const [dragSentence, bankWords, correctWord] = stage.drag;
  return [
    { type: 'quiz', title: 'Chọn đáp án chính xác', data: { question, options, answerIndex, hint: quizHint, explanation: quizExplanation } },
    { type: 'match', title: 'Nối cấu trúc với đặc điểm', data: { pairs: stage.match.map(([left, right]) => ({ left, right })), hint: common, explanation: stage.match.map(([left, right]) => `${left}: ${right}`).join('; ') + '.' } },
    { type: 'fill', title: 'Hoàn thiện kiến thức', data: { sentence: stage.fill[0], correctAnswer: stage.fill[1], hint: common, explanation: `Từ cần điền là “${stage.fill[1]}”.` } },
    { type: 'category', title: 'Phân loại đúng nhóm', data: { categories, items: categoryPairs.map(([name, catIndex]) => ({ name, catIndex })), hint: common, explanation: categoryPairs.map(([name, catIndex]) => `${name} thuộc nhóm ${categories[catIndex]}`).join('; ') + '.' } },
    { type: 'dragdrop', title: 'Kéo từ hoàn thành câu', data: { textWithBlanks: dragSentence, bankWords, correctWord, hint: common, explanation: `Từ đúng là “${correctWord}”.` } },
  ];
};

const document = {
  schemaVersion: 1,
  releaseVersion: 'g6-st3-2026.1',
  grade: 6,
  stationId: 'g6_st3',
  title: 'Lớp 6 - Trạm 3: Đa dạng thế giới sống',
  status: 'draft',
  notes: 'Nội dung được đối chiếu trực tiếp với Chương VII của SGK KHTN 6 Kết nối tri thức; TXT OCR chỉ dùng để tìm kiếm.',
  stages: stages.map((stage) => ({
    dayIndex: stage.dayIndex,
    learningObjective: stage.objective,
    sourceRefs: stage.source,
    games: gamesFor(stage),
  })),
};

fs.mkdirSync('content/stations/grade-06', { recursive: true });
fs.writeFileSync('content/stations/grade-06/station-03.json', `${JSON.stringify(document, null, 2)}\n`);
console.log('Đã tạo content/stations/grade-06/station-03.json');
