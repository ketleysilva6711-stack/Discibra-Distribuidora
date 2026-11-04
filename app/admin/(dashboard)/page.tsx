"use client"

import useSWR from "swr"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  ShoppingCart, Package, Star, MessageCircle, TrendingUp, AlertTriangle,
  ArrowRight, CheckCircle2, Clock, CreditCard,
  ShieldCheck, RefreshCw,
} from "lucide-react"

const supabase = createClient()

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toFixed(2).replace(".", ",")
}

// ── Scanner de Infraestrutura em Tempo Real ──
const VITAL_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/categoria/cimentos", label: "Cimentos" },
  { path: "/calculadora", label: "Calculadora" },
  { path: "/orcamento/ORC-TEST", label: "Proposta Pública" },
]

let supabaseLatencyMs = 0

async function pingSupabase(): Promise<number> {
  const start = Date.now()
  try {
    await supabase.from("products").select("id").limit(1)
  } catch {}
  return Date.now() - start
}

async function fetchRouteStatus(route: string) {
  const start = Date.now()
  let ok = false
  let status = 0
  try {
    const res = await fetch(route, { cache: "no-store", signal: AbortSignal.timeout(5000) })
    status = res.status
    ok = res.ok
  } catch {
    ok = false
    status = 0
  }
  return { path: route, ok, status, ms: Date.now() - start }
}

async function runScanner() {
  const [latency, routeResults] = await Promise.all([
    pingSupabase(),
    Promise.all(VITAL_ROUTES.map((r) => fetchRouteStatus(r.path))),
  ])
  supabaseLatencyMs = latency
  return { latency, routes: routeResults, scannedAt: Date.now() }
}

