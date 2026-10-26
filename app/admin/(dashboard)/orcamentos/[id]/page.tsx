"use client"

import { use, useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  Printer,
  Link as LinkIcon,
  MessageCircle,
  Save,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  CreditCard,
  Link as Link2Icon,
  Building2,
  User,
} from "lucide-react"
import { SITE } from "@/lib/site-config"
import { toast } from "sonner"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function maskCpfCnpj(value: string): string {
  const v = value.replace(/\D/g, "")
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
  }
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
}

function validateCpfCnpj(value: string): boolean {
  const v = value.replace(/\D/g, "")
  if (v.length === 11) {
    // CPF
    if (/^(\d)\1{10}$/.test(v)) return false
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(v.charAt(i)) * (10 - i)
    let dig1 = 11 - (sum % 11)
    if (dig1 > 9) dig1 = 0
    if (parseInt(v.charAt(9)) !== dig1) return false
    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(v.charAt(i)) * (11 - i)
    let dig2 = 11 - (sum % 11)
    if (dig2 > 9) dig2 = 0
    return parseInt(v.charAt(10)) === dig2
  }
  if (v.length === 14) {
    // CNPJ
    if (/^(\d)\1{13}$/.test(v)) return false
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum1 = 0
    for (let i = 0; i < 12; i++) sum1 += parseInt(v.charAt(i)) * weights1[i]
    let d1 = sum1 % 11
    d1 = d1 < 2 ? 0 : 11 - d1
    if (parseInt(v.charAt(12)) !== d1) return false
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum2 = 0
    for (let i = 0; i < 13; i++) sum2 += parseInt(v.charAt(i)) * weights2[i]
    let d2 = sum2 % 11
    d2 = d2 < 2 ? 0 : 11 - d2
    return parseInt(v.charAt(13)) === d2
  }
  return false
}

function maskPhone(value: string): string {
  const v = value.replace(/\D/g, "")
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

function maskCep(value: string): string {
  const v = value.replace(/\D/g, "")
  return v.replace(/(\d{5})(\d{3})/, "$1-$2")
}

async function fetchCep(cep: string): Promise<{
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
} | null> {
  const clean = cep.replace(/\D/g, "")
  if (clean.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    const data = await res.json()
    if (data.erro) return { erro: true }
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    }
  } catch {
    return null
  }
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "sent", label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "negotiating", label: "Negociação", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "approved", label: "Aprovado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "converted", label: "Convertido", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "lost", label: "Perdido", color: "bg-red-100 text-red-700 border-red-200" },
]

const PAYMENT_PILLS = [
  "💵 PIX à Vista (Desconto Especial)",
  "💳 12x no Cartão de Crédito",
  "🔗 Link de Pagamento Faturado",
  "🏗️ 50% Entrada + 50% na Descarga",
  "🏢 Boleto Faturado PJ (Aprovado)",
]

