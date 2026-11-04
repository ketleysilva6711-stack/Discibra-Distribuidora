import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calcularFrete } from "@/lib/rules/freight"
import { SITE } from "@/lib/site-config"

/**
 * Estima distância em km a partir do CEP base cadastrado (Ribeirão Preto/SP)
 * usando faixas de prefixo de CEP quando não há tabela cep_faixas disponível.
 */
function estimarDistanciaKm(cep: string, cepBase: string): number {
  const cepNum = parseInt(cep, 10)
  const cepBaseNum = parseInt(cepBase.replace(/\D/g, ""), 10)

  // Mesmo CEP base ou mesma faixa urbana de Ribeirão Preto
  if (cep === cepBase.replace(/\D/g, "")) return 5

  // Faixas de prefixo de CEP para cidades da região
  if (cepNum >= 14000000 && cepNum <= 14110000) return 8 // Ribeirão Preto urbana
  if (cepNum >= 14160000 && cepNum <= 14179999) return 25 // Sertãozinho
  if (cepNum >= 14180000 && cepNum <= 14300000) return 35 // Região metropolitana
  if (cepNum >= 14301000 && cepNum <= 14780000) return 65 // Região expandida

  // Outros CEPs de SP
  if (cep.startsWith("1")) return 95 // Interior de SP (dispara frete a confirmar)

  // Fora de SP
  return 120 // Fora do estado (dispara frete a confirmar)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cep, itens, metodoEntrega = "entrega" } = body

    if (!cep) {
      return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 })
    }

    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP deve conter 8 dígitos" }, { status: 400 })
    }

    // Retirada: frete sempre zero
    if (metodoEntrega === "retirada") {
      return NextResponse.json({
        valorFrete: 0,
        freteAConfirmar: false,
        requerMunck: false,
        sugerirRetirada: false,
        distanciaKm: 0,
        pesoTotalKg: 0,
      })
    }

    const supabase = createAdminClient()

    // Buscar CEP base e subtotal/peso dos produtos
    const cepBase = SITE.address.zip.replace(/\D/g, "") || "14060000"

    // Buscar configurações de frete ativas
    const { data: configuracoes } = await supabase
      .from("configuracoes_frete")
      .select("*")
      .eq("ativo", true)
      .order("km_max", { ascending: true })

    // Buscar produtos para calcular peso e subtotal
    const produtoIds = itens.map((i: any) => i.produto_id)
    const { data: produtos } = await supabase
      .from("products")
      .select("id, sku, price, weight, preco_avulso, preco_palete, preco_carga_fechada")
      .in("id", produtoIds)

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({ error: "Nenhum produto válido encontrado" }, { status: 400 })
    }

    const produtoMap = new Map(produtos.map((p: any) => [p.id, p]))

    // Calcular peso total e validar itens
    let totalKg = 0
    let subtotalMateriais = 0

    for (const item of itens) {
      const produto = produtoMap.get(item.produto_id)
      if (!produto) {
        return NextResponse.json(
          { error: `Produto não encontrado: ${item.produto_id}` },
          { status: 400 }
        )
      }

      const quantidade = Number(item.quantidade) || 1
      const pesoUnitario = Number(produto.peso_kg || produto.weight || 1)
      totalKg += pesoUnitario * quantidade

      // Subtotal usando preço avulso como referência (será refinado no createQuoteAction)
      subtotalMateriais += Number(produto.preco_avulso || produto.price || 0) * quantidade
    }

    // Estimar distância
    const distanciaKm = estimarDistanciaKm(cleanCep, cepBase)

    // Calcular frete usando a regra de negócio
    const configArray = (configuracoes || []).map((c: any) => ({
      km_max: Number(c.km_max),
      km_faixa_anterior: Number(c.km_faixa_anterior || 0),
      valor_base: Number(c.valor_base),
      valor_km_adicional: Number(c.valor_km_adicional || 0),
      valor_minimo_frete_gratis: c.valor_minimo_frete_gratis !== null ? Number(c.valor_minimo_frete_gratis) : null,
      taxa_munck: Number(c.taxa_munck || 250),
    }))

    const resultado = calcularFrete({
      subtotal: subtotalMateriais,
      distanciaKm,
      totalKg,
      metodoEntrega: "entrega",
      configuracoes: configArray,
    })

    return NextResponse.json({
      valorFrete: resultado.valorFrete,
      freteAConfirmar: resultado.freteAConfirmar,
      requerMunck: resultado.requerMunck,
      sugerirRetirada: resultado.sugerirRetirada,
      distanciaKm,
      pesoTotalKg: totalKg,
    })
  } catch (error: any) {
    console.error("[freight/calculate]", error)
    return NextResponse.json(
      { error: error.message || "Erro interno ao calcular frete" },
      { status: 500 }
    )
  }
}
