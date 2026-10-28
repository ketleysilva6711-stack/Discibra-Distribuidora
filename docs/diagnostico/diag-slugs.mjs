// docs/diagnostico/diag-slugs.mjs
// Script de probing e consulta direta às tabelas do Supabase (FASE 0.5 - read-only)
import { createClient } from '@supabase/supabase-js'

const url = Object.entries(process.env)
  .find(([k]) => /SUPABASE.*URL/i.test(k))?.[1]
const key = Object.entries(process.env)
  .find(([k]) => /SUPABASE.*(ANON|PUBLISHABLE)/i.test(k) && !/SERVICE|SECRET/i.test(k))?.[1]

if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase (URL ou chave pública) não encontradas!")
  process.exit(1)
}

const sb = createClient(url, key)

for (const t of ['categories', 'categorias', 'categoria', 'products', 'produtos']) {
  const probe = await sb.from(t).select('*').limit(1)
  if (probe.error) {
    console.log('==', t, 'ERRO:', probe.error.message)
    continue
  }
  const cols = probe.data?.[0] ? Object.keys(probe.data[0]) : []
  console.log('==', t, 'OK | colunas:', cols.join(', '))

  const full = await sb.from(t).select('*').limit(300)
  if (full.data && full.data.length > 0) {
    console.log(`== ${t}: ${full.data.length} registros`)
    console.table(full.data.slice(0, 15)) // amostra para não inundar o relatório
  } else {
    console.log(`== ${t}: Retornou 0 registros (atenção: pode ser RLS bloqueando a anon key).`)
  }
}
