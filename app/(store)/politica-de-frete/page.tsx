import type { Metadata } from "next"
import InstitutionalLayout from "@/components/store/institutional-layout"
import WhatsAppCta from "@/components/store/whatsapp-cta"

export const metadata: Metadata = {
  title: "Política de frete",
}

export default function PoliticaFretePage() {
  return (
    <InstitutionalLayout
      title="Política de frete"
      subtitle="Entregas, abrangência e como calculamos o frete."
    >
      <p>
        O Discibra Distribuidora opera com frota própria e parceiros logísticos, conforme a região e o
        volume do pedido.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Abrangência</h2>
      <p>
        As rotas e prazos são definidos pela equipe comercial no momento do orçamento, considerando CEP, tipo
        de carga e disponibilidade de veículos.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Prazos</h2>
      <p>
        O prazo de entrega informado é estimado após confirmação de pagamento e separação do pedido. O
        rastreamento pode ser acompanhado com o código fornecido pelo atendimento.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Recebimento</h2>
      <p>
        É necessário haver responsável no local para conferência da carga. Divergências devem ser registradas
        imediatamente com o motorista e comunicadas ao comercial.
      </p>
      <div className="not-prose pt-4">
        <WhatsAppCta
          source="contact_page"
          page="/politica-de-frete"
          text="Olá! Preciso de informações sobre frete e entrega."
          label="Consultar frete"
        />
      </div>
    </InstitutionalLayout>
  )
}
