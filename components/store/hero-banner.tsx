import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HeroBannerClient } from "@/components/store/hero-banner-client"

// 3 banners da campanha - imagens móveis 4:3 (1920x430)
// Mobile mostra apenas estes, independente do CMS
const CAMPAIGN_BANNERS = [
  {
    id: "fb-promo-verao",
    image_url: "/banners/mobile/banner-02-solucoes-verao.webp",
    link: "/promocoes",
    title: "Solucoes para o Verao",
  },
  {
    id: "fb-promo-telhas",
    image_url: "/banners/mobile/banner-03-telhas-coberturas.webp",
    link: "/categoria/telhas-e-coberturas",
    title: "Telhas a partir de R$ 47,90",
  },
  {
    id: "fb-promo-impermeabilizantes",
    image_url: "/banners/mobile/banner-04-impermeabilizantes-viaplus.webp",
    link: "/categoria/impermeabilizantes",
    title: "Impermeabilizantes a partir de R$ 53,90",
  },
]

async function fetchCmsBanners() {
  const supabase = await createClient()
  // Coluna de link se chama "link" na tabela banners
  // Aceita active = true OU active IS NULL para nao excluir banners sem o campo preenchido
  const { data } = await supabase
    .from("banners")
    .select("id, image_url, link, title, subtitle, sort_order")
    .or("active.eq.true,active.is.null")
    .order("sort_order", { ascending: true })
    .limit(10)
  return (data || []).map((b: any) => ({
    id: b.id,
    image_url: b.image_url,
    link: b.link ?? null,
    title: b.title ?? null,
  }))
}

export async function HeroBanner() {
  const cmsBanners = await fetchCmsBanners()

  // Fallback: se o CMS nao retornou banners, usa os 3 de campanha
  const slides = cmsBanners.length > 0 ? cmsBanners : CAMPAIGN_BANNERS
  if (slides.length === 0) return null

  return <HeroBannerClient banners={slides} />
}
