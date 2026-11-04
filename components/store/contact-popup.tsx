"use client"

import { useState } from "react"
import { Phone, Mail, X, Headphones } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

export default function ContactPopup({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const waLink = `https://wa.me/${SITE.whatsappE164}?text=Olá! Gostaria de tirar algumas dúvidas.`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">
        <DialogHeader className="hidden">
            <DialogTitle>Atendimento Oficial</DialogTitle>
        </DialogHeader>

        {/* Custom Header with Close Button */}
        <div className="relative flex justify-end p-4">
          <button 
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E91E63] text-white shadow-lg:hover:scale-110 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-8 space-y-4">
          {/* Phone Button */}
          <a 
            href={`tel:+${SITE.whatsappE164}`}
            onClick={() => trackWhatsAppClick("contact_popup_phone")}
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-name="btn_whatsapp"
            data-source="contact_popup_phone"
            className="btn-whatsapp-track flex items-center gap-4 bg-white border border-black/5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group overflow-hidden"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-[#3F51B5] text-white group-hover:scale-105 transition-transform">
              <Phone className="w-7 h-7" />
            </div>
            <span className="text-[13px] font-bold text-[#002D5B] uppercase tracking-tight">Conversar com um de nossos atendentes</span>
          </a>

          {/* WhatsApp Button */}
          <a 
            href={waLink}
            target="_blank"
            onClick={() => trackWhatsAppClick("contact_popup_whatsapp")}
            data-track="btn_whatsapp"
            data-button-name="btn_whatsapp"
            data-name="btn_whatsapp"
            data-source="contact_popup_whatsapp"
            className="btn-whatsapp-track flex items-center gap-4 bg-[#15803D] hover:bg-[#166534] text-white rounded-[4px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group overflow-hidden min-h-[48px] touch-manipulation"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-[#15803D] text-white group-hover:scale-105 transition-transform">
              <WhatsAppIcon className="w-7 h-7 fill-current" />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-tight">Tirar dúvidas pelo WhatsApp</span>
          </a>

          {/* Email Button */}
          <a 
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-4 bg-white border border-black/5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group overflow-hidden"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-[#536DFE] text-white group-hover:scale-105 transition-transform">
              <Mail className="w-7 h-7" />
            </div>
            <span className="text-[13px] font-bold text-[#002D5B] uppercase tracking-tight">Enviar um E-mail</span>
          </a>
        </div>

        {/* Dark Green Footer */}
        <div className="bg-[#1B5E20] p-4 flex items-center justify-center gap-3">
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            Atendimento de Segunda à Sexta-feira das 9h às 18h.
          </p>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
            <Headphones className="w-4 h-4 text-white" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}