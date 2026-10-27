// =============================================================================
// SERVER COMPONENT — app/(store)/page.tsx
// Home B2B corporativa — seções por departamento
// =============================================================================

export const revalidate = 300

import { createPublicClient } from "@/lib/supabase/public"
import { HeroBanner } from "@/components/store/hero-banner"
import CategoriesCarousel from "@/components/store/categories-carousel"
import ProductsCarousel from "@/components/store/products-carousel"
import InstitutionalSection from "@/components/store/institutional-section"
import TestimonialsCarousel from "@/components/store/testimonials-carousel"
import Link from "next/link"
import Image from "next/image"
import {
  Truck, ShieldCheck, CreditCard, MapPin,
  ChevronRight, BadgeCheck, Zap, Package,
  MessageSquare, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SITE, waLink } from "@/lib/site-config"
import { parseBannerImages } from "@/lib/site-settings"
import HomeWhatsAppCta from "@/components/store/home-whatsapp-cta"
import PalletPriceTable from "@/components/store/pallet-price-table"
import CepFreightCalculator from "@/components/store/cep-freight-calculator"

const CAT_CIMENTO = "c0134152-de0a-42f7-bb87-dd9ec8588983"
const CAT_ACO = "914576a6-f187-4f97-83e1-dd7e0c38dd1b"
const CAT_HIDRA = "aec3d582-a015-4968-a883-d0913379bf10"
const CAT_ARGAMASSA = "6df9b914-06d0-484a-9b0c-c2d9192fcfa9"
const CAT_REJUNTE = "8463a6e3-5c46-4f1f-b022-45754287d12a"
const CAT_IMPERM = "2ec0f24f-65d1-4282-a428-16667259409c"

const PROD_FIELDS =
  "id, name, slug, price, original_price, image_url, unit, stock, category_id, is_new, is_discount, featured"

async function fetchHome() {
  const supabase = createPublicClient()

  const [
    featuredRes,
    categoriesRes,
    newRes,
    discountRes,
    cimentosRes,
    acoRes,
    hidraRes,
    argRes,
    rejRes,
    impermRes,
    siteSettingsRes,
  ] = await Promise.all([
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("featured", true).not("image_url", "is", null).order("created_at", { ascending: false }).limit(24),
    supabase.from("categories").select("*, products(id)").eq("active", true).order("sort_order"),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("is_new", true).not("image_url", "is", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("is_discount", true).not("image_url", "is", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_CIMENTO).not("image_url", "is", null).order("featured", { ascending: false }).order("price", { ascending: true }).limit(30),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_ACO).not("image_url", "is", null).order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_HIDRA).not("image_url", "is", null).order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_ARGAMASSA).not("image_url", "is", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_REJUNTE).not("image_url", "is", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select(PROD_FIELDS).eq("active", true).eq("category_id", CAT_IMPERM).not("image_url", "is", null).order("created_at", { ascending: false }).limit(6),
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

  const { data: settingsData, error: settingsErr } = await supabase
    .from("site_settings")
    .select("banner_images")
    .eq("id", "default")
    .maybeSingle()
  let slides: any[] = []
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
    featured: featuredRes.data || [],
    categories: categoriesRes.data || [],
    newProducts: newRes.data || [],
    discounts: discountRes.data || [],
    cimentos: cimentosRes.data || [],
    aco: acoRes.data || [],
    hidraulica: hidraRes.data || [],
    acabamento,
    slides,
    siteSettingsRes,
  }
}

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function pickLeaders(cimentos: any[]) {
  const brands = ["votoran", "caue", "montes claros", "csn", "maua", "tupi", "ciplan", "liz", "apodi", "campeao", "mizu", "nassau"]
  const out: any[] = []
  for (const b of brands) {
    const found = cimentos.find((p) => norm(p.name).includes(b))
    if (found && !out.some((o) => o.id === found.id)) out.push(found)
  }
  for (const p of cimentos) {
    if (out.length >= 12) break
    if (!out.some((o) => o.id === p.id)) out.push(p)
  }
  return out.slice(0, 12)
}

