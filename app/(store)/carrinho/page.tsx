"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, Package, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { saveLocalOrder, generateOrderCode } from "@/lib/local-orders"
import { waLink, SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

type CartItem = {
  id: string
  name: string
  price: number
  image_url: string | null
  unit: string
  qty: number
}

// ── Regras B2B de desconto por volume e peso da carga ──
function getItemDiscountRate(name: string, unit: string, qty: number): number {
  const isBulkEligible =
    unit === "saco" ||
    unit === "sc" ||
    /cimento|argamassa|rejunte|gesso/i.test(name)
  if (isBulkEligible) {
    if (qty >= 560) return 0.07 // 7% de desconto (Carga Fechada / Truck)
    if (qty >= 40) return 0.03 // 3% de desconto (Palete Fechado)
  }
  return 0
}

function getItemUnitWeight(name: string, unit: string): number {
  const match = name.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/i)
  if (match) {
    return parseFloat(match[1].replace(",", "."))
  }
  if (unit === "saco" || unit === "sc") return 50
  return 0
}

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]") } catch { return [] }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart))
  window.dispatchEvent(new Event("cart-updated"))
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerCep, setCustomerCep] = useState("")
  const [customerCity, setCustomerCity] = useState("")
  const [loadingCep, setLoadingCep] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCart(getCart())
    try {
      const savedLead = localStorage.getItem("discibra_customer_lead")
      if (savedLead) {
        const lead = JSON.parse(savedLead)
        if (lead.name) setCustomerName(lead.name)
        if (lead.phone) setCustomerPhone(lead.phone)
        if (lead.cep) setCustomerCep(lead.cep)
        if (lead.city) setCustomerCity(lead.city)
      }
    } catch (_) {}
  }, [])

  function updateQty(id: string, delta: number) {
    const updated = cart.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    setCart(updated); saveCart(updated)
  }

  function removeItem(id: string) {
    const updated = cart.filter((i) => i.id !== id)
    setCart(updated); saveCart(updated)
  }

  function clearCart() { setCart([]); saveCart([]) }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "")
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`
    } else if (v.length > 0) {
      v = `(${v}`
    }
    setCustomerPhone(v)
  }

  async function handleCepBlur() {
    const raw = customerCep.replace(/\D/g, "")
    if (raw.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`/api/cep?cep=${raw}`)
      const data = await res.json()
      if (data && data.localidade) {
        setCustomerCity(`${data.localidade} - ${data.uf}`)
      }
    } catch (_) {}
    setLoadingCep(false)
  }

  let grossTotal = 0
  let totalDiscount = 0
  let totalWeight = 0
  cart.forEach((i) => {
    const itemGross = i.price * i.qty
    const rate = getItemDiscountRate(i.name, i.unit, i.qty)
    grossTotal += itemGross
    totalDiscount += itemGross * rate
    totalWeight += getItemUnitWeight(i.name, i.unit) * i.qty
  })
  const total = Math.max(0, grossTotal - totalDiscount)
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)

  async function finalizeWhatsApp() {
    if (!customerName.trim()) {
      toast.error("Informe seu Nome ou Empresa para gerar o orçamento.")
      return
    }
    const cleanPhone = customerPhone.replace(/\D/g, "")
    if (cleanPhone.length < 10) {
      toast.error("Informe um WhatsApp válido com DDD para contato.")
      return
    }
    setSubmitting(true)
    let code = generateOrderCode()
    let email: string | undefined
    try {
      // Salvar lead no localStorage para próximas visitas
      localStorage.setItem(
        "discibra_customer_lead",
        JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          cep: customerCep.trim(),
          city: customerCity.trim(),
        })
      )
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      email = userData.user?.email ?? undefined
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          email,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerCep: customerCep.trim(),
          customerCity: customerCity.trim(),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        code = json.code ?? code
      }
    } catch (_) {
      // Fallback: prossegue com código local
    } finally {
      setSubmitting(false)
    }
    // Salvar localmente (rastreamento no "Minha Conta")
    const lines = cart.map((i) => `- ${i.qty}x ${i.name} — R$ ${(i.price * i.qty).toFixed(2)}`)
    saveLocalOrder({
      code,
      email,
      status: "received",
      total,
      itemsSummary: lines.join("\n"),
    })
    // Montar mensagem corporativa no WhatsApp
    const whatsLines = cart.map((i) => {
      const rate = getItemDiscountRate(i.name, i.unit, i.qty)
      const itemNet = i.price * i.qty * (1 - rate)
      const tag =
        rate === 0.07
          ? " *(Carga Fechada: 7% OFF)*"
          : rate === 0.03
            ? " *(Palete Fechado: 3% OFF)*"
            : ""
      return `- ${i.qty}x ${i.name} (R$ ${Number(i.price).toFixed(2)} un) — R$ ${itemNet.toFixed(2)}${tag}`
    })
    const b2bDetails = [
      totalWeight > 0
        ? `*Peso Total Estimado:* ~${
            totalWeight >= 1000
              ? `${(totalWeight / 1000).toFixed(1)} ton (${totalWeight.toLocaleString("pt-BR")} kg)`
              : `${totalWeight.toLocaleString("pt-BR")} kg`
          }`
        : null,
      totalWeight >= 1000
        ? "*Logística Sugerida:* Caminhão Munck ou Carga Paletizada"
        : null,
      totalDiscount > 0 ? `*Desconto B2B Volume:* - R$ ${totalDiscount.toFixed(2)}` : null,
    ].filter(Boolean)
    const msg = [
      `🏗️ *ORÇAMENTO DISCIBRA DISTRIBUIDORA*`,
      `*Código:* #${code}`,
      ``,
      `*Cliente:* ${customerName.trim()}`,
      `*WhatsApp:* ${customerPhone.trim()}`,
      customerCity || customerCep
        ? `*Local de Entrega:* ${customerCity || ""} ${
            customerCep ? `(CEP: ${customerCep})` : ""
          }`
        : null,
      ``,
      `*Itens Solicitados:*`,
      ...whatsLines,
      ``,
      b2bDetails.length > 0 ? `*Resumo B2B:*` : null,
      ...b2bDetails,
      `*Total Estimado:* R$ ${total.toFixed(2)}`,
      ``,
      `Olá! Gostaria de confirmar a disponibilidade e a rota de entrega para este volume de carga.`,
    ].filter((l) => l !== null).join("\n")
    trackWhatsAppClick("checkout_finalize", "/carrinho")
    window.open(waLink(msg), "_blank", "noopener,noreferrer")
    clearCart()
    toast.success("Orçamento gerado com sucesso! Abrindo WhatsApp...")
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-20">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/80 shadow-inner">
          <ShoppingCart className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Seu orçamento está vazio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione produtos ao seu orçamento para solicitar uma cotação.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            { name: "Cimentos", slug: "cimentos" },
            { name: "Argamassas e Rejuntes", slug: "argamassas-e-rejuntes" },
            { name: "Telhas e Coberturas", slug: "telhas-e-coberturas" },
            { name: "Hidráulica", slug: "materiais-hidraulicos" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-semibold text-[#111318] transition-colors hover:bg-[#FAFAF9] hover:border-[#111318]"
            >
              {c.name}
            </Link>
          ))}
        </div>
        <a
          href="https://wa.me/5516996447972?text=Olá! Gostaria de fazer um pedido de materiais de construção."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#166534] mt-6"
          data-track="btn_whatsapp"
          data-button-name="btn_whatsapp"
          data-source="cart_empty_whatsapp"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Pedir direto pelo WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          Carrinho · {totalItems} {totalItems === 1 ? "item" : "itens"}
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="self-start text-xs font-semibold text-[#111318] uppercase tracking-widest transition hover:text-[#C2410C] sm:self-auto"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-3 lg:col-span-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[4px] border border-[#E5E5E3] bg-white p-3 sm:gap-4 sm:p-4"
            >
              {item.image_url ? (
                <Image src={item.image_url.trim()} alt={item.name} width={80} height={80} className="h-16 w-16 shrink-0 rounded-[4px] object-contain sm:h-20 sm:w-20" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] bg-[#FAFAF9] sm:h-20 sm:w-20">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/produto/${item.id}`} className="line-clamp-2 text-sm font-semibold text-[#111318] hover:text-[#C2410C] transition-colors">
                  {item.name}
                </Link>
                <p className="text-sm font-bold text-[#111318] mt-1">R$ {Number(item.price).toFixed(2)} <span className="text-xs text-slate-500 font-normal">/{item.unit}</span></p>
                {getItemDiscountRate(item.name, item.unit, item.qty) === 0.03 && (
                  <span className="inline-block mt-1 rounded-[2px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Palete Fechado (40+ un): 3% OFF
                  </span>
                )}
                {getItemDiscountRate(item.name, item.unit, item.qty) === 0.07 && (
                  <span className="inline-block mt-1 rounded-[2px] bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                    Carga Fechada (560+ un): 7% OFF
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center overflow-hidden rounded-[4px] border border-[#E5E5E3]">
                <button type="button" onClick={() => updateQty(item.id, -1)} className="p-2 text-[#111318] transition hover:bg-[#FAFAF9]">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2rem] px-2 text-center text-sm font-semibold text-[#111318]">{item.qty}</span>
                <button type="button" onClick={() => updateQty(item.id, 1)} className="p-2 text-[#111318] transition hover:bg-[#FAFAF9]">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="shrink-0 w-24 text-right">
                <p className="font-bold text-sm text-[#111318]">
                  R$ {(item.price * item.qty * (1 - getItemDiscountRate(item.name, item.unit, item.qty))).toFixed(2)}
                </p>
                {getItemDiscountRate(item.name, item.unit, item.qty) > 0 && (
                  <p className="text-[10px] text-slate-400 line-through">
                    R$ {(item.price * item.qty).toFixed(2)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 rounded-[4px] p-2 text-slate-500 transition hover:bg-[#FAFAF9] hover:text-[#C2410C]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-[4px] border border-[#E5E5E3] bg-white p-4 sm:p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-heading text-lg font-bold text-[#111318]">Resumo</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal ({totalItems} itens)</span>
              <span className="text-[#111318] font-medium">R$ {grossTotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-[#15803D]">
                <span>Desconto B2B Volume</span>
                <span>- R$ {totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Frete</span>
              <span className="text-[#15803D] font-medium">A calcular</span>
            </div>
            {totalWeight > 0 && (
              <div className="flex justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                <span>Peso Total Estimado</span>
                <span className="font-bold font-mono">
                  {totalWeight >= 1000
                    ? `${(totalWeight / 1000).toFixed(1)} ton (${totalWeight.toLocaleString("pt-BR")} kg)`
                    : `${totalWeight.toLocaleString("pt-BR")} kg`}
                </span>
              </div>
            )}
            {totalWeight >= 1000 && (
              <div className="rounded-[4px] border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800 leading-tight">
                🚛 <strong>Carga Pesada:</strong> Sugerida entrega com caminhão munck ou descarga paletizada.
              </div>
            )}
            <div className="border-t border-[#E5E5E3] pt-3 flex justify-between items-baseline">
              <span className="font-bold text-[#111318]">Total Estimado</span>
              <span className="font-black text-[#15803D] text-2xl font-mono">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          {/* Bloco de Identificação Obrigatória B2B */}
          <div className="mb-6 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-800">
              Dados para Entrega e Contato
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Seu Nome ou Construtora *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João Silva ou Construtora Alfa"
                  className="h-10 w-full rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-[#002D5B]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Seu WhatsApp para Retorno *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  placeholder="(16) 99999-9999"
                  className="h-10 w-full rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-[#002D5B]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  CEP da Obra (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerCep}
                    onChange={(e) => setCustomerCep(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="14000-000"
                    className="h-10 w-full rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-[#002D5B]"
                  />
                </div>
                {loadingCep && (
                  <span className="mt-1 block text-[10px] text-slate-400">
                    Buscando cidade...
                  </span>
                )}
                {customerCity && !loadingCep && (
                  <span className="mt-1 block text-[10px] font-bold text-[#15803D]">
                    📍 {customerCity}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="checkout_finalize"
            onClick={() => void finalizeWhatsApp()}
            disabled={submitting}
            className="mb-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed btn-whatsapp-track"
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
            {submitting ? "Gerando orçamento..." : "Enviar Orçamento pelo WhatsApp"}
          </button>
          <p className="text-[11px] text-slate-500 text-center mb-4 leading-snug">
            Um código de pedido será gerado para você acompanhar em &quot;Minha conta&quot; e em &quot;Rastrear pedido&quot;.
          </p>
          <Link
            href="/"
            className="block w-full rounded-[4px] border border-[#E5E5E3] bg-white px-4 py-3 text-center text-sm font-semibold text-[#111318] transition hover:bg-[#FAFAF9]"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
