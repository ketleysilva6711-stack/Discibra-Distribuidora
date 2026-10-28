import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('const CAMPAIGN_BANNERS: Slide[] = [', 'const CAMPAIGN_BANNERS: any[] = [');
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('CAMPAIGN_BANNERS: any[]:', c.includes('const CAMPAIGN_BANNERS: any[] = ['));
