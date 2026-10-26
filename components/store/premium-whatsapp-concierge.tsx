"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const QUICK_ACTIONS = [
  {
    icon: "📦",
    title: "Cotação de Cimento (Palete ou Carga Fechada)",
    msg: "Olá! Gostaria de uma cotação de cimento no atacado (palete ou carga fechada direto da fábrica).",
  },
  {
    icon: "🏗️",
    title: "Cotação de Aço, Argamassa e Básicos",
    msg: "Olá! Gostaria de um orçamento de aço, argamassa e materiais básicos para minha obra.",
  },
  {
    icon: "🚚",
    title: "Consultar Frete com Descarga Munck (Informe o CEP)",
    msg: "Olá! Gostaria de consultar o frete com descarga munck. Meu CEP é: ",
  },
  {
    icon: "💬",
    title: "Falar com Vendedor Agora",
    msg: "Olá! Gostaria de falar com um vendedor da distribuidora.",
  },
]

const DEFAULT_MSG = "Olá! Gostaria de fazer uma cotação de materiais no atacado."

export default function PremiumWhatsAppConcierge() {
  const [phone, setPhone] = useState(SITE.whatsappE164)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function fetchRotation() {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data } = await supabase
          .from("whatsapp_numbers")
          .select("phone")
          .eq("active", true)
          .order("sort_order")
        if (data && data.length > 0) {
          const idx = Math.floor(Math.random() * data.length)
          setPhone(data[idx].phone)
        }
      } catch (_) {}
    }
    fetchRotation()
  }, [])

  const waLink = (msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`

  const handleAction = (msg: string) => {
    trackWhatsAppClick("concierge_flyout")
    window.open(waLink(msg), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="hidden lg:flex fixed bottom-6 right-6 z-[90] flex-col items-end gap-3 font-sans select-none">
      {/* ── Cartão institucional ── */}
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-16px_rgba(0,45,91,0.35)] animate-in slide-in-from-bottom-6 fade-in duration-300">
          {/* Topo azul marinho */}
          <div className="bg-[#002D5B] p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold leading-snug">Distribuidora Atacado — Vendas & Cotações</p>
                <p className="mt-1 text-[13px] text-white/70">Fale direto com nossos consultores de vendas</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar atendimento"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-2 p-4">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.title}
                onClick={() => handleAction(a.msg)}
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="concierge_flyout"
                className="btn-whatsapp-track flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-[#25D366] hover:bg-emerald-50/50 active:scale-[0.99]"
              >
                <span className="text-xl leading-none" aria-hidden="true">{a.icon}</span>
                <span className="flex-1 text-sm font-semibold text-slate-800">{a.title}</span>
              </button>
            ))}
          </div>

          {/* Rodapé */}
          <div className="border-t border-slate-100 p-4">
            <a
              href={waLink(DEFAULT_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick("concierge_flyout")}
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="concierge_flyout"
              className="btn-whatsapp-track flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition-all hover:bg-[#1EBE5B] active:scale-[0.99]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Abrir WhatsApp Direto
            </a>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              {SITE.phoneDisplay} · Seg–Sex 07h–18h | Sáb 07h–12h
            </p>
          </div>
        </div>
      )}

      {/* ── Botão flutuante corporativo ── */}
      <div className="flex items-center gap-2.5">
        {!open && (
          <span className="hidden rounded-full border border-slate-200 bg-white py-2 pl-3 pr-4 text-[13px] font-semibold text-slate-700 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] sm:block">
            💬 Cotação Rápida no WhatsApp | {SITE.phoneDisplay}
          </span>
        )}
        <button
          onClick={() => {
            if (!open) trackWhatsAppClick("concierge_flyout")
            setOpen((v) => !v)
          }}
          data-track="btn_whatsapp"
          data-button-name="btn_whatsapp"
          data-source="concierge_flyout"
          aria-label={open ? "Fechar atendimento WhatsApp" : "Abrir cotação no WhatsApp"}
          aria-expanded={open}
          className="btn-whatsapp-track flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-6px_rgba(37,211,102,0.65)] transition-all hover:scale-105 hover:bg-[#1EBE5B] active:scale-95"
        >
          {open ? <X className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
        </button>
      </div>
    </div>
  )
}
