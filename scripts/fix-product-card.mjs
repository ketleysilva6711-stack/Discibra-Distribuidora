import fs from 'fs';
const p = 'components/store/product-card.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Botão WhatsApp: mudar texto, classe, remover shadow
const oldWaBtn = 'className={cn(\n                "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#25D366]/20 transition-all hover:bg-[#1EBE5B] active:scale-95 whitespace-nowrap btn-whatsapp-track",\n              )}';
const newWaBtn = 'className={cn(\n                "flex h-10 w-full items-center justify-center gap-2 rounded-[var(--r)] bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold shadow-sm transition-all whitespace-nowrap btn-whatsapp-track",\n              )}';
c = c.replace(oldWaBtn, newWaBtn);

// Mudar texto "Cotar no WhatsApp" para "Falar no WhatsApp"
c = c.replace(/Cotar no WhatsApp/g, 'Falar no WhatsApp');

// 2. Botão secundário "Ver detalhes" -> "Adicionar ao orçamento" com estilo secundário
const oldSecBtn = '<Link\n              href={`/produto/${product.slug}`}\n              className="block w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-[#002D5B] transition-colors"\n            >\n              Ver detalhes completos →\n            </Link>';
const newSecBtn = '<Link\n              href={`/produto/${product.slug}`}\n              className="block w-full h-9 rounded-[var(--r)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium mt-1.5 transition-colors hover:bg-[var(--surface-alt)]"\n            >\n              Adicionar ao orçamento\n            </Link>';
c = c.replace(oldSecBtn, newSecBtn);

fs.writeFileSync(p, c, 'utf8');
console.log('Feito.');
console.log('Cotar no WhatsApp restante:', c.includes('Cotar no WhatsApp'));
console.log('Adicionar ao orçamento presente:', c.includes('Adicionar ao orçamento'));
console.log('rounded-full restante:', c.includes('rounded-full'));
console.log('shadow-lg restante:', c.includes('shadow-lg'));
