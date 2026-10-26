"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  DEFAULT_INSTITUTIONAL_BODY,
  DEFAULT_INSTITUTIONAL_TITLE,
  DEFAULT_TESTIMONIALS,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_BUSINESS_ADDRESS,
  DEFAULT_BUSINESS_PHONE,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_MAPS_URL,
  parseBannerImages,
  parseTestimonials,
  type CmsBannerSlide,
  type CmsTestimonial,
} from "@/lib/site-settings"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ImageIcon,
  Loader2,
  Package,
  Palette,
  Plus,
  Phone,
  Save,
  Trash2,
  Upload,
  FolderTree,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { uploadImage } from "@/lib/upload-image"

const supabase = createClient()

const MAX_BANNERS = 6

type FormState = {
  logo_url: string
  favicon_url: string
  chat_header_url: string
  institutional_title: string
  institutional_body: string
  banner_images: CmsBannerSlide[]
  testimonials: CmsTestimonial[]
  // Google Marketing & SEO
  gtm_id: string
  ga4_id: string
  google_site_verification: string
  google_ads_id: string
  google_ads_conversion_label: string
  // Google Meu Negócio
  business_name: string
  business_address: string
  business_phone: string
  business_hours: string
  business_maps_url: string
}

const initialForm = (): FormState => ({
  logo_url: "",
  favicon_url: "",
  chat_header_url: "",
  institutional_title: DEFAULT_INSTITUTIONAL_TITLE,
  institutional_body: DEFAULT_INSTITUTIONAL_BODY,
  banner_images: [],
  testimonials: DEFAULT_TESTIMONIALS.map((t) => ({ ...t })),
  gtm_id: "",
  ga4_id: "",
  google_site_verification: "",
  google_ads_id: "",
  google_ads_conversion_label: "",
  business_name: DEFAULT_BUSINESS_NAME,
  business_address: DEFAULT_BUSINESS_ADDRESS,
  business_phone: DEFAULT_BUSINESS_PHONE,
  business_hours: DEFAULT_BUSINESS_HOURS,
  business_maps_url: DEFAULT_BUSINESS_MAPS_URL,
})

