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

// ── Regras B2B de desconto por volume e peso da carga ──
function getItemDiscountRate(name: string, unit: string, qty: number): number {
  const isBulkEligible =
    unit === "saco" ||
    unit === "sc" ||
    /cimento|argamassa|rejunte|gesso/i.test(name)
  if (isBulkEligible) {
    if (qty >= 560) return 0.07 // 7% de desconto (Carga Fechada / Truck)
    if (qty >= 40) return 0.03 // 3% de desconto (Palete Fechado)
  }
  return 0
}

function getItemUnitWeight(name: string, unit: string): number {
  const match = name.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/i)
  if (match) {
    return parseFloat(match[1].replace(",", "."))
  }
  if (unit === "saco" || unit === "sc") return 50
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      items,
      email,
      customerName,
      customerPhone,
      customerCep,
      customerCity,
    } = body as {
      items: CartItem[]
      email?: string
      customerName?: string
      customerPhone?: string
      customerCep?: string
      customerCity?: string
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 })
    }

    // Recalcular total no servidor com regras B2B (desconto de palete/carga fechada)
    let grossTotal = 0
    let totalDiscount = 0
    let totalWeight = 0
    items.forEach((i) => {
      const price = Number(i.price)
      const qty = Math.max(1, Math.floor(Number(i.qty)))
      if (isFinite(price) && price > 0) {
        const itemGross = price * qty
        const rate = getItemDiscountRate(i.name, i.unit, qty)
        const itemDisc = itemGross * rate
        grossTotal += itemGross
        totalDiscount += itemDisc
        totalWeight += getItemUnitWeight(i.name, i.unit) * qty
      }
    })
    const total = Math.max(0, grossTotal - totalDiscount)

    if (total <= 0) {
      return NextResponse.json({ error: "Total inválido." }, { status: 400 })
    }

    const clientHeader = [
      customerName ? `Cliente: ${customerName.trim()}` : null,
      customerPhone ? `WhatsApp: ${customerPhone.trim()}` : null,
      customerCity || customerCep
        ? `Entrega: ${customerCity || ""} (CEP: ${customerCep || ""})`.trim()
        : null,
      `----------------------------------------`,
    ]
      .filter(Boolean)
      .join("\n")
    const productLines = items
      .map((i) => {
        const price = Number(i.price)
        const qty = Math.max(1, Math.floor(Number(i.qty)))
        const rate = getItemDiscountRate(i.name, i.unit, qty)
        const itemTotal = (price * qty * (1 - rate)).toFixed(2)
        const tag =
          rate === 0.07
            ? " (Carga Fechada: 7% OFF)"
            : rate === 0.03
              ? " (Palete Fechado: 3% OFF)"
              : ""
        return `- ${qty}x ${i.name} — R$ ${itemTotal}${tag}`
      })
      .join("\n")
    const b2bSummary = [
      totalWeight > 0
        ? `Peso Total Estimado: ~${
            totalWeight >= 1000
              ? `${(totalWeight / 1000).toFixed(1)} ton (${totalWeight.toLocaleString("pt-BR")} kg)`
              : `${totalWeight.toLocaleString("pt-BR")} kg`
          }`
        : null,
      totalDiscount > 0 ? `Desconto B2B Volume: - R$ ${totalDiscount.toFixed(2)}` : null,
      `Total Final: R$ ${total.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join("\n")
    const itemsSummary = clientHeader
      ? `${clientHeader}\n${productLines}\n\n${b2bSummary}`
      : `${productLines}\n\n${b2bSummary}`

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
      items: {
        customer: {
          name: customerName?.trim() || null,
          phone: customerPhone?.trim() || null,
          cep: customerCep?.trim() || null,
          city: customerCity?.trim() || null,
        },
        products: items,
      },
      items_summary: itemsSummary,
      created_at: now,
      updated_at: now,
    })

    if (error) {
      console.error("orders insert error:", error)
      return NextResponse.json({ error: "Falha ao salvar pedido." }, { status: 500 })
    }

    // Gravação defensiva na tabela quotation_leads (se existir) para preservar o lead
    // mesmo quando a tabela ainda não foi criada no Supabase.
    try {
      if (customerName && customerPhone) {
        await supabase.from("quotation_leads").insert({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: email?.trim() || null,
          address_city: customerCity?.trim() || null,
          address_zip: customerCep?.trim() || null,
        })
      }
    } catch (_) {
      // Ignora se a tabela quotation_leads ainda não existir ou não houver permissão
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
