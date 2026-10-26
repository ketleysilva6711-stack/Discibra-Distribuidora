"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Search, ShoppingCart, ChevronDown, RefreshCw, Clock, Truck,
  CheckCircle2, XCircle, Download, Mail, Package,
} from "lucide-react"

const supabase = createClient()

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toFixed(2).replace(".", ",")
}

function fmtDate(iso: string) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

const STATUSES = [
  { key: "pending", label: "Pendente", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  { key: "confirmed", label: "Confirmado", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  { key: "shipping", label: "Em transporte", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Truck },
  { key: "delivered", label: "Entregue", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelado", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
]
const statusMeta = (s: string) => STATUSES.find((x) => x.key === s) || { key: s, label: s, cls: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock }

const PER_PAGE = 20

async function fetcher() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name, email), order_items(*)")
    .order("created_at", { ascending: false })
    .limit(1000)
  if (error) throw error
  return data || []
}

export default function PedidosPage() {
  const { data: orders, mutate, isLoading } = useSWR("admin-orders", fetcher)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const list = orders || []

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return list.filter((o: any) => {
      if (status !== "all" && o.status !== status) return false
      if (!term) return true
      return (
        String(o.code || "").toLowerCase().includes(term) ||
        String(o.email || "").toLowerCase().includes(term) ||
        String(o.customers?.name || "").toLowerCase().includes(term) ||
        String(o.id || "").toLowerCase().includes(term)
      )
    })
  }, [list, q, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const kpis = useMemo(() => {
    const revenue = list.reduce((a: number, o: any) => a + (Number(o.total) || 0), 0)
    return [
      { label: "Pedidos", value: list.length, icon: ShoppingCart, cls: "text-slate-700" },
      { label: "Pendentes", value: list.filter((o: any) => o.status === "pending").length, icon: Clock, cls: "text-amber-600" },
      { label: "Em transporte", value: list.filter((o: any) => o.status === "shipping").length, icon: Truck, cls: "text-indigo-600" },
      { label: "Faturamento", value: brl(revenue), icon: CheckCircle2, cls: "text-emerald-600" },
    ]
  }, [list])

  async function updateStatus(id: string, next: string) {
    setBusy(id)
    const prev = list
    await mutate(list.map((o: any) => (o.id === id ? { ...o, status: next } : o)), false)
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id)
    setBusy(null)
    if (error) {
      toast.error(error.message)
      mutate(prev, false)
      return
    }
    toast.success("Status atualizado")
    mutate()
  }

  function exportCsv() {
    const rows = [
      ["Pedido", "Cliente", "Email", "Itens", "Total", "Status", "Data"],
      ...filtered.map((o: any) => [
        o.code || o.id, o.customers?.name || "", o.email || "",
        String((o.order_items || []).length), String(o.total || 0), o.status || "", o.created_at || "",
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `pedidos-discibra-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <k.icon className={`h-4 w-4 ${k.cls}`} />
              <span className="text-[11px] font-bold uppercase tracking-wide">{k.label}</span>
            </div>
            <p className={`mt-2 text-xl font-black ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Buscar por código, e-mail ou cliente..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#12A06A]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ key: "all", label: "Todos" }, ...STATUSES].map((s) => (
            <button
              key={s.key}
              onClick={() => { setStatus(s.key); setPage(1) }}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                status === s.key ? "border-[#12A06A] bg-[#12A06A] text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutate()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Nenhum pedido encontrado.</td></tr>
              ) : pageItems.map((o: any) => {
                const meta = statusMeta(o.status)
                const items = o.order_items || []
                const isOpen = !!open[o.id]
                return (
                  <>
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <button onClick={() => setOpen((p) => ({ ...p, [o.id]: !p[o.id] }))} className="text-slate-400 hover:text-slate-700">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">#{o.code || String(o.id).slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{o.customers?.name || "-"}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Mail className="h-3 w-3" />{o.email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{items.length}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{brl(o.total)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status || "pending"}
                          disabled={busy === o.id}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none ${meta.cls}`}
                        >
                          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={o.id + "-d"} className="border-b border-slate-100 bg-slate-50/70">
                        <td />
                        <td colSpan={6} className="px-4 py-4">
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <Package className="h-3.5 w-3.5" /> Itens do pedido
                          </p>
                          {items.length === 0 ? (
                            <p className="text-sm text-slate-400">Sem itens detalhados neste pedido.</p>
                          ) : (
                            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                              {items.map((it: any) => (
                                <li key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                  <span className="text-slate-700">{it.product_name || "Produto"}</span>
                                  <span className="text-slate-500">{it.quantity}x · {brl(it.price)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>{filtered.length} pedidos · página {current} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(Math.min(totalPages, current + 1))} disabled={current === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
