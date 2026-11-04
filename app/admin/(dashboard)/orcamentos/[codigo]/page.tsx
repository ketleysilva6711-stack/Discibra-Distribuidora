"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, FileText, MessageCircle, Printer, Package, Truck } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { toast } from "sonner"

const supabase = createAdminClient()

const brl = (n: number) =>
  "R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  negociando: "Negociando",
  aprovado: "Aprovado",
  separando: "Separando",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "rascunho", label: "Rascunho", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "enviado", label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "negociando", label: "Negociando", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "aprovado", label: "Aprovado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "separando", label: "Separando", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "em_transporte", label: "Em Transporte", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "entregue", label: "Entregue", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
]

export default function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const router = useRouter()
  const [codigo, setCodigo] = useState<string>("")

  const [orcamento, setOrcamento] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [auditoria, setAuditoria] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [observacao, setObservacao] = useState("")

  useEffect(() => {
    params.then((p) => setCodigo(p.codigo))
  }, [])

  useEffect(() => {
    if (!codigo) return
    fetchOrcamento()
  }, [codigo])

  async function fetchOrcamento() {
    setLoading(true)
    try {
      const [oRes, iRes, aRes] = await Promise.all([
        supabase.from("orcamentos").select("*").eq("codigo", codigo).maybeSingle(),
        supabase.from("orcamento_itens").select("*").eq("orcamento_id", codigo).order("ordem", { ascending: true }),
        supabase.from("orcamento_auditoria").select("*").eq("orcamento_id", codigo).order("criado_em", { ascending: true }),
      ])

      if (oRes.error) throw oRes.error
      setOrcamento(oRes.data)
      setItens(iRes.data || [])
      setAuditoria(aRes.data || [])
      setStatus(oRes.data?.status || "")
      setPixKey(oRes.data?.pix_key || "")
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar orçamento")
    } finally {
      setLoading(false)
    }
  }

  const totalItens = itens.reduce((s, i) => s + Number(i.preco_aplicado) * Number(i.quantidade), 0)
  const pesoTotalKg = itens.reduce((s, i) => s + Number(i.peso_total_kg || 0), 0)
  const pesoTons = pesoTotalKg >= 1000 ? `${(pesoTotalKg / 1000).toFixed(1)} t` : `${pesoTotalKg.toLocaleString("pt-BR")} kg`

  async function handleSaveStatus() {
    setSaving(true)
    try {
      const { error: uErr } = await supabase
        .from("orcamentos")
        .update({ status })
        .eq("codigo", codigo)
      if (uErr) throw uErr

      const { error: aErr } = await supabase.from("orcamento_auditoria").insert({
        orcamento_id: codigo,
        status_anterior: orcamento?.status || null,
        status_novo: status,
        observacao: observacao.trim() || null,
      })
      if (aErr) throw aErr

      toast.success("Status atualizado com auditoria registrada")
      setObservacao("")
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar status")
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePix() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ pix_key: pixKey.trim() || null })
        .eq("codigo", codigo)
      if (error) throw error
      toast.success("Chave PIX atualizada")
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar PIX")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !orcamento) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Clock className="h-8 w-8 animate-spin text-slate-400 mb-2" />
        <p className="text-slate-500">Carregando orçamento...</p>
      </div>
    )
  }

  const statusBadge = STATUS_OPTIONS.find((s) => s.value === orcamento.status) || STATUS_OPTIONS[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E3] pb-4 bg-white p-6 rounded-[4px]">
        <div className="flex items-center gap-3">
          <Link href="/admin/orcamentos" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] border border-[#E5E5E3] bg-[#FAFAF9]">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orçamento</span>
            <span className="text-sm font-bold text-[#111318]">{orcamento.codigo}</span>
          </div>
          <span className={`px-3 py-0.5 rounded-[4px] text-[10px] font-bold ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={`/orcamento/${orcamento.codigo}?t=${orcamento.token_acesso}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[4px] border border-[#E5E5E3] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#FAFAF9] transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Visualizar Proposta
          </a>
          <a
            href={`https://wa.me/${orcamento.cliente_telefone?.replace(/\D/g, "") || ""}?text=Ol%C3%A1!+Segue+seu+or%C3%A7amento+${orcamento.codigo}+da+Discibra.` + (orcamento.total ? `+Total:+R$+${Number(orcamento.total).toFixed(2)}` : "")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[4px] bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp do Cliente
          </a>
        </div>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Esquerda: Cliente + Itens + Financeiro */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dados do Cliente */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Dados do Cliente e Entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Nome</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_nome}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_telefone || "—"}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">E-mail</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_email || "—"}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Logradouro</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_logradouro || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Número</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_numero || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Complemento</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_complemento || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Bairro</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_bairro || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Cidade / UF</p>
                <p className="text-sm font-medium text-slate-900">
                  {orcamento.endereco_cidade || "—"} / {orcamento.endereco_uf || "—"}
                </p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">CEP</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_cep || "—"}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E5E5E3]">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Modalidade</p>
              <p className="text-sm text-slate-700">
                {orcamento.metodo_entrega === "retirada" ? "Retirada no CD (Ribeirão Preto/SP)" : "Entrega no endereço informado"}
                {orcamento.requer_munck ? " · Munck necessário" : ""}
              </p>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
            <div className="border-b border-[#E5E5E3] bg-[#FAFAF9] px-5 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Materiais Cotados</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E3] text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2.5">Produto</th>
                  <th className="px-4 py-2.5 w-16 text-center">SKU</th>
                  <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                  <th className="px-4 py-2.5 w-20 text-right">Preço Unit.</th>
                  <th className="px-4 py-2.5 w-20 text-center">Tipo</th>
                  <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                  <th className="px-4 py-2.5 w-16 text-center">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {itens.map((i) => {
                  const sub = Number(i.preco_aplicado) * Number(i.quantidade)
                  const tipoLabel = i.tipo_preco === "palete" ? "Palete" : i.tipo_preco === "carga_fechada" ? "Carga Fechada" : "Avulso"
                  return (
                    <tr key={i.id} className="hover:bg-[#FAFAF9]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{i.nome_produto}</div>
                        {i.sku && <div className="text-[10px] text-slate-500 mt-0.5">{i.sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{i.sku || "—"}</td>
                      <td className="px-4 py-3 text-center">{Number(i.quantidade).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right">{brl(Number(i.preco_aplicado))}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold ${
                          i.tipo_preco === "palete"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : i.tipo_preco === "carga_fechada"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-[#FAFAF9] text-slate-600 border-[#E5E5E3]"
                        }`}>
                          {tipoLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{brl(sub)}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-mono">
                        {Number(i.peso_total_kg || 0).toLocaleString("pt-BR")} kg
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Resumo Financeiro</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal Materiais</span>
                <span className="font-medium text-slate-900">{brl(totalItens)}</span>
              </div>
              {Number(orcamento.desconto_pix || 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto PIX (3%)</span>
                  <span className="font-semibold">- {brl(Number(orcamento.desconto_pix))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete</span>
                <span className="font-medium text-slate-900">
                  {Number(orcamento.valor_frete || 0) === 0 ? "Grátis" : brl(Number(orcamento.valor_frete))}
                </span>
              </div>
              <div className="border-t border-[#E5E5E3] pt-3 mt-2 flex justify-between font-bold">
                <span className="text-sm">TOTAL GERAL</span>
                <span className="text-base font-black text-[#C2410C]">{brl(Number(orcamento.total || 0))}</span>
              </div>
            </div>

            {/* PIX */}
            <div className="mt-5 pt-4 border-t border-[#E5E5E3] rounded-[4px] border border-amber-100 bg-amber-50 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Chave PIX da Transação</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="ex: financeiro@discibra.com"
                  className="flex-1 rounded-[4px] border border-amber-200 px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                />
                <button
                  onClick={handleSavePix}
                  disabled={saving}
                  className="rounded-[4px] bg-[#15803D] px-3 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Direita: Mudança de Status + Auditoria */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mudança de Status */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Alterar Status</h2>
            <div className="space-y-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2.5 text-sm outline-none focus:border-[#15803D]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observação</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                  className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm outline-none focus:border-[#15803D]"
                  placeholder="Ex: Pagamento confirmado via PIX"
                />
              </div>
              <button
                onClick={handleSaveStatus}
                disabled={saving || status === orcamento.status}
                className="w-full rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar Status"}
              </button>
            </div>
          </div>

          {/* Timeline de Auditoria */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Linha do Tempo de Auditoria</h2>
            <div className="space-y-3">
              {auditoria.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sem alterações de status registradas.</p>
              ) : (
                auditoria.slice().reverse().map((a, i) => (
                  <div key={i} className="relative pl-4 pb-3">
                    <div className="absolute left-0 top-1 w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold ${
                        a.status_novo === "entregue" ? "bg-green-100 text-green-700" :
                        a.status_novo === "cancelado" ? "bg-red-100 text-red-700" :
                        a.status_novo === "aprovado" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {STATUS_LABELS[a.status_novo] || a.status_novo}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(a.criado_em).toLocaleString("pt-BR")}</span>
                    </div>
                    {a.status_anterior !== null && (
                      <p className="text-xs text-slate-500 ml-6">
                        De: <span className="font-medium">{STATUS_LABELS[a.status_anterior] || a.status_anterior}</span>
                      </p>
                    )}
                    {a.observacao && (
                      <p className="text-xs text-slate-700 ml-6 italic">"{a.observacao}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
