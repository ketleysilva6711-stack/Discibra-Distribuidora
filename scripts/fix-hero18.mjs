import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
// Substituir src={String(banner.image_url ?? "")} por src={banner.image_url as string}
c = c.replace('src={String(banner.image_url ?? "")}', 'src={banner.image_url as string}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('banner.image_url as string:', c.includes('banner.image_url as string'));
console.log('String(banner.image_url ?? ""):', c.includes('String(banner.image_url ?? "")'));
