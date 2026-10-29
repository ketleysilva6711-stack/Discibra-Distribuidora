const fs = require('fs');
const c = fs.readFileSync('app/admin/(dashboard)/orcamentos/page.tsx', 'utf8');
const lines = c.split('\n');
let braceStack = [];
let parenStack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let stringChar = null;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inString) {
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '{') braceStack.push({line: i+1, col: j+1});
    else if (ch === '}') { if (braceStack.length > 0) braceStack.pop(); else console.log('Extra } at line', i+1); }
    else if (ch === '(') parenStack.push({line: i+1, col: j+1});
    else if (ch === ')') { if (parenStack.length > 0) parenStack.pop(); else console.log('Extra ) at line', i+1); }
  }
}
console.log('Remaining braces:', braceStack.length);
braceStack.forEach(b => console.log('  Unclosed { at line', b.line, 'col', b.col));
console.log('Remaining parens:', parenStack.length);
parenStack.forEach(b => console.log('  Unclosed ( at line', b.line, 'col', b.col));