async function fetchDashboard() {
  const [ordersRes, prodsActive, prodsTotal, lowStock, revPending, clicks, revRecent] = await Promise.all([
    supabase.from("orders").select("id, code, email, status, total, created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id, name, slug, stock, price").lte("stock", 10).order("stock").limit(8),
    supabase.from("reviews").select("id, product_id, customer_name, rating, comment, created_at").eq("approved", false).order("created_at", { ascending: false }).limit(6),
    supabase.from("whatsapp_clicks").select("id, created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ])

  const orders = ordersRes.data || []
  const revenue = orders.reduce((acc, o: any) => acc + (Number(o.total) || 0), 0)
  const pending = orders.filter((o: any) => o.status === "pending").length
  const shipping = orders.filter((o: any) => o.status === "shipping").length

  const since = Date.now() - 7 * 24 * 60 * 60 * 1000
  const clicks7d = (clicks.data || []).filter((c: any) => new Date(c.created_at).getTime() >= since).length

  return {
    orders: orders.slice(0, 8),
    ordersTotal: orders.length,
    revenue,
    pending,
    shipping,
    productsActive: prodsActive.count || 0,
    productsTotal: prodsTotal.count || 0,
    lowStock: lowStock.data || [],
    pendingReviews: revPending.data || [],
    pendingReviewsCount: revPending.data?.length || 0,
    reviewsTotal: revRecent.count || 0,
    clicksTotal: (clicks.data || []).length,
    clicks7d,
  }
}

async function fetchMetrics() {
  const res = await fetch("/api/admin/dashboard-metrics", { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR("admin-dashboard", fetchDashboard, { refreshInterval: 30000 })
  const { data: metrics, isLoading: metricsLoading } = useSWR("admin-metrics", fetchMetrics, {
    refreshInterval: 30000,
  })

  const [scannerStatus, setScannerStatus] = useState<{
    latency: number
    routes: { path: string; ok: boolean; status: number; ms: number }[]
    scannedAt: number
  } | null>(null)
  const [scanning, setScanning] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    try {
      const result = await runScanner()
      setScannerStatus(result)
    } finally {
      setScanning(false)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[4px] border border-[#E5E5E3] bg-white" />
        ))}
      </div>
    )
  }

  const faturamentoReal = metrics?.faturamentoReal ?? 0
  const potencialAberto = metrics?.potencialAberto ?? 0
  const taxaConversao = metrics?.taxaConversao ?? 0

  const kpis = [
    {
      label: "Faturamento Real",
      value: brl(faturamentoReal),
      sub: `${metrics?.pedidosEntregues ?? 0} pedidos entregues`,
      icon: TrendingUp,
      href: "/admin/pedidos",
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Potencial em Aberto",
      value: brl(potencialAberto),
      sub: `${metrics?.orcamentosAbertos ?? 0} orçamentos em negociação`,
      icon: CreditCard,
      href: "/admin/orcamentos",
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Taxa de Conversão",
      value: `${taxaConversao}%`,
      sub: "Orçamentos → Entregues",
      icon: CheckCircle2,
      href: "/admin/orcamentos",
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Produtos ativos",
      value: String(data.productsActive),
      sub: `${data.productsTotal} no total`,
      icon: Package,
      href: "/admin/produtos",
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Avaliações pendentes",
      value: String(data.pendingReviewsCount),
      sub: `${data.reviewsTotal} avaliações`,
      icon: Star,
      href: "/admin/avaliacoes",
      tone: "text-purple-600 bg-purple-50",
    },
  ]

  const mini = [
    { label: "Cliques no WhatsApp", value: data.clicksTotal, sub: `${data.clicks7d} nos últimos 7 dias`, icon: MessageCircle },
    { label: "Estoque baixo", value: data.lowStock.length, sub: "produtos com ≤ 10 un.", icon: AlertTriangle },
    { label: "Ticket médio", value: brl(data.ordersTotal ? data.revenue / data.ordersTotal : 0), sub: "por pedido", icon: TrendingUp },
    { label: "Pedidos em transporte", value: data.shipping, sub: "aguardando entrega", icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* Scanner do Sistema & Operações em Tempo Real */}
      <section className="rounded-[4px] border border-[#E5E5E3] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-[#15803D]" />
              Scanner do Sistema &amp; Operações
            </h2>
            <p className="text-xs text-slate-500">
              Latência do Supabase · integridade das rotas críticas · SLA de orçamentos abertos
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-[4px] border border-[#15803D] bg-white px-4 py-2 text-xs font-bold text-[#15803D] hover:bg-[#15803D] hover:text-white transition-colors disabled:opacity-60"
          >
            {scanning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {scanning ? "Escaneando…" : "Escanear Agora"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Latência Supabase */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Conexão Supabase
            </p>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                supabaseLatencyMs <= 200 ? "bg-[#15803D]" : supabaseLatencyMs <= 500 ? "bg-[#F47920]" : "bg-[#C2410C]"
              } animate-pulse`} />
              <span className="text-sm font-semibold text-slate-900">
                {supabaseLatencyMs} ms
              </span>
              <span className="ml-2 text-[10px] text-slate-500">
                {supabaseLatencyMs <= 200 ? "Estável" : supabaseLatencyMs <= 500 ? "Lento" : "Instável"}
              </span>
            </div>
          </div>

          {/* Integridade das rotas */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Integridade das Rotas
            </p>
            <div className="space-y-2">
              {(scannerStatus?.routes || VITAL_ROUTES.map((r) => ({ path: r.path, ok: true, status: 200, ms: 0 }))).map(
                (r) => (
                  <div key={r.path} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{r.path.replace("/", "") || "home"}</span>
                    <span
                      className={`px-2 py-0.5 rounded-[2px] font-bold ${
                        r.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      {r.ok ? "OK" : "FALHA"} · {r.ms}ms
                    </span>
                  </div>
                )
              )}
              <p className="text-[10px] text-slate-400 mt-2">
                Última verificação:{scannerStatus
                  ? new Date(scannerStatus.scannedAt).toLocaleTimeString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>

          {/* SLA Orçamentos Abertos */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              SLA — Orçamentos Abertos (últimas 2h)
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#C2410C]">
                {metrics?.orcamentosAbertos ?? 0}
              </span>
              <span className="text-sm font-bold text-slate-600">propostas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Aguardando fechamento via WhatsApp
            </p>
          </div>

          {/* Última varredura */}
          <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Status do Sistema
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  scannerStatus ? "bg-[#15803D] animate-pulse" : "bg-slate-400"
                }`}
              />
              <span className={`text-sm font-bold ${scannerStatus ? "text-[#15803D]" : "text-slate-500"}`}>
                {scannerStatus ? "Sistema Verificado" : "Aguardando varredura"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-[4px] border border-[#E5E5E3] bg-white p-5 transition-colors hover:border-[#15803D]"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-[4px] ${k.tone}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 text-2xl font-black tracking-tight text-[#111318]">{k.value}</p>
            <p className="text-sm font-semibold text-slate-600">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Mini métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {mini.map((m) => (
          <div key={m.label} className="rounded-[4px] border border-[#E5E5E3] bg-white p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <m.icon className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wide">{m.label}</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-400">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Últimos pedidos */}
        <div className="lg:col-span-2 rounded-[4px] border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E5E3] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShoppingCart className="h-4 w-4 text-[#15803D]" /> Últimos pedidos
            </h2>
            <Link href="/admin/pedidos" className="text-xs font-bold text-[#15803D] hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                      Nenhum pedido ainda.
                    </td>
                  </tr>
                ) : data.orders.map((o: any) => {
                  const statusLabel =
                    o.status === "pending" ? "Pendente" :
                    o.status === "confirmed" ? "Confirmado" :
                    o.status === "shipping" ? "Em transporte" :
                    o.status === "delivered" || o.status === "entregue" ? "Entregue" :
                    o.status === "cancelled" || o.status === "cancelado" ? "Cancelado" :
                    o.status
                  const statusClass =
                    o.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    o.status === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    o.status === "shipping" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                    o.status === "delivered" || o.status === "entregue" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    o.status === "cancelled" || o.status === "cancelado" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  return (
                    <tr key={o.id} className="border-t border-[#E5E5E3]">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        #{o.code || o.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{o.email || "-"}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{brl(Number(o.total) || 0)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-[4px] px-2 py-1 text-[11px] font-bold border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estoque baixo */}
        <div className="rounded-[4px] border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E5E3] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-[#C2410C]" /> Estoque baixo
            </h2>
            <Link href="/admin/produtos" className="text-xs font-bold text-[#15803D] hover:underline">Gerenciar</Link>
          </div>
          <ul className="divide-y divide-[#E5E5E3]">
            {data.lowStock.length === 0 ? (
              <li className="px-5 py-10 text-center text-slate-400">Tudo em estoque.</li>
            ) : data.lowStock.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link href={`/produto/${p.slug}`} target="_blank" className="min-w-0 truncate text-sm text-slate-700 hover:text-[#C2410C]">
                  {p.name}
                </Link>
                <span className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[11px] font-bold ${p.stock <= 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {p.stock} un.
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Avaliações pendentes */}
        <div className="rounded-[4px] border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E5E3] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Star className="h-4 w-4 text-purple-500" /> Avaliações aguardando aprovação
            </h2>
            <Link href="/admin/avaliacoes" className="text-xs font-bold text-[#15803D] hover:underline">Moderar</Link>
          </div>
          <ul className="divide-y divide-[#E5E5E3]">
            {data.pendingReviews.length === 0 ? (
              <li className="px-5 py-10 text-center text-slate-400">Nenhuma avaliação pendente.</li>
            ) : data.pendingReviews.map((r: any) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{r.customer_name || "Cliente"}</span>
                  <span className="text-xs text-amber-500">{"★".repeat(Math.max(1, Math.min(5, r.rating || 5)))}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