function CimentoCard({ p, duplicate }: { p: any; duplicate?: boolean }) {
  const economy =
    p.original_price && Number(p.original_price) > Number(p.price)
      ? Number(p.original_price) - Number(p.price)
      : 0

  return (
    <article aria-hidden={duplicate} className="flex w-56 shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur transition-all hover:-translate-y-1 hover:border-[#25D366]/50 hover:shadow-2xl sm:w-64">
      <div className="relative aspect-square bg-white p-4">
        {p.image_url && (
          <Image src={p.image_url.trim()} alt={duplicate ? "" : p.name} fill className="object-contain p-3" sizes="256px" />
        )}
        {economy > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[#F47920] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            -{Math.round((economy / Number(p.original_price)) * 100)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-black leading-snug">{p.name}</h3>
        <div className="mt-2">
          {p.original_price && Number(p.original_price) > Number(p.price) && (
            <p className="text-xs text-white/40 line-through">
              R$ {Number(p.original_price).toFixed(2).replace(".", ",")}
            </p>
          )}
          <p className="text-2xl font-black tracking-tight text-[#25D366]">
            R$ {Number(p.price).toFixed(2).replace(".", ",")}
            <span className="ml-1 text-xs font-bold text-white/50">/{p.unit}</span>
          </p>
          {economy > 0 && (
            <p className="mt-0.5 text-[11px] font-bold text-emerald-300">
              Economize R$ {economy.toFixed(2).replace(".", ",")} no palete/carga
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href={waLink(`Olá! Quero comprar ${p.name} (R$ ${Number(p.price).toFixed(2).replace(".", ",")}/${p.unit}). Quais as formas de pagamento?`)}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={duplicate ? -1 : undefined}
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="home_cta"
            className="btn-whatsapp-track inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-black uppercase tracking-wide text-white transition-all hover:bg-[#1EBE5B] active:scale-95"
          >
            Comprar no WhatsApp
          </a>
          <Link href={`/produto/${p.slug}`} tabIndex={duplicate ? -1 : undefined} className="text-center text-[11px] font-semibold text-white/40 hover:text-white transition-colors">
            Ver detalhes →
          </Link>
        </div>
      </div>
    </article>
  )
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
  const siteSettingsData = (data as any).siteSettingsRes || null

  const initialSlides = data.slides && data.slides.length > 0 ? data.slides : []

  const leaders = pickLeaders(data.cimentos || [])

  const trustPillars = [
    { icon: CreditCard, title: "Preço de Atacado", desc: "Para pessoa física — sem exigência de CNPJ" },
    { icon: Zap, title: "Parcele 12x", desc: "No cartão ou PIX parcelado sem acréscimos" },
    { icon: Truck, title: "Entrega Descarregada", desc: "Munck ou paletizado direto na sua obra" },
    { icon: Package, title: "Direto da Fábrica", desc: "Produtos certificados ABNT com laudos técnicos" },
  ]

  return (
    <div className="relative pb-20 sm:pb-32 bg-mesh">
      {/* ── HERO B2B ── */}
      <div className="w-full">
        <HeroBanner initialSlides={initialSlides} />
      </div>

      {/* ── FAIXA ABERTO A TODOS — PÓS-HERO (corporativa) ── */}
      <section className="border-b border-slate-200/60 bg-[#002D5B] text-white">
        <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 text-amber-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Ribeirão Preto, Sertãozinho e Região</span>
            </div>
            <span className="hidden sm:inline text-white/40">•</span>
            <div className="flex items-center gap-1.5 text-white">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Atendimento Direto Pessoa Física e Construtores (Sem CNPJ)</span>
            </div>
            <span className="hidden lg:inline text-white/40">•</span>
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <CreditCard className="h-4 w-4 shrink-0 text-blue-400" />
              <span>PIX com Desconto ou até 12x no Cartão</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <a
              href={waLink("Olá! Gostaria de solicitar uma cotação de materiais de construção.")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="home_trust_bar"
              className="btn-whatsapp-track inline-flex h-11 sm:h-12 items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto rounded-xl bg-[#25D366] px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#1EBE5B] active:scale-95"
            >
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Cotação no WhatsApp
            </a>
            <Link
              href="/produtos"
              className="inline-flex h-11 sm:h-12 items-center justify-center whitespace-nowrap w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </section>

      {/* ── PILARES DE CONFIANÇA — PREMIUM 2×2 ── */}
      <section className="border-t-4 border-t-[#C2410C] border-b border-slate-200/70 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-100 lg:grid-cols-4 lg:divide-y-0">
          {trustPillars.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:text-left sm:px-8 sm:py-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C2410C] text-white shadow-sm">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black leading-snug tracking-tight text-slate-900">{item.title}</h4>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIAS (contadores reais) ── */}
      {data?.categories && data.categories.length > 0 && (
        <section className="overflow-hidden py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader title="Departamentos da obra" subtitle="Categorias" href="/produtos" linkLabel="Ver tudo" />
          </div>
          <div className="mx-auto max-w-7xl px-6">
            <CategoriesCarousel categories={data.categories} />
          </div>
        </section>
      )}

      {/* ── SEÇÃO 1: CIMENTOS ── */}
      {leaders.length > 0 && (
        <section className="relative overflow-hidden bg-slate-950 py-14 text-white sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,211,102,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,121,32,0.12),transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <SectionHeader
              dark
              title="Cimentos para sua Obra"
              subtitle="Preço direto da fábrica"
              href="/cimento"
              linkLabel="Tabela completa"
            />
            <style>{`@keyframes cimento-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>

            {/* Desktop: marquee rolante */}
            <div className="group/marquee relative overflow-hidden hidden sm:flex">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-950 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-950 to-transparent" />
              <div
                className="flex w-max gap-4 py-2 pr-4 animate-[cimento-marquee_45s_linear_infinite] group-hover/marquee:[animation-play-state:paused] motion-reduce:[animation:none] motion-reduce:flex-wrap motion-reduce:w-full"
                style={{ animationDuration: `${Math.max(30, leaders.length * 4)}s` }}
              >
                {[...leaders, ...leaders].map((p: any, li: number) => {
                  const dup = li >= leaders.length
                  return <CimentoCard key={`${p.id}-${li}`} p={p} duplicate={dup} />
                })}
              </div>
            </div>

            {/* Mobile: grid fixo de 2 colunas com os 4 principais produtos */}
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              {leaders.slice(0, 4).map((p: any) => (
                <CimentoCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TABELA DE VOLUME & FRETE ── */}
      {leaders.length > 0 && (
        <section className="py-14 sm:py-20 bg-[#FAFAF9]">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              subtitle="Condições Especiais"
              title="Preço de Atacado por Volume (Palete e Carga Fechada)"
            />
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <PalletPriceTable
                  unitPrice={
                    leaders[0]?.price != null
                      ? Number(leaders[0].price)
                      : 0
                  }
                />
              </div>
              <div>
                <CepFreightCalculator
                  productName="Cimento CP-II 50kg"
                  productSku="cimento-cp2-50kg"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SEÇÃO 2: ESTRUTURA & AÇO ── */}
      {data?.aco && data.aco.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              title="Estrutura & Aço"
              subtitle="Vergalhões e telas soldadas"
              href="/categoria/aco-e-ferragens"
              linkLabel="Ver aço"
            />
            <ProductsCarousel products={data.aco} autoplayDelay={6000} />
          </div>
        </section>
      )}

      {/* ── SEÇÃO 3: HIDRÁULICOS ── */}
      {data?.hidraulica && data.hidraulica.length > 0 && (
        <section className="bg-secondary/5 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              title="Materiais Hidráulicos & Tubulações"
              subtitle="Tigre / Amanco / caixas d'água"
              href="/categoria/materiais-hidraulicos"
              linkLabel="Ver hidráulica"
            />
            <ProductsCarousel products={data.hidraulica} autoplayDelay={6500} />
          </div>
        </section>
      )}

      {/* ── SE��O 4: ACABAMENTO ── */}
      {data?.acabamento && data.acabamento.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              title="Argamassas, Rejuntes & Impermeabilização"
              subtitle="Argamassas, rejuntes e impermeabilizantes"
              href="/produtos"
              linkLabel="Ver acabamento"
            />
            <ProductsCarousel products={data.acabamento} autoplayDelay={7000} />
          </div>
        </section>
      )}

      {/* ── COMO COMPRAR ── */}
      <section className="py-14 sm:py-20 bg-[#FAFAF9]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#C2410C]">Rápido e simples</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Como funciona a compra</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 leading-relaxed">
            Atendimento direto pelo WhatsApp — sem cadastro obrigatório, sem complicação.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "01", icon: <MessageSquare className="h-6 w-6 text-[#002D5B]" />, title: "Mande mensagem", desc: "Clique em qualquer botão de WhatsApp, envie os produtos que quer e aguarde. Respondemos em minutos." },
              { step: "02", icon: <FileText className="h-6 w-6 text-[#002D5B]" />, title: "Receba o orçamento", desc: "O atendente envia a proposta com preços, condições de pagamento e prazo de entrega." },
              { step: "03", icon: <Truck className="h-6 w-6 text-[#002D5B]" />, title: "Entrega na obra", desc: "Aprovado o orçamento, agendamos a entrega — caminhão com munck ou paletizado." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#002D5B] text-white">
                  {item.icon}
                </div>
                <span className="mb-2 text-[10px] sm:text-xs font-mono font-bold text-slate-400 tracking-widest">
                  {item.step}
                </span>
                <h3 className="mb-2 text-base font-black text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <a
            href={waLink("Olá! Gostaria de fazer um pedido de materiais de construção.")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="how_it_works"
            className="btn-whatsapp-track mt-10 inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-10 text-sm font-black text-white shadow-lg shadow-[#25D366]/30 transition-all hover:bg-[#1fba58] active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Fazer meu pedido agora
          </a>
        </div>
      </section>

      {/* ── BLOCO INSTITUCIONAL — PROVA FÍSICA ── */}
      <section className="border-t border-slate-200/60 bg-[#0B1B2B] py-16 sm:py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-xl border border-white/10 bg-[#0B1B2B]/50 p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Prova de Existência Física
                </span>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
                  Conheça quem entrega na sua obra
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Distribuidora legalmente constituída com centro de distribuição próprio em Ribeirão Preto.
                  Atendimento direto, sem intermediários.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    CNPJ
                  </p>
                  <p className="text-lg font-black text-white">59.566.414/0001-25</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Centro de Distribuição & Logística
                  </p>
                  <p className="text-lg font-black text-white">Ribeirão Preto — SP</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expedição & Cargas
                  </p>
                  <p className="text-lg font-black text-white">
                    Seg a Sex 07h às 18h | Sáb 07h às 12h
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Central de Atendimento
                  </p>
                  <p className="text-lg font-black text-white">{SITE.phoneDisplay}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTITUCIONAL + DEPOIMENTOS ── */}
      <div className="py-10">
        <InstitutionalSection />
      </div>

      <section className="relative my-12 overflow-hidden bg-secondary py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ── CTA B2B ── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-800/90 bg-gradient-to-br from-slate-900 via-[#0C1222] to-slate-950 p-8 text-white shadow-2xl sm:rounded-[3.5rem] sm:p-12 lg:p-16">
          <div className="absolute -translate-y-1/2 translate-x-1/2 right-0 top-0 h-64 w-64 rounded-full bg-blue-600 opacity-20 blur-[100px] transition-transform duration-700 group-hover:scale-110 sm:h-96 sm:w-96" />
          <div className="relative z-10 flex flex-col items-center gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Orçamento Imediato</span>
              </div>
              <h2 className="text-4xl font-black leading-[1.0] tracking-tight sm:text-5xl">
                Preço de atacado<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">direto da fonte.</span>
              </h2>
              <p className="mx-auto max-w-xl text-lg font-medium leading-relaxed text-white/70 lg:mx-0">
                Cimento, aço, hidráulica e acabamento com entrega rápida, parcelamento em até 12x no cartão e desconto especial no PIX.
              </p>
            </div>
            <HomeWhatsAppCta />
          </div>
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
