// =============================================================================
// SITEMAP XML — DISTRIBUIDORA DE CIMENTO
// Busca produtos e categorias dinamicamente do Supabase
// =============================================================================
import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.discibradistribuidora.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.discibradistribuidora.com"

  // Buscar slugs de produtos ativos
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("slug")
    .eq("active", true)

  // Buscar slugs de categorias ativas
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("active", true)

  const productRoutes = (products || []).map((p: { slug: string }) => ({
    url: `${baseUrl}/produto/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const categoryRoutes = (categories || []).map((c: { slug: string }) => ({
    url: `${baseUrl}/categoria/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produtos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categoryRoutes,
    {
      url: `${baseUrl}/promocoes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/carrinho`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/busca`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...productRoutes,
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/fale-conosco`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/calculadora`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cadastro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  return pages
}
