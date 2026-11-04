"use client"

import { useState } from "react"
import { X, MessageCircle as MsgCircle } from "lucide-react"
import { SITE } from "@/lib/site-config"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

export default function PremiumWhatsAppConcierge() {
  const phone = SITE.whatsappE164.replace(/\D/g, "")
  const [open, setOpen] = useState(false)

  const waLink = (msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`

  const quickReplies = [
    { label: "Cotar Cimento e Básicos no Atacado", text: "Olá! Gostaria de cotar cimento e materiais básicos no atacado." },
    { label: "Consultar Frete em Ribeirão e Região", text: "Olá! Gostaria de consultar frete em Ribeirão Preto e região." },
    { label: "Falar com Vendedor Agora", text: "Olá! Gostaria de falar com um vendedor da Discibra agora." },
  ]

  return (
    <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-[80] select-none">
      {/* Botão do avatar da atendente */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#15803D] hover:bg-[#166534] text-white transition-colors active:scale-[0.98]"
        aria-label="Atendimento no WhatsApp"
      >
        <img
          src="/images/attendant-avatar.png"
          alt="Atendente Discibra"
          className="rounded-full object-cover w-full h-full"
        />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#15803D] ring-2 ring-white" />
      </button>

      {/* Modal de chat */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 pb-20" onClick={() => setOpen(false)}>
          <div
            className="w-[310px] sm:w-[350px] rounded-[4px] border border-[#E5E5E3] bg-white shadow-2xl overflow-hidden mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do modal */}
            <div className="bg-[#111318] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/attendant-avatar.png"
                  alt="Atendente"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <p className="text-sm font-bold text-white">Ana Paula</p>
                  <p className="text-[10px] text-slate-300">
                    Consultora Discibra · Online agora
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-[4px] p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Fechar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-start gap-3 max-w-[80%]">
                <img
                  src="/images/attendant-avatar.png"
                  alt="Ana"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="rounded-[4px] bg-[#E2E8F0] p-3 text-sm text-slate-700">
                  Olá! Sou a Ana Paula da Discibra. Como posso te ajudar a cotar seus materiais hoje?
                </div>
              </div>

              {/* Pílulas de resposta rápida */}
              <div className="space-y-2">
                {quickReplies.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => window.open(waLink(p.text), "_blank")}
                    className="flex w-full items-center gap-2 rounded-[4px] border border-[#E5E5E3] bg-white px-3 py-2 text-sm text-left text-slate-700 transition-all hover:bg-[#FAFAF9] hover:border-[#15803D]"
                  >
                    <span className="text-sm">💬</span>
                    <span className="text-xs font-medium text-slate-600">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Campo de texto + botão enviar */}
              <div className="relative mt-3 pt-3 border-t border-[#E5E5E3]">
                <input
                  type="text"
                  placeholder="Escreva sua dúvida ou pedido..."
                  className="w-full rounded-[4px] border border-[#CBD5E1] bg-white px-4 py-2 text-sm outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder="Escreva sua dúvida ou pedido..."]',
                    ) as HTMLInputElement | null
                    if (input?.value) {
                      window.open(waLink(input.value), "_blank")
                      input.value = ""
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[4px] bg-[#15803D] px-3 py-1.5 text-white text-xs font-bold hover:bg-[#166534] transition-colors flex items-center gap-1"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
