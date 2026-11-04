import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { ArrowLeft, Search, PackageOpen } from "lucide-react"
import { rawTokens, canonicalCementSearch, matchesSearch, escapeLike } from "@/lib/search-normalize"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

export const dynamic = "force-static"
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
      .map((t) => `name.ilike.%${escapeLike(t)}%,slug.ilike.%${escapeLike(t)}%,sku.ilike.%${escapeLike(t)}%`)
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
            className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#002D5B] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-900"
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
              data-track="btn_whatsapp"
              data-source="busca_vazia"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[4px] bg-[#15803D] text-white font-black text-sm hover:bg-[#166534] transition-all active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
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
