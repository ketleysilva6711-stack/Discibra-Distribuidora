'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
interface Banner {
  id: string
  image_url: string
  link?: string | null
  title?: string | null
}
interface HeroBannerClientProps {
  banners: Banner[]
}
export function HeroBannerClient({ banners }: HeroBannerClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = banners.length
  const nextSlide = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])
  const prevSlide = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])
  useEffect(() => {
    if (isPaused || total <= 1) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [nextSlide, isPaused, total])
  if (!banners || total === 0) return null
  return (
    <div
      className="relative w-full overflow-hidden bg-[#111318]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container de Slides com Transição Suave */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((b, idx) => (
          <div key={b.id || idx} className="w-full flex-shrink-0">
            <a href={b.link || '#'} className="block w-full">
              <Image
                src={b.image_url}
                alt={b.title || 'Banner promocional Discibra'}
                width={1920}
                height={500}
                priority={idx === 0}
                sizes="100vw"
                className="w-full h-auto block object-contain"
              />
            </a>
          </div>
        ))}
      </div>
      {/* Controles de Navegação (Setas) */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={nextSlide}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          {/* Indicadores Minimalistas */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full">
            {banners.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir para banner ${i + 1}`}
                className={`h-1.5 transition-all rounded-full ${
                  i === currentIndex ? 'w-5 bg-[#E8590C]' : 'w-1.5 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
            {total > 8 && (
              <span className="text-[10px] text-white/80 font-mono ml-1">
                {currentIndex + 1}/{total}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
