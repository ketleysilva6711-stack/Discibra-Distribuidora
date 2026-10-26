"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Check, X as XIcon, Trash2, Pencil, Search, MessageSquare, Star, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

const supabase = createClient()
const PER_PAGE = 25

type Review = {
  id: string
  product_id: string
  customer_name: string
  rating: number
  comment: string
  approved: boolean
  created_at: string
  products?: { name: string; image_url: string | null }[] | null
}

const fetchReviews = async ([, page, q, st]: [string, number, string, string]) => {
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1
  let query = supabase
    .from("reviews")
    .select("id, product_id, customer_name, rating, comment, approved, created_at, products(name, image_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
  if (st === "pending") query = query.eq("approved", false)
  if (st === "approved") query = query.eq("approved", true)
  if (q) query = query.or(`customer_name.ilike.%${q}%,comment.ilike.%${q}%`)
  const { data, count, error } = await query
  if (error) throw error
  const rows: Review[] = (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    customer_name: item.customer_name,
    rating: item.rating,
    comment: item.comment,
    approved: item.approved,
    created_at: item.created_at,
    products: Array.isArray(item.products)
      ? (item.products[0] ?? null)
      : (item.products ?? null),
  }))
  return { rows, count: count || 0 }
}

export default function AvaliacoesPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [st, setSt] = useState("all")
  const { data, mutate, isLoading } = useSWR(["admin-reviews", page, q, st], fetchReviews, { keepPreviousData: true })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Review | null>(null)
  const [form, setForm] = useState({ customer_name: "", comment: "", rating: 5 })

  const rows = data?.rows || []
  const total = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  async function toggleApproval(id: string, current: boolean) {
    const { error } = await supabase.from("reviews").update({ approved: !current }).eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success(current ? "Ocultada" : "Aprovada")
    mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta avaliação?")) return
    const { error } = await supabase.from("reviews").delete().eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success("Excluída")
    setSelected((s) => { const n = new Set(s); n.delete(id); return n })
    mutate()
  }

  async function bulk(updates: any, label: string) {
    const ids = Array.from(selected)
    if (!ids.length) return
    const { error } = await supabase.from("reviews").update(updates).in("id", ids)
    if (error) { toast.error(error.message); return }
    toast.success(`${ids.length} ${label}`)
    setSelected(new Set())
    mutate()
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (!ids.length || !confirm(`Excluir ${ids.length} avaliações?`)) return
    await supabase.from("reviews").delete().in("id", ids)
    setSelected(new Set())
    toast.success("Excluídas")
    mutate()
  }

  async function saveEdit() {
    if (!editing) return
    const { error } = await supabase.from("reviews").update(form).eq("id", editing.id)
    if (error) { toast.error(error.message); return }
    toast.success("Avaliação atualizada")
    setEditing(null)
    mutate()
  }

  function toggleAll() {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Buscar por cliente ou texto..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#12A06A]" />
        </div>
        <select value={st} onChange={(e) => { setSt(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#12A06A]">
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
        </select>
        <button onClick={() => mutate()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#12A06A]/30 bg-[#12A06A]/5 p-3 text-xs font-bold text-slate-700">
          <span>{selected.size} selecionadas</span>
          <button onClick={() => bulk({ approved: true }, "aprovadas")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">Aprovar</button>
          <button onClick={() => bulk({ approved: false }, "ocultadas")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">Ocultar</button>
          <button onClick={bulkDelete} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-red-600">Excluir</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-500">limpar</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Avaliação</th>
                <th className="w-24 px-4 py-3">Data</th>
                <th className="w-28 px-4 py-3">Status</th>
                <th className="w-32 px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Nenhuma avaliação encontrada.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={() => setSelected((s) => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.products?.[0]?.image_url ? (
                        <Image src={r.products[0].image_url.trim()} alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <MessageSquare className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <p className="line-clamp-2 max-w-[200px] font-medium text-slate-700">{r.products?.[0]?.name || "Produto excluído"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-bold text-slate-800">{r.customer_name}</span>
                      <span className="text-amber-400">{"★".repeat(Math.max(1, Math.min(5, r.rating || 5)))}</span>
                    </div>
                    <p className="line-clamp-2 text-slate-500" title={r.comment}>“{r.comment}”</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${r.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.approved ? "Aprovada" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleApproval(r.id, r.approved)} title={r.approved ? "Ocultar" : "Aprovar"}
                        className={`rounded-lg p-2 ${r.approved ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                        {r.approved ? <XIcon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => { setEditing(r); setForm({ customer_name: r.customer_name, comment: r.comment, rating: r.rating }) }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(r.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{total.toLocaleString("pt-BR")} avaliações · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Anterior</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Editar avaliação</h3>
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="font-semibold text-slate-700">Cliente</span>
                <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-slate-700">Nota</span>
                <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrelas</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-slate-700">Comentário</span>
                <textarea rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Cancelar</button>
              <button onClick={saveEdit} className="rounded-lg bg-[#12A06A] px-4 py-2 text-sm font-bold text-white hover:bg-[#0e8a5b]">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
