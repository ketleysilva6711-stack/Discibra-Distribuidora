"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
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
    image_url: "/banners/mobile/banner-02-solucoes-verao.webp",
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

  const hasData = slides && slides.length > 0
  if (!hasData && (!initialSlides || initialSlides.length === 0)) {
    return <div className="relative w-full animate-pulse bg-slate-100 aspect-[16/9] sm:aspect-[1920/430] min-h-[180px] sm:min-h-0" />
  }
  if ((!slides || slides.length === 0) && (!initialSlides || initialSlides.length === 0)) return null

  const currentSlides = slides || initialSlides || []

  const mobileHero = (
    <section className="block md:hidden group/hero relative w-full" aria-label="Ofertas da campanha">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 [scrollbar-width:none]">
          {CAMPAIGN_BANNERS.map((banner, i) => (
            <a key={banner.key} href={String(banner.link ?? "")} className="relative flex-none w-full snap-center aspect-[4/3] overflow-hidden rounded-[var(--r)] border border-[var(--line)]">
              <Image src={String(banner.image_url ?? "")} alt={String(banner.title || `Banner ${i + 1}`)} fill sizes="100vw" priority={i === 0} className="object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-6 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8590C]/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">{banner.title}</span>
                <p className="mt-1 text-sm sm:text-base font-bold text-white leading-tight">{banner.subtitle}</p>
              </div>
              <Link href={String(banner.link ?? "")} className="absolute inset-0 z-10"><span className="sr-only">Ver detalhes</span></Link>
            </a>
          ))}
        </div>
      </div>
    </section>
  )

  const desktopHero = (
    <section className="hidden md:block group/hero relative w-full" aria-label="Banners principais">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {(slides || []).map((slide, i) => (
            <div key={slide.key} className="relative flex-none w-full snap-center aspect-[16/9] overflow-hidden rounded-[var(--r)] border border-[var(--line)]">
              <Image src={String(slide.image_url ?? "")} alt={String(slide.title || `Banner ${i + 1}`)} fill sizes="100vw" className="object-cover" />
              {slide.link && (
                <Link href={slide.link} className="absolute inset-0 z-10"><span className="sr-only">Ver detalhes</span></Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  return (
    <>
      {mobileHero}
      {desktopHero}
    </>
  )
}
