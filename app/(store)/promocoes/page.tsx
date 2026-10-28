// =============================================================================
// SERVER COMPONENT — app/(store)/promocoes/page.tsx
// Vitrine de promoções com SSR — indexável e instantâneo.
// =============================================================================

export const revalidate = 300

import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function PromocoesPage() {
  let products: any[] = []
  try {
    const supabase = await createClient()
    // Query segura com colunas padrão da tabela products
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, image_url, active")
      .eq("active", true)
      .limit(48)
    if (!error && data) {
      products = data
    }
  } catch (err) {
    console.error("Erro ao buscar produtos de promocoes:", err)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#111318]">
          Ofertas e Promoções
        </h1>
        <p className="text-sm text-[#6B7280]">
          Materiais com os melhores preços direto da fábrica para sua obra.
        </p>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-12 border border-[#E5E5E3] rounded-[4px] p-8">
          <p className="text-sm text-[#6B7280] mb-4">
            Novas ofertas sendo atualizadas no estoque.
          </p>
          <Link
            href="/produtos"
            className="inline-block px-4 py-2 bg-[#111318] text-white text-xs font-semibold rounded-[4px]"
          >
            Ver Catálogo Geral
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  )
}
