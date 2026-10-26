"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { cn } from "@/lib/utils"

function Stars({ n }: { n: number }) {
  const count = Math.min(5, Math.max(1, n))
  return (
    <div className="flex gap-1" aria-label={`${count} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4 transition-transform hover:scale-110",
            i < count ? "fill-primary text-primary" : "text-white/20"
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

export default function TestimonialsCarousel() {
  const testimonials = [
    { name: "Carlos M.", role: "Construtora - Obra Residencial", text: "Compra segura e nota fiscal em dia. O cimento chegou lacrado e dentro do prazo — fundamental para passar na fiscalização.", rating: 5 },
    { name: "Renata S.", role: "Lojista - Revenda", text: "Preço competitivo e fornecimento contínuo. Conseguimos repor estoque rápido e não paramos a loja na alta temporada.", rating: 5 },
    { name: "Paulo A.", role: "Mestre de Obras - Obra Comercial", text: "Material com procedência e qualidade visível. Menos retrabalho e mais confiança da equipe no canteiro.", rating: 5 },
    { name: "Fernanda L.", role: "Engenheira - Gerenciamento de Obra", text: "Empresa forte no setor: atendimento técnico, agilidade na logística e respeito aos prazos do cronograma.", rating: 5 },
    { name: "Marcos V.", role: "Autônomo - Reforma", text: "Entrega rápida na região. Pedi na segunda e usei na obra na quarta — salvou meu prazo com o cliente.", rating: 5 },
    { name: "Juliana T.", role: "Incorporadora", text: "Parceria de confiança para grandes volumes. Transparência no pedido e rastreio até a entrega na obra.", rating: 5 },
  ]
  
  const items = testimonials
  const [paused, setPaused] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: items.length > 1,
    dragFree: false,
    containScroll: "trimSnaps",
    duration: 35,
  })
  
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev())
      setCanNext(emblaApi.canScrollNext())
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on("reInit", update)
    emblaApi.on("select", update)
    update()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || items.length <= 1 || paused) return
    const id = setInterval(() => {
      emblaApi.scrollNext()
    }, 6000)
    return () => clearInterval(id)
  }, [emblaApi, items.length, paused])

  return (
    <div 
      className="mx-auto max-w-7xl px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-12 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              Excelência Comprovada
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Quem constrói,<br/> 
            <span className="text-primary">recomenda.</span>
          </h2>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={scrollPrev}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition-all hover:bg-white hover:text-secondary disabled:opacity-20"
            disabled={!canPrev}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition-all hover:bg-white hover:text-secondary disabled:opacity-20"
            disabled={!canNext}
            aria-label="Próximo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 py-4">
          {items.map((t, idx) => (
            <div
              key={idx}
              className="min-w-0 shrink-0 grow-0 basis-full md:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]"
            >
              <article className="group relative h-full flex flex-col rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-8 right-10">
                  <Quote className="h-12 w-12 text-secondary/5 transition-colors group-hover:text-primary/10" />
                </div>
                
                <div className="mb-6">
                  <Stars n={t.rating} />
                </div>
                
                <p className="flex-1 text-base leading-relaxed text-secondary/80 font-medium italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                
                <div className="mt-10 flex items-center gap-4 border-t border-slate-100 pt-8">
                  <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-black text-xl">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary uppercase tracking-tight">{t.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="mt-12 flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === selectedIndex ? "w-8 bg-primary" : "w-1.5 bg-white/20"
            )}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

