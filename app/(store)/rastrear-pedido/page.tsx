"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Package, Search, Warehouse, Truck, CheckCircle2 } from "lucide-react"
import { findOrderByCode, findOrdersByEmail, type LocalOrder, type OrderStatus } from "@/lib/local-orders"
import WhatsAppCta from "@/components/store/whatsapp-cta"
import { SITE } from "@/lib/site-config"

type RemoteOrder = {
  id: string
  code: string
  email?: string | null
  status: string
  total: number
  items_summary?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type RemoteOrdersResponse = {
  order?: RemoteOrder
  orders?: RemoteOrder[]
}

const STEPS: { key: OrderStatus; label: string; desc: string; icon: typeof Package }[] = [
  { key: "received", label: "Pedido recebido", desc: "Solicitação registrada e em análise.", icon: Package },
  { key: "picking", label: "Separação", desc: "Equipe separando materiais no CD.", icon: Warehouse },
  { key: "shipped", label: "Envio", desc: "Pedido despachado / em rota.", icon: Truck },
  { key: "delivered", label: "Entrega", desc: "Concluído no destino.", icon: CheckCircle2 },
]

function mapRemoteStatus(status: string): OrderStatus {
  const s = (status || "received").toLowerCase()
  if (s === "pending" || s === "confirmed") return "received"
  if (s === "picking") return "picking"
  if (s === "shipping") return "shipped"
  return "delivered"
}

function mapRemoteOrder(o: RemoteOrder): LocalOrder {
  return {
    id: o.id,
    code: o.code,
    email: o.email ?? undefined,
    status: mapRemoteStatus(o.status),
    createdAt: o.created_at ?? new Date().toISOString(),
    total: Number(o.total) || 0,
    itemsSummary: o.items_summary ?? "",
  }
}

function statusIndex(s: OrderStatus) {
  return STEPS.findIndex((x) => x.key === s)
}

function OrderTimeline({ order }: { order: LocalOrder }) {
  const activeIdx = statusIndex(order.status)
  return (
    <div className="mt-8 space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= activeIdx
        const current = i === activeIdx
        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  done
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted text-muted-foreground"
                } ${current ? "ring-2 ring-primary/30" : ""}`}
              >
                <step.icon className="h-5 w-5" aria-hidden />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${i < activeIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <div className={`pb-8 pt-1 ${!done ? "opacity-50" : ""}`}>
              <p className="font-heading font-semibold text-foreground">{step.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RastrearPedidoPage() {
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<LocalOrder | LocalOrder[] | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    const c = code.trim()
    const em = email.trim()

    try {
      if (c) {
        const res = await fetch(`/api/orders?code=${encodeURIComponent(c)}`)
        if (res.ok) {
          const json: RemoteOrdersResponse = await res.json()
          if (json.order) {
            setResult(mapRemoteOrder(json.order))
            setLoading(false)
            return
          }
        }
        if (res.status === 404) {
          const o = findOrderByCode(c)
          setResult(o || null)
          setLoading(false)
          return
        }
      }

      if (em) {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(em)}`)
        if (res.ok) {
          const json: RemoteOrdersResponse = await res.json()
          if (json.orders) {
            setResult(json.orders.map(mapRemoteOrder))
            setLoading(false)
            return
          }
        }
        const list = findOrdersByEmail(em)
        setResult(list.length ? list : null)
      }
    } catch {
      if (c) {
        const o = findOrderByCode(c)
        setResult(o || null)
      } else if (em) {
        const list = findOrdersByEmail(em)
        setResult(list.length ? list : null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] bg-muted/15">
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Rastrear pedido</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Informe o código do pedido (ex.: CCC-12345) ou o e-mail usado no cadastro, se vinculado ao pedido.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-4"
        >
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">
              Código do pedido
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CCC-00000"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">ou</p>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition"
          >
            <Search className="w-4 h-4" />
            Consultar status
          </button>
        </form>

        {searched && result === null && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-foreground font-medium">Não encontramos pedido com esses dados.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Pedidos feitos só pelo WhatsApp podem não aparecer aqui até serem integrados ao sistema. Fale com
              o comercial informando seu nome e cidade.
            </p>
            <div className="mt-5 flex justify-center">
              <WhatsAppCta
                source="contact_page"
                page="/rastrear-pedido"
                text="Olá! Não encontrei meu pedido no rastreamento. Podem ajudar?"
                label={`Falar com a ${SITE.shortName}`}
              />
            </div>
          </div>
        )}

        {searched && result && !Array.isArray(result) && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pedido</p>
                <p className="font-heading text-xl font-bold text-foreground">{result.code}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(result.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Total:{" "}
              <span className="font-semibold text-foreground">R$ {Number(result.total).toFixed(2)}</span>
            </p>
            <p className="text-sm text-foreground/80 mt-2 whitespace-pre-line">{result.itemsSummary}</p>
            <OrderTimeline order={result} />
          </div>
        )}

        {searched && result && Array.isArray(result) && (
          <div className="mt-8 space-y-6">
            <p className="text-sm font-medium text-foreground">{result.length} pedido(s) encontrado(s)</p>
            {result.map((o) => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <p className="font-heading font-bold text-lg">{o.code}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(o.createdAt).toLocaleString("pt-BR")} — R$ {Number(o.total).toFixed(2)}
                </p>
                <OrderTimeline order={o} />
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center leading-relaxed">
          Dica: ao finalizar um pedido pelo carrinho (WhatsApp), um código é gerado automaticamente neste
          dispositivo para acompanhamento.
        </p>
      </div>
    </div>
  )
}
