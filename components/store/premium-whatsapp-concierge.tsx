"use client"

import { useState } from "react"
import { SITE } from "@/lib/site-config"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

export default function PremiumWhatsAppConcierge() {
  const phone = SITE.whatsappE164.replace(/\D/g, "")

  const waLink = (msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2.5 font-sans select-none">
      {/* ── Botão flutuante institucional ── */}
      <a
        href={waLink("Olá! Gostaria de fazer uma cotação de materiais no atacado.")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#15803D] hover:bg-[#166534] text-white transition-all hover:scale-105 active:scale-95 shadow-[0_12px_32px_-6px_rgba(21,128,61,0.5)]"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>

      {/* ── Badge discreto ao lado ── */}
      <span className="flex items-center gap-2 rounded-[4px] border border-[#E5E5E3] bg-white px-3 pr-4 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-[#FAFAF9]">
        Atendimento no WhatsApp · {SITE.phoneDisplay}
      </span>
    </div>
  )
}
