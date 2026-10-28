import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

// Substituir o botão secundário
const oldSecBtn = 'className="block w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-[#002D5B] transition-colors"\n            >\n              Ver detalhes completos ��\'';
const newSecBtn = 'className="block w-full h-9 rounded-[var(--r)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium mt-1.5 transition-colors hover:bg-[var(--surface-alt)]"\n            >\n              Adicionar ao orçamento';
c = c.replace(oldSecBtn, newSecBtn);

fs.writeFileSync(p, c, 'utf8');
console.log('Adicionar ao orçamento presente:', c.includes('Adicionar ao orçamento'));
console.log('Ver detalhes completos restante:', c.includes('Ver detalhes completos'));
console.log('rounded-full restante:', c.includes('rounded-full'));
console.log('shadow-lg restante:', c.includes('shadow-lg'));
