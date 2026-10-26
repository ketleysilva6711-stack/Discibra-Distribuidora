import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return "ORC-" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function GET(req: NextRequest) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || ""
  const q = searchParams.get("q")?.trim() || ""
  const supabase = createAdminClient()
  let query = supabase
    .from("quotations")
    .select(
      "id, code, status, discount_pct, shipping_value, valid_until, payment_terms, token, created_at, updated_at, lead_id, quotation_leads(name, phone, company), quotation_items(id, unit_price, qty, discount_pct)",
    )
    .order("created_at", { ascending: false })
    .limit(100)
  if (status) query = query.eq("status", status)
  if (q) query = query.ilike("code", `%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotations: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const body = await req.json()
  const { lead_id, created_by, payment_terms, valid_until, notes_client } = body
  const now = new Date().toISOString()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotations")
    .insert({
      id: crypto.randomUUID(),
      code: genCode(),
      lead_id: lead_id || null,
      status: "draft",
      discount_pct: 0,
      shipping_value: 0,
      payment_terms: payment_terms || "A definir pelo atendente",
      valid_until: valid_until || null,
      notes_client: notes_client || null,
      created_by: created_by || null,
      created_at: now,
      updated_at: now,
    })
    .select("*, quotation_leads(*)")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotation: data }, { status: 201 })
}
