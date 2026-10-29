// =============================================================================
// PÁGINA DE POLÍTICA DE PRIVACIDADE — CONFORMIDADE GOOGLE ADS
// =============================================================================
// Esta página atende aos requisitos do Google Ads para:
// - Consentimento de cookies
// - Transparência de dados
// - GDPR/CCPA compliance
// =============================================================================

import { Metadata } from "next"
import { SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: `Política de Privacidade | ${SITE.shortName}`,
  description: `Política de privacidade do ${SITE.shortName}. Saiba como coletamos, usamos e protegemos seus dados.`,
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-mesh py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-slate-600">
            Última atualização: {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Seções */}
        <div className="space-y-8">
          {/* 1. Dados coletados */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              1. Dados Coletados
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              O {SITE.shortName} coleta os seguintes tipos de dados quando você interage
              com nosso site:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Dados de navegação (IP, navegador, dispositivo, páginas visitadas)</li>
              <li>Informações de contato (nome, e-mail, telefone)</li>
              <li>Interações com WhatsApp (cliques, mensagens)</li>
              <li>Dados de conversão para Google Ads e Meta Ads</li>
              <li>Cookies de sessão e preferências</li>
              <li>Logs de acesso para segurança e análise</li>
            </ul>
          </section>

          {/* 2. Finalidade */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              2. Finalidade do Tratamento
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Seus dados são utilizados para as seguintes finalidades:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar solicitações de orçamento via WhatsApp</li>
              <li>Personalizar sua experiência no site</li>
              <li>Realizar análises de marketing e métricas de conversão</li>
              <li>Enviar comunicações sobre produtos e promoções (com seu consentimento)</li>
              <li>Garantir segurança e prevenção de fraudes</li>
            </ul>
          </section>

          {/* 3. Compartilhamento com Google Ads */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              3. Google Ads e Conversões
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Para oferecer anúncios relevantes e melhorar o retorno sobre o investimento
              em publicidade, utilizamos o Google Ads com os seguintes recursos:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>Cookies de conversão:</strong> Rastreamento de cliques no WhatsApp,
                preenchimento de formulários e visualização de produtos.
              </li>
              <li>
                <strong>Remarketing:</strong> Exibição de anúncios personalizados para
                usuários que interagiram com o site.
              </li>
              <li>
                <strong>Conversions API (CAPI):</strong> Rastreamento servidor-a-servidor
                para maior precisão, mesmo com bloqueadores de anúncios.
              </li>
              <li>
                <strong>Google Tag Manager:</strong> Gerenciamento centralizado de tags
                de analytics e conversão.
              </li>
            </ul>
            <p className="text-slate-600 mt-4 text-sm">
              Você pode optar por não participar do rastreamento do Google Ads visitando
              as{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Configurações de Anúncios do Google
              </a>{" "}
              ou instalando o{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Complemento de Desativação do Google Analytics
              </a>
              .
            </p>
          </section>

          {/* 4. Cookies */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              4. Tipos de Cookies Utilizados
            </h2>
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900">Cookies Essenciais</h3>
                  <p className="text-sm text-slate-600">
                    Necessários para o funcionamento do site. Não podem ser desativados.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900">Cookies de Desempenho</h3>
                  <p className="text-sm text-slate-600">
                    Monitoram como os visitantes usam o site para melhorar a experiência.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-purple-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900">Cookies de Marketing</h3>
                  <p className="text-sm text-slate-600">
                    Utilizados pelo Google Ads e Meta Ads para rastreamento de conversão
                    e remarketing. Você pode revogar este consentimento a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Seus Direitos */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              5. Seus Direitos (LGPD)
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018),
              você possui os seguintes direitos:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>Confirmação:</strong> Confirmar a existência de tratamento de dados.
              </li>
              <li>
                <strong>Accesso:</strong> Acessar os dados coletados sobre você.
              </li>
              <li>
                <strong>Correção:</strong> Solicitar correção de dados incompletos ou inexatos.
              </li>
              <li>
                <strong>Eliminação:</strong> Solicitar a eliminação de dados desnecessários.
              </li>
              <li>
                <strong>Revogação de Consentimento:</strong> Revogar seu consentimento a qualquer momento.
              </li>
              <li>
                <strong>Portabilidade:</strong> Receber seus dados em formato interoperável.
              </li>
            </ul>
            <p className="text-slate-600 mt-4">
              Para exercer seus direitos, entre em contato: <strong>{SITE.email}</strong>
            </p>
          </section>

          {/* 6. Menores de Idade */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              6. Menores de Idade
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Nosso site não é destinado a menores de 18 anos. Se você é menor de idade,
              solicite a um responsável legal para entrar em contato conosco antes de
              fornecer qualquer informação pessoal.
            </p>
          </section>

          {/* 7. Contato */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              7. Contato
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Para dúvidas sobre esta Política de Privacidade, entre em contato:
            </p>
            <div className="bg-slate-50 rounded-xl p-6 space-y-2">
              <p className="font-bold text-slate-900">{SITE.legalName}</p>
              <p className="text-slate-600">{SITE.address.street}</p>
              <p className="text-slate-600">{SITE.address.city}</p>
              <p className="text-slate-600">E-mail: {SITE.email}</p>
              <p className="text-slate-600">WhatsApp: {SITE.phoneDisplay}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
