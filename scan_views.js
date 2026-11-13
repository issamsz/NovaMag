const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/HP/Desktop/nova mag/frontend/src/components/views';
fs.readdirSync(dir).forEach(file => {
  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  const arMatches = (code.match(/language === ['"]ar['"]/g) || []).length;
  const tMatches = (code.match(/t\(/g) || []).length;
  console.log(file.padEnd(25) + ' | language === ar: ' + String(arMatches).padStart(3) + ' | t(): ' + String(tMatches).padStart(3));
});
