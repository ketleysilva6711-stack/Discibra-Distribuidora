"use client"

import { use } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, LayoutGrid } from "lucide-react"

const supabase = createClient()

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const { data, isLoading } = useSWR(`category-${slug}`, async () => {
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).single()
    if (!cat) return null
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", cat.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
    return { category: cat, products: products || [] }
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Categoria não encontrada.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary">
          Voltar ao início
        </Link>
      </div>
    )
  }

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
            {data.category.image_url ? (
              <Image
                src={data.category.image_url.trim()}
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
              {data.category.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
              {data.products.length} {data.products.length === 1 ? "produto" : "produtos"} disponíveis
            </p>
          </div>
        </div>
      </div>

      {data.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-muted-foreground">
          Nenhum produto nesta categoria.
        </div>
      )}
    </div>
  )
}
