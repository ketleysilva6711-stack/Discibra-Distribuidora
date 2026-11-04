"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, ArrowLeft, MessageCircle, Printer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createQuoteAction } from "@/app/actions/quote"
import VolumeUpsellBar from "@/components/checkout/VolumeUpsellBar"
import CartItemRow from "@/components/checkout/CartItemRow"
import FreightCalculatorBox from "@/components/checkout/FreightCalculatorBox"
import { waLink, SITE } from "@/lib/site-config"

type CartItem = {
  id: string
  name: string
  sku: string | null
  image_url: string | null
  unit: string
  qty: number
  preco_tabela: number
  preco_aplicado: number
  tipo_preco: string
  subtotal: number
}

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]")
  } catch {
    return []
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart))
  window.dispatchEvent(new Event("cart-updated"))
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [clienteNome, setClienteNome] = useState("")
  const [clienteTelefone, setClienteTelefone] = useState("")
  const [cep, setCep] = useState("")
  const [metodoEntrega, setMetodoEntrega] = useState<"entrega" | "retirada">("entrega")
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "cartao">("pix")
  const [endereco, setEndereco] = useState({
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "SP",
  })
  const [freightResult, setFreightResult] = useState<{
    valorFrete: number
    freteAConfirmar: boolean
    requerMunck: boolean
    sugerirRetirada: boolean
    distanciaKm: number
    pesoTotalKg: number
  } | null>(null)
  const [freightLoading, setFreightLoading] = useState(false)

  useEffect(() => {
    setCart(getCart())
  }, [])

  // Calcular totais
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)
  const subtotalMateriais = cart.reduce((s, i) => s + i.subtotal, 0)
  const pesoTotalKg = cart.reduce((s, i) => s + (Number(i.preco_aplicado) > 0 ? 0 : 0), 0) // placeholder, o peso vem do backend

  // Desconto PIX (3%)
  const descontoPix = formaPagamento === "pix" ? Math.round(subtotalMateriais * 0.03 * 100) / 100 : 0
  const valorFrete = freightResult ? freightResult.valorFrete : 0
  const freteAConfirmar = freightResult ? freightResult.freteAConfirmar : false
  const total = subtotalMateriais - descontoPix + valorFrete

  // Calcular frete quando CEP preenchido
  useEffect(() => {
    if (metodoEntrega === "entrega" && cep.replace(/\D/g, "").length === 8) {
      setFreightLoading(true)
      fetch("/api/freight/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: cep.replace(/\D/g, ""),
          metodoEntrega,
          itens: cart.map((i) => ({ produto_id: i.id, quantidade: i.qty })),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          setFreightResult(data)
          setFreightLoading(false)
        })
        .catch(() => setFreightLoading(false))
    } else if (metodoEntrega === "retirada") {
      setFreightResult({
        valorFrete: 0,
        freteAConfirmar: false,
        requerMunck: false,
        sugerirRetirada: false,
        distanciaKm: 0,
        pesoTotalKg: 0,
      })
    }
  }, [cep, metodoEntrega, cart])

  function updateQty(id: string, delta: number) {
    const updated = cart.map((i) =>
      i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    )
    setCart(updated)
    saveCart(updated)
  }

  function removeItem(id: string) {
    const updated = cart.filter((i) => i.id !== id)
    setCart(updated)
    saveCart(updated)
  }

  function clearCart() {
    setCart([])
    saveCart([])
  }

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "")
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`
    } else if (v.length > 0) {
      v = `(${v}`
    }
    setClienteTelefone(v)
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "")
    if (v.length > 8) v = v.slice(0, 8)
    if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5, 8)}`
    setCep(v)
  }

  async function solicitarOrcamento() {
    if (!clienteNome.trim()) {
      toast.error("Informe seu Nome completo.")
      return
    }
    const telefoneLimpo = clienteTelefone.replace(/\D/g, "")
    if (telefoneLimpo.length < 10) {
      toast.error("Informe um WhatsApp valido com DDD.")
      return
    }

    if (metodoEntrega === "entrega") {
      if (!cep.replace(/\D/g, "") || cep.replace(/\D/g, "").length !== 8) {
        toast.error("Informe um CEP valido para entrega.")
        return
      }
      if (!endereco.logradouro.trim()) {
        toast.error("Informe o logradouro.")
        return
      }
      if (!endereco.numero.trim()) {
        toast.error("Informe o numero.")
        return
      }
      if (!endereco.bairro.trim()) {
        toast.error("Informe o bairro.")
        return
      }
      if (!endereco.cidade.trim()) {
        toast.error("Informe a cidade.")
        return
      }
    }

    const { success, codigo, token, total: totalGerado, whatsappUrl, error } =
      await createQuoteAction({
        cliente_nome: clienteNome.trim(),
        cliente_telefone: telefoneLimpo,
        cliente_email: "",
        metodo_entrega: metodoEntrega,
        endereco_cep: metodoEntrega === "entrega" ? cep.replace(/\D/g, "") : undefined,
        endereco_logradouro: metodoEntrega === "entrega" ? endereco.logradouro : undefined,
        endereco_numero: metodoEntrega === "entrega" ? endereco.numero : undefined,
        endereco_complemento: endereco.complemento || undefined,
        endereco_bairro: metodoEntrega === "entrega" ? endereco.bairro : undefined,
        endereco_cidade: metodoEntrega === "entrega" ? endereco.cidade : undefined,
        endereco_uf: metodoEntrega === "entrega" ? endereco.uf : undefined,
        forma_pagamento: formaPagamento,
        parcelas_cartao: 1,
        itens: cart.map((i) => ({
          produto_id: i.id,
          quantidade: i.qty,
        })),
      })

    if (!success) {
      toast.error(error || "Erro ao gerar orcamento.")
      return
    }

    // Abrir WhatsApp com o link da cotacao
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }

    // Redirecionar para a pagina publica do orcamento
    window.location.href = `/orcamento/${codigo}?t=${token}`

    // Limpar carrinho
    clearCart()

    toast.success(`Orcamento ${codigo} gerado com sucesso!`)
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-20">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FAFAF9] shadow-inner">
          <ShoppingCart className="h-9 w-9 text-slate-400" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Seu orcamento esta vazio</h1>
        <p className="mt-2 text-sm text-slate-500">
          Adicione materiais ao seu orcamento para solicitar uma cotacao.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/produtos"
            className="px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-semibold text-[#111318] transition hover:bg-[#FAFAF9]"
          >
            Ver Materiais
          </Link>
        </div>
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

      {/* Incentivo de volume */}
      <VolumeUpsellBar totalSacos={totalItems} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Coluna esquerda: Itens */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <CartItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              sku={item.sku}
              image_url={item.image_url}
              unit={item.unit}
              quantidade={item.qty}
              preco_tabela={item.preco_tabela}
              preco_aplicado={item.preco_aplicado}
              tipo_preco={item.tipo_preco}
              subtotal={item.subtotal}
              onUpdateQty={updateQty}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Coluna direita: Resumo e checkout */}
        <div className="lg:col-span-4">
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 font-heading text-lg font-bold text-[#111318]">Resumo do Orcamento</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal dos materiais</span>
                <span className="font-medium text-[#111318]">{brl(subtotalMateriais)}</span>
              </div>
              {descontoPix > 0 && (
                <div className="flex justify-between text-sm font-semibold text-[#15803D]">
                  <span>Desconto PIX (3%)</span>
                  <span>- {brl(descontoPix)}</span>
                </div>
              )}
              <FreightCalculatorBox
                cep={cep}
                onCepChange={(v: string) => setCep(v)}
                onCalculate={() => {}}
                loading={freightLoading}
                resultadoFrete={freightResult}
                metodoEntrega={metodoEntrega}
                onMetodoChange={setMetodoEntrega}
              />
              <div className="border-t border-[#E5E5E3] pt-3 flex justify-between items-baseline font-bold text-[#111318]">
                <span>Total Final</span>
                <span className="text-2xl font-black text-[#15803D]">{brl(total)}</span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className="mb-6 rounded-[4px] border border-[#E5E5E3] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Forma de pagamento
              </p>
              <div className="space-y-2">
                <label className="cursor-pointer block rounded-[4px] p-3 border border-[#E5E5E3] hover:bg-[#FAFAF9] transition">
                  <input
                    type="radio"
                    checked={formaPagamento === "pix"}
                    onChange={() => setFormaPagamento("pix")}
                    className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    PIX — Ganhe 3% de desconto imediato
                  </span>
                </label>
                <label className="cursor-pointer block rounded-[4px] p-3 border border-[#E5E5E3] hover:bg-[#FAFAF9] transition">
                  <input
                    type="radio"
                    checked={formaPagamento === "cartao"}
                    onChange={() => setFormaPagamento("cartao")}
                    className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    Cartao de Credito — ate 12x
                  </span>
                </label>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="mb-6 rounded-[4px] border border-[#E5E5E3] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Dados para contato
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Joao Silva"
                    className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={clienteTelefone}
                    onChange={handleTelefoneChange}
                    placeholder="(16) 99999-9999"
                    className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>
            </div>

            {/* Endereco se entrega */}
            {metodoEntrega === "entrega" && (
              <div className="mb-6 rounded-[4px] border border-[#E5E5E3] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Endereco de entrega *
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Logradouro *
                    </label>
                    <input
                      type="text"
                      value={endereco.logradouro}
                      onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                      className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Numero *
                      </label>
                      <input
                        type="text"
                        value={endereco.numero}
                        onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={endereco.complemento}
                        onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={endereco.bairro}
                      onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                      className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={endereco.cidade}
                        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#15803D]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        UF *
                      </label>
                      <input
                        type="text"
                        value={endereco.uf}
                        onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
                        maxLength={2}
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D] uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botao principal */}
            <button
              type="button"
              onClick={solicitarOrcamento}
              className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Solicitar Orcamento via WhatsApp
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3 leading-snug">
              O codigo do orcamento sera gerado e voce sera redirecionado para o WhatsApp com o link da cotacao.
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
    </div>
  )
}
