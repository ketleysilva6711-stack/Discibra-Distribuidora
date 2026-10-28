"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { FileText, Plus, Search, Trash2, Printer, ChevronRight, Clock, CheckCircle2, XCircle, MessageCircle } from "lucide-react"
import { toast } from "sonner"

const supabaseFetch = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-600" },
  sent: { label: "Enviado", color: "bg-blue-100 text-blue-700" },
  negotiating: { label: "Negociacao", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700" },
  converted: { label: "Convertido", color: "bg-green-100 text-green-700" },
  lost: { label: "Perdido", color: "bg-red-100 text-red-700" },
}

export default function OrcamentosPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openModal, setOpenModal] = useState(false)
  const [leadName, setLeadName] = useState("")
  const [leadPhone, setLeadPhone] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/orcamentos", window.location.origin)
      if (search) url.searchParams.set("q", search)
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter)
      const json = await supabaseFetch(url.toString())
      setQuotations(json.quotations || [])
    } catch (e) {
      toast.error("Erro ao carregar orcamentos")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [search, statusFilter])

  const totalQuotes = quotations.length
  const totalValue = quotations.reduce((s, q) => {
    const items = q.quotation_items || []
    const subBruto = items.reduce((acc: number, i: any) => acc + Number(i.unit_price) * Number(i.qty), 0)
    const descItens = items.reduce(
      (acc: number, i: any) => acc + Number(i.unit_price) * Number(i.qty) * (Number(i.discount_pct) / 100),
      0,
    )
    const subLiq = subBruto - descItens
    const descGlobal = subLiq * (Number(q.discount_pct) / 100)
    const frete = Number(q.shipping_value) || 0
    return s + subLiq - descGlobal + frete
  }, 0)
  const drafts = quotations.filter((q) => q.status === "draft").length
  const approvedOrSent = quotations.filter((q) => q.status === "approved" || q.status === "sent").length

  async function handleCreate() {
    if (!leadName.trim()) {
      toast.error("Nome do cliente e obrigatorio")
      return
    }
    setCreating(true)
    try {
      let leadId: string | null = null
      if (leadPhone.trim()) {
        const searchRes = await supabaseFetch(
          `/api/leads?q=${encodeURIComponent(leadPhone.trim())}`,
        )
        const existing = (searchRes.leads || []).find((l: any) => l.phone === leadPhone.trim())
        if (existing) {
          leadId = existing.id
        } else {
          const created = await supabaseFetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: leadName.trim(), phone: leadPhone.trim() }),
          })
          leadId = created.lead.id
        }
      } else {
        const created = await supabaseFetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: leadName.trim() }),
        })
        leadId = created.lead.id
      }

      const createdQ = await supabaseFetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      })
      setOpenModal(false)
      setLeadName("")
      setLeadPhone("")
      toast.success("Orcamento criado")
      window.location.href = `/admin/orcamentos/${createdQ.quotation.id}`
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar orcamento")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este orcamento?")) return
    try {
      await supabaseFetch(`/api/orcamentos/${id}`, { method: "DELETE" })
      toast.success("Orcamento excluido")
      fetchQuotations()
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir")
    }
  }

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      !search ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_leads?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_leads?.phone?.includes(search)
    const matchesStatus = statusFilter === "all" || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-5">
      {/* Barra de acoes */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar codigo ORC, cliente ou telefone..."
            className="w-full sm:w-80 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviado</option>
            <option value="negotiating">Negociacao</option>
            <option value="approved">Aprovado</option>
            <option value="converted">Convertido</option>
            <option value="lost">Perdido</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#12A06A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0e8a5b]"
          >
            <Plus className="h-4 w-4" /> Novo orcamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 uppercase">Total de orcamentos</p>
          <p className="text-2xl font-black text-slate-900">{totalQuotes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 uppercase">Em rascunho</p>
          <p className="text-2xl font-black text-slate-600">{drafts}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 uppercase">Aprovados / Enviados</p>
          <p className="text-2xl font-black text-emerald-600">{approvedOrSent}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 uppercase">Valor total</p>
          <p className="text-2xl font-black text-[#C2410C]">{brl(totalValue)}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 w-24">Codigo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 w-20">Status</th>
              <th className="px-4 py-3 w-32 text-right">Total</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 w-32 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Nenhum orcamento encontrado.
                </td>
              </tr>
            )}
            {filtered.map((q) => (
              <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{q.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{q.quotation_leads?.name || q.quotation_leads?.cliente || "—"}</div>
                  <div className="text-xs text-slate-500">{q.quotation_leads?.phone || q.quotation_leads?.telefone || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${badgeColor(q.status)}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{brl(totalValue(q))}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(q.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/orcamentos/${q.id}`}
                      title="Abrir orcamento"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <a
                      href={`/api/orcamentos/${q.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Gerar PDF"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Printer className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Excluir"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal novo orcamento */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-slate-900">Novo orcamento</h3>
              <button onClick={() => setOpenModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do cliente *</label>
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Nome ou empresa"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp</label>
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="(16) 99999-9999"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-[#12A06A] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0e8a5b] disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar orcamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function badgeColor(status: string): string {
  switch (status) {
    case "approved": return "bg-emerald-100 text-emerald-700"
    case "sent": return "bg-blue-100 text-blue-700"
    case "negotiating": return "bg-amber-100 text-amber-700"
    case "converted": return "bg-green-100 text-green-700"
    default: return "bg-slate-100 text-slate-600"
  }
}
