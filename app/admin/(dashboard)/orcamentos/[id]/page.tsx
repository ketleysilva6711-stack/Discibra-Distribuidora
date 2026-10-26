"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  Printer,
  Link as LinkIcon,
  MessageCircle,
  Save,
  Trash2,
  Search,
  ArrowLeft,
  Plus,
  Edit3,
} from "lucide-react"
import { SITE } from "@/lib/site-config"
import { toast } from "sonner"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "negotiating", label: "Negociação" },
  { value: "approved", label: "Aprovado" },
  { value: "converted", label: "Convertido" },
  { value: "lost", label: "Perdido" },
]

const supabaseFetch = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export default function OrcamentoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [quotation, setQuotation] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openProductSearch, setOpenProductSearch] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [productResults, setProductResults] = useState<any[]>([])
  const [newQty, setNewQty] = useState("1")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({})

  // Campos do orçamento
  const [status, setStatus] = useState("draft")
  const [leadName, setLeadName] = useState("")
  const [leadPhone, setLeadPhone] = useState("")
  const [leadEmail, setLeadEmail] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [discountPct, setDiscountPct] = useState("0")
  const [shippingValue, setShippingValue] = useState("0")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notesClient, setNotesClient] = useState("")
  const [notesInternal, setNotesInternal] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const json = await supabaseFetch(`/api/orcamentos/${id}`)
      setQuotation(json.quotation)
      setItems(json.quotation.quotation_items || [])
      const lead = json.quotation.quotation_leads || {}
      setLeadName(lead.name || "")
      setLeadPhone(lead.phone || "")
      setLeadEmail(lead.email || "")
      setStatus(json.quotation.status || "draft")
      setValidUntil(json.quotation.valid_until || "")
      setDiscountPct(String(json.quotation.discount_pct || 0))
      setShippingValue(String(json.quotation.shipping_value || 0))
      setPaymentTerms(json.quotation.payment_terms || "")
      setNotesClient(json.quotation.notes_client || "")
      setNotesInternal(json.quotation.notes || "")
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar orçamento")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const totals = () => {
    const subBruto = items.reduce((acc, i) => acc + Number(i.unit_price) * Number(i.qty), 0)
    const descItens = items.reduce(
      (acc, i) => acc + Number(i.unit_price) * Number(i.qty) * (Number(i.discount_pct) / 100),
      0,
    )
    const subLiq = subBruto - descItens
    const descGlobal = subLiq * (Number(discountPct) / 100)
    const frete = Number(shippingValue) || 0
    const total = subLiq - descGlobal + frete
    return { subBruto, descItens, subLiq, descGlobal, frete, total }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await supabaseFetch(`/api/orcamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          discount_pct: Number(discountPct) || 0,
          shipping_value: Number(shippingValue) || 0,
          notes: notesInternal || null,
          notes_client: notesClient || null,
          valid_until: validUntil || null,
          payment_terms: paymentTerms || null,
        }),
      })
      toast.success("Orçamento atualizado")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!productResults.find((p) => p.id)) {
      toast.error("Selecione um produto válido")
      return
    }
    const p = productResults.find((prod) => prod.name?.toLowerCase() === productSearch.toLowerCase())
    if (!p) {
      toast.error("Produto não encontrado na lista")
      return
    }
    try {
      await supabaseFetch(`/api/orcamentos/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: p.id,
          product_name: p.name,
          sku: p.sku || null,
          unit: p.unit || "un",
          qty: Number(newQty) || 1,
          unit_price: Number(p.price) || 0,
          discount_pct: 0,
        }),
      })
      setOpenProductSearch(false)
      setProductSearch("")
      setProductResults([])
      setNewQty("1")
      fetchData()
      toast.success("Item adicionado")
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar item")
    }
  }

  async function handleUpdateItem(itemId: string, field: string, value: any) {
    try {
      await supabaseFetch(`/api/orcamentos/${id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar item")
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Excluir este item?")) return
    try {
      await supabaseFetch(`/api/orcamentos/${id}/items/${itemId}`, { method: "DELETE" })
      fetchData()
      toast.success("Item removido")
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover item")
    }
  }

  async function handleSearchProducts() {
    if (!productSearch.trim()) return
    try {
      const sb = createClient()
      const { data, error } = await sb
        .from("products")
        .select("id, name, slug, sku, price, unit")
        .eq("active", true)
        .ilike("name", `%${productSearch.trim()}%`)
        .limit(10)
      if (error) throw error
      setProductResults((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        unit: p.unit || "un",
      })))
    } catch {
      // fallback silencioso
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const { subBruto, descItens, subLiq, descGlobal, frete, total } = totals()

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link href="/admin/orcamentos" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
          <h1 className="text-base font-bold text-slate-900 mt-1">Orçamento {quotation?.code}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#12A06A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0e8a5b] disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <a
            href={`/api/orcamentos/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Gerar PDF
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/orcamento/${quotation.token}`)
              toast.success("Link copiado!")
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <LinkIcon className="h-4 w-4" /> Copiar link cliente
          </button>
          <a
            href={`https://wa.me/${SITE?.whatsappE164 || "5516996447972"}?text=Olá! Quero visualizar meu orçamento ${quotation.code}: ${window.location.origin}/orcamento/${quotation.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1fba58]"
          >
            <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Esquerda: itens */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Itens do orçamento</h2>
              <button
                onClick={() => setOpenProductSearch(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#12A06A] hover:text-[#0e8a5b]"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar produto
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 w-16 text-center">SKU</th>
                    <th className="px-4 py-3 w-20 text-center">Qtd</th>
                    <th className="px-4 py-3 w-24 text-right">Preço unit.</th>
                    <th className="px-4 py-3 w-24 text-center">Desc%</th>
                    <th className="px-4 py-3 w-28 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-16 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isEditing = editingItem === item.id
                    const sub = Number(item.unit_price) * Number(item.qty) * (1 - Number(item.discount_pct) / 100)
                    return (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              defaultValue={item.product_name}
                              onChange={(e) => setEditValues({ ...editValues, product_name: e.target.value })}
                              className="w-full border-b border-slate-300 px-1 py-1 text-sm outline-none focus:border-[#12A06A]"
                            />
                          ) : (
                            <div className="font-medium text-slate-800">{item.product_name}</div>
                          )}
                          {item.sku && (
                            <div className="text-xs text-slate-500 mt-0.5">{item.sku}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{item.sku || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input
                              defaultValue={item.qty}
                              onChange={(e) => setEditValues({ ...editValues, qty: e.target.value })}
                              className="w-16 border-b border-slate-300 px-1 py-1 text-sm outline-none focus:border-[#12A06A] text-center"
                            />
                          ) : (
                            <span className="font-medium">{item.qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              defaultValue={item.unit_price}
                              onChange={(e) => setEditValues({ ...editValues, unit_price: e.target.value })}
                              className="w-24 border-b border-slate-300 px-1 py-1 text-sm outline-none focus:border-[#12A06A] text-right"
                            />
                          ) : (
                            <span className="font-medium">{brl(item.unit_price)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input
                              defaultValue={item.discount_pct}
                              onChange={(e) => setEditValues({ ...editValues, discount_pct: e.target.value })}
                              className="w-20 border-b border-slate-300 px-1 py-1 text-sm outline-none focus:border-[#12A06A] text-center"
                            />
                          ) : (
                            <span className="font-medium text-slate-600">{item.discount_pct}%</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{brl(sub)}</td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  handleUpdateItem(item.id, "product_name", editValues.product_name || item.product_name)
                                  handleUpdateItem(item.id, "qty", Number(editValues.qty) || item.qty)
                                  handleUpdateItem(item.id, "unit_price", Number(editValues.unit_price) || item.unit_price)
                                  handleUpdateItem(
                                    item.id,
                                    "discount_pct",
                                    Number(editValues.discount_pct) || item.discount_pct,
                                  )
                                  setEditingItem(null)
                                  setEditValues({})
                                }}
                                className="rounded-lg p-1 text-[#12A06A] hover:bg-[#12A06A]/10"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(null)
                                  setEditValues({})
                                }}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                              >
                                <span className="text-[10px]">Cancelar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingItem(item.id)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Busca de produto */}
          {openProductSearch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-900">Buscar produto</h3>
                  <button
                    onClick={() => setOpenProductSearch(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <span className="text-[10px]">Fechar</span>
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onBlur={handleSearchProducts}
                      placeholder="Nome ou SKU do produto..."
                      className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                    <input
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                    />
                  </div>
                  <div className="flex gap-2">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProductSearch(p.name)
                          setProductResults([])
                          handleAddItem()
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-left hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.sku || "—"} · {brl(p.price)}/{p.unit || "un"}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="w-full rounded-lg bg-[#12A06A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0e8a5b]"
                  >
                    Adicionar item selecionado
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direita: painel lateral */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Resumo financeiro</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal itens</span>
                <span className="font-medium">{brl(subBruto)}</span>
              </div>
              {descItens > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Desconto itens</span>
                  <span className="text-emerald-600 font-medium">− {brl(descItens)}</span>
                </div>
              )}
              {Number(discountPct) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Desconto global ({discountPct}%)</span>
                  <span className="text-emerald-600 font-medium">− {brl(descGlobal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Frete</span>
                <span className="font-medium">{frete > 0 ? brl(frete) : "A calcular"}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold">
                <span>TOTAL FINAL</span>
                <span className="text-[#C2410C]">{brl(total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Dados do orçamento</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Nome ou empresa"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="(16) 99999-9999"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Validade</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desconto global (%)</label>
                <input
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frete (R$)</label>
                <input
                  value={shippingValue}
                  onChange={(e) => setShippingValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condições de pagamento</label>
                <input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: PIX, 12x cartão..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações (cliente)</label>
                <textarea
                  value={notesClient}
                  onChange={(e) => setNotesClient(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações (internas)</label>
                <textarea
                  value={notesInternal}
                  onChange={(e) => setNotesInternal(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12A06A]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
