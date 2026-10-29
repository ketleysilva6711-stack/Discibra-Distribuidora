const fs = require('fs');
const c = fs.readFileSync('app/admin/(dashboard)/orcamentos/page.tsx', 'utf8');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineDoubleQuotes = (line.match(/"/g) || []).length;
  if (lineDoubleQuotes % 2 !== 0) {
    console.log('Line ' + (i+1) + ': Odd number of double quotes: ' + lineDoubleQuotes);
    console.log('  Content:', line.substring(0, 120));
  }
}
console.log('Done checking quotes');