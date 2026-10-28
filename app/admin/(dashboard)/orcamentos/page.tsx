"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { FileText, Plus, Search, Trash2, Printer, ChevronRight, Clock, CheckCircle2, XCircle, MessageCircle, ShoppingCart } from "lucide-react"
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
  negotiating: { label: "Negociação", color: "bg-amber-100 text-amber-700" },
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

  // ---- Cotação Express ----
  const [openExpressModal, setOpenExpressModal] = useState(false)
  const [expressName, setExpressName] = useState("")
  const [expressPhone, setExpressPhone] = useState("")
  const [expressShipping, setExpressShipping] = useState("0")
  const [expressItems, setExpressItems] = useState<{ id: string; name: string; sku: string; price: number; qty: number; unit: string }[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [productsList, setProductsList] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [submittingExpress, setSubmittingExpress] = useState(false)

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/orcamentos", window.location.origin)
      if (search) url.searchParams.set("q", search)
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter)
      const json = await supabaseFetch(url.toString())
      setQuotations(json.quotations || [])
    } catch (e) {
      toast.error("Erro ao carregar orçamentos")
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
      toast.error("Nome do cliente é obrigatório")
      return
    }
    setCreating(true)
    try {
      // Buscar ou criar lead por telefone
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
      toast.success("Orçamento criado")
      window.location.href = `/admin/orcamentos/${createdQ.quotation.id}`
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar orçamento")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este orçamento?")) return
    try {
      await supabaseFetch(`/api/orcamentos/${id}`, { method: "DELETE" })
      toast.success("Orçamento excluído")
      fetchQuotations()
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir")
    }
  }

  // ============ Cotação Express ============
  const searchProducts = async (term: string) => {
    setLoadingProducts(true)
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const json = await res.json()
        setProductsList(json.products || [])
      }
    } catch (_) {}
    setLoadingProducts(false)
  }

  async function handleCreateExpress() {
    if (!expressName.trim()) {
      toast.error("Informe o nome do cliente ou obra.")
      return
    }
    if (expressItems.length === 0) {
      toast.error("Adicione pelo menos 1 produto à cotação.")
      return
    }
    setSubmittingExpress(true)
    try {
      // 1. Criar ou buscar lead
      let leadId: string | null = null
      if (expressPhone.trim()) {
        const leadRes = await supabaseFetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: expressName.trim(), phone: expressPhone.trim() }),
        })
        leadId = leadRes.lead?.id || null
      }

      // 2. Criar cotação
      const qRes = await supabaseFetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, notes_client: "Orçamento gerado via canal direto WhatsApp" }),
      })
      const quotationId = qRes.quotation.id
      const quotationCode = qRes.quotation.code

      // 3. Atualizar frete se houver
      if (Number(expressShipping) > 0) {
        await supabaseFetch(`/api/orcamentos/${quotationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipping_value: Number(expressShipping) }),
        })
      }

      // 4. Inserir itens
      for (const item of expressItems) {
        await supabaseFetch(`/api/orcamentos/${quotationId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: item.id || null,
            product_name: item.name,
            sku: item.sku || null,
            unit: item.unit || "un",
            qty: item.qty,
            unit_price: item.price,
          }),
        })
      }

      // 5. Montar link e mensagem
      const pdfUrl = `${window.location.origin}/api/orcamentos/${quotationCode}/pdf`
      const totalItens = expressItems.reduce((acc, i) => acc + i.price * i.qty, 0)
      const totalGeral = totalItens + (Number(expressShipping) || 0)
      const lines = expressItems.map((i) => `- ${i.qty}x ${i.name} (R$ ${Number(i.price).toFixed(2)} un)`).join("\n")
      const msg = [
        `Olá ${expressName.trim()}! Gostaria de cotar o seguinte orçamento pelo site da Discibra Distribuidora:`,
        ``,
        lines,
        Number(expressShipping) > 0 ? `Frete / Descarga: R$ ${Number(expressShipping).toFixed(2)}` : null,
        `*Total:* R$ ${totalGeral.toFixed(2)}`,
        ``,
        `Acesse a proposta completa: ${pdfUrl}`,
        ``,
        `Validade: 24 horas com garantia de pronta entrega pelo CD.`,
        `Podemos confirmar o carregamento?`,
      ].filter(Boolean).join("\n")

      toast.success("Orçamento Express criado com sucesso!")
      setOpenExpressModal(false)
      setExpressItems([])
      setExpressName("")
      setExpressPhone("")
      setExpressShipping("0")

      // Abrir PDF em nova aba
      window.open(pdfUrl, "_blank", "noopener,noreferrer")

      // Se houver telefone, abrir WhatsApp
      if (expressPhone.trim()) {
        const cleanPhone = expressPhone.replace(/\D/g, "")
        const waLink = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
        window.open(waLink, "_blank", "noopener,noreferrer")
      }

      fetchQuotations()
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar orçamento express")
    } finally {
      setSubmittingExpress(false)
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
      {/* Barra de ações */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código ORC, cliente ou telefone..."
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
            <option value="negotiating">Negociação</option>
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
            <Plus className="h-4 w-4" /> Novo orçamento
          </button>
          <button
            onClick={() => {
              setOpenExpressModal(true)
              searchProducts("")
            }}
            className="flex items-center gap-2 rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-2.5 text-xs font-bold text-white transition-colors"
          >
            ⚡ Cotação Express (WhatsApp)
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 uppercase">Total de orçamentos</p>
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
              <th className="px-4 py-3 w-24">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 w-20">Status</th>
              <th className="px-4 py-3 w-32 text-right">Total</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 w-32 text-right">Ações</th>
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
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            )}
            {filtered.map((q) => {
              const items = q.quotation_items || []
              const subBruto = items.reduce((acc: number, i: any) => acc + Number(i.unit_price) * Number(i.qty), 0)
              const descItens = items.reduce(
                (acc: number, i: any) => acc + Number(i.unit_price) * Number(i.qty) * (Number(i.discount_pct) / 100),
                0,
              )
              const subLiq = subBruto - descItens
              const descGlobal = subLiq * (Number(q.discount_pct) / 100)
              const frete = Number(q.shipping_value) || 0
              const total = subLiq - descGlobal + frete
              const lead = q.quotation_leads || {}
              const badge = STATUS_BADGE[q.status] || { label: q.status, color: "bg-slate-100 text-slate-600" }
              return (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{q.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{lead.company || lead.name || "—"}</div>
                    <div className="text-xs text-slate-500">{lead.phone || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{brl(total)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(q.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/orcamentos/${q.id}`}
                        title="Abrir orçamento"
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal novo orçamento */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-slate-900">Novo orçamento</h3>
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
                {creating ? "Criando..." : "Criar orçamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cotação Express */}
      {openExpressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-[4px] bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 text-white bg-[#0F172A]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                ⚡ Cotação Express (Proposta em 30s)
              </h3>
              <button onClick={() => setOpenExpressModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Nome / Obra
                  </label>
                  <input
                    value={expressName}
                    onChange={(e) => setExpressName(e.target.value)}
                    placeholder="Ex: João - Obra Cravinhos"
                    className="w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp do cliente</label>
                  <input
                    value={expressPhone}
                    onChange={(e) => setExpressPhone(e.target.value)}
                    placeholder="(16) 99999-9999"
                    className="w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>
              <div className="border border-slate-200 rounded-[4px] p-3 bg-slate-50 space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-500">Adicionar Produtos</span>
                <div className="flex gap-2">
                  <input
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      searchProducts(e.target.value)
                    }}
                    placeholder="Digite cimento, argamassa..."
                    className="flex-1 rounded-[4px] border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none"
                  />
                </div>
                {productsList.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-slate-200 bg-white rounded-[4px] divide-y divide-slate-100">
                    {productsList.slice(0, 6).map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setExpressItems([...expressItems, { id: p.id, name: p.name, sku: p.sku || "", price: Number(p.price) || 0, qty: 1, unit: p.unit || "un" }])
                          setProductSearch("")
                          setProductsList([])
                        }}
                        className="p-2 text-xs flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <span className="font-mono text-emerald-700 font-bold">R$ {Number(p.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {expressItems.length > 0 && (
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 w-16 text-center">Qtd</th>
                        <th className="p-2 w-20 text-right">Unit</th>
                        <th className="p-2 w-20 text-right">Total</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expressItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-slate-800">{item.name}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const newItems = [...expressItems]
                                newItems[idx].qty = Math.max(1, Number(e.target.value) || 1)
                                setExpressItems(newItems)
                              }}
                              className="w-14 text-center border border-slate-200 rounded-[2px] py-0.5"
                            />
                          </td>
                          <td className="p-2 text-right">R$ {item.price.toFixed(2)}</td>
                          <td className="p-2 text-right font-bold">R$ {(item.price * item.qty).toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => setExpressItems(expressItems.filter((_, i2) => i2 !== idx))}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-[4px] border border-slate-200">
                <span className="font-bold text-slate-700">Valor do Frete / Descarga:</span>
                <div className="flex items-center gap-1">
                  <span>R$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={expressShipping}
                    onChange={(e) => setExpressShipping(e.target.value)}
                    className="w-24 border border-slate-200 rounded-[2px] px-2 py-1 bg-white text-right font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">Total da Proposta:</span>
                <span className="font-black text-[#15803D] text-lg">
                  R$ {(expressItems.reduce((acc, i) => acc + i.price * i.qty, 0) + (Number(expressShipping) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button
                onClick={() => setOpenExpressModal(false)}
                className="rounded-lg border border-slate-200 px-5 py-2 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateExpress}
                disabled={submittingExpress}
                className="rounded-lg bg-[#15803D] hover:bg-[#166534] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {submittingExpress ? "Gerando proposta..." : "🚀 Gerar Proposta e Enviar no WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}