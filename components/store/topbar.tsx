"use client"

import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

export default function Topbar() {
  return (
    <div className="w-full bg-[#0F172A] border-b border-slate-800 text-slate-300 text-[11px] sm:text-xs">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 lg:px-10">
        {/* Esquerda: Identificação Institucional e Logística */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-semibold text-white">CNPJ 59.566.414/0001-25</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">CD Logístico: Ribeirão Preto — SP</span>
          <span className="hidden md:inline text-slate-600">·</span>
          <span className="hidden md:inline text-slate-400">Atendimento a Construtoras e Pessoa Física</span>
        </div>

        {/* Direita: Expedição, WhatsApp e E-mail */}
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-400">Seg a Sex 07h–18h | Sáb 07h–12h</span>
          <span className="text-slate-600">·</span>
          <a
            href="https://wa.me/5516996447972?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20uma%20cota%C3%A7%C3%A3o%20de%20materiais%20no%20atacado."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick("topbar_phone")}
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="topbar_phone"
            className="btn-whatsapp-track font-semibold text-white hover:text-emerald-400 transition-colors"
          >
            (16) 99644-7972
          </a>
          <span className="text-slate-600">·</span>
          <a
            href={`mailto:${SITE.email}`}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {SITE.email}
          </a>
        </div>
      </div>
    </div>
  )
}
