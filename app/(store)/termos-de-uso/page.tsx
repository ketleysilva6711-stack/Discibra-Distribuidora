import type { Metadata } from "next"
import InstitutionalLayout from "@/components/store/institutional-layout"
import { SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Termos de uso",
}

export default function TermosUsoPage() {
  return (
    <InstitutionalLayout
      title="Termos de uso"
      subtitle="Condições gerais de uso do site e dos serviços digitais."
    >
      <p>
        Ao acessar o site da {SITE.legalName}, você concorda com estes termos. Se não concordar, interrompa o
        uso do site.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Uso do site</h2>
      <p>
        O conteúdo tem caráter informativo e comercial. Preços, estoques e condições podem ser confirmados pelo
        canal de vendas (WhatsApp ou equipe comercial).
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Pedidos e orçamentos</h2>
      <p>
        Pedidos podem ser formalizados por canais oficiais indicados no site. A confirmação de disponibilidade,
        frete e pagamento é feita pelo atendimento.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Propriedade intelectual</h2>
      <p>
        Marcas, textos, imagens e layout são de titularidade da {SITE.shortName} ou licenciados. É proibida a
        reprodução sem autorização.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Limitação de responsabilidade</h2>
      <p>
        Empregamos esforços para manter o site disponível e as informações atualizadas, mas não garantimos
        ausência de erros técnicos ou divergências pontuais de preço — a confirmação final é sempre no
        atendimento.
      </p>
      <p className="text-muted-foreground text-xs pt-4">
        Texto modelo — revise com assessoria jurídica.
      </p>
    </InstitutionalLayout>
  )
}
