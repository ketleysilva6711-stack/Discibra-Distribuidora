"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"
import {
  Plus, Pencil, Trash2, X, Upload, ImageIcon, Package, Search,
  Star, RefreshCw, CheckCircle2, XCircle, Sparkles,
} from "lucide-react"
import { uploadImage } from "@/lib/upload-image"

const supabase = createClient()
const PER_PAGE = 20

function brl(n: number) { return "R$ " + (Number(n) || 0).toFixed(2).replace(".", ",") }

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const SELECT = "id, name, slug, description, price, original_price, stock, active, featured, is_new, is_discount, image_url, images, unit, sku, weight, height, width, depth, category_id, subcategory_id, categories(name)"

const fetchProducts = async ([, page, q, cat, st]: [string, number, string, string, string]) => {
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1
  let query = supabase.from("products").select(SELECT, { count: "exact" }).order("created_at", { ascending: false }).range(from, to)
  if (q) query = query.ilike("name", `%${q}%`)
  if (cat) query = query.eq("category_id", cat)
  if (st === "active") query = query.eq("active", true)
  if (st === "inactive") query = query.eq("active", false)
  if (st === "low") query = query.lte("stock", 10)
  if (st === "featured") query = query.eq("featured", true)
  const { data, count, error } = await query
  if (error) throw error
  return { rows: data || [], count: count || 0 }
}

const fetchCats = async () => (await supabase.from("categories").select("id, name").order("name")).data || []
const fetchSubcats = async () => (await supabase.from("subcategories").select("id, name, category_id").order("name")).data || []

type ProductForm = {
  name: string; slug: string; description: string; price: string; original_price: string;
  category_id: string; subcategory_id: string; image_url: string; images: string[];
  unit: string; stock: string; active: boolean; featured: boolean;
  sku: string; weight: string; height: string; width: string; depth: string;
  is_new: boolean; is_discount: boolean
}

const emptyForm: ProductForm = {
  name: "", slug: "", description: "", price: "", original_price: "",
  category_id: "", subcategory_id: "", image_url: "", images: [],
  unit: "un", stock: "0", active: true, featured: false,
  sku: "", weight: "0", height: "0", width: "0", depth: "0", is_new: false, is_discount: false,
}

function InlineNumber({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value ?? 0))
  useEffect(() => { setV(String(value ?? 0)) }, [value])
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { const n = Number(v.replace(",", ".")); if (!Number.isNaN(n) && n !== value) onCommit(n) }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#12A06A]"
    />
  )
}

