"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type Banner = {
  id: string
  image_url: string
  link_url?: string | null
  title?: string | null
  subtitle?: string | null
}

export function HeroBannerDesktop({ banners }: { banners: Banner[] }) {
  const [selected, setSelected] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Autoplay desktop
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return
    const interval = setInterval(() => {
      setSelected((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [banners.length, isPaused])

  if (banners.length === 0) return null

  return (
    <section className="hidden md:block group/hero relative w-full" aria-label="Banners principais">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {banners.map((banner, i) => (
            <div key={banner.id} className="relative flex-none w-full snap-center">
              <Image
                src={banner.image_url}
                alt={banner.title || `Banner ${i + 1}`}
                width={1920}
                height={430}
                sizes="100vw"
                className="w-full h-auto block"
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
              {banner.link_url && (
                <Link href={banner.link_url} className="absolute inset-0 z-10">
                  <span className="sr-only">Ver detalhes</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <>
          <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 hidden md:flex justify-between pointer-events-none z-20">
            <button
              type="button"
              onClick={() => setSelected((p) => (p === 0 ? banners.length - 1 : p - 1))}
              className={cn(
                "pointer-events-auto h-14 w-14 flex items-center justify-center rounded-[var(--r)]",
                "bg-white/20 backdrop-blur-md text-white border border-white/20",
                "opacity-0 group-hover/hero:opacity-100 -translate-x-4 group-hover/hero:translate-x-0",
                "transition-all hover:bg-white hover:text-secondary",
              )}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => setSelected((p) => (p + 1) % banners.length)}
              className={cn(
                "pointer-events-auto h-14 w-14 flex items-center justify-center rounded-2xl",
                "bg-white/20 backdrop-blur-md text-white border border-white/20",
                "opacity-0 group-hover/hero:opacity-100 translate-x-4 group-hover/hero:translate-x-0",
                "transition-all hover:bg-white hover:text-secondary",
              )}
              aria-label="Proximo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === selected ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
