import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HeroBannerDesktop } from "@/components/store/hero-banner-client"

// 3 banners da campanha - imagens móveis 4:3 (1920x430)
// Mobile mostra apenas estes, independente do CMS
const CAMPAIGN_BANNERS = [
  {
    id: "fb-promo-verao",
    image_url: "/banners/mobile/banner-02-solucoes-verao.webp",
    link_url: "/promocoes",
    title: "Solucoes para o Verao",
    subtitle: "Precos especiais para voce",
  },
  {
    id: "fb-promo-telhas",
    image_url: "/banners/mobile/banner-03-telhas-coberturas.webp",
    link_url: "/categoria/telhas-e-coberturas",
    title: "Telhas a partir de R$ 47,90",
    subtitle: "Compre hoje, receba amanha",
  },
  {
    id: "fb-promo-impermeabilizantes",
    image_url: "/banners/mobile/banner-04-impermeabilizantes-viaplus.webp",
    link_url: "/categoria/impermeabilizantes",
    title: "Impermeabilizantes a partir de R$ 53,90",
    subtitle: "Viapol Bianco Vedacit",
  },
]

async function fetchCmsBanners() {
  const supabase = await createClient()
  // Coluna de link se chama "link" (não "link_url") na tabela banners
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
    link_url: b.link ?? null,
    title: b.title ?? null,
    subtitle: b.subtitle ?? null,
  }))
}

export async function HeroBanner() {
  const cmsBanners = await fetchCmsBanners()

  // Fallback: se o CMS nao retornou banners, usa os 3 de campanha
  const slides = cmsBanners.length > 0 ? cmsBanners : CAMPAIGN_BANNERS
  if (slides.length === 0) return null

  // =========================================================================
  // MOBILE (<=768px): 3 banners de campanha (4:3), sem corte: w-full h-auto
  // Sempre renderiza — nao depende do CMS.
  // =========================================================================
  const mobileHero = (
    <section className="block md:hidden relative w-full" aria-label="Ofertas da campanha">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 [scrollbar-width:none]">
          {slides.slice(0, 3).map((banner, i) => (
            <a key={banner.id} href={banner.link_url || "/"} className="relative flex-none w-full snap-center">
              <Image
                src={banner.image_url}
                alt={banner.title || `Banner ${i + 1}`}
                width={1920}
                height={430}
                sizes="100vw"
                priority={i === 0}
                className="w-full h-auto block"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8590C]/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {banner.title}
                </span>
                <p className="mt-1 text-sm sm:text-base font-bold text-white leading-tight">{banner.subtitle}</p>
              </div>
              <Link href={banner.link_url || "/"} className="absolute inset-0 z-10">
                <span className="sr-only">Ver detalhes</span>
              </Link>
            </a>
          ))}
        </div>
      </div>
    </section>
  )

  // =========================================================================
  // DESKTOP (>=769px): carrossel institucional com banners do CMS (Supabase)
  // =========================================================================
  const desktopHero = slides.length > 0 ? (
    <HeroBannerDesktop banners={slides} />
  ) : null

  return (
    <>
      {mobileHero}
      {desktopHero}
    </>
  )
}
