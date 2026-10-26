"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

const supabase = createClient()
const fetcher = async () => {
  const { data } = await supabase.from("categories").select("*, products(id)").order("sort_order")
  return data || []
}

export default function CategoriasPage() {
  const { data: categories, mutate, isLoading } = useSWR("admin-categories", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", image_url: "", active: true, sort_order: 0 })
  const [uploading, setUploading] = useState(false)

  function openNew() {
    setEditing(null)
    setForm({ name: "", slug: "", image_url: "", active: true, sort_order: 0 })
    setShowForm(true)
  }

  function openEdit(cat: { id: string; name: string; slug: string; image_url: string | null; active: boolean; sort_order: number }) {
    setEditing(cat.id)
    setForm({ name: cat.name, slug: cat.slug, image_url: cat.image_url || "", active: cat.active, sort_order: cat.sort_order })
    setShowForm(true)
  }

  function generateSlug(name: string) {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "produtos")
      fd.append("path_prefix", "categorias")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, image_url: data.url }))
        toast.success("Imagem enviada!")
      } else {
        toast.error(data.error || data.hint || "Erro ao fazer upload")
      }
    } catch {
      toast.error("Erro ao fazer upload")
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleSave() {
    if (!form.name) { toast.error("Nome obrigatorio"); return }
    const slug = form.slug || generateSlug(form.name)
    if (editing) {
      const { error } = await supabase.from("categories").update({ ...form, slug }).eq("id", editing)
      if (error) { toast.error(error.message); return }
      toast.success("Categoria atualizada!")
    } else {
      const { error } = await supabase.from("categories").insert({ ...form, slug })
      if (error) { toast.error(error.message); return }
      toast.success("Categoria criada!")
    }
    setShowForm(false)
    mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta categoria?")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) { toast.error(error.message); return }
    toast.success("Categoria excluida!")
    mutate()
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#12A06A] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{categories?.length || 0} categorias cadastradas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar Categoria" : "Nova Categoria"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Imagem</label>
                {form.image_url && <Image src={form.image_url.trim()} alt="Categoria" width={120} height={80} className="rounded-lg mb-2 object-cover" />}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-500">{uploading ? "Enviando..." : "Selecionar imagem"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-[#12A06A]" />
                <label className="text-sm text-slate-900">Ativa</label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">
                  {editing ? "Atualizar" : "Criar"}
                </button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium hover:bg-slate-200 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Imagem</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoria</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Slug</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Produtos</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat) => (
              <tr key={cat.id} className="border-b border-slate-200 last:border-0">
                <td className="px-5 py-3">
                  {cat.image_url ? (
                    <Image src={cat.image_url.trim()} alt={cat.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs">Sem img</div>
                  )}
                </td>
                <td className="px-5 py-3 font-medium text-slate-900">{cat.name}</td>
                <td className="px-5 py-3 text-sm text-slate-500">{cat.slug}</td>
                <td className="px-5 py-3 text-sm text-slate-900">{cat.products?.length || 0}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cat.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {cat.active ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-[#12A06A]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50 transition text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