export default function AdminSiteSettingsPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadKey, setUploadKey] = useState<"logo" | "favicon" | "chat" | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "default").maybeSingle()
      if (cancelled) return
      if (error) {
        toast.error(error.message)
        setForm(initialForm())
        setLoading(false)
        return
      }
      if (!data) {
        setForm(initialForm())
        setLoading(false)
        return
      }
      const t = parseTestimonials(data.testimonials)
      setForm({
        logo_url: data.logo_url || "",
        favicon_url: data.favicon_url || "",
        chat_header_url: data.chat_header_url || "",
        institutional_title: data.institutional_title?.trim() || DEFAULT_INSTITUTIONAL_TITLE,
        institutional_body: data.institutional_body?.trim() || DEFAULT_INSTITUTIONAL_BODY,
        banner_images: parseBannerImages(data.banner_images),
        testimonials: t.length > 0 ? t : DEFAULT_TESTIMONIALS.map((x) => ({ ...x })),
        gtm_id: data.gtm_id || "",
        ga4_id: data.ga4_id || "",
        google_site_verification: data.google_site_verification || "",
        google_ads_id: data.google_ads_id || "",
        google_ads_conversion_label: data.google_ads_conversion_label || "",
        business_name: data.business_name?.trim() || DEFAULT_BUSINESS_NAME,
        business_address: data.business_address?.trim() || DEFAULT_BUSINESS_ADDRESS,
        business_phone: data.business_phone?.trim() || DEFAULT_BUSINESS_PHONE,
        business_hours: data.business_hours?.trim() || DEFAULT_BUSINESS_HOURS,
        business_maps_url: data.business_maps_url?.trim() || DEFAULT_BUSINESS_MAPS_URL,
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: form.logo_url || null,
          favicon_url: form.favicon_url || null,
          chat_header_url: form.chat_header_url || null,
          institutional_title: form.institutional_title || null,
          institutional_body: form.institutional_body || null,
          banner_images: form.banner_images,
          testimonials: form.testimonials,
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
      if (!res.ok) {
        toast.error(json.error || json.hint || "Falha ao salvar")
        return
      }
      toast.success("Configurações salvas. A loja atualiza na próxima carga.")
    } catch {
      toast.error("Erro de rede ao salvar")
    }
    setSaving(false)
  }

  async function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "logo" | "favicon" | "chat") {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadKey(kind)
    const data = await uploadImage(file, kind === "chat" ? "banners" : "logos")
    setUploadKey(null)
    if (data?.url) {
      if (kind === "logo") setForm((f) => ({ ...f, logo_url: data.url }))
      else if (kind === "favicon") setForm((f) => ({ ...f, favicon_url: data.url }))
      else setForm((f) => ({ ...f, chat_header_url: data.url }))
      toast.success(kind === "logo" ? "Logo enviada!" : kind === "favicon" ? "Favicon enviado!" : "Header do chat enviado!")
    } else {
      toast.error("Falha no upload")
    }
  }

  async function onBannerSlideUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const data = await uploadImage(file, "banners")
    if (data?.url) {
      setForm((f) => {
        const next = [...f.banner_images]
        next[index] = { ...next[index], image_url: data.url }
        return { ...f, banner_images: next }
      })
      toast.success("Imagem do slide atualizada")
    } else {
      toast.error("Falha no upload")
    }
  }

  function addBannerSlide() {
    if (form.banner_images.length >= MAX_BANNERS) {
      toast.error(`Máximo de ${MAX_BANNERS} banners no CMS`)
      return
    }
    setForm((f) => ({
      ...f,
      banner_images: [...f.banner_images, { image_url: "", title: "", subtitle: "", link: "" }],
    }))
  }

  function removeBannerSlide(i: number) {
    setForm((f) => ({ ...f, banner_images: f.banner_images.filter((_, j) => j !== i) }))
  }

  function moveBanner(i: number, dir: -1 | 1) {
    setForm((f) => {
      const j = i + dir
      if (j < 0 || j >= f.banner_images.length) return f
      const next = [...f.banner_images]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...f, banner_images: next }
    })
  }

  function addTestimonial() {
    setForm((f) => ({
      ...f,
      testimonials: [...f.testimonials, { name: "", text: "", rating: 5, role: "" }],
    }))
  }

  function removeTestimonial(i: number) {
    setForm((f) => ({ ...f, testimonials: f.testimonials.filter((_, j) => j !== i) }))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#12A06A]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CMS do site</h1>
          <p className="mt-1 text-sm text-slate-500">
            Identidade visual e conteúdo institucional. Imagens no Supabase Storage; URLs na tabela{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">site_settings</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12A06A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e8a5b] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar tudo
        </button>
      </div>

      <Tabs defaultValue="marca" className="w-full gap-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 overflow-visible">
          <TabsTrigger value="marca" className="gap-1.5">
            <Palette className="h-4 w-4" /> Marca
          </TabsTrigger>
          <TabsTrigger value="hero" className="gap-1.5">
            <ImageIcon className="h-4 w-4" /> Banners
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquareQuote className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="conteudo" className="gap-1.5">
            <FolderTree className="h-4 w-4" /> Institucional
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="gap-1.5">
            <Package className="h-4 w-4" /> Catálogo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marca" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Logo e favicon</h2>
          <p className="mt-1 text-sm text-slate-500">
            Envio no bucket <strong>produtos</strong> (pasta <code className="text-xs">cms/</code>). PNG ou WebP recomendados.
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Logo (header)</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {form.logo_url ? (
                  <div className="relative h-16 w-40 overflow-hidden rounded-xl border bg-slate-50">
                    <Image src={form.logo_url} alt="Logo" fill unoptimized className="object-contain p-2" />
                  </div>
                ) : (
                  <div className="flex h-16 w-40 items-center justify-center rounded-xl border border-dashed text-xs text-slate-500">
                    Padrão SVG
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  {uploadKey === "logo" ? "Enviando…" : "Enviar logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onLogoUpload(e, "logo")}
                    disabled={uploadKey !== null}
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-slate-500 underline"
                onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
              >
                Usar logo padrão do site
              </button>
            </div>
            <div>
              <p className="text-sm font-medium">Favicon</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {form.favicon_url ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border bg-slate-50">
                    <Image src={form.favicon_url} alt="Favicon" fill unoptimized className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed text-[10px] text-slate-500 text-center px-1">
                    /icon
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  {uploadKey === "favicon" ? "Enviando…" : "Enviar favicon"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onLogoUpload(e, "favicon")}
                    disabled={uploadKey !== null}
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-slate-500 underline"
                onClick={() => setForm((f) => ({ ...f, favicon_url: "" }))}
              >
                Usar favicon padrão
              </button>
            </div>
          </div>

          {/* Card de Controle de Telefones & WhatsApp */}
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-400" />
                  Telefone & WhatsApp Principal do Site
                </h3>
                <p className="text-xs text-blue-200/70">
                  Controla o número exibido no cabeçalho, rodapé e links de atendimento direto.
                </p>
              </div>
              <Link
                href="/admin/whatsapp"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow"
              >
                Gerenciar Atendentes WhatsApp →
              </Link>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-blue-200/80 mb-1.5 block">
                Número com DDD (Ex: (16) 99644-7972)
              </label>
              <input
                type="text"
                value={form.business_phone}
                onChange={(e) => setForm({ ...form, business_phone: e.target.value })}
                placeholder="(16) 99644-7972"
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-blue-400/30 bg-slate-900/90 text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Instruções Recomendadas</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500 list-disc list-inside">
              <li>Logo: PNG ou JPEG (300x100px aprox.)</li>
              <li>Favicon: PNG quadrado (32x32px ou 64x64px)</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Configuração do Chat</h2>
          <p className="mt-1 text-sm text-slate-500">
            Personalize o cabeçalho do chat estilo WhatsApp.
          </p>
          <div className="mt-6">
            <p className="text-sm font-medium">Imagem do cabeçalho (Header)</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {form.chat_header_url ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full border bg-slate-50">
                  <Image src={form.chat_header_url} alt="Chat Header" fill unoptimized className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed text-xs text-slate-500">
                  Sem foto
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                {uploadKey === "chat" ? "Enviando…" : "Enviar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoUpload(e, "chat")}
                  disabled={uploadKey !== null}
                />
              </label>
              {form.chat_header_url && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, chat_header_url: "" }))}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remover imagem
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">Recomendado: 100x100px ou quadrado.</p>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Slides da home (CMS)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Se houver pelo menos um slide com imagem aqui, a home usa <strong>só</strong> esta lista. Deixe vazio para voltar aos banners da
            tabela <code className="text-xs">banners</code> (menu Banners).
          </p>
          <button
            type="button"
            onClick={addBannerSlide}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Adicionar slide ({form.banner_images.length}/{MAX_BANNERS})
          </button>
          <div className="mt-4 space-y-4">
            {form.banner_images.map((slide, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-slate-100/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">Slide {i + 1}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveBanner(i, -1)}
                      className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                      aria-label="Subir"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBanner(i, 1)}
                      className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                      aria-label="Descer"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBannerSlide(i)}
                      className="rounded-lg border border-destructive/30 bg-white p-2 text-red-600 hover:bg-red-50"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-500">Imagem</label>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      {slide.image_url ? (
                        <div className="relative h-24 w-40 overflow-hidden rounded-lg border">
                          <Image src={slide.image_url.trim()} alt="" fill unoptimized className="object-cover" />
                        </div>
                      ) : null}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onBannerSlideUpload(i, e)}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Título</label>
                    <input
                      value={slide.title || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => {
                          const next = [...f.banner_images]
                          next[i] = { ...next[i], title: v }
                          return { ...f, banner_images: next }
                        })
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Subtítulo</label>
                    <input
                      value={slide.subtitle || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => {
                          const next = [...f.banner_images]
                          next[i] = { ...next[i], subtitle: v }
                          return { ...f, banner_images: next }
                        })
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-500">Link (opcional)</label>
                    <input
                      value={slide.link || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => {
                          const next = [...f.banner_images]
                          next[i] = { ...next[i], link: v || null }
                          return { ...f, banner_images: next }
                        })
                      }}
                      placeholder="/produtos ou URL"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Bloco institucional (home)</h2>
            <label className="mt-4 block text-sm font-medium">Título</label>
            <input
              value={form.institutional_title}
              onChange={(e) => setForm((f) => ({ ...f, institutional_title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
            <label className="mt-4 block text-sm font-medium">Texto</label>
            <textarea
              value={form.institutional_body}
              onChange={(e) => setForm((f) => ({ ...f, institutional_body: e.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Depoimentos</h2>
                <p className="text-sm text-slate-500">Exibidos no carrossel da home. Mínimo recomendado: 11.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, testimonials: DEFAULT_TESTIMONIALS.map((t) => ({ ...t })) }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                >
                  Restaurar padrão (11)
                </button>
                <button
                  type="button"
                  onClick={addTestimonial}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#12A06A] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </div>
            <div className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {form.testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border border-slate-200/80 bg-slate-100/15 p-3">
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeTestimonial(i)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      placeholder="Nome"
                      value={t.name}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => {
                          const next = [...f.testimonials]
                          next[i] = { ...next[i], name: v }
                          return { ...f, testimonials: next }
                        })
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Cargo / contexto (opcional)"
                      value={t.role || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => {
                          const next = [...f.testimonials]
                          next[i] = { ...next[i], role: v || undefined }
                          return { ...f, testimonials: next }
                        })
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={t.rating ?? 5}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          setForm((f) => {
                            const next = [...f.testimonials]
                            next[i] = { ...next[i], rating: Number.isFinite(n) ? n : 5 }
                            return { ...f, testimonials: next }
                          })
                        }}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                      <span className="ml-2 text-xs text-slate-500">estrelas (1–5)</span>
                    </div>
                    <div className="sm:col-span-2">
                      <textarea
                        placeholder="Texto do depoimento"
                        value={t.text}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm((f) => {
                            const next = [...f.testimonials]
                            next[i] = { ...next[i], text: v }
                            return { ...f, testimonials: next }
                          })
                        }}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

<TabsContent value="catalogo" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Imagens de produtos e categorias</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Para não duplicar lógica de estoque e preços, as imagens de cada produto e categoria continuam sendo
            gerenciadas nas telas dedicadas — com upload já integrado ao Supabase.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/categorias"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              <FolderTree className="h-4 w-4" /> Categorias
            </Link>
            <Link
              href="/admin/produtos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              <Package className="h-4 w-4" /> Produtos
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-slate-500">
        Primeira vez ou erros? Rode <code className="rounded bg-slate-100 px-1">scripts/012_fix_db_schema.sql</code> no Supabase.
      </p>
    </div>
  )
}
