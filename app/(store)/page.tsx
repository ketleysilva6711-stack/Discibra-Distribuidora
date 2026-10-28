// =============================================================================
// SERVER COMPONENT — app/(store)/page.tsx
// Home B2B corporativa — seções por departamento
// =============================================================================

export const dynamic = "force-static"

import { createPublicClient } from "@/lib/supabase/public"
import { HeroBanner } from "@/components/store/hero-banner"
import ProductsCarousel from "@/components/store/products-carousel"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import HomeWhatsAppCta from "@/components/store/home-whatsapp-cta"

const CAT_CIMENTO = "c0134152-de0a-42f7-bb87-dd9ec8588983"
const CAT_ARGAMASSA = "6df9b914-06d0-484a-9b0c-c2d9192fcfa9"
const CAT_REJUNTE = "8463a6e3-5c46-4f1f-b022-45754287d12a"
const CAT_IMPERM = "2ec0f24f-65d1-4282-a428-16667259409c"

const PROD_FIELDS =
  "id, name, slug, price, original_price, image_url, unit, stock, category_id, is_new, is_discount, featured"

async function fetchHome() {
  const supabase = createPublicClient()

  const [
    categoriesRes,
    cimentosRes,
    argRes,
    rejRes,
    impermRes,
    discountsRes,
    siteSettingsRes,
  ] = await Promise.all([
    supabase.from("categories").select("*, products(id)").eq("active", true).order("sort_order"),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_CIMENTO).not("image_url", "is", null).order("featured", { ascending: false }).order("price", { ascending: true }).limit(30),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_ARGAMASSA).not("image_url", "is", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_REJUNTE).not("image_url", "is", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_IMPERM).not("image_url", "is", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("is_discount", true).not("image_url", "is", null).order("created_at", { ascending: false }).limit(24),
    supabase.from("site_settings").select("banner_images").eq("id", "default").maybeSingle(),
  ])

  const acabamento: any[] = []
  const seen = new Set<string>()
  const groups = [argRes.data || [], rejRes.data || [], impermRes.data || []]
  const max = Math.max(...groups.map((g) => g.length))
  for (let i = 0; i < max; i++) {
    for (const g of groups) {
      const p: any = g[i]
      if (p && !seen.has(p.id)) {
        acabamento.push(p)
        seen.add(p.id)
      }
    }
  }

  let slides: any[] = []
  const settingsData = siteSettingsRes?.data || null
  if (settingsData?.banner_images) {
    try {
      const parsed = Array.isArray(settingsData.banner_images)
        ? settingsData.banner_images
        : JSON.parse(settingsData.banner_images)
      slides = parsed
        .filter((s: any) => s.image_url?.trim())
        .map((s: any, i: number) => ({
          key: `cms-${i}`,
          image_url: s.image_url,
          link: s.link ?? null,
          title: s.title ?? null,
          subtitle: s.subtitle ?? null,
        }))
    } catch (_) {}
  }
  if (slides.length === 0) {
    const { data: banners, error: bannersErr } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
    slides = (banners || []).map((b: any) => ({
      key: `db-${b.id}`,
      image_url: b.image_url,
      link: b.link ?? null,
      title: b.title ?? null,
      subtitle: b.subtitle ?? null,
    }))
  }
  return {
    categories: categoriesRes.data || [],
    cimentos: cimentosRes.data || [],
    acabamento,
    discounts: discountsRes.data || [],
    slides,
    siteSettingsRes,
  }
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  className,
  dark,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  className?: string
  dark?: boolean
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-[3px] w-12 bg-gradient-to-r from-[#C2410C] to-[#F59E0B] rounded-full" />
          {subtitle && (
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#C2410C]">
              {subtitle}
            </span>
          )}
        </div>
        <h2 className={cn("text-3xl font-black tracking-tight sm:text-4xl leading-[1.05]", dark ? "text-white" : "text-slate-900")}>
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-slate-50 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:bg-secondary hover:text-white active:scale-95 sm:self-auto"
        >
          {linkLabel || "Ver catálogo"}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  const data = await fetchHome()

  return (
    <div className="relative pb-20 sm:pb-32 bg-mesh">
      {/* ── HERO B2B ── */}
      <div className="w-full">
        <HeroBanner />
      </div>

      {/* TRUST BAR — 4 itens compactos */}
      <div className="border-y border-[var(--line)] bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--line)]">
            {/* 1 — Preço de Atacado */}
            <div className="flex items-center gap-3 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-[var(--accent)] flex-none shrink-0">
                <path d="M3 9h18M3 15h18M12 3v18M7.5 3h9a4.5 4.5 0 0 1 0 18h-9a4.5 4.5 0 0 1 0-18z"/>
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] leading-tight">Preço de Atacado</p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight truncate">Sem exigência de CNPJ</p>
              </div>
            </div>
            {/* 2 — Parcele 12× */}
            <div className="flex items-center gap-3 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-[var(--accent)] flex-none shrink-0">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] leading-tight">Parcele 12×</p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight truncate">Cartão ou PIX sem acréscimo</p>
              </div>
            </div>
            {/* 3 — Entrega Descarregada */}
            <div className="flex items-center gap-3 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-[var(--accent)] flex-none shrink-0">
                <rect x="1" y="3" width="15" height="13" rx="1"/>
                <path d="M16 8h4l3 5v3h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] leading-tight">Entrega Descarregada</p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight truncate">Munck ou paletizado na obra</p>
              </div>
            </div>
            {/* 4 — Direto da Fábrica */}
            <div className="flex items-center gap-3 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-[var(--accent)] flex-none shrink-0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] leading-tight">Direto da Fábrica</p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight truncate">Certificado ABNT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO 3: CATEGORIAS PRINCIPAIS (barra horizontal compacta) ── */}
      {data?.categories && data.categories.length > 0 && (
        <section className="py-8 sm:py-12 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader title="Departamentos da obra" subtitle="Categorias" href="/produtos" linkLabel="Ver tudo" />
          </div>
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex overflow-x-auto gap-3 py-2 [scrollbar-width:none] -mx-6">
              {data.categories.slice(0, 12).map((category: any) => (
                <Link key={category.id} href={`/categoria/${category.slug}`} className="flex-none flex items-center gap-2.5 px-3 py-2 border border-[#E5E5E3] rounded-[4px] hover:border-[#111318] bg-white transition-colors whitespace-nowrap">
                  {category.image_url ? (
                    <Image src={category.image_url.trim()} alt={category.name} width={36} height={36} className="object-contain rounded-[2px]" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center text-xs font-black uppercase text-[#002D5B]/40 rounded-[2px]">
                      {category.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-[#111318]">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SEÇÃO 4: OFERTAS DA SEMANA (único carrossel de produto) ── */}
      {data?.discounts && data.discounts.length > 0 && (
        <section id="promocoes" className="py-14 sm:py-20 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              title="Ofertas da Semana"
              subtitle="Oportunidades Únicas"
              href="/promocoes"
              linkLabel="Ver todas"
            />
            <ProductsCarousel products={data.discounts} autoplayDelay={6000} />
          </div>
        </section>
      )}

      {/* ── SEÇÃO 5: CIMENTOS E BÁSICOS (vitrine completa, não carrossel) ── */}
      {data?.cimentos && data.cimentos.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#E8590C]">Cimentos e Básicos</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111318]">Preço direto da fábrica</h2>
            </div>
            <Link href="/cimento" className="text-xs font-semibold text-[#111318] hover:text-[#E8590C] transition-colors whitespace-nowrap">
              Ver cimentos →
            </Link>
          </div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.cimentos.slice(0, 12).map((p: any) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SEÇÃO 6: TELHAS E IMPERMEABILIZANTES (grid estático, não carrossel) ── */}
      {data?.acabamento && data.acabamento.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#E8590C]">Telhas e Impermeabilizantes</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111318]">Argamassas, rejuntes e impermeabilizantes</h2>
            </div>
            <Link href="/categoria/telhas-e-coberturas" className="text-xs font-semibold text-[#111318] hover:text-[#E8590C] transition-colors whitespace-nowrap">
              Ver categoria →
            </Link>
          </div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.acabamento.slice(0, 8).map((p: any) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SEÇÃO 7: BLOCO INSTITUCIONAL — PROVA FÍSICA ── */}
      <section className="border-t border-slate-200/60 bg-[#0B1B2B] py-14 sm:py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl border border-white/10 bg-[#071320] p-8 sm:p-10">
            <div className="max-w-3xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F47920]">
                Prova de Existência Física
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Conheça quem entrega na sua obra
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Distribuidora legalmente constituída com centro de distribuição próprio em Ribeirão Preto. Atendimento direto e sem intermediários.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase">CNPJ</p>
                <p className="mt-1 text-base font-black text-white whitespace-nowrap">59.566.414/0001-25</p>
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase">Centro de Distribuição</p>
                <p className="mt-1 text-base font-black text-white whitespace-nowrap">Ribeirão Preto — SP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase">Expedição & Cargas</p>
                <p className="mt-1 text-sm font-semibold text-white">Seg a Sex 07h-18h | Sáb 07h-12h</p>
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase">Central Telefônica</p>
                <p className="mt-1 text-base font-black text-white whitespace-nowrap">(16) 99644-7972</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 8: CTA FINAL WHATSAPP ── */}
      <section className="py-14 sm:py-20 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#C2410C]">Orçamento Imediato</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Fale direto com nossa central</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 leading-relaxed">
            Cotação rápida, preço de atacado e entrega com caminhão munck ou paletizado direto na sua obra.
          </p>
          <HomeWhatsAppCta />
        </div>
      </section>

      {/* ── OFERTAS ── */}
      {data?.discounts && data.discounts.length > 0 && (
        <section id="promocoes" className="relative mx-4 my-6 overflow-hidden rounded-[2rem] bg-[#020617] py-16 text-white sm:rounded-[3rem] sm:py-20">
          <div className="absolute inset-0 bg-mesh opacity-10" />
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-12 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Oportunidades Únicas</span>
                </div>
                <h2 className="text-4xl font-black leading-[1.0] tracking-tight text-white sm:text-5xl">Ofertas da Semana</h2>
              </div>
              <Link href="/produtos" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-white">
                Ver todas as ofertas
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-8">
              <ProductsCarousel products={data.discounts} autoplayDelay={6000} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
