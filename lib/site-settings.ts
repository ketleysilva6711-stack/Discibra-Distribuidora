export const SITE_SETTINGS_ROW_ID = "default" as const

export type CmsBannerSlide = {
  image_url: string
  link?: string | null
  title?: string | null
  subtitle?: string | null
}

export type CmsTestimonial = {
  name: string
  text: string
  /** 1–5, default 5 */
  rating?: number
  role?: string | null
}

export type SiteSettingsRow = {
  id: string
  logo_url: string | null
  favicon_url: string | null
  chat_header_url: string | null
  banner_images: CmsBannerSlide[] | unknown
  institutional_title: string | null
  institutional_body: string | null
  testimonials: CmsTestimonial[] | unknown
  updated_at?: string

  // Google Marketing & SEO
  gtm_id: string | null
  ga4_id: string | null
  google_site_verification: string | null
  google_ads_id: string | null
  google_ads_conversion_label: string | null

  // Google Meu Negócio & SEO Local
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_hours: string | null
  business_maps_url: string | null
}

export const DEFAULT_INSTITUTIONAL_TITLE = "Referência em materiais de construção"

export const DEFAULT_INSTITUTIONAL_BODY =
  "A empresa é referência no setor de materiais de construção, oferecendo qualidade, segurança e entrega garantida. Nosso compromisso é com obras seguras, clientes satisfeitos e fornecimento contínuo para construção civil."

/** Mínimo 11 depoimentos estruturados (fallback quando testimonials no banco está vazio). */
export const DEFAULT_TESTIMONIALS: CmsTestimonial[] = [
  {
    name: "Carlos M., construtora",
    role: "Obra residencial",
    rating: 5,
    text: "Compra segura e nota fiscal em dia. O cimento chegou lacrado e dentro do prazo — fundamental para passar na fiscalização.",
  },
  {
    name: "Renata S., lojista",
    role: "Revenda",
    rating: 5,
    text: "Preço competitivo e fornecimento contínuo. Conseguimos repor estoque rápido e não paramos a loja na alta temporada.",
  },
  {
    name: "Paulo A., mestre de obras",
    role: "Obra comercial",
    rating: 5,
    text: "Material com procedência e qualidade visível. Menos retrabalho e mais confiança da equipe no canteiro.",
  },
  {
    name: "Fernanda L., engenheira",
    role: "Gerenciamento de obra",
    rating: 5,
    text: "Empresa forte no setor: atendimento técnico, agilidade na logística e respeito aos prazos do cronograma.",
  },
  {
    name: "Marcos V., autônomo",
    role: "Reforma",
    rating: 5,
    text: "Entrega rápida na região. Pedi na segunda e usei na obra na quarta — salvou meu prazo com o cliente.",
  },
  {
    name: "Juliana T., incorporadora",
    rating: 5,
    text: "Parceria de confiança para grandes volumes. Transparência no pedido e rastreio até a entrega na obra.",
  },
  {
    name: "Roberto K., depósito",
    role: "Atacado",
    rating: 5,
    text: "Mix completo de construção civil e preço de atacado que fecha com a concorrência. Recomendo para revenda.",
  },
  {
    name: "Amanda R., arquiteta",
    rating: 5,
    text: "Profissionalismo do time comercial e suporte na escolha de argamassas e impermeabilizantes — credibilidade de verdade.",
  },
  {
    name: "Eduardo P., pedreiro",
    role: "Equipe de obra",
    rating: 5,
    text: "Qualidade do material faz diferença no acabamento. Areia e brita padronizadas, sem surpresa na mistura.",
  },
  {
    name: "Patrícia N., compras",
    role: "Indústria",
    rating: 5,
    text: "Segurança na cadeia de fornecimento: documentação correta e fornecedor sólido para compras recorrentes.",
  },
  {
    name: "Lucas H., síndico",
    role: "Condomínio",
    rating: 5,
    text: "Confiança para reformas do prédio: entrega organizada, motorista educado e material conforme especificação.",
  },
]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export function parseBannerImages(raw: unknown): CmsBannerSlide[] {
  if (!Array.isArray(raw)) return []
  const out: CmsBannerSlide[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const url = typeof item.image_url === "string" ? item.image_url.trim() : ""
    if (!url) continue
    out.push({
      image_url: url,
      link: typeof item.link === "string" ? item.link : item.link === null ? null : undefined,
      title: typeof item.title === "string" ? item.title : item.title === null ? null : undefined,
      subtitle: typeof item.subtitle === "string" ? item.subtitle : item.subtitle === null ? null : undefined,
    })
  }
  return out
}

