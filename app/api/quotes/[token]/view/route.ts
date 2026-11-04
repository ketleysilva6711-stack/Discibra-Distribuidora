import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/quotes/[token]/view
 * Registra a visualização do orçamento pelo cliente via token de acesso.
 * Utiliza Service Role para ignorar RLS.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Token não informado" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Atualizar visualizado_em apenas se ainda não estiver preenchido
    const { data, error } = await supabase
      .from("orcamentos")
      .update({ visualizado_em: new Date().toISOString() })
      .eq("token_acesso", token)
      .is("visualizado_em", null)
      .select("id, codigo, cliente_nome, total, visualizado_em")
      .single()

    if (error) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    if (!data) {
      return NextResponse.json(
        { error: "Visualização já registrada anteriormente" },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      orcamento: {
        id: data.id,
        codigo: data.codigo,
        cliente_nome: data.cliente_nome,
        total: data.total,
        visualizado_em: data.visualizado_em,
      },
    })
  } catch (error: any) {
    console.error("[quotes/view]", error)
    return NextResponse.json(
      { error: error.message || "Erro interno ao registrar visualização" },
      { status: 500 }
    )
  }
}
