const fs = require('fs');
const filePath = 'c:/TailieucuaMintPhut/sinh học/KL/NextGen/src/pages/MapPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Thay xu -> coins
content = content.replace(/newXu/g, 'newCoins');
content = content.replace(/userStats\?\.xu/g, 'userStats?.coins');
content = content.replace(/xu: newCoins/g, 'coins: newCoins');

fs.writeFileSync(filePath, content);
console.log('✅ Đã patch MapPage.jsx thành công!');
