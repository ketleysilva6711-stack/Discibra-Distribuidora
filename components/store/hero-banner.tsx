"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import useEmblaCarousel from "embla-carousel-react"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { parseBannerImages, type CmsBannerSlide } from "@/lib/site-settings"
import { waLink } from "@/lib/site-config"

const supabase = createClient()

export type Slide = {
  key: string
  image_url: string
  link?: string | null
  title?: string | null
  subtitle?: string | null
}

// ─── Tipos internos ────────────────────────────────────────────────────────────
type DbBanner = {
  id: string
  image_url: string
  link?: string | null
  title?: string | null
  subtitle?: string | null
}

// ─── Slide institucional de autoridade (sempre primeiro) ───────────────────────
const INSTITUTIONAL_SLIDE: Slide = {
  key: "institutional-distribuidora",
  image_url: "/banners/banner-11-acos-para-construcao.webp",
  title: "Distribuidora de Materiais de Construção",
  subtitle: "Ribeirão Preto e Região",
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/** Lê slides do CMS (site_settings.banner_images) — prioridade 1 */
async function fetchCmsSlides(): Promise<Slide[]> {
  const { data } = await supabase
    .from("site_settings")
    .select("banner_images")
    .eq("id", "default")
    .maybeSingle()

  if (!data?.banner_images) return []

  const parsed: CmsBannerSlide[] = parseBannerImages(data.banner_images)

  // Só considera slides que têm imagem definida
  const valid = parsed.filter((s) => s.image_url?.trim())
  return valid.map((s, i) => ({
    key: `cms-${i}`,
    image_url: s.image_url,
    link: s.link ?? null,
    title: s.title ?? null,
    subtitle: s.subtitle ?? null,
  }))
}

/** Lê banners da tabela clássica — fallback quando CMS não tem slides */
async function fetchDbBanners(): Promise<Slide[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })

  return (data || []).map((b: DbBanner) => ({
    key: `db-${b.id}`,
    image_url: b.image_url,
    link: b.link ?? null,
    title: b.title ?? null,
    subtitle: b.subtitle ?? null,
  }))
}

/** Combina ambas as fontes: CMS tem prioridade, senão usa tabela banners */
async function fetchSlides(): Promise<Slide[]> {
  const cmsSlides = await fetchCmsSlides()
  if (cmsSlides.length > 0) return [INSTITUTIONAL_SLIDE, ...cmsSlides]
  return [INSTITUTIONAL_SLIDE, ...(await fetchDbBanners())]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function HeroBanner({ initialSlides }: { initialSlides?: Slide[] }) {
  const { data: slides, isLoading } = useSWR<Slide[]>("store-hero-slides", fetchSlides, {
    fallbackData: initialSlides,
    revalidateOnMount: initialSlides && initialSlides.length > 0 ? false : true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: (slides?.length ?? 0) > 1,
    align: "start",
    duration: 40,
  })

  const [selected, setSelected] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  // Autoplay — pausa no hover
  useEffect(() => {
    if (!emblaApi || !slides || slides.length <= 1 || isPaused) return
    const interval = setInterval(() => emblaApi.scrollNext(), 6000)
    return () => clearInterval(interval)
  }, [emblaApi, slides, isPaused])

  // Skeleton enquanto carrega (apenas se não houver dados SSR)
  const hasData = slides && slides.length > 0
  if (!hasData && (!initialSlides || initialSlides.length === 0)) {
    return (
      <div className="relative w-full animate-pulse bg-slate-100 aspect-[16/9] sm:aspect-[1920/430] min-h-[180px] sm:min-h-0" />
    )
  }

  // Sem banners cadastrados e sem dados SSR → não renderiza nada
  if ((!slides || slides.length === 0) && (!initialSlides || initialSlides.length === 0)) return null

  return (
    <section
      className="group/hero relative w-full"
      aria-label="Banners principais"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Carousel track ── */}
      <div className="relative w-full overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {(slides || []).map((slide, i) => (
            <div key={slide.key} className="relative min-w-0 shrink-0 grow-0 basis-full">
              {/* Proporção responsiva — 16:9 no mobile, 1920/430 no desktop */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[1920/430] min-h-[180px] sm:min-h-0">
                <Image
                  src={slide.image_url.trim()}
                  alt={slide.title || `Banner ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />

                {/* Gradientes suaves */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* ── Sobreposição institucional de autoridade ── */}
                {slide.key === "institutional-distribuidora" && (
                  <div className="absolute inset-0 z-20 flex flex-col items-start justify-between p-6 sm:p-10 bg-black/40 backdrop-blur-sm">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 mb-4">
                        <span className="text-amber-400">📍</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                          Distribuidora Oficial · Ribeirão Preto e Região
                        </span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight mb-4">
                        Materiais de Construção com Preço Direto da Fábrica
                      </h1>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-8 max-w-2xl">
                        Cimentos líderes (Votoran, Cauê, Montes Claros), aço
                        estrutural Gerdau e materiais pesados com entrega com
                        munck ou carga fechada direto na sua obra.
                      </p>

                      {/* Selos de credibilidade */}
                      <div className="flex flex-wrap items-center gap-3 mb-8">
                        {[
                          "✓ CNPJ 59.566.414/0001-25 Verificado",
                          "✓ Frota Própria com Caminhão Munck",
                          "✓ Venda para Pessoa Física e Construtoras",
                          "✓ Desconto no PIX ou 12x no Cartão",
                        ].map((selo, si) => (
                          <span
                            key={si}
                            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] sm:text-xs font-bold text-slate-200 whitespace-nowrap"
                          >
                            {selo}
                          </span>
                        ))}
                      </div>

                      {/* Botões de conversão */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={waLink("Olá! Gostaria de solicitar uma cotação imediata de materiais de construção.")}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track="btn_whatsapp"
                          data-button-name="btn_whatsapp"
                          data-source="hero_banner_institutional"
                          className="btn-whatsapp-track inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-white font-bold shadow-lg shadow-[#25D366]/30 transition-all hover:bg-[#1EBE5B] active:scale-95 whitespace-nowrap"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Cotação Imediata no WhatsApp
                        </a>
                        <Link
                          href="/produtos"
                          className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-all hover:bg-white/10 whitespace-nowrap"
                        >
                          Ver Catálogo Completo
                        </Link>
                      </div>
                    </div>
                  </div>
                )}



                {/* Link clicável em todo o slide */}
                {slide.link && (
                  <Link href={slide.link} className="absolute inset-0 z-10">
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controles (apenas quando múltiplos slides) ── */}
      {(slides?.length ?? 0) > 1 && (
        <>
          {/* Setas */}
          <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 hidden md:flex justify-between pointer-events-none z-20">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className={cn(
                "pointer-events-auto h-14 w-14 flex items-center justify-center rounded-2xl",
                "bg-white/20 backdrop-blur-md text-white border border-white/20",
                "opacity-0 group-hover/hero:opacity-100 -translate-x-4 group-hover/hero:translate-x-0",
                "transition-all hover:bg-white hover:text-secondary"
              )}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className={cn(
                "pointer-events-auto h-14 w-14 flex items-center justify-center rounded-2xl",
                "bg-white/20 backdrop-blur-md text-white border border-white/20",
                "opacity-0 group-hover/hero:opacity-100 translate-x-4 group-hover/hero:translate-x-0",
                "transition-all hover:bg-white hover:text-secondary"
              )}
              aria-label="Próximo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {(slides || []).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === selected
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
