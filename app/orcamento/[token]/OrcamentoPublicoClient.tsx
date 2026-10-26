"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, MessageCircle, Printer, Clock, Package } from "lucide-react"
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
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(quotation.status === "approved")
  const lead = quotation.quotation_leads || {}
  const items = (quotation.quotation_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  const subtotalBruto = items.reduce((s: number, i: any) => s + Number(i.unit_price) * Number(i.qty), 0)
  const descontoItens = items.reduce(
    (s: number, i: any) => s + Number(i.unit_price) * Number(i.qty) * (Number(i.discount_pct) / 100),
    0,
  )
  const subtotalLiq = subtotalBruto - descontoItens
  const descontoGlobal = subtotalLiq * (Number(quotation.discount_pct) / 100)
  const frete = Number(quotation.shipping_value) || 0
  const total = subtotalLiq - descontoGlobal + frete

  async function handleApprove() {
    setApproving(true)
    const res = await fetch(`/api/orcamentos/${quotation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    })
    setApproving(false)
    if (res.ok) {
      setApproved(true)
      toast.success("Orçamento aprovado! Entraremos em contato em breve.")
    } else {
      toast.error("Não foi possível aprovar. Contate-nos pelo WhatsApp.")
    }
  }

  const waMsg = `Olá, Discibra! Estou confirmando a aprovação do orçamento *${quotation.code}* no valor de *${brl(total)}*. Podemos avançar?`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/brand/logo-trim.png" alt="Discibra" width={140} height={40} className="h-9 w-auto object-contain" />
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {approved && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">Orçamento aprovado!</p>
              <p className="text-sm text-emerald-700">
                Nossa equipe entrará em contato para confirmar os detalhes de entrega e pagamento.
              </p>
            </div>
          </div>
        )}
        {/* Título */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Package className="h-5 w-5 text-[#C2410C]" />
            <h1 className="text-xl font-bold text-slate-900">Proposta Comercial</h1>
          </div>
          <p className="text-2xl font-black text-[#C2410C]">{quotation.code}</p>
          <p className="text-sm text-slate-500 mt-1">Emitida em {fmtDate(quotation.created_at)}</p>
          {quotation.valid_until && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
              <Clock className="h-3 w-3" /> Válida até {fmtDate(quotation.valid_until)}
            </div>
          )}
        </div>
        {/* Dados cliente */}
        {lead.name && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cliente</p>
            <p className="font-bold text-slate-900">{lead.company || lead.name}</p>
            {lead.cpf_cnpj && <p className="text-sm text-slate-600">CPF/CNPJ: {lead.cpf_cnpj}</p>}
            {lead.phone && <p className="text-sm text-slate-600">WhatsApp: {lead.phone}</p>}
            {lead.email && <p className="text-sm text-slate-600">E-mail: {lead.email}</p>}
          </div>
        )}
        {/* Itens */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-5 pt-4 pb-2">
            Materiais
          </p>
          <div className="divide-y divide-slate-100">
            {items.map((item: any, i: number) => {
              const sub = Number(item.unit_price) * Number(item.qty) * (1 - Number(item.discount_pct) / 100)
              return (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.product_name}</p>
                    <p className="text-xs text-slate-500">
                      {Number(item.qty).toLocaleString("pt-BR")} {item.unit} × {brl(item.unit_price)}
                      {Number(item.discount_pct) > 0 ? ` (−${item.discount_pct}%)` : ""}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{brl(sub)}</p>
                </div>
              )
            })}
          </div>
        </div>
        {/* Totais */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="space-y-2 text-sm">
            {descontoItens > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Desconto nos itens:</span>
                <span className="text-emerald-600 font-semibold">− {brl(descontoItens)}</span>
              </div>
            )}
            {Number(quotation.discount_pct) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Desconto geral ({quotation.discount_pct}%):</span>
                <span className="text-emerald-600 font-semibold">− {brl(descontoGlobal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Frete:</span>
              <span>{frete > 0 ? brl(frete) : "A calcular"}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-base font-bold text-slate-900">Total</span>
            <span className="text-2xl font-black text-[#C2410C]">{brl(total)}</span>
          </div>
        </div>
        {/* Pagamento */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">
            Formas de pagamento
          </p>
          <div className="flex flex-wrap gap-2">
            {["💵 PIX", "💳 12x no cartão", "🔗 Link de pagamento"].map((p) => (
              <span key={p} className="bg-white text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-300">
                {p}
              </span>
            ))}
          </div>
          {quotation.payment_terms && quotation.payment_terms !== "A definir pelo atendente" && (
            <p className="mt-3 text-sm text-emerald-800 italic">{quotation.payment_terms}</p>
          )}
        </div>
        {/* Observações */}
        {quotation.notes_client && (
          <div className="bg-slate-100 rounded-xl p-5 mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Observações</p>
            <p className="text-sm text-slate-700">{quotation.notes_client}</p>
          </div>
        )}
        {/* CTAs */}
        {!approved && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full py-4 bg-[#C2410C] text-white font-bold rounded-xl text-base hover:bg-[#9a3409] transition disabled:opacity-60"
            >
              {approving ? "Aprovando..." : "✅ Aprovar este orçamento"}
            </button>
            <a
              href={waLink(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl text-base text-center hover:bg-[#1fba58] transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-5 w-5" /> Solicitar ajuste pelo WhatsApp
            </a>
          </div>
        )}
        {approved && (
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl text-base text-center flex items-center justify-center gap-2 hover:bg-[#1fba58] transition"
          >
            <MessageCircle className="h-5 w-5" /> Falar com atendente pelo WhatsApp
          </a>
        )}
        <p className="text-center text-xs text-slate-400 mt-8">
          {SITE.legalName} · CNPJ 59.566.414/0001-25 · {SITE.phoneDisplay}
        </p>
      </main>
    </div>
  )
}
