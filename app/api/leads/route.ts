import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const q = new URL(req.url).searchParams.get("q")?.trim() || ""
  const supabase = createAdminClient()
  let query = supabase
    .from("quotation_leads")
    .select("id, name, phone, email, company, cpf_cnpj, type")
    .order("last_contact_at", { ascending: false })
    .limit(20)
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdminServerConfigured()) return NextResponse.json({ error: "Não configurado" }, { status: 503 })
  const body = await req.json()
  const { name, phone, email, company, cpf_cnpj, type = "pessoa_fisica" } = body
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("quotation_leads")
    .insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      company: company?.trim() || null,
      cpf_cnpj: cpf_cnpj?.trim() || null,
      type,
      created_at: new Date().toISOString(),
      last_contact_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data }, { status: 201 })
}
