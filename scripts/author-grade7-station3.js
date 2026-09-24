import fs from 'node:fs';
import { replacePlaceholderStationHints } from '../src/utils/stationHints.js';

const source = (lesson) => [{ source: 'SGK Khoa học tự nhiên 7 - Kết nối tri thức với cuộc sống', publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];

const stages = [
  {
    objective: 'Nêu khái niệm cảm ứng và nhận biết các phản ứng với kích thích ở sinh vật.', lesson: 'Bài 33. Cảm ứng ở sinh vật và tập tính ở động vật',
    quiz: ['Hiện tượng nào thể hiện cảm ứng ở thực vật?', ['Ngọn cây hướng về phía ánh sáng', 'Hạt có màu nâu', 'Thân cây chứa mạch gỗ', 'Rễ có nhiều tế bào'], 0, 'Cảm ứng là phản ứng với kích thích.', 'Ngọn cây đổi hướng sinh trưởng khi nhận ánh sáng là biểu hiện cảm ứng.'],
    match: [['Ánh sáng', 'Kích thích từ môi trường'], ['Ngọn cây hướng sáng', 'Phản ứng của cây'], ['Cảm ứng', 'Khả năng tiếp nhận và đáp ứng kích thích']],
    fill: ['Khả năng sinh vật tiếp nhận và phản ứng với kích thích gọi là [blank].', 'cảm ứng'],
    category: [['Biểu hiện cảm ứng', 'Không phải biểu hiện cảm ứng'], [['Lá cây trinh nữ cụp khi chạm', 0], ['Ngọn cây hướng sáng', 0], ['Động vật chạy trốn kẻ thù', 0], ['Cây có rễ và thân', 1]]],
    drag: ['Khi có kích thích từ môi trường, sinh vật có thể đưa ra [blank] phù hợp.', ['phản ứng', 'hạt giống', 'chất khoáng'], 'phản ứng'],
  },
  {
    objective: 'Phân biệt một số tập tính bẩm sinh và học được ở động vật.', lesson: 'Bài 33. Cảm ứng ở sinh vật và tập tính ở động vật',
    quiz: ['Ví dụ nào là tập tính học được?', ['Chó làm theo lệnh sau khi được huấn luyện', 'Nhện giăng tơ lần đầu', 'Trẻ sơ sinh bú mẹ', 'Chim non há mỏ đòi ăn'], 0, 'Tập tính này hình thành nhờ kinh nghiệm.', 'Chó đáp ứng lệnh sau huấn luyện là tập tính học được.'],
    match: [['Tập tính bẩm sinh', 'Có sẵn từ khi sinh ra'], ['Tập tính học được', 'Hình thành qua học tập và kinh nghiệm'], ['Huấn luyện', 'Có thể hình thành tập tính mới']],
    fill: ['Tập tính hình thành trong quá trình sống nhờ học tập gọi là tập tính [blank].', 'học được'],
    category: [['Tập tính bẩm sinh', 'Tập tính học được'], [['Nhện giăng tơ', 0], ['Trẻ sơ sinh bú mẹ', 0], ['Chó nghe lệnh sau huấn luyện', 1], ['Khỉ dùng công cụ sau khi học', 1]]],
    drag: ['Tập tính có sẵn từ khi sinh ra được gọi là tập tính [blank].', ['bẩm sinh', 'học được', 'tạm thời'], 'bẩm sinh'],
  },
  {
    objective: 'Vận dụng hiểu biết về cảm ứng để chăm sóc cây và điều chỉnh tập tính động vật.', lesson: 'Bài 34. Vận dụng hiện tượng cảm ứng ở sinh vật vào thực tiễn',
    quiz: ['Vì sao cần xoay chậu cây để cây nhận ánh sáng đều các phía?', ['Cây thường hướng sinh trưởng về phía ánh sáng', 'Cây không cần ánh sáng', 'Cây chỉ hấp thụ nước ở một phía', 'Ánh sáng làm hỏng rễ ngay lập tức'], 0, 'Xét tính hướng sáng của thân cây.', 'Xoay chậu giúp các phía của cây nhận ánh sáng, hạn chế thân nghiêng về một phía.'],
    match: [['Tính hướng sáng', 'Có thể làm cây nghiêng về phía sáng'], ['Huấn luyện thú nuôi', 'Dựa vào khả năng hình thành tập tính học được'], ['Tính hướng nước của rễ', 'Rễ có thể phát triển về phía nguồn nước']],
    fill: ['Thân cây thường sinh trưởng hướng về nguồn [blank].', 'ánh sáng'],
    category: [['Vận dụng cảm ứng hợp lí', 'Không phù hợp khi chăm sóc sinh vật'], [['Đặt cây nơi có ánh sáng phù hợp', 0], ['Xoay chậu cây định kì', 0], ['Huấn luyện động vật bằng cách phù hợp', 0], ['Để cây thiếu sáng kéo dài', 1]]],
    drag: ['Thân cây mọc hướng về phía nguồn sáng là hiện tượng hướng [blank].', ['sáng', 'nước', 'trọng lực'], 'sáng'],
  },
  {
    objective: 'Quan sát và mô tả được phản ứng cảm ứng của cây.', lesson: 'Bài 35. Thực hành: Cảm ứng ở sinh vật',
    quiz: ['Trong thí nghiệm hướng sáng ở cây non, yếu tố nên thay đổi giữa hai nhóm là gì?', ['Hướng chiếu sáng', 'Loài cây và độ tuổi cùng lúc', 'Loại đất và lượng nước cùng lúc', 'Mọi điều kiện trong thí nghiệm'], 0, 'Chỉ thay đổi yếu tố cần khảo sát.', 'Thay đổi hướng chiếu sáng và giữ điều kiện khác tương tự giúp quan sát hướng sáng.'],
    match: [['Nguồn sáng một phía', 'Tạo kích thích có hướng'], ['Đo hướng mọc của thân', 'Ghi nhận phản ứng'], ['Mẫu đối chứng', 'Giúp so sánh kết quả']],
    fill: ['Khi khảo sát cảm ứng, cần ghi chép kết quả [blank] được.', 'quan sát'],
    category: [['Thực hành có kiểm soát', 'Thực hành khó kết luận'], [['Giữ lượng nước tương tự', 0], ['Ghi chép hướng mọc', 0], ['So sánh với mẫu đối chứng', 0], ['Thay đổi ánh sáng và nước cùng lúc', 1]]],
    drag: ['Để so sánh ảnh hưởng ánh sáng, cần giữ các điều kiện khác tương đối [blank].', ['giống nhau', 'khác hoàn toàn', 'ngẫu nhiên'], 'giống nhau'],
  },
  {
    objective: 'Phân biệt sinh trưởng và phát triển ở sinh vật.', lesson: 'Bài 36. Khái quát về sinh trưởng và phát triển ở sinh vật',
    quiz: ['Sự tăng kích thước và khối lượng cơ thể được gọi là gì?', ['Sinh trưởng', 'Cảm ứng', 'Quang hợp', 'Thoát hơi nước'], 0, 'Xét thay đổi về lượng.', 'Sinh trưởng là sự tăng kích thước và khối lượng cơ thể.'],
    match: [['Sinh trưởng', 'Tăng kích thước và khối lượng'], ['Phát triển', 'Biến đổi về hình thái và chức năng'], ['Cây ra hoa', 'Một biểu hiện của phát triển']],
    fill: ['Cơ thể tăng kích thước và khối lượng là biểu hiện của [blank].', 'sinh trưởng'],
    category: [['Biểu hiện sinh trưởng', 'Biểu hiện phát triển'], [['Cây cao thêm', 0], ['Khối lượng cơ thể tăng', 0], ['Cây ra hoa', 1], ['Nòng nọc biến thành ếch', 1]]],
    drag: ['Sự biến đổi về hình thái và chức năng trong vòng đời gọi là [blank].', ['phát triển', 'hô hấp', 'bài tiết'], 'phát triển'],
  },
  {
    objective: 'Nêu ảnh hưởng của điều kiện sống đến sinh trưởng và phát triển.', lesson: 'Bài 37. Ứng dụng sinh trưởng và phát triển ở sinh vật vào thực tiễn; Bài 38. Thực hành: Quan sát, mô tả sự sinh trưởng và phát triển ở một số sinh vật',
    quiz: ['Điều kiện nào thường cần thiết để hạt giống nảy mầm?', ['Độ ẩm thích hợp', 'Ngâm trong nước sôi', 'Để khô tuyệt đối', 'Đặt trong dung dịch muối đậm đặc'], 0, 'Hạt cần hấp thụ nước.', 'Độ ẩm thích hợp giúp hạt bắt đầu nảy mầm; các điều kiện khác cũng cần phù hợp.'],
    match: [['Nước', 'Cần cho nhiều quá trình sống'], ['Nhiệt độ phù hợp', 'Giúp hoạt động sống diễn ra bình thường'], ['Chất dinh dưỡng', 'Cung cấp vật chất cho sinh trưởng']],
    fill: ['Sinh trưởng và phát triển của sinh vật chịu ảnh hưởng của môi trường [blank].', 'sống'],
    category: [['Điều kiện thuận lợi cho cây non', 'Điều kiện bất lợi cho cây non'], [['Nước vừa đủ', 0], ['Ánh sáng phù hợp', 0], ['Chất dinh dưỡng phù hợp', 0], ['Ngập úng kéo dài', 1], ['Thiếu nước kéo dài', 1]]],
    drag: ['Khi theo dõi cây non, đo chiều cao theo thời gian giúp nhận biết sự [blank].', ['sinh trưởng', 'sinh sản', 'thụ tinh'], 'sinh trưởng'],
  },
  {
    objective: 'Nhận biết sinh sản vô tính và một số hình thức thường gặp.', lesson: 'Bài 39. Sinh sản vô tính ở sinh vật',
    quiz: ['Sinh sản vô tính có đặc điểm nào?', ['Không có sự kết hợp giao tử đực và giao tử cái', 'Luôn có sự thụ tinh', 'Chỉ xảy ra ở động vật', 'Luôn tạo hạt và quả'], 0, 'Xét vai trò của giao tử.', 'Sinh sản vô tính không có sự kết hợp giữa giao tử đực và giao tử cái.'],
    match: [['Phân đôi', 'Một cơ thể tạo thành hai cơ thể'], ['Nảy chồi', 'Cơ thể mới hình thành từ chồi'], ['Giâm cành', 'Tạo cây mới từ đoạn cành']],
    fill: ['Giâm cành là một hình thức sinh sản [blank] ở thực vật.', 'vô tính'],
    category: [['Sinh sản vô tính', 'Sinh sản hữu tính'], [['Vi khuẩn phân đôi', 0], ['Giâm cành cây hoa hồng', 0], ['Nấm men nảy chồi', 0], ['Cây tạo hạt sau thụ tinh', 1]]],
    drag: ['Ở sinh sản vô tính, cơ thể mới có thể hình thành từ một [blank] ban đầu.', ['cơ thể', 'cặp giao tử', 'hợp tử'], 'cơ thể'],
  },
  {
    objective: 'Mô tả vai trò của hoa, thụ phấn và thụ tinh trong sinh sản hữu tính ở cây có hoa.', lesson: 'Bài 40. Sinh sản hữu tính ở sinh vật',
    quiz: ['Thụ phấn ở cây có hoa là quá trình nào?', ['Hạt phấn được chuyển đến đầu nhuỵ', 'Hạt nảy mầm trong đất', 'Quả chín và rụng', 'Rễ hút chất khoáng'], 0, 'Xét đường đi của hạt phấn.', 'Thụ phấn là sự chuyển hạt phấn đến đầu nhuỵ.'],
    match: [['Nhị hoa', 'Tạo hạt phấn'], ['Nhuỵ hoa', 'Chứa bầu nhuỵ'], ['Thụ phấn', 'Hạt phấn đến đầu nhuỵ']],
    fill: ['Sau thụ tinh, noãn thường phát triển thành [blank].', 'hạt'],
    category: [['Liên quan sinh sản hữu tính ở cây có hoa', 'Không trực tiếp là bước sinh sản hữu tính'], [['Tạo hạt phấn', 0], ['Thụ phấn', 0], ['Thụ tinh', 0], ['Rễ hút nước', 1]]],
    drag: ['Ở cây có hoa, bầu nhuỵ sau thụ tinh thường phát triển thành [blank].', ['quả', 'rễ', 'lá'], 'quả'],
  },
  {
    objective: 'Phân biệt thụ tinh với sự phát triển phôi ở động vật.', lesson: 'Bài 40. Sinh sản hữu tính ở sinh vật',
    quiz: ['Thụ tinh là sự kết hợp giữa những tế bào nào?', ['Giao tử đực và giao tử cái', 'Hai tế bào da', 'Hai tế bào lá', 'Một tế bào cơ và một tế bào máu'], 0, 'Đó là hai loại giao tử.', 'Sự kết hợp giao tử đực và giao tử cái tạo thành hợp tử.'],
    match: [['Giao tử đực ở nhiều động vật', 'Tinh trùng'], ['Giao tử cái ở nhiều động vật', 'Trứng'], ['Hợp tử', 'Được tạo sau khi hai giao tử kết hợp']],
    fill: ['Sự kết hợp giao tử đực và giao tử cái tạo thành [blank].', 'hợp tử'],
    category: [['Trước hoặc tại thụ tinh', 'Sau thụ tinh'], [['Tạo giao tử đực', 0], ['Tạo giao tử cái', 0], ['Giao tử kết hợp', 0], ['Hợp tử phát triển thành phôi', 1]]],
    drag: ['Hợp tử tiếp tục phân chia và phát triển thành [blank].', ['phôi', 'hạt phấn', 'lông hút'], 'phôi'],
  },
  {
    objective: 'Nêu tác động của các yếu tố môi trường đến sinh sản và mối liên hệ các quá trình sống.', lesson: 'Bài 41. Một số yếu tố ảnh hưởng và điều hoà, điều khiển sinh sản ở sinh vật; Bài 42. Cơ thể sinh vật là một thể thống nhất',
    quiz: ['Vì sao cây cần đủ nước và chất dinh dưỡng trước khi ra hoa, kết quả?', ['Các quá trình sống liên hệ và hỗ trợ nhau', 'Sinh sản không cần trao đổi chất', 'Nước luôn ngăn cây ra hoa', 'Chỉ lá cây cần dinh dưỡng'], 0, 'Sinh sản cần vật chất và năng lượng.', 'Trao đổi chất cung cấp vật chất, năng lượng hỗ trợ sinh trưởng và sinh sản.'],
    match: [['Trao đổi chất', 'Cung cấp vật chất và năng lượng'], ['Sinh trưởng', 'Giúp cơ thể đạt kích thước phù hợp'], ['Sinh sản', 'Tạo thế hệ mới']],
    fill: ['Trong cơ thể sinh vật, các quá trình sống có mối liên hệ [blank] với nhau.', 'chặt chẽ'],
    category: [['Hỗ trợ sinh sản ở cây trồng', 'Có thể cản trở sinh sản ở cây trồng'], [['Cung cấp nước phù hợp', 0], ['Bón phân hợp lí', 0], ['Ánh sáng phù hợp', 0], ['Thiếu nước kéo dài', 1], ['Dinh dưỡng quá thiếu', 1]]],
    drag: ['Cơ thể sinh vật hoạt động như một thể [blank].', ['thống nhất', 'tách rời', 'bất biến'], 'thống nhất'],
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
  releaseVersion: 'g7-st3-2026.1',
  grade: 7,
  stationId: 'g7_st3',
  title: 'Lớp 7 - Trạm 3: Cảm ứng, sinh trưởng và sinh sản',
  status: 'draft',
  notes: 'Nội dung soạn theo các Bài 33–42 của SGK KHTN 7 Kết nối tri thức; chờ duyệt nội dung và thử giao diện trước khi phát hành.',
  stages: stages.map((stage, index) => ({ dayIndex: index + 1, learningObjective: stage.objective, sourceRefs: source(stage.lesson), games: gamesFor(stage, index + 1) })),
};

fs.mkdirSync('content/stations/grade-07', { recursive: true });
fs.writeFileSync('content/stations/grade-07/station-03.json', `${JSON.stringify(replacePlaceholderStationHints(document), null, 2)}\n`);
console.log('Đã tạo content/stations/grade-07/station-03.json');
