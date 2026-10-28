import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('alt={banner.title || `Banner ${i + 1}`}', 'alt={String(banner.title || `Banner ${i + 1}`)}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('String(banner.title):', c.includes('String(banner.title'));
