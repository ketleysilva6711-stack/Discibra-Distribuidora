import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
// Substituir caracteres especiais
c = c.replace(/•/g, '-');           // U+2022
c = c.replace(/★/g, '*');           // U+2605
c = c.replace(/ê/g, 'e');           // U+00EA
fs.writeFileSync(p, c, 'utf8');
console.log('Caracteres nao-ASCII restantes:', (c.match(/[^\x00-\x7F]/g) || []).length);
