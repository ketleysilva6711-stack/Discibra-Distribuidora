import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
const backtick = '`';
c = c.replace(
  'src={banner.image_url as string} alt={String(banner.title || ' + backtick + 'Banner ${i + 1}' + backtick + ')}',
  'src={String(banner.image_url ?? "")} alt={String(banner.title ?? ' + backtick + 'Banner ${i + 1}' + backtick + ')}'
);
fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('banner.image_url ?? "":', c.includes('banner.image_url ?? ""'));
console.log('banner.title ?? :', c.includes('banner.title ??'));
