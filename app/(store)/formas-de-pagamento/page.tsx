import type { Metadata } from "next"
import InstitutionalLayout from "@/components/store/institutional-layout"
import WhatsAppCta from "@/components/store/whatsapp-cta"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Formas de pagamento",
}

export default function FormasPagamentoPage() {
  return (
    <InstitutionalLayout
      title="Formas de pagamento"
      subtitle="Condições comerciais alinhadas ao perfil B2B e B2C."
    >
      <section className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 md:p-8 mb-8 not-prose">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Política de pagamento</h2>
        <p className="text-foreground/90 leading-relaxed text-[15px]">
          O Discibra Distribuidora prioriza segurança e transparência em todas as transações. Nosso modelo comercial
          foi estruturado para garantir controle, rastreabilidade e segurança em cada negociação, oferecendo
          confiança total ao cliente. O setor financeiro confirma condições, prazos e formas de pagamento de forma
          clara, alinhada ao perfil da sua empresa e ao porte do pedido.
        </p>
      </section>

      <p>
        As formas de pagamento disponíveis são definidas em conjunto com você, conforme análise comercial e a
        melhor combinação para a sua obra ou revenda. A confirmação é sempre formalizada pelo setor financeiro após
        o orçamento.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
        <li>PIX e transferência bancária</li>
        <li>Cartão, quando disponível para a operação</li>
        <li>Condições especiais para CNPJ e prazos negociados</li>
      </ul>
      <p>
        Para valores, limites e parcelamento, solicite uma proposta pelo WhatsApp ou pelo e-mail oficial com a lista
        de materiais e os dados da empresa.
      </p>
      <div className="not-prose pt-4">
        <WhatsAppCta
          source="contact_page"
          page="/formas-de-pagamento"
          text="Olá! Gostaria de saber as formas de pagamento para meu pedido."
          label="Falar com o financeiro"
        />
      </div>
    </InstitutionalLayout>
  )
}
