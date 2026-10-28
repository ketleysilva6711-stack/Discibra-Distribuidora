import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { ArrowLeft, Search, PackageOpen } from "lucide-react"
import { rawTokens, canonicalCementSearch, matchesSearch, escapeLike } from "@/lib/search-normalize"

export const revalidate = 60

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim() ?? ""
  return {
    title: query ? `Resultados para "${query}"` : "Buscar Materiais",
    description:
      query ||
      "Encontre produtos para construção e reforma no catálogo da Discibra.",
    openGraph: {
      title: query
        ? `Resultados para "${query}" — Discibra Distribuidora`
        : "Buscar Materiais — Discibra Distribuidora",
      description:
        query ||
        "Encontre produtos para construção e reforma no catálogo da Discibra.",
      type: "website",
      siteName: "Discibra",
      url: query
        ? `https://www.discibradistribuidora.com/busca?q=${encodeURIComponent(query)}`
        : "https://www.discibradistribuidora.com/busca",
    },
    twitter: {
      card: "summary_large_image",
      title: query
        ? `Resultados para "${query}" — Discibra Distribuidora`
        : "Buscar Materiais — Discibra Distribuidora",
      description:
        query ||
        "Encontre produtos para construção e reforma no catálogo da Discibra.",
    },
    alternates: {
      canonical: query
        ? `https://www.discibradistribuidora.com/busca?q=${encodeURIComponent(query)}`
        : "https://www.discibradistribuidora.com/busca",
    },
  }
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  if (!query) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-4 sm:py-10">
        <Link
          href="/"
          className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar para o Início
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#002D5B]/10 text-[#002D5B]">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Buscar no Catálogo
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Pesquise por cimentos, argamassas, telhas, ferramentas ou marcas
            </p>
          </div>
        </div>
        {/* Sugestões rápidas de categorias */}
        <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">
            Categorias em Destaque
          </h2>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/categoria/cimentos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-bold text-slate-700 hover:border-[#002D5B] hover:text-[#002D5B] transition-colors"
            >
              Cimentos no Atacado
            </Link>
            <Link
              href="/categoria/argamassas-e-rejuntes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-bold text-slate-700 hover:border-[#002D5B] hover:text-[#002D5B] transition-colors"
            >
              Argamassas e Rejuntes
            </Link>
            <Link
              href="/categoria/telhas-e-coberturas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-bold text-slate-700 hover:border-[#002D5B] hover:text-[#002D5B] transition-colors"
            >
              Telhas e Coberturas
            </Link>
            <Link
              href="/categoria/tubos-e-conexoes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-[#E5E5E3] bg-white text-xs font-bold text-slate-700 hover:border-[#002D5B] hover:text-[#002D5B] transition-colors"
            >
              Tubos e Conexões
            </Link>
            <Link
              href="/promocoes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-[#F47920] bg-orange-50 text-xs font-bold text-[#F47920] hover:bg-orange-100 transition-colors"
            >
              Ofertas da Semana
            </Link>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#111318] text-xs font-bold text-white hover:bg-black transition-colors"
            >
              Ver Todo o Catálogo →
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const supabase = await createClient()

  const tokens = rawTokens(query)

  let queryBuilder = supabase
    .from("products")
    .select(
      "id, name, slug, price, original_price, image_url, images, unit, stock, is_new, is_discount, featured"
    )
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
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-slate-500">Erro ao buscar produtos.</p>
      </main>
    )
  }

  const products = (data || []).filter((p: any) => matchesSearch(p, query))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-4 sm:py-10">
      <Link
        href="/"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> Voltar
      </Link>

      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#002D5B]/10 text-[#002D5B]">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Resultados para <span className="text-primary font-black">"{query}"</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {products.length} produto{products.length === 1 ? "" : "s"} encontrado{products.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Não encontramos resultados para "{query}". Verifique a ortografia ou tente pesquisar termos mais genéricos como "cimento", "ferro" ou "tinta".
          </p>
          <Link
            href="/produtos"
            className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#002D5B] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-900"
          >
            Ver catálogo completo
          </Link>
          <div className="mt-8 rounded-[4px] border border-[#25D366]/30 bg-[#f0fdf4] p-6 text-center">
            <p className="font-black text-slate-900 mb-1">Não encontrou o que procurava?</p>
            <p className="text-sm text-slate-500 mb-4">
              Nosso time pode te ajudar a encontrar exatamente o que precisa para sua obra.
            </p>
            <a
              href={`https://wa.me/5516996447972?text=${encodeURIComponent(`Olá! Procurei por "${query}" no site e não encontrei. Vocês têm este material?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[4px] bg-[#25D366] text-white font-black text-sm hover:bg-[#1fba58] transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Perguntar no WhatsApp
            </a>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </main>
  )
}
