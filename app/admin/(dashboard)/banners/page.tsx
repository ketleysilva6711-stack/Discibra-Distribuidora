"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { uploadImage } from "@/lib/upload-image"

const supabase = createClient()
const fetcher = async () => {
  const { data } = await supabase.from("banners").select("*").order("sort_order")
  return data || []
}

export default function BannersPage() {
  const { data: banners, mutate, isLoading } = useSWR("admin-banners", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", link: "", active: true, sort_order: 0 })
  const [uploading, setUploading] = useState(false)

  function openNew() { setEditing(null); setForm({ title: "", subtitle: "", image_url: "", link: "", active: true, sort_order: 0 }); setShowForm(true) }

  function openEdit(b: { id: string; title: string | null; subtitle: string | null; image_url: string; link: string | null; active: boolean; sort_order: number }) {
    setEditing(b.id); setForm({ title: b.title || "", subtitle: b.subtitle || "", image_url: b.image_url, link: b.link || "", active: b.active, sort_order: b.sort_order }); setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadImage(file, "banners")
      if (data?.url) {
        setForm((f) => ({ ...f, image_url: data.url }))
        toast.success("Imagem enviada!")
      } else {
        toast.error("Falha no upload")
      }
    } catch {
      toast.error("Erro ao fazer upload")
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleSave() {
    if (!form.image_url) { toast.error("Imagem obrigatoria"); return }
    if (editing) {
      const { error } = await supabase.from("banners").update(form).eq("id", editing)
      if (error) { toast.error(error.message); return }
      toast.success("Banner atualizado!")
    } else {
      const { error } = await supabase.from("banners").insert(form)
      if (error) { toast.error(error.message); return }
      toast.success("Banner criado!")
    }
    setShowForm(false); mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este banner?")) return
    await supabase.from("banners").delete().eq("id", id)
    toast.success("Banner excluido!"); mutate()
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#12A06A] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{banners?.length || 0} banners cadastrados</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar" : "Novo"} Banner</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Titulo</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Subtitulo</label>
                <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Link (opcional)</label>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Imagem*</label>
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                  <span className="font-bold shrink-0">⚠️ Atenção:</span>
                  <span>A imagem deve ter exatamente <strong>1920x430px</strong> para o layout ideal. Formatos: PNG, JPEG ou WebP.</span>
                </div>
                {form.image_url && <Image src={form.image_url.trim()} alt="Banner" width={400} height={150} className="rounded-lg mb-2 object-cover w-full h-32" />}
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-500">{uploading ? "Enviando..." : "Selecionar imagem"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-[#12A06A]" />
                <label className="text-sm text-slate-900">Ativo</label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">{editing ? "Atualizar" : "Criar"}</button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium hover:bg-slate-200 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners?.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="relative h-40">
              <Image src={b.image_url.trim()} alt={b.title || "Banner"} fill className="object-cover" />
              {!b.active && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-sm font-medium text-white bg-slate-100-foreground/80 px-3 py-1 rounded">Inativo</span></div>}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{b.title || "Sem titulo"}</p>
                {b.subtitle && <p className="text-sm text-slate-500">{b.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-[#12A06A]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-red-50 transition text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
