import type { Metadata } from "next"
import Link from "next/link"
import { waLink, SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Distribuidora de Cimento no Atacado — Direto da Fábrica | Saco 50kg, Palete e Carga Fechada",
  description:
    "Distribuidora de cimento no atacado: saco de cimento 50kg Votoran, Cauê, Montes Claros, CSN e Mauá. Palete com 40 sacos e carga fechada com descarga. Cotação em 1 toque no WhatsApp. Entrega em SP e Triângulo Mineiro.",
  keywords: [
    "distribuidora de cimento",
    "saco de cimento 50kg",
    "cimento no atacado",
    "cimento palete",
    "carga fechada cimento",
    "votoran atacado",
    "caue atacado",
    "cimento ribeirão preto",
  ],
  openGraph: {
    title: "Distribuidora de Cimento no Atacado — Direto da Fábrica",
    description:
      "Saco 50kg, palete e carga fechada com descarga inclusa. Votoran, Cauê, Montes Claros, CSN e Mauá. Cotação imediata no WhatsApp.",
    type: "website",
    url: `${SITE.siteUrl}/cimento`,
  },
  alternates: { canonical: `${SITE.siteUrl}/cimento` },
}

const WHATSAPP_MAIN =
  "Olá! Gostaria de fazer uma cotação de cimento no atacado direto da fábrica."

type Offer = {
  name: string
  spec: string
  weight: string
  cargaFechada: string
  palete: string
  paletePromo: string
  economia: string
  tag?: string
  use: string
  searchSlug: string
}

const OFFERS: Offer[] = [
  {
    name: "Votoran Todas as Obras CP II-F-32",
    spec: "Uso geral — reboco, contrapiso, fundações leves",
    weight: "50kg",
    cargaFechada: "R$ 34,90",
    palete: "R$ 36,90",
    paletePromo: "R$ 26,90",
    economia: "R$ 400,00",
    tag: "Mais vendido",
    use: "Obras residenciais e reformas",
    searchSlug: "votoran",
  },
  {
    name: "Votoran Obras Estruturais CP III-40",
    spec: "Alto-forno — maior durabilidade e menor calor de hidratação",
    weight: "50kg",
    cargaFechada: "R$ 35,90",
    palete: "R$ 37,90",
    paletePromo: "R$ 27,90",
    economia: "R$ 400,00",
    tag: "Para estrutura",
    use: "Lajes, vigas, pilares e fundações",
    searchSlug: "votoran cp iii",
  },
  {
    name: "Votoran Alta Resistência CP V ARI",
    spec: "Desforma rápida — alta resistência inicial",
    weight: "50kg",
    cargaFechada: "R$ 41,90",
    palete: "R$ 41,90",
    paletePromo: "R$ 31,90",
    economia: "R$ 400,00",
    tag: "Desforma rápida",
    use: "Pré-moldados, industrial e obra acelerada",
    searchSlug: "votoran ari",
  },
  {
    name: "Cauê Uso Geral CP II-E-32",
    spec: "Escória — versátil e econômico",
    weight: "50kg",
    cargaFechada: "R$ 34,50",
    palete: "R$ 36,20",
    paletePromo: "R$ 26,20",
    economia: "R$ 400,00",
    tag: "Custo-benefício",
    use: "Alvenaria, reboco e contrapiso",
    searchSlug: "caue",
  },
  {
    name: "Montes Claros CP II-E-32",
    spec: "Excelente trabalhabilidade",
    weight: "50kg",
    cargaFechada: "R$ 33,90",
    palete: "R$ 35,50",
    paletePromo: "R$ 25,50",
    economia: "R$ 400,00",
    tag: "Menor preço",
    use: "Obras e reformas em geral",
    searchSlug: "montes claros",
  },
  {
    name: "Cimento CSN CP II-F-32",
    spec: "Filler calcário — padrão CSN",
    weight: "50kg",
    cargaFechada: "R$ 34,20",
    palete: "R$ 35,90",
    paletePromo: "R$ 25,90",
    economia: "R$ 400,00",
    use: "Alvenaria, reboco e concreto simples",
    searchSlug: "csn",
  },
  {
    name: "Cimento Mauá CP II-E-32",
    spec: "Tradição e regularidade",
    weight: "50kg",
    cargaFechada: "R$ 34,90",
    palete: "R$ 36,50",
    paletePromo: "R$ 26,50",
    economia: "R$ 400,00",
    use: "Obras residenciais e comerciais",
    searchSlug: "maua",
  },
  {
    name: "Cimento Branco Estrutural",
    spec: "Acabamento arquitetônico e rejuntes especiais",
    weight: "25kg",
    cargaFechada: "R$ 58,90",
    palete: "R$ 58,90",
    paletePromo: "R$ 48,90",
    economia: "R$ 400,00",
    tag: "Especial",
    use: "Revestimentos, mármores e acabamento fino",
    searchSlug: "cimento branco",
  },
]

