import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const brl = (n: number) => Math.round(Number(n || 0) * 100) / 100

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Buscar orders (tabela existente, pode ter status em inglês ou português)
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, status, created_at")
      .order("created_at", { ascending: false })

    if (ordersError) throw ordersError

    // Buscar orcamentos (tabela nova, status em português)
    const { data: orcamentos, error: orcamentosError } = await supabase
      .from("orcamentos")
      .select("id, total, status, criado_em")
      .order("criado_em", { ascending: false })

    if (orcamentosError) throw orcamentosError

    const ordersList = orders || []
    const orcList = orcamentos || []

    // Faturamento real = apenas entregue
    // orders: 'delivered' (inglês) ou 'entregue' (português)
    const faturamentoOrders = ordersList
      .filter((o: any) => o.status === "delivered" || o.status === "entregue")
      .reduce((acc, o) => acc + brl(o.total), 0)

    const faturamentoOrcamentos = orcList
      .filter((o: any) => o.status === "entregue")
      .reduce((acc, o) => acc + brl(o.total), 0)

    const faturamentoReal = brl(faturamentoOrders + faturamentoOrcamentos)

    // Potencial em aberto = orcamentos enviados, negociando, aprovados
    const potencialAberto = orcList
      .filter((o: any) => ["enviado", "negociando", "aprovado"].includes(o.status))
      .reduce((acc, o) => acc + brl(o.total), 0)

    // Taxa de conversão = orcamentos que viraram entregue / total de orcamentos (excluindo rascunho)
    const orcamentosNaoRascunho = orcList.filter(
      (o: any) => o.status !== "rascunho"
    )
    const orcamentosConvertidos = orcList.filter(
      (o: any) => o.status === "entregue"
    )
    const taxaConversao =
      orcamentosNaoRascunho.length > 0
        ? brl((orcamentosConvertidos.length / orcamentosNaoRascunho.length) * 100)
        : 0

    return NextResponse.json({
      faturamentoReal: faturamentoReal,
      potencialAberto: brl(potencialAberto),
      taxaConversao: taxaConversao,
      pedidosEntregues: ordersList.filter(
        (o: any) => o.status === "delivered" || o.status === "entregue"
      ).length,
      orcamentosAbertos: orcamentosNaoRascunho.length,
      totalPedidos: ordersList.length,
      totalOrcamentos: orcList.length,
    })
  } catch (error: any) {
    console.error("[dashboard-metrics]", error)
    return NextResponse.json(
      { error: error.message || "Erro ao carregar métricas" },
      { status: 500 }
    )
  }
}
