"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import useEmblaCarousel from "embla-carousel-react"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { parseBannerImages } from "@/lib/site-settings"
import { waLink } from "@/lib/site-config"

const supabase = createClient()

export type Slide = {
  key: string
  image_url: string
  link?: string | null
  title?: string | null
  subtitle?: string | null
}

const CAMPAIGN_BANNERS: Slide[] = [
  {
    key: "promo-verao",
    image_url: "/banners/banner-02-solucoes-verao.webp",
    link: "/promocoes",
    title: "Solucoes para o Verao",
    subtitle: "Precos especiais para voce",
  },
  {
    key: "promo-telhas",
    image_url: "/banners/mobile/banner-03-telhas-coberturas.webp",
    link: "/categoria/telhas-e-coberturas",
    title: "Telhas a partir de R$ 47,90",
    subtitle: "Compre hoje, receba amanha",
  },
  {
    key: "promo-impermeabilizantes",
    image_url: "/banners/mobile/banner-04-impermeabilizantes-viaplus.webp",
    link: "/categoria/impermeabilizantes",
    title: "Impermeabilizantes a partir de R$ 53,90",
    subtitle: "Viapol Bianco Vedacit",
  },
]

async function fetchCmsSlides(): Promise<Slide[]> {
  const { data } = await supabase.from("site_settings").select("banner_images").eq("id", "default").maybeSingle()
  if (!data?.banner_images) return []
  const parsed: any[] = parseBannerImages(data.banner_images)
  const valid = parsed.filter((s) => s.image_url?.trim())
  return valid.map((s, i) => ({ key: `cms-${i}`, image_url: s.image_url, link: s.link ?? null, title: s.title ?? null, subtitle: s.subtitle ?? null }))
}

async function fetchDbBanners(): Promise<Slide[]> {
  const { data } = await supabase.from("banners").select("*").eq("active", true).order("sort_order", { ascending: true })
  return (data || []).map((b: any) => ({ key: `db-${b.id}`, image_url: b.image_url, link: b.link ?? null, title: b.title ?? null, subtitle: b.subtitle ?? null }))
}

async function fetchSlides(): Promise<Slide[]> {
  const cmsSlides = await fetchCmsSlides()
  if (cmsSlides.length > 0) return cmsSlides
  return await fetchDbBanners()
}

export function HeroBanner({ initialSlides }: { initialSlides?: Slide[] }) {
  const { data: slides } = useSWR<Slide[]>("store-hero-slides", fetchSlides, {
    fallbackData: initialSlides,
    revalidateOnMount: initialSlides && initialSlides.length > 0 ? false : true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: (slides?.length ?? 0) > 1, align: "start", duration: 40 })
  const [selected, setSelected] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const onSelect = useCallback(() => { if (!emblaApi) return; setSelected(emblaApi.selectedScrollSnap()) }, [emblaApi])
  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi || !slides || slides.length <= 1 || isPaused) return
    const interval = setInterval(() => emblaApi.scrollNext(), 6000)
    return () => clearInterval(interval)
  }, [emblaApi, slides, isPaused])

  const hasData = slides && slides.length > 0
  if (!hasData && (!initialSlides || initialSlides.length === 0)) {
    return <div className="relative w-full animate-pulse bg-slate-100 h-auto min-h-[300px] sm:min-h-[250px]" />
  }

  if ((!slides || slides.length === 0) && (!initialSlides || initialSlides.length === 0)) return null

  const mobileHero = (
    <section className="block md:hidden relative w-full" aria-label="Ofertas da campanha">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 [scrollbar-width:none]">
          {CAMPAIGN_BANNERS.map((banner, i) => (
            <a key={banner.key} href={banner.link!} className="relative flex-none w-full snap-center aspect-[4/3] overflow-hidden rounded-[var(--r)] border border-[var(--line)]">
              <Image src={banner.image_url!} alt={banner.title || `Banner ${i + 1}`} width={1920} height={430} sizes="100vw" priority={i === 0} className="w-full h-auto" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8590C]/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">{banner.title}</span>
                <p className="mt-1 text-sm sm:text-base font-bold text-white leading-tight">{banner.subtitle}</p>
              </div>
              <Link href={banner.link!} className="absolute inset-0 z-10"><span className="sr-only">Ver detalhes</span></Link>
            </a>
          ))}
        </div>
      </div>
    </section>
  )

  const desktopHero = (
    <section className="hidden md:block group/hero relative w-full" aria-label="Banners principais">
      <div className="relative w-full overflow-hidden" ref={emblaRef}>
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {(slides || []).map((slide, i) => (
            <div key={slide.key} className="relative flex-none w-full snap-center">
              <Image src={String(slide.image_url ?? "")} alt={String(slide.title || `Banner ${i + 1}`)} width={1920} height={430} sizes="100vw" className="w-full h-auto object-cover" priority={i === 0} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              {slide.link && (
                <Link href={String(slide.link)} className="absolute inset-0 z-10"><span className="sr-only">Ver detalhes</span></Link>
              )}
            </div>
          ))}
        </div>
      </div>
      {(slides?.length ?? 0) > 1 && (
        <>
          <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 hidden md:flex justify-between pointer-events-none z-20">
            <button type="button" onClick={() => emblaApi?.scrollPrev()} className={cn("pointer-events-auto h-14 w-14 flex items-center justify-center rounded-[var(--r)]", "bg-white/20 backdrop-blur-md text-white border border-white/20", "opacity-0 group-hover/hero:opacity-100 -translate-x-4 group-hover/hero:translate-x-0", "transition-all hover:bg-white hover:text-secondary")} aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={() => emblaApi?.scrollNext()} className={cn("pointer-events-auto h-14 w-14 flex items-center justify-center rounded-2xl", "bg-white/20 backdrop-blur-md text-white border border-white/20", "opacity-0 group-hover/hero:opacity-100 translate-x-4 group-hover/hero:translate-x-0", "transition-all hover:bg-white hover:text-secondary")} aria-label="Proximo"><ChevronRight className="h-6 w-6" /></button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {(slides || []).map((_, i) => (
              <button key={i} type="button" onClick={() => emblaApi?.scrollTo(i)} aria-label={`Slide ${i + 1}`} className={cn("rounded-full transition-all duration-300", i === selected ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60")} />
            ))}
          </div>
        </>
      )}
    </section>
  )

  return (
    <>
      {mobileHero}
      {desktopHero}
    </>
  )
}
