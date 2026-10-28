"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BrickWall, Box, Layers, Percent, Sparkles, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

const TILE_PRESETS = [
  { label: "Cerâmica até 45×45 cm (~4 kg/m²)", perM2: 4, type: "AC-I ou AC-II" },
  { label: "Porcelanato até 60×60 cm (~5 kg/m²)", perM2: 5, type: "AC-II ou AC-III" },
  { label: "Grande Formato / Dupla colagem (~7,5 kg/m²)", perM2: 7.5, type: "AC-III Alta Performance" },
  { label: "Piso Sobre Piso / Fachada externa (~8 kg/m²)", perM2: 8, type: "AC-III Especial" },
]
const BRICK_PRESETS: { label: string; perM2: number }[] = [
  { label: "Cerâmico 6 furos (~45 un./m²)", perM2: 45 },
  { label: "Cerâmico 9 furos (~33 un./m²)", perM2: 33 },
  { label: "Bloco de concreto 14×19×39 cm (~13 un./m²)", perM2: 13 },
  { label: "Bloco estrutural 19×19×39 cm (~12,5 un./m²)", perM2: 12.5 },
]
function num(v: string): number {
  const n = parseFloat(v.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}
export default function CalculadoraPage() {
  // ── 1. Argamassa & Rejunte ──
  const [tileArea, setTileArea] = useState("50")
  const [tilePreset, setTilePreset] = useState(1)
  const mortarAndGrout = useMemo(() => {
    const a = num(tileArea)
    if (a <= 0) return { mortarBags: 0, groutBags: 0, totalKg: 0 }
    const preset = TILE_PRESETS[tilePreset] ?? TILE_PRESETS[1]
    const totalKg = a * preset.perM2
    const mortarBags = Math.ceil(totalKg / 20)
    const groutKg = a * 0.35
    const groutBags = Math.ceil(groutKg / 5)
    return { mortarBags, groutBags, totalKg, type: preset.type }
  }, [tileArea, tilePreset])
  // ── 2. Cimento Concreto ──
  const [cementVol, setCementVol] = useState("3")
  const [cementYield, setCementYield] = useState("7")
  const cementBags = useMemo(() => {
    const v = num(cementVol)
    const y = num(cementYield)
    if (v <= 0 || y <= 0) return 0
    return Math.ceil(v * y)
  }, [cementVol, cementYield])
  // ── 3. Tijolos ──
  const [brickArea, setBrickArea] = useState("30")
  const [brickPreset, setBrickPreset] = useState(0)
  const bricks = useMemo(() => {
    const area = num(brickArea)
    const per = BRICK_PRESETS[brickPreset]?.perM2 ?? 45
    if (area <= 0 || per <= 0) return { qty: 0, per }
    return { qty: Math.ceil(area * per), per }
  }, [brickArea, brickPreset])
  // ── 4. Traço de Concreto ──
  const [mixVol, setMixVol] = useState("1")
  const [mixCem, setMixCem] = useState("1")
  const [mixSand, setMixSand] = useState("3")
  const [mixStone, setMixStone] = useState("4")
  const mixParts = useMemo(() => {
    const v = num(mixVol)
    const c = num(mixCem)
    const s = num(mixSand)
    const st = num(mixStone)
    if (v <= 0 || c <= 0 || s <= 0 || st <= 0) return null
    const total = c + s + st
    return {
      cement: (v * c) / total,
      sand: (v * s) / total,
      stone: (v * st) / total,
      bags: Math.ceil(((v * c) / total) * 7),
    }
  }, [mixVol, mixCem, mixSand, mixStone])
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" /> Voltar para o início
      </Link>
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#002D5B]/10 text-[#002D5B] text-xs font-black uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Ferramenta Técnica B2B
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Calculadora de Materiais para Obra
        </h1>
        <p className="text-slate-600 mt-2 text-sm md:text-base leading-relaxed max-w-2xl">
          Calcule a metragem exata da sua obra e envie o volume estimado diretamente para cotação de atacado com a equipe comercial da Discibra.
        </p>
      </div>
      <div className="grid gap-8">
        {/* ── CARD 1: ARGAMASSA E REJUNTE (DESTAQUE) ── */}
        <Card className="rounded-[4px] border-2 border-[#15803D]/40 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-emerald-50/60 pb-3 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg font-black text-slate-900">
              <Layers className="w-5 h-5 text-[#15803D]" />
              Argamassa e Rejunte por Metragem (m²)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tile-area" className="text-xs font-bold text-slate-700">
                  Área do piso / parede (m²) *
                </Label>
                <Input
                  id="tile-area"
                  inputMode="decimal"
                  value={tileArea}
                  onChange={(e) => setTileArea(e.target.value)}
                  className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tile-preset" className="text-xs font-bold text-slate-700">
                  Tipo de Revestimento e Aplicação
                </Label>
                <select
                  id="tile-preset"
                  className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-xs font-medium text-slate-800 outline-none"
                  value={tilePreset}
                  onChange={(e) => setTilePreset(Number(e.target.value))}
                >
                  {TILE_PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Recomendação técnica sugerida:</p>
                  <p className="text-sm font-bold text-slate-900">{mortarAndGrout.type}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500">Volume estimado: </span>
                  <span className="text-base font-bold text-[#15803D]">
                    {mortarAndGrout.mortarBags} sacos de 20kg
                  </span>
                  <span className="text-xs text-slate-500"> + </span>
                  <span className="text-base font-bold text-[#002D5B]">
                    {mortarAndGrout.groutBags} pacotes de rejunte (5kg)
                  </span>
                </div>
              </div>
            </div>
            <a
              href={waLink(`Olá! Utilizei a calculadora da Discibra para uma área de ${tileArea} m² de piso e preciso cotar: ${mortarAndGrout.mortarBags} sacos de Argamassa (${mortarAndGrout.type}) e ${mortarAndGrout.groutBags} pacotes de Rejunte. Qual o valor com entrega na obra?`)}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-source="calc_mortar_grout"
              onClick={() => trackWhatsAppClick("calc_mortar_grout", "/calculadora")}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#15803D] text-xs font-bold text-white transition hover:bg-[#166534] btn-whatsapp-track"
            >
              <MessageCircle className="w-4 h-4" />
              Cotar {mortarAndGrout.mortarBags} Sacos de Argamassa pelo WhatsApp
            </a>
          </CardContent>
        </Card>
        {/* ── CARD 2: CIMENTO PARA CONCRETO ── */}
        <Card className="rounded-[4px] border border-[#E5E5E3] bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <Box className="w-5 h-5 text-[#002D5B]" />
              Cimento por Volume de Concreto (m³)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cement-vol" className="text-xs font-bold text-slate-700">
                  Volume de concreto (m³)
                </Label>
                <Input
                  id="cement-vol"
                  inputMode="decimal"
                  value={cementVol}
                  onChange={(e) => setCementVol(e.target.value)}
                  className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cement-yield" className="text-xs font-bold text-slate-700">
                  Sacos de 50 kg por m³
                </Label>
                <Input
                  id="cement-yield"
                  inputMode="decimal"
                  value={cementYield}
                  onChange={(e) => setCementYield(e.target.value)}
                  className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold"
                />
              </div>
            </div>
            <div className="rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Quantidade calculada:</p>
                <p className="text-lg font-black text-[#002D5B]">
                  {cementBags} sacos de cimento (50 kg)
                  {cementBags >= 40 && (
                    <span className="ml-2 text-xs font-bold text-[#15803D]">
                      ({Math.floor(cementBags / 40)} palete(s) — Qualificado para Preço de Atacado)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <a
              href={waLink(`Olá! Preciso de ${cementBags} sacos de cimento (50kg) para concretar ${cementVol} m³. Qual o preço de atacado e frete para minha obra?`)}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-source="calc_cement"
              onClick={() => trackWhatsAppClick("calc_cement", "/calculadora")}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#15803D] text-xs font-bold text-white transition hover:bg-[#166534] btn-whatsapp-track"
            >
              <MessageCircle className="w-4 h-4" />
              Cotar {cementBags} Sacos de Cimento no WhatsApp
            </a>
          </CardContent>
        </Card>
        {/* ── CARD 3: TIJOLOS E BLOCOS ── */}
        <Card className="rounded-[4px] border border-[#E5E5E3] bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <BrickWall className="w-5 h-5 text-[#002D5B]" />
              Tijolos e Blocos por Parede (m²)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brick-area" className="text-xs font-bold text-slate-700">
                  Área total da parede (m²)
                </Label>
                <Input
                  id="brick-area"
                  inputMode="decimal"
                  value={brickArea}
                  onChange={(e) => setBrickArea(e.target.value)}
                  className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brick-preset" className="text-xs font-bold text-slate-700">
                  Tipo de Bloco / Tijolo
                </Label>
                <select
                  id="brick-preset"
                  className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-xs font-medium text-slate-800 outline-none"
                  value={brickPreset}
                  onChange={(e) => setBrickPreset(Number(e.target.value))}
                >
                  {BRICK_PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Quantidade estimada:</p>
                <p className="text-lg font-black text-slate-900">
                  {bricks.qty.toLocaleString("pt-BR")} unidades
                  <span className="text-xs text-slate-500 font-normal ml-2">({bricks.per} un/m²)</span>
                </p>
              </div>
            </div>
            <a
              href={waLink(`Olá! Calculei que preciso de ${bricks.qty} unidades de blocos/tijolos para uma parede de ${brickArea} m². Vocês têm pronta entrega e preço de milheiro?`)}
              target="_blank"
              rel="noopener noreferrer"
              data-track="btn_whatsapp"
              data-source="calc_bricks"
              onClick={() => trackWhatsAppClick("calc_bricks", "/calculadora")}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#15803D] text-xs font-bold text-white transition hover:bg-[#166534] btn-whatsapp-track"
            >
              <MessageCircle className="w-4 h-4" />
              Cotar {bricks.qty.toLocaleString("pt-BR")} Unidades pelo WhatsApp
            </a>
          </CardContent>
        </Card>
        {/* ── CARD 4: TRAÇO DE CONCRETO ── */}
        <Card className="rounded-[4px] border border-[#E5E5E3] bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <Percent className="w-5 h-5 text-[#002D5B]" />
              Traço de Concreto em Obra (Proporções)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mix-vol" className="text-xs font-bold text-slate-700">
                  Volume (m³)
                </Label>
                <Input id="mix-vol" inputMode="decimal" value={mixVol} onChange={(e) => setMixVol(e.target.value)} className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mix-c" className="text-xs font-bold text-slate-700">
                  Cimento
                </Label>
                <Input id="mix-c" inputMode="decimal" value={mixCem} onChange={(e) => setMixCem(e.target.value)} className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mix-s" className="text-xs font-bold text-slate-700">
                  Areia
                </Label>
                <Input id="mix-s" inputMode="decimal" value={mixSand} onChange={(e) => setMixSand(e.target.value)} className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mix-st" className="text-xs font-bold text-slate-700">
                  Brita
                </Label>
                <Input id="mix-st" inputMode="decimal" value={mixStone} onChange={(e) => setMixStone(e.target.value)} className="rounded-[4px] border-[#E5E5E3] h-10 text-sm font-semibold" />
              </div>
            </div>
            {mixParts && (
              <div className="rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] p-4 space-y-1.5 text-xs text-slate-700">
                <p>
                  Volume aproximado de cimento: <strong className="text-slate-900">{mixParts.cement.toFixed(3)} m³</strong> · Areia: <strong>{mixParts.sand.toFixed(3)} m³</strong> · Brita: <strong>{mixParts.stone.toFixed(3)} m³</strong>
                </p>
                <p className="text-sm font-black text-[#002D5B] pt-1">
                  Referência: {mixParts.bags} sacos de cimento (50 kg)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}