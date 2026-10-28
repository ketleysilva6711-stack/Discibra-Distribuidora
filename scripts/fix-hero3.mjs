import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Corrigir import
c = c.replace('import { parseBannerImages, type CmsBannerSlide } from "@/lib/site-settings"', 'import { parseBannerImages } from "@/lib/site-settings"');

// 2. Corrigir tipo do parsed
c = c.replace('const parsed: CmsBannerSlide[] = parseBannerImages(data.banner_images)', 'const parsed: any[] = parseBannerImages(data.banner_images)');

// 3. Corrigir Image src
c = c.replace('<Image src={slide.image_url.trim()}', '<Image src={String(slide.image_url)}');

// 4. Corrigir Link href
c = c.replace('<Link href={banner.link}', '<Link href={String(banner.link)}');

fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('CmsBannerSlide restante:', c.includes('CmsBannerSlide'));
console.log('parsed tipo:', c.includes('const parsed: any[]'));
console.log('String(image_url):', c.includes('String(slide.image_url)'));
console.log('String(banner.link):', c.includes('String(banner.link)'));
