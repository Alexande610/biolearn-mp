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
    objective: 'Nhận biết được cơ thể sống qua các hoạt động sống cơ bản.',
    source: book('92-93', 'Bài 1. Cơ thể sinh vật'),
    quiz: ['Đặc điểm nào cho thấy một vật là cơ thể sống?', ['Có khả năng thực hiện các hoạt động sống', 'Luôn đứng yên', 'Luôn có kích thước lớn', 'Được làm bằng kim loại'], 0, 'Cơ thể sống có trao đổi chất, lớn lên và sinh sản.', 'Cơ thể sống thực hiện được các hoạt động sống cơ bản như trao đổi chất, lớn lên, cảm ứng và sinh sản.'],
    match: [['Cây hướng về phía ánh sáng', 'Cảm ứng'], ['Gà con lớn thành gà trưởng thành', 'Lớn lên'], ['Cây tạo hạt', 'Sinh sản']],
    fill: ['Cơ thể sinh vật có khả năng thực hiện các hoạt động [blank].', 'sống'],
    category: [['Biểu hiện của cơ thể sống', 'Không phải biểu hiện của cơ thể sống'], [['Trao đổi chất', 0], ['Lớn lên', 0], ['Sinh sản', 0], ['Gỉ sét', 1]]],
    drag: ['Cơ thể sống luôn có sự trao đổi chất với [blank].', ['môi trường', 'thước đo', 'nam châm'], 'môi trường'],
  },
  {
    dayIndex: 2,
    objective: 'Mô tả được cơ thể đơn bào và nêu được một số ví dụ.',
    source: book('93-95', 'Bài 1. Cơ thể sinh vật'),
    quiz: ['Cơ thể đơn bào được cấu tạo từ bao nhiêu tế bào?', ['Một tế bào', 'Hai tế bào', 'Một mô', 'Nhiều cơ quan'], 0, 'Tên gọi “đơn bào” cho biết số lượng tế bào.', 'Cơ thể đơn bào chỉ gồm một tế bào nhưng tế bào đó thực hiện đầy đủ hoạt động sống.'],
    match: [['Trùng biến hình', 'Di chuyển bằng chân giả'], ['Vi khuẩn', 'Cơ thể đơn bào có cấu tạo đơn giản'], ['Nấm men', 'Nấm đơn bào']],
    fill: ['Ở cơ thể đơn bào, một tế bào thực hiện [blank] các hoạt động sống.', 'đầy đủ'],
    category: [['Cơ thể đơn bào', 'Không phải cơ thể đơn bào'], [['Vi khuẩn', 0], ['Nấm men', 0], ['Trùng biến hình', 0], ['Con thỏ', 1], ['Cây táo', 1]]],
    drag: ['Trùng biến hình là ví dụ về cơ thể [blank].', ['đơn bào', 'đa bào', 'không sống'], 'đơn bào'],
  },
  {
    dayIndex: 3,
    objective: 'Mô tả được cơ thể đa bào và vai trò khái quát của sự chuyên hoá tế bào.',
    source: book('94-95', 'Bài 1. Cơ thể sinh vật'),
    quiz: ['Đặc điểm nào đúng với cơ thể đa bào?', ['Gồm nhiều tế bào', 'Chỉ có một tế bào', 'Không có tế bào', 'Không thực hiện trao đổi chất'], 0, '“Đa bào” nghĩa là có nhiều tế bào.', 'Cơ thể đa bào gồm nhiều tế bào; các loại tế bào có thể đảm nhiệm những chức năng khác nhau.'],
    match: [['Con thỏ', 'Cơ thể động vật đa bào'], ['Cây táo', 'Cơ thể thực vật đa bào'], ['Cây nấm', 'Cơ thể nấm đa bào']],
    fill: ['Trong cơ thể đa bào, các loại tế bào có thể thực hiện những chức năng [blank].', 'khác nhau'],
    category: [['Cơ thể đa bào', 'Cơ thể đơn bào'], [['Em bé', 0], ['Con bướm', 0], ['Cây hoa', 0], ['Vi khuẩn', 1], ['Trùng biến hình', 1]]],
    drag: ['Cơ thể con voi được cấu tạo từ [blank] tế bào.', ['nhiều', 'một', 'không có'], 'nhiều'],
  },
  {
    dayIndex: 4,
    objective: 'So sánh được cơ thể đơn bào và cơ thể đa bào.',
    source: book('93-95', 'Bài 1. Cơ thể sinh vật'),
    quiz: ['Điểm khác nhau cơ bản giữa cơ thể đơn bào và đa bào là gì?', ['Số lượng tế bào cấu tạo nên cơ thể', 'Đều có hoạt động sống', 'Đều trao đổi chất', 'Đều chịu tác động của môi trường'], 0, 'So sánh ý nghĩa của “đơn” và “đa”.', 'Cơ thể đơn bào gồm một tế bào, còn cơ thể đa bào gồm nhiều tế bào.'],
    match: [['Một tế bào thực hiện mọi hoạt động sống', 'Cơ thể đơn bào'], ['Nhiều tế bào phối hợp hoạt động', 'Cơ thể đa bào'], ['Đều thực hiện trao đổi chất', 'Cả hai nhóm']],
    fill: ['Cơ thể đơn bào và đa bào đều là những cơ thể [blank].', 'sống'],
    category: [['Đặc điểm của cơ thể đơn bào', 'Đặc điểm của cơ thể đa bào'], [['Chỉ gồm một tế bào', 0], ['Một tế bào đảm nhiệm mọi hoạt động sống', 0], ['Gồm nhiều tế bào', 1], ['Có tế bào chuyên hoá', 1]]],
    drag: ['Nhiều tế bào chuyên hoá phối hợp với nhau là đặc điểm của cơ thể [blank].', ['đa bào', 'đơn bào', 'không sống'], 'đa bào'],
  },
  {
    dayIndex: 5,
    objective: 'Sắp xếp được các cấp tổ chức của cơ thể đa bào theo thứ tự.',
    source: book('96', 'Bài 2. Tổ chức cơ thể đa bào'),
    quiz: ['Thứ tự nào đúng từ cấp tổ chức nhỏ đến lớn?', ['Tế bào → mô → cơ quan → hệ cơ quan → cơ thể', 'Mô → tế bào → cơ thể → cơ quan', 'Cơ quan → mô → tế bào → hệ cơ quan', 'Hệ cơ quan → tế bào → mô → cơ thể'], 0, 'Bắt đầu từ đơn vị cấu tạo cơ bản.', 'Các cấp tổ chức tăng dần là tế bào, mô, cơ quan, hệ cơ quan và cơ thể.'],
    match: [['Tế bào', 'Đơn vị cấu tạo cơ bản'], ['Mô', 'Nhóm tế bào cùng thực hiện chức năng'], ['Hệ cơ quan', 'Nhóm cơ quan phối hợp hoạt động']],
    fill: ['Nhiều mô phối hợp thực hiện một hoạt động sống tạo thành [blank].', 'cơ quan'],
    category: [['Cấp tổ chức nhỏ hơn cơ quan', 'Cấp tổ chức lớn hơn cơ quan'], [['Tế bào', 0], ['Mô', 0], ['Hệ cơ quan', 1], ['Cơ thể', 1]]],
    drag: ['Tế bào → mô → [blank] → hệ cơ quan → cơ thể.', ['cơ quan', 'sinh quyển', 'quần thể'], 'cơ quan'],
  },
  {
    dayIndex: 6,
    objective: 'Nêu được khái niệm mô và nhận biết một số mô ở động vật, thực vật.',
    source: book('97', 'Bài 2. Tổ chức cơ thể đa bào'),
    quiz: ['Mô là gì?', ['Nhóm tế bào có cấu tạo giống nhau và cùng thực hiện một chức năng', 'Một tế bào riêng lẻ', 'Nhóm nhiều hệ cơ quan', 'Toàn bộ cơ thể'], 0, 'Các tế bào trong mô có điểm chung về cấu tạo và chức năng.', 'Mô gồm nhóm tế bào có cấu tạo giống nhau, liên kết và cùng thực hiện một chức năng.'],
    match: [['Mô cơ', 'Co dãn tạo vận động'], ['Mô biểu bì', 'Bao bọc và bảo vệ'], ['Mô mạch gỗ', 'Vận chuyển nước và muối khoáng']],
    fill: ['Các tế bào trong một mô thường có cấu tạo [blank] nhau.', 'giống'],
    category: [['Mô ở động vật', 'Mô ở thực vật'], [['Mô cơ', 0], ['Mô biểu bì ở da', 0], ['Mô mạch gỗ', 1], ['Mô mạch rây', 1]]],
    drag: ['Nhóm tế bào cùng thực hiện một chức năng tạo thành [blank].', ['mô', 'cơ thể đơn bào', 'quần thể'], 'mô'],
  },
  {
    dayIndex: 7,
    objective: 'Nêu được khái niệm cơ quan và nhận biết cơ quan ở người, thực vật.',
    source: book('97-98', 'Bài 2. Tổ chức cơ thể đa bào'),
    quiz: ['Cơ quan được tạo thành chủ yếu từ đâu?', ['Nhiều mô phối hợp hoạt động', 'Một phân tử', 'Một tế bào duy nhất trong mọi trường hợp', 'Nhiều cơ thể'], 0, 'Cơ quan là cấp tổ chức ngay sau mô.', 'Các mô cùng phối hợp thực hiện một hoạt động sống nhất định tạo thành cơ quan.'],
    match: [['Tim', 'Bơm máu'], ['Phổi', 'Trao đổi khí'], ['Lá', 'Quang hợp']],
    fill: ['Rễ, thân và lá là các [blank] của thực vật.', 'cơ quan'],
    category: [['Cơ quan ở người', 'Cơ quan ở thực vật'], [['Tim', 0], ['Dạ dày', 0], ['Rễ', 1], ['Lá', 1]]],
    drag: ['Nhiều mô phối hợp thực hiện một hoạt động sống tạo thành [blank].', ['cơ quan', 'tế bào', 'môi trường'], 'cơ quan'],
  },
  {
    dayIndex: 8,
    objective: 'Nêu được khái niệm hệ cơ quan và nhận biết một số hệ cơ quan ở người.',
    source: book('98', 'Bài 2. Tổ chức cơ thể đa bào'),
    quiz: ['Hệ cơ quan là gì?', ['Nhóm cơ quan phối hợp thực hiện chức năng nhất định', 'Một nhóm phân tử', 'Một tế bào lớn', 'Một cơ quan riêng lẻ'], 0, 'Nhiều cơ quan cần phối hợp để hoàn thành chức năng lớn.', 'Hệ cơ quan gồm nhiều cơ quan phối hợp hoạt động để thực hiện một chức năng nhất định của cơ thể.'],
    match: [['Hệ tiêu hoá', 'Biến đổi thức ăn và hấp thụ chất dinh dưỡng'], ['Hệ tuần hoàn', 'Vận chuyển các chất'], ['Hệ thần kinh', 'Điều khiển và phối hợp hoạt động']],
    fill: ['Tim và các mạch máu là những cơ quan chính của hệ [blank].', 'tuần hoàn'],
    category: [['Thuộc hệ tiêu hoá', 'Thuộc hệ tuần hoàn'], [['Miệng', 0], ['Dạ dày', 0], ['Tim', 1], ['Mạch máu', 1]]],
    drag: ['Não và tuỷ sống thuộc hệ [blank].', ['thần kinh', 'tiêu hoá', 'tuần hoàn'], 'thần kinh'],
  },
  {
    dayIndex: 9,
    objective: 'Phân biệt được hệ rễ và hệ chồi ở thực vật có hoa.',
    source: book('99', 'Bài 2. Tổ chức cơ thể đa bào'),
    quiz: ['Thực vật có hoa có hai hệ cơ quan chính nào?', ['Hệ rễ và hệ chồi', 'Hệ tiêu hoá và hệ tuần hoàn', 'Hệ thần kinh và hệ vận động', 'Hệ hô hấp và hệ bài tiết'], 0, 'Một hệ thường ở dưới đất, một hệ thường ở trên mặt đất.', 'Thực vật có hoa có hệ rễ và hệ chồi.'],
    match: [['Rễ', 'Hấp thụ nước và muối khoáng'], ['Lá', 'Quang hợp và trao đổi khí'], ['Hoa', 'Tham gia sinh sản']],
    fill: ['Thân, lá, hoa và quả thuộc hệ [blank].', 'chồi'],
    category: [['Hệ rễ', 'Hệ chồi'], [['Rễ chính', 0], ['Rễ bên', 0], ['Thân', 1], ['Lá', 1], ['Hoa', 1]]],
    drag: ['Hệ [blank] giúp cây bám vào đất và hấp thụ nước.', ['rễ', 'chồi', 'tuần hoàn'], 'rễ'],
  },
  {
    dayIndex: 10,
    objective: 'Vận dụng kiến thức để quan sát cơ thể đơn bào và nhận diện các cấp tổ chức của cơ thể đa bào.',
    source: book('100-104', 'Bài 3-4. Thực hành và ôn tập Chương VI'),
    quiz: ['Để quan sát cơ thể đơn bào trong nước ao, dụng cụ quan trọng nhất là gì?', ['Kính hiển vi', 'Cân đồng hồ', 'Nhiệt kế', 'Thước cuộn'], 0, 'Cơ thể đơn bào thường có kích thước rất nhỏ.', 'Kính hiển vi giúp quan sát các cơ thể đơn bào có kích thước nhỏ trong mẫu nước ao.'],
    match: [['Mẫu nước ao', 'Quan sát cơ thể đơn bào'], ['Mô hình giải phẫu người', 'Nhận biết hệ cơ quan'], ['Cây có hoa', 'Nhận biết cơ quan thực vật']],
    fill: ['Khi quan sát mẫu nước ao, mẫu được đặt trên [blank].', 'lam kính'],
    category: [['Đối tượng quan sát trực tiếp', 'Dụng cụ hoặc mô hình hỗ trợ'], [['Mẫu nước ao', 0], ['Cây có hoa', 0], ['Kính hiển vi', 1], ['Mô hình giải phẫu', 1]]],
    drag: ['Tế bào → mô → cơ quan → hệ cơ quan → [blank].', ['cơ thể', 'vi khuẩn', 'khoáng vật'], 'cơ thể'],
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
  releaseVersion: 'g6-st2-2026.1',
  grade: 6,
  stationId: 'g6_st2',
  title: 'Lớp 6 - Trạm 2: Từ tế bào đến cơ thể',
  status: 'draft',
  notes: 'Nội dung được đối chiếu trực tiếp với Chương VI của SGK KHTN 6 Kết nối tri thức; TXT OCR chỉ dùng để tìm kiếm.',
  stages: stages.map((stage) => ({
    dayIndex: stage.dayIndex,
    learningObjective: stage.objective,
    sourceRefs: stage.source,
    games: gamesFor(stage),
  })),
};

fs.mkdirSync('content/stations/grade-06', { recursive: true });
fs.writeFileSync('content/stations/grade-06/station-02.json', `${JSON.stringify(document, null, 2)}\n`);
console.log('Đã tạo content/stations/grade-06/station-02.json');
