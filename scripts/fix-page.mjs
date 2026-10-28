import fs from 'fs';
const p = 'app/(store)/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// Remover import ResponsivePromoBanner
c = c.replace('import { HeroBanner } from "@/components/store/hero-banner"\nimport ResponsivePromoBanner from "@/components/store/responsive-promo-banner"\nimport CategoriesCarousel from "@/components/store/categories-carousel"', 'import { HeroBanner } from "@/components/store/hero-banner"\nimport CategoriesCarousel from "@/components/store/categories-carousel"');

// Remover a seção ResponsivePromoBanner
c = c.replace('\n      {/* OFERTAS PROMOCIONAIS RESPONSIVAS (mobile vs desktop) */}\n      <ResponsivePromoBanner />\n', '\n');

fs.writeFileSync(p, c, 'utf8');
console.log('Feito!');
console.log('Tem ResponsivePromoBanner:', c.includes('ResponsivePromoBanner'));
