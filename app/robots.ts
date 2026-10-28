// =============================================================================
// ROBOTS.TXT — DISTRIBUIDORA DE CIMENTO
// =============================================================================
import type { MetadataRoute } from "next"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.discibradistribuidora.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/api/auth/",
          "/_next/",
          "/_vercel/",
          "/private/",
          "/dashboard/",
          "/auth/",
          "/login",
          "/cadastro",
          "/carrinho/checkout",
          "/minha-conta",
          "/pagamento",
          "/*.xml?$",
          "/*.pdf$",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/storage/"],
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
