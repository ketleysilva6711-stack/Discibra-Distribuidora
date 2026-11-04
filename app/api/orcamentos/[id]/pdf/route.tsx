import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isAdminServerConfigured()) {
    return new NextResponse("Servidor não configurado.", { status: 503 })
  }
  const supabase = createAdminClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("orcamentos").select("id, codigo, token_acesso")
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    query = query.eq("codigo", id.toUpperCase())
  }
  const { data: q, error } = await query.maybeSingle()
  if (error || !q) {
    return new NextResponse("Orçamento não encontrado.", { status: 404 })
  }

  // Redireciona para a página pública com flag de impressão automática (PDF nativo via window.print).
  // Isso evita a geração de PDF no edge runtime, que causava erro 500 no Cloudflare Workers.
  const redirectUrl = new URL(`/orcamento/${q.codigo}?t=${q.token_acesso}&print=true`, _.url)
  return NextResponse.redirect(redirectUrl)
}
