"use client"

import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"

export type CartItemRowProps = {
  id: string
  name: string
  sku: string | null
  image_url: string | null
  unit: string
  quantidade: number
  preco_tabela: number
  preco_aplicado: number
  tipo_preco: string
  subtotal: number
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
}

export default function CartItemRow({
  id,
  name,
  sku,
  image_url,
  unit,
  quantidade,
  preco_tabela,
  preco_aplicado,
  tipo_preco,
  subtotal,
  onUpdateQty,
  onRemove,
}: CartItemRowProps) {
  const badgeLabel =
    tipo_preco === "palete"
      ? "Palete Fechado (3% OFF)"
      : tipo_preco === "carga_fechada"
        ? "Carga Fechada de Fabrica"
        : "Preco Avulso"

  const badgeColor =
    tipo_preco === "palete"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tipo_preco === "carga_fechada"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-[#FAFAF9] text-slate-600 border-[#E5E5E3]"

  const brl = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  return (
    <div className="flex items-center gap-3 rounded-[4px] border border-[#E5E5E3] bg-white p-3 sm:p-4">
      {image_url ? (
        <Image
          src={image_url.trim()}
          alt={name}
          width={80}
          height={80}
          className="h-16 w-16 shrink-0 rounded-[4px] object-contain sm:h-20 sm:w-20"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] bg-[#FAFAF9] sm:h-20 sm:w-20">
          <Trash2 className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${badgeColor}`}>
            {badgeLabel}
          </span>
          {sku && (
            <span className="text-[10px] text-slate-400 font-medium">Cod. {sku}</span>
          )}
        </div>
        <div className="line-clamp-2 text-sm font-semibold text-[#111318]">{name}</div>
        <p className="text-sm font-medium text-slate-500 mt-1">
          R$ {brl(preco_aplicado)}/{unit}
        </p>
      </div>
      <div className="flex shrink-0 items-center overflow-hidden rounded-[4px] border border-[#E5E5E3]">
        <button
          type="button"
          onClick={() => onUpdateQty(id, -1)}
          className="p-2 text-[#111318] transition hover:bg-[#FAFAF9]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[2rem] px-2 text-center text-sm font-semibold text-[#111318]">
          {quantidade}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQty(id, 1)}
          className="p-2 text-[#111318] transition hover:bg-[#FAFAF9]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="shrink-0 w-24 text-right">
        <p className="font-bold text-sm text-[#111318]">R$ {brl(subtotal)}</p>
        {preco_aplicado < preco_tabela && (
          <p className="text-[10px] text-slate-400 line-through">
            R$ {brl(preco_tabela * quantidade)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="shrink-0 rounded-[4px] p-2 text-slate-500 transition hover:bg-[#FAFAF9] hover:text-[#C2410C]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
