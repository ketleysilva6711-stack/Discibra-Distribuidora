"use client"

import { useState, useEffect } from "react"
import { Search, Truck, AlertCircle, CheckCircle2 } from "lucide-react"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { cn } from "@/lib/utils"

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

  // Máscara de CEP: 00000-000
  useEffect(() => {
    let value = cep.replace(/\D/g, "")
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5, 8)}`
    }
    setCep(value)
  }, [cep])

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
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
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
    <section className="w-full max-w-4xl mx-auto py-16 sm:py-20 lg:py-24">
      <div className="mb-10 text-center sm:mb-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C2410C]/20 bg-[#C2410C]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#C2410C]">
          <Search className="h-3.5 w-3.5" /> Consulta de Frete por CEP
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Consulte o frete para sua cidade
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 leading-relaxed sm:text-lg">
          Informe seu CEP para saber se atendemos sua região com entrega rápida e descarregamento na obra.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Input CEP */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              CEP de entrega
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={10}
                placeholder="00000-000"
                disabled={loading}
                className={cn(
                  "w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 outline-none",
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
              "flex items-center justify-center gap-2 h-12 px-6 rounded-xl",
              "bg-[#002D5B] text-white text-sm font-black uppercase tracking-widest",
              "transition-all hover:bg-[#013a75] active:scale-95 shadow-md shadow-[#002D5B]/25",
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
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 fill-current shrink-0" />
            <span className="text-[11px] font-bold text-red-700">{error}</span>
          </div>
        )}

        {address && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            {/* Resultado da consulta */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              isPriorityCity
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-slate-50 border border-slate-200"
            )}>
              {isPriorityCity ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-current shrink-0" />
              ) : (
                <Truck className="w-5 h-5 text-[#C2410C] fill-current shrink-0" />
              )}
              <div>
                <p className={cn(
                  "font-bold text-slate-900 leading-tight",
                  isPriorityCity ? "text-emerald-800" : "text-slate-700"
                )}>
                  {isPriorityCity
                    ? `✓ Atendemos ${address.localidade}/${address.uf} com frete rápido e descarregamento na obra.`
                    : `Atendemos ${address.localidade}/${address.uf} sob consulta de rota e carga.`}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {address.logradouro}, {address.bairro} — CEP {address.cep}
                </p>
              </div>
            </div>

            {/* CTA dinâmico WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className={cn(
                "flex items-center justify-center gap-2 w-full h-12 rounded-xl",
                "bg-[#25D366] text-white text-sm font-black uppercase tracking-widest",
                "transition-all hover:bg-[#1EBE5B] active:scale-95 shadow-md shadow-[#25D366]/30",
                "btn-whatsapp-track"
              )}
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-source="cep_freight_calculator"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Falar pelo WhatsApp sobre o frete
            </button>

            <p className="mt-2 text-[10px] text-slate-400 text-center">
              A mensagem será pré-formatada com o produto e o CEP informado.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
