"use client"

import useSWR from "swr"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  ShoppingCart, Package, Star, MessageCircle, TrendingUp, AlertTriangle,
  ArrowRight, CheckCircle2, Clock,
} from "lucide-react"

const supabase = createClient()

function brl(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",")
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

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR("admin-dashboard", fetchDashboard, { refreshInterval: 30000 })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    )
  }

  const kpis = [
    { label: "Faturamento", value: brl(data.revenue), sub: `${data.ordersTotal} pedidos`, icon: TrendingUp, href: "/admin/pedidos", tone: "text-emerald-600 bg-emerald-50" },
    { label: "Pedidos pendentes", value: String(data.pending), sub: `${data.shipping} em transporte`, icon: Clock, href: "/admin/pedidos", tone: "text-amber-600 bg-amber-50" },
    { label: "Produtos ativos", value: String(data.productsActive), sub: `${data.productsTotal} no total`, icon: Package, href: "/admin/produtos", tone: "text-blue-600 bg-blue-50" },
    { label: "Avaliações pendentes", value: String(data.pendingReviewsCount), sub: `${data.reviewsTotal} avaliações`, icon: Star, href: "/admin/avaliacoes", tone: "text-purple-600 bg-purple-50" },
  ]

  const mini = [
    { label: "Cliques no WhatsApp", value: data.clicksTotal, sub: `${data.clicks7d} nos últimos 7 dias`, icon: MessageCircle },
    { label: "Estoque baixo", value: data.lowStock.length, sub: "produtos com ≤ 10 un.", icon: AlertTriangle },
    { label: "Ticket médio", value: brl(data.ordersTotal ? data.revenue / data.ordersTotal : 0), sub: "por pedido", icon: TrendingUp },
    { label: "Pedidos em transporte", value: data.shipping, sub: "aguardando entrega", icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${k.tone}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">{k.value}</p>
            <p className="text-sm font-semibold text-slate-600">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Mini métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {mini.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-4">
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
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShoppingCart className="h-4 w-4 text-[#12A06A]" /> Últimos pedidos
            </h2>
            <Link href="/admin/pedidos" className="text-xs font-bold text-[#12A06A] hover:underline">Ver todos</Link>
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
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Nenhum pedido ainda.</td></tr>
                ) : data.orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-slate-700">#{o.code || o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-slate-500">{o.email || "-"}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{brl(Number(o.total) || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        o.status === "pending" ? "bg-amber-50 text-amber-700" :
                        o.status === "shipping" ? "bg-blue-50 text-blue-700" :
                        o.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {o.status === "pending" ? "Pendente" : o.status === "shipping" ? "Em transporte" : o.status === "delivered" ? "Entregue" : o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estoque baixo */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Estoque baixo
            </h2>
            <Link href="/admin/produtos" className="text-xs font-bold text-[#12A06A] hover:underline">Gerenciar</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.lowStock.length === 0 ? (
              <li className="px-5 py-10 text-center text-slate-400">Tudo em estoque.</li>
            ) : data.lowStock.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link href={`/produto/${p.slug}`} target="_blank" className="min-w-0 truncate text-sm text-slate-700 hover:text-[#12A06A]">
                  {p.name}
                </Link>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stock <= 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {p.stock} un.
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Avaliações pendentes */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Star className="h-4 w-4 text-purple-500" /> Avaliações aguardando aprovação
          </h2>
          <Link href="/admin/avaliacoes" className="text-xs font-bold text-[#12A06A] hover:underline">Moderar</Link>
        </div>
        <ul className="divide-y divide-slate-100">
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
  )
}
