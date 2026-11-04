"use server"

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { calcularPrecoItem, calcularDescontoPix } from "@/lib/rules/pricing"
import { calcularFrete } from "@/lib/rules/freight"
import { inserirComRetryCodigo } from "@/lib/rules/order-code"
import { SITE, waLink } from "@/lib/site-config"

const CreateQuoteSchema = z.object({
  cliente_nome: z.string().min(3, "Nome completo obrigatório"),
  cliente_telefone: z.string().regex(/^\d{10,11}$/, "Telefone/WhatsApp inválido (DDD + número)"),
  cliente_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  metodo_entrega: z.enum(["entrega", "retirada"]),
  endereco_cep: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().length(2).optional(),
  forma_pagamento: z.enum(["pix", "cartao"]),
  parcelas_cartao: z.number().int().min(1).max(12).default(1),
  itens: z.array(
    z.object({
      produto_id: z.string().uuid(),
      quantidade: z.number().int().positive(),
    })
  ).min(1, "O carrinho deve ter pelo menos 1 item"),
})

type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

function formatarBRL(valor: number): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export async function createQuoteAction(input: CreateQuoteInput) {
  // Sanitização de telefone e CEP
  const telefoneLimpo = input.cliente_telefone.replace(/\D/g, "")
  const cepLimpo = input.endereco_cep ? input.endereco_cep.replace(/\D/g, "") : undefined

  // Validação condicional: endereço obrigatório para entrega
  if (input.metodo_entrega === "entrega") {
    if (!cepLimpo || cepLimpo.length !== 8) {
      return { success: false, error: "CEP deve conter 8 dígitos para entrega" }
    }
    if (!input.endereco_logradouro?.trim()) {
      return { success: false, error: "Logradouro é obrigatório para entrega" }
    }
    if (!input.endereco_numero?.trim()) {
      return { success: false, error: "Número é obrigatório para entrega" }
    }
    if (!input.endereco_bairro?.trim()) {
      return { success: false, error: "Bairro é obrigatório para entrega" }
    }
    if (!input.endereco_cidade?.trim()) {
      return { success: false, error: "Cidade é obrigatória para entrega" }
    }
  }

  const supabase = createAdminClient()

  // 1. Buscar produtos no banco
  const produtoIds = input.itens.map((i) => i.produto_id)
  const { data: produtos, error: produtosError } = await supabase
    .from("products")
    .select("id, sku, name, price, preco_avulso, preco_palete, preco_carga_fechada, peso_kg, weight, active")
    .in("id", produtoIds)

  if (produtosError || !produtos) {
    return { success: false, error: "Erro ao buscar produtos" }
  }

  if (produtos.length !== input.itens.length) {
    return { success: false, error: "Um ou mais produtos não foram encontrados" }
  }

  // 2. Validar produtos ativos e calcular preços server-side
  const produtoMap = new Map(produtos.map((p) => [p.id, p]))
  let subtotalMateriais = 0
  let descontoVolume = 0
  let pesoTotalKg = 0
  const itensParaInserir: any[] = []

  for (const item of input.itens) {
    const produto = produtoMap.get(item.produto_id)
    if (!produto || !produto.active) {
      return {
        success: false,
        error: `Produto ${item.produto_id} inativo ou inexistente`,
      }
    }

    const quantidade = item.quantidade
    const precoItem = calcularPrecoItem(
      {
        preco_avulso: Number(produto.preco_avulso || produto.price),
        preco_palete: Number(produto.preco_palete || 0),
        preco_carga_fechada: Number(produto.preco_carga_fechada || 0),
      },
      quantidade,
      Number(produto.peso_kg || produto.weight || 1)
    )

    subtotalMateriais += precoItem.subtotal
    pesoTotalKg += precoItem.pesoTotalKg

    itensParaInserir.push({
      produto_id: produto.id,
      sku: produto.sku || null,
      nome_produto: produto.name,
      unidade: "sc",
      quantidade,
      preco_tabela: precoItem.precoTabela,
      preco_aplicado: precoItem.precoAplicado,
      tipo_preco: precoItem.tipo,
      peso_unitario_kg: Number(produto.peso_kg || produto.weight || 1),
    })
  }

  // 3. Buscar configurações de frete
  const { data: configuracoes } = await supabase
    .from("configuracoes_frete")
    .select("*")
    .eq("ativo", true)
    .order("km_max", { ascending: true })

  const configArray = (configuracoes || []).map((c: any) => ({
    km_max: Number(c.km_max),
    km_faixa_anterior: Number(c.km_faixa_anterior || 0),
    valor_base: Number(c.valor_base),
    valor_km_adicional: Number(c.valor_km_adicional || 0),
    valor_minimo_frete_gratis:
      c.valor_minimo_frete_gratis !== null ? Number(c.valor_minimo_frete_gratis) : null,
    taxa_munck: Number(c.taxa_munck || 250),
  }))

  // 4. Calcular frete
  const distanciaKm = input.metodo_entrega === "entrega"
    ? Number(input.endereco_cep ? estimarDistanciaKm(cepLimpo!, SITE.address.zip.replace(/\D/g, "") || "14060000") : 0)
    : 0

  const freteResultado = calcularFrete({
    subtotal: subtotalMateriais,
    distanciaKm,
    totalKg: pesoTotalKg,
    metodoEntrega: input.metodo_entrega,
    configuracoes: configArray,
  })

  // 5. Calcular desconto PIX (3%)
  const descontoPix = calcularDescontoPix(subtotalMateriais, input.forma_pagamento)

  // 6. Total final (nunca aceitar valor do cliente)
  const total = subtotalMateriais - descontoVolume - descontoPix + freteResultado.valorFrete

  // 7. Inserir orçamento com retry no código único
  const { data: orcamento } = await inserirComRetryCodigo(async (codigo) => {
    const { data, error } = await supabase.from("orcamentos").insert({
      codigo,
      cliente_nome: input.cliente_nome.trim(),
      cliente_telefone: telefoneLimpo,
      cliente_email: input.cliente_email?.trim() || null,
      endereco_cep: cepLimpo || null,
      endereco_logradouro:
        input.metodo_entrega === "entrega" && input.endereco_logradouro
          ? input.endereco_logradouro.trim()
          : null,
      endereco_numero:
        input.metodo_entrega === "entrega" && input.endereco_numero
          ? input.endereco_numero.trim()
          : null,
      endereco_complemento: input.endereco_complemento?.trim() || null,
      endereco_bairro:
        input.metodo_entrega === "entrega" && input.endereco_bairro
          ? input.endereco_bairro.trim()
          : null,
      endereco_cidade:
        input.metodo_entrega === "entrega" && input.endereco_cidade
          ? input.endereco_cidade.trim()
          : null,
      endereco_uf:
        input.metodo_entrega === "entrega"
          ? (input.endereco_uf || "SP").toUpperCase()
          : null,
      metodo_entrega: input.metodo_entrega,
      distancia_km: distanciaKm,
      requer_munck: freteResultado.requerMunck,
      subtotal: subtotalMateriais,
      desconto_volume: descontoVolume,
      desconto_pix: descontoPix,
      valor_frete: freteResultado.valorFrete,
      frete_a_confirmar: freteResultado.freteAConfirmar,
      total,
      forma_pagamento: input.forma_pagamento,
      parcelas_cartao: input.parcelas_cartao,
      status: "enviado",
      peso_total_kg: pesoTotalKg,
      ip_origem: null,
    }).select().single()

    if (error) throw error
    return { data, error: null }
  }, 5)

  if (!orcamento) {
    return { success: false, error: "Erro ao salvar orçamento" }
  }

  const orcamentoId = orcamento.id
  const codigo = orcamento.codigo
  const tokenAcesso = orcamento.token_acesso

  // 8. Inserir itens do orçamento
  const itensComOrcamentoId = itensParaInserir.map((item, idx) => ({
    ...item,
    orcamento_id: orcamentoId,
    ordem: idx + 1,
  }))

  const { error: itensError } = await supabase.from("orcamento_itens").insert(itensComOrcamentoId)

  if (itensError) {
    console.error("[createQuoteAction] Erro ao inserir itens:", itensError)
    // Não desfaz o orçamento, mas reporta
  }

  // 9. Inserir auditoria inicial
  await supabase.from("orcamento_auditoria").insert({
    orcamento_id: orcamentoId,
    status_anterior: null,
    status_novo: "enviado",
    observacao: "Orçamento criado via canal público",
  })

  // 10. Gerar URL do WhatsApp com template padronizado
  const formaPagamentoTexto = input.forma_pagamento === "pix"
    ? "PIX (3% de desconto)"
    : `Cartão (${input.parcelas_cartao}x)`
  const totalFormatado = formatarBRL(total)

  const mensagem = [
    "Olá, Discibra!",
    `Solicito atendimento para o orçamento ${codigo}.`,
    `Cliente: ${input.cliente_nome.trim()}`,
    `Total: R$ ${totalFormatado} (${formaPagamentoTexto})`,
    `Acesse os detalhes da cotação: ${SITE.siteUrl}/orcamento/${codigo}?t=${tokenAcesso}`,
  ].join("\n")

  const whatsappUrl = waLink(mensagem)

  return {
    success: true,
    codigo,
    token: tokenAcesso,
    total,
    whatsappUrl,
  }
}

function estimarDistanciaKm(cep: string, cepBase: string): number {
  const cepNum = parseInt(cep, 10)
  const cepBaseNum = parseInt(cepBase.replace(/\D/g, ""), 10)

  if (cep === cepBase.replace(/\D/g, "")) return 5

  if (cepNum >= 14000000 && cepNum <= 14110000) return 8
  if (cepNum >= 14160000 && cepNum <= 14179999) return 25
  if (cepNum >= 14180000 && cepNum <= 14300000) return 35
  if (cepNum >= 14301000 && cepNum <= 14780000) return 65

  if (cep.startsWith("1")) return 95

  return 120
}
