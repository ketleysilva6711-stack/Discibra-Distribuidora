// =============================================================================
// CLIENT COMPONENT — ProductPageClient.tsx
// Componente interativo com carrinho, avaliações, galeria, etc.
// Recebe dados do servidor via props (hydratação limpa)
// =============================================================================

"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Script from "next/script"
import {
  ShoppingCart, Minus, Plus, Package, Star,
  ChevronRight, Truck, ShieldCheck, Award,
  CheckCircle2, ThumbsUp, MessageSquare, Zap
} from "lucide-react"
import { addToCart } from "@/components/store/product-card"
import ProductCard from "@/components/store/product-card"
import PalletPriceTable from "@/components/store/pallet-price-table"
import CepFreightCalculator from "@/components/store/cep-freight-calculator"
import Link from "next/link"
import { toast } from "sonner"
import { waLink, SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { cn } from "@/lib/utils"
import { ProductStructuredData } from "@/components/store/seo-structured-data"

const supabase = createClient()

// ─── ID da categoria de cimentos ── //
const CAT_CIMENTO_ID = "c0134152-de0a-42f7-bb87-dd9ec8588983"

// ─── Tipos ────────────────────────────────────────────────────
type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  original_price?: number | null
  unit: string
  sku: string | null
  image_url: string | null
  images?: string[] | null
  stock: number
  is_new?: boolean
  active?: boolean
  category_id?: string | null
  categories?: { name: string; slug: string } | null
  created_at?: string
}

type Review = {
  id: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
  approved: boolean
}

// ─── Data humanizada ──────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "hoje"
  if (diffDays === 1) return "ontem"
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 14) return "há 1 semana"
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 60) return "há 1 mês"
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`
  return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? "s" : ""}`
}

