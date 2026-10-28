import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('href={banner.link}', 'href={String(banner.link ?? "")}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('String(banner.link ?? ""):', c.includes('String(banner.link ?? "")'));
