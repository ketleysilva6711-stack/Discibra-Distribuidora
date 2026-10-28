import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HeroBannerDesktop } from "@/components/store/hero-banner-client"

// 3 banners da campanha - imagens móveis 4:3 (1920x430)
// Mobile mostra apenas estes, independente do CMS
const CAMPAIGN_BANNERS = [
  {
    key: "promo-verao",
    image_url: "/banners/mobile/banner-02-solucoes-verao.webp",
    link: "/promocoes",
    title: "Solucoes para o Verao",
    subtitle: "Precos especiais para voce",
  },
  {
    key: "promo-telhas",
    image_url: "/banners/mobile/banner-03-telhas-coberturas.webp",
    link: "/categoria/telhas-e-coberturas",
    title: "Telhas a partir de R$ 47,90",
    subtitle: "Compre hoje, receba amanha",
  },
  {
    key: "promo-impermeabilizantes",
    image_url: "/banners/mobile/banner-04-impermeabilizantes-viaplus.webp",
    link: "/categoria/impermeabilizantes",
    title: "Impermeabilizantes a partir de R$ 53,90",
    subtitle: "Viapol Bianco Vedacit",
  },
]

async function fetchCmsBanners() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("banners")
    .select("id, image_url, link_url, title, subtitle, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
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

  // =========================================================================
  // MOBILE (<=768px): 3 banners de campanha (4:3), sem corte: w-full h-auto
  // Sempre renderiza — nao depende do CMS.
  // =========================================================================
  const mobileHero = (
    <section className="block md:hidden relative w-full" aria-label="Ofertas da campanha">
      <div className="relative w-full overflow-hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 [scrollbar-width:none]">
          {CAMPAIGN_BANNERS.map((banner, i) => (
            <a key={banner.key} href={banner.link} className="relative flex-none w-full snap-center">
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
              <Link href={banner.link} className="absolute inset-0 z-10">
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
  const desktopHero = cmsBanners.length > 0 ? (
    <HeroBannerDesktop banners={cmsBanners} />
  ) : null

  return (
    <>
      {mobileHero}
      {desktopHero}
    </>
  )
}
