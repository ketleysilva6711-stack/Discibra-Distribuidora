"use client"

export type VolumeUpsellBarProps = {
  totalSacos: number
}

export default function VolumeUpsellBar({ totalSacos }: VolumeUpsellBarProps) {
  let mensagem: string
  let progresso: number
  let cor: string

  if (totalSacos >= 560) {
    mensagem = "Melhor condicao garantida: Preco de Carga Fechada direto da fabrica."
    progresso = 100
    cor = "#15803D"
  } else if (totalSacos >= 40) {
    const faltam = 560 - totalSacos
    mensagem = `Voce garantiu preco de Palete Fechado! Faltam ${faltam} saco${faltam > 1 ? "s" : ""} para preco de Carga Fechada de fabrica.`
    progresso = Math.round((totalSacos / 560) * 100)
    cor = "#15803D"
  } else {
    const faltam = 40 - totalSacos
    mensagem = `Faltam ${faltam} saco${faltam > 1 ? "s" : ""} para atingir o desconto de Palete Fechado (3% OFF).`
    progresso = Math.round((totalSacos / 40) * 100)
    cor = "#F47920"
  }

  return (
    <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Incentivo de Volume
        </span>
      </div>
      <div className="mb-2">
        <p className="text-sm font-bold text-slate-900">{mensagem}</p>
      </div>
      <div className="h-2 w-full rounded-[4px] bg-[#E5E5E3] overflow-hidden">
        <div
          className="h-full rounded-[4px]"
          style={{ width: `${progresso}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  )
}