const FAQS = [
  {
    q: "Qual a quantidade mínima para preço de atacado?",
    a: "Palete com 40 sacos ou carga fechada com 560 a 640 sacos (14 a 16 toneladas). No palete você já garante preço de atacado; na carga fechada o desconto é máximo, direto da fábrica.",
  },
  {
    q: "Vocês entregam na minha obra com descarga?",
    a: "Sim. Frota própria com caminhão munck e descarga paletizada. O motorista posiciona o palete onde sua equipe indicar (quando o acesso permite) e a descarga está inclusa na cotação da carga.",
  },
  {
    q: "Quais as regiões atendidas?",
    a: "Ribeirão Preto, Franca, Araraquara, São Carlos, Campinas, Uberlândia, Triângulo Mineiro e região. Para outras cidades do interior de SP e MG, consulte a rota da semana no WhatsApp.",
  },
  {
    q: "Quais as formas de pagamento para construtoras e empresas?",
    a: "Boleto faturado para CNPJ após análise cadastral, PIX com desconto adicional e cartão corporativo. Primeira compra: PIX ou cartão; a partir da segunda, liberamos faturamento.",
  },
  {
    q: "Como emitir nota fiscal e laudo técnico ABNT?",
    a: "Todas as cargas acompanham NF-e e laudo de resistência do fabricante, conforme NBR 16697. Enviamos a documentação por e-mail e WhatsApp antes da descarga.",
  },
]

function WhatsAppSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function CimentoLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Distribuidora de Cimento no Atacado — Direto da Fábrica",
    description:
      "Saco de cimento 50kg, palete e carga fechada. Votoran, Cauê, Montes Claros, CSN e Mauá com entrega e descarga.",
    url: `${SITE.siteUrl}/cimento`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: OFFERS.map((o, i) => ({
        "@type": "Product",
        position: i + 1,
        name: `${o.name} (${o.weight})`,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: o.cargaFechada.replace("R$ ", "").replace(",", "."),
          availability: "https://schema.org/InStock",
        },
      })),
    },
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO B2B ── */}
      <section className="relative overflow-hidden bg-[#0A1628] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,211,102,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,121,32,0.15),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/50" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white/80">Cimento no atacado</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-[4px] border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#25D366]">
                <span className="h-2 w-2 rounded-[4px] bg-[#25D366] animate-pulse" />
                Entrega rápida com descarga inclusa
              </div>
              <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Distribuidora de Cimento no Atacado —{" "}
                <span className="text-[#25D366]">Direto da Fábrica</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Saco de cimento 50kg, palete com 40 sacos e carga fechada de 560 a 640 sacos.
                Votoran, Cauê, Montes Claros, CSN e Mauá com NF-e, laudo ABNT e descarga paletizada.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                {["Palete 40 sacos", "Carga fechada 560–640 sacos", "Frota própria + Munck", "NF-e + Laudo ABNT"].map((s) => (
                  <span key={s} className="rounded-[4px] bg-white/10 border border-white/15 px-3 py-1.5 text-white/85">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={waLink(WHATSAPP_MAIN)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="btn_whatsapp"
                  data-button-name="btn_whatsapp"
                  data-source="cimento_hero"
                  className="btn-whatsapp-track inline-flex min-h-[64px] flex-1 items-center justify-center gap-3 rounded-[4px] bg-[#25D366] px-8 text-lg font-black text-white transition-all hover:bg-[#1EBE5B] hover:scale-[1.02] active:scale-95 sm:flex-none sm:px-10"
                >
                  <WhatsAppSvg className="h-7 w-7" />
                  <span className="hidden sm:inline">Cotar Carga Fechada ou Palete no WhatsApp</span>
                  <span className="sm:hidden">Cotar no WhatsApp</span>
                </a>
              </div>
              <p className="mt-3 text-xs text-white/50">
                Resposta em minutos no horário comercial · Seg–Sex 07:00–18:00 · Sáb 07:00–12:00
              </p>
            </div>

            {/* Card resumo atacado */}
            <div className="rounded-[4px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Tabela de atacado</p>
              <div className="mt-4 space-y-3">
                {[
                  { k: "Saco 50kg avulso", v: "a partir de R$ 36,90", d: "retirada / pequenos volumes" },
                  { k: "Palete · 40 sacos", v: "a partir de R$ 33,90/saco", d: "preço de atacado + descarga" },
                  { k: "Carga fechada · 560–640 sacos", v: "a partir de R$ 33,90/saco", d: "maior desconto direto da fábrica" },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between gap-4 rounded-[4px] bg-white/5 border border-white/10 px-5 py-4">
                    <div>
                      <p className="font-bold text-white">{r.k}</p>
                      <p className="text-xs text-white/55">{r.d}</p>
                    </div>
                    <p className="text-right text-sm font-black text-[#25D366] whitespace-nowrap">{r.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-white/70">
                <div className="rounded-[4px] bg-white/5 border border-white/10 px-2 py-3">ABNT<br /><span className="text-white">NBR 16697</span></div>
                <div className="rounded-[4px] bg-white/5 border border-white/10 px-2 py-3">Frete<br /><span className="text-white">SP + interior</span></div>
                <div className="rounded-[4px] bg-white/5 border border-white/10 px-2 py-3">Descarga<br /><span className="text-white">inclusa</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABELA COMPARATIVA ── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* SUPER OFERTA PALETE */}
        <div className="mb-8 rounded-[4px] border-l-4 border-l-[#15803D] border border-[#E5E5E3] bg-[#FAFAF9] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-[4px] bg-[#15803D] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                  Oferta Especial
                </span>
                <span className="inline-flex items-center rounded-[4px] border border-[#E5E5E3] bg-white px-3 py-1 text-[11px] font-bold text-[#111318]">
                  Palete Fechado · 40 sacos
                </span>
              </div>
              <p className="text-[1.6rem] font-black leading-tight text-[#111318]">
                R$ 10,00 OFF por saco no Palete Fechado
              </p>
              <p className="mt-1 text-sm font-semibold text-[#15803D]">
                Economia de até R$ 400,00 por palete · Válido por tempo limitado
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {[
                  "Frete incluso na rota",
                  "Descarga paletizada na obra",
                  "NF-e + Laudo ABNT",
                  "PIX · Boleto · CNPJ",
                ].map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-[4px] border border-[#E5E5E3] bg-white px-3 py-1.5 text-xs font-medium text-[#111318]"
                  >
                    <span className="h-1.5 w-1.5 rounded-[4px] bg-[#15803D] shrink-0" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto">
              <a
                href={waLink("Olá! Vi a Oferta Especial de Palete Fechado com R$10 OFF por saco e frete incluso. Quero garantir o meu palete de cimento.")}
                target="_blank"
                rel="noopener noreferrer"
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="cimento_super_oferta"
                className="btn-whatsapp-track inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-8 text-sm font-black text-white transition-colors hover:bg-[#166534]"
              >
                <WhatsAppSvg className="h-5 w-5 shrink-0" />
                Garantir Oferta no WhatsApp
              </a>
              <p className="text-center text-xs text-[#6B7280]">
                Resposta em minutos · Seg–Sex 07h–18h · Sáb 07h–12h
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F47920]">Tipos e preços</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Tabela comparativa de cimentos e preços de atacado
          </h2>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Valores por saco com faixas de desconto: <strong>carga fechada</strong> (maior desconto) e{" "}
            <strong>palete com 40 sacos</strong>. Toque em qualquer card para cotar aquele cimento exato no WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {OFFERS.map((o) => (
            <article
              key={o.name}
              className="flex flex-col rounded-[4px] border border-slate-200 bg-white p-5 border border-slate-200 bg-white p-5 transition-all hover:border-[#25D366]/50"
            >
              {o.tag && (
                <span className="mb-3 inline-flex w-fit rounded-[4px] bg-[#0A1628] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#25D366]">
                  {o.tag}
                </span>
              )}
              <h3 className="font-black leading-snug text-slate-900">{o.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{o.spec}</p>
              <p className="mt-2 inline-flex w-fit rounded-[4px] bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                Saco {o.weight} · {o.use}
              </p>
              <div className="mt-4 space-y-1.5 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Carga fechada</span>
                  <span className="font-black text-[#15803D]">A partir de {o.cargaFechada}</span>
                </div>
                <div className="border-t border-[#E5E5E3] pt-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold text-[#111318] uppercase tracking-wide">Palete · 40 sc</span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-[#15803D]">Oferta Especial</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#9CA3AF] line-through">{o.palete}/sc</span>
                      <span className="block text-lg font-black text-[#111318]">{o.paletePromo}/sc</span>
                      <span className="block text-[10px] font-semibold text-[#15803D]">
                        Economize {o.economia} no palete
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <a
                href={waLink(`Olá! Quero cotar ${o.name} (${o.weight}) no atacado. Carga fechada ${o.cargaFechada} / Palete ${o.palete}. Pode me passar condição para minha obra?`)}
                target="_blank"
                rel="noopener noreferrer"
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="cimento_card"
                className="btn-whatsapp-track mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[4px] bg-[#25D366] px-4 text-sm font-black text-white  transition-all hover:bg-[#1EBE5B] active:scale-95"
              >
                <WhatsAppSvg className="h-5 w-5" />
                Cotar este cimento no WhatsApp
              </a>
              <Link
                href={`/busca?q=${encodeURIComponent(o.searchSlug)}`}
                className="mt-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Ver no catálogo →
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-6 text-center sm:p-8">
          <p className="font-black text-[#111318] text-lg">Construtora, revenda ou obra de grande porte?</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Conta corrente com faturamento no CNPJ · Condição exclusiva por rota e volume · Entrega programada semanal
          </p>
          <a
            href={waLink("Olá! Sou construtora ou revenda e tenho interesse em abrir conta B2B na Discibra para compras recorrentes de cimento.")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="cimento_b2b"
            className="btn-whatsapp-track mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-8 font-black text-white transition-colors hover:bg-[#166534]"
          >
            <WhatsAppSvg className="h-5 w-5" />
            Abrir conta B2B no WhatsApp
          </a>
        </div>
      </section>

      {/* ── SELOS + FAQ ── */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F47920]">Confiança</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Selos de garantia da carga</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { t: "ABNT · NBR 16697", d: "Cimento normatizado com laudo" },
                { t: "NF-e em todas as cargas", d: "Faturamento PF e PJ" },
                { t: "Frete SP e interior", d: "Ribeirão, Franca, Campinas e + " },
                { t: "Descarga inclusa", d: "Munck + paletizado na obra" },
              ].map((s) => (
                <div key={s.t} className="rounded-[4px] border border-slate-200 bg-white p-4">
                  <p className="font-black text-slate-900 text-sm">{s.t}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[4px] bg-white border border-slate-200 p-5 text-sm text-slate-600">
              <p className="font-black text-slate-900">Central de Distribuição</p>
              <p className="mt-1">Rua Igarapava, 73 — Vila Albertina, Ribeirão Preto/SP</p>
              <p className="mt-1">Seg–Sex 07:00–18:00 · Sáb 07:00–12:00</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/nossas-lojas" className="rounded-[4px] bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
                  Ver logística e retirada
                </Link>
                <Link href="/faq" className="rounded-[4px] border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-white">
                  Dúvidas frequentes
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Perguntas frequentes do atacado</h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-[4px] border border-slate-200 bg-white p-5 open:border-[#25D366]/50 open:">
                  <summary className="cursor-pointer list-none font-bold text-slate-900 flex items-center justify-between gap-4">
                    {f.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-slate-100 font-black text-slate-500 group-open:bg-[#25D366] group-open:text-white transition-all">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-6 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-5">
              <p className="font-black text-[#111318]">Ficou com alguma dúvida?</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Nosso time responde em minutos — Segunda a Sábado, horário comercial.
              </p>
              <a
                href={waLink("Olá! Tenho uma dúvida sobre compra de cimento no atacado e gostaria de falar com um especialista da Discibra.")}
                target="_blank"
                rel="noopener noreferrer"
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="cimento_faq_cta"
                className="btn-whatsapp-track mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-6 text-sm font-bold text-white transition-colors hover:bg-[#166534]"
              >
                <WhatsAppSvg className="h-4 w-4" />
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="rounded-[4px] bg-[#0A1628] p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-black sm:text-4xl">Pronto para travar o preço da sua obra?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/65">
            Aproveite a Oferta Especial de Palete com R$ 10,00 OFF por saco enquanto durar o estoque.
            Envie o CEP da obra e a quantidade — retornamos em minutos com frete, prazo e condição PIX/CNPJ.
          </p>
          <a
            href={waLink(WHATSAPP_MAIN)}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="cimento_footer"
            className="btn-whatsapp-track mx-auto mt-6 inline-flex min-h-[64px] items-center justify-center gap-3 rounded-[4px] bg-[#15803D] px-10 text-lg font-black text-white transition-colors hover:bg-[#166534] hover:scale-[1.02] active:scale-95"
          >
            <WhatsAppSvg className="h-7 w-7" />
            Cotar agora no WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
