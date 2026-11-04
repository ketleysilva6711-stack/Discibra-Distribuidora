"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import { toast } from "sonner"
import { Search, Phone, ArrowLeft, Plus, Trash2, Truck, MapPin, CreditCard, FileText, User, Clock, Minus } from "lucide-react"

const supabase = createAdminClient()

const brl = (n: number) =>
  "R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function normalizarTelefone(v: string): string {
  let d = v.replace(/\D/g, "")
  if (d.startsWith("55") && d.length > 11) d = d.slice(2)
  return d
}

function telefoneValido(v: string): boolean {
  const d = normalizarTelefone(v)
  if (d.length < 10 || d.length > 11) return false
  const dddNum = Number(d.slice(0, 2))
  if (dddNum < 11 || dddNum > 99) return false
  const parteLocal = d.slice(2)
  if (parteLocal.length === 9) return /^9[0-9]{8}$/.test(parteLocal)
  return /^[2-5][0-9]{7}$/.test(parteLocal)
}

function formatarTelefone(v: string): string {
  const d = normalizarTelefone(v)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export default function NovoOrcamentoPage() {
  const [clienteTelefone, setClienteTelefone] = useState("")
  const [clienteNome, setClienteNome] = useState("")
  const [clienteRecorrente, setClienteRecorrente] = useState<{ total_orcamentos: number; receita_total: number } | null>(null)
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  const [itens, setItens] = useState<Array<{
    id: string
    produto_id: string
    nome: string
    sku: string | null
    quantidade: number
    preco_tabela: number
    preco_aplicado: number
    tipo_preco: string
    subtotal: number
  }>>([])
  const [buscaProduto, setBuscaProduto] = useState("")
  const [resultadosProduto, setResultadosProduto] = useState<any[]>([])
  const [buscandoProduto, setBuscandoProduto] = useState(false)

  const [metodoEntrega, setMetodoEntrega] = useState<"entrega" | "retirada">("entrega")
  const [cep, setCep] = useState("")
  const [endereco, setEndereco] = useState({ logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "SP" })
  const [valorFreteManual, setValorFreteManual] = useState("0")
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "cartao">("pix")
  const [observacoes, setObservacoes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // ── Buscar cliente por telefone ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      const telLimpo = normalizarTelefone(clienteTelefone)
      if (telLimpo.length < 10) {
        setClienteNome("")
        setClienteRecorrente(null)
        return
      }
      setBuscandoCliente(true)
      try {
        const { data } = await supabase.from("clientes").select("*").eq("telefone", telLimpo).maybeSingle()
        if (data) {
          setClienteNome(data.nome || "")
          setClienteRecorrente({ total_orcamentos: data.total_orcamentos || 0, receita_total: data.receita_total || 0 })
        } else {
          setClienteNome("")
          setClienteRecorrente(null)
        }
      } catch {
        setClienteNome("")
        setClienteRecorrente(null)
      } finally {
        setBuscandoCliente(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [clienteTelefone])

  // ── Buscar produtos ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!buscaProduto.trim()) {
        setResultadosProduto([])
        return
      }
      setBuscandoProduto(true)
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, sku, price, preco_avulso, preco_palete, preco_carga_fechada, weight, unit, stock, active, image_url")
          .ilike("name", `%${buscaProduto.trim()}%`)
          .eq("active", true)
          .limit(10)
        setResultadosProduto(data || [])
      } catch {
        setResultadosProduto([])
      } finally {
        setBuscandoProduto(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [buscaProduto])

  // ── Calcular totais ──
  const subtotalMateriais = itens.reduce((s, i) => s + i.subtotal, 0)
  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0)
  const freteManual = Number(valorFreteManual || 0)
  const descontoPix = formaPagamento === "pix" ? Math.round(subtotalMateriais * 0.03 * 100) / 100 : 0
  const total = subtotalMateriais - descontoPix + freteManual

  // ── Adicionar item ──
  function adicionarProduto(p: any) {
    const existente = itens.find((i) => i.produto_id === p.id)
    if (existente) {
      setItens(itens.map((i) => (i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i)))
    } else {
      const precoAvulso = Number(p.preco_avulso || p.price || 0)
      setItens([...itens, {
        id: crypto.randomUUID(),
        produto_id: p.id,
        nome: p.name,
        sku: p.sku || null,
        quantidade: 1,
        preco_tabela: precoAvulso,
        preco_aplicado: precoAvulso,
        tipo_preco: "avulso",
        subtotal: precoAvulso,
      }])
    }
    setBuscaProduto("")
    setResultadosProduto([])
  }

  function atualizarQuantidade(id: string, delta: number) {
    setItens(itens.map((i) => {
      if (i.id !== id) return i
      const novaQty = Math.max(1, i.quantidade + delta)
      const precoBase = i.preco_tabela
      let precoAplicado = precoBase
      if (novaQty >= 560) precoAplicado = Math.round(precoBase * 0.9506 * 100) / 100
      else if (novaQty >= 40) precoAplicado = Math.round(precoBase * 0.97 * 100) / 100
      return { ...i, quantidade: novaQty, preco_aplicado: precoAplicado, subtotal: precoAplicado * novaQty }
    }))
  }

  function removerItem(id: string) {
    setItens(itens.filter((i) => i.id !== id))
  }

  // ── Salvar orçamento ──
  async function salvarOrcamento() {
    if (!clienteNome.trim()) {
      toast.error("Informe o nome do cliente.")
      return
    }
    if (itens.length === 0) {
      toast.error("Adicione pelo menos 1 item.")
      return
    }
    setSubmitting(true)
    try {
      const orcamentoId = crypto.randomUUID()
      const codigo = "ORC-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 34)]).join("")

      // 1. Obter ou criar cliente
      const telLimpo = normalizarTelefone(clienteTelefone)
      let clienteId: string
      const { data: existente } = await supabase.from("clientes").select("id, total_orcamentos").eq("telefone", telLimpo).maybeSingle()
      if (existente) {
        clienteId = existente.id
        await supabase.from("clientes").update({ total_orcamentos: ((existente.total_orcamentos || 0) + 1), atualizado_em: new Date().toISOString() }).eq("id", existente.id)
      } else {
        const { data: novo } = await supabase.from("clientes").insert({
          telefone: telLimpo,
          nome: clienteNome.trim(),
          aceita_whatsapp: true,
          total_orcamentos: 1,
          total_aprovados: 0,
          receita_total: 0,
        }).select("id").single()
        clienteId = novo!.id
      }

      // 2. Inserir orçamento
      const { data: orcData, error: oErr } = await supabase.from("orcamentos").insert({
        codigo,
        cliente_id: clienteId,
        cliente_nome: clienteNome.trim(),
        cliente_telefone: telLimpo,
        cliente_email: null,
        endereco_cep: metodoEntrega === "entrega" ? cep.replace(/\D/g, "") || null : null,
        endereco_logradouro: metodoEntrega === "entrega" ? endereco.logradouro.trim() || null : null,
        endereco_numero: metodoEntrega === "entrega" ? endereco.numero.trim() || null : null,
        endereco_complemento: endereco.complemento.trim() || null,
        endereco_bairro: metodoEntrega === "entrega" ? endereco.bairro.trim() || null : null,
        endereco_cidade: metodoEntrega === "entrega" ? endereco.cidade.trim() || null : null,
        endereco_uf: metodoEntrega === "entrega" ? (endereco.uf || "SP").toUpperCase() : null,
        metodo_entrega: metodoEntrega,
        distancia_km: null,
        requer_munck: false,
        subtotal: subtotalMateriais,
        desconto_volume: 0,
        desconto_pix: descontoPix,
        valor_frete: freteManual,
        frete_a_confirmar: false,
        total,
        forma_pagamento: formaPagamento,
        parcelas_cartao: 1,
        status: "enviado",
        peso_total_kg: 0,
        ip_origem: null,
        idempotency_key: crypto.randomUUID(),
        consentimento_lgpd: true,
        observacoes: observacoes.trim() || null,
      }).select("id, codigo, token_acesso").single()

      if (oErr) throw oErr

      // 3. Inserir itens
      const itensParaInserir = itens.map((i, idx) => ({
        id: crypto.randomUUID(),
        orcamento_id: orcData.id,
        produto_id: i.produto_id,
        sku: i.sku,
        nome_produto: i.nome,
        unidade: "sc",
        quantidade: i.quantidade,
        preco_tabela: i.preco_tabela,
        preco_aplicado: i.preco_aplicado,
        tipo_preco: i.tipo_preco,
        ordem: idx + 1,
      }))
      const { error: iErr } = await supabase.from("orcamento_itens").insert(itensParaInserir)
      if (iErr) throw iErr

      // 4. Auditoria
      await supabase.from("orcamento_auditoria").insert({
        orcamento_id: orcData.id,
        status_anterior: null,
        status_novo: "enviado",
        observacao: "Orçamento criado manualmente no balcão",
      })

      // 5. WhatsApp
      const telCliente = clienteTelefone ? `55${normalizarTelefone(clienteTelefone)}` : ""
      const msg = `Olá! Seu orçamento ${codigo} da Discibra está pronto. Total: ${brl(total)}. Acesse: ${typeof window !== "undefined" ? window.location.origin : ""}/orcamento/${codigo}?t=${orcData.token_acesso}`
      if (telCliente) {
        window.open(`https://wa.me/${telCliente}?text=${encodeURIComponent(msg)}`, "_blank")
      }

      toast.success(`Orçamento ${codigo} criado com sucesso!`)
      window.location.href = `/admin/orcamentos/${codigo}`
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar orçamento")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitting) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Clock className="h-8 w-8 animate-spin text-slate-400 mb-2" />
        <p className="text-slate-500">Salvando orçamento...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E3] pb-6 bg-white p-6 rounded-[4px]">
        <div>
          <h1 className="text-xl font-bold text-[#111318]">Nova Cotação / Orçamento Manual</h1>
          <p className="text-sm text-slate-500">Emissão de orçamento para balcão e atendimento telefônico</p>
        </div>
        <Link
          href="/admin/orcamentos"
          className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#E5E5E3] px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-[#FAFAF9] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Orçamentos
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda: Cliente + Materiais */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cliente */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">1. Dados do Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">WhatsApp / Telefone *</label>
                <input
                  type="text"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value.replace(/\D/g, ""))}
                  placeholder="(16) 99999-9999"
                  className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                />
                {buscandoCliente && <p className="text-[10px] text-slate-400 mt-1">Buscando cliente...</p>}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setClienteNome("Cliente Balcão")
                    setClienteTelefone("00000000000")
                    setClienteRecorrente(null)
                  }}
                  className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#F5F5F4] transition-colors"
                >
                  <User className="h-3.5 w-3.5 mr-1" /> Cliente Balcão / Avulso
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="João Silva"
                className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
              />
            </div>
            {clienteRecorrente && (
              <div className="mt-3 rounded-[4px] bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-bold text-emerald-800 mb-1">Cliente Recorrente</p>
                <p className="text-[10px] text-emerald-700">
                  Total de orçamentos: {clienteRecorrente.total_orcamentos} · Receita: {brl(clienteRecorrente.receita_total)}
                </p>
              </div>
            )}
          </div>

          {/* Materiais */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">2. Materiais</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Buscar produto por nome ou SKU..."
                className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#15803D]"
              />
              {buscandoProduto && <p className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">Buscando...</p>}
            </div>
            {resultadosProduto.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-60 overflow-y-auto rounded-[4px] border border-[#E5E5E3] bg-white shadow-lg divide-y divide-[#E5E5E3]">
                {resultadosProduto.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => adicionarProduto(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#FAFAF9] border-b border-[#E5E5E3] last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.sku || "Sem SKU"} · {p.unit || "un"} · Estoque: {p.stock}</div>
                    </div>
                    <Plus className="h-4 w-4 text-[#15803D]" />
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E3] text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#FAFAF9]">
                    <th className="px-4 py-2.5">Produto</th>
                    <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                    <th className="px-4 py-2.5 w-20 text-right">Preço Unit.</th>
                    <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E3]">
                  {itens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        Nenhum item adicionado. Busque um produto acima.
                      </td>
                    </tr>
                  ) : (
                    itens.map((i) => (
                      <tr key={i.id} className="hover:bg-[#FAFAF9]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 text-sm">{i.nome}</div>
                          {i.sku && <div className="text-[10px] text-slate-500 mt-0.5">{i.sku}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => atualizarQuantidade(i.id, -1)}
                              className="p-1 text-[#111318] hover:bg-white"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-semibold">{i.quantidade}</span>
                            <button
                              type="button"
                              onClick={() => atualizarQuantidade(i.id, 1)}
                              className="p-1 text-[#111318] hover:bg-white"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{brl(i.preco_aplicado)}</td>
                        <td className="px-4 py-3 text-right font-bold">{brl(i.subtotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removerItem(i.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coluna direita: Logística + Resumo */}
        <div className="lg:col-span-4 space-y-6">
          {/* Logística */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">3. Logística</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={metodoEntrega === "retirada"}
                  onChange={() => setMetodoEntrega("retirada")}
                  className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                />
                <span className="text-sm font-medium text-slate-700">Retirada no CD (Ribeirão Preto - Grátis)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={metodoEntrega === "entrega"}
                  onChange={() => setMetodoEntrega("entrega")}
                  className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                />
                <span className="text-sm font-medium text-slate-700">Entrega no Endereço</span>
              </div>
            </div>
            {metodoEntrega === "entrega" && (
              <div className="mt-3 space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ""))}
                    placeholder="00000-000"
                    className="w-full h-10 pl-10 pr-4 rounded-[4px] border border-[#E5E5E3] bg-white font-mono text-sm outline-none focus:border-[#15803D]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Número *</label>
                    <input
                      type="text"
                      id="input-endereco-numero"
                      value={endereco.numero}
                      onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                      className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Complemento</label>
                    <input
                      type="text"
                      value={endereco.complemento}
                      onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                      className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm outline-none focus:border-[#15803D]"
                    />
                  </div>
                </div>
                <div className="mt-2 p-2 rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] text-[10px] text-slate-500">
                  Endereço preenchido automaticamente via CEP. Informe apenas o Número.
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Valor do Frete (R$)</label>
                  <input
                    type="text"
                    value={valorFreteManual}
                    onChange={(e) => setValorFreteManual(e.target.value.replace(/[^0-9,]/g, "").replace(",", "."))}
                    placeholder="0,00"
                    className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Forma de Pagamento</h2>
            <div className="space-y-2">
              <label className="cursor-pointer block rounded-[4px] p-3 border border-[#E5E5E3] hover:bg-[#FAFAF9] transition">
                <input
                  type="radio"
                  checked={formaPagamento === "pix"}
                  onChange={() => setFormaPagamento("pix")}
                  className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">PIX (3% de desconto)</span>
              </label>
              <label className="cursor-pointer block rounded-[4px] p-3 border border-[#E5E5E3] hover:bg-[#FAFAF9] transition">
                <input
                  type="radio"
                  checked={formaPagamento === "cartao"}
                  onChange={() => setFormaPagamento("cartao")}
                  className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">Cartão de Crédito</span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Observações</h2>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Observações para o cliente..."
              className="w-full h-24 rounded-[4px] border border-[#E5E5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#15803D]"
            />
          </div>

          {/* Resumo + Botão */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{brl(subtotalMateriais)}</span>
              </div>
              {descontoPix > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto PIX (3%)</span>
                  <span className="font-semibold">- {brl(descontoPix)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete</span>
                <span className="font-medium text-slate-900">{brl(freteManual)}</span>
              </div>
              <div className="border-t border-[#E5E5E3] pt-3 flex justify-between font-bold">
                <span className="text-sm">TOTAL</span>
                <span className="text-base font-black text-[#C2410C]">{brl(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={salvarOrcamento}
              disabled={submitting || itens.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {submitting ? "Salvando..." : "Salvar e Enviar no WhatsApp"}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.info("Funcionalidade de rascunho será implementada em breve.")
              }}
              className="w-full mt-2 rounded-[4px] border border-[#E5E5E3] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#FAFAF9] transition-colors"
            >
              Salvar como Rascunho
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
