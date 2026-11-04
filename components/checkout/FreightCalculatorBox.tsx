"use client"

import { Search, Truck, AlertCircle, CheckCircle2, MapPin } from "lucide-react"

export type FreightCalculatorBoxProps = {
  cep: string
  onCepChange: (cep: string) => void
  onCalculate: () => void
  loading: boolean
  resultadoFrete: {
    valorFrete: number
    freteAConfirmar: boolean
    requerMunck: boolean
    sugerirRetirada: boolean
    distanciaKm: number
    pesoTotalKg: number
  } | null
  metodoEntrega: "entrega" | "retirada"
  onMetodoChange: (metodo: "entrega" | "retirada") => void
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function FreightCalculatorBox({
  cep,
  onCepChange,
  onCalculate,
  loading,
  resultadoFrete,
  metodoEntrega,
  onMetodoChange,
}: FreightCalculatorBoxProps) {
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 8) val = val.slice(0, 8)
    if (val.length > 5) val = `${val.slice(0, 5)}-${val.slice(5, 8)}`
    onCepChange(val)
  }

  const cleanCep = cep.replace(/\D/g, "")

  return (
    <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-4 h-4 text-[#15803D] shrink-0" />
        <h3 className="text-sm font-bold text-slate-900">Frete e Entrega</h3>
      </div>

      {/* Metodo de entrega */}
      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer flex-1">
          <input
            type="radio"
            checked={metodoEntrega === "entrega"}
            onChange={() => onMetodoChange("entrega")}
            className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
          />
          <span className="text-sm font-medium text-slate-700">
            Entrega no Endereco (com descarga)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer flex-1">
          <input
            type="radio"
            checked={metodoEntrega === "retirada"}
            onChange={() => onMetodoChange("retirada")}
            className="rounded-slate-900 text-[#15803D] focus:ring-[#15803D]"
          />
          <span className="text-sm font-medium text-slate-700">
            Retirada no CD (Ribeirao Preto - Gratis)
          </span>
        </label>
      </div>

      {metodoEntrega === "entrega" && (
        <>
          {/* Campo CEP */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={cep}
              onChange={handleCepChange}
              maxLength={10}
              placeholder="00000-000"
              disabled={loading}
              className={`w-full h-12 pl-10 pr-4 rounded-[4px] border border-[#E5E5E3] bg-white text-base font-mono font-medium text-slate-900 outline-none focus:border-[#15803D] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <button
            type="button"
            onClick={onCalculate}
            disabled={loading || cleanCep.length !== 8}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[4px] bg-[#15803D] hover:bg-[#166534] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Calculando..." : "Calcular Frete"}
          </button>
        </>
      )}

      {resultadoFrete && (
        <div className="mt-4 pt-4 border-t border-[#E5E5E3] space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Distancia</span>
            <span className="font-semibold text-slate-900">
              {resultadoFrete.distanciaKm} km
            </span>
          </div>

          {resultadoFrete.requerMunck && (
            <div className="flex items-center gap-2 p-2 rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] text-[11px] text-slate-600">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>Munck necessario para carga acima de 2 paletes (acima de 4.000 kg)</span>
            </div>
          )}

          {resultadoFrete.freteAConfirmar && (
            <div className="flex items-center gap-2 p-2 rounded-[4px] bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>
                Devido a distancia ou volume, o valor do frete sera confirmado pelo atendente.
              </span>
            </div>
          )}

          {resultadoFrete.sugerirRetirada && !resultadoFrete.freteAConfirmar && (
            <div className="flex items-center gap-2 p-2 rounded-[4px] bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>
                O frete excede 12% do subtotal. Considere retirar direto no CD em Ribeirao Preto/SP.
              </span>
            </div>
          )}

          {!resultadoFrete.freteAConfirmar && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Valor do Frete</span>
              <span className="font-black text-slate-900">
                {resultadoFrete.valorFrete === 0 ? "Gratis" : `R$ ${brl(resultadoFrete.valorFrete)}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
