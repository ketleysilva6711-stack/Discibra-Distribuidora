import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
// Corrigir o src do Image no mobileHero - banner.image_url pode ser null/undefined
c = c.replace('src={String(banner.image_url ?? "")}', 'src={banner.image_url}');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('String(banner.image_url ?? "") removido:', !c.includes('String(banner.image_url ?? "")'));
