import type { Metadata } from "next"
import Link from "next/link"
import InstitutionalLayout from "@/components/store/institutional-layout"
import WhatsAppCta from "@/components/store/whatsapp-cta"
import { SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Fale conosco",
}

export default function FaleConoscoPage() {
  return (
    <InstitutionalLayout
      title="Fale conosco"
      subtitle="Canal direto para dúvidas, sugestões e atendimento consultivo."
    >
      <p>
        Prefere um retorno rápido? O WhatsApp é o canal principal da {SITE.shortName} para orçamentos e
        acompanhamento de pedidos.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
        <li>Orçamentos com lista de materiais</li>
        <li>Prazos e disponibilidade de carga</li>
        <li>Condições para CNPJ e grandes volumes</li>
      </ul>
      <div className="not-prose flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
        <WhatsAppCta
          source="contact_page"
          page="/fale-conosco"
          text="Olá! Gostaria de falar com o atendimento."
          label="WhatsApp comercial"
        />
      </div>
    </InstitutionalLayout>
  )
}
