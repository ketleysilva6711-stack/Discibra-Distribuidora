import type { Metadata } from "next"
import Link from "next/link"
import { waLink, SITE } from "@/lib/site-config"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Nossas Lojas — Central de Distribuição Logística em Ribeirão Preto",
  description:
    "Central de Distribuição: Rua Igarapava, 73, Vila Albertina, Ribeirão Preto/SP. Entrega programada e retirada rápida para carretas e caminhões. Seg–Sex 07:00–18:00, Sáb 07:00–12:00.",
}

export default function LojasPage() {
  const address = `${SITE.address.street}, ${SITE.address.district}, ${SITE.address.city}`
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.address.street} ${SITE.address.district} ${SITE.address.city}`)}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Voltar ao início
      </Link>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#F47920]">Logística · Atacado</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Central de Distribuição Logística
      </h1>
      <p className="mt-3 max-w-2xl text-slate-500">
        Estrutura dedicada ao atacado de cimento: pátio para carretas, docas para carga/descarga paletizada
        e atendimento B2B para construtoras, revendas e grandes obras.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Endereço + horários */}
        <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-6 sm:p-8">
          <h2 className="text-lg font-black text-slate-900">Onde estamos</h2>
          <p className="mt-3 text-lg font-bold text-slate-800">{SITE.address.street}</p>
          <p className="text-slate-600">{SITE.address.district} — {SITE.address.city}</p>
          <p className="text-slate-500 text-sm">{SITE.address.zip}</p>

          <div className="mt-6 space-y-3 rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] p-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-600">Segunda a Sexta</span>
              <span className="font-black text-slate-900">07:00 às 18:00</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-600">Sábados</span>
              <span className="font-black text-slate-900">07:00 às 12:00</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-600">Carregamento</span>
              <span className="font-black text-emerald-700">Retirada rápida</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[4px] border border-[#111318] px-6 text-sm font-black text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
            >
              Como chegar →
            </a>
            <a
              href={waLink("Olá! Quero agendar uma visita / carregamento no CD (Rua Igarapava, 73). Qual o melhor horário?")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="contact_page"
              className="btn-whatsapp-track inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-6 text-sm font-black text-white transition-colors hover:bg-[#166534]"
            >
              Agendar no WhatsApp
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-400">Endereço: {address}</p>
        </div>

        {/* Modalidades */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[4px] bg-[#111318] p-6 sm:p-8 text-white">
            <h2 className="text-lg font-black">Modalidades de atendimento</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[4px] border border-white/10 bg-white/5 p-5">
                <p className="font-black text-[#25D366]">🚚 Entrega programada</p>
                <p className="mt-1 text-sm text-white/65">
                  Caminhão munck com descarga paletizada na obra. Rota para Ribeirão Preto, Franca,
                  Araraquara, São Carlos, Campinas, Uberlândia e Triângulo Mineiro.
                </p>
              </div>
              <div className="rounded-[4px] border border-white/10 bg-white/5 p-5">
                <p className="font-black text-[#25D366]">🏗️ Retirada rápida</p>
                <p className="mt-1 text-sm text-white/65">
                  Pátio preparado para carretas e caminhões. Carregamento em até 40 min com romaneio
                  e NF-e emitida na hora. Traga o pedido confirmado no WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { t: "Pátio p/ carretas", d: "Manobra fácil" },
              { t: "Descarga inclusa", d: "Munck + palete" },
              { t: "NF-e + laudo", d: "ABNT na hora" },
            ].map((s) => (
              <div key={s.t} className="rounded-[4px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-900">✓ {s.t}</p>
                <p className="mt-1 text-xs text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-6 text-center sm:p-8">
        <p className="font-bold text-slate-800">É construtora ou revenda? Fale com o consultor B2B antes de vir.</p>
        <p className="mt-1 text-sm text-slate-500">Confirmamos estoque, preço por rota e janela de carregamento.</p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={waLink("Olá! Quero agendar carregamento/visita no CD para cotação de cimento no atacado.")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="contact_page"
            className="btn-whatsapp-track inline-flex min-h-[56px] items-center justify-center rounded-[4px] bg-[#15803D] px-8 font-black text-white transition-colors hover:bg-[#166534]"
          >
            Agendar visita ou carregamento
          </a>
          <Link
            href="/cimento"
            className="inline-flex min-h-[56px] items-center justify-center rounded-[4px] border border-[#111318] px-8 font-black text-slate-700 hover:bg-white"
          >
            Ver tabela de atacado
          </Link>
        </div>
      </div>
    </div>
  )
}
