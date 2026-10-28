import fs from 'fs';
const p = 'components/store/product-card.tsx';
const c = fs.readFileSync(p, 'utf8');
// Encontrar a região do botão secundário
const idx = c.indexOf('Ver detalhes completos');
const start = c.lastIndexOf('<Link', idx);
const end = c.indexOf('</Link>', idx) + '</Link>'.length;
const region = c.substring(start, end);
// Mostrar caracteres especiais como códigos
console.log('Conteúdo da região (com códigos de caractere especiais):');
for (let i = 0; i < region.length; i++) {
  const ch = region[i];
  if (ch.charCodeAt(0) > 127 || ch === '\r' || ch === '\n' || ch === '\t') {
    console.log(`  pos ${i}: U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')} ${JSON.stringify(ch)}`);
  } else {
    console.log(`  pos ${i}: ${JSON.stringify(ch)}`);
  }
}
