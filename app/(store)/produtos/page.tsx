import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { rawTokens, slugTokens, escapeLike } from "@/lib/search-normalize"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 36
export const revalidate = 300 // 5 min de cache edge/ISR

type Category = { id: string; name: string; slug: string }
type Product = {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  image_url: string | null
  unit: string
  stock: number
  category_id: string | null
  is_new?: boolean
  is_discount?: boolean
  featured?: boolean
  sku?: string | null
}

function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const window = new Set<number>([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages])
  const nums = [...window].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  let prev = 0
  for (const n of nums) {
    if (n - prev > 1) out.push("…")
    out.push(n)
    prev = n
  }
  return out
}

/**
 * Server Component do catálogo.
 * Os produtos são buscados no servidor, portanto o HTML inicial já vem com os
 * cards pré-renderizados (indexável pelo Google Ads bot e SSR-friendly).
 * Filtro (q) e categoria funcionam por query params (?q=&category=&page=).
 */
export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}>) {
  const { q = "", category = "all", page = "1" } = await searchParams
  const supabase = await createClient()

  const currentPage = Math.max(1, parseInt(page, 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Filtros de categoria (usados no aside)
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("active", true)
    .order("sort_order")

  // Busca de produtos no servidor (mesma lógica de tokens da versão cliente)
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, original_price, image_url, unit, stock, category_id, is_new, is_discount, featured, sku",
      { count: "exact" },
    )
    .eq("active", true)
    .not("image_url", "is", null)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (category !== "all") query = query.eq("category_id", category)

  if (q) {
    const rt = rawTokens(q).map(escapeLike)
    const st = slugTokens(q).map(escapeLike)
    const andName = rt.map((t) => `name.ilike.%${t}%`).join(",")
    const andSlugRaw = rt.map((t) => `slug.ilike.%${t}%`).join(",")
    const andSlugNorm = st.map((t) => `slug.ilike.%${t}%`).join(",")
    query = query.or(`and(${andName}),and(${andSlugRaw}),and(${andSlugNorm})`)
  }

  const { data, count, error } = await query.range(from, to)
  if (error) throw error

  const products = (data || []) as Product[]
  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pages = pageNumbers(safePage, totalPages)

  const qs = q ? `&q=${encodeURIComponent(q)}` : ""

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8 md:py-10">
      <Link href="/" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary sm:mb-6">
        <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar
      </Link>

      <div className="flex flex-col gap-6">
        {/* Barra de filtros em faixa horizontal (chips sutis, 1 linha scrollável no mobile) */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          <Link
            href={`/produtos${qs}`}
            className={`shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors ${category === "all" ? "bg-[#111318] text-white" : "bg-white text-[#111318] border border-[#E5E5E3] hover:bg-[#FAFAF9]"}`}
          >
            Todas
          </Link>
          {(categories || []).map((c) => (
            <Link
              key={c.id}
              href={`/produtos?category=${c.id}${qs}`}
              className={`shrink-0 truncate rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${category === c.id ? "bg-[#111318] text-white" : "bg-white text-[#111318] border border-[#E5E5E3] hover:bg-[#FAFAF9]"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">Catálogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {total.toLocaleString("pt-BR")} produtos disponíveis{totalPages > 1 ? ` – página ${safePage} de ${totalPages}` : ""}
        </p>
        <form method="get" className="relative mb-6 mt-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Filtrar por nome..."
            className="w-full px-3 py-2 border border-[#E5E5E3] rounded-[4px] text-xs focus:outline-none focus:border-[#111318] transition-colors"
            aria-label="Filtrar produtos por nome"
          />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100"
              aria-submit="filtrar"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>

          {products.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          )}

          {totalPages > 1 && (
            <nav aria-label="Paginação do catálogo" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
              {safePage > 1 && (
                <Link
                  href={`/produtos?page=1${qs}&category=${category === "all" ? "" : category}`}
                  className="h-10 px-3 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 sm:inline-flex"
                >
                  Primeira
                </Link>
              )}
              <Link
                href={`/produtos?page=${Math.max(1, safePage - 1)}${qs}&category=${category === "all" ? "" : category}`}
                aria-label="Página anterior"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              {pages.map((p, i) => {
                if (p === "…") {
                  return (
                    <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                      …
                    </span>
                  )
                }
                const href = `/produtos?page=${p}${qs}&category=${category === "all" ? "" : category}`
                return (
                  <Link
                    key={p}
                    href={href}
                    aria-current={p === safePage ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-sm font-bold transition",
                      p === safePage ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {p}
                  </Link>
                )
              })}
              <Link
                href={`/produtos?page=${Math.min(totalPages, safePage + 1)}${qs}&category=${category === "all" ? "" : category}`}
                aria-label="Próxima página"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/produtos?page=${totalPages}${qs}&category=${category === "all" ? "" : category}`}
                className="hidden h-10 px-3 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 disabled:opacity-40 sm:inline-flex"
              >
                Última
              </Link>
            </nav>
          )}
        </div>
      </div>
  )
}
