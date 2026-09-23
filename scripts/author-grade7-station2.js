import fs from 'node:fs';

const source = (lesson) => [{ source: 'SGK Khoa học tự nhiên 7 - Kết nối tri thức với cuộc sống', publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];

const stages = [
  {
    objective: 'Xác định nguyên liệu, sản phẩm và ý nghĩa của hô hấp tế bào.', lesson: 'Bài 25. Hô hấp tế bào',
    quiz: ['Hô hấp tế bào có vai trò chủ yếu nào?', ['Giải phóng năng lượng từ chất hữu cơ', 'Tạo ánh sáng cho tế bào', 'Chỉ tạo oxygen', 'Ngăn mọi quá trình trao đổi chất'], 0, 'Quá trình này cung cấp năng lượng cho hoạt động sống.', 'Hô hấp tế bào phân giải chất hữu cơ và giải phóng năng lượng.'],
    match: [['Chất hữu cơ', 'Nguồn chất được phân giải'], ['Oxygen', 'Tham gia hô hấp tế bào hiếu khí'], ['Năng lượng', 'Được giải phóng cho hoạt động sống']],
    fill: ['Hô hấp tế bào giải phóng [blank] từ chất hữu cơ.', 'năng lượng'],
    category: [['Tham gia hô hấp tế bào hiếu khí', 'Được tạo ra từ hô hấp tế bào hiếu khí'], [['Chất hữu cơ', 0], ['Oxygen', 0], ['Carbon dioxide', 1], ['Nước', 1]]],
    drag: ['Hô hấp tế bào giúp cung cấp [blank] cho các hoạt động sống.', ['năng lượng', 'ánh sáng', 'diệp lục'], 'năng lượng'],
  },
  {
    objective: 'Phân biệt hô hấp tế bào với quang hợp qua chiều biến đổi vật chất và năng lượng.', lesson: 'Bài 25. Hô hấp tế bào',
    quiz: ['Điểm khác nhau về năng lượng giữa quang hợp và hô hấp tế bào là gì?', ['Quang hợp tích luỹ, hô hấp tế bào giải phóng năng lượng', 'Cả hai chỉ hấp thụ năng lượng', 'Cả hai chỉ tạo ánh sáng', 'Hô hấp tế bào không liên quan năng lượng'], 0, 'Xét sự tạo chất hữu cơ và phân giải chất hữu cơ.', 'Quang hợp tích luỹ năng lượng trong chất hữu cơ; hô hấp tế bào giải phóng năng lượng từ chất hữu cơ.'],
    match: [['Quang hợp', 'Tổng hợp chất hữu cơ nhờ ánh sáng'], ['Hô hấp tế bào', 'Phân giải chất hữu cơ để giải phóng năng lượng'], ['Thực vật', 'Vừa quang hợp vừa hô hấp tế bào']],
    fill: ['Cây xanh thực hiện cả quang hợp và hô hấp [blank].', 'tế bào'],
    category: [['Quang hợp', 'Hô hấp tế bào'], [['Cần ánh sáng để tổng hợp chất hữu cơ', 0], ['Tích luỹ năng lượng trong chất hữu cơ', 0], ['Phân giải chất hữu cơ', 1], ['Giải phóng năng lượng cho tế bào', 1]]],
    drag: ['Khác với quang hợp, hô hấp tế bào [blank] năng lượng từ chất hữu cơ.', ['giải phóng', 'chỉ tích luỹ', 'loại bỏ'], 'giải phóng'],
  },
  {
    objective: 'Nêu các yếu tố ảnh hưởng đến hô hấp tế bào.', lesson: 'Bài 26. Một số yếu tố ảnh hưởng đến hô hấp tế bào',
    quiz: ['Yếu tố nào ảnh hưởng trực tiếp đến hô hấp tế bào?', ['Nhiệt độ', 'Tên gọi của chậu', 'Màu nhãn trên hộp', 'Độ dài thước kẻ'], 0, 'Hoạt động của enzyme phụ thuộc vào yếu tố này.', 'Nhiệt độ là một trong các yếu tố ảnh hưởng đến tốc độ hô hấp tế bào.'],
    match: [['Nhiệt độ', 'Ảnh hưởng hoạt động enzyme hô hấp'], ['Nước', 'Cần cho hoạt động sống của tế bào'], ['Oxygen', 'Cần cho hô hấp tế bào hiếu khí']],
    fill: ['Nhiệt độ, hàm lượng nước và nồng độ [blank] có thể ảnh hưởng đến hô hấp tế bào.', 'oxygen'],
    category: [['Yếu tố ảnh hưởng đến hô hấp tế bào', 'Không phải yếu tố sinh học trực tiếp'], [['Nhiệt độ', 0], ['Nước', 0], ['Oxygen', 0], ['Màu chữ in trên lọ', 1]]],
    drag: ['Bảo quản hạt giống khô giúp hạn chế tốc độ hô hấp [blank].', ['tế bào', 'quang hợp', 'thoát hơi nước'], 'tế bào'],
  },
  {
    objective: 'Giải thích hiện tượng hạt nảy mầm hô hấp và cách kiểm chứng.', lesson: 'Bài 27. Thực hành: Hô hấp ở thực vật',
    quiz: ['Vì sao hạt đang nảy mầm cần được cung cấp oxygen?', ['Để thực hiện hô hấp tế bào hiếu khí', 'Để hạt phát sáng', 'Để thay thế hoàn toàn nước', 'Để tạo đá vôi'], 0, 'Hạt cần năng lượng để phát triển mầm.', 'Hạt nảy mầm hô hấp tế bào, sử dụng oxygen và giải phóng năng lượng.'],
    match: [['Hạt nảy mầm', 'Có hô hấp tế bào mạnh'], ['Oxygen', 'Được dùng trong hô hấp hiếu khí'], ['Carbon dioxide', 'Sản phẩm có thể phát hiện trong thí nghiệm']],
    fill: ['Hạt nảy mầm sử dụng khí [blank] trong quá trình hô hấp hiếu khí.', 'oxygen'],
    category: [['Phù hợp để kiểm tra hô hấp ở hạt', 'Không phù hợp để so sánh'], [['Dùng hạt đang nảy mầm', 0], ['Chuẩn bị mẫu đối chứng', 0], ['Giữ điều kiện so sánh tương tự', 0], ['Thay đổi nhiều điều kiện cùng lúc', 1]]],
    drag: ['Hạt nảy mầm giải phóng khí [blank] khi hô hấp.', ['carbon dioxide', 'oxygen', 'nitrogen'], 'carbon dioxide'],
  },
  {
    objective: 'Mô tả trao đổi khí giữa sinh vật và môi trường.', lesson: 'Bài 28. Trao đổi khí ở sinh vật',
    quiz: ['Trao đổi khí ở sinh vật là quá trình nào?', ['Lấy khí cần thiết và thải khí ra môi trường', 'Chỉ đổi màu cơ thể', 'Chỉ vận chuyển thức ăn', 'Chỉ hút nước'], 0, 'Xét chiều đi vào và đi ra của các chất khí.', 'Sinh vật nhận và thải khí với môi trường để phục vụ hoạt động sống.'],
    match: [['Trao đổi khí', 'Khí đi vào và ra khỏi cơ thể'], ['Hô hấp tế bào hiếu khí', 'Sử dụng oxygen trong tế bào'], ['Quang hợp', 'Sử dụng carbon dioxide để tổng hợp chất hữu cơ']],
    fill: ['Khi hô hấp, sinh vật thường lấy khí [blank] từ môi trường.', 'oxygen'],
    category: [['Gắn với hô hấp tế bào hiếu khí', 'Gắn với quang hợp'], [['Sử dụng oxygen', 0], ['Thải carbon dioxide', 0], ['Sử dụng carbon dioxide', 1], ['Tạo oxygen', 1]]],
    drag: ['Trao đổi khí là sự lấy và thải các chất [blank] giữa cơ thể và môi trường.', ['khí', 'rắn', 'khoáng'], 'khí'],
  },
  {
    objective: 'Giải thích vai trò của khí khổng trong trao đổi khí ở thực vật.', lesson: 'Bài 28. Trao đổi khí ở sinh vật',
    quiz: ['Khí khổng trên lá có vai trò gì?', ['Cho phép lá trao đổi khí với môi trường', 'Vận chuyển chất hữu cơ trong thân', 'Hút nước từ đất', 'Tạo hạt trong quả'], 0, 'Đây là các khe có thể đóng mở.', 'Khí khổng là một con đường trao đổi khí giữa lá và môi trường.'],
    match: [['Khí khổng', 'Đóng mở và trao đổi khí'], ['Carbon dioxide', 'Đi vào lá khi quang hợp'], ['Oxygen', 'Có thể thoát khỏi lá khi quang hợp']],
    fill: ['Lá cây trao đổi khí với môi trường chủ yếu qua [blank].', 'khí khổng'],
    category: [['Diễn ra khi lá quang hợp', 'Diễn ra khi tế bào lá hô hấp hiếu khí'], [['Nhận carbon dioxide', 0], ['Tạo oxygen', 0], ['Sử dụng oxygen', 1], ['Tạo carbon dioxide', 1]]],
    drag: ['Sự đóng mở [blank] giúp điều chỉnh trao đổi khí ở lá.', ['khí khổng', 'mạch rây', 'lông hút'], 'khí khổng'],
  },
  {
    objective: 'Nhận biết một số cơ quan trao đổi khí ở động vật.', lesson: 'Bài 28. Trao đổi khí ở sinh vật',
    quiz: ['Cá thường trao đổi khí với nước qua cơ quan nào?', ['Mang', 'Phổi', 'Lông vũ', 'Rễ'], 0, 'Cơ quan này tiếp xúc với nước.', 'Mang là cơ quan trao đổi khí của phần lớn các loài cá.'],
    match: [['Cá', 'Mang'], ['Châu chấu', 'Hệ thống ống khí'], ['Người', 'Phổi']],
    fill: ['Ở người, cơ quan trao đổi khí chính là [blank].', 'phổi'],
    category: [['Trao đổi khí chủ yếu qua mang', 'Trao đổi khí chủ yếu qua phổi'], [['Cá chép', 0], ['Cá rô', 0], ['Người', 1], ['Chim bồ câu', 1]]],
    drag: ['Côn trùng như châu chấu trao đổi khí qua hệ thống [blank].', ['ống khí', 'mạch gỗ', 'rễ'], 'ống khí'],
  },
  {
    objective: 'Mô tả nhu cầu dinh dưỡng và các bước lấy, tiêu hoá, hấp thụ thức ăn ở động vật.', lesson: 'Bài 31. Trao đổi nước và chất dinh dưỡng ở động vật',
    quiz: ['Sau khi thức ăn được tiêu hoá, chất dinh dưỡng đi vào cơ thể chủ yếu nhờ quá trình nào?', ['Hấp thụ', 'Thoát hơi nước', 'Quang hợp', 'Thụ phấn'], 0, 'Chất dinh dưỡng phải qua thành ống tiêu hoá.', 'Các chất dinh dưỡng sau tiêu hoá được hấp thụ để cơ thể sử dụng.'],
    match: [['Lấy thức ăn', 'Đưa thức ăn vào cơ thể'], ['Tiêu hoá', 'Biến đổi thức ăn thành chất dễ hấp thụ'], ['Hấp thụ', 'Đưa chất dinh dưỡng vào môi trường trong cơ thể']],
    fill: ['Thức ăn được biến đổi thành chất đơn giản hơn trong quá trình [blank].', 'tiêu hoá'],
    category: [['Trước hấp thụ chất dinh dưỡng', 'Sau hấp thụ chất dinh dưỡng'], [['Lấy thức ăn', 0], ['Tiêu hoá thức ăn', 0], ['Vận chuyển chất dinh dưỡng tới tế bào', 1], ['Tế bào sử dụng chất dinh dưỡng', 1]]],
    drag: ['Chất dinh dưỡng cần được [blank] sau tiêu hoá để đi vào cơ thể.', ['hấp thụ', 'quang hợp', 'thụ phấn'], 'hấp thụ'],
  },
  {
    objective: 'Nêu nhu cầu sử dụng nước và con đường trao đổi nước ở động vật.', lesson: 'Bài 31. Trao đổi nước và chất dinh dưỡng ở động vật',
    quiz: ['Nước đi vào cơ thể động vật chủ yếu qua đâu?', ['Thức ăn và nước uống', 'Quang hợp ở da', 'Ánh sáng mặt trời', 'Không khí khô'], 0, 'Xét hai nguồn được đưa vào hệ tiêu hoá.', 'Động vật nhận nước từ thức ăn và nước uống.'],
    match: [['Nước uống', 'Nguồn cung cấp nước'], ['Thức ăn', 'Cũng có thể cung cấp nước'], ['Nước tiểu', 'Một con đường thải nước khỏi cơ thể']],
    fill: ['Động vật lấy nước từ nước uống và [blank].', 'thức ăn'],
    category: [['Nước đi vào cơ thể', 'Nước đi ra khỏi cơ thể'], [['Nước uống', 0], ['Nước trong thức ăn', 0], ['Nước tiểu', 1], ['Mồ hôi', 1]]],
    drag: ['Ở người, nước có thể được thải ra ngoài qua nước tiểu và [blank].', ['mồ hôi', 'quang hợp', 'lông hút'], 'mồ hôi'],
  },
  {
    objective: 'Giải thích vai trò của hệ tuần hoàn trong vận chuyển các chất ở động vật.', lesson: 'Bài 31. Trao đổi nước và chất dinh dưỡng ở động vật',
    quiz: ['Ở người, hệ nào vận chuyển oxygen và chất dinh dưỡng đến tế bào?', ['Hệ tuần hoàn', 'Hệ xương', 'Hệ da', 'Hệ sinh sản'], 0, 'Máu chảy trong hệ này.', 'Hệ tuần hoàn vận chuyển oxygen và chất dinh dưỡng đến tế bào.'],
    match: [['Máu', 'Môi trường vận chuyển nhiều chất'], ['Tim', 'Co bóp đẩy máu'], ['Mạch máu', 'Đường dẫn máu trong cơ thể']],
    fill: ['Máu được tim đẩy đi trong hệ thống [blank] máu.', 'mạch'],
    category: [['Thành phần hệ tuần hoàn', 'Không thuộc hệ tuần hoàn'], [['Tim', 0], ['Mạch máu', 0], ['Máu', 0], ['Khí khổng', 1], ['Mạch gỗ', 1]]],
    drag: ['Tim co bóp tạo lực đẩy [blank] lưu thông trong mạch.', ['máu', 'nhựa cây', 'không khí ngoài trời'], 'máu'],
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
  schemaVersion: 1,
  releaseVersion: 'g7-st2-2026.1',
  grade: 7,
  stationId: 'g7_st2',
  title: 'Lớp 7 - Trạm 2: Hô hấp và trao đổi ở sinh vật',
  status: 'draft',
  notes: 'Nội dung soạn theo các Bài 25–28, 31 của SGK KHTN 7 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({ dayIndex: index + 1, learningObjective: stage.objective, sourceRefs: source(stage.lesson), games: gamesFor(stage, index + 1) })),
};

fs.mkdirSync('content/stations/grade-07', { recursive: true });
fs.writeFileSync('content/stations/grade-07/station-02.json', `${JSON.stringify(document, null, 2)}\n`);
console.log('Đã tạo content/stations/grade-07/station-02.json');
