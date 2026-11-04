"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Clock, Truck, ArrowRight, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const supabase = createClient()

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

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-slate-100 text-slate-600 border-slate-200",
  enviado: "bg-blue-100 text-blue-700 border-blue-200",
  negociando: "bg-amber-100 text-amber-700 border-amber-200",
  aprovado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  separando: "bg-indigo-100 text-indigo-700 border-indigo-200",
  em_transporte: "bg-purple-100 text-purple-700 border-purple-200",
  entregue: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
}

const TABS: { key: string; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "enviado", label: "Enviadas / Em Aberto" },
  { key: "negociando", label: "Negociando" },
  { key: "aprovado", label: "Aprovadas (Aguardando Pagamento)" },
  { key: "entregue", label: "Concluidas / Entregues" },
  { key: "cancelado", label: "Canceladas" },
]

function slaBadge(prazoRespostaEm: string | null, primeiraRespostaEm: string | null): {
  label: string
  cls: string
} {
  const now = new Date()
  if (primeiraRespostaEm) {
    return { label: "Respondido", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  }
  if (!prazoRespostaEm) {
    return { label: "Sem prazo", cls: "bg-slate-100 text-slate-600 border-slate-200" }
  }
  const prazo = new Date(prazoRespostaEm)
  if (prazo < now) {
    return { label: "SLA Vencido", cls: "bg-red-100 text-red-700 border-red-200 animate-pulse" }
  }
  return { label: "Dentro do prazo", cls: "bg-amber-100 text-amber-700 border-amber-200" }
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [pixModalOpen, setPixModalOpen] = useState(false)
  const [pixOrcamentoId, setPixOrcamentoId] = useState<string | null>(null)
  const [pixKey, setPixKey] = useState("")
  const [savingPix, setSavingPix] = useState(false)

  useEffect(() => {
    fetchOrcamentos()
  }, [search, statusFilter])

  async function fetchOrcamentos() {
    setLoading(true)
    try {
      let query = supabase
        .from("orcamentos")
        .select("*, orcamento_itens(*), clientes(nome, telefone, total_orcamentos, receita_total)")
        .order("criado_em", { ascending: false })

      if (statusFilter !== "todos") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let list = (data || []) as any[]

      if (search.trim()) {
        const term = search.trim().toLowerCase()
        list = list.filter(
          (o) =>
            String(o.codigo || "").toLowerCase().includes(term) ||
            String(o.cliente_nome || "").toLowerCase().includes(term) ||
            String(o.cliente_telefone || "").toLowerCase().includes(term)
        )
      }

      setOrcamentos(list)
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const all = orcamentos
    return {
      todos: all.length,
      enviado: all.filter((o) => o.status === "enviado").length,
      negociando: all.filter((o) => o.status === "negociando").length,
      aprovado: all.filter((o) => o.status === "aprovado").length,
      entregue: all.filter((o) => o.status === "entregue").length,
      cancelado: all.filter((o) => o.status === "cancelado").length,
    }
  }, [orcamentos])

  const openPixModal = (id: string, currentKey: string | null) => {
    setPixOrcamentoId(id)
    setPixKey(currentKey || "")
    setPixModalOpen(true)
  }

  async function savePix() {
    if (!pixOrcamentoId) return
    setSavingPix(true)
    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ pix_key: pixKey.trim() || null })
        .eq("id", pixOrcamentoId)
      if (error) throw error
      toast.success("Chave PIX atualizada")
      setPixModalOpen(false)
      fetchOrcamentos()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar chave PIX")
    } finally {
      setSavingPix(false)
    }
  }

  const waLink = (phone: string, codigo: string, nome: string, total: number) => {
    const clean = phone.replace(/\D/g, "")
    const msg = `Olá! Segue o orçamento *${codigo}* da Discibra para ${nome}, no total de *${brl(
      total
    )}*. Acesse: ${window.location.origin}/orcamento/${codigo}`
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
  }

  const pesoTons = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
    return `${kg.toLocaleString("pt-BR")} kg`
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-center space-x-2 text-slate-500">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Carregando orçamentos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E3] pb-6 bg-white p-6 rounded-[4px]">
        <div>
          <h1 className="text-xl font-bold text-[#111318]">Orçamentos</h1>
          <p className="text-sm text-slate-500">Gerencie cotações e propostas comerciais</p>
        </div>
        <Link
          href="/admin/orcamentos/novo"
          className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#166534] transition-colors"
        >
          <Package className="h-4 w-4" /> Novo Orçamento
        </Link>
      </div>

      {/* Abas de status com contadores */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.key
          const count = counts[tab.key as keyof typeof counts] ?? 0
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-[4px] text-xs font-bold border transition-colors ${isActive ? "bg-[#15803D] border-[#15803D] text-white" : "border-[#E5E5E3] bg-[#FAFAF9] text-slate-600 hover:border-[#15803D]"}`}
            >
              {tab.label} <span className="ml-1 opacity-80">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar código, cliente ou telefone..."
          className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#15803D]"
        />
      </div>

      {/* Tabela */}
      <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E3] bg-[#FAFAF9] text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente / WhatsApp</th>
              <th className="px-4 py-3">Visualização</th>
              <th className="px-4 py-3">SLA Resposta</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Peso</th>
              <th className="px-4 py-3 text-right">Valor Total</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {orcamentos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              orcamentos.map((o) => {
                const visualizado = !!o.visualizado_em
                const pesoKg = Number(o.peso_total_kg || 0)
                const requerMunck = o.requer_munck
                const methods = o.metodo_entrega === "retirada" ? "Retirada no CD" : "Entrega"
                const deliveryLabel = requerMunck ? `${methods} (Munck)` : methods
                const statusLabel = STATUS_LABELS[o.status] || o.status
                const badgeClass = STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"
                const sla = slaBadge(o.prazo_resposta_em, o.primeira_resposta_em)
                const cliente = o.clientes?.[0] || {}

                return (
                  <tr key={o.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/orcamentos/${o.codigo}`}
                        className="font-mono font-bold text-[#111318] hover:text-[#C2410C] transition-colors"
                      >
                        {o.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#111318]">{o.cliente_nome}</div>
                      <div className="text-xs text-slate-500">{o.cliente_telefone}</div>
                      {cliente.total_orcamentos && cliente.total_orcamentos > 1 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {cliente.total_orcamentos} orçamentos
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${visualizado ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {visualizado ? "Visualizado" : "Não aberto"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${sla.cls}`}>
                        {sla.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm text-slate-700">{deliveryLabel}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-slate-600">{pesoTons(pesoKg)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#111318]">
                      {brl(Number(o.total || 0))}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={waLink(o.cliente_telefone || "", o.codigo, o.cliente_nome, Number(o.total || 0))}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                          className="p-1.5 text-slate-400 hover:text-[#25D366] transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => openPixModal(o.id, o.pix_key || null)}
                          title="Liberar / Editar Chave PIX"
                          className="p-1.5 text-slate-400 hover:text-[#15803D] transition-colors"
                        >
                          <CreditCardIcon className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/orcamento/${o.codigo}?t=${o.token_acesso}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visualizar Proposta"
                          className="p-1.5 text-slate-400 hover:text-[#15803D] transition-colors"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal PIX */}
      {pixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[4px] border border-[#E5E5E3] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-4">
              <h3 className="font-bold text-[#111318] text-sm">Chave PIX da Transação</h3>
              <button
                onClick={() => setPixModalOpen(false)}
                className="text-slate-400 hover:text-[#111318]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Insira a chave PIX exclusiva desta transação. O cliente receberá a confirmação pelo WhatsApp.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1">Chave PIX *</label>
                <input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="ex: financeiro@discibra.com"
                  className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm font-mono text-[#111318] outline-none focus:border-[#15803D]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-[#E5E5E3] pt-4">
              <button
                onClick={() => setPixModalOpen(false)}
                className="rounded-[4px] border border-[#E5E5E3] px-4 py-2 text-xs font-bold text-[#111318] hover:bg-[#FAFAF9]"
              >
                Cancelar
              </button>
              <button
                onClick={savePix}
                disabled={savingPix}
                className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-5 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
              >
                {savingPix ? "Salvando..." : "Salvar Chave PIX"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11H7a4 4 0 00-4 8h4a2 2 0 012-2h10a2 2 0 002-2v-6a2 2 0 10-4 0h-4a2 2 0 01-2-2z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.19 8.688a4 4 0 013.202 3.202M8.125 13.2A4 4 0 014.929 6.09l9.533 6.888a2 2 0 011.306 1.306 4 4 0 01-2.646 2.646 2 2 0 01-1.306 1.306l-6.888-9.533a4 4 0 010-5.202z" />
    </svg>
  )
}
