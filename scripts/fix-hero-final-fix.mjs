import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
// Substituir banner.image_url por banner.image_url!
c = c.replace(/banner\.image_url/g, 'banner.image_url!');
// Substituir banner.link por banner.link!
c = c.replace(/banner\.link/g, 'banner.link!');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('banner.image_url!:', c.includes('banner.image_url!'));
console.log('banner.link!: ', c.includes('banner.link!'));
