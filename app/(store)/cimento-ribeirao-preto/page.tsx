// =============================================================================
// SERVER COMPONENT — app/(store)/cimento-ribeirao-preto/page.tsx
// Landing Page de Alta Conversão para Cimento — Google Ads Ribeirão Preto
// =============================================================================

export const revalidate = 300

import { createPublicClient } from "@/lib/supabase/public"
import { SITE, waLink } from "@/lib/site-config"
import Link from "next/link"
import { Truck, ShieldCheck, Zap, Package, FileCheck } from "lucide-react"
import PalletPriceTable from "@/components/store/pallet-price-table"
import CepFreightCalculator from "@/components/store/cep-freight-calculator"
import { cn } from "@/lib/utils"

const CAT_CIMENTO = "c0134152-de0a-42f7-bb87-dd9ec8588983"

const PROD_FIELDS =
  "id, name, slug, price, original_price, image_url, unit, stock, category_id, sku, featured, is_new, is_discount"

async function fetchCimentos() {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("products")
    .select(PROD_FIELDS)
    .eq("active", true)
    .eq("category_id", CAT_CIMENTO)
    .not("image_url", "is", null)
    .order("price", { ascending: true })
    .limit(8)

  if (error || !data) return []
  return data
}

export const metadata = {
  title: "Cimento no Atacado em Ribeirão Preto | Direto da Fábrica | Discibra",
  description:
    "Cimento 50kg CP-II e CP-V com preço de atacado para pessoa física em Ribeirão Preto e Região. Palete fechado e carga com entrega rápida. Sem burocracia de CNPJ.",
  openGraph: {
    title: "Cimento no Atacado em Ribeirão Preto | Direto da Fábrica | Discibra",
    description:
      "Cimento 50kg CP-II e CP-V com preço de atacado para pessoa física em Ribeirão Preto e Região. Palete fechado e carga com entrega rápida. Sem burocracia de CNPJ.",
    type: "website" as const,
    url: `${SITE.siteUrl}/cimento-ribeirao-preto`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Cimento no Atacado em Ribeirão Preto | Direto da Fábrica | Discibra",
    description:
      "Cimento 50kg CP-II e CP-V com preço de atacado para pessoa física em Ribeirão Preto e Região.",
  },
}

