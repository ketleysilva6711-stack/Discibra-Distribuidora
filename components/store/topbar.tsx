"use client"
import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

export default function Topbar() {
  const marqueeItems = [
    { text: "CNPJ: 59.566.414/0001-25 · Distribuidora Legalmente Constituída", icon: "🏢" },
    { text: "Centro de Distribuição & Logística em Ribeirão Preto — SP", icon: "📍" },
    { text: "Televendas / WhatsApp Oficial: (16) 99644-7972", icon: "📲", isWa: true },
    { text: "Condições de Atacado: PIX com Desconto ou até 12x no Cartão", icon: "💳" },
    { text: "Entrega Rápida com Caminhão Munck ou Carga Paletizada na sua Obra", icon: "🚛" },
    { text: "Expedição & Cargas: Seg a Sex 07h às 18h | Sáb 07h às 12h", icon: "⏰" },
    { text: "Atendimento Aberto a Todos: Construtores, Obras e Pessoa Física (Sem Exigência de CNPJ)", icon: "🏗️" },
    { text: "E-mail: contato@discibradistribuidora.com", icon: "✉️" },
  ]

  return (
    <div className="relative w-full overflow-hidden bg-[#071320] border-b border-white/10 text-slate-300 py-2 text-xs select-none">
      <style>{`
        @keyframes topbar-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="group flex w-max overflow-hidden">
        <div className="flex w-max items-center gap-8 whitespace-nowrap animate-[topbar-marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              {item.isWa ? (
                <a
                  href="https://wa.me/5516996447972?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20uma%20cota%C3%A7%C3%A3o%20de%20materiais%20no%20atacado."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick("topbar_phone")}
                  data-track="btn_whatsapp"
                  data-button-name="btn_whatsapp"
                  data-source="topbar_phone"
                  className="btn-whatsapp-track font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  {item.text}
                </a>
              ) : (
                <span className="font-medium text-slate-300">{item.text}</span>
              )}
              <span className="ml-6 text-white/20">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
