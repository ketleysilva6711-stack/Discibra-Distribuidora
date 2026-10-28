"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Truck, ShieldCheck, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

function BannerIcon({
  component: Icon,
  className,
}: {
  component: React.ElementType
  className?: string
}) {
  return <Icon className={className} />
}

type PromoBanner = {
  key: string
  title: string
  subtitle: string
  priceText: string
  validity: string
  link: string
  ctaLabel: string
  mobileSrc: string
  desktopSrc: string
  width: number
  height: number
  icon: React.ElementType
  dataSource: string
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    key: "promo-verao",
    title: "Soluções para o Verão",
    subtitle: "Preços especiais para você",
    priceText: "Oferta por tempo limitado",
    validity: "Validade: 15/10 a 15/11",
    link: "/promocoes",
    ctaLabel: "Ver promoções de verão",
    mobileSrc: "/banners/mobile/banner-02-solucoes-verao.webp",
    desktopSrc: "/banners/desktop/banner-02-solucoes-verao.webp",
    width: 768,
    height: 576,
    icon: Flame,
    dataSource: "home_promo_banner",
  },
  {
    key: "promo-telhas",
    title: "Telhas a partir de R$ 47,90",
    subtitle: "Compre hoje, receba amanhã",
    priceText: "Frete incluso na região",
    validity: "Estoque sujeito a confirmação",
    link: "/categoria/telhas-e-coberturas",
    ctaLabel: "Ver telhas e coberturas",
    mobileSrc: "/banners/mobile/banner-03-telhas-coberturas.webp",
    desktopSrc: "/banners/desktop/banner-03-telhas-coberturas.webp",
    width: 768,
    height: 576,
    icon: Truck,
    dataSource: "home_promo_banner",
  },
  {
    key: "promo-impermeabilizantes",
    title: "Impermeabilizantes a partir de R$ 53,90",
    subtitle: "Sua obra livre de infiltração",
    priceText: "Viapol • Bianco • Vedacit",
    validity: "Linhas completa em estoque",
    link: "/categoria/impermeabilizantes",
    ctaLabel: "Ver impermeabilizantes",
    mobileSrc: "/banners/mobile/banner-04-impermeabilizantes-viaplus.webp",
    desktopSrc: "/banners/desktop/banner-04-impermeabilizantes-viaplus.webp",
    width: 768,
    height: 576,
    icon: ShieldCheck,
    dataSource: "home_promo_banner",
  },
]

export default function ResponsivePromoBannerSection() {
  return (
    <section className="my-8 sm:my-12 lg:my-16" aria-label="Ofertas promocionais da campanha">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {PROMO_BANNERS.map((banner, i) => {
            const isFirst = i === 0
            return (
              <div key={banner.key} className="relative group overflow-hidden rounded-3xl border border-border/80 bg-slate-50 shadow-sm">
                <div className="relative w-full overflow-hidden rounded-3xl">
                  <picture className="w-full h-full block">
                    <source media="(max-width: 768px)" srcSet={banner.mobileSrc} />
                    <source media="(min-width: 769px)" srcSet={banner.desktopSrc} />
                    <img
                      src={banner.desktopSrc}
                      alt={banner.title}
                      loading={isFirst ? "eager" : "lazy"}
                      fetchPriority={isFirst ? "high" : "auto"}
                      className="w-full h-auto object-cover"
                      width={banner.width}
                      height={banner.height}
                      decoding="async"
                    />
                  </picture>
                </div>

                <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F47920]/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      {banner.icon ? (
                        <BannerIcon component={banner.icon} className="w-3 h-3 fill-current" />
                      ) : null}
                      {banner.title}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-100 leading-tight">
                      {banner.subtitle}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {banner.priceText}
                    </p>
                    <p className="text-xs text-slate-200/80">{banner.validity}</p>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Link
                      href={banner.link}
                      data-track="banner_promo_click"
                      data-button-name="banner_promo_click"
                      data-source={banner.dataSource}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all hover:bg-[#1EBE5B] active:scale-95 whitespace-nowrap"
                    >
                      {banner.ctaLabel}
                    </Link>
                    <Link
                      href={banner.link}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-white/20 whitespace-nowrap"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
