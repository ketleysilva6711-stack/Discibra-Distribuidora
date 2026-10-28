import fs from 'fs';

const alias = fs.readFileSync('docs/auditoria/local-alias.html', 'utf8');
const prod = fs.readFileSync('docs/auditoria/local-produtos.html', 'utf8');
const cat = fs.readFileSync('docs/auditoria/local-categoria.html', 'utf8');

// Canonical no alias
const canonMatch = alias.match(/<link[^>]*rel=[\"']canonical[\"'][^>]*>/);
console.log('CANONICAL no alias:', canonMatch ? canonMatch[0].substring(0,200) : 'NAO ENCONTRADO');

// Carregando no produtos (contexto)
const carregandoMatches = [...prod.matchAll(/Carregando/g)];
console.log('Carregando count produtos:', carregandoMatches.length);
carregandoMatches.forEach((m,i) => {
  const ctx = prod.substring(Math.max(0,m.index-60), m.index+60);
  console.log('  ctx'+i+':', JSON.stringify(ctx));
});

// Cards com tracking
console.log('btn-whatsapp-track produtos:', (prod.match(/btn-whatsapp-track/g)||[]).length);
console.log('btn-whatsapp-track categoria:', (cat.match(/btn-whatsapp-track/g)||[]).length);
console.log('data-track=btn_whatsapp produtos:', (prod.match(/data-track="btn_whatsapp"/g)||[]).length);
console.log('data-track=btn_whatsapp categoria:', (cat.match(/data-track="btn_whatsapp"/g)||[]).length);

// Paginacao na categoria
console.log('?page= categoria:', (cat.match(/\?page=/g)||[]).length);
