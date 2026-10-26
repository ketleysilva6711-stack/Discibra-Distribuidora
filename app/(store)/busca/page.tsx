"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { ArrowLeft, Search, PackageOpen } from "lucide-react"
import { rawTokens, canonicalCementSearch, matchesSearch, escapeLike } from "@/lib/search-normalize"

const supabase = createClient()

async function searchProducts(query: string) {
  if (!query || query.trim().length === 0) return []

  const q = query.trim()
  const tokens = rawTokens(q)

  let queryBuilder = supabase
    .from("products")
    .select("id, name, slug, price, original_price, image_url, images, unit, stock, is_new, is_discount, featured")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(36)

  if (tokens.length > 0) {
    const orFilters = tokens
      .map((t) => `name.ilike.%${escapeLike(t)}%,slug.ilike.%${escapeLike(t)}%`)
      .join(",")
    queryBuilder = queryBuilder.or(orFilters)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error("Erro na busca:", error)
    return []
  }

  const products = (data || []).filter((p: any) => matchesSearch(p, q))
  return products
}

function SearchResults() {
  const searchParams = useSearchParams()
  const qRaw = searchParams.get("q") || ""
  const q = qRaw.trim()

  const { data: products, isLoading } = useSWR(
    q ? `search-products-${q}` : null,
    () => searchProducts(q),
    { revalidateOnFocus: false }
  )

  const results = products || []

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
      <Link
        href="/"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar
      </Link>
      
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {q ? (
              <>
                Resultados para <span className="text-primary font-black">"{q}"</span>
              </>
            ) : (
              "Buscar produtos"
            )}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isLoading
              ? "Buscando materiais no estoque..."
              : q
              ? `${results.length} produto${results.length === 1 ? "" : "s"} encontrado${results.length === 1 ? "" : "s"}`
              : "Digite o nome do produto ou marca para pesquisar"}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
          ))}
        </div>
      )}

      {!isLoading && q && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Não encontramos resultados para "{q}". Verifique a ortografia ou tente pesquisar termos mais genéricos como "cimento", "ferro" ou "tinta".
          </p>
          <Link
            href="/produtos"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-primary/90"
          >
            Ver catálogo completo
          </Link>
          <div className="mt-8 rounded-2xl border border-[#25D366]/30 bg-[#f0fdf4] p-6 text-center">
            <p className="font-black text-slate-900 mb-1">Não encontrou o que procurava?</p>
            <p className="text-sm text-slate-500 mb-4">Nosso time pode te ajudar a encontrar exatamente o que precisa para sua obra.</p>
            <a
              href={`https://wa.me/5516996447972?text=${encodeURIComponent(`Olá! Procurei por "${q}" no site e não encontrei. Vocês têm este material?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-black text-sm hover:bg-[#1fba58] transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Perguntar no WhatsApp
            </a>
          </div>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] p-8 text-center text-sm text-slate-400">Carregando busca...</div>}>
      <SearchResults />
    </Suspense>
  )
}
