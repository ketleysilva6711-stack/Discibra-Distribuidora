"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, MessageCircle, Printer, Package, Clock } from "lucide-react"
import { SITE, waLink } from "@/lib/site-config"
import { toast } from "sonner"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default function OrcamentoPublicoClient({
  quotation,
}: {
  quotation: any
}) {
  const [viewed, setViewed] = useState(false)
  const [approved, setApproved] = useState(quotation.status === "aprovado")
  const lead = quotation.quotation_leads || {}
  const items = (quotation.quotation_items || []).sort((a: any, b: any) => a.ordem - b.ordem)
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.preco_aplicado) * Number(i.quantidade), 0)
  const descontoPix = Number(quotation.desconto_pix) || 0
  const valorFrete = Number(quotation.valor_frete) || 0
  const total = Number(quotation.total) || 0

  // Registrar visualizacao via endpoint com Service Role
  useEffect(() => {
    if (viewed) return
    const token = new URLSearchParams(window.location.search).get("t")
    if (!token) return
    fetch(`/api/quotes/${token}/view`)
      .then(() => setViewed(true))
      .catch(() => {})
  }, [viewed])

  const formaPagamentoTexto = quotation.forma_pagamento === "pix" ? "PIX (3% de desconto)" : "Cartao de credito"
  const waMsg = `Olá, Discibra! Solicito atendimento para o orçamento *${quotation.codigo}*. Cliente: *${lead.name || "Cliente"}* Total: R$ ${brl(total)} (${formaPagamentoTexto}). Acesse os detalhes: ${SITE.siteUrl}/orcamento/${quotation.codigo}?t=${quotation.token_acesso}`

  const brlFrete = valorFrete === 0 ? "Gratis" : brl(valorFrete)

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E3] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/brand/logo-trim.png" alt="Discibra" width={140} height={40} className="h-9 w-auto object-contain" />
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-[4px] px-3 py-1.5 text-sm text-slate-500 border border-[#E5E5E3] hover:text-slate-800 transition">
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {approved && (
          <div className="mb-6 flex items-center gap-3 rounded-[4px] bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">Orcamento aprovado!</p>
              <p className="text-sm text-emerald-700">
                Nossa equipe entrara em contato para confirmar os detalhes de entrega e pagamento.
              </p>
            </div>
          </div>
        )}

        {/* Titulo */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Package className="h-5 w-5 text-[#C2410C]" />
            <h1 className="text-xl font-bold text-slate-900">Proposta Comercial</h1>
          </div>
          <p className="text-2xl font-black text-[#C2410C]">{quotation.codigo}</p>
          <p className="text-sm text-slate-500 mt-1">Emitida em {fmtDate(quotation.criado_em)}</p>
        </div>

        {/* Dados cliente */}
        {lead.name && (
          <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-4 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cliente</p>
            <p className="font-bold text-slate-900">{lead.name}</p>
            {lead.phone && <p className="text-sm text-slate-600">WhatsApp: {lead.phone}</p>}
            {lead.email && <p className="text-sm text-slate-600">E-mail: {lead.email}</p>}
          </div>
        )}

        {/* Itens */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] overflow-hidden mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-2">Materiais</p>
          <div className="divide-y divide-[#E5E5E3]">
            {items.map((item: any, i: number) => {
              const sub = Number(item.preco_aplicado) * Number(item.quantidade)
              return (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.nome_produto}</p>
                    <p className="text-xs text-slate-500">
                      {Number(item.quantidade).toLocaleString("pt-BR")} {item.unidade} × {brl(item.preco_aplicado)}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{brl(sub)}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Totais */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-4 mb-6">
          <div className="space-y-2 text-sm">
            {descontoPix > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Desconto PIX (3%):</span>
                <span className="text-emerald-600 font-semibold">- {brl(descontoPix)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Frete:</span>
              <span>{brlFrete}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E5E5E3] flex justify-between items-center">
            <span className="text-base font-bold text-slate-900">Total</span>
            <span className="text-2xl font-black text-[#C2410C]">{brl(total)}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {!approved && (
            <button
              className="w-full py-4 bg-[#15803D] text-white font-bold rounded-[4px] text-base transition hover:bg-[#166534] flex items-center justify-center gap-2"
              disabled={false}
            >
              {approved ? "Aprovado" : "Solicitar ajuste pelo WhatsApp"}
            </button>
          )}
          {approved && (
            <button
              className="w-full py-4 bg-[#15803D] text-white font-bold rounded-[4px] text-base transition hover:bg-[#166534] flex items-center justify-center gap-2"
            >
              Falar com atendente pelo WhatsApp
            </button>
          )}
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-[4px] text-base text-center hover:bg-[#1fba58] transition flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Conversar com Atendente no WhatsApp
          </a>
          <p className="text-center text-xs text-slate-400 mt-8">
            {SITE.legalName} · {SITE.phoneDisplay}
          </p>
        </div>
      </main>
    </div>
  )
}
