import fs from 'fs';
const p = 'app/(store)/page.tsx';
let c = fs.readFileSync(p, 'utf8');
// Remover qualquer linha que contenha ResponsivePromoBanner como JSX tag
c = c.replace(/^\s*<ResponsivePromoBanner \/>\n?/gm, '');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('Tem ResponsivePromoBanner:', c.includes('ResponsivePromoBanner'));
