"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Save, Truck, MapPin, RefreshCw, ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { toast } from "sonner"

const supabase = createAdminClient()

const brl = (n: number) =>
  "R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

type FaixaFrete = {
  id: string
  km_max: number
  km_faixa_anterior: number
  valor_base: number
  valor_km_adicional: number
  valor_minimo_frete_gratis: number | null
  taxa_munck: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

type SiteSettings = {
  cep_base?: string
  logradouro_base?: string
  numero_base?: string
  bairro_base?: string
  cidade_base?: string
  uf_base?: string
}

export default function FretePage() {
  const [faixas, setFaixas] = useState<FaixaFrete[]>([])
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<{
    km_max: string
    km_faixa_anterior: string
    valor_base: string
    valor_km_adicional: string
    valor_minimo_frete_gratis: string
    taxa_munck: string
  }>({
    km_max: "",
    km_faixa_anterior: "",
    valor_base: "",
    valor_km_adicional: "",
    valor_minimo_frete_gratis: "",
    taxa_munck: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [fRes, sRes] = await Promise.all([
        supabase.from("configuracoes_frete").select("*").order("km_max", { ascending: true }),
        supabase.from("site_settings").select("*").eq("id", "default").maybeSingle(),
      ])
      if (fRes.error) throw fRes.error
      if (sRes.error) throw sRes.error

      setFaixas(fRes.data || [])
      setSettings((sRes.data as SiteSettings) || {})
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar configurações de frete")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(faixa: FaixaFrete) {
    setEditId(faixa.id)
    setEditMode({
      km_max: String(faixa.km_max),
      km_faixa_anterior: String(faixa.km_faixa_anterior || 0),
      valor_base: String(faixa.valor_base),
      valor_km_adicional: String(faixa.valor_km_adicional || 0),
      valor_minimo_frete_gratis: faixa.valor_minimo_frete_gratis !== null ? String(faixa.valor_minimo_frete_gratis) : "",
      taxa_munck: String(faixa.taxa_munck || 250),
    })
  }

  function cancelEdit() {
    setEditId(null)
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("configuracoes_frete")
        .update({
          km_max: Number(editMode.km_max) || 0,
          km_faixa_anterior: Number(editMode.km_faixa_anterior) || 0,
          valor_base: Number(editMode.valor_base) || 0,
          valor_km_adicional: Number(editMode.valor_km_adicional) || 0,
          valor_minimo_frete_gratis: editMode.valor_minimo_frete_gratis ? Number(editMode.valor_minimo_frete_gratis) : null,
          taxa_munck: Number(editMode.taxa_munck) || 250,
        })
        .eq("id", editId)
      if (error) throw error
      toast.success("Faixa de frete atualizada")
      setEditId(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar faixa")
    } finally {
      setSaving(false)
    }
  }

  const isEditing = (id: string) => editId === id

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mb-2" />
        <p className="text-slate-500">Carregando configurações de frete...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E3] pb-6 bg-white p-6 rounded-[4px]">
        <div>
          <h1 className="text-xl font-bold text-[#111318]">Gestão de Frete</h1>
          <p className="text-sm text-slate-500">Faixas de distância, valor base, km adicional e taxa de munck</p>
        </div>
        <Link
          href="/admin/settings"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar às configurações
        </Link>
      </div>

      {/* CD Base */}
      <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4 mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Centro de Distribuição (Base)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700">CEP:</span>
            <span className="text-slate-900">{settings.cep_base || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-400">Logradouro:</span>
            <span className="text-slate-900">{settings.logradouro_base || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-400">Número:</span>
            <span className="text-slate-900">{settings.numero_base || "—"}</span>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <span className="font-medium text-slate-400">Bairro / Cidade / UF:</span>
            <span className="text-slate-900">
              {settings.bairro_base || "—"} / {settings.cidade_base || "—"} / {settings.uf_base || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Faixas */}
      <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
        <div className="border-b border-[#E5E5E3] bg-[#FAFAF9] px-5 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Faixas de Frete</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E3] text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <th className="px-4 py-3">Faixa (km)</th>
              <th className="px-4 py-3 text-right">Valor Base</th>
              <th className="px-4 py-3 text-right">Valor / Km Adic.</th>
              <th className="px-4 py-3 text-right">Frete Grátis a partir de</th>
              <th className="px-4 py-3 text-right">Taxa Munck</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {faixas.map((f) => {
              const editing = isEditing(f.id)
              if (editing) {
                return (
                  <tr key={f.id} className="hover:bg-[#FAFAF9]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">KM Máx</label>
                          <input
                            value={editMode.km_max}
                            onChange={(e) => setEditMode({ ...editMode, km_max: e.target.value })}
                            className="w-full rounded-[4px] border border-[#E5E5E3] px-2 py-1.5 text-sm outline-none focus:border-[#15803D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">KM Anterior</label>
                          <input
                            value={editMode.km_faixa_anterior}
                            onChange={(e) => setEditMode({ ...editMode, km_faixa_anterior: e.target.value })}
                            className="w-full rounded-[4px] border border-[#E5E5E3] px-2 py-1.5 text-sm outline-none focus:border-[#15803D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Valor Base</label>
                          <input
                            value={editMode.valor_base}
                            onChange={(e) => setEditMode({ ...editMode, valor_base: e.target.value })}
                            className="w-full rounded-[4px] border border-[#E5E5E3] px-2 py-1.5 text-sm outline-none focus:border-[#15803D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Valor / Km</label>
                          <input
                            value={editMode.valor_km_adicional}
                            onChange={(e) => setEditMode({ ...editMode, valor_km_adicional: e.target.value })}
                            className="w-full rounded-[4px] border border-[#E5E5E3] px-2 py-1.5 text-sm outline-none focus:border-[#15803D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Grátis a partir de</label>
                          <input
                            value={editMode.valor_minimo_frete_gratis}
                            onChange={(e) => setEditMode({ ...editMode, valor_minimo_frete_gratis: e.target.value })}
                            className="w-full rounded-[4px] border border-[#E5E5E3] px-2 py-1.5 text-sm outline-none focus:border-[#15803D]"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="rounded-[4px] bg-[#15803D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60"
                          >
                            {saving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="ml-2 rounded-[4px] border border-[#E5E5E3] px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-[#FAFAF9]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={f.id} className="hover:bg-[#FAFAF9]">
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-slate-700">{f.km_faixa_anterior} a {f.km_max} km</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                    {brl(f.valor_base)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                    {f.valor_km_adicional === 0 ? "—" : brl(f.valor_km_adicional)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                    {f.valor_minimo_frete_gratis === null ? "Sem gratuidade" : brl(f.valor_minimo_frete_gratis)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                    {brl(f.taxa_munck || 250)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => startEdit(f)}
                      className="p-1.5 text-slate-400 hover:text-[#15803D] transition-colors"
                      title="Editar"
                    >
                      <Truck className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Nota explicativa */}
      <div className="rounded-[4px] border border-amber-100 bg-amber-50 p-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Regras aplicadas</h3>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Frete = Valor Base + Valor/Km Adicional × max(0, distância − faixa anterior)</li>
          <li>Frete grátis: se subtotal ≥ valor mínimo da faixa (munck ainda incide se exigido)</li>
          <li>Munck obrigatório para cargas acima de 4.000 kg (~80 sacos de 50 kg)</li>
          <li>Acima de 90 km: frete a confirmar pelo atendente</li>
          <li>Se o frete exceder 12% do subtotal: sugere retirada no CD</li>
        </ul>
      </div>
    </div>
  )
}
