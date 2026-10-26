import type { Metadata } from "next"
import Link from "next/link"
import { waLink, SITE } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Trabalhe Conosco — Vagas B2B, Logística e Motoristas | Discibra Distribuidora",
  description:
    "Oportunidades em Vendas B2B, Logística e Motoristas categoria D/E. Envie seu currículo por e-mail ou WhatsApp do RH e venha crescer no atacado da construção.",
}

const VAGAS = [
  {
    t: "Vendas B2B / Televendas",
    d: "Prospecção de construtoras e revendas, cotação de palete e carga fechada, follow-up e pós-venda.",
    req: ["Experiência com vendas consultivas", "Boa comunicação no WhatsApp e telefone", "Diferencial: vivência em material de construção"],
  },
  {
    t: "Logística / Expedição",
    d: "Roteirização, conferência de romaneio, agendamento de carregamento e controle de pátio no CD.",
    req: ["Organização e atenção a detalhes", "Noções de roteirização e estoque", "Disponibilidade para escala 07:00–18:00"],
  },
  {
    t: "Motoristas Categoria D/E",
    d: "Entrega paletizada com munck, descarga em obra e cuidado com avarias. Frota própria revisada.",
    req: ["CNH D ou E + EAR", "Experiência com truck/carreta", "Compromisso com segurança e pontualidade"],
  },
]

export default function CarreirasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Voltar ao início
      </Link>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#F47920]">Carreiras</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
        Trabalhe Conosco
      </h1>
      <p className="mt-4 max-w-2xl text-slate-500 sm:text-lg">
        Somos uma distribuidora em expansão no atacado da construção. Valorizamos quem resolve,
        cumpre prazo e trata cliente de obra como parceiro. Veja as frentes abertas:
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {VAGAS.map((v) => (
          <article key={v.t} className="flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-900">{v.t}</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{v.d}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {v.req.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-emerald-600 font-black">✓</span> {r}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-[#0A1628] p-6 sm:p-8 text-white">
          <h2 className="text-xl font-black">Como se candidatar</h2>
          <ol className="mt-4 space-y-3 text-sm text-white/70">
            <li><strong className="text-white">1.</strong> Envie currículo em PDF com título da vaga no assunto.</li>
            <li><strong className="text-white">2.</strong> Conte sua experiência e cidade/base (para motoristas, informe categoria da CNH).</li>
            <li><strong className="text-white">3.</strong> Retornamos em até 5 dias úteis para triagem + entrevista.</li>
          </ol>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={`mailto:${SITE.email}?subject=${encodeURIComponent("Currículo — [NOME DA VAGA] — Seu nome")}`}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-slate-900 transition-all hover:bg-slate-100"
            >
              Enviar currículo por e-mail
            </a>
            <p className="text-center text-xs text-white/50">{SITE.email}</p>
            <a
              href={waLink("Olá, RH! Quero me candidatar a uma vaga (Vendas B2B / Logística / Motorista D-E). Segue meu nome e cidade: ")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="contact_page"
              className="btn-whatsapp-track inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-sm font-black text-white transition-all hover:bg-[#1EBE5B] active:scale-95"
            >
              Chamar RH no WhatsApp
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-900">Por que trabalhar aqui?</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>✓ Operação em crescimento com plano de carreira por performance</li>
            <li>✓ Comissionamento agressivo em Vendas B2B</li>
            <li>✓ Frota própria revisada e pátio organizado para Logística/Motoristas</li>
            <li>✓ Treinamento técnico em cimento (ABNT/NBR) e atendimento de obra</li>
            <li>✓ Ambiente direto, sem burocracia — quem entrega, cresce</li>
          </ul>
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500">
            Banco de talentos: mesmo sem vaga aberta no momento, envie seu currículo. Chamamos por ordem
            de fit quando abrem novas rotas e turnos.
          </div>
        </div>
      </div>
    </div>
  )
}
