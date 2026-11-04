"use server"

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { calcularPrecoItem, calcularDescontoPix } from "@/lib/rules/pricing"
import { calcularFrete } from "@/lib/rules/freight"
import { inserirComRetryCodigo } from "@/lib/rules/order-code"
import { SITE, waLink } from "@/lib/site-config"
import { telefoneValido, normalizarTelefone } from "@/lib/rules/phone"
import { obterOuCriarCliente } from "@/lib/rules/customer"

function formatarBRL(valor: number): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ── Schema discriminado por método de entrega e pagamento ──
const EnderecoEntregaSchema = z.object({
  cep: z.string().min(8, "CEP deve conter 8 dígitos"),
  logradouro: z.string().min(2, "Logradouro obrigatório"),
  numero: z.string().min(1, "Número obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro obrigatório"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 letras"),
})

const PagamentoPixSchema = z.object({
  forma: z.literal("pix"),
})

const PagamentoCartaoSchema = z.object({
  forma: z.literal("cartao"),
  parcelas: z.number().int().min(1).max(12).default(1),
})

const CreateQuoteSchema = z.object({
  idempotencyKey: z.string().uuid("Chave de idempotência inválida"),
  cliente: z.object({
    nome: z.string().min(3, "Nome completo obrigatório"),
    telefone: z.string().refine((v) => telefoneValido(v), {
      message: "Telefone/WhatsApp inválido (DDD + número)",
    }),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    consentimentoLgpd: z.literal(true, {
      errorMap: () => ({ message: "Consentimento LGPD é obrigatório" }),
    }),
  }),
  metodo_entrega: z.enum(["entrega", "retirada"]),
  entrega: EnderecoEntregaSchema.optional(),
  pagamento: z.discriminatedUnion("forma", [PagamentoPixSchema, PagamentoCartaoSchema]),
  itens: z.array(
    z.object({
      produtoId: z.string().uuid(),
      quantidade: z.number().int().positive(),
    })
  ).min(1, "O carrinho deve ter pelo menos 1 item"),
  origem: z.object({
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    pagina: z.string().optional(),
  }).optional(),
})

type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

export async function createQuoteAction(input: CreateQuoteInput) {
  const supabase = createAdminClient()

  // ── 1. Idempotência: rejeitar duplicados ──
  const { data: existente } = await supabase
    .from("orcamentos")
    .select("codigo, token_acesso, total, forma_pagamento, parcelas_cartao")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle()

  if (existente) {
    const formaPagamentoTexto =
      existente.forma_pagamento === "pix"
        ? "PIX (3% de desconto)"
        : `Cartão (${existente.parcelas_cartao}x)`
    return {
      success: true,
      codigo: existente.codigo,
      token: existente.token_acesso,
      total: existente.total,
      whatsappUrl: waLink(
        `Olá! Segue o orçamento ${existente.codigo} da Discibra — Total: R$ ${formatarBRL(
          existente.total
        )} (${formaPagamentoTexto})\n${SITE.siteUrl}/orcamento/${existente.codigo}?t=${existente.token_acesso}`
      ),
      idempotente: true,
    }
  }

  // ── 2. Obter ou criar cliente ──
  let clienteId: string
  try {
    const cliente = await obterOuCriarCliente(supabase, {
      telefone: input.cliente.telefone,
      nome: input.cliente.nome,
      email: input.cliente.email || null,
      consentimentoLgpd: input.cliente.consentimentoLgpd,
    })
    clienteId = cliente.id
  } catch (e: any) {
    if (e.message === "CLIENTE_BLOQUEADO") {
      return { success: false, error: "CLIENTE_BLOQUEADO" }
    }
    return { success: false, error: "Erro ao processar cliente" }
  }

  // ── 3. Buscar produtos e validar ativos ──
  const produtoIds = input.itens.map((i) => i.produtoId)
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

  // ── 4. Validar produtos ativos e calcular preços server-side ──
  const produtoMap = new Map(produtos.map((p) => [p.id, p]))
  let subtotalMateriais = 0
  let pesoTotalKg = 0
  const itensParaInserir: any[] = []

  for (const item of input.itens) {
    const produto = produtoMap.get(item.produtoId)
    if (!produto || !produto.active) {
      return {
        success: false,
        error: `Produto ${produto?.name || item.produtoId} inativo ou inexistente`,
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

  // ── 5. Buscar configurações de frete ──
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

  // ── 6. Calcular frete ──
  const metodoEntrega = input.metodo_entrega
  let distanciaKm = 0
  if (metodoEntrega === "entrega" && input.entrega?.cep) {
    distanciaKm = Number(
      estimarDistanciaKm(
        input.entrega.cep.replace(/\D/g, ""),
        SITE.address.zip.replace(/\D/g, "") || "14060000"
      )
    )
  }

  const freteResultado = calcularFrete({
    subtotal: subtotalMateriais,
    distanciaKm,
    totalKg: pesoTotalKg,
    metodoEntrega,
    configuracoes: configArray,
  })

  // ── 7. Calcular desconto PIX (3%) ──
  const descontoPix = calcularDescontoPix(
    subtotalMateriais,
    input.pagamento.forma === "pix" ? "pix" : "cartao"
  )

  // ── 8. Total final (nunca aceitar valor do cliente) ──
  const total = subtotalMateriais - descontoPix + freteResultado.valorFrete

  // ── 9. Inserir orçamento com retry no código único e idempotency_key ──
  let orcamento: any = null
  try {
    const { data } = await inserirComRetryCodigo(async (codigo) => {
      const { data: d, error: e } = await supabase.from("orcamentos").insert({
        codigo,
        cliente_id: clienteId,
        cliente_nome: input.cliente.nome.trim(),
        cliente_telefone: normalizarTelefone(input.cliente.telefone),
        cliente_email: input.cliente.email?.trim() || null,
        endereco_cep: metodoEntrega === "entrega" ? input.entrega?.cep.replace(/\D/g, "") || null : null,
        endereco_logradouro: metodoEntrega === "entrega" ? input.entrega?.logradouro?.trim() || null : null,
        endereco_numero: metodoEntrega === "entrega" ? input.entrega?.numero?.trim() || null : null,
        endereco_complemento: input.entrega?.complemento?.trim() || null,
        endereco_bairro: metodoEntrega === "entrega" ? input.entrega?.bairro?.trim() || null : null,
        endereco_cidade: metodoEntrega === "entrega" ? input.entrega?.cidade?.trim() || null : null,
        endereco_uf: metodoEntrega === "entrega" ? (input.entrega?.uf || "SP").toUpperCase() : null,
        metodo_entrega: metodoEntrega,
        distancia_km: distanciaKm,
        requer_munck: freteResultado.requerMunck,
        subtotal: subtotalMateriais,
        desconto_volume: 0,
        desconto_pix: descontoPix,
        valor_frete: freteResultado.valorFrete,
        frete_a_confirmar: freteResultado.freteAConfirmar,
        total,
        forma_pagamento: input.pagamento.forma,
        parcelas_cartao:
          input.pagamento.forma === "cartao" ? input.pagamento.parcelas : 1,
        status: "enviado",
        peso_total_kg: pesoTotalKg,
        ip_origem: null,
        idempotency_key: input.idempotencyKey,
        consentimento_lgpd: input.cliente.consentimentoLgpd,
        utm_source: input.origem?.utmSource || null,
        utm_medium: input.origem?.utmMedium || null,
        utm_campaign: input.origem?.utmCampaign || null,
        pagina_origem: input.origem?.pagina || null,
      }).select().single()

      if (e) throw e
      return { data: d, error: null }
    }, 5)

    orcamento = data
  } catch (e: any) {
    return {
      success: false,
      error: e.message || "Erro ao salvar orçamento",
    }
  }

  if (!orcamento) {
    return { success: false, error: "Erro ao salvar orçamento" }
  }

  const orcamentoId = orcamento.id
  const codigo = orcamento.codigo
  const tokenAcesso = orcamento.token_acesso

  // ── 10. Inserir itens do orçamento ──
  const itensComOrcamentoId = itensParaInserir.map((item, idx) => ({
    ...item,
    orcamento_id: orcamentoId,
    ordem: idx + 1,
  }))

  const { error: itensError } = await supabase.from("orcamento_itens").insert(itensComOrcamentoId)

  if (itensError) {
    console.error("[createQuoteAction] Erro ao inserir itens:", itensError)
  }

  // ── 11. Inserir auditoria inicial ──
  await supabase.from("orcamento_auditoria").insert({
    orcamento_id: orcamentoId,
    status_anterior: null,
    status_novo: "enviado",
    observacao: "Orçamento criado via canal público",
  })

  // ── 12. Gerar URL do WhatsApp com template padronizado ──
  const qtdItens = input.itens.reduce((acc, i) => acc + i.quantidade, 0)
  const totalFormatado = formatarBRL(total)
  const formaPagamentoTexto =
    input.pagamento.forma === "pix"
      ? "PIX (3% de desconto)"
      : `Cartão (${input.pagamento.forma === "cartao" ? input.pagamento.parcelas : 1}x)`

  const mensagem = [
    `Olá! Solicito atendimento para o orçamento ${codigo} — ${qtdItens} itens — R$ ${totalFormatado}`,
    `${SITE.siteUrl}/orcamento/${codigo}?t=${tokenAcesso}`,
  ].join("\n")

  const whatsappUrl = waLink(mensagem)

  return {
    success: true,
    codigo,
    token: tokenAcesso,
    total,
    whatsappUrl,
    idempotente: false,
  }
}

function estimarDistanciaKm(cep: string, cepBase: string): number {
  const cepNum = parseInt(cep, 10)

  if (cep === cepBase.replace(/\D/g, "")) return 5

  if (cepNum >= 14000000 && cepNum <= 14110000) return 8
  if (cepNum >= 14160000 && cepNum <= 14179999) return 25
  if (cepNum >= 14180000 && cepNum <= 14300000) return 35
  if (cepNum >= 14301000 && cepNum <= 14780000) return 65

  if (cep.startsWith("1")) return 95

  return 120
}
