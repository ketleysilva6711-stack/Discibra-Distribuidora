import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

// Encontrar a posição de "Ver detalhes completos"
const idx = c.indexOf('Ver detalhes completos');
if (idx === -1) {
  console.log('String "Ver detalhes completos" não encontrada!');
  process.exit(1);
}

// Encontrar o início da tag <Link que contém este texto
const linkStart = c.lastIndexOf('<Link', idx);
const linkEnd = c.indexOf('</Link>', idx) + '</Link>'.length;

console.log('Conteúdo da região do botão secundário:');
console.log(c.substring(linkStart, linkEnd));
console.log('---');
