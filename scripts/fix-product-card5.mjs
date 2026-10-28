import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

const oldSecBtn = '<Link\n              href={`/produto/${product.slug}`}\n              className="block w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-[#002D5B] transition-colors"\n            >\n              Ver detalhes completos →\n            </Link>';

const newSecBtn = '<Link\n              href={`/produto/${product.slug}`}\n              className="block w-full h-9 rounded-[var(--r)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium mt-1.5 transition-colors hover:bg-[var(--surface-alt)]"\n            >\n              Adicionar ao orçamento\n            </Link>';

const replaced = c.replace(oldSecBtn, newSecBtn);

if (replaced === c) {
  console.log('ERRO: substituição não funcionou - padrão não encontrado');
} else {
  fs.writeFileSync(p, replaced, 'utf8');
  console.log('Sucesso!');
  console.log('Adicionar ao orçamento presente:', replaced.includes('Adicionar ao orçamento'));
  console.log('Ver detalhes completos restante:', replaced.includes('Ver detalhes completos'));
  console.log('rounded-full restante:', replaced.includes('rounded-full'));
  console.log('shadow-lg restante:', replaced.includes('shadow-lg'));
}
