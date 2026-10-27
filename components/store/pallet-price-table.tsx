"use client"

import { Truck, ShieldCheck, Zap } from "lucide-react"
import { waLink } from "@/lib/site-config"
import { cn } from "@/lib/utils"

type PalletPriceTableProps = {
  unitPrice: number
}

export default function PalletPriceTable({ unitPrice }: PalletPriceTableProps) {
  const price = Number(unitPrice || 0)

  // Palete Fechado (40 sacos) — 3% de desconto
  const paleteQtd = 40
  const paleteDesconto = 0.97
  const paleteTotal = price * paleteQtd * paleteDesconto
  const paleteUnit = paleteTotal / paleteQtd
  const paleteEconomiaTotal = price * paleteQtd - paleteTotal

  // Carga Fechada (560 sacos) — 7% de desconto
  const cargaQtd = 560
  const cargaDesconto = 0.93
  const cargaTotal = price * cargaQtd * cargaDesconto
  const cargaUnit = cargaTotal / cargaQtd
  const cargaEconomiaTotal = price * cargaQtd - cargaTotal

  const fmt = (v: number) =>
    Number(v || 0).toFixed(2).replace(".", ",")

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* ── Coluna 1: Avulso ── */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Venda Avulsa
            </span>
          </div>
          <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-6">
            1 Saco (50kg)
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-500">R$</span>
            <p className="text-3xl font-black text-[#002D5B] tracking-tight leading-none">
              {fmt(price)}
            </p>
            <span className="text-xs font-bold text-slate-400 self-end">/saco</span>
          </div>
          <p className="mt-6 text-[11px] text-slate-500 leading-relaxed">
            Para pequenos reparos ou amostra de qualidade.
          </p>
        </div>

        {/* ── Coluna 2: Palete Fechado ── */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r p-6 sm:p-8 bg-slate-50/70">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Econ. de 3%
            </span>
          </div>
          <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Palete Fechado
          </h3>
          <p className="text-[11px] font-medium text-slate-600 mb-4">
            40 un · 2.000 kg
          </p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm font-bold text-slate-500">R$</span>
            <p className="text-3xl font-black text-[#002D5B] tracking-tight leading-none">
              {fmt(paleteTotal)}
            </p>
            <span className="text-xs font-bold text-slate-400 self-end">/palete</span>
          </div>
          <div className="mt-4 pb-1 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-600">
              Equivale a <strong>R$ {fmt(paleteUnit)}</strong> por saco
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">
              Você economiza R$ {fmt(paleteEconomiaTotal)} no palete
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 fill-current shrink-0" />
            <span className="text-[10px] font-bold text-emerald-700">
              Munck ou descarga paletizada
            </span>
          </div>
        </div>

        {/* ── Coluna 3: Carga Fechada ── */}
        <div className="flex flex-col p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#002D5B]">
              Melhor preço
            </span>
          </div>
          <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Carga Fechada
          </h3>
          <p className="text-[11px] font-medium text-slate-600 mb-4">
            560 un · Truck
          </p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm font-bold text-slate-500">R$</span>
            <p className="text-3xl font-black text-[#002D5B] tracking-tight leading-none">
              {fmt(cargaTotal)}
            </p>
            <span className="text-xs font-bold text-slate-400 self-end">/carga</span>
          </div>
          <div className="mt-4 pb-1 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-600">
              Equivale a <strong>R$ {fmt(cargaUnit)}</strong> por saco
            </p>
            <p className="mt-0.5 text-[10px] text-[#C2410C] font-medium">
              Você economiza R$ {fmt(cargaEconomiaTotal)} na carga
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#002D5B] fill-current shrink-0" />
            <span className="text-[10px] font-bold text-[#002D5B]">
              Preço direto da fábrica
            </span>
          </div>
        </div>
      </div>

      {/* ── Rodapé da tabela ── */}
      <div className="mt-8 sm:mt-10 rounded-xl border border-t-0 border-slate-100 bg-slate-50 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C2410C] shrink-0" />
          <span className="text-[10px] sm:text-xs font-medium text-slate-600">
            Entrega com caminhão munck ou descarga paletizada direto na obra.
          </span>
        </div>
        <a
          href={waLink("Olá! Gostaria de cotar um palete fechado de cimento. Quais os preços e condições de entrega?")}
          target="_blank"
          rel="noopener noreferrer"
          data-track="btn_whatsapp"
          data-button-name="btn_whatsapp"
          data-source="pallet_price_table"
          className="btn-whatsapp-track inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-5 py-2.5 text-[11px] sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#1EBE5B] active:scale-95 whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Cotar Palete Fechado →
        </a>
      </div>
    </>
  )
}
