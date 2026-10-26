"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/product-card"
import { Tag, ArrowLeft, Loader2, Sparkles, BadgePercent, Truck, CreditCard, ArrowDownWideNarrow } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { waLink } from "@/lib/site-config"
import { cn } from "@/lib/utils"

const supabase = createClient()

type Promo = {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  image_url: string | null
  unit: string
  stock: number
  category_id: string | null
}

async function fetchPromotions(): Promise<Promo[]> {
  // Desconto real = original_price > price. O PostgREST não compara
  // coluna-com-coluna, então filtra candidatos no banco e valida no cliente.
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price, original_price, image_url, unit, stock, category_id")
    .eq("active", true)
    .not("image_url", "is", null)
    .or("is_discount.eq.true,original_price.not.is.null")
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return ((data || []) as Promo[]).filter(
    (p) => p.original_price != null && Number(p.original_price) > Number(p.price)
  )
}

const pct = (p: Promo) =>
  Math.round(((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100)
const save = (p: Promo) => Number(p.original_price) - Number(p.price)

type SortKey = "desconto" | "preco" | "economia"

export default function PromocoesPage() {
  const { data: products, isLoading } = useSWR("store-promocoes-v2", fetchPromotions)
  const [sort, setSort] = useState<SortKey>("desconto")

  const sorted = useMemo(() => {
    const list = [...(products || [])]
    if (sort === "preco") list.sort((a, b) => a.price - b.price)
    else if (sort === "economia") list.sort((a, b) => save(b) - save(a))
    else list.sort((a, b) => pct(b) - pct(a) || save(b) - save(a))
    return list
  }, [products, sort])

  const star = sorted[0]
  const rest = sorted.slice(1)
  const maxPct = star ? pct(star) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:mb-10">
        <nav className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Promoções</span>
        </nav>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47920]/10 text-[#F47920]">
                <Tag className="h-6 w-6" />
              </div>
              <h1 className="font-heading text-3xl font-black tracking-tight text-[#002D5B] sm:text-4xl">
                Promoções Imperdíveis
              </h1>
            </div>
            <p className="mt-3 text-muted-foreground">
              As melhores ofertas em materiais de construção para sua obra.
            </p>
            {!isLoading && sorted.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47920] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25">
                  <BadgePercent className="h-3.5 w-3.5" />
                  {sorted.length} ofertas ativas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white">
                  Até {maxPct}% OFF
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#002D5B] p-4 text-white shadow-lg sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Ofertas de hoje</p>
              <p className="font-bold">Economia real na entrega</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sorted.length > 0 && star ? (
        <>
          {/* Oferta destaque — maior desconto */}
          <section aria-label="Oferta destaque" className="mb-10 overflow-hidden rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white shadow-xl sm:mb-12">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative min-h-64 bg-white p-6 sm:min-h-80 sm:p-10">
                {star.image_url && (
                  <Image src={star.image_url.trim()} alt={star.name} fill className="object-contain p-6" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <span className="absolute left-4 top-4 rounded-full bg-[#F47920] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                  -{pct(star)}% hoje
                </span>
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F47920]">
                  Maior desconto do dia
                </p>
                <Link href={`/produto/${star.slug}`} className="mt-2 text-2xl font-black leading-tight text-slate-900 hover:text-[#002D5B] sm:text-3xl">
                  {star.name}
                </Link>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-sm text-slate-400 line-through">
                    R$ {Number(star.original_price).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    Economize R$ {save(star).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <p className="mt-1 text-5xl font-black tracking-tight text-[#002D5B]">
                  <span className="align-top text-xl">R$</span> {Number(star.price).toFixed(2).replace(".", ",")}
                  <span className="ml-1 text-sm font-bold text-slate-400">/{star.unit}</span>
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={waLink(`Olá! Vi a promoção ${star.name} por R$ ${Number(star.price).toFixed(2).replace(".", ",")}/${star.unit} e quero comprar. Ainda está valendo?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="btn_whatsapp"
                    data-button-name="btn_whatsapp"
                    data-source="promocoes_orcamento_relampago"
                    onClick={() => trackWhatsAppClick("promocoes_orcamento_relampago")}
                    className="btn-whatsapp-track inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#25D366] px-6 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:bg-[#1EBE5B] active:scale-95"
                  >
                    Garantir no WhatsApp
                  </a>
                  <Link
                    href={`/produto/${star.slug}`}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-slate-200 px-6 text-sm font-black text-slate-700 transition-all hover:border-[#002D5B] hover:text-[#002D5B]"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Ordenação */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-600">
              {rest.length + 1} ofertas ordenadas por{" "}
              {sort === "desconto" ? "maior desconto" : sort === "preco" ? "menor preço" : "maior economia em R$"}
            </p>
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              <ArrowDownWideNarrow className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Ordenar ofertas</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-transparent outline-none"
                aria-label="Ordenar ofertas"
              >
                <option value="desconto">Maior desconto %</option>
                <option value="preco">Menor preço</option>
                <option value="economia">Maior economia R$</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>

          {/* Faixa de confiança */}
          <section className="mt-12 grid gap-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:grid-cols-3 sm:p-8">
            {[
              { icon: CreditCard, t: "Parcele em até 12x", d: "No cartão sem acréscimos" },
              { icon: Truck, t: "Descarga inclusa", d: "Munck e paletizado na obra" },
              { icon: BadgePercent, t: "PIX com desconto", d: "Preço ainda menor à vista" },
            ].map((b) => (
              <div key={b.t} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#002D5B]/5 text-[#002D5B]">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{b.t}</p>
                  <p className="text-xs text-slate-500">{b.d}</p>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : (
        <div className="rounded-[2rem] border-2 border-dashed border-border/40 bg-muted/5 py-20 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/20" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Não há promoções ativas no momento.
          </p>
          <Link
            href="/produtos"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#002D5B] px-8 text-sm font-bold text-white transition-all hover:scale-105"
          >
            Ver catálogo completo
          </Link>
        </div>
      )}

      {/* Orçamento Relâmpago CTA */}
      <div className="mt-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#002D5B] to-[#001A3A] p-8 text-white shadow-2xl sm:mt-16 sm:p-12">
        <div className="relative z-10 flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              Precisa de um <span className="text-[#F47920]">Orçamento Relâmpago</span>?
            </h2>
            <p className="max-w-xl text-lg font-medium text-white/70">
              Mande sua lista de materiais agora e receba os melhores preços em minutos via WhatsApp.
            </p>
          </div>
          <a
            href="https://wa.me/5516996447972?text=Olá! Preciso de um orçamento relâmpago para minha obra."
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-name="btn_whatsapp"
            data-source="promocoes_orcamento_relampago"
            onClick={() => trackWhatsAppClick("promocoes_orcamento_relampago")}
            className="group flex h-16 min-w-[280px] items-center justify-center gap-3 rounded-2xl bg-[#F47920] px-8 text-lg font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95 btn-whatsapp-track"
          >
            SOLICITAR AGORA
            <Sparkles className="h-5 w-5 animate-pulse" />
          </a>
        </div>
      </div>
    </div>
  )
}