const supabaseFetch = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
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

  // Campos do orçamento
  const [status, setStatus] = useState("draft")
  const [leadName, setLeadName] = useState("")
  const [leadPhone, setLeadPhone] = useState("")
  const [leadEmail, setLeadEmail] = useState("")
  const [leadCpfCnpj, setLeadCpfCnpj] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [discountPct, setDiscountPct] = useState("0")
  const [shippingValue, setShippingValue] = useState("0")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notesClient, setNotesClient] = useState("")
  const [notesInternal, setNotesInternal] = useState("")
  const [createdBy, setCreatedBy] = useState("")

  // Endereço da obra
  const [cep, setCep] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  // Validação visual
  const [cpfCnpjValid, setCpfCnpjValid] = useState<boolean | null>(null)

  // Busca rápida de produtos (sem modal)
  const [productSearch, setProductSearch] = useState("")
  const [productResults, setProductResults] = useState<any[]>([])
  const [newQty, setNewQty] = useState("1")
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const cepTimeout = useRef<NodeJS.Timeout | null>(null)

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
      setLeadCpfCnpj(lead.cpf_cnpj || "")
      setCreatedBy(json.quotation.created_by || "")
      setStatus(json.quotation.status || "draft")
      setValidUntil(json.quotation.valid_until || "")
      setDiscountPct(String(json.quotation.discount_pct || 0))
      setShippingValue(String(json.quotation.shipping_value || 0))
      setPaymentTerms(json.quotation.payment_terms || "")
      setNotesClient(json.quotation.notes_client || "")
      setNotesInternal(json.quotation.notes || "")
      setCep(lead.address_zip || "")
      setStreet(lead.address_street || "")
      setNumber(lead.address_number || "")
      setComplement(lead.address_complement || "")
      setNeighborhood(lead.address_neighborhood || "")
      setCity(lead.address_city || "")
      setState(lead.address_state || "")
      if (lead.cpf_cnpj) setCpfCnpjValid(validateCpfCnpj(lead.cpf_cnpj))
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
          created_by: createdBy || null,
          lead_data: {
            name: leadName || null,
            phone: leadPhone || null,
            email: leadEmail || null,
            cpf_cnpj: leadCpfCnpj || null,
            address_street: street || null,
            address_number: number || null,
            address_complement: complement || null,
            address_city: city || null,
            address_state: state || null,
            address_zip: cep || null,
          },
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
    if (!productSearch.trim()) {
      toast.error("Informe um produto")
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setProductSearch(v)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!v.trim()) {
      setProductResults([])
      return
    }
    searchTimeout.current = setTimeout(() => {
      const sb = createClient()
      sb.from("products")
        .select("id, name, slug, sku, price, unit, stock")
        .eq("active", true)
        .ilike("name", `%${v.trim()}%`)
        .limit(10)
        .then(({ data, error }) => {
          if (error) return
          setProductResults(
            (data || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              unit: p.unit || "un",
              stock: p.stock,
            })),
          )
        })
    }, 300)
  }, [])

  const handleCepChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, "")
      setCep(maskCep(v))
      if (cepTimeout.current) clearTimeout(cepTimeout.current)
      if (v.length === 8) {
        cepTimeout.current = setTimeout(async () => {
          const data = await fetchCep(v)
          if (data && !data.erro) {
            setStreet(data.logradouro || "")
            setNeighborhood(data.bairro || "")
            setCity(data.localidade || "")
            setState(data.uf || "")
          }
        }, 300)
      }
    },
    [],
  )

  const handleValidityDays = (days: number) => {
    setValidUntil(addDays(new Date(), days))
  }

  const handlePaymentPill = (text: string) => {
    setPaymentTerms(text)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const { subBruto, descItens, subLiq, descGlobal, frete, total } = totals()
  const badge = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/orcamentos" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orçamento</span>
            <span className="text-sm font-black text-slate-900">{quotation?.code}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>{badge.label}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#0B2A6B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#081f50] disabled:opacity-60 transition-all"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
          <a
            href={`/api/orcamentos/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Printer className="h-4 w-4" /> Visualizar / Imprimir PDF
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/orcamento/${quotation.token}`)
              toast.success("Link copiado!")
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <LinkIcon className="h-4 w-4" /> Copiar Link
          </button>
          <a
            href={`https://wa.me/${SITE?.whatsappE164 || "5516996447972"}?text=Olá! Quero visualizar meu orçamento ${quotation.code}: ${window.location.origin}/orcamento/${quotation.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1fba58] transition-all"
          >
            <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
          </a>
        </div>
      </div>

      {/* Grid Principal 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Adição rápida + Itens + Observações */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card: Adição Rápida */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Adição Rápida de Produtos</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={productSearch}
                  onChange={handleSearchChange}
                  placeholder="Buscar produto por nome ou SKU..."
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]/20"
                />
                {productResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProductSearch(p.name)
                          setProductResults([])
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.sku ? `SKU: ${p.sku} · ` : ""}{brl(p.price)}/{p.unit || "un"} · Estoque: {p.stock}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-[#C2410C]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Qtd"
                  className="w-20 rounded-lg border border-slate-200 px-2.5 py-2.5 text-sm outline-none focus:border-[#C2410C] text-center"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!productResults.find((p) => p.name?.toLowerCase() === productSearch.toLowerCase())}
                  className="flex-1 rounded-lg bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#9a3409] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Inserir Produto
                </button>
              </div>
            </div>
          </div>

          {/* Card: Tabela de Materiais */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Materiais do Orçamento</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="px-4 py-2.5">Produto</th>
                    <th className="px-4 py-2.5 w-16 text-center">SKU</th>
                    <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                    <th className="px-4 py-2.5 w-24 text-right">Preço Unit.</th>
                    <th className="px-4 py-2.5 w-20 text-center">Desc %</th>
                    <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 w-12 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const sub = Number(item.unit_price) * Number(item.qty) * (1 - Number(item.discount_pct) / 100)
                    return (
                      <tr key={item.id} className="hover:bg-slate-25 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{item.product_name}</div>
                          {item.sku && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{item.sku}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{item.sku || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value) || item.qty)}
                            className="w-16 rounded-lg border border-slate-200 px-1.5 py-1.5 text-sm outline-none focus:border-[#C2410C] text-center bg-slate-25"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            value={item.unit_price}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "unit_price", Number(e.target.value) || item.unit_price)
                            }
                            className="w-24 rounded-lg border border-slate-200 px-1.5 py-1.5 text-sm outline-none focus:border-[#C2410C] text-right bg-slate-25"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            value={item.discount_pct}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "discount_pct", Number(e.target.value) || item.discount_pct)
                            }
                            className="w-16 rounded-lg border border-slate-200 px-1.5 py-1.5 text-sm outline-none focus:border-[#C2410C] text-center bg-slate-25"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{brl(sub)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        Nenhum item adicionado. Use a busca rápida acima para inserir produtos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Observações */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Observações</h2>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observações para o Cliente</label>
              <textarea
                value={notesClient}
                onChange={(e) => setNotesClient(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                placeholder="Observações que aparecerão no PDF para o cliente..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas Internas</label>
              <textarea
                value={notesInternal}
                onChange={(e) => setNotesInternal(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                placeholder="Notas internas da Discibra..."
              />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Dados do Cliente + Financeiro + Condições */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Dados do Cliente */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Dados do Cliente / Faturamento</h2>

            {/* Linha 1: Nome/Empresa e CPF/CNPJ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome / Empresa</label>
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Nome ou empresa"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div className="flex items-end">
                <div className="relative w-full">
                  <input
                    value={leadCpfCnpj}
                    onChange={(e) => {
                      setLeadCpfCnpj(maskCpfCnpj(e.target.value))
                      const v = e.target.value.replace(/\D/g, "")
                      setCpfCnpjValid(v.length >= 11 ? validateCpfCnpj(v) : null)
                    }}
                    placeholder="000.000.000-00 / 00.000.000/0000-00"
                    className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C] ${cpfCnpjValid === false ? "border-red-500 focus:border-red-500" : ""} ${cpfCnpjValid === true ? "border-emerald-500 focus:border-emerald-500" : ""}`}
                  />
                  {cpfCnpjValid === true ? (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600">Válido</span>
                  ) : cpfCnpjValid === false ? (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-600">Inválido</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Linha 2: WhatsApp e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(maskPhone(e.target.value))}
                  placeholder="(16) 99999-9999"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            {/* Linha 3: CEP + Rua + Número */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CEP</label>
                <input
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rua / Logradouro</label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número</label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Nº"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            {/* Linha 4: Complemento + Bairro + Cidade + Estado */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Complemento</label>
                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto / Sala..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bairro</label>
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            {/* Linha 5: Consultor Comercial */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Consultor Comercial (Vendedor)</label>
              <input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="Nome do consultor..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
              />
            </div>
          </div>

          {/* Card: Fechamento Financeiro */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Fechamento Financeiro</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal dos Itens</span>
                <span className="font-medium">{brl(subBruto)}</span>
              </div>
              {descItens > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desconto nos Itens</span>
                  <span className="font-medium text-emerald-600">− {brl(descItens)}</span>
                </div>
              )}
              {Number(discountPct) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desconto Global ({discountPct}%)</span>
                  <span className="font-medium text-emerald-600">− {brl(descGlobal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete / Descarga</span>
                <span className="font-medium">{frete > 0 ? brl(frete) : "A calcular"}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-sm">VALOR TOTAL</span>
                <span className="text-base font-black text-[#C2410C]">{brl(total)}</span>
              </div>
            </div>
          </div>

          {/* Card: Condições Comerciais */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Condições Comerciais</h2>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Validade com atalhos */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0">Validade da Proposta</label>
              </div>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C] mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleValidityDays(1)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <Clock className="h-3 w-3 mr-1" /> +24h
                </button>
                <button
                  onClick={() => handleValidityDays(2)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <Clock className="h-3 w-3 mr-1" /> +48h
                </button>
                <button
                  onClick={() => handleValidityDays(7)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <Clock className="h-3 w-3 mr-1" /> +7d
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desconto Global (%)</label>
              <input
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frete (R$)</label>
              <input
                value={shippingValue}
                onChange={(e) => setShippingValue(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#C2410C]"
              />
            </div>

            {/* Pills de pagamento */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condições de Pagamento</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handlePaymentPill(pill)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                      paymentTerms === pill
                        ? "bg-[#C2410C] border-[#C2410C] text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
