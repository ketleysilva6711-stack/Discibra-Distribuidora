"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, X, Phone, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"

const supabase = createClient()

const fetchNumbers = async () => {
  const { data } = await supabase.from("whatsapp_numbers").select("*").order("sort_order")
  return data || []
}

type WForm = { name: string; phone: string; sort_order: string; active: boolean }
const emptyForm: WForm = { name: "", phone: "", sort_order: "0", active: true }

export default function WhatsAppPage() {
  const { data: numbers, mutate, isLoading } = useSWR("admin-whatsapp", fetchNumbers)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<WForm>(emptyForm)

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true) }

  function openEdit(n: Record<string, unknown>) {
    setEditing(n.id as string)
    setForm({
      name: n.name as string,
      phone: n.phone as string,
      sort_order: String(n.sort_order || 0),
      active: n.active as boolean,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.phone) { toast.error("Nome e telefone sao obrigatorios"); return }
    const payload = {
      name: form.name,
      phone: form.phone.replace(/\D/g, ""),
      sort_order: parseInt(form.sort_order) || 0,
      active: form.active,
    }

    if (editing) {
      const { error } = await supabase.from("whatsapp_numbers").update(payload).eq("id", editing)
      if (error) { toast.error(error.message); return }
      toast.success("Numero atualizado!")
    } else {
      const { error } = await supabase.from("whatsapp_numbers").insert(payload)
      if (error) { toast.error(error.message); return }
      toast.success("Numero adicionado!")
    }
    setShowForm(false); mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este numero?")) return
    await supabase.from("whatsapp_numbers").delete().eq("id", id)
    toast.success("Numero excluido!"); mutate()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("whatsapp_numbers").update({ active: !active }).eq("id", id)
    toast.success(active ? "Numero desativado" : "Numero ativado")
    mutate()
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#12A06A] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{numbers?.length || 0} numeros cadastrados</p>
          <p className="text-xs text-slate-500 mt-1">Gerencie os numeros de WhatsApp que recebem pedidos. O sistema faz rodizio automatico entre os numeros ativos.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">
          <Plus className="w-4 h-4" /> Novo Numero
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar Numero" : "Novo Numero"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nome do Vendedor</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Vendedor 1" className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Numero WhatsApp (com DDI)</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="5516996447972" className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
                <p className="text-xs text-slate-500 mt-1">Formato: 55 + DDD + numero (ex: 5516996447972)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Ordem</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] outline-none" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-[#12A06A]" />
                <span className="text-sm text-slate-900">Ativo</span>
              </label>
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 py-2 bg-[#12A06A] text-white rounded-lg font-medium hover:bg-[#0e8a5b] transition">{editing ? "Atualizar" : "Adicionar"}</button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium hover:bg-slate-200 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {numbers?.map((n) => (
          <div key={n.id} className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between ${!n.active ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${n.active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900">{n.name}</h4>
                <p className="text-sm text-slate-500">+{n.phone}</p>
                <p className="text-xs text-slate-500 mt-0.5">Pedidos: {n.order_count || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActive(n.id, n.active)} className={`p-2 rounded-lg transition ${n.active ? "hover:bg-red-50 text-green-600 hover:text-red-500" : "hover:bg-green-50 text-slate-500 hover:text-green-600"}`} title={n.active ? "Desativar" : "Ativar"}>
                {n.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
              </button>
              <button onClick={() => openEdit(n)} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-[#12A06A]"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(n.id)} className="p-2 rounded-lg hover:bg-red-50 transition text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {(!numbers || numbers.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Phone className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum numero cadastrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
