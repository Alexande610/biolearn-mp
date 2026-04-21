const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('c:/TailieucuaMintPhut/sinh học/KL/NextGen/src/pages/LeaderboardPage.jsx', 'utf8');

try {
  acorn.Parser.extend(jsx()).parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020
  });
  console.log('✅ Syntax is correct!');
} catch (err) {
  console.error('❌ Syntax Error:', err.message);
  process.exit(1);
}
