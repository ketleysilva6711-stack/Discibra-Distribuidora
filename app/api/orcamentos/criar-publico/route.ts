import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return "ORC-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function POST(req: NextRequest) {
  if (!isAdminServerConfigured()) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 503 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const {
    cliente_nome,
    cliente_telefone,
    cliente_email,
    endereco_cep,
    endereco_logradouro,
    endereco_numero,
    endereco_complemento,
    endereco_bairro,
    endereco_cidade,
    endereco_uf,
    metodo_entrega = "entrega",
    forma_pagamento = "pix",
    valor_frete = 0,
    itens = [],
  } = body

  // Validação defensiva
  if (!cliente_nome || !cliente_nome.trim()) {
    return NextResponse.json({ error: "Nome do cliente é obrigatório." }, { status: 400 })
  }
  const telefoneLimpo = String(cliente_telefone || "").replace(/\D/g, "")
  if (telefoneLimpo.length < 10) {
    return NextResponse.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: "O carrinho deve conter pelo menos 1 item." }, { status: 400 })
  }

  const supabase = createAdminClient()

  const codigo = genCode()
  const token_acesso = crypto.randomUUID()

  // Cálculos financeiros
  const subtotalMateriais = itens.reduce(
    (s: number, i: any) => s + Number(i.preco_aplicado || 0) * Number(i.quantidade || 1),
    0
  )
  const desconto_pix = forma_pagamento === "pix" ? Math.round(subtotalMateriais * 0.03 * 100) / 100 : 0
  const total = subtotalMateriais - desconto_pix + Number(valor_frete || 0)

  // 1. Inserir orçamento
  const now = new Date().toISOString()
  const { data: orcamento, error: oErr } = await supabase
    .from("orcamentos")
    .insert({
      codigo,
      cliente_nome: cliente_nome.trim(),
      cliente_telefone: telefoneLimpo,
      cliente_email: cliente_email?.trim() || null,
      endereco_cep: metodo_entrega === "entrega" ? String(endereco_cep || "").replace(/\D/g, "") || null : null,
      endereco_logradouro: metodo_entrega === "entrega" ? endereco_logradouro?.trim() || null : null,
      endereco_numero: metodo_entrega === "entrega" ? endereco_numero?.trim() || null : null,
      endereco_complemento: endereco_complemento?.trim() || null,
      endereco_bairro: metodo_entrega === "entrega" ? endereco_bairro?.trim() || null : null,
      endereco_cidade: metodo_entrega === "entrega" ? endereco_cidade?.trim() || null : null,
      endereco_uf: metodo_entrega === "entrega" ? endereco_uf?.trim() || null : null,
      metodo_entrega,
      forma_pagamento,
      desconto_pix,
      valor_frete: Number(valor_frete) || 0,
      subtotal: subtotalMateriais,
      total,
      status: "enviado",
      token_acesso,
      criado_em: now,
      atualizado_em: now,
    })
    .select("id, codigo, token_acesso")
    .single()

  if (oErr) {
    console.error("[criar-publico] Erro ao inserir orçamento:", oErr.message)
    return NextResponse.json({ error: "Erro ao salvar orçamento." }, { status: 500 })
  }

  const orcamentoId = orcamento.id

  // 2. Inserir itens
  const itensParaInserir = itens.map((i: any, idx: number) => ({
    id: crypto.randomUUID(),
    orcamento_id: orcamentoId,
    produto_id: i.produto_id || null,
    sku: i.sku || null,
    nome_produto: i.nome_produto || "Material",
    unidade: i.unidade || "sc",
    quantidade: Number(i.quantidade || 1),
    preco_tabela: Number(i.preco_tabela || i.preco_aplicado || 0),
    preco_aplicado: Number(i.preco_aplicado || 0),
    tipo_preco: i.tipo_preco || "avulso",
    ordem: idx + 1,
  }))

  const { error: iErr } = await supabase.from("orcamento_itens").insert(itensParaInserir)
  if (iErr) {
    console.error("[criar-publico] Erro ao inserir itens:", iErr.message)
    return NextResponse.json({ error: "Erro ao salvar itens do orçamento." }, { status: 500 })
  }

  const redirectUrl = `/orcamento/${codigo}?t=${token_acesso}`

  return NextResponse.json(
    {
      success: true,
      codigo,
      token_acesso,
      redirectUrl,
      total,
      subtotal: subtotalMateriais,
      desconto_pix,
      valor_frete: Number(valor_frete) || 0,
    },
    { status: 201 }
  )
}
