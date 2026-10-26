import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { readFileSync } from "fs"

dotenv.config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("❌ Credenciais ausentes no .env.local")
  process.exit(1)
}

const sql = readFileSync("scripts/011_quotations_schema.sql", "utf-8")
const supabase = createClient(url, key, { auth: { persistSession: false } })

const { error } = await supabase.rpc("exec_sql", { sql }).catch(() => ({ error: { message: "RPC não disponível" } }))

if (error) {
  console.log("ℹ️ Aplique o arquivo scripts/011_quotations_schema.sql manualmente no Supabase SQL Editor.")
  console.log("   Acesse: https://supabase.com/dashboard/project/_/sql")
} else {
  console.log("✅ Schema de orçamentos criado com sucesso!")
}
