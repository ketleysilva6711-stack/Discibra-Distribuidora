"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Smartphone,
  Monitor,
  Apple,
  Globe,
  MousePointerClick,
  MessageCircle,
} from "lucide-react"
import { WA_SOURCE_LABELS, type WaClickSource } from "@/lib/wa-analytics-sources"

type Row = {
  id: string
  source: string
  page: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  created_at: string
}

type Period = "all" | "today" | "7d" | "30d"

const fetcher = async () => {
  const res = await fetch("/api/admin/whatsapp-analytics", { credentials: "include" })
  const json = (await res.json()) as {
    rows?: Row[]
    error?: string
    hint?: string
    code?: string
  }
  if (!res.ok) {
    const parts = [json.error || `Erro HTTP ${res.status}`]
    if (json.hint) parts.push(json.hint)
    throw new Error(parts.join(" — "))
  }
  return (json.rows || []) as Row[]
}

function startOfPeriod(period: Period): Date | null {
  const now = new Date()
  if (period === "all") return null
  if (period === "today") {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
}

function countMap(rows: Row[], key: keyof Row) {
  const m = new Map<string, number>()
  for (const r of rows) {
    const v = String(r[key] || "Outros")
    m.set(v, (m.get(v) || 0) + 1)
  }
  return m
}

function StatBlock({
  title,
  items,
  icon: Icon,
}: {
  title: string
  items: [string, number][]
  icon: typeof Smartphone
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
        <Icon className="w-4 h-4 text-[#12A06A]" />
        {title}
      </div>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">Sem dados</li>
        ) : (
          items.map(([k, v]) => (
            <li key={k} className="flex justify-between text-sm">
              <span className="text-slate-900">{k}</span>
              <span className="font-bold text-[#12A06A] tabular-nums">{v}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

const PERIOD_LABELS: Record<Period, string> = {
  all: "Tudo",
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
}

export default function AnalyticsWhatsAppPage() {
  const [period, setPeriod] = useState<Period>("30d")
  const { data: rawRows, error, isLoading } = useSWR("admin-wa-analytics", fetcher, { revalidateOnFocus: true })

  const rows = useMemo(() => {
    if (!rawRows?.length) return []
    const start = startOfPeriod(period)
    if (!start) return rawRows
    return rawRows.filter((r) => new Date(r.created_at) >= start)
  }, [rawRows, period])

  const total = rows.length

  const bySource = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const label = WA_SOURCE_LABELS[r.source as WaClickSource] || r.source
      m.set(label, (m.get(label) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const deviceSorted = [...countMap(rows, "device_type").entries()].sort((a, b) => b[1] - a[1])
  const browserSorted = [...countMap(rows, "browser").entries()].sort((a, b) => b[1] - a[1])
  const osSorted = [...countMap(rows, "os").entries()].sort((a, b) => b[1] - a[1])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-red-600/5 p-6 space-y-3 text-sm">
        <p className="font-semibold text-red-600">Não foi possível carregar o analytics do WhatsApp</p>
        <p className="text-red-600/90 whitespace-pre-wrap break-words">{error.message}</p>
        <ul className="list-disc pl-5 text-slate-500 space-y-1.5">
            Corrija o banco executando <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">scripts/012_fix_db_schema.sql</code> no SQL do Supabase.
          <li>
            Em produção, defina <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> (Settings → API → service role) ou use a política RLS do mesmo script para leitura como admin logado.
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25d366]" />
            Analytics WhatsApp
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cliques que levam ao WhatsApp — origem, dispositivo e navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === p ? "bg-[#12A06A] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#12A06A] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-[#25d366]/15 to-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <MousePointerClick className="w-4 h-4" />
                Total de cliques
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{total}</p>
              <p className="text-xs text-slate-500 mt-1">{PERIOD_LABELS[period]}</p>
            </div>
            {bySource.slice(0, 3).map(([label, n]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide line-clamp-2">{label}</p>
                <p className="mt-2 text-2xl font-bold text-[#12A06A] tabular-nums">{n}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Cliques por tipo</h3>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/40">
                    <th className="text-left px-4 py-3 font-semibold">Origem</th>
                    <th className="text-right px-4 py-3 font-semibold">Cliques</th>
                    <th className="text-right px-4 py-3 font-semibold w-40">%</th>
                  </tr>
                </thead>
                <tbody>
                  {bySource.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Nenhum evento no período
                      </td>
                    </tr>
                  ) : (
                    bySource.map(([label, n]) => (
                      <tr key={label} className="border-b border-slate-200 last:border-0">
                        <td className="px-4 py-2.5">{label}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{n}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">
                          {total ? Math.round((n / total) * 100) : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatBlock title="Dispositivo / plataforma" items={deviceSorted} icon={Smartphone} />
            <StatBlock title="Navegador" items={browserSorted} icon={Globe} />
            <StatBlock title="Sistema operacional" items={osSorted} icon={Monitor} />
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Apple className="w-3.5 h-3.5 shrink-0 opacity-60" />
            Classificação automática pelo navegador. Dados antigos podem não ter colunas preenchidas até nova migração.
          </p>
        </>
      )}
    </div>
  )
}
