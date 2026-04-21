const fs = require('fs');
const content = fs.readFileSync('c:/TailieucuaMintPhut/sinh học/KL/NextGen/src/pages/MapPage.jsx', 'utf8');
const lines = content.split('\n');
console.log('Line 40:', JSON.stringify(lines[39]));
console.log('Line 41:', JSON.stringify(lines[40]));
console.log('Line 42:', JSON.stringify(lines[41]));
