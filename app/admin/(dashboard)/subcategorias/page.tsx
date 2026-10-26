"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"

const supabase = createClient()
const fetchSubcats = async () => {
  const { data } = await supabase.from("subcategories").select("*, categories(name), products(id)").order("sort_order")
  return data || []
}
const fetchCats = async () => {
  const { data } = await supabase.from("categories").select("id, name").order("name")
  return data || []
}

export default function SubcategoriasPage() {
  const { data: subcategories, mutate, isLoading } = useSWR("admin-subcategories", fetchSubcats)
  const { data: categories } = useSWR("admin-cats-select", fetchCats)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", category_id: "", active: true })

  function generateSlug(name: string) {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  function openNew() { setEditing(null); setForm({ name: "", slug: "", category_id: "", active: true }); setShowForm(true) }

  function openEdit(s: { id: string; name: string; slug: string; category_id: string; active: boolean }) {
    setEditing(s.id); setForm({ name: s.name, slug: s.slug, category_id: s.category_id, active: s.active }); setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.category_id) { toast.error("Nome e categoria obrigatorios"); return }
    const slug = form.slug || generateSlug(form.name)
    if (editing) {
      const { error } = await supabase.from("subcategories").update({ ...form, slug }).eq("id", editing)
      if (error) { toast.error(error.message); return }
      toast.success("Subcategoria atualizada!")
    } else {
      const { error } = await supabase.from("subcategories").insert({ ...form, slug })
      if (error) { toast.error(error.message); return }
      toast.success("Subcategoria criada!")
    }
    setShowForm(false); mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta subcategoria?")) return
    await supabase.from("subcategories").delete().eq("id", id)
    toast.success("Subcategoria excluida!"); mutate()
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#12A06A] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{subcategories?.length || 0} subcategorias cadastradas</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">
          <Plus className="w-4 h-4" /> Nova Subcategoria
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar" : "Nova"} Subcategoria</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Categoria Pai</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none">
                  <option value="">Selecione...</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-[#12A06A]" />
                <label className="text-sm text-slate-900">Ativa</label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">{editing ? "Atualizar" : "Criar"}</button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium hover:bg-slate-200 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Subcategoria</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoria Pai</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Produtos</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {(!subcategories || subcategories.length === 0) ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Nenhuma subcategoria cadastrada.</td></tr>
            ) : subcategories.map((s) => (
              <tr key={s.id} className="border-b border-slate-200 last:border-0">
                <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-5 py-3 text-sm text-slate-500">{s.categories?.name || "-"}</td>
                <td className="px-5 py-3 text-sm text-slate-900">{s.products?.length || 0}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{s.active ? "Ativa" : "Inativa"}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-[#12A06A]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 transition text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
