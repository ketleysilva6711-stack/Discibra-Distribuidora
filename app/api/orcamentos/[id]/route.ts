import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotations")
    .select("*, quotation_leads(*), quotation_items(*)")
    .eq("id", id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 })
  return NextResponse.json({ quotation: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id } = await params
  const body = await req.json()
  const allowed = [
    "created_by",
    "status",
    "discount_pct",
    "shipping_value",
    "notes",
    "notes_client",
    "valid_until",
    "payment_terms",
    "lead_id",
    "converted_order_id",
  ]
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) {
    if (k in body) patch[k] = body[k]
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotations")
    .update(patch)
    .eq("id", id)
    .select("*, quotation_leads(*), quotation_items(*)")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualizar dados do lead (endereço, telefone, etc.) quando enviados
  if (body.lead_data && data.lead_id) {
    const {
      name,
      phone,
      email,
      cpf_cnpj,
      address_street,
      address_number,
      address_complement,
      address_city,
      address_state,
      address_zip,
    } = body.lead_data
    await supabase
      .from("quotation_leads")
      .update({
        name: name ?? null,
        phone: phone ?? null,
        email: email ?? null,
        cpf_cnpj: cpf_cnpj ?? null,
        address_street: address_street ?? null,
        address_number: address_number ?? null,
        address_complement: address_complement ?? null,
        address_city: address_city ?? null,
        address_state: address_state ?? null,
        address_zip: address_zip ?? null,
        last_contact_at: new Date().toISOString(),
      })
      .eq("id", data.lead_id)
  }

  return NextResponse.json({ quotation: data })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("quotations").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
