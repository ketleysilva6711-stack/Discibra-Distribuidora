"use client"

import { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
  products?: { id: string }[] | null
}

interface CategoriesCarouselProps {
  categories: Category[]
}

// Fileira fotográfica com loop infinito + arrasto livre + autoplay suave.
export default function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
    duration: 30,
  })
  const [prevEnabled, setPrevEnabled] = useState(false)
  const [nextEnabled, setNextEnabled] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevEnabled(emblaApi.canScrollPrev())
    setNextEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    emblaApi.on("pointerDown", () => setIsDragging(true))
    emblaApi.on("pointerUp", () => setIsDragging(false))
  }, [emblaApi, onSelect])

  // Autoplay — avança sempre para frente; o loop faz a volta sem pulo.
  // Pausa no hover e enquanto arrasta.
  useEffect(() => {
    if (!emblaApi || isPaused || isDragging) return
    const id = setInterval(() => emblaApi.scrollNext(), 3200)
    return () => clearInterval(id)
  }, [emblaApi, isPaused, isDragging])

  if (categories.length === 0) return null

  return (
    <section
      className="w-full"
      aria-label="Categorias de produtos"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="cursor-grab overflow-hidden py-3 active:cursor-grabbing" ref={emblaRef}>
          <div className="flex touch-pan-y gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group/card flex w-40 shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:border-[#002D5B]/30 hover:shadow-lg active:scale-[0.98] sm:w-48"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white p-2">
                  {category.image_url ? (
                    <Image
                      src={category.image_url.trim()}
                      alt={category.name}
                      fill
                      draggable={false}
                      className="rounded-2xl object-contain transition-transform duration-700 ease-out group-hover/card:scale-[1.03]"
                      sizes="200px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#002D5B]/5 text-3xl font-black uppercase text-[#002D5B]/40">
                      {category.name.charAt(0)}
                    </div>
                  )}
                  {typeof category.products?.length === "number" && category.products.length > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {category.products.length} {category.products.length === 1 ? "item" : "itens"}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-center p-3 text-center">
                  <span className="text-xs font-bold leading-snug text-slate-800 transition-colors group-hover/card:text-[#002D5B]">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Setas */}
        <button
          onClick={scrollPrev}
          disabled={!prevEnabled}
          className="absolute left-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all hover:border-[#002D5B] hover:text-[#002D5B] disabled:opacity-0 md:flex"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={scrollNext}
          disabled={!nextEnabled}
          className="absolute right-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all hover:border-[#002D5B] hover:text-[#002D5B] disabled:opacity-0 md:flex"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
