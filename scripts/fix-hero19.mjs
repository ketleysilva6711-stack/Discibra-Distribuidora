import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
// Substituir String(banner.image_url ?? "") por banner.image_url!
c = c.replace(/String\(banner\.image_url \?\? ""\)/g, 'banner.image_url');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('String(banner.image_url ?? ""):', c.includes('String(banner.image_url ?? "")'));
console.log('banner.image_url:', c.includes('banner.image_url'));
