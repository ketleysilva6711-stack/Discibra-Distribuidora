import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminServerConfigured } from "@/lib/supabase/admin"

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "PED-"
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

type CartItem = {
  id: string
  name: string
  price: number
  unit: string
  qty: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, email } = body as { items: CartItem[]; email?: string }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 })
    }

    // Recalcular total no servidor (nunca confiar no valor do client)
    const total = items.reduce((sum, i) => {
      const price = Number(i.price)
      const qty = Math.max(1, Math.floor(Number(i.qty)))
      if (!isFinite(price) || price <= 0) return sum
      return sum + price * qty
    }, 0)

    if (total <= 0) {
      return NextResponse.json({ error: "Total inválido." }, { status: 400 })
    }

    const itemsSummary = items
      .map((i) => `- ${i.name} (x${i.qty}) — R$ ${(Number(i.price) * i.qty).toFixed(2)}`)
      .join("\n")

    const code = generateOrderCode()
    const now = new Date().toISOString()

    // Fallback resiliente: se a service role não estiver configurada,
    // ainda assim retornamos o código gerado localmente para o fluxo WhatsApp.
    if (!isAdminServerConfigured()) {
      console.warn("[orders] SUPABASE_SERVICE_ROLE_KEY não configurada — salvando apenas localmente")
      return NextResponse.json({ ok: true, code, total, warning: "service_role_not_configured" })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from("orders").insert({
      id: crypto.randomUUID(),
      code,
      email: email?.trim() || null,
      status: "received",
      total,
      items,
      items_summary: itemsSummary,
      created_at: now,
      updated_at: now,
    })

    if (error) {
      console.error("orders insert error:", error)
      return NextResponse.json({ error: "Falha ao salvar pedido." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, code, total })
  } catch (err) {
    console.error("orders route error:", err)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")?.trim().toUpperCase()
    const email = searchParams.get("email")?.trim().toLowerCase()

    if (!code && !email) {
      return NextResponse.json(
        { error: "Informe código ou e-mail para consulta." },
        { status: 400 }
      )
    }

    if (!isAdminServerConfigured()) {
      return NextResponse.json(
        { error: "Serviço de consulta temporariamente indisponível." },
        { status: 503 }
      )
    }

    const supabase = createAdminClient()
    let query = supabase
      .from("orders")
      .select("id, code, email, status, total, items_summary, created_at, updated_at")

    if (code) {
      query = query.eq("code", code)
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 })
      return NextResponse.json({ order: data })
    }

    if (email) {
      query = query.eq("email", email).order("created_at", { ascending: false }).limit(20)
      const { data, error } = await query
      if (error) throw error
      return NextResponse.json({ orders: data || [] })
    }
  } catch (err) {
    console.error("[orders GET error]:", err)
    return NextResponse.json(
      { error: "Erro interno ao consultar pedido." },
      { status: 500 }
    )
  }
}
