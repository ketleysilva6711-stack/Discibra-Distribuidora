"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Save, Loader2, BarChart2, Tag, Shield, MapPin, Phone,
  Clock, Globe, Search, CheckCircle2, AlertCircle
} from "lucide-react"

const supabase = createClient()

type Form = {
  gtm_id: string
  ga4_id: string
  google_site_verification: string
  google_ads_id: string
  google_ads_conversion_label: string
  business_name: string
  business_address: string
  business_phone: string
  business_hours: string
  business_maps_url: string
}

const EMPTY: Form = {
  gtm_id: "",
  ga4_id: "",
  google_site_verification: "",
  google_ads_id: "",
  google_ads_conversion_label: "",
  business_name: "",
  business_address: "",
  business_phone: "",
  business_hours: "",
  business_maps_url: "",
}

export default function AdminGooglePage() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("gtm_id,ga4_id,google_site_verification,google_ads_id,google_ads_conversion_label,business_name,business_address,business_phone,business_hours,business_maps_url")
        .eq("id", "default")
        .maybeSingle()
      if (data) {
        setForm({
          gtm_id: data.gtm_id || "",
          ga4_id: data.ga4_id || "",
          google_site_verification: data.google_site_verification || "",
          google_ads_id: data.google_ads_id || "",
          google_ads_conversion_label: data.google_ads_conversion_label || "",
          business_name: data.business_name || "",
          business_address: data.business_address || "",
          business_phone: data.business_phone || "",
          business_hours: data.business_hours || "",
          business_maps_url: data.business_maps_url || "",
        })
      }
      setLoading(false)
    })()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gtm_id: form.gtm_id || null,
          ga4_id: form.ga4_id || null,
          google_site_verification: form.google_site_verification || null,
          google_ads_id: form.google_ads_id || null,
          google_ads_conversion_label: form.google_ads_conversion_label || null,
          business_name: form.business_name || null,
          business_address: form.business_address || null,
          business_phone: form.business_phone || null,
          business_hours: form.business_hours || null,
          business_maps_url: form.business_maps_url || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Falha ao salvar"); return }
      toast.success("Configurações Google salvas com sucesso!")
    } catch {
      toast.error("Erro de rede ao salvar")
    }
    setSaving(false)
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const StatusDot = ({ value }: { value: string }) =>
    value.trim() ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
    ) : (
      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
    )

  const inputCls = "w-full rounded-xl border border-[#0055ff]/35 bg-[#010c24]/80 backdrop-blur-sm px-4 py-3 text-sm font-mono text-white placeholder:text-blue-200/30 focus:outline-none focus:border-[#0055ff] focus:ring-1 focus:ring-[#0055ff] transition-all"
  const labelCls = "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200/80 mb-2"

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen -m-4 lg:-m-6 p-6 lg:p-8 overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-5xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {/* Google colorido dots */}
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full bg-[#4285F4]" />
                <span className="w-3 h-3 rounded-full bg-[#EA4335]" />
                <span className="w-3 h-3 rounded-full bg-[#FBBC05]" />
                <span className="w-3 h-3 rounded-full bg-[#34A853]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Google & Marketing Digital</h1>
            </div>
            <p className="text-sm text-white/50">
              Configure rastreamento, conversões e SEO local em um único painel
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#0047ab] hover:from-[#0047ab] hover:to-[#003882] shadow-[0_0_20px_rgba(0,85,255,0.4)] active:scale-95 px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </button>
        </div>

        {/* STATUS BAR */}
        <div className="rounded-2xl border border-[#0055ff]/30 bg-[#0047ab]/15 backdrop-blur-md p-4 flex flex-wrap gap-4 shadow-[0_4px_24px_rgba(0,85,255,0.12)]">
          {[
            { label: "GTM", value: form.gtm_id },
            { label: "GA4", value: form.ga4_id },
            { label: "Google Ads", value: form.google_ads_id },
            { label: "Search Console", value: form.google_site_verification },
            { label: "Meu Negócio", value: form.business_name },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <StatusDot value={item.value} />
              <span className="text-xs text-white/60 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* BLOCO 1: GTM + GA4 */}
        <div className="rounded-2xl border border-[#0055ff]/30 bg-[#0047ab]/15 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,85,255,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
              <BarChart2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Tag Manager & Analytics 4</h2>
              <p className="text-xs text-white/40">Rastreamento de comportamento e eventos</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls}><StatusDot value={form.gtm_id} /> Google Tag Manager ID</label>
              <input type="text" value={form.gtm_id} onChange={set("gtm_id")} placeholder="GTM-XXXXXXX" className={inputCls} />
              <p className="mt-1.5 text-xs text-white/30">Administrador → Instalar GTM</p>
            </div>
            <div>
              <label className={labelCls}><StatusDot value={form.ga4_id} /> Google Analytics 4 (GA4)</label>
              <input type="text" value={form.ga4_id} onChange={set("ga4_id")} placeholder="G-XXXXXXXXXX" className={inputCls} />
              <p className="mt-1.5 text-xs text-white/30">Admin → Fluxos de dados → ID de medição</p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Google Ads + Search Console */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Google Ads */}
          <div className="rounded-2xl border border-[#0055ff]/30 bg-[#0047ab]/15 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,85,255,0.12)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-400/30">
                <Tag className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Google Ads</h2>
                <p className="text-xs text-white/40">Rastreamento de conversões</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}><StatusDot value={form.google_ads_id} /> Conversion ID</label>
                <input type="text" value={form.google_ads_id} onChange={set("google_ads_id")} placeholder="AW-XXXXXXXXX" className={inputCls} />
                <p className="mt-1.5 text-xs text-white/30">Ferramentas → Conversões → ID</p>
              </div>
              <div>
                <label className={labelCls}><StatusDot value={form.google_ads_conversion_label} /> Conversion Label</label>
                <input type="text" value={form.google_ads_conversion_label} onChange={set("google_ads_conversion_label")} placeholder="XXXXXXXXXXXX" className={inputCls} />
                <p className="mt-1.5 text-xs text-white/30">Label da ação de conversão</p>
              </div>
            </div>
          </div>

          {/* Search Console */}
          <div className="rounded-2xl border border-[#0055ff]/30 bg-[#0047ab]/15 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,85,255,0.12)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Google Search Console</h2>
                <p className="text-xs text-white/40">Verificação de propriedade</p>
              </div>
            </div>
            <div>
              <label className={labelCls}><StatusDot value={form.google_site_verification} /> Verification Token</label>
              <input type="text" value={form.google_site_verification} onChange={set("google_site_verification")} placeholder="google-site-verification=XXXX" className={inputCls} />
              <p className="mt-1.5 text-xs text-white/30">Configurações → Verificar → Tag HTML → valor do content</p>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Google Meu Negócio */}
        <div className="rounded-2xl border border-[#0055ff]/30 bg-[#0047ab]/15 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,85,255,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
              <MapPin className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Meu Negócio & SEO Local</h2>
              <p className="text-xs text-white/40">Dados para schema.org LocalBusiness e Google Maps</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls}><StatusDot value={form.business_name} /> Nome no Google Maps</label>
              <input type="text" value={form.business_name} onChange={set("business_name")} placeholder="Discibra Distribuidora" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}><Phone className="h-3.5 w-3.5" /> Telefone</label>
              <input type="tel" value={form.business_phone} onChange={set("business_phone")} placeholder="(16) 99644-7972" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}><MapPin className="h-3.5 w-3.5" /> Endereço Completo</label>
              <textarea value={form.business_address} onChange={set("business_address")} rows={2} placeholder="Rua Igarapava, 73 - Vila Albertina, Ribeirão Preto - SP" className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className={labelCls}><Clock className="h-3.5 w-3.5" /> Horário de Funcionamento</label>
              <input type="text" value={form.business_hours} onChange={set("business_hours")} placeholder="Seg-Sex: 07h-18h | Sáb: 07h-12h" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}><Globe className="h-3.5 w-3.5" /> URL Google Maps / Meu Negócio</label>
              <input type="url" value={form.business_maps_url} onChange={set("business_maps_url")} placeholder="https://maps.google.com/?q=..." className={inputCls} />
            </div>
          </div>
        </div>

        {/* Footer salvar */}
        <div className="flex justify-end pb-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#0047ab] hover:from-[#0047ab] hover:to-[#003882] shadow-[0_0_20px_rgba(0,85,255,0.4)] active:scale-95 px-8 py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}