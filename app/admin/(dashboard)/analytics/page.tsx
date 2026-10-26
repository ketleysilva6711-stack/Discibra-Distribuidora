"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart3, ShoppingCart, Users, Package, DollarSign, Eye,
  MessageCircle, TrendingUp, Clock, Truck, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react"

const supabase = createClient()

function brl(n: number) { return "R$ " + (Number(n) || 0).toFixed(2).replace(".", ",") }

const head = { count: "exact" as const, head: true }

const fetchStats = async () => {
  const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const [
    ordersTotal, ordersTotals, pending, confirmed, shipping, delivered, cancelled,
    recent7, recent30, customers, prodActive, prodTotal, revTotal, revApproved,
    clicksTotal, clicks7,
  ] = await Promise.all([
    supabase.from("orders").select("id", head),
    supabase.from("orders").select("total").limit(1000),
    supabase.from("orders").select("id", head).eq("status", "pending"),
    supabase.from("orders").select("id", head).eq("status", "confirmed"),
    supabase.from("orders").select("id", head).eq("status", "shipping"),
    supabase.from("orders").select("id", head).eq("status", "delivered"),
    supabase.from("orders").select("id", head).eq("status", "cancelled"),
    supabase.from("orders").select("id", head).gte("created_at", since7),
    supabase.from("orders").select("id", head).gte("created_at", since30),
    supabase.from("customers").select("id", head),
    supabase.from("products").select("id", head).eq("active", true),
    supabase.from("products").select("id", head),
    supabase.from("reviews").select("id", head),
    supabase.from("reviews").select("id", head).eq("approved", true),
    supabase.from("whatsapp_clicks").select("id", head),
    supabase.from("whatsapp_clicks").select("id", head).gte("created_at", since7),
  ])

  const revenue = (ordersTotals.data || []).reduce((a, o: any) => a + (Number(o.total) || 0), 0)
  const totalOrders = ordersTotal.count || 0

  return {
    revenue,
    totalOrders,
    avgTicket: totalOrders ? revenue / totalOrders : 0,
    customers: customers.count || 0,
    prodActive: prodActive.count || 0,
    prodTotal: prodTotal.count || 0,
    revTotal: revTotal.count || 0,
    revApproved: revApproved.count || 0,
    clicksTotal: clicksTotal.count || 0,
    clicks7: clicks7.count || 0,
    recent7: recent7.count || 0,
    recent30: recent30.count || 0,
    byStatus: {
      pending: pending.count || 0,
      confirmed: confirmed.count || 0,
      shipping: shipping.count || 0,
      delivered: delivered.count || 0,
      cancelled: cancelled.count || 0,
    },
  }
}

export default function AnalyticsPage() {
  const { data: s, isLoading, mutate } = useSWR("admin-analytics", fetchStats, { refreshInterval: 60000 })

  if (isLoading || !s) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
  }

  const cards = [
    { label: "Faturamento", value: brl(s.revenue), icon: DollarSign, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Ticket médio", value: brl(s.avgTicket), icon: TrendingUp, tone: "bg-blue-50 text-blue-600" },
    { label: "Pedidos", value: s.totalOrders, icon: ShoppingCart, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Pedidos (7 dias)", value: s.recent7, icon: BarChart3, tone: "bg-violet-50 text-violet-600" },
    { label: "Produtos ativos", value: s.prodActive, sub: `${s.prodTotal} no total`, icon: Package, tone: "bg-orange-50 text-orange-600" },
    { label: "Avaliações", value: `${s.revApproved}/${s.revTotal}`, sub: "aprovadas/total", icon: Eye, tone: "bg-amber-50 text-amber-600" },
    { label: "Cliques WhatsApp", value: s.clicksTotal, sub: `${s.clicks7} em 7 dias`, icon: MessageCircle, tone: "bg-teal-50 text-teal-600" },
    { label: "Clientes", value: s.customers, icon: Users, tone: "bg-purple-50 text-purple-600" },
  ]

  const statuses = [
    { label: "Pendentes", value: s.byStatus.pending, cls: "bg-amber-50 text-amber-600", icon: Clock },
    { label: "Confirmados", value: s.byStatus.confirmed, cls: "bg-blue-50 text-blue-600", icon: CheckCircle2 },
    { label: "Em transporte", value: s.byStatus.shipping, cls: "bg-indigo-50 text-indigo-600", icon: Truck },
    { label: "Entregues", value: s.byStatus.delivered, cls: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
    { label: "Cancelados", value: s.byStatus.cancelled, cls: "bg-red-50 text-red-600", icon: XCircle },
  ]

  const totalForBar = Object.values(s.byStatus).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Métricas reais da loja · atualiza a cada 60s</p>
        <button onClick={() => mutate()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}><c.icon className="h-5 w-5" /></div>
            <p className="mt-3 text-2xl font-black text-slate-900">{c.value}</p>
            <p className="text-sm font-semibold text-slate-600">{c.label}</p>
            {c.sub && <p className="text-xs text-slate-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-5 text-sm font-bold text-slate-900">Pedidos por status</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {statuses.map((st) => (
            <div key={st.label} className="rounded-xl border border-slate-100 p-4 text-center">
              <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${st.cls}`}>
                <st.icon className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{st.value}</p>
              <p className="text-xs text-slate-500">{st.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {statuses.map((st) => (
            <div key={st.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{st.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${st.cls.replace("text-", "bg-").split(" ")[0]}`} style={{ width: `${Math.round((st.value / totalForBar) * 100)}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-slate-600">{st.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
