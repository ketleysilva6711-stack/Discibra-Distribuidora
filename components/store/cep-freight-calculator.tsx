"use client"

import { useState } from "react"
import { Search, Truck, AlertCircle, CheckCircle2 } from "lucide-react"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { cn } from "@/lib/utils"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

type CepFreightCalculatorProps = {
  productName: string
  productSku?: string
}

const PRIORITY_CITIES = [
  "Ribeirão Preto",
  "Sertãozinho",
  "Cravinhos",
  "Jardinópolis",
  "Brodowski",
  "Batatais",
]

export default function CepFreightCalculator({
  productName,
  productSku,
}: CepFreightCalculatorProps) {
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState<{ cep: string; logradouro: string; bairro: string; localidade: string; uf: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 8) val = val.slice(0, 8)
    if (val.length > 5) {
      val = `${val.slice(0, 5)}-${val.slice(5, 8)}`
    }
    setCep(val)
  }

  const cleanCep = cep.replace(/\D/g, "")

  const isPriorityCity = address
    ? PRIORITY_CITIES.some((c) => c.toLowerCase() === address.localidade.toLowerCase())
    : false

  const handleCalculate = async () => {
    if (cleanCep.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos.")
      setAddress(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/cep?cep=${cleanCep}`)
      const data = await res.json()

      if (data.erro || !data.localidade) {
        setError("CEP não encontrado. Verifique e tente novamente.")
        setAddress(null)
        return
      }

      setAddress({
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      })
    } catch {
      setError("Não foi possível consultar o CEP. Tente novamente em instantes.")
      setAddress(null)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    if (!address) return
    const cidadeUf = `${address.localidade}/${address.uf}`
    const text = `Olá! Gostaria de cotar o frete de ${productName} para o CEP ${address.cep} (${cidadeUf}). Como funciona a entrega?`
    const url = waLink(text)
    trackWhatsAppClick("cep_freight_calculator")
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-4 h-4 text-[#002D5B] shrink-0" />
        <h3 className="text-[13px] sm:text-base font-black text-slate-900 tracking-tight">
          Simular Frete e Prazo por CEP
        </h3>
      </div>
      <p className="text-[11px] sm:text-sm text-slate-500 mb-6">
        Consulte a rota de entrega para sua obra na região de Ribeirão Preto.
      </p>

      {/* Formulário CEP */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={cep}
              onChange={handleCepChange}
              maxLength={10}
              placeholder="00000-000"
              disabled={loading}
              className={cn(
                "w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-base font-mono font-medium text-slate-900 outline-none",
                "transition-all focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B]",
                loading ? "opacity-70 cursor-not-allowed" : ""
              )}
            />
          </div>
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading || cleanCep.length < 8}
          className={cn(
            "flex items-center justify-center gap-2 h-12 px-6 rounded-lg",
            "bg-[#002D5B] hover:bg-[#001D3D] text-white font-bold text-sm tracking-wide transition-colors whitespace-nowrap",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculando…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Calcular Frete
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50">
          <AlertCircle className="w-4 h-4 text-slate-600 fill-current shrink-0" />
          <span className="text-[11px] font-bold text-slate-700">{error}</span>
        </div>
      )}

      {address && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            isPriorityCity
              ? "border border-emerald-100 bg-emerald-50"
              : "border border-slate-100 bg-slate-50"
          )}>
            {isPriorityCity ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-current shrink-0" />
            ) : (
              <Truck className="w-4 h-4 text-[#002D5B] fill-current shrink-0" />
            )}
            <div>
              <p className={cn(
                "font-bold text-slate-900 leading-tight",
                isPriorityCity ? "text-emerald-800" : "text-slate-700"
              )}>
                {isPriorityCity
                  ? `✓ Rota direta para ${address.localidade} - ${address.uf}. Entregas diárias com frota própria.`
                  : `Rota sob consulta para ${address.localidade} - ${address.uf}.`}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {address.logradouro}, {address.bairro} — CEP {address.cep}
              </p>
            </div>
          </div>

          {isPriorityCity && (
            <button
              onClick={handleWhatsApp}
              className={cn(
                "flex items-center justify-center gap-2 h-11 px-5 rounded-lg",
                "bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm transition-colors whitespace-nowrap inline-flex touch-manipulation",
                "btn-whatsapp-track"
              )}
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="cep_freight_calculator"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
              Solicitar Frete pelo WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  )
}
