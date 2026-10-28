import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('<Image src={banner.image_url}', '<Image src={banner.image_url as string}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('banner.image_url as string:', c.includes('banner.image_url as string'));
