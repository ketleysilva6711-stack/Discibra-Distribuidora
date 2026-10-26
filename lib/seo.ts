// =============================================================================
// SEO UTILITY — DISTRIBUIDORA DE CIMENTO (REWRITTEN)
// =============================================================================
// Funções para gerar metadados SEO otimizados, structured data, e Open Graph
// =============================================================================

import { SITE } from "./site-config"

// Base keywords para a distribuidora
const BASE_KEYWORDS = [
  "material de construção",
  "cimento",
  "argamassa",
  "tijolos",
  "pisos",
  "hidráulica",
  "telhas",
  "ferramentas",
  "aço",
  "madeiras",
  "adesivos",
  "tintas",
  "atacado construção",
  "materiais construção Ribeirão Preto",
  "distribuidora cimento",
  "construtora",
  "obra civil",
  "construção civil",
]

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.discibradistribuidora.com"

/**
 * Gera URL canonical para uma página
 */
export function canonicalUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${cleanPath}`
}

/**
 * Gera a URL completa de imagem para Open Graph
 */
export function ogImageUrl(path: string): string {
  return `${BASE_URL}${path}`
}

/**
 * Gera keywords combinadas para SEO
 */
export function getKeywords(extra: string[] = []): string {
  return [...BASE_KEYWORDS, ...extra].join(", ")
}

/**
 * Gera metadados completos para SEO
 */
export function generateSEO(config: {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  type?: "website" | "product" | "article" | "localbusiness" | "organization"
}): Record<string, string | undefined> {
  const title = `${config.title} | ${SITE.shortName}`
  const description = config.description || SITE.tagline
  const keywords = getKeywords(config.keywords || [])
  const image = config.image || ogImageUrl("/og-default.png")

  return {
    title,
    description,
    keywords,
  }
}

/**
 * Gera JSON-LD para LocalBusiness (para Google Business Profile / Maps)
 */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.legalName,
    description: SITE.tagline,
    url: BASE_URL,
    telephone: `+55${SITE.whatsappE164}`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      postalCode: SITE.address.zip,
      addressCountry: "BR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "07:00",
        closes: "12:00",
      },
    ],
    image: ogImageUrl("/og-default.png"),
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-21.1767",
      longitude: "-47.8110",
    },
    sameAs: [
      BASE_URL,
      `https://wa.me/${SITE.whatsappE164}`,
    ],
    paymentAccepted: "PIX, Dinheiro, Cartão de Crédito",
    priceRange: "R$",
    containsAction: {
      "@type": "FindAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/busca?q={search_term_string}`,
      },
    },
  }
}

/**
 * Gera JSON-LD para Product (para produtos individuais no Google Shopping)
 */
export function productSchema(
  name: string,
  description: string,
  price: number,
  sku: string,
  image: string,
  availability: string = "InStock",
  rating?: number,
  reviewCount?: number,
  brand?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku,
    image,
    brand: {
      "@type": "Brand",
      name: brand || SITE.shortName,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl(`/produto/${sku.toLowerCase()}`),
      priceCurrency: "BRL",
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      seller: {
        "@type": "Organization",
        name: SITE.legalName,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "BRL",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BR",
        },
      },
    },
    ...(rating && reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.toString(),
            reviewCount: reviewCount.toString(),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  }
}

/**
 * Gera JSON-LD para Organization (para a empresa em geral)
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    description: SITE.tagline,
    url: BASE_URL,
    logo: ogImageUrl("/og-default.png"),
    telephone: `+55${SITE.whatsappE164}`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      postalCode: SITE.address.zip,
      addressCountry: "BR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+55${SITE.whatsappE164}`,
      contactType: "sales",
      availableLanguage: ["pt-BR"],
      areaServed: "BR",
    },
    sameAs: [
      BASE_URL,
      `https://wa.me/${SITE.whatsappE164}`,
      `https://www.facebook.com/${SITE.shortName.toLowerCase()}`,
      `https://www.instagram.com/${SITE.shortName.toLowerCase()}`,
      `https://www.linkedin.com/company/${SITE.shortName.toLowerCase()}`,
    ],
  }
}

/**
 * Gera JSON-LD para FAQPage (para FAQ page)
 */
export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

/**
 * Gera Open Graph meta tags como string
 */
export function ogTags(
  title: string,
  description: string,
  image: string,
  url: string,
  type: string = "website"
): string {
  return `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="${SITE.legalName}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  `
}

/**
 * Gera Twitter Card meta tags
 */
export function twitterTags(
  title: string,
  description: string,
  image: string
): string {
  return `
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@${SITE.shortName.toLowerCase()}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:creator" content="@${SITE.shortName.toLowerCase()}" />
    <meta name="twitter:app:name:pt" content="${SITE.shortName}" />
    <meta name="twitter:app:id:pt" content="${SITE.shortName}" />
  `
}