// ─── Cor de avatar consistente por nome ───────────────────────
const AVATAR_PALETTES = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
]
function avatarPalette(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

// ─── Componente Cliente ────────────────────────────────────────
export function ProductPageClient({ product: initialProduct }: { product: Product }) {
  const slug = initialProduct.slug
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" })
  const [submittingReview, setSubmittingReview] = useState(false)

  // ── Produto ──────────────────────────────────────────────────
  const { data: product } = useSWR(`product-${slug}`, async () => {
    const { data } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .single()
    return data
  }, { fallbackData: initialProduct, revalidateOnMount: false, revalidateOnFocus: false })

  // ── Reviews ──────────────────────────────────────────────────
  const { data: reviews, mutate: mutateReviews } = useSWR(
    product ? `reviews-${product.id}` : null,
    async () => {
      if (!product) return []
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product.id)
        .eq("approved", true)
        .order("created_at", { ascending: false })
      return (data || []) as Review[]
    }
  )

  // ── Produtos relacionados ────────────────────────────────────
  const { data: related } = useSWR(
    product?.category_id ? `related-${product.category_id}-${product.id}` : null,
    async () => {
      if (!product?.category_id) return []
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4)
      return data || []
    }
  )

  // ── Submit review ────────────────────────────────────────────
  async function handleSubmitReview() {
    if (!product) return
    if (!reviewForm.name.trim()) { toast.error("Informe seu nome"); return }
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 20) {
      toast.error("O comentário deve ter ao menos 20 caracteres")
      return
    }
    setSubmittingReview(true)
    const { error } = await supabase.from("reviews").insert({
      product_id: product.id,
      customer_name: reviewForm.name,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      approved: false,
    })
    if (error) { toast.error("Erro ao enviar avaliação"); setSubmittingReview(false); return }
    toast.success("Avaliação enviada! Será publicada após revisão.")
    setReviewForm({ name: "", rating: 5, comment: "" })
    setSubmittingReview(false)
    mutateReviews()
  }

  // ── Dados derivados ──────────────────────────────────────────
  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[]
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0
  const avgRating = reviews && reviews.length
    ? (reviews.reduce((a: number, r: Review) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0"
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews && reviews.filter((r: Review) => r.rating === star).length || 0,
  }))

  // ── JSON-LD para SEO / Google Ads / Meta Ads ─────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — ${SITE.shortName}. Compre com preço de atacado e entrega ágil.`,
    image: allImages[0] ? [allImages[0]] : [],
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: SITE.shortName },
    offers: {
      "@type": "Offer",
      url: `${SITE.siteUrl}/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: Number(product.price).toFixed(2),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.legalName },
    },
    ...(reviews && reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: reviews.length,
            bestRating: "5",
            worstRating: "1",
          },
          review: reviews.slice(0, 5).map((r: Review) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: "5",
            },
            author: { "@type": "Person", name: r.customer_name },
            reviewBody: r.comment,
            datePublished: r.created_at.split("T")[0],
          })),
        }
      : {}),
  }

  return (
    <>
      {/* ── JSON-LD Structured Data (SEO + Ads conformidade) ── */}
      <Script
        id={`product-ld-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductStructuredData
        name={product.name}
        description={product.description || ""}
        price={Number(product.price)}
        sku={product.sku || product.id}
        image={allImages[0] || ""}
        originalPrice={product.original_price}
        availability={product.stock > 0 ? "InStock" : "OutOfStock"}
        rating={reviews && reviews.length > 0 ? Number(avgRating) : undefined}
        reviewCount={reviews?.length}
        url={`${SITE.siteUrl}/produto/${product.slug}`}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 pb-28 md:pb-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400"
        >
          <Link href="/" className="hover:text-[#002D5B] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 opacity-40" />
          {product.categories && (
            <>
              <Link href={`/categoria/${product.categories.slug}`} className="hover:text-[#002D5B] transition-colors">
                {product.categories.name}
              </Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </>
          )}
          <span className="text-slate-600 truncate max-w-[240px]">{product.name}</span>
        </nav>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 min-w-0">

          {/* Coluna Esquerda: Imagens */}
          <div className="lg:col-span-7 min-w-0">
            <div className="sticky top-24 space-y-4">
              {/* Imagem principal */}
              <div className={cn(
                "relative aspect-square max-h-[420px] sm:max-h-none overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm",
                "transition-shadow hover:shadow-md"
              )}>
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width:1024px) 100vw, 50vw"
                    className="object-contain p-8 transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <Package className="w-24 h-24 text-slate-200" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-5 top-5 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="rounded-full bg-[#F47920] px-4 py-1.5 text-xs font-black text-white">
                      -{discount}%
                    </span>
                  )}
                  {product.is_new && (
                    <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-black text-white">
                      NOVO
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all",
                        i === selectedImage
                          ? "border-[#C2410C] scale-105"
                          : "border-slate-100 hover:border-slate-300"
                      )}
                      aria-label={`Imagem ${i + 1}`}
                    >
                      <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-contain p-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Info */}
          <div className="lg:col-span-5 space-y-7 min-w-0">
            <div>
              {/* Categoria + Rating rápido */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {product.categories?.name || "Produto"}
                </span>
                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < Math.round(Number(avgRating))
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200 fill-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{avgRating}</span>
                    <span className="text-[10px] text-slate-400">({reviews.length})</span>
                  </div>
                )}
              </div>

              {/* Nome */}
              <h1 className="text-3xl lg:text-[2.25rem] font-black text-slate-900 leading-[1.1] mb-6 tracking-tight min-w-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
                {product.name}
              </h1>

              {/* Preço — visível no HTML inicial para Google Ads */}
              <div className="space-y-1 mb-7">
                {product.original_price && product.original_price > product.price && (
                  <p className="text-base text-slate-400 line-through font-semibold">
                    R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">R$</span>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                    {Number(product.price).toFixed(2).replace(".", ",")}
                  </p>
                  <span className="text-base font-bold text-slate-400 self-end">/{product.unit}</span>
                </div>
                {discount > 0 && (
                  <p className="text-sm font-bold text-emerald-600">
                    Você economiza R$ {(Number(product.original_price) - Number(product.price)).toFixed(2).replace(".", ",")} ({discount}% off)
                  </p>
                )}
              </div>

              {/* ── Tabela de Volume & Frete (cimento / saco ou unidade) ── */}
              {(
                product.unit === "saco" ||
                product.unit === "unidade" ||
                product.category_id === CAT_CIMENTO_ID ||
                (product.categories?.name || "").toLowerCase().includes("cimento")
              ) && (
                <div className="mb-8">
                  <PalletPriceTable unitPrice={Number(product.price)} />
                </div>
              )}

              {/* Disponibilidade */}
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-2xl mb-7 border",
                product.stock > 0
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-red-50 border-red-100"
              )}>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                )} />
                <div>
                  <p className={cn(
                    "text-sm font-black",
                    product.stock > 0 ? "text-emerald-800" : "text-red-700"
                  )}>
                    {product.stock > 0
                      ? "Disponível em estoque — Pronta Entrega"
                      : "Produto temporariamente indisponível"}
                  </p>
                  {product.stock > 0 && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      Pedido confirmado hoje, saída em 24h úteis
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-5">
              {/* Quantidade */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Quantidade
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-14 text-center font-black text-lg text-slate-900">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    Total: <strong className="text-slate-900">
                      R$ {(Number(product.price) * qty).toFixed(2).replace(".", ",")}
                    </strong>
                  </span>
                </div>
              </div>

              {/* ── Calculadora de Frete por CEP ── */}
              <CepFreightCalculator
                productName={product.name}
                productSku={product.sku || product.id}
              />

              {/* Botões de ação — WhatsApp é o CTA primário */}
              <div className="flex flex-col gap-3">
                <a
                  href={waLink(`Olá! Gostaria de cotar o produto: ${product.name} (Cód. ${product.sku || product.id}) visto no site da Discibra. Qual o preço de atacado e condições de entrega?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="btn_whatsapp"
                  data-button-name="btn_whatsapp"
                  data-name="btn_whatsapp"
                  data-source="product_page"
                  onClick={() => trackWhatsAppClick("product_page", `/produto/${product.slug}`)}
                  className={cn(
                    "flex h-16 w-full items-center justify-center gap-3 rounded-[4px]",
                    "bg-[#15803D] text-lg font-semibold text-white",
                    "transition-colors hover:bg-[#166534]",
                    "btn-whatsapp-track"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Falar no WhatsApp
                </a>
                <button
                  onClick={() => addToCart(product, qty)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-3 rounded-[4px]",
                    "bg-[#111318] text-white text-base font-bold",
                    "transition-colors hover:bg-[#000000] active:scale-95",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar ao Orçamento
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── Seção inferior: Descrição + Reviews ── */}
        <div className="mt-20 lg:mt-28 min-w-0">
          <div className="flex flex-col gap-16 lg:flex-row lg:gap-16">

            {/* Coluna esquerda: Descrição + Reviews */}
            <div className="flex-1 space-y-14 min-w-0 overflow-hidden">

              {/* Descrição */}
              {product.description && (
                <section>
                  <h2 className="text-2xl font-black text-[#002D5B] mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-[#F47920] rounded-full" />
                    Descrição do Produto
                  </h2>
                  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                    <p className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Especificações Técnicas B2B */}
              <section>
                <h2 className="text-2xl font-black text-[#002D5B] mb-6 flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  Especificações Técnicas
                </h2>
                <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-900 border-b border-[#E5E5E3]">
                          Especificação
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-900 border-b border-[#E5E5E3]">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E3]">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                          SKU / Código
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 border-b border-[#E5E5E3]">
                          {product.sku || product.id}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                          Unidade de Venda
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 border-b border-[#E5E5E3]">
                          {product.unit}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                          Preço de Atacado
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 border-b border-[#E5E5E3]">
                          R$ {Number(product.price).toFixed(2).replace(".", ",")}/{product.unit}
                        </td>
                      </tr>
                      {product.original_price && product.original_price > product.price && (
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                            Preço de Lista
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-500 line-through border-b border-[#E5E5E3]">
                            R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                          Disponibilidade
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 border-b border-[#E5E5E3]">
                          {product.stock > 0 ? "Em estoque — Pronta entrega" : "Consultar prazo"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700 border-b border-[#E5E5E3]">
                          Normativa
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 border-b border-[#E5E5E3]">
                          Produto certificado ABNT
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          Garantia
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          Direto da fábrica com laudo técnico
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Vantagens da Distribuidora */}
                <div className="mt-6 grid gap-3 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Preço de Atacado
                    </span>
                    <span className="text-sm font-bold text-slate-900">Sem exigência de CNPJ</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Entrega na Obra
                    </span>
                    <span className="text-sm font-bold text-slate-900">Munck ou paletizado</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Faturamento
                    </span>
                    <span className="text-sm font-bold text-slate-900">Pessoa física e construtor</span>
                  </div>
                </div>
              </section>

              {/* Avaliações */}
              <section id="avaliacoes">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-[#002D5B] flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-[#F47920] rounded-full" />
                    Avaliações dos Clientes
                  </h2>
                  {reviews && reviews.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-black text-amber-700">{avgRating}</span>
                      <span className="text-xs text-amber-500">({reviews.length} avaliações)</span>
                    </div>
                  )}
                </div>

                {/* Painel de rating */}
                {reviews && reviews.length > 0 && (
                  <div className="bg-[#002D5B] rounded-[2rem] p-8 text-white mb-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="text-center md:border-r md:border-white/10 md:pr-10 shrink-0">
                      <p className="text-7xl font-black leading-none mb-2">{avgRating}</p>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-5 h-5",
                              i < Math.round(Number(avgRating))
                                ? "text-amber-400 fill-amber-400"
                                : "text-white/20 fill-white/20"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-white/50 font-medium">de 5 possíveis</p>
                    </div>
                    <div className="flex-1 w-full space-y-2.5">
                      {ratingCounts.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-24 shrink-0">
                            <span className="text-xs font-bold text-white/60 w-3">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </div>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-700"
                              style={{ width: reviews?.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                            />
                          </div>
                          <span className="text-xs font-bold w-6 text-right text-white/60">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feed de reviews */}
                <div className="space-y-5 mb-14">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((r: Review) => {
                      const palette = avatarPalette(r.customer_name)
                      const initial = (r.customer_name || "C").charAt(0).toUpperCase()
                      return (
                        <div
                          key={r.id}
                          className="p-6 rounded-[1.5rem] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            {/* Avatar colorido */}
                            <div className={cn(
                              "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0",
                              palette.bg, palette.text
                            )}>
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="font-black text-slate-800">{r.customer_name || "Cliente Verificado"}</p>
                                <span className="text-[11px] text-slate-400 font-medium shrink-0">{timeAgo(r.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "w-3 h-3",
                                        i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Compra verificada
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[14px]">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                          {/* Reação */}
                          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-50">
                            <ThumbsUp className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] text-slate-300 font-medium">Esta avaliação foi útil?</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                      <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Ainda não há avaliações para este produto.</p>
                      <p className="text-sm text-slate-400 mt-1">Seja o primeiro a avaliar!</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Coluna direita: Form de avaliação */}
            <div className="lg:w-[380px] shrink-0 min-w-0">
              <div className="sticky top-24 bg-slate-50/60 rounded-[2.5rem] p-8 border border-slate-100">
                <h3 className="text-xl font-black text-[#002D5B] mb-1">Deixe sua opinião</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Sua avaliação ajuda outros profissionais e construtores a escolherem os melhores materiais.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      Nome Completo *
                    </label>
                    <input
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      className="w-full h-13 px-5 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#002D5B]/10 focus:border-[#002D5B]/30 outline-none transition-all font-medium text-sm"
                      placeholder="Como deseja ser identificado?"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      Sua Nota *
                    </label>
                    <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                          className="hover:scale-125 transition-transform active:scale-95"
                          aria-label={`${i + 1} estrela${i > 0 ? "s" : ""}`}
                        >
                          <Star className={cn(
                            "w-8 h-8 transition-colors",
                            i < reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                          )} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-bold text-slate-600">
                        {["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"][reviewForm.rating]}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      Comentário *
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#002D5B]/10 focus:border-[#002D5B]/30 outline-none transition-all font-medium resize-none text-sm"
                      placeholder="Fale sobre a qualidade, entrega, aplicação... (mín. 20 caracteres)"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                      {reviewForm.comment.length}/20 mínimo
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-base",
                      "bg-[#F47920] text-white shadow-orange-500/20",
                      "hover:bg-[#e06b10] hover:scale-[1.02] active:scale-95",
                      "transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {submittingReview ? "Enviando..." : "Publicar Avaliação"}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 leading-relaxed px-2">
                    Sua avaliação passará por uma breve moderação antes de aparecer no site. Avaliações falsas ou ofensivas são removidas automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA pós-avaliações (largura total, fora do grid) ── */}
        <div className="mt-8 rounded-2xl border border-[#25D366]/30 bg-[#f0fdf4] p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-black text-slate-900 text-base">Ainda tem dúvidas sobre este produto?</p>
            <p className="text-sm text-slate-500 mt-1">Fale com um especialista da Discibra agora — respondemos em minutos.</p>
          </div>
          <a
            href={waLink(`Olá! Gostaria de cotar o produto: ${product.name} (Cód. ${product.sku || product.id}) visto no site da Discibra. Qual o preço de atacado e condições de entrega?`)}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="post_reviews_cta"
            className="btn-whatsapp-track shrink-0 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] bg-[#15803D] text-white font-semibold text-sm transition-colors hover:bg-[#166534] whitespace-nowrap"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Falar no WhatsApp
          </a>
        </div>

        {/* ── Produtos relacionados ── */}
        {related && related.length > 0 && (
          <section className="mt-20 lg:mt-28">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-[1px] w-6 bg-[#F47920]/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F47920]">
                    Você também pode gostar
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[#002D5B]">Produtos Relacionados</h2>
              </div>
              {product.categories && (
                <Link
                  href={`/categoria/${product.categories.slug}`}
                  className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#002D5B] transition-colors"
                >
                  Ver categoria completa
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── STICKY BUY BAR MOBILE ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 pt-3 px-3 shadow-2xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto pb-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Preço de atacado</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-bold text-slate-600">R$</span>
              <span className="text-xl font-black text-slate-900 leading-none">
                {Number(product.price).toFixed(2).replace(".", ",")}
              </span>
              <span className="text-[10px] font-bold text-slate-400">/{product.unit}</span>
            </div>
          </div>
          <a
            href={waLink(`Olá! Gostaria de cotar o produto: ${product.name} (Cód. ${product.sku || product.id}) visto no site da Discibra. Qual o preço de atacado e condições de entrega?`)}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="product_sticky_mobile"
            className="btn-whatsapp-track flex-1 flex items-center justify-center gap-2 h-11 rounded-[4px] bg-[#15803D] text-white text-xs font-semibold transition-colors hover:bg-[#166534] active:scale-95"
          >
            Pedir no WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}
