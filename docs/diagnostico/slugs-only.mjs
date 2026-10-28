// docs/diagnostico/slugs-only.mjs
import { createClient } from '@supabase/supabase-js'
const url = Object.entries(process.env).find(([k]) => /SUPABASE.*URL/i.test(k))?.[1]
const key = Object.entries(process.env).find(([k]) =>
  /SUPABASE.*(ANON|PUBLISHABLE)/i.test(k) && !/SERVICE|SECRET/i.test(k))?.[1]
if (!url || !key) {
  console.error("Variáveis do Supabase não encontradas!")
  process.exit(1)
}
const sb = createClient(url, key)
// 1) Tenta filtrar por ativo; 2) se a coluna não existir, traz todos os slugs
let q = await sb.from('categories').select('slug').eq('active', true)
if (q.error) {
  console.error('aviso: coluna "active" indisponível ->', q.error.message)
  q = await sb.from('categories').select('slug')
}
if (q.error) {
  console.error('ERRO:', q.error.message)
  process.exit(1)
}
;(q.data ?? []).forEach(r => console.log(r.slug))
