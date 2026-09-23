import fs from 'node:fs';

const source = (lesson) => [{ source: 'SGK Khoa học tự nhiên 8 - Kết nối tri thức với cuộc sống', publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];
const stages = [
  {
    objective: 'Phân biệt nhân tố vô sinh và hữu sinh trong môi trường sống.', lesson: 'Bài 41. Môi trường và các nhân tố sinh thái',
    quiz: ['Nhân tố nào sau đây là nhân tố vô sinh?', ['Ánh sáng', 'Cây cỏ', 'Nấm', 'Vi khuẩn'], 0, 'Nhân tố này không phải sinh vật.', 'Ánh sáng là nhân tố vô sinh của môi trường.'],
    match: [['Ánh sáng', 'Nhân tố vô sinh cung cấp năng lượng'], ['Cây cỏ', 'Sinh vật tự dưỡng phổ biến'], ['Động vật ăn cỏ', 'Sinh vật tiêu thụ']],
    fill: ['Các sinh vật trong môi trường thuộc nhóm nhân tố [blank].', 'hữu sinh'],
    category: [['Nhân tố vô sinh', 'Nhân tố hữu sinh'], [['Nhiệt độ', 0], ['Nước', 0], ['Ánh sáng', 0], ['Cây cỏ', 1], ['Động vật', 1]]],
    drag: ['Nhiệt độ là một nhân tố sinh thái [blank].', ['vô sinh', 'hữu sinh', 'sinh sản'], 'vô sinh'],
  },
  {
    objective: 'Nhận biết quần thể sinh vật và các đặc trưng cơ bản.', lesson: 'Bài 42. Quần thể sinh vật',
    quiz: ['Tập hợp nào có thể là một quần thể sinh vật?', ['Các cây thông cùng loài trong một khu rừng tại một thời điểm', 'Mọi loài cây trong rừng', 'Cá, chim và cây trong hồ', 'Tất cả sinh vật trên Trái Đất'], 0, 'Các cá thể phải cùng loài, sống trong một khu vực và thời điểm.', 'Các cây thông cùng loài trong một khu vực, tại một thời điểm có thể tạo thành quần thể.'],
    match: [['Quần thể', 'Các cá thể cùng loài sống trong khu vực xác định'], ['Kích thước quần thể', 'Số lượng cá thể của quần thể'], ['Mật độ quần thể', 'Số cá thể trên một đơn vị diện tích hoặc thể tích']],
    fill: ['Các cá thể trong một quần thể phải thuộc cùng một [blank].', 'loài'],
    category: [['Một quần thể', 'Không phải một quần thể'], [['Các cây lúa cùng giống trên một ruộng', 0], ['Đàn cá rô cùng loài trong ao', 0], ['Nhiều loài chim trong rừng', 1], ['Cá và tôm trong ao', 1]]],
    drag: ['Mật độ quần thể là số cá thể trên một đơn vị diện tích hoặc [blank].', ['thể tích', 'thời gian học', 'khối lượng sách'], 'thể tích'],
  },
  {
    objective: 'Phân biệt quần xã sinh vật với quần thể sinh vật.', lesson: 'Bài 43. Quần xã sinh vật',
    quiz: ['Quần xã sinh vật gồm những thành phần nào?', ['Nhiều quần thể thuộc các loài khác nhau cùng sống trong khu vực', 'Chỉ một cá thể', 'Chỉ các cá thể cùng loài', 'Chỉ đất và nước'], 0, 'Quần xã có nhiều loài.', 'Quần xã là tập hợp các quần thể thuộc nhiều loài cùng sống trong một khu vực.'],
    match: [['Quần thể', 'Các cá thể cùng loài'], ['Quần xã', 'Nhiều quần thể khác loài'], ['Độ đa dạng', 'Thể hiện mức phong phú loài trong quần xã']],
    fill: ['Một quần xã gồm nhiều [blank] thuộc các loài khác nhau.', 'quần thể'],
    category: [['Quần thể', 'Quần xã'], [['Đàn cá chép trong ao', 0], ['Các cây thông cùng loài trong rừng', 0], ['Nhiều loài sinh vật trong ao', 1], ['Nhiều loài sinh vật trong rừng', 1]]],
    drag: ['Quần xã có các quần thể thuộc nhiều [blank] khác nhau.', ['loài', 'hành tinh', 'tế bào máu'], 'loài'],
  },
  {
    objective: 'Nhận biết thành phần vô sinh và hữu sinh của hệ sinh thái.', lesson: 'Bài 44. Hệ sinh thái',
    quiz: ['Hệ sinh thái gồm những thành phần nào?', ['Quần xã sinh vật và môi trường vô sinh', 'Chỉ một loài động vật', 'Chỉ đất và nước', 'Chỉ các sinh vật sản xuất'], 0, 'Hệ sinh thái gồm sinh vật và các yếu tố không sống.', 'Hệ sinh thái gồm quần xã sinh vật cùng môi trường vô sinh của nó.'],
    match: [['Sinh vật sản xuất', 'Tạo chất hữu cơ từ chất vô cơ'], ['Sinh vật tiêu thụ', 'Sử dụng sinh vật khác làm thức ăn'], ['Sinh vật phân giải', 'Phân huỷ xác và chất thải hữu cơ']],
    fill: ['Hệ sinh thái gồm quần xã sinh vật và môi trường [blank].', 'vô sinh'],
    category: [['Thành phần hữu sinh', 'Thành phần vô sinh'], [['Cây xanh', 0], ['Động vật', 0], ['Nấm phân giải', 0], ['Nước', 1], ['Ánh sáng', 1]]],
    drag: ['Cây xanh thường đóng vai trò sinh vật [blank] trong hệ sinh thái.', ['sản xuất', 'tiêu thụ', 'kí sinh bắt buộc'], 'sản xuất'],
  },
  {
    objective: 'Xác định chiều truyền năng lượng trong chuỗi thức ăn.', lesson: 'Bài 44. Hệ sinh thái',
    quiz: ['Trong chuỗi cỏ → châu chấu → ếch, sinh vật tiêu thụ bậc một là gì?', ['Châu chấu', 'Cỏ', 'Ếch', 'Đất'], 0, 'Nó ăn sinh vật sản xuất.', 'Châu chấu ăn cỏ nên là sinh vật tiêu thụ bậc một.'],
    match: [['Cỏ', 'Sinh vật sản xuất'], ['Châu chấu', 'Sinh vật tiêu thụ bậc một'], ['Ếch', 'Sinh vật tiêu thụ bậc hai']],
    fill: ['Mũi tên trong chuỗi thức ăn chỉ chiều truyền vật chất và [blank].', 'năng lượng'],
    category: [['Sinh vật sản xuất', 'Sinh vật tiêu thụ'], [['Cỏ', 0], ['Tảo lục', 0], ['Châu chấu', 1], ['Ếch', 1]]],
    drag: ['Trong chuỗi cỏ → châu chấu → ếch, ếch ăn [blank].', ['châu chấu', 'cỏ trực tiếp', 'ánh sáng'], 'châu chấu'],
  },
  {
    objective: 'Nêu khái niệm sinh quyển và vai trò của các hệ sinh thái.', lesson: 'Bài 45. Sinh quyển',
    quiz: ['Sinh quyển là gì?', ['Phần Trái Đất có sự sống', 'Chỉ khí quyển', 'Chỉ lõi Trái Đất', 'Chỉ một khu rừng'], 0, 'Gồm các nơi sinh vật có thể tồn tại.', 'Sinh quyển là phần Trái Đất có sự sống.'],
    match: [['Sinh quyển', 'Phần Trái Đất có sự sống'], ['Hệ sinh thái rừng', 'Một kiểu hệ sinh thái trên cạn'], ['Hệ sinh thái biển', 'Một kiểu hệ sinh thái dưới nước']],
    fill: ['Phần Trái Đất có sự sống được gọi là [blank].', 'sinh quyển'],
    category: [['Hệ sinh thái trên cạn', 'Hệ sinh thái dưới nước'], [['Rừng', 0], ['Đồng cỏ', 0], ['Hồ', 1], ['Biển', 1]]],
    drag: ['Rừng, hồ và biển đều là các kiểu hệ [blank].', ['sinh thái', 'tuần hoàn', 'tiêu hoá'], 'sinh thái'],
  },
  {
    objective: 'Giải thích trạng thái cân bằng tự nhiên và khả năng biến động của hệ sinh thái.', lesson: 'Bài 46. Cân bằng tự nhiên',
    quiz: ['Điều gì có thể xảy ra khi một loài bị loại bỏ khỏi lưới thức ăn?', ['Quan hệ dinh dưỡng giữa các loài có thể thay đổi', 'Mọi loài còn lại luôn không đổi', 'Đất biến mất ngay lập tức', 'Không còn ánh sáng mặt trời'], 0, 'Các loài có liên hệ với nhau.', 'Mất một loài có thể ảnh hưởng tới các loài ăn nó hoặc bị nó ăn.'],
    match: [['Cân bằng tự nhiên', 'Trạng thái tương đối ổn định của hệ sinh thái'], ['Loài săn mồi', 'Có thể ảnh hưởng số lượng con mồi'], ['Loài bị săn mồi', 'Có thể là nguồn thức ăn của loài khác']],
    fill: ['Các loài trong hệ sinh thái có quan hệ [blank] và ảnh hưởng lẫn nhau.', 'dinh dưỡng'],
    category: [['Góp phần duy trì cân bằng', 'Có thể phá vỡ cân bằng'], [['Bảo vệ sinh cảnh', 0], ['Khai thác hợp lí', 0], ['Bảo vệ đa dạng sinh học', 0], ['Săn bắt tận diệt', 1]]],
    drag: ['Thay đổi số lượng một loài có thể ảnh hưởng tới cả [blank] thức ăn.', ['lưới', 'ống', 'mạch'], 'lưới'],
  },
  {
    objective: 'Nhận diện một số tác động gây suy giảm đa dạng sinh học.', lesson: 'Bài 47. Bảo vệ môi trường',
    quiz: ['Hành động nào có thể làm suy giảm đa dạng sinh học?', ['Phá huỷ nơi sống của sinh vật', 'Trồng cây bản địa', 'Bảo vệ rừng', 'Giữ sạch nguồn nước'], 0, 'Nhiều loài phụ thuộc vào sinh cảnh.', 'Phá huỷ nơi sống làm nhiều loài mất nơi cư trú và nguồn thức ăn.'],
    match: [['Phá rừng', 'Làm mất sinh cảnh'], ['Ô nhiễm nước', 'Gây hại sinh vật thuỷ sinh'], ['Săn bắt trái phép', 'Làm giảm số lượng loài bị khai thác']],
    fill: ['Phá rừng có thể làm mất [blank] của nhiều loài.', 'sinh cảnh'],
    category: [['Tác động gây suy giảm', 'Biện pháp bảo vệ'], [['Phá rừng', 0], ['Xả chất thải chưa xử lí', 0], ['Săn bắt trái phép', 0], ['Trồng và bảo vệ rừng', 1]]],
    drag: ['Giữ sạch nguồn nước giúp bảo vệ các sinh vật [blank].', ['thuỷ sinh', 'trên sa mạc', 'trong đá khô'], 'thuỷ sinh'],
  },
  {
    objective: 'Chọn biện pháp bảo vệ môi trường và sử dụng tài nguyên hợp lí.', lesson: 'Bài 47. Bảo vệ môi trường',
    quiz: ['Biện pháp nào góp phần bảo vệ môi trường?', ['Phân loại và xử lí rác đúng cách', 'Đổ chất thải chưa xử lí ra sông', 'Đốt rừng lấy đất', 'Khai thác tận diệt'], 0, 'Giảm chất thải gây ô nhiễm.', 'Phân loại và xử lí rác đúng cách góp phần giảm ô nhiễm.'],
    match: [['Phân loại rác', 'Hỗ trợ tái chế và xử lí phù hợp'], ['Tiết kiệm nước', 'Giảm lãng phí tài nguyên'], ['Bảo vệ rừng', 'Giữ sinh cảnh và góp phần bảo vệ đất']],
    fill: ['Sử dụng tài nguyên cần tiết kiệm và [blank].', 'hợp lí'],
    category: [['Hành động bảo vệ môi trường', 'Hành động gây ô nhiễm'], [['Thu gom rác đúng nơi', 0], ['Tiết kiệm nước', 0], ['Trồng cây', 0], ['Xả rác xuống kênh', 1]]],
    drag: ['Rác thải cần được thu gom và [blank] phù hợp.', ['xử lí', 'vứt xuống sông', 'đốt tùy tiện'], 'xử lí'],
  },
  {
    objective: 'Vận dụng kiến thức quần thể, quần xã và hệ sinh thái để khảo sát môi trường gần trường.', lesson: 'Bài 41–47. Sinh vật và môi trường',
    quiz: ['Khi khảo sát hệ sinh thái sân trường, cần ghi nhận gì?', ['Sinh vật và các yếu tố vô sinh', 'Chỉ tên một học sinh', 'Chỉ màu tường lớp học', 'Chỉ nhiệt độ cơ thể người khảo sát'], 0, 'Hệ sinh thái gồm quần xã và môi trường.', 'Cần quan sát sinh vật cùng các yếu tố vô sinh như ánh sáng, nước và đất.'],
    match: [['Quan sát sinh vật', 'Ghi các loài có mặt'], ['Quan sát môi trường', 'Ghi ánh sáng, nước hoặc đất'], ['Ghi chép kết quả', 'Lưu bằng chứng để phân tích']],
    fill: ['Khảo sát hệ sinh thái cần quan sát cả sinh vật và yếu tố [blank].', 'vô sinh'],
    category: [['Nên làm khi khảo sát', 'Không nên làm khi khảo sát'], [['Ghi chép quan sát', 0], ['Không làm hại sinh vật', 0], ['Tuân thủ an toàn', 0], ['Phá tổ để đếm cá thể', 1]]],
    drag: ['Sau khảo sát, cần sắp xếp dữ liệu và rút ra [blank].', ['kết luận', 'mùi hương', 'số đo tùy ý'], 'kết luận'],
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
  schemaVersion: 1, releaseVersion: 'g8-st3-2026.1', grade: 8, stationId: 'g8_st3',
  title: 'Lớp 8 - Trạm 3: Sinh vật và môi trường', status: 'draft',
  notes: 'Nội dung soạn theo các Bài 41–47 của SGK KHTN 8 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({ dayIndex: index + 1, learningObjective: stage.objective, sourceRefs: source(stage.lesson), games: gamesFor(stage, index + 1) })),
};
fs.mkdirSync('content/stations/grade-08', { recursive: true });
fs.writeFileSync('content/stations/grade-08/station-03.json', `${JSON.stringify(document, null, 2)}\n`);
console.log('Đã tạo content/stations/grade-08/station-03.json');
