const fs = require('fs');
const path = require('path');

function restoreFile(filePath) {
  console.log(`Processing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Convert UTF-8 string to binary buffer (representing Latin1/Windows-1252 characters)
  const buf = Buffer.from(content, 'binary');
  
  // Re-decode the binary buffer as UTF-8
  const restored = buf.toString('utf8');
  
  fs.writeFileSync(filePath, restored, 'utf8');
  console.log(`Restored: ${filePath}`);
}

const files = [
  path.join(__dirname, '../src/pages/AdminPage.jsx'),
  path.join(__dirname, '../src/pages/AdminUsersPage.jsx')
];

files.forEach(restoreFile);
