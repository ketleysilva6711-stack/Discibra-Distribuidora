"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Package, Star, Zap } from "lucide-react"
import { toast } from "sonner"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { cn } from "@/lib/utils"

export type ProductCardProduct = {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  image_url: string | null
  images?: string[] | null
  unit: string
  stock: number
  is_new?: boolean
  is_discount?: boolean
  review_count?: number
  avg_rating?: number
  sku?: string | null
}

export function addToCart(product: ProductCardProduct, qty = 1) {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const idx = cart.findIndex((i: { id: string }) => i.id === product.id)
    if (idx >= 0) {
      cart[idx].qty += qty
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        unit: product.unit,
        qty,
      })
    }
    localStorage.setItem("cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("cart-updated"))
    toast.success("Adicionado ao orçamento!")
  } catch {
    toast.error("Erro ao adicionar")
  }
}

/** Ícone de carriola profissional */
function CarriolaIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M5.5 12.5L7.5 6.5H16.5L18.5 12.5H5.5Z"
        fill={filled ? "currentColor" : "none"}
      />
      <path d="M2.5 10.5L6.5 13.5L18.5 16.5" />
      <path d="M8.5 14.5V19" />
      <circle cx="19" cy="17" r="2.2" fill={filled ? "currentColor" : "none"} />
    </svg>
  )
}

export default function ProductCard({ product }: { product: ProductCardProduct }) {
  const [isWishlist, setIsWishlist] = useState(false)
  const initialImage = product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null)
  const [imgSrc, setImgSrc] = useState<string | null>(initialImage)

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0

  const rating = product.avg_rating ?? (4.7 + ((product.name.length % 3) * 0.1))
  const ratingDisplay = rating.toFixed(1)
  const reviewCount = product.review_count ?? 0

  const isLowStock = product.stock > 0 && product.stock <= 10

  const waHref = waLink(
    `Olá! Tenho interesse em: ${product.name} — R$ ${Number(product.price).toFixed(2)} (${product.unit})`,
  )

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white",
        "transition-all duration-300",
        "hover:shadow-[0_16px_40px_-16px_rgba(0,45,91,0.25)] hover:-translate-y-0.5 hover:border-slate-300",
      )}
    >
      {/* ── Badges flutuantes ── */}
      <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1.5">
          {product.is_new && (
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-lg shadow-emerald-500/30">
              <span className="text-[10px] font-black uppercase tracking-widest">NOVO</span>
            </span>
          )}
          {discount > 0 && (
            <span className="inline-flex items-center gap-1 bg-[#F47920] text-white px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/30">
              <span className="text-[10px] font-black uppercase tracking-widest">-{discount}%</span>
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center gap-1 bg-red-500/90 text-white px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30">
              <Zap className="w-2.5 h-2.5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Últimas un.</span>
            </span>
          )}
        </div>

        {/* Carriola de Obra */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setIsWishlist(!isWishlist)
          }}
          className={cn(
            "pointer-events-auto h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300",
            "backdrop-blur-md border shadow-xs",
            isWishlist
              ? "bg-blue-600 text-white border-blue-600 scale-110 shadow-sm"
              : "bg-white/90 text-slate-400 border-slate-200/80 hover:bg-white hover:text-blue-600 hover:scale-105"
          )}
          aria-label={isWishlist ? "Remover da carriola" : "Salvar na carriola"}
          title={isWishlist ? "Remover da carriola" : "Salvar na carriola"}
        >
          <CarriolaIcon className="h-4 w-4 transition-all" filled={isWishlist} />
        </button>
      </div>

      {/* ── Imagem ── */}
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden"
        aria-label={`Ver ${product.name}`}
      >
        <div className="absolute inset-0 bg-slate-50" />

        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-contain p-4 sm:p-5 transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgSrc(null)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Botão "Adicionar" aparece no hover da imagem */}
        <div className="absolute inset-x-3 bottom-3 z-20 max-sm:opacity-90 max-sm:translate-y-0 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <button
            onClick={(e) => {
              e.preventDefault()
              addToCart(product)
            }}
            className={cn(
              "w-full h-11 flex items-center justify-center gap-2",
              "bg-white/95 backdrop-blur-xl text-blue-600 text-[10px] font-black uppercase tracking-widest",
              "rounded-xl shadow-xl border border-white",
              "hover:bg-blue-600 hover:text-white hover:border-blue-600",
              "transition-all active:scale-95"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Adicionar ao orçamento
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col p-3 sm:p-5 pt-2 sm:pt-3">
        {/* Status + Rating */}
        <div className="mb-2 sm:mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
            )} />
            <span className={cn(
              "text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em]",
              product.stock > 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {product.stock > 0 ? "Em estoque" : "Esgotado"}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] sm:text-[10px] font-bold text-slate-700">{ratingDisplay}</span>
          </div>
        </div>

        {/* Nome — tipografia institucional de atacado */}
        <Link href={`/produto/${product.slug}`} className="mb-2 block group/title">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-[14px] sm:text-[15px] font-semibold leading-snug text-slate-800 group-hover:text-[#C2410C] transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.sku && (
          <p className="mb-2 text-[11px] font-medium tracking-wide text-slate-400">Cód. {product.sku}</p>
        )}

        {/* Preço de atacado */}
        <div className="mt-auto">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Preço de atacado</p>
          <div className="flex flex-col mb-3">
            {product.original_price && product.original_price > product.price && (
              <p className="text-[11px] text-slate-400 line-through font-medium leading-none mb-1">
                R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-500">R$</span>
              <p className="text-[26px] font-extrabold text-[#C2410C] tracking-tight leading-none">
                {Number(product.price).toFixed(2).replace(".", ",")}
              </p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-end pb-0.5">
                /{product.unit}
              </span>
            </div>
          </div>

          {/* Ações — WhatsApp em destaque, detalhes como secundário */}
          <div className="flex flex-col gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="product_card"
              aria-label="Pedir pelo WhatsApp"
              onClick={() => trackWhatsAppClick("product_card", `/produto/${product.slug}`)}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl",
                "bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest",
                "transition-all hover:bg-[#1fba58] active:scale-95 shadow-md shadow-[#25D366]/25",
                "btn-whatsapp-track"
              )}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Pedir Orçamento
            </a>
            <Link
              href={`/produto/${product.slug}`}
              className="flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 active:scale-95"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