export function parseTestimonials(raw: unknown): CmsTestimonial[] {
  if (!Array.isArray(raw)) return []
  const out: CmsTestimonial[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const name = typeof item.name === "string" ? item.name.trim() : ""
    const text = typeof item.text === "string" ? item.text.trim() : ""
    if (!name || !text) continue
    let rating = typeof item.rating === "number" ? Math.round(item.rating) : 5
    if (rating < 1) rating = 1
    if (rating > 5) rating = 5
    out.push({
      name,
      text,
      rating,
      role: typeof item.role === "string" ? item.role : item.role === null ? null : undefined,
    })
  }
  return out
}

export function resolveInstitutionalTitle(row: SiteSettingsRow | null): string {
  const t = row?.institutional_title?.trim()
  return t || DEFAULT_INSTITUTIONAL_TITLE
}

export function resolveInstitutionalBody(row: SiteSettingsRow | null): string {
  const t = row?.institutional_body?.trim()
  return t || DEFAULT_INSTITUTIONAL_BODY
}

export function resolveTestimonials(row: SiteSettingsRow | null): CmsTestimonial[] {
  const parsed = parseTestimonials(row?.testimonials)
  if (parsed.length > 0) return parsed
  return DEFAULT_TESTIMONIALS
}

/** Hero: se houver slides no CMS, usa só eles; senão o front busca a tabela `banners`. */
export function cmsBannerSlides(row: SiteSettingsRow | null): CmsBannerSlide[] {
  return parseBannerImages(row?.banner_images)
}

// ─── Defaults para Google Meu Negócio / SEO Local ─────────────────────────────
export const DEFAULT_BUSINESS_NAME = "Discibra Distribuidora"

export const DEFAULT_BUSINESS_ADDRESS =
  "Rua Igarapava, 73 - Vila Albertina, Ribeirão Preto - SP, CEP 14.075-453"

export const DEFAULT_BUSINESS_PHONE = "(16) 99644-7972"

export const DEFAULT_BUSINESS_HOURS = "Segunda a Sexta: 07:00 - 18:00 | Sábado: 07:00 - 12:00"

export const DEFAULT_BUSINESS_MAPS_URL =
  "https://maps.google.com/?q=Cimento+Cal+Distribuidora+Ribeirao+Preto"

export function resolveBusinessName(row: SiteSettingsRow | null): string {
  const v = row?.business_name?.trim()
  return v || DEFAULT_BUSINESS_NAME
}

export function resolveBusinessAddress(row: SiteSettingsRow | null): string {
  const v = row?.business_address?.trim()
  return v || DEFAULT_BUSINESS_ADDRESS
}

export function resolveBusinessPhone(row: SiteSettingsRow | null): string {
  const v = row?.business_phone?.trim()
  return v || DEFAULT_BUSINESS_PHONE
}

export function resolveBusinessHours(row: SiteSettingsRow | null): string {
  const v = row?.business_hours?.trim()
  return v || DEFAULT_BUSINESS_HOURS
}

export function resolveBusinessMapsUrl(row: SiteSettingsRow | null): string {
  const v = row?.business_maps_url?.trim()
  return v || DEFAULT_BUSINESS_MAPS_URL
}