export default async function CimentoRibearaoPretoPage() {
  const cimentos = await fetchCimentos()

  return (
    <div className="relative pb-20 sm:pb-32 bg-mesh">
      {/* ── META JSON-LD LocalBusiness ── */}
      <script
        id="local-business-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: SITE.legalName,
            description: "Distribuidora de cimento e materiais de construção em Ribeirão Preto e Região",
            url: `${SITE.siteUrl}/cimento-ribeirao-preto`,
            telephone: `+55${SITE.whatsappE164}`,
            address: {
              "@type": "PostalAddress",
              streetAddress: SITE.address.street,
              addressLocality: "Ribeirão Preto",
              addressRegion: "SP",
              postalCode: "14075-453",
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
            geo: {
              "@type": "GeoCoordinates",
              latitude: "-21.1767",
              longitude: "-47.8110",
            },
          }),
        }}
      />

      {/* ── HERO FOCO CIMENTO ── */}
      <section className="relative overflow-hidden bg-[#002D5B] py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/3 translate-x-1/4 rounded-full bg-[#C2410C]/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F47920]/30 bg-[#F47920]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#F47920]">
            <FileCheck className="h-3 w-3" /> Distribuidora de Cimento · Ribeirão Preto e Região
          </span>

          <h1 className="mt-6 mb-6 text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.05]">
            Cimento Direto pra Sua Obra com Preço de Atacado
          </h1>

          <p className="mx-auto mt-0 max-w-2xl text-lg font-medium text-slate-200 leading-relaxed sm:text-xl">
            Atendemos pessoa física e pequenos construtores. Sem exigência de CNPJ.
            Pague no PIX com desconto ou parcele em até 12x no cartão.
          </p>

          {/* Selos de Garantia */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              {
                icon: FileCheck,
                label: "Sem Burocracia de CNPJ",
                desc: "Pessoa Física Bem-Vinda",
              },
              {
                icon: Zap,
                label: "PIX com Desconto",
                desc: "ou 12x no Cartão",
              },
              {
                icon: Truck,
                label: "Entrega Munck ou Paletizado",
                desc: "direto na obra",
              },
              {
                icon: ShieldCheck,
                label: "Cimento Fresco",
                desc: "com Laudo Técnico ABNT",
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-white">{item.label}</h4>
                <p className="text-[10px] font-medium text-white/50 leading-tight">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Botão Primário gigante WhatsApp */}
          <a
            href={waLink("Olá! Gostaria de solicitar uma cotação de cimento para minha obra em Ribeirão Preto. Quais preços e condições de entrega?")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="cimento_landing_hero"
            className={cn(
              "mt-12 sm:mt-16 inline-flex items-center justify-center gap-3 w-full sm:w-auto sm:min-w-[320px] h-14 sm:h-16 rounded-2xl",
              "bg-[#25D366] text-[#002D5B] text-base sm:text-lg font-black uppercase tracking-widest",
              "shadow-[0_20px_40px_-10px_rgba(37,211,102,0.6)]",
              "transition-all hover:bg-[#1EBE5B] hover:scale-[1.02] active:scale-95",
              "btn-whatsapp-track"
            )}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#002D5B]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Pedir Cotação de Cimento no WhatsApp
          </a>
        </div>
      </section>

      {/* ── GRID DE PRODUTOS (CIMENTOS) ── */}
      {cimentos.length > 0 && (
        <section className="py-14 sm:py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C2410C]">
                  Produtos de Cimento
                </span>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Cimento 50kg com Preço de Atacado
                </h2>
              </div>
              <Link
                href="/produtos?categoria=cimento"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#002D5B] hover:text-[#C2410C] transition-colors"
              >
                Ver todos os cimentos
                <span className="h-3 w-3 text-[#C2410C]">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {cimentos.map((p: any) => {
                const discount =
                  p.original_price && Number(p.original_price) > Number(p.price)
                    ? Math.round(
                        ((Number(p.original_price) - Number(p.price)) /
                          Number(p.original_price)) *
                          100
                      )
                    : 0
                return (
                  <div
                    key={p.id}
                    className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-slate-50">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {discount > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#F47920] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 min-h-[3rem] text-sm font-bold leading-snug text-slate-800">
                      {p.name}
                    </h3>
                    {p.sku && (
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        Cód. {p.sku}
                      </p>
                    )}
                    <div className="mt-auto">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">
                        Preço de atacado
                      </p>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-xs font-bold text-slate-500">R$</span>
                        <p className="text-[20px] font-extrabold text-[#C2410C] tracking-tight leading-none">
                          {Number(p.price).toFixed(2).replace(".", ",")}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-end">
                          /{p.unit}
                        </span>
                      </div>
                    </div>
                    <a
                      href={waLink(
                        `Olá! Tenho interesse no cimento: ${p.name} (R$ ${Number(p.price).toFixed(2).replace(".", ",")}/${p.unit}). Qual o preço para palete e carga?`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="btn_whatsapp"
                      data-button-name="btn_whatsapp"
                      data-source="cimento_landing_product"
                      className={cn(
                        "flex w-full items-center justify-center gap-2 h-10 rounded-xl",
                        "bg-[#25D366] text-[#002D5B] text-xs font-black uppercase tracking-widest",
                        "transition-all hover:bg-[#1EBE5B] active:scale-95 shadow-sm shadow-[#25D366]/25",
                        "btn-whatsapp-track"
                      )}
                    >
                      <span className="text-[10px]">Pedir Orçamento</span>
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TABELA DE VOLUME & FRETE ── */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center sm:mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C2410C]/20 bg-[#C2410C]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#C2410C]">
              <Package className="h-3 w-3" /> Tabela de Preço por Volume
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Compre por Palete ou Carga e Economize
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 leading-relaxed sm:text-lg">
              Preços especiais para quem leva quantidade. Ideal para construtores e obras em Ribeirão Preto e Região.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <PalletPriceTable unitPrice={cimentos?.[0]?.price ?? 18} />
            </div>
            <div>
              <CepFreightCalculator
                productName="Cimento CP-II 50kg"
                productSku="cimento-cp2-50kg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOCO INSTITUCIONAL DE PROVA FÍSICA ── */}
      <section className="border-t border-slate-200 bg-[#002D5B] py-16 sm:py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-12 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F47920]/30 bg-[#F47920]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#F47920]">
                  <FileCheck className="h-3 w-3" /> Prova de Existência Física
                </span>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Conheça quem entrega na sua obra
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Distribuidora legalmente constituída com centro de distribuição próprio em Ribeirão Preto.
                  Atendimento direto, sem intermediários.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F47920]">
                    CNPJ
                  </p>
                  <p className="text-lg font-black text-white">59.566.414/0001-25</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F47920]">
                    Centro de Distribuição
                  </p>
                  <p className="text-lg font-black text-white">Ribeirão Preto — SP</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F47920]">
                    Telefone & WhatsApp
                  </p>
                  <p className="text-lg font-black text-white">{SITE.phoneDisplay}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F47920]">
                    Horário de Expedição
                  </p>
                  <p className="text-lg font-black text-white">
                    Seg a Sex 07h-18h | Sáb 07h-12h
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 sm:mt-12 flex items-center justify-between gap-4 sm:justify-end pt-6 sm:pt-8 border-t border-white/10">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${SITE.address.street}, ${SITE.address.district}, ${SITE.address.city}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold uppercase tracking-widest text-[#F47920] hover:text-white transition-colors"
              >
                Ver no Google Maps →
              </a>
              <a
                href={waLink("Olá! Gostaria de confirmar o endereço e horário de funcionamento da distribuidora em Ribeirão Preto.")}
                target="_blank"
                rel="noopener noreferrer"
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="cimento_landing_prova"
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#25D366] text-[#002D5B] text-xs font-black uppercase tracking-widest px-4 btn-whatsapp-track"
              >
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
