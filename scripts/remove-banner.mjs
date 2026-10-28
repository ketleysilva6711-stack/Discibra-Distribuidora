import fs from 'fs';
const p = 'app/(store)/page.tsx';
let c = fs.readFileSync(p, 'utf8');
// Remover a linha com <ResponsivePromoBanner /> incluindo a quebra de linha anterior
// Encontrar a linha exata
const lines = c.split('\n');
const newLines = lines.filter(l => !l.includes('<ResponsivePromoBanner />'));
const newC = newLines.join('\n');
fs.writeFileSync(p, newC, 'utf8');
console.log('Uso restante:', newC.includes('<ResponsivePromoBanner />'));
console.log('Linhas antes:', lines.length, 'depois:', newLines.length);
