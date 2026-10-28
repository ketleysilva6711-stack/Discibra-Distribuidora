"use client"

import { ArrowRight } from "lucide-react"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

export default function HomeWhatsAppCta() {
  return (
    <a
      href={waLink("Olá! Gostaria de fazer um orçamento.")}
      target="_blank"
      rel="noopener noreferrer"
      data-track="btn_whatsapp"
      data-button-name="btn_whatsapp"
      data-name="btn_whatsapp"
      data-source="home_cta"
      onClick={() => trackWhatsAppClick("home_cta")}
      className="group/btn relative inline-flex h-14 w-full items-center justify-center gap-3 rounded-[4px] bg-[#15803D] px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#166534] btn-whatsapp-track sm:h-16 sm:w-auto sm:min-w-[280px] sm:text-base"
    >
      <span className="relative z-10">Falar no WhatsApp</span>
      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1 text-white" />
    </a>
  )
}