export default function ProdutosPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("")
  const [st, setSt] = useState("all")
  const { data, mutate, isLoading } = useSWR(["admin-products", page, q, cat, st], fetchProducts, { keepPreviousData: true })
  const { data: categories } = useSWR("admin-cats", fetchCats)
  const { data: subcategories } = useSWR("admin-subcats", fetchSubcats)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const rows = data?.rows || []
  const total = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const filteredSubcats = (subcategories || []).filter((s: any) => s.category_id === form.category_id)

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(p: any) {
    setEditing(p.id)
    setForm({
      name: p.name || "", slug: p.slug || "", description: p.description || "",
      price: String(p.price ?? ""), original_price: p.original_price ? String(p.original_price) : "",
      category_id: p.category_id || "", subcategory_id: p.subcategory_id || "",
      image_url: p.image_url || "", images: p.images || [],
      unit: p.unit || "un", stock: String(p.stock ?? 0),
      active: !!p.active, featured: !!p.featured, sku: p.sku || "",
      weight: String(p.weight ?? 0), height: String(p.height ?? 0),
      width: String(p.width ?? 0), depth: String(p.depth ?? 0),
      is_new: !!p.is_new, is_discount: !!p.is_discount,
    })
    setShowForm(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      try {
        const res = await uploadImage(file, "produtos")
        if (res?.url) { urls.push(res.url); toast.success(`Enviada: ${file.name}`) }
        else toast.error("Falha no upload")
      } catch { toast.error("Erro no upload") }
    }
    setForm((f) => {
      const all = [...f.images, ...urls].slice(0, 10)
      return { ...f, images: all, image_url: f.image_url || all[0] || "" }
    })
    setUploading(false)
    e.target.value = ""
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) { toast.error("Nome e preço são obrigatórios"); return }
    setBusy("save")
    const payload: any = {
      name: form.name.trim(),
      slug: form.slug?.trim() || slugify(form.name),
      description: form.description || null,
      price: Number(String(form.price).replace(",", ".")) || 0,
      original_price: form.original_price ? Number(String(form.original_price).replace(",", ".")) : null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      image_url: form.image_url || null,
      images: form.images || [],
      unit: form.unit || "un",
      stock: Number(form.stock) || 0,
      active: form.active, featured: form.featured,
      sku: form.sku || null,
      weight: Number(form.weight) || 0, height: Number(form.height) || 0,
      width: Number(form.width) || 0, depth: Number(form.depth) || 0,
      is_new: form.is_new, is_discount: form.is_discount,
    }
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing)
      : await supabase.from("products").insert(payload)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? "Produto atualizado" : "Produto criado")
    setShowForm(false)
    mutate()
  }

  async function patch(id: string, values: any) {
    setBusy(id)
    const { error } = await supabase.from("products").update(values).eq("id", id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    mutate()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"?`)) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success("Produto excluído")
    setSelected((s) => { const n = new Set(s); n.delete(id); return n })
    mutate()
  }

  async function bulk(updates: any) {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBusy("bulk")
    const { error } = await supabase.from("products").update(updates).in("id", ids)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${ids.length} produtos atualizados`)
    setSelected(new Set())
    mutate()
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (!ids.length || !confirm(`Excluir ${ids.length} produtos?`)) return
    setBusy("bulk")
    await supabase.from("products").delete().in("id", ids)
    setBusy(null)
    setSelected(new Set())
    mutate()
  }

  async function fetchImage(id: string, name: string) {
    if (!confirm(`Buscar imagem na internet para "${name}"?`)) return
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/products/${id}/fetch-image`, { method: "POST" })
      const json = await res.json()
      if (json.error) toast.error(json.error); else { toast.success("Imagem atualizada"); mutate() }
    } catch { toast.error("Erro ao buscar imagem") }
    setBusy(null)
  }

  function toggleAll() {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r: any) => r.id))))
  }

  return (
    <div className="space-y-5">
      {/* Barra de ações */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Buscar produto por nome..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#12A06A]" />
        </div>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#12A06A]">
          <option value="">Todas as categorias</option>
          {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={st} onChange={(e) => { setSt(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#12A06A]">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="low">Estoque baixo</option>
          <option value="featured">Em destaque</option>
        </select>
        <button onClick={() => mutate()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-[#12A06A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0e8a5b]">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      {/* Ações em lote */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#12A06A]/30 bg-[#12A06A]/5 p-3 text-xs font-bold text-slate-700">
          <span>{selected.size} selecionados</span>
          <button onClick={() => bulk({ active: true })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">Ativar</button>
          <button onClick={() => bulk({ active: false })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">Desativar</button>
          <button onClick={() => bulk({ featured: true })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">Destacar</button>
          <button onClick={bulkDelete} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-red-600">Excluir</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-500">limpar</button>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} />
                </th>
                <th className="px-3 py-3">Produto</th>
                <th className="px-3 py-3">Categoria</th>
                <th className="px-3 py-3">Preço</th>
                <th className="px-3 py-3">Estoque</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Nenhum produto encontrado.</td></tr>
              ) : rows.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)}
                      onChange={() => setSelected((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        {p.image_url ? <Image src={p.image_url.trim()} alt={p.name} width={44} height={44} className="h-11 w-11 object-cover" /> : <Package className="m-2.5 h-6 w-6 text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 font-semibold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.sku || p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{p.categories?.name || "-"}</td>
                  <td className="px-3 py-3"><InlineNumber value={Number(p.price)} onCommit={(v) => patch(p.id, { price: v })} /></td>
                  <td className="px-3 py-3"><InlineNumber value={Number(p.stock)} onCommit={(v) => patch(p.id, { stock: v })} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => patch(p.id, { active: !p.active })} title={p.active ? "Desativar" : "Ativar"}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${p.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </button>
                      <button onClick={() => patch(p.id, { featured: !p.featured })} title="Destaque"
                        className={`rounded-lg border p-1.5 ${p.featured ? "border-amber-200 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-400"}`}>
                        <Star className={`h-3.5 w-3.5 ${p.featured ? "fill-amber-400" : ""}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => fetchImage(p.id, p.name)} disabled={busy === p.id} title="Buscar imagem"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Sparkles className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(p)} title="Editar"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} title="Excluir"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{total} produtos · página {page} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Anterior</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">{editing ? "Editar produto" : "Novo produto"}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 text-sm">
                  <span className="font-semibold text-slate-700">Nome *</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Preço (R$) *</span>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Preço original</span>
                  <input value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Categoria</span>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]">
                    <option value="">—</option>
                    {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Subcategoria</span>
                  <select value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]">
                    <option value="">—</option>
                    {filteredSubcats.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Unidade</span>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">Estoque</span>
                  <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-slate-700">SKU</span>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
                <label className="sm:col-span-2 text-sm">
                  <span className="font-semibold text-slate-700">Descrição</span>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#12A06A]" />
                </label>
              </div>

              {/* Imagens */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Imagens ({form.images.length}/10)</p>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img) => (
                    <div key={img} className="relative">
                      <Image src={img.trim()} alt="Produto" width={96} height={96} className="h-24 w-24 rounded-lg border-2 border-slate-100 object-cover" />
                      {form.image_url === img && <span className="absolute left-1 top-1 rounded bg-[#12A06A] px-1.5 py-0.5 text-[9px] font-bold text-white">principal</span>}
                      <div className="absolute -right-2 -top-2 flex gap-1">
                        <button type="button" onClick={() => setForm({ ...form, image_url: img })} className="rounded-full bg-slate-700 p-1 text-white"><ImageIcon className="h-3 w-3" /></button>
                        <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((i) => i !== img), image_url: form.image_url === img ? "" : form.image_url })} className="rounded-full bg-red-500 p-1 text-white"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#12A06A]">
                    <Upload className="h-5 w-5" />
                    <span className="mt-1 text-[10px]">{uploading ? "enviando..." : "upload"}</span>
                    <input type="file" accept="image/*" multiple hidden onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-4 text-sm">
                {([["active", "Ativo"], ["featured", "Destaque"], ["is_new", "Novidade"], ["is_discount", "Em oferta"]] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 font-medium text-slate-700">
                    <input type="checkbox" checked={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked } as any)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600">Cancelar</button>
              <button onClick={handleSave} disabled={busy === "save"} className="rounded-lg bg-[#12A06A] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0e8a5b] disabled:opacity-60">
                {busy === "save" ? "Salvando..." : editing ? "Atualizar" : "Criar produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
