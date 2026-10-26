import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("sort_order")
    .order("created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id } = await params
  const body = await req.json()
  const { product_id, product_name, sku, unit = "un", qty = 1, unit_price, discount_pct = 0, notes, sort_order = 0 } =
    body
  if (!product_name?.trim() || !unit_price)
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotation_items")
    .insert({
      id: crypto.randomUUID(),
      quotation_id: id,
      product_id: product_id || null,
      product_name: product_name.trim(),
      sku: sku || null,
      unit,
      qty: Number(qty),
      unit_price: Number(unit_price),
      discount_pct: Number(discount_pct),
      notes: notes || null,
      sort_order,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Atualiza updated_at do orçamento
  await supabase.from("quotations").update({ updated_at: new Date().toISOString() }).eq("id", id)
  return NextResponse.json({ item: data }, { status: 201 })
}
