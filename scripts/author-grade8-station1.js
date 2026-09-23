import fs from 'node:fs';

const source = (lesson) => [{ source: 'SGK Khoa học tự nhiên 8 - Kết nối tri thức với cuộc sống', publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];
const stages = [
  {
    objective: 'Nhận biết các phần và một số hệ cơ quan chính của cơ thể người.', lesson: 'Bài 30. Khái quát về cơ thể người',
    quiz: ['Hệ cơ quan nào giúp cơ thể vận chuyển máu?', ['Hệ tuần hoàn', 'Hệ vận động', 'Hệ da', 'Hệ sinh sản'], 0, 'Tim và mạch máu thuộc hệ này.', 'Hệ tuần hoàn gồm tim và mạch máu, giúp vận chuyển máu.'],
    match: [['Hệ vận động', 'Giúp cơ thể di chuyển'], ['Hệ tiêu hoá', 'Biến đổi và hấp thụ thức ăn'], ['Hệ tuần hoàn', 'Vận chuyển máu và các chất']],
    fill: ['Nhiều cơ quan phối hợp thực hiện chức năng tạo thành một hệ [blank].', 'cơ quan'],
    category: [['Bộ phận thuộc hệ tiêu hoá', 'Bộ phận thuộc hệ tuần hoàn'], [['Dạ dày', 0], ['Ruột non', 0], ['Tim', 1], ['Mạch máu', 1]]],
    drag: ['Cơ thể người gồm nhiều hệ [blank] phối hợp hoạt động.', ['cơ quan', 'sinh thái', 'quần thể'], 'cơ quan'],
  },
  {
    objective: 'Mô tả chức năng của xương, khớp và cơ trong hệ vận động.', lesson: 'Bài 31. Hệ vận động ở người',
    quiz: ['Thành phần nào co lại tạo lực làm xương cử động?', ['Cơ', 'Da', 'Máu', 'Phổi'], 0, 'Nó bám vào xương và có khả năng co.', 'Cơ co tạo lực kéo xương, gây ra cử động tại khớp.'],
    match: [['Xương', 'Nâng đỡ và bảo vệ cơ thể'], ['Khớp', 'Nối các xương và cho phép cử động'], ['Cơ', 'Co tạo lực vận động']],
    fill: ['Cơ co kéo xương chuyển động quanh [blank].', 'khớp'],
    category: [['Thuộc hệ vận động', 'Không thuộc hệ vận động'], [['Xương', 0], ['Khớp', 0], ['Cơ', 0], ['Phổi', 1], ['Dạ dày', 1]]],
    drag: ['Sự phối hợp của xương, cơ và [blank] tạo nên vận động.', ['khớp', 'phế nang', 'ruột non'], 'khớp'],
  },
  {
    objective: 'Nêu biện pháp giữ sức khoẻ hệ vận động và phòng tránh chấn thương.', lesson: 'Bài 31. Hệ vận động ở người',
    quiz: ['Việc nào giúp bảo vệ hệ vận động?', ['Tập luyện phù hợp và giữ tư thế đúng', 'Mang vật quá nặng một bên kéo dài', 'Ngồi cong lưng liên tục', 'Bỏ qua khởi động trước vận động mạnh'], 0, 'Chú ý tải trọng và tư thế.', 'Tập luyện vừa sức, khởi động và giữ tư thế đúng giúp bảo vệ hệ vận động.'],
    match: [['Khởi động', 'Chuẩn bị cơ và khớp trước vận động'], ['Tư thế đúng', 'Giúp hạn chế biến dạng cột sống'], ['Tập luyện phù hợp', 'Góp phần tăng sức bền của cơ và xương']],
    fill: ['Trước khi chơi thể thao nên [blank] để chuẩn bị hệ vận động.', 'khởi động'],
    category: [['Thói quen tốt cho hệ vận động', 'Thói quen gây hại'], [['Ngồi đúng tư thế', 0], ['Vận động vừa sức', 0], ['Khởi động trước tập luyện', 0], ['Mang cặp quá nặng một bên', 1]]],
    drag: ['Giữ lưng thẳng khi ngồi giúp bảo vệ [blank].', ['cột sống', 'phế nang', 'dạ dày'], 'cột sống'],
  },
  {
    objective: 'Nêu vai trò của các nhóm chất dinh dưỡng và nhu cầu ăn uống đa dạng.', lesson: 'Bài 32. Dinh dưỡng và tiêu hoá ở người',
    quiz: ['Nhóm chất nào là nguồn cung cấp năng lượng quan trọng cho cơ thể?', ['Carbohydrate', 'Nước tinh khiết', 'Chất xơ không tiêu hoá', 'Muối khoáng đơn lẻ'], 0, 'Tinh bột thuộc nhóm này.', 'Carbohydrate là một trong các nguồn năng lượng quan trọng của cơ thể.'],
    match: [['Carbohydrate', 'Nguồn cung cấp năng lượng'], ['Protein', 'Góp phần xây dựng cơ thể'], ['Vitamin', 'Cần với lượng nhỏ cho hoạt động bình thường']],
    fill: ['Chế độ ăn cần đa dạng để cung cấp đủ các nhóm chất [blank].', 'dinh dưỡng'],
    category: [['Chất dinh dưỡng đa lượng', 'Chất cần lượng nhỏ'], [['Carbohydrate', 0], ['Protein', 0], ['Chất béo', 0], ['Vitamin', 1], ['Chất khoáng', 1]]],
    drag: ['Ăn đa dạng thực phẩm giúp cơ thể nhận đủ chất [blank].', ['dinh dưỡng', 'độc hại', 'thải'], 'dinh dưỡng'],
  },
  {
    objective: 'Sắp xếp đường đi của thức ăn qua ống tiêu hoá.', lesson: 'Bài 32. Dinh dưỡng và tiêu hoá ở người',
    quiz: ['Sau dạ dày, thức ăn tiếp tục đi vào cơ quan nào?', ['Ruột non', 'Thực quản', 'Miệng', 'Khí quản'], 0, 'Tại đây có nhiều quá trình tiêu hoá và hấp thụ.', 'Thức ăn từ dạ dày đi vào ruột non.'],
    match: [['Miệng', 'Nhai và trộn thức ăn với nước bọt'], ['Dạ dày', 'Co bóp và tiêu hoá một phần thức ăn'], ['Ruột non', 'Tiêu hoá tiếp và hấp thụ nhiều chất dinh dưỡng']],
    fill: ['Từ miệng, thức ăn đi qua thực quản rồi đến [blank].', 'dạ dày'],
    category: [['Thuộc ống tiêu hoá', 'Không thuộc ống tiêu hoá'], [['Miệng', 0], ['Dạ dày', 0], ['Ruột non', 0], ['Phổi', 1], ['Tim', 1]]],
    drag: ['Sau khi qua dạ dày, thức ăn tiếp tục được tiêu hoá ở ruột [blank].', ['non', 'già', 'thừa'], 'non'],
  },
  {
    objective: 'Giải thích sự tiêu hoá và hấp thụ chất dinh dưỡng ở ruột non.', lesson: 'Bài 32. Dinh dưỡng và tiêu hoá ở người',
    quiz: ['Nhiều chất dinh dưỡng sau tiêu hoá được hấp thụ chủ yếu ở đâu?', ['Ruột non', 'Thực quản', 'Khí quản', 'Tim'], 0, 'Cơ quan này có nhiều lông ruột.', 'Ruột non là nơi hấp thụ phần lớn chất dinh dưỡng sau tiêu hoá.'],
    match: [['Tiêu hoá', 'Biến đổi thức ăn thành chất đơn giản'], ['Hấp thụ', 'Đưa chất dinh dưỡng qua thành ruột'], ['Lông ruột', 'Làm tăng diện tích bề mặt hấp thụ']],
    fill: ['Các [blank] ruột làm tăng diện tích hấp thụ ở ruột non.', 'lông'],
    category: [['Liên quan hấp thụ dinh dưỡng', 'Không có vai trò hấp thụ dinh dưỡng trực tiếp'], [['Ruột non', 0], ['Lông ruột', 0], ['Mao mạch trong lông ruột', 0], ['Khí quản', 1]]],
    drag: ['Ruột [blank] hấp thụ phần lớn chất dinh dưỡng đã tiêu hoá.', ['non', 'già', 'mù'], 'non'],
  },
  {
    objective: 'Lựa chọn thói quen vệ sinh ăn uống bảo vệ hệ tiêu hoá.', lesson: 'Bài 32. Dinh dưỡng và tiêu hoá ở người',
    quiz: ['Thói quen nào góp phần phòng bệnh đường tiêu hoá?', ['Rửa tay trước khi ăn', 'Ăn thực phẩm đã ôi thiu', 'Uống nước chưa xử lí', 'Bỏ qua vệ sinh dụng cụ ăn'], 0, 'Ngăn tác nhân gây bệnh đi theo thức ăn.', 'Rửa tay trước ăn và dùng thực phẩm sạch giúp giảm nguy cơ bệnh tiêu hoá.'],
    match: [['Rửa tay', 'Giảm đưa vi sinh vật gây bệnh vào thức ăn'], ['Ăn chín uống sôi', 'Hạn chế mầm bệnh từ thực phẩm và nước'], ['Đọc hạn sử dụng', 'Giúp tránh thực phẩm quá hạn']],
    fill: ['Cần ăn chín, uống [blank] để góp phần bảo vệ hệ tiêu hoá.', 'sôi'],
    category: [['Vệ sinh ăn uống', 'Không an toàn cho tiêu hoá'], [['Rửa tay trước ăn', 0], ['Dùng nước sạch', 0], ['Bảo quản thức ăn hợp lí', 0], ['Ăn thức ăn ôi thiu', 1]]],
    drag: ['Không dùng thực phẩm [blank] vì có nguy cơ gây bệnh tiêu hoá.', ['ôi thiu', 'đã nấu chín', 'được bảo quản đúng'], 'ôi thiu'],
  },
  {
    objective: 'Nhận biết thành phần chính và một số chức năng của máu.', lesson: 'Bài 33. Máu và hệ tuần hoàn của cơ thể người',
    quiz: ['Thành phần nào của máu vận chuyển oxygen chủ yếu?', ['Hồng cầu', 'Tiểu cầu', 'Huyết tương', 'Bạch cầu'], 0, 'Tế bào này chứa hemoglobin.', 'Hồng cầu chứa hemoglobin, tham gia vận chuyển oxygen.'],
    match: [['Hồng cầu', 'Vận chuyển oxygen'], ['Bạch cầu', 'Tham gia bảo vệ cơ thể'], ['Tiểu cầu', 'Tham gia đông máu']],
    fill: ['Tế bào máu tham gia bảo vệ cơ thể là [blank].', 'bạch cầu'],
    category: [['Tế bào hoặc mảnh tế bào của máu', 'Phần dịch của máu'], [['Hồng cầu', 0], ['Bạch cầu', 0], ['Tiểu cầu', 0], ['Huyết tương', 1]]],
    drag: ['Khi bị thương, [blank] góp phần hình thành cục máu đông.', ['tiểu cầu', 'hồng cầu', 'phế nang'], 'tiểu cầu'],
  },
  {
    objective: 'Phân biệt động mạch, tĩnh mạch và mao mạch theo chiều vận chuyển máu.', lesson: 'Bài 33. Máu và hệ tuần hoàn của cơ thể người',
    quiz: ['Mạch máu nào đưa máu từ tim đi tới các cơ quan?', ['Động mạch', 'Tĩnh mạch', 'Mao mạch', 'Ống tiêu hoá'], 0, 'Xét chiều máu rời tim.', 'Động mạch dẫn máu từ tim tới các cơ quan.'],
    match: [['Động mạch', 'Dẫn máu từ tim đi'], ['Tĩnh mạch', 'Dẫn máu về tim'], ['Mao mạch', 'Nơi trao đổi chất với tế bào']],
    fill: ['Mạch dẫn máu từ các cơ quan trở về tim gọi là [blank].', 'tĩnh mạch'],
    category: [['Dẫn máu ra khỏi tim', 'Dẫn máu trở về tim'], [['Động mạch chủ', 0], ['Động mạch phổi', 0], ['Tĩnh mạch chủ', 1], ['Tĩnh mạch phổi', 1]]],
    drag: ['Sự trao đổi chất giữa máu và tế bào diễn ra chủ yếu ở [blank].', ['mao mạch', 'động mạch chủ', 'tĩnh mạch chủ'], 'mao mạch'],
  },
  {
    objective: 'Mô tả vai trò của tim và hai vòng tuần hoàn ở người.', lesson: 'Bài 33. Máu và hệ tuần hoàn của cơ thể người',
    quiz: ['Vòng tuần hoàn nhỏ đưa máu qua cơ quan nào để trao đổi khí?', ['Phổi', 'Dạ dày', 'Gan', 'Thận'], 0, 'Vòng này còn gọi là vòng tuần hoàn phổi.', 'Vòng tuần hoàn nhỏ đưa máu từ tim tới phổi và trở về tim.'],
    match: [['Tim', 'Co bóp tạo lực đẩy máu'], ['Vòng tuần hoàn nhỏ', 'Đưa máu qua phổi'], ['Vòng tuần hoàn lớn', 'Đưa máu qua các cơ quan của cơ thể']],
    fill: ['Vòng tuần hoàn [blank] đưa máu từ tim qua phổi rồi về tim.', 'nhỏ'],
    category: [['Vòng tuần hoàn nhỏ', 'Vòng tuần hoàn lớn'], [['Qua phổi để trao đổi khí', 0], ['Còn gọi là tuần hoàn phổi', 0], ['Qua nhiều cơ quan của cơ thể', 1], ['Cung cấp chất cho mô toàn thân', 1]]],
    drag: ['Tim co bóp liên tục để đẩy [blank] lưu thông trong cơ thể.', ['máu', 'thức ăn', 'không khí'], 'máu'],
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
  schemaVersion: 1, releaseVersion: 'g8-st1-2026.1', grade: 8, stationId: 'g8_st1',
  title: 'Lớp 8 - Trạm 1: Vận động, dinh dưỡng và tuần hoàn', status: 'draft',
  notes: 'Nội dung soạn theo các Bài 30–33 của SGK KHTN 8 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({ dayIndex: index + 1, learningObjective: stage.objective, sourceRefs: source(stage.lesson), games: gamesFor(stage, index + 1) })),
};
fs.mkdirSync('content/stations/grade-08', { recursive: true });
fs.writeFileSync('content/stations/grade-08/station-01.json', `${JSON.stringify(document, null, 2)}\n`);
console.log('Đã tạo content/stations/grade-08/station-01.json');
