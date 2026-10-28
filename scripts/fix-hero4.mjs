import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('<Image src={banner.image_url}', '<Image src={String(banner.image_url)}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('String(banner.image_url):', c.includes('String(banner.image_url)'));
