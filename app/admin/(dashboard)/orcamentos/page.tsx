"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Zap,
  Building2,
  Phone,
  Package,
  Minus,
  X,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { SITE } from "@/lib/site-config"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function OrcamentosPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  // Modal Express
  const [openExpress, setOpenExpress] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [shippingValue, setShippingValue] = useState("0")
  const [paymentTerms, setPaymentTerms] = useState("À vista via PIX (desconto aplicado) ou Faturado para PJ")
  const [validDays, setValidDays] = useState("5")
  const [creating, setCreating] = useState(false)
  // Itens da cotação express
  const [items, setItems] = useState<any[]>([])
  const [productQuery, setProductQuery] = useState("")
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [productResults, setProductResults] = useState<any[]>([])
  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/orcamentos", window.location.origin)
      if (search) url.searchParams.set("q", search)
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error("Erro na requisição")
      const json = await res.json()
      setQuotations(json.quotations || [])
    } catch (e) {
      toast.error("Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchQuotations()
  }, [search, statusFilter])
  // Busca de produtos no catálogo real com debounce
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true)
      try {
        const res = await fetch(`/api/search-products?q=${encodeURIComponent(productQuery.trim())}`)
        if (res.ok) {
          const json = await res.json()
          setProductResults(json.products || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearchingProducts(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [productQuery])
  const addItem = (p: any) => {
    const existing = items.find((i) => i.product_id === p.id)
    if (existing) {
      setItems(items.map((i) => (i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i)))
    } else {
      setItems([
        ...items,
        {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku || "",
          unit: p.unit || "un",
          unit_price: Number(p.price) || 0,
          qty: 1,
          discount_pct: 0,
        },
      ])
    }
    setProductQuery("")
    setProductResults([])
  }
  const updateItemQty = (index: number, delta: number) => {
    const next = [...items]
    const newQty = Math.max(1, next[index].qty + delta)
    next[index].qty = newQty
    setItems(next)
  }
  const updateItemPrice = (index: number, priceStr: string) => {
    const next = [...items]
    next[index].unit_price = Number(priceStr) || 0
    setItems(next)
  }
  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index))
  }
  // Cálculos do modal
  const subtotalProducts = items.reduce((acc, i) => acc + Number(i.unit_price) * Number(i.qty), 0)
  const freightTotal = Number(shippingValue) || 0
  const grandTotal = subtotalProducts + freightTotal
  async function handleCreateExpress() {
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente ou obra.")
      return
    }
    if (items.length === 0) {
      toast.error("Adicione pelo menos 1 produto à cotação.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: clientName.trim(),
          customerPhone: clientPhone.trim() || undefined,
          customerCompany: clientCompany.trim() || undefined,
          shippingValue: freightTotal,
          paymentTerms,
          validDays,
          items,
        }),
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || "Falha ao gerar proposta")
      }
      const json = await res.json()
      const created = json.quotation
      toast.success(`Orçamento ${created.code} gerado com sucesso!`)
      const pdfUrl = `${window.location.origin}/api/orcamentos/${created.code}/pdf`
      window.open(pdfUrl, "_blank")
      if (clientPhone.trim()) {
        const cleanPhone = clientPhone.replace(/\D/g, "")
        const phoneFormatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
        const msg = encodeURIComponent(
          `Olá ${clientName.trim()}! Segue sua Proposta Comercial da Discibra Distribuidora (${created.code}) no valor de ${brl(
            grandTotal
          )}.\n\nVocê pode visualizar os detalhes e a proposta oficial timbrada neste link:\n${pdfUrl}\n\nFicamos à disposição para faturamento e agendamento da entrega!`,
        )
        window.open(`https://wa.me/${phoneFormatted}?text=${msg}`, "_blank")
      }
      setOpenExpress(false)
      setClientName("")
      setClientPhone("")
      setClientCompany("")
      setShippingValue("0")
      setItems([])
      fetchQuotations()
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar orçamento")
    } finally {
      setCreating(false)
    }
  }
  async function handleDelete(id: string) {
    if (!confirm("Excluir este orçamento definitivamente?")) return
    try {
      const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Orçamento excluído com sucesso.")
      fetchQuotations()
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir")
    }
  }
  function getQuoteTotal(q: any) {
    const itemsArr = q.quotation_items || []
    const sub = itemsArr.reduce((acc: number, it: any) => acc + Number(it.unit_price) * Number(it.qty), 0)
    return sub + (Number(q.shipping_value) || 0)
  }

  return (
    <div className="space-y-6">
      {/* Topo / Barra de Ações */}
      <div className="flex flex-col gap-4 rounded-[4px] border border-[#E5E5E3] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ORC, cliente ou telefone..."
              className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] pl-9 pr-3 py-2 text-sm text-[#111318] outline-none focus:border-[#111318]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm text-[#111318] outline-none focus:border-[#111318]"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviado</option>
            <option value="approved">Aprovado</option>
            <option value="lost">Cancelado</option>
          </select>
        </div>
        <button
          onClick={() => setOpenExpress(true)}
          className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#166534]"
        >
          <Zap className="h-4 w-4" />
          Nova Cotação Express
        </button>
      </div>
      {/* Tabela de Orçamentos */}
      <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E3] bg-[#FAFAF9] text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente / Obra</th>
              <th className="px-4 py-3 text-center">Itens</th>
              <th className="px-4 py-3 text-right">Valor Total</th>
              <th className="px-4 py-3 text-center">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#6B7280]">
                  Carregando orçamentos...
                </td>
              </tr>
            )}
            {!loading && quotations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#6B7280]">
                  Nenhum orçamento encontrado. Clique em "Nova Cotação Express" para emitir uma proposta.
                </td>
              </tr>
            )}
            {!loading &&
              quotations.map((q) => {
                const total = getQuoteTotal(q)
                const lead = q.quotation_leads
                const itemCount = (q.quotation_items || []).length
                return (
                  <tr key={q.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#111318]">
                      {q.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#111318]">{lead?.name || "Cliente"}</div>
                      <div className="text-xs text-[#6B7280]">
                        {lead?.phone || lead?.company || "Sem telefone"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-[#6B7280]">
                      {itemCount} {itemCount === 1 ? "item" : "itens"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#111318]">
                      {brl(total)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-[#6B7280]">
                      {new Date(q.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`/api/orcamentos/${q.code}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visualizar Proposta / PDF Timbrado"
                          className="inline-flex items-center gap-1 rounded-[4px] border border-[#E5E5E3] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111318] hover:bg-[#FAFAF9]"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-600" />
                          PDF
                        </a>
                        {lead?.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Olá ${lead.name}! Segue sua Proposta Comercial da Discibra (${q.code}): ${window.location.origin}/api/orcamentos/${q.code}/pdf`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Reenviar no WhatsApp"
                            className="inline-flex items-center rounded-[4px] bg-[#15803D] p-1.5 text-white hover:bg-[#166534]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(q.id)}
                          title="Excluir Cotação"
                          className="rounded-[4px] p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      {/* MODAL COTAÇÃO EXPRESS */}
      {openExpress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-[4px] border border-[#E5E5E3] bg-white shadow-2xl overflow-hidden">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between border-b border-[#E5E5E3] bg-[#FAFAF9] px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#15803D] text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111318]">Cotação Express — Discibra B2B</h3>
                  <p className="text-xs text-[#6B7280]">Elaboração rápida e proposta timbrada pronta para envio</p>
                </div>
              </div>
              <button
                onClick={() => setOpenExpress(false)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#111318]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Corpo do Modal (com scroll) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dados do Cliente */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                  1. Dados do Cliente / Obra
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#111318] mb-1">
                      Nome do Cliente ou Obra *
                    </label>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Construtora Alfa / Eng. Ricardo"
                      className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm text-[#111318] outline-none focus:border-[#111318]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111318] mb-1">
                      WhatsApp do Cliente
                    </label>
                    <input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(16) 99999-9999"
                      className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm text-[#111318] outline-none focus:border-[#111318]"
                    />
                  </div>
                </div>
              </div>
              {/* Busca e Adição de Produtos do Catálogo Real */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                  2. Adicionar Produtos do Catálogo Real
                </h4>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Digite para buscar produtos: cimento, argamassa, ferro..."
                    className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] pl-9 pr-3 py-2 text-sm text-[#111318] outline-none focus:border-[#111318]"
                  />
                  {/* Resultados da busca suspensa */}
                  {productResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-56 overflow-y-auto rounded-[4px] border border-[#E5E5E3] bg-white shadow-lg divide-y divide-[#E5E5E3]">
                      {productResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addItem(p)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-[#FAFAF9] transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-[#111318]">{p.name}</p>
                            <p className="text-xs text-[#6B7280]">
                              Unidade: {p.unit || "un"} {p.sku ? `· SKU: ${p.sku}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono font-bold text-[#15803D]">
                              {brl(p.price)}
                            </span>
                            <span className="block text-[10px] text-[#6B7280]">+ Adicionar</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Grade de Itens Adicionados */}
                <div className="mt-4 rounded-[4px] border border-[#E5E5E3] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E3] bg-[#FAFAF9] text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 w-28 text-center">Qtd</th>
                        <th className="px-3 py-2 w-28 text-right">Preço Unit.</th>
                        <th className="px-3 py-2 w-28 text-right">Subtotal</th>
                        <th className="px-3 py-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E3]">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-xs text-[#6B7280]">
                            Nenhum produto adicionado. Busque acima para incluir materiais na cotação.
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAF9]">
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-[#111318] text-xs leading-tight">{it.product_name}</p>
                              <p className="text-[10px] text-[#6B7280]">Unidade: {it.unit}</p>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="inline-flex items-center border border-[#E5E5E3] rounded-[4px] bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(idx, -1)}
                                  className="p-1 hover:bg-[#FAFAF9] text-[#111318]"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-10 text-center font-bold text-xs">{it.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(idx, 1)}
                                  className="p-1 hover:bg-[#FAFAF9] text-[#111318]"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={it.unit_price}
                                onChange={(e) => updateItemPrice(idx, e.target.value)}
                                className="w-20 text-right rounded-[4px] border border-[#E5E5E3] px-2 py-1 text-xs font-mono font-bold text-[#111318] outline-none"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-[#111318]">
                              {brl(it.unit_price * it.qty)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-slate-400 hover:text-red-600"
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
              {/* Condições e Frete */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                  3. Logística e Pagamento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111318] mb-1">
                      Valor do Frete / Descarga (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingValue}
                      onChange={(e) => setShippingValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm font-mono text-[#111318] outline-none focus:border-[#111318]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111318] mb-1">
                      Validade da Cotação
                    </label>
                    <select
                      value={validDays}
                      onChange={(e) => setValidDays(e.target.value)}
                      className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm text-[#111318] outline-none"
                    >
                      <option value="3">3 dias úteis</option>
                      <option value="5">5 dias úteis (Padrão)</option>
                      <option value="10">10 dias úteis</option>
                      <option value="15">15 dias úteis</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {/* Rodapé do Modal com Totais e Botão de Ação */}
            <div className="border-t border-[#E5E5E3] bg-[#FAFAF9] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-[#6B7280]">Total da Proposta:</span>
                  <span className="text-xl font-mono font-black text-[#15803D]">
                    {brl(grandTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Materiais: {brl(subtotalProducts)} · Frete: {brl(freightTotal)}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setOpenExpress(false)}
                  className="flex-1 sm:flex-none rounded-[4px] border border-[#E5E5E3] px-4 py-2.5 text-xs font-bold text-[#111318] hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateExpress}
                  disabled={creating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#166534] disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" />
                  {creating ? "Emitindo..." : "Gerar Proposta e Enviar no WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
