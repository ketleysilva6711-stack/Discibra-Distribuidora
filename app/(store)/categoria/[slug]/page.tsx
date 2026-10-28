// =============================================================================
// SERVER COMPONENT — app/(store)/categoria/[slug]/page.tsx
// Página de categoria com ordenação SSR, breadcrumbs e contagem precisa.
// =============================================================================

import type { Metadata } from "next"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, LayoutGrid, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const SLUG_ALIASES: Record<string, string[]> = {
  "ferramentas-e-epis": ["ferramentas-epis", "ferramentas"],
  "ferramentas-epis": ["ferramentas-e-epis", "ferramentas"],
  "ferramentas": ["ferramentas-e-epis", "ferramentas-epis"],
}

function slugCandidates(slug: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (s: string) => {
    const key = (s || "").toLowerCase().trim()
    if (key && !seen.has(key)) {
      seen.add(key)
      out.push(key)
    }
  }
  add(slug)
  for (const alias of SLUG_ALIASES[(slug || "").toLowerCase().trim()] ?? []) {
    add(alias)
  }
  return out
}

export const revalidate = 300 // 5 min de cache edge/ISR

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const candidates = slugCandidates(slug)
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug")
    .in("slug", candidates)
    .eq("active", true)
    .order("sort_order")

  const cat = cats?.[0]

  if (!cat) {
    return {
      title: "Categoria não encontrada",
      description: "A categoria solicitada não existe em nosso catálogo.",
      alternates: {
        canonical: `https://www.discibradistribuidora.com/categoria/${(slug || "").toLowerCase().trim()}`,
      },
    }
  }

  const slugCanonico = cat.slug ?? (slug || "").toLowerCase().trim()

  return {
    title: `${cat.name} no Atacado e Varejo`,
    description: `Compre ${cat.name} com os melhores preços direto da fábrica. Entrega descarregada em Ribeirão Preto e região.`,
    openGraph: {
      title: `${cat.name} no Atacado e Varejo — Discibra Distribuidora`,
      description: `Compre ${cat.name} com os melhores preços direto da fábrica. Entrega descarregada em Ribeirão Preto e região.`,
      type: "website",
      siteName: "Discibra",
      url: `https://www.discibradistribuidora.com/categoria/${slugCanonico}`,
      images: [
        {
          url: "https://www.discibradistribuidora.com/og-default.png",
          width: 1200,
          height: 630,
          alt: `Discibra — ${cat.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.name} no Atacado e Varejo — Discibra Distribuidora`,
      description: `Compre ${cat.name} com os melhores preços direto da fábrica. Entrega descarregada em Ribeirão Preto e região.`,
    },
    alternates: {
      canonical: `https://www.discibradistribuidora.com/categoria/${slugCanonico}`,
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}>) {
  const { slug } = await params
  const { sort = "sort_order", page = "1" } = await searchParams
  const supabase = await createClient()

  // Resolve o slug por candidatos (exato + aliases), categoria ativa primeiro
  const candidates = slugCandidates(slug)
  const { data: cats } = await supabase
    .from("categories")
    .select("*")
    .in("slug", candidates)
    .eq("active", true)
    .order("sort_order")

  const cat = cats?.[0]
  if (!cat) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Categoria não encontrada.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary">
          Voltar ao início
        </Link>
      </div>
    )
  }

  const PAGE_SIZE = 36
  const currentPage = Math.max(1, parseInt(page, 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("category_id", cat.id)
    .eq("active", true)

  // Ordenação comercial B2B via query param ?sort=
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true })
      break
    case "price_desc":
      query = query.order("price", { ascending: false })
      break
    default:
      query = query.order("sort_order", { ascending: true }).order("created_at", {
        ascending: false,
      })
  }

  const { data: products, count, error } = await query.range(from, to)

  if (error) throw error

  const total = count ?? 0

  const sortLabel =
    sort === "price_asc"
      ? "Menor preço"
      : sort === "price_desc"
        ? "Maior preço"
        : "Mais recentes / destaques"

  const breadcrumbItems = [
    { name: "Início", url: "/" },
    { name: "Categorias", url: "/produtos" },
    { name: cat.name, url: `/categoria/${cat.slug}` },
  ]

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
      {/* JSON-LD BreadcrumbList para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbItems.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              item: `https://www.discibradistribuidora.com${item.url}`,
            })),
          }),
        }}
      />

      {/* Breadcrumb visual */}
      <nav className="mb-4 flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Início
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produtos" className="hover:text-primary transition-colors">
          Categorias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900 font-medium">{cat.name}</span>
      </nav>

      <Link
        href="/produtos"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar ao catálogo
      </Link>

      <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-app sm:rounded-3xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6 md:p-8">
          <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40 shadow-inner sm:mx-0 sm:h-28 sm:w-28 md:h-32 md:w-32">
            {cat.image_url ? (
              <Image
                src={cat.image_url.trim()}
                alt=""
                fill
                className="object-contain p-2"
                sizes="128px"
              />
            ) : (
              <LayoutGrid className="h-10 w-10 text-primary/30" />
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {cat.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
              {total} {total === 1 ? "produto" : "produtos"} disponíveis
            </p>
          </div>

          {/* Barra de ordenação B2B */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ordenar por:
            </label>
            <select
              defaultValue={sort}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set("sort", e.target.value)
                url.searchParams.set("page", "1")
                window.location.href = url.toString()
              }}
              className="bg-transparent outline-none border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              <option value="sort_order">Mais recentes / destaques</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>
        </div>
      </div>

      {(products || []).length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 md:gap-5">
          {(products || []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-4">
            Nenhum produto nesta categoria.
          </p>
          <Link
            href="/produtos"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#002D5B] px-8 text-sm font-bold text-white transition-all hover:scale-105"
          >
            Ver catálogo completo
          </Link>
          <a
            href={`https://wa.me/5516996447972?text=${encodeURIComponent(
              `Olá! Gostaria de uma cotação personalizada de produtos da categoria "${cat.name}".`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#F47920] px-8 text-sm font-bold text-white transition-all hover:scale-105"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="category_empty_whatsapp"
          >
            Solicitar cotação pelo WhatsApp
          </a>
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav aria-label="Paginacao da categoria" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
          {currentPage > 1 && (
            <Link
              href={`/categoria/${cat.slug}?page=1&sort=${sort}`}
              className="h-10 px-3 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 sm:inline-flex"
            >
              Primeira
            </Link>
          )}
          <Link
            href={`/categoria/${cat.slug}?page=${Math.max(1, currentPage - 1)}&sort=${sort}`}
            aria-label="Pagina anterior"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {Array.from(
            { length: Math.min(Math.ceil(total / PAGE_SIZE), 7) },
            (_, i) => i + 1,
          ).map((p) => (
            <Link
              key={p}
              href={`/categoria/${cat.slug}?page=${p}&sort=${sort}`}
              aria-current={p === currentPage ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-sm font-bold transition ${p === currentPage ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {p}
            </Link>
          ))}
          <Link
            href={`/categoria/${cat.slug}?page=${Math.min(Math.ceil(total / PAGE_SIZE), currentPage + 1)}&sort=${sort}`}
            aria-label="Proxima pagina"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      )}
    </div>
  )
}
