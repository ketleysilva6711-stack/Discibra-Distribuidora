import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');

// Adicionar import de parseBannerImages
c = c.replace('import { waLink } from "@/lib/site-config"', 'import { parseBannerImages } from "@/lib/site-settings"\nimport { waLink } from "@/lib/site-config"');

// Corrigir Image src
c = c.replace('<Image src={String(banner.image_url ?? "")}', '<Image src={String(banner.image_url ?? "")}');

// Corrigir Link href
c = c.replace('<a key={banner.key} href={banner.link}', '<a key={banner.key} href={String(banner.link ?? "")}');

fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('parseBannerImages importado:', c.includes('parseBannerImages'));
console.log('String(banner.image_url ?? ""):', c.includes('String(banner.image_url ?? "")'));
console.log('String(banner.link ?? ""):', c.includes('String(banner.link ?? "")'));
