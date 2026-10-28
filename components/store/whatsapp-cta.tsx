"use client"

import { ArrowRight } from "lucide-react"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import type { WaClickSource } from "@/lib/wa-analytics-sources"
import { cn } from "@/lib/utils"

export default function HomeWhatsAppCta({
  source = "home_cta" as WaClickSource,
  page,
  userId,
  text = "Olá! Gostaria de fazer um orçamento.",
  label = "Falar no WhatsApp",
  className,
  variant = "solid",
}: {
  source: WaClickSource
  page?: string
  userId?: string | null
  text?: string
  label?: string
  className?: string
  variant?: "solid" | "outline"
}) {
  const href = waLink(text)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="btn_whatsapp"
      data-button-name="btn_whatsapp"
      data-name="btn_whatsapp"
      data-source={source}
      className="group/btn relative inline-flex h-14 w-full items-center justify-center gap-3 rounded-[4px] bg-[#15803D] px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#166534] btn-whatsapp-track sm:h-16 sm:w-auto sm:min-w-[280px] sm:text-base"
      onClick={() => trackWhatsAppClick(source, page, userId)}
    >
      <span className="relative z-10">{label}</span>
      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1 text-white" />
    </a>
  )
}