import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Substituir apenas o texto do botão secundário
c = c.replace('Ver detalhes completos →', 'Adicionar ao orçamento');

// 2. Substituir a className do botão secundário (o trecho específico)
c = c.replace(
  'className="block w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-[#002D5B] transition-colors"',
  'className="block w-full h-9 rounded-[var(--r)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium mt-1.5 transition-colors hover:bg-[var(--surface-alt)]"'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Sucesso!');
console.log('Adicionar ao orçamento:', c.includes('Adicionar ao orçamento'));
console.log('Ver detalhes completos:', c.includes('Ver detalhes completos'));
console.log('rounded-[var(--r)] presente:', c.includes('rounded-[var(--r)]'));
console.log('border-[var(--line)] presente:', c.includes('border-[var(--line)]'));
