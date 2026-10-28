import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/banner\.image_url/g, 'String(banner.image_url ?? "")');
c = c.replace(/href={banner\.link}/g, 'href={String(banner.link ?? "")}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('banner.image_url:', c.includes('banner.image_url'));
console.log('href={banner.link}:', c.includes('href={banner.link}'));
