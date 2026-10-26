import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id, itemId } = await params
  const body = await req.json()
  const allowed = [
    "qty",
    "unit_price",
    "discount_pct",
    "notes",
    "sort_order",
    "product_name",
    "sku",
    "unit",
  ]
  const patch: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) patch[k] = body[k]
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotation_items")
    .update(patch)
    .eq("id", itemId)
    .eq("quotation_id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from("quotations").update({ updated_at: new Date().toISOString() }).eq("id", id)
  return NextResponse.json({ item: data })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id, itemId } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("quotation_items").delete().eq("id", itemId).eq("quotation_id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from("quotations").update({ updated_at: new Date().toISOString() }).eq("id", id)
  return NextResponse.json({ ok: true })
}
