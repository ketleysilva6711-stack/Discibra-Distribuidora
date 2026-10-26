"use client"

import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function Topbar() {
  return (
    <div className="w-full bg-[#0F172A] text-slate-300">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1.5 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-[13px]">
        {/* Lado esquerdo — Televendas WhatsApp + e-mail */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href="https://wa.me/5516996447972?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20uma%20cota%C3%A7%C3%A3o%20de%20materiais%20no%20atacado."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick("topbar_phone")}
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-source="topbar_phone"
            className="btn-whatsapp-track flex items-center gap-2 text-white hover:text-emerald-400 font-bold transition-colors"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Televendas / WhatsApp: <strong>(16) 99644-7972</strong></span>
          </a>
          <span className="hidden h-3 w-px bg-slate-700 sm:block" aria-hidden="true" />
          <a href={`mailto:${SITE.email}`} className="font-medium text-slate-400 transition-colors hover:text-white">
            {SITE.email}
          </a>
        </div>

        {/* Lado direito — institucional */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-400 sm:text-xs">
          <span>CD Logístico: Ribeirão Preto - SP</span>
          <span className="hidden h-3 w-px bg-slate-700 sm:block" aria-hidden="true" />
          <span>PIX com Desconto · Parcele 12x no Cartão</span>
          <span className="hidden h-3 w-px bg-slate-700 md:block" aria-hidden="true" />
          <span className="hidden md:inline">Horário: Seg a Sex 07h-18h | Sáb 07h-12h</span>
        </div>
      </div>
    </div>
  )
}
