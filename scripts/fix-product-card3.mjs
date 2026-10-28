import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

// Buscar o padrão do botão secundário antigo
const backtick = '`';
const oldSecBtn = 'href={' + backtick + '/produto/${product.slug}' + backtick + '}\n              className="block w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-[#002D5B] transition-colors"\n            >\n              Ver detalhes completos .\n            </Link>';
const regex = new RegExp(oldSecBtn.replace('.', '\\.'));

const newSecBtn = '<Link\n              href={' + backtick + '/produto/${product.slug}' + backtick + '}\n              className="block w-full h-9 rounded-[var(--r)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium mt-1.5 transition-colors hover:bg-[var(--surface-alt)]"\n            >\n              Adicionar ao orçamento\n            </Link>';

c = c.replace(regex, newSecBtn);

fs.writeFileSync(p, c, 'utf8');
console.log('Adicionar ao orçamento presente:', c.includes('Adicionar ao orçamento'));
console.log('Ver detalhes completos restante:', c.includes('Ver detalhes completos'));
