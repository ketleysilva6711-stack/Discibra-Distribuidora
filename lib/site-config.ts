/** Dados da loja — marca Discibra Distribuidora */
export const SITE = {
  legalName: "Discibra Distribuidora",
  shortName: "Discibra",
  tagline: "Cimento e materiais de construção direto pra sua obra: preço de atacado, entrega programada e atendimento rápido.",
  whatsappE164: "5516996447972",
  phoneDisplay: "(16) 99644-7972",
  email: "contato@discibradistribuidora.com",
  website: "https://www.discibradistribuidora.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.discibradistribuidora.com",
  address: {
    street: "Rua Igarapava, 73",
    district: "Vila Albertina",
    city: "Ribeirão Preto - SP",
    zip: "CEP 14.075-453",
  },
} as const

export function waLink(text: string) {
  return `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(text)}`
}

export function imageUrl(path: string) {
  return `${SITE.siteUrl}/storage/v1/object/public/${path}`
}