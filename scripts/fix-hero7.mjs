import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('src={banner.image_url || ""}', 'src={banner.image_url as string}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('as string:', c.includes('banner.image_url as string'));
