import type { Metadata } from "next"
import InstitutionalLayout from "@/components/store/institutional-layout"
import WhatsAppCta from "@/components/store/whatsapp-cta"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Trocas e devoluções",
}

export default function TrocasDevolucoesPage() {
  return (
    <InstitutionalLayout
      title="Trocas e devoluções"
      subtitle="Política alinhada à natureza dos materiais de construção."
    >
      <p>
        Por se tratar de produtos pesados, frágeis ou sensíveis à umidade, a análise de troca ou devolução é
        feita caso a caso, respeitando o Código de Defesa do Consumidor e acordos comerciais B2B.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">No recebimento</h2>
      <p>
        Conferir embalagens, quantidades e nota fiscal na entrega. Recusar produtos com avaria aparente e
        registrar com foto, quando possível.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Solicitação</h2>
      <p>
        Entre em contato em até 48 horas (consumidor) ou conforme contrato (B2B), informando número do pedido e
        motivo. O comercial orientará sobre coleta, crédito ou substituição.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Produtos especiais</h2>
      <p>
        Itens cortados sob medida, pedidos especiais ou fora da embalagem original podem não ser elegíveis à
        devolução, salvo defeito de fabricação comprovado.
      </p>
      <div className="not-prose pt-4">
        <WhatsAppCta
          source="contact_page"
          page="/trocas-e-devolucoes"
          text="Olá! Preciso falar sobre troca ou devolução."
          label="Abrir chamado no WhatsApp"
        />
      </div>
    </InstitutionalLayout>
  )
}
