// =============================================================================
// COMPONENTE DE SCHEMA.ORG — LocalBusiness / WholesaleStore JSON-LD
// Injeta dados estruturados do Google Meu Negócio no HTML do servidor
// =============================================================================

import Script from "next/script"

interface GoogleBusinessSchemaProps {
  businessName: string
  businessAddress?: string
  businessPhone?: string
  businessHours?: string
  businessMapsUrl?: string
}

/**
 * Componente Server que injeta JSON-LD de LocalBusiness / WholesaleStore
 * no <head> do layout. Isso garante que o Google leia os dados da empresa
 * no HTML inicial (SEO Local, Google Meu Negócio, Google Ads).
 */
export function GoogleBusinessSchema({
  businessName,
  businessAddress,
  businessPhone,
  businessHours,
  businessMapsUrl,
}: GoogleBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "WholesaleStore"],
    name: businessName,
    description: `${businessName} — Distribuidora de materiais de construção. Preço de atacado, entrega ágil e atendimento especializado para construtores, lojistas e profissionais da construção civil.`,
    ...(businessAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: businessAddress,
            addressCountry: "BR",
          },
        }
      : {}),
    ...(businessPhone
      ? {
          telephone: businessPhone.replace(/\D/g, "").startsWith("55")
            ? `+${businessPhone.replace(/\D/g, "")}`
            : `+55${businessPhone.replace(/\D/g, "")}`,
        }
      : {}),
    ...(businessHours
      ? {
          openingHoursSpecification: parseBusinessHours(businessHours),
        }
      : {}),
    ...(businessMapsUrl
      ? {
          sameAs: [businessMapsUrl],
          url: businessMapsUrl,
        }
      : {}),
    image: "https://www.discibradistribuidora.com/og-default.png",
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-21.1767",
      longitude: "-47.8110",
    },
    priceRange: "R$",
    paymentAccepted: "PIX, Dinheiro, Cartão de Crédito, Cartão de Débito, Transferência Bancária",
    areaServed: {
      "@type": "State",
      name: "SP",
    },
    containsPlace: [
      {
        "@type": "AdministrativeArea",
        name: "Ribeirão Preto",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Ribeirão Preto",
          addressRegion: "SP",
          addressCountry: "BR",
        },
      },
    ],
  }

  return (
    <Script
      id="google-business-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Parseia o horário de funcionamento em formato de string para
 * o schema.org OpeningHoursSpecification
 */
function parseBusinessHours(hours: string) {
  // Formato esperado: "Segunda a Sexta: 07:00 - 18:00 | Sábado: 07:00 - 12:00"
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const ptDays: Record<string, string[]> = {
    "Segunda": ["Monday"],
    "Terça": ["Tuesday"],
    "Quarta": ["Wednesday"],
    "Quinta": ["Thursday"],
    "Sexta": ["Friday"],
    "Sábado": ["Saturday"],
    "Domingo": ["Sunday"],
    "Segunda a Sexta": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "Segunda-Feira a Sexta-Feira": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  }

  // Fallback padrão
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "07:00",
      closes: "12:00",
    },
  ]
}

export default GoogleBusinessSchema
