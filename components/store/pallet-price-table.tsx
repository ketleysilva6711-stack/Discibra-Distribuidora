"use client"

import { Truck, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type PalletPriceTableProps = {
  unitPrice: number
}

export default function PalletPriceTable({ unitPrice }: PalletPriceTableProps) {
  const price = Number(unitPrice || 0)

  // 1 Saco (50kg)
  const sacoTotal = price
  const sacoUnit = price

  // Palete Fechado (40 sacos) — 3% de desconto
  const paleteQtd = 40
  const paleteDesconto = 0.97
  const paleteTotal = price * paleteQtd * paleteDesconto
  const paleteUnit = paleteTotal / paleteQtd
  const paleteEconomiaUnit = price - paleteUnit

  // Carga Fechada (560 sacos) — 7% de desconto
  const cargaQtd = 560
  const cargaDesconto = 0.93
  const cargaTotal = price * cargaQtd * cargaDesconto
  const cargaUnit = cargaTotal / cargaQtd
  const cargaEconomiaUnit = price - cargaUnit

  const fmt = (v: number) =>
    Number(v || 0).toFixed(2).replace(".", ",")

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ── Coluna 1: 1 Saco ── */}
      <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-slate-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-black">
            1
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Saco Avulso
          </span>
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          1 Saco (50kg)
        </h3>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm font-bold text-slate-500">R$</span>
          <p className="text-3xl font-black text-[#002D5B] tracking-tight leading-none">
            {fmt(sacoTotal)}
          </p>
          <span className="text-xs font-bold text-slate-400 self-end">/saco</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
          Preço avulso ideal para teste de qualidade ou complemento de obra.
        </p>
      </div>

      {/* ── Coluna 2: Palete Fechado ── */}
      <div className="flex flex-col rounded-2xl border border-emerald-200/50 bg-emerald-50 p-6 sm:p-8 shadow-sm transition-all hover:border-emerald-300 relative overflow-hidden group">
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white opacity-60" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
            40
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
            Palete Fechado
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest">
          ECONOMIA DE 3% NO PALETE
        </span>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 mb-2">
          Palete Fechado (40 sacos)
        </h3>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm font-bold text-emerald-700">R$</span>
          <p className="text-3xl font-black text-emerald-800 tracking-tight leading-none">
            {fmt(paleteTotal)}
          </p>
          <span className="text-xs font-bold text-emerald-600 self-end">/palete</span>
        </div>
        <div className="mt-2 pb-1 border-b border-emerald-200">
          <p className="text-xs font-bold text-emerald-600">
            Equivale a <strong>R$ {fmt(paleteUnit)}</strong> por saco
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-500 font-medium">
            Você economiza R$ {fmt(paleteEconomiaUnit)} por saco
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 fill-current" />
          <span className="text-[10px] font-bold text-emerald-700">
            Entrega com Munck ou paletizado
          </span>
        </div>
      </div>

      {/* ── Coluna 3: Carga Fechada ── */}
      <div className="flex flex-col rounded-2xl border border-[#C2410C]/20 bg-[#FDF4EF] p-6 sm:p-8 shadow-sm transition-all hover:border-[#C2410C]/40 relative overflow-hidden group">
        <div className="absolute -top-2 -right-2 bg-[#C2410C] text-white rounded-full p-1 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white opacity-60" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-[#C2410C]/20 flex items-center justify-center text-[#C2410C] font-black">
            560
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C2410C]">
            Carga Fechada
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-[#C2410C]/10 text-[#C2410C] border border-[#C2410C]/30 text-[10px] font-bold uppercase tracking-widest">
          MELHOR PREÇO · DIRETO DA FÁBRICA
        </span>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#C2410C] mb-2">
          Carga Fechada (560 sacos)
        </h3>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm font-bold text-[#C2410C]">R$</span>
          <p className="text-3xl font-black text-[#C2410C] tracking-tight leading-none">
            {fmt(cargaTotal)}
          </p>
          <span className="text-xs font-bold text-[#C2410C] self-end">/carga</span>
        </div>
        <div className="mt-2 pb-1 border-b border-[#C2410C]/30">
          <p className="text-xs font-bold text-[#C2410C]">
            Equivale a <strong>R$ {fmt(cargaUnit)}</strong> por saco
          </p>
          <p className="mt-0.5 text-[10px] text-orange-600 font-medium">
            Você economiza R$ {fmt(cargaEconomiaUnit)} por saco
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C2410C] fill-current" />
          <span className="text-[10px] font-bold text-[#C2410C]">
            Preço direto da fábrica
          </span>
        </div>
      </div>
    </div>

    {/* Nota explicativa */}
    <div className="mt-8 sm:mt-10 rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-slate-900 leading-relaxed">
            Consulte frete com{" "}
            <strong>descarregamento Munck ou paletizado direto no WhatsApp.</strong>
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Preços válidos para pagamento via PIX ou cartão. Sujeito à disponibilidade de estoque e confirmação de rota de entrega para sua região.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
