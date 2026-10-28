import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');

// Substituir caracteres problemáticos
// �Y"? -> ícone de estrela/alerta (vamos usar um texto simples)
// �� -> vazio ou espaço
c = c.replace(/�Y"\?/g, '★');
c = c.replace(/�{2,}/g, '');

fs.writeFileSync(p, c, 'utf8');
console.log('Correção feita. Caracteres � restantes:', (c.match(/�/g) || []).length);
