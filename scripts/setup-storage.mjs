import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas no .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const BUCKETS = [
  { id: "produtos", name: "produtos", public: true },
  { id: "banners", name: "banners", public: true },
  { id: "logos", name: "logos", public: true },
]

async function main() {
  console.log("📦 Inicializando buckets no Supabase Storage...")
  const { data: existing, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    console.error("❌ Falha ao listar buckets:", listErr.message)
    process.exit(1)
  }

  const existingNames = new Set((existing || []).map((b) => b.name))

  for (const b of BUCKETS) {
    if (existingNames.has(b.name)) {
      console.log(`ℹ️ Bucket "${b.name}" já existe.`)
    } else {
      const { error: createErr } = await supabase.storage.createBucket(b.id, {
        public: b.public,
        fileSizeLimit: 8 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      })
      if (createErr) {
        console.error(`❌ Erro ao criar bucket "${b.name}":`, createErr.message)
      } else {
        console.log(`✅ Bucket "${b.name}" criado com sucesso (público).`)
      }
    }
  }
  console.log("✨ Finalizado setup de Storage.")
}

main()

// ============================================================================
// VERIFICAÇÃO DE INTEGRIDADE
// ============================================================================

if (!url || !key) {
  console.error("❌ ERRO: .env.local sem credenciais do Supabase.")
  process.exit(1)
}

const verifySupabase = createClient(url, key, { auth: { persistSession: false } })

async function verify() {
  console.log("🔍 Verificando integridade do Supabase...")
  console.log(`🌐 URL: ${url}\n`)

  const tables = [
    "products",
    "categories",
    "subcategories",
    "banners",
    "orders",
    "reviews",
    "whatsapp_clicks",
    "site_settings",
  ]

  console.log("📊 Contagem de Registros:")
  for (const table of tables) {
    const { count, error } = await verifySupabase.from(table).select("*", { count: "exact", head: true })
    if (error) {
      console.log(`   - ${table.padEnd(16)}: ❌ Erro (${error.message})`)
    } else {
      console.log(`   - ${table.padEnd(16)}: ✅ ${count ?? 0} registros`)
    }
  }

  console.log("\n📦 Buckets no Storage:")
  const { data: buckets, error: bErr } = await verifySupabase.storage.listBuckets()
  if (bErr) {
    console.log(`   ❌ Erro ao listar: ${bErr.message}`)
  } else if (!buckets || buckets.length === 0) {
    console.log("   ⚠️ Nenhum bucket encontrado. Execute 'node scripts/setup-storage.mjs'.")
  } else {
    buckets.forEach((b) => {
      console.log(`   - ${b.name.padEnd(16)}: [Público: ${b.public ? "Sim" : "Não"}]`)
    })
  }
  console.log("\n✨ Verificação concluída.")
}

verify()
