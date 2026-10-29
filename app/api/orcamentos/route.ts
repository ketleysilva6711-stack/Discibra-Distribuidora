import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"
import { createPublicClient } from "@/lib/supabase/public"

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return "ORC-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function GET(req: NextRequest) {
  const isAdmin = isAdminServerConfigured()
  const supabase = isAdmin ? createAdminClient() : createPublicClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || ""
  const q = searchParams.get("q")?.trim() || ""
  let query = supabase
    .from("quotations")
    .select(
      "id, code, status, discount_pct, shipping_value, valid_until, payment_terms, created_at, updated_at, lead_id, quotation_leads(name, phone, company, cpf_cnpj), quotation_items(id, product_name, unit, qty, unit_price, discount_pct)",
    )
    .order("created_at", { ascending: false })
    .limit(100)
  if (status && status !== "all") query = query.eq("status", status)
  if (q) query = query.or(`code.ilike.%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotations: data || [] })
}

export async function POST(req: NextRequest) {
  const isAdmin = isAdminServerConfigured()
  const supabase = isAdmin ? createAdminClient() : createPublicClient()
  const body = await req.json()
  const {
    customerName,
    customerPhone,
    customerCompany,
    customerCpfCnpj,
    shippingValue = 0,
    paymentTerms = "À vista via PIX ou Faturado após análise cadastral",
    validDays = 5,
    notesClient,
    items = [],
  } = body
  if (!customerName?.trim()) {
    return NextResponse.json({ error: "Nome do cliente é obrigatório." }, { status: 400 })
  }
  const now = new Date()
  const validUntilDate = new Date(now)
  validUntilDate.setDate(validUntilDate.getDate() + Number(validDays || 5))
  // 1. Criar ou encontrar Lead
  let leadId: string | null = null
  const cleanPhone = customerPhone ? customerPhone.trim() : null

  if (cleanPhone) {
    const { data: existingLead } = await supabase
      .from("quotation_leads")
      .select("id")
      .eq("phone", cleanPhone)
      .limit(1)
      .maybeSingle()
    if (existingLead) {
      leadId = existingLead.id
    }
  }
  if (!leadId) {
    const newLeadId = crypto.randomUUID()
    const { data: createdLead, error: leadErr } = await supabase
      .from("quotation_leads")
      .insert({
        id: newLeadId,
        name: customerName.trim(),
        phone: cleanPhone,
        company: customerCompany?.trim() || null,
        cpf_cnpj: customerCpfCnpj?.trim() || null,
        type: customerCompany ? "pessoa_juridica" : "pessoa_fisica",
        created_at: now.toISOString(),
        last_contact_at: now.toISOString(),
      })
      .select("id")
      .single()
    if (leadErr) {
      console.error("Erro ao criar lead:", leadErr)
    } else {
      leadId = createdLead.id
    }
  }
  // 2. Criar Orçamento
  const quotationId = crypto.randomUUID()
  const code = genCode()
  const { data: qData, error: qErr } = await supabase
    .from("quotations")
    .insert({
      id: quotationId,
      code,
      lead_id: leadId,
      status: "sent",
      discount_pct: 0,
      shipping_value: Number(shippingValue) || 0,
      payment_terms: paymentTerms,
      valid_until: validUntilDate.toISOString().split("T")[0],
      notes_client: notesClient || null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select("*, quotation_leads(*)")
    .single()
  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 })
  }
  // 3. Inserir itens se houver
  if (Array.isArray(items) && items.length > 0) {
    const itemsToInsert = items.map((it: any, idx: number) => ({
      id: crypto.randomUUID(),
      quotation_id: quotationId,
      product_id: it.product_id || null,
      product_name: it.product_name || "Material",
      sku: it.sku || null,
      unit: it.unit || "un",
      qty: Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      discount_pct: Number(it.discount_pct) || 0,
      sort_order: idx + 1,
      created_at: now.toISOString(),
    }))
    const { error: itemsErr } = await supabase.from("quotation_items").insert(itemsToInsert)
    if (itemsErr) {
      console.error("Erro ao inserir itens da cotação:", itemsErr)
    }
  }
  return NextResponse.json({ quotation: qData, success: true }, { status: 201 })
}
