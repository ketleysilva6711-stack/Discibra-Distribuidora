import type { Metadata } from "next"
import Link from "next/link"
import { waLink } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Perguntas Frequentes — Atacado de Cimento, Entrega e Pagamento",
  description:
    "Quantidade mínima para atacado (palete 40 sacos / carga 560–640 sacos), entrega com descarga, regiões atendidas, pagamento CNPJ e NF-e com laudo ABNT.",
}

const FAQS = [
  {
    q: "Qual a quantidade mínima para preço de atacado?",
    a: "Palete com 40 sacos ou carga fechada com 560 a 640 sacos (14 a 16 toneladas). No palete você já garante o preço de atacado; na carga fechada o desconto é máximo, direto da fábrica. Para volumes menores, consulte a retirada no CD.",
  },
  {
    q: "Vocês entregam na minha obra com descarga?",
    a: "Sim. Frota própria com caminhão munck e descarga paletizada. O motorista posiciona os paletes onde sua equipe indicar (quando o acesso permite) e a descarga está inclusa na cotação da carga fechada e do palete.",
  },
  {
    q: "Quais as regiões atendidas?",
    a: "Ribeirão Preto, Franca, Araraquara, São Carlos, Campinas, Uberlândia, Triângulo Mineiro e região. Atendemos todo o interior de SP e MG por rota programada — envie o CEP da obra no WhatsApp para confirmar prazo e frete.",
  },
  {
    q: "Quais as formas de pagamento para construtoras e empresas?",
    a: "Boleto faturado para CNPJ após análise cadastral, PIX com desconto adicional e cartão corporativo. Primeira compra: PIX ou cartão; a partir da segunda, liberamos faturamento com vencimento programado.",
  },
  {
    q: "Como emitir nota fiscal e laudo técnico ABNT?",
    a: "Todas as cargas acompanham NF-e e laudo de resistência do fabricante, conforme NBR 16697. Enviamos a documentação por e-mail e WhatsApp antes da descarga. Para obras com medição, emitimos romaneio por palete.",
  },
  {
    q: "Qual cimento devo usar: CP II, CP III ou CP V?",
    a: "CP II (F ou E): uso geral — alvenaria, reboco, contrapiso. CP III-40: estruturas, fundações e ambientes agressivos (maior durabilidade). CP V ARI: desforma rápida, pré-moldados e obra acelerada. Fale com nosso técnico no WhatsApp que indicamos o ideal sem custo.",
  },
  {
    q: "Consigo agendar entrega programada por etapa da obra?",
    a: "Sim. Travamos o preço por 30 dias e programamos as descargas por etapa (fundação, estrutura, acabamento). Ideal para construtoras com cronograma. Consulte o consultor B2B.",
  },
]

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Voltar ao início
      </Link>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#F47920]">Ajuda · Atacado</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Perguntas frequentes
      </h1>
      <p className="mt-3 text-slate-500">
        Tudo sobre atacado de cimento, entrega com descarga, pagamento para CNPJ e documentação ABNT.
        Não achou sua dúvida? Chame no WhatsApp — respondemos em minutos.
      </p>

      <div className="mt-8 space-y-3">
        {FAQS.map((f, i) => (
          <details
            key={f.q}
            open={i === 0}
            className="group rounded-[4px] border border-[#E5E5E3] bg-white p-5 open:border-[#15803D] transition-colors"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
              {f.q}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] font-black text-slate-600 transition-colors group-open:bg-[#15803D] group-open:text-white group-open:border-[#15803D]">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-[4px] bg-[#111318] p-8 text-center text-white">
        <h2 className="text-xl font-black sm:text-2xl">Ainda tem dúvidas sobre sua carga?</h2>
        <p className="mt-2 text-sm text-white/65">Envie o CEP da obra e a quantidade — cotação com frete em minutos.</p>
        <a
          href={waLink("Olá! Li o FAQ e quero uma cotação de cimento no atacado para minha obra.")}
          target="_blank"
          rel="noopener noreferrer"
          data-track="btn_whatsapp"
          data-button-name="btn_whatsapp"
          data-source="contact_page"
          className="btn-whatsapp-track mt-5 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-8 font-black text-white transition-colors hover:bg-[#166534]"
        >
          Chamar no WhatsApp
        </a>
        <div className="mt-4 flex justify-center gap-4 text-xs text-white/50">
          <Link href="/cimento" className="underline hover:text-white">Ver tabela de atacado</Link>
          <Link href="/nossas-lojas" className="underline hover:text-white">Ver logística</Link>
        </div>
      </div>
    </div>
  )
}
