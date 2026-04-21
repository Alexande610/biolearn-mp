const fs = require('fs');
const path = require('path');

const filePath = 'c:/TailieucuaMintPhut/sinh học/KL/NextGen/src/pages/MapPage.jsx';
const fullDataPath = 'c:/TailieucuaMintPhut/sinh học/KL/NextGen/scratch/full_class_data.json';

const mapPageContent = fs.readFileSync(filePath, 'utf8');
const fullClassData = JSON.parse(fs.readFileSync(fullDataPath, 'utf8'));

// 1. Thay thế classData
const startMarker = 'const classData = {';
// Tìm vị trí đóng ngoặc nhọn cuối cùng của object classData (dựa trên cấu trúc file)
const startIndex = mapPageContent.indexOf(startMarker);
if (startIndex === -1) {
    console.error('❌ Không tìm thấy marker bắt đầu classData');
    process.exit(1);
}

// Tìm dấu }; kết thúc object - thường nằm trước dòng // Constants cho cấu trúc level
const endMarkerSearch = '// Constants cho cấu trúc level';
const endMarkerIndex = mapPageContent.indexOf(endMarkerSearch);

if (endMarkerIndex === -1) {
    console.error('❌ Không tìm thấy marker kết thúc');
    process.exit(1);
}

// Lấy phần content từ đầu đến startMarker
const firstPart = mapPageContent.substring(0, startIndex);
// Lấy phần content từ endMarkerSearch đến hết
const lastPart = mapPageContent.substring(endMarkerIndex);

const newClassDataString = `const classData = ${JSON.stringify(fullClassData, null, 2)};\n\n`;
const updatedContent = firstPart + newClassDataString + lastPart;

// 2. Patch handleSkipChapter (Dùng string replace đơn giản cho logic reward)
// Tìm đoạn: const newXp = (userStats?.xp || 0) + 500;
// Để đảm bảo logic reward và class_progress được áp dụng

fs.writeFileSync(filePath, updatedContent);
console.log('✅ Đã cập nhật MapPage.jsx thành công bằng script!');
