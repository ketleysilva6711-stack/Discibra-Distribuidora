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
  if (cmsSlides.length > 0) return cmsSlides
  return fetchDbBanners()
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
