import type { Metadata } from "next"
import InstitutionalLayout from "@/components/store/institutional-layout"
import { SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Política de privacidade",
}

export default function PoliticaPrivacidadePage() {
  return (
    <InstitutionalLayout
      title="Política de privacidade"
      subtitle="Como tratamos dados pessoais neste site e nos canais de atendimento."
    >
      <p>
        A {SITE.legalName} respeita a privacidade dos visitantes e clientes. Esta política descreve, de forma
        geral, quais informações podem ser coletadas e como são utilizadas.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Dados coletados</h2>
      <p>
        Podemos receber nome, e-mail, telefone, endereço e dados da empresa quando você preenche formulários,
        cria conta, solicita orçamento ou conversa pelo WhatsApp.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Finalidade</h2>
      <p>
        Utilizamos os dados para responder solicitações, processar pedidos, enviar atualizações operacionais
        e cumprir obrigações legais quando aplicável.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Armazenamento</h2>
      <p>
        Informações podem ser armazenadas em servidores seguros e ferramentas de gestão (por exemplo,
        plataforma de e-commerce e mensageria). Adotamos boas práticas de segurança compatíveis com o porte da
        operação.
      </p>
      <h2 className="font-heading text-lg font-bold text-foreground pt-4">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão de dados pessoais, conforme a LGPD, entrando em
        contato pelo e-mail {SITE.email}.
      </p>
      <p className="text-muted-foreground text-xs pt-4">
        Texto modelo — ajuste juridicamente conforme sua operação e DPO.
      </p>
    </InstitutionalLayout>
  )
}
