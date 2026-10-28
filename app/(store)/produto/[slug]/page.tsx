// =============================================================================
// SERVEUR COMPONENT — app/(store)/produto/[slug]/page.tsx
// Server Component com generateMetadata() para SEO e Google Ads
// Garante que o robô do Google leia título, descrição e preço no HTML inicial
// =============================================================================

import { notFound } from "next/navigation"
import { createPublicClient } from "@/lib/supabase/public"
import { SITE } from "@/lib/site-config"
import { productSchema } from "@/lib/seo"
import { ProductPageClient } from "./ProductPageClient"

export const revalidate = 3600
export const dynamicParams = true

// ─── Tipos ────────────────────────────────────────────────────────────
type Review = {
  id: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
  approved: boolean
}

// ─── Função de busca de produto no servidor ──────────────────────────
export async function generateStaticParams() {
  const { createPublicClient } = await import('@/lib/supabase/public')
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('active', true)
    .order('name')
    .limit(200)
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

async function getProduct(slug: string) {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}

// ─── Gera metadados SEO no servidor ──────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Produto não encontrado | Discibra Distribuidora",
      description: "O produto solicitado não foi encontrado em nosso catálogo.",
    }
  }

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[]
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return {
    title: product.name,
    description: product.description || `${product.name} — ${SITE.shortName}. Compre com preço de atacado e entrega ágil.`,
    keywords: [product.name, product.categories?.name, "materiais de construção", "preço de atacado"],
    images: allImages.length > 0 ? allImages : undefined,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} — ${SITE.shortName}. Compre com preço de atacado e entrega ágil.`,
      images: allImages.length > 0 ? allImages : undefined,
      type: "article" as const,
      url: `${SITE.siteUrl}/produto/${product.slug}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: product.name,
      description: product.description || `${product.name} — ${SITE.shortName}`,
      images: allImages.length > 0 ? allImages : undefined,
    },
    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": "BRL",
      "product:availability": product.stock > 0 ? "in stock" : "out of stock",
      ...(discount > 0 ? { "product:savings:percent": discount.toString() } : {}),
    },
  }
}

// ─── Parâmetros dinâmicos (revalidação) ─────────────────────
// Nota: generateStaticParams removido para evitar problemas de contexto de cookies.
// Os slugs são gerados dinamicamente pelo Next.js on-demand.

// ─── Server Component principal ──────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[]
  const schema = productSchema(
    product.name,
    product.description || `${product.name} — Discibra`,
    Number(product.price),
    product.sku || product.slug,
    allImages[0] || `${SITE.siteUrl}/brand/icon-512.png`,
    product.stock > 0 ? "InStock" : "OutOfStock",
    product.avg_rating,
    product.review_count
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ProductPageClient product={product} />
    </>
  )
}
