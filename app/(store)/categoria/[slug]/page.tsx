import type { Metadata } from "next"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

/**
 * Slugs reais verificados na tabela `categories` do Supabase:
 *   cimentos, argamassas, rejuntes, impermeabilizantes, areia-e-pedra,
 *   cal-e-gesso, aco-e-ferragens, tijolos-e-blocos, telhas-e-coberturas,
 *   materiais-hidraulicos, tintas-e-pintura, madeiras-e-esquadrias,
 *   ferramentas-e-epis (ativo), ferramentas (inativo), ...
 *
 * A URL paga chega em geral como /categoria/ferramentas-e-epis. Para cobrir
 * variações antigas de tráfego (ferramentas-epis, ferramentas), resolvemos o
 * slug recebido para o slug canônico ativo antes de consultar produtos.
 */
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
  const slugCanonico = cat?.slug ?? (slug || "").toLowerCase().trim()

  return {
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
  searchParams: Promise<{ page?: string }>
}>) {
  const { slug } = await params
  const { page = "1" } = await searchParams
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

  const { data: products, count, error } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("category_id", cat.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
      <Link
        href="/produtos"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar ao catálogo
      </Link>

      <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-app sm:rounded-3xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 md:p-8">
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
        </div>
      </div>

      {(products || []).length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {(products || []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-muted-foreground">
          Nenhum produto nesta categoria.
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav aria-label="Paginacao da categoria" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
          {currentPage > 1 && (
            <Link
              href={`/categoria/${cat.slug}?page=1`}
              className="h-10 px-3 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 sm:inline-flex"
            >
              Primeira
            </Link>
          )}
          <Link
            href={`/categoria/${cat.slug}?page=${Math.max(1, currentPage - 1)}`}
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
              href={`/categoria/${cat.slug}?page=${p}`}
              aria-current={p === currentPage ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-sm font-bold transition ${
                p === currentPage
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </Link>
          ))}
          <Link
            href={`/categoria/${cat.slug}?page=${Math.min(Math.ceil(total / PAGE_SIZE), currentPage + 1)}`}
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
