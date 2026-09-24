import fs from 'node:fs';
import { replacePlaceholderStationHints } from '../src/utils/stationHints.js';

const book = (pages, lesson) => [{
  source: 'SGK Khoa học tự nhiên 6 - Kết nối tri thức với cuộc sống',
  publisher: 'Nhà xuất bản Giáo dục Việt Nam',
  lesson,
  pages,
}];

const stages = [
  {
    dayIndex: 1,
    objective: 'Nhận biết bộ phận chính và thực hiện đúng trình tự sử dụng kính hiển vi quang học.',
    source: book('17-18', 'Bài 4. Sử dụng kính hiển vi quang học'),
    quiz: ['Khi bắt đầu quan sát, nên chọn vật kính nào?', ['Vật kính có độ phóng đại nhỏ nhất', 'Vật kính có độ phóng đại lớn nhất', 'Vật kính bất kì', 'Không cần vật kính'], 0, 'Bắt đầu với trường quan sát rộng.', 'Vật kính nhỏ giúp tìm mẫu dễ hơn trước khi tăng độ phóng đại.'],
    match: [['Thị kính', 'Nơi đặt mắt để quan sát'], ['Vật kính', 'Phóng đại ảnh của vật'], ['Ốc điều chỉnh', 'Điều chỉnh khoảng cách để ảnh rõ']],
    fill: ['Kính hiển vi quang học giúp quan sát những vật có kích thước [blank] mà mắt thường khó thấy.', 'nhỏ bé'],
    category: [['Bộ phận quang học', 'Bộ phận cơ học'], [['Thị kính', 0], ['Vật kính', 0], ['Bàn kính', 1], ['Ốc điều chỉnh', 1]]],
    drag: ['Sau khi đặt tiêu bản, cần điều chỉnh [blank] để ảnh quan sát rõ nét.', ['ốc điều chỉnh', 'chân kính', 'kẹp tiêu bản'], 'ốc điều chỉnh'],
  },
  {
    dayIndex: 2,
    objective: 'Nêu được khái niệm tế bào và nhận biết sự đa dạng về hình dạng, kích thước của tế bào.',
    source: book('76-78', 'Bài 1. Tế bào - Đơn vị cơ bản của sự sống'),
    quiz: ['Đơn vị cấu trúc và chức năng cơ bản của cơ thể sống là gì?', ['Tế bào', 'Mô', 'Cơ quan', 'Hệ cơ quan'], 0, 'Đây là đơn vị nhỏ nhất có thể thực hiện các hoạt động sống.', 'Tế bào là đơn vị cấu trúc và chức năng cơ bản của cơ thể sống.'],
    match: [['Tế bào da người', 'Dẹt và xếp sát nhau'], ['Tế bào thần kinh', 'Có phần kéo dài'], ['Tế bào thịt lá', 'Có dạng gần hình hộp']],
    fill: ['Các tế bào khác nhau có hình dạng và kích thước [blank].', 'khác nhau'],
    category: [['Có thể quan sát bằng mắt thường', 'Cần dụng cụ phóng đại'], [['Tế bào trứng đà điểu', 0], ['Tế bào trứng cá', 0], ['Tế bào vi khuẩn', 1], ['Tế bào biểu bì hành', 1]]],
    drag: ['Hầu hết tế bào có kích thước rất nhỏ và được quan sát bằng [blank].', ['kính hiển vi', 'nhiệt kế', 'ống đong'], 'kính hiển vi'],
  },
  {
    dayIndex: 3,
    objective: 'Mô tả được ba thành phần chính của tế bào và chức năng khái quát của chúng.',
    source: book('79-81', 'Bài 2. Cấu tạo và chức năng các thành phần của tế bào'),
    quiz: ['Thành phần nào kiểm soát các chất đi vào và đi ra khỏi tế bào?', ['Màng tế bào', 'Tế bào chất', 'Nhân', 'Lục lạp'], 0, 'Đây là lớp bao quanh tế bào.', 'Màng tế bào bao bọc và kiểm soát sự trao đổi chất của tế bào.'],
    match: [['Màng tế bào', 'Bao bọc và kiểm soát trao đổi chất'], ['Tế bào chất', 'Nơi diễn ra phần lớn hoạt động sống'], ['Nhân hoặc vùng nhân', 'Chứa vật chất di truyền']],
    fill: ['Phần lớn hoạt động sống của tế bào diễn ra trong [blank].', 'tế bào chất'],
    category: [['Có ở mọi tế bào', 'Chỉ có ở một số loại tế bào'], [['Màng tế bào', 0], ['Tế bào chất', 0], ['Vật chất di truyền', 0], ['Lục lạp', 1]]],
    drag: ['Thông tin di truyền của tế bào nằm trong nhân hoặc [blank].', ['vùng nhân', 'thành tế bào', 'không bào'], 'vùng nhân'],
  },
  {
    dayIndex: 4,
    objective: 'Phân biệt tế bào nhân sơ và tế bào nhân thực dựa vào cấu tạo nhân.',
    source: book('79-82', 'Bài 2. Cấu tạo và chức năng các thành phần của tế bào'),
    quiz: ['Đặc điểm nổi bật của tế bào nhân sơ là gì?', ['Chưa có nhân hoàn chỉnh', 'Có lục lạp', 'Có không bào lớn', 'Luôn có nhiều nhân'], 0, 'Vật chất di truyền chưa được màng nhân bao bọc.', 'Tế bào nhân sơ chưa có nhân hoàn chỉnh; vật chất di truyền nằm ở vùng nhân.'],
    match: [['Tế bào vi khuẩn', 'Nhân sơ, chưa có nhân hoàn chỉnh'], ['Tế bào động vật', 'Nhân thực, không có thành tế bào'], ['Tế bào thực vật', 'Nhân thực, có thành tế bào']],
    fill: ['Tế bào có nhân được màng nhân bao bọc gọi là tế bào [blank].', 'nhân thực'],
    category: [['Nhân sơ', 'Nhân thực'], [['Vi khuẩn lactic', 0], ['Vi khuẩn E. coli', 0], ['Tế bào nấm men', 1], ['Tế bào lá cây', 1]]],
    drag: ['Ở tế bào nhân sơ, vật chất di truyền tập trung tại [blank].', ['vùng nhân', 'lục lạp', 'không bào'], 'vùng nhân'],
  },
  {
    dayIndex: 5,
    objective: 'So sánh được các thành phần đặc trưng của tế bào thực vật và tế bào động vật.',
    source: book('80-82', 'Bài 2. Cấu tạo và chức năng các thành phần của tế bào'),
    quiz: ['Bào quan nào giúp tế bào thực vật thực hiện quang hợp?', ['Lục lạp', 'Nhân', 'Không bào', 'Màng tế bào'], 0, 'Bào quan này chứa diệp lục.', 'Lục lạp chứa diệp lục và là nơi diễn ra quang hợp.'],
    match: [['Thành tế bào', 'Giữ hình dạng và bảo vệ tế bào thực vật'], ['Lục lạp', 'Thực hiện quang hợp'], ['Không bào', 'Chứa dịch tế bào']],
    fill: ['Tế bào thực vật có [blank] ở phía ngoài màng tế bào.', 'thành tế bào'],
    category: [['Có ở tế bào thực vật nhưng không có ở tế bào động vật', 'Có ở cả tế bào thực vật và động vật'], [['Lục lạp', 0], ['Thành tế bào', 0], ['Màng tế bào', 1], ['Tế bào chất', 1], ['Nhân', 1]]],
    drag: ['Sắc tố diệp lục tập trung trong [blank] của tế bào thực vật.', ['lục lạp', 'nhân', 'màng tế bào'], 'lục lạp'],
  },
  {
    dayIndex: 6,
    objective: 'Giải thích được tế bào lớn lên nhờ tăng kích thước và tổng hợp thêm chất tế bào.',
    source: book('83-84', 'Bài 3. Sự lớn lên và sinh sản của tế bào'),
    quiz: ['Trong quá trình lớn lên, tế bào thay đổi chủ yếu như thế nào?', ['Tăng kích thước và khối lượng', 'Mất toàn bộ tế bào chất', 'Luôn đổi thành loại tế bào khác', 'Không trao đổi chất'], 0, 'Tế bào thu nhận và tổng hợp vật chất.', 'Tế bào lớn lên nhờ tăng kích thước và khối lượng.'],
    match: [['Tế bào non', 'Kích thước còn nhỏ'], ['Tế bào trưởng thành', 'Đạt kích thước nhất định'], ['Trao đổi chất', 'Cung cấp vật chất cho tế bào lớn lên']],
    fill: ['Tế bào non lớn dần thành tế bào [blank].', 'trưởng thành'],
    category: [['Biểu hiện của tế bào lớn lên', 'Không phải biểu hiện của tế bào lớn lên'], [['Tăng kích thước', 0], ['Tăng khối lượng', 0], ['Tổng hợp thêm chất', 0], ['Mất vật chất di truyền', 1]]],
    drag: ['Tế bào lớn lên đến một kích thước nhất định rồi có thể tiến hành [blank].', ['phân chia', 'bay hơi', 'nảy mầm'], 'phân chia'],
  },
  {
    dayIndex: 7,
    objective: 'Mô tả được kết quả của sự phân chia tế bào và liên hệ với sự lớn lên của cơ thể.',
    source: book('84-85', 'Bài 3. Sự lớn lên và sinh sản của tế bào'),
    quiz: ['Một tế bào phân chia một lần thường tạo ra bao nhiêu tế bào con?', ['Hai', 'Một', 'Ba', 'Bốn'], 0, 'Số tế bào tăng gấp đôi.', 'Một tế bào mẹ phân chia tạo thành hai tế bào con.'],
    match: [['1 lần phân chia', '2 tế bào con'], ['2 lần phân chia liên tiếp', '4 tế bào con'], ['3 lần phân chia liên tiếp', '8 tế bào con']],
    fill: ['Sự lớn lên và phân chia của tế bào là cơ sở cho sự [blank] của cơ thể.', 'lớn lên'],
    category: [['Vai trò của phân chia tế bào', 'Không phải vai trò của phân chia tế bào'], [['Tăng số lượng tế bào', 0], ['Thay thế tế bào già', 0], ['Làm lành vết thương', 0], ['Làm mọi tế bào mất nhân', 1]]],
    drag: ['Các tế bào mới sinh ra tiếp tục lớn lên và [blank].', ['phân chia', 'biến mất', 'ngừng trao đổi chất'], 'phân chia'],
  },
  {
    dayIndex: 8,
    objective: 'Chuẩn bị được tiêu bản đơn giản và nhận biết tế bào biểu bì hành dưới kính hiển vi.',
    source: book('86-87', 'Bài 4. Thực hành: Quan sát và phân biệt một số loại tế bào'),
    quiz: ['Mẫu biểu bì hành dùng để quan sát nên được lấy như thế nào?', ['Một lớp thật mỏng', 'Một miếng củ thật dày', 'Cả củ hành', 'Phần rễ còn đất'], 0, 'Ánh sáng cần đi qua mẫu.', 'Lớp biểu bì mỏng giúp ánh sáng truyền qua và các tế bào không chồng lấp quá nhiều.'],
    match: [['Lam kính', 'Đặt mẫu quan sát'], ['Lamen', 'Đậy lên mẫu'], ['Ống nhỏ giọt', 'Nhỏ nước hoặc dung dịch lên mẫu']],
    fill: ['Khi đậy lamen cần thao tác nhẹ để hạn chế tạo [blank] khí.', 'bọt'],
    category: [['Dụng cụ làm tiêu bản', 'Thiết bị quan sát'], [['Lam kính', 0], ['Lamen', 0], ['Ống nhỏ giọt', 0], ['Kính hiển vi', 1]]],
    drag: ['Tiêu bản biểu bì hành cần được đặt trên [blank] trước khi đậy lamen.', ['lam kính', 'thị kính', 'vật kính'], 'lam kính'],
  },
  {
    dayIndex: 9,
    objective: 'Vận dụng mối liên hệ giữa cấu tạo và chức năng để nhận dạng một số tế bào.',
    source: book('76-82', 'Bài 1-2. Tế bào và cấu tạo tế bào'),
    quiz: ['Tế bào thần kinh có phần kéo dài chủ yếu để làm gì?', ['Truyền tín hiệu', 'Quang hợp', 'Tạo thành tế bào vi khuẩn', 'Chứa dịch tế bào'], 0, 'Hình dạng phù hợp với việc liên lạc trong cơ thể.', 'Các phần kéo dài giúp tế bào thần kinh tiếp nhận và truyền tín hiệu.'],
    match: [['Tế bào lông hút', 'Hấp thụ nước và muối khoáng'], ['Tế bào cơ', 'Co dãn tạo vận động'], ['Tế bào thần kinh', 'Tiếp nhận và truyền tín hiệu']],
    fill: ['Hình dạng của tế bào thường phù hợp với [blank] mà tế bào đảm nhiệm.', 'chức năng'],
    category: [['Tế bào thực vật', 'Tế bào động vật'], [['Tế bào lông hút', 0], ['Tế bào thịt lá', 0], ['Tế bào cơ', 1], ['Tế bào thần kinh', 1]]],
    drag: ['Tế bào lông hút có phần kéo dài giúp tăng diện tích [blank] nước và muối khoáng.', ['hấp thụ', 'quang hợp', 'phân chia'], 'hấp thụ'],
  },
  {
    dayIndex: 10,
    objective: 'Hệ thống hoá kiến thức về kính hiển vi, cấu tạo, sự lớn lên và phân chia của tế bào.',
    source: book('76-87', 'Bài 1-4. Tế bào'),
    quiz: ['Nhận định nào đúng về tế bào?', ['Tế bào là đơn vị cơ bản của cơ thể sống', 'Mọi tế bào đều nhìn thấy bằng mắt thường', 'Mọi tế bào đều có lục lạp', 'Tế bào không thể lớn lên'], 0, 'Chọn nhận định áp dụng rộng rãi cho cơ thể sống.', 'Tế bào là đơn vị cấu trúc và chức năng cơ bản của cơ thể sống.'],
    match: [['Kính hiển vi', 'Quan sát tế bào rất nhỏ'], ['Màng tế bào', 'Kiểm soát trao đổi chất'], ['Phân chia tế bào', 'Làm tăng số lượng tế bào']],
    fill: ['Tế bào thực vật và tế bào động vật đều có màng tế bào, tế bào chất và [blank].', 'nhân'],
    category: [['Đúng với tế bào thực vật', 'Đúng với tế bào vi khuẩn'], [['Có không bào lớn ở tế bào trưởng thành', 0], ['Có thể có lục lạp', 0], ['Thuộc kiểu tế bào nhân sơ', 1], ['Chưa có nhân hoàn chỉnh', 1]]],
    drag: ['Sự lớn lên và [blank] của tế bào giúp cơ thể sinh trưởng.', ['phân chia', 'bay hơi', 'hoà tan'], 'phân chia'],
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
  releaseVersion: 'g6-st1-2026.1',
  grade: 6,
  stationId: 'g6_st1',
  title: 'Lớp 6 - Trạm 1: Kính hiển vi và tế bào',
  status: 'draft',
  notes: 'Bản thí điểm. Nội dung được đối chiếu theo SGK KHTN 6 Kết nối tri thức; TXT OCR chỉ dùng để tìm kiếm, không dùng làm nguồn xác nhận cuối.',
  stages: stages.map((stage) => ({
    dayIndex: stage.dayIndex,
    learningObjective: stage.objective,
    sourceRefs: stage.source,
    games: gamesFor(stage),
  })),
};

fs.mkdirSync('content/stations/grade-06', { recursive: true });
fs.writeFileSync('content/stations/grade-06/station-01.json', `${JSON.stringify(replacePlaceholderStationHints(document), null, 2)}\n`);
console.log('Đã tạo content/stations/grade-06/station-01.json');
