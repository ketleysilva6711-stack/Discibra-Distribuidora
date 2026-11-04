"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Printer, CheckCircle2, ExternalLink, Download } from "lucide-react"
import DynamicBrandLogo from "@/components/store/dynamic-brand-logo"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import { SITE, waLink } from "@/lib/site-config"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function formatarTelefone(v: string | null | undefined) {
  if (!v) return "—"
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

export default function OrcamentoPublicoClient({
  orcamento,
}: {
  orcamento: any
}) {
  const [printed, setPrinted] = useState(false)
  const [pdfLib, setPdfLib] = useState<{ ready: boolean; lib: any } | null>(null)
  const proposalRef = useRef<HTMLDivElement>(null)

  const codigo = orcamento.codigo
  const id = orcamento.id
  const tokenAcesso = orcamento.token_acesso
  const items = (orcamento.orcamento_itens || []).sort(
    (a: any, b: any) => Number(a.ordem || 0) - Number(b.ordem || 0),
  )
  const subtotalMateriais = items.reduce((s: number, i: any) => s + Number(i.preco_aplicado) * Number(i.quantidade), 0)
  const descontoPix = Number(orcamento.desconto_pix) || 0
  const valorFrete = Number(orcamento.valor_frete) || 0
  const total = Number(orcamento.total) || 0
  const aprovado = orcamento.status === "aprovado"

  const formaPagamentoTexto =
    orcamento.forma_pagamento === "pix" ? "PIX — 3% de desconto aplicado" : "Cartão de crédito"

  const metodoEntregaLabel = orcamento.metodo_entrega === "retirada" ? "Retirada no CD (Ribeirão Preto)" : null

  const enderecoEntrega =
    orcamento.endereco_logradouro ||
    orcamento.endereco_bairro ||
    orcamento.endereco_cidade
      ? `${orcamento.endereco_logradouro || ""}, ${orcamento.endereco_numero || ""}${
          orcamento.endereco_complemento ? ` - ${orcamento.endereco_complemento}` : ""
        }${orcamento.endereco_bairro ? `, ${orcamento.endereco_bairro}` : ""}${
          orcamento.endereco_cidade ? ` - ${orcamento.endereco_cidade}/${orcamento.endereco_uf}` : ""
        }`.trim()
      : null

  const waMsg = `Olá! Confirmo o orçamento ${codigo} da Discibra.`

  // ── Carrega html2pdf.js dinamicamente via CDN (cliente, sem inflar o worker) ──
  useEffect(() => {
    if (typeof window === "undefined") return
    if (pdfLib?.ready) return
    const script = document.createElement("script")
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
    script.async = true
    script.onload = () => {
      setPdfLib({ ready: true, lib: (window as any).html2pdf })
    }
    document.head.appendChild(script)
    return () => {
      try {
        document.head.removeChild(script)
      } catch {}
    }
  }, [pdfLib?.ready])

  // ── Auto-impressão quando acessado via endpoint /pdf (?print=true) ──
  useEffect(() => {
    const printParam = new URLSearchParams(window.location.search).get("print")
    if (printParam === "true" && !printed) {
      const timer = setTimeout(() => {
        window.print()
        setPrinted(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [printed])

  // ── Download real do PDF timbrado via html2pdf.js ──
  const downloadPDF = () => {
    if (!proposalRef.current) {
      window.print()
      return
    }
    const element = proposalRef.current
    const opt = {
      margin: [10, 12, 10, 12],
      filename: `Orcamento-${codigo}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }
    // Força cores de fundo para impressão/PDF
    ;(window as any).html2pdf()
      .set(opt)
      .from(element)
      .save()
  }

  // ── Dados do PIX ──
  const pixKey = "50.840.428/0001-90"
  const pixName = "DISCIBRA DISTRIBUIDORA DA CONSTRUÇÃO"
  const pixCity = "RIBEIRAO PRETO"
  const pixQR = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PIX%3A${pixKey}%0AValor%3A${total.toFixed(2)}%0A${codigo}`

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900">
      {/* Cabeçalho timbrado oficial */}
      <header className="bg-white border-b border-[#E5E5E3] py-6 px-4 print:border-b-0 print:bg-white">
        <div className="max-w-4xl mx-auto print:max-w-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 print:flex-col print:items-start print:gap-2">
            <div className="flex items-center gap-3 print:flex-col print:items-start print:gap-1">
              <DynamicBrandLogo variant="full" className="h-10 w-auto print:h-8 print:w-auto" />
              <span className="text-xs font-bold text-[#15803D] uppercase tracking-widest print:block print:mt-1">
                Distribuidora da Construção
              </span>
            </div>
            <div className="text-right hidden sm:block print:block print:mt-2 print:text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                DISCIBRA DISTRIBUIDORA DA CONSTRUÇÃO
              </p>
              <p className="text-sm font-medium text-slate-900 print:leading-tight">
                CNPJ: 50.840.428/0001-90 | IE: Isento
              </p>
              <p className="text-sm font-medium text-slate-900">
                Rua Igarapava, 73 — Vila Albertina — Ribeirão Preto / SP
              </p>
              <p className="text-sm font-medium text-slate-900">
                WhatsApp / Vendas: (16) 99644-7972 | contato@discibradistribuidora.com
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        ref={proposalRef}
        className="max-w-4xl mx-auto px-4 py-8 print:max-w-none print:p-4 print:bg-white print:shadow-none print:border-0"
      >
        {/* Linha superior: código + botão baixar/imprimir */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-[#15803D] uppercase tracking-widest print:text-[#15803D]">
              Proposta Comercial
            </p>
            <h1 className="text-3xl font-black text-[#111318] tracking-tight print:text-[#111318]">
              {codigo}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 print:text-slate-500">
              <span>Emitida em {fmtDate(orcamento.criado_em)}</span>
              <span className="text-[#15803D] font-bold print:text-[#15803D]">· Válido por 7 dias</span>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#15803D] bg-white px-3 py-1.5 text-xs font-bold text-[#15803D] hover:bg-[#15803D] hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Baixar PDF / Imprimir
            </button>
          </div>
        </div>

        {/* Dados do cliente */}
        {orcamento.cliente_nome && (
          <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-5 mb-6 print:bg-white print:border-[#E2E8F0]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 print:text-slate-400">
              Dados do Cliente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold print:text-slate-500">Nome</p>
                <p className="font-semibold text-slate-900">{orcamento.cliente_nome}</p>
              </div>
              {orcamento.cliente_telefone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold print:text-slate-500">WhatsApp</p>
                  <p className="font-semibold text-slate-900">{formatarTelefone(orcamento.cliente_telefone)}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase font-semibold print:text-slate-500">
                  Entrega / Retirada
                </p>
                <p className="font-semibold text-slate-900">
                  {enderecoEntrega || metodoEntregaLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold print:text-slate-500">
                  Forma de pagamento
                </p>
                <p className="font-semibold text-slate-900 print:text-[#15803D]">{formaPagamentoTexto}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de materiais */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] overflow-hidden mb-6 print:bg-white print:border-[#E2E8F0]">
          <table className="w-full text-left border-collapse print:border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] print:bg-[#F1F5F9] border-b border-[#E2E8F0] print:border-[#E2E8F0]">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-400">
                  Descrição
                </th>
                <th className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-400 text-center">
                  SKU
                </th>
                <th className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-400 text-center">
                  Qtd
                </th>
                <th className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-400 text-right">
                  Preço Unitário
                </th>
                <th className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-400 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] print:divide-[#E2E8F0]">
              {items.length > 0 ? (
                items.map((item: any, idx: number) => {
                  const sub = Number(item.preco_aplicado) * Number(item.quantidade)
                  return (
                    <tr
                      key={item.id}
                      className={`bg-white ${
                        idx % 2 === 1 ? "bg-[#F8FAFC] print:bg-white" : ""
                      } print:bg-white`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 print:text-slate-800">
                          {item.nome_produto}
                        </p>
                        {item.sku && (
                          <p className="text-xs text-slate-500 mt-0.5 print:text-slate-500">
                            SKU: {item.sku}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <p className="text-xs text-slate-500 font-mono print:text-slate-500">
                          {item.sku || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <p className="text-xs font-semibold text-slate-800 print:text-slate-800">
                          {Number(item.quantidade).toLocaleString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <p className="text-xs font-semibold text-slate-800 font-mono print:text-slate-800">
                          {brl(item.preco_aplicado)}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <p className="text-xs font-bold text-slate-800 font-mono print:text-slate-800">
                          {brl(sub)}
                        </p>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm print:text-slate-400">
                    Nenhum item adicionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo financeiro */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-5 mb-6 print:bg-white print:border-[#E2E8F0]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 print:text-slate-400">
            Resumo Financeiro
          </p>
          <div className="space-y-3 text-sm print:space-y-2">
            <div className="flex justify-between text-slate-600 print:text-slate-600">
              <span>Subtotal dos Materiais</span>
              <span className="font-semibold">{brl(subtotalMateriais)}</span>
            </div>
            {descontoPix > 0 && (
              <div className="flex justify-between text-[#15803D] font-semibold print:text-[#15803D]">
                <span>Desconto PIX</span>
                <span>- {brl(descontoPix)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 print:text-slate-600">
              <span>Frete</span>
              <span>{valorFrete === 0 ? "Grátis" : brl(valorFrete)}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] print:border-t print:border-[#E2E8F0] flex justify-between items-center">
            <span className="text-base font-bold text-slate-900 print:text-slate-900">Total Final</span>
            <span className="text-2xl font-black text-[#15803D] print:text-[#15803D]">{brl(total)}</span>
          </div>
        </div>

        {/* Bloco de pagamento PIX / Chave dinâmica */}
        <div className="bg-[#F0FDF4] rounded-[4px] border border-[#BBF7D0] p-5 mb-8 print:bg-[#F0FDF4] print:border-[#BBF7D0]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 print:text-emerald-800">
                Pagamento PIX — Chave Dinâmica
              </p>
              <p className="text-sm font-mono font-bold text-slate-900 mb-1 print:text-slate-900">
                {pixKey}
              </p>
              <p className="text-xs text-emerald-700 print:text-emerald-700">
                Titular: {pixName} · {pixCity}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:items-end print:flex-col print:items-end">
              <img
                src={pixQR}
                alt="QR Code PIX"
                className="w-24 h-24 print:w-24 print:h-24"
                decoding="async"
              />
              <p className="text-[10px] text-emerald-600 font-semibold text-center print:text-emerald-600">
                Aprox. a carteira digital
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-700 print:text-emerald-700 text-center sm:text-left">
            Envie o comprovante para o WhatsApp (16) 99644-7972 para liberação imediata do carregamento.
          </p>
        </div>

        {/* Botões de ação na tela */}
        <div className="flex flex-col gap-3 print:hidden">
          {!aprovado && (
            <a
              href={waLink(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-[4px] bg-[#15803D] hover:bg-[#166534] text-white font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" /> Confirmar Orçamento no WhatsApp
            </a>
          )}
          {aprovado && (
            <button
              className="w-full h-12 rounded-[4px] bg-[#15803D] text-white font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              disabled
            >
              <CheckCircle2 className="h-5 w-5" /> Aprovado
            </button>
          )}
          <button
            onClick={downloadPDF}
            className="w-full h-12 rounded-[4px] border border-[#E5E5E3] bg-white text-[#111318] font-bold flex items-center justify-center gap-2 transition-colors hover:bg-[#FAFAF9]"
          >
            <Printer className="h-5 w-5" /> Baixar PDF / Imprimir Proposta
          </button>
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-[4px] border border-[#E5E5E3] text-[#111318] font-bold flex items-center justify-center gap-2 transition-colors hover:bg-[#FAFAF9]"
          >
            <ExternalLink className="h-5 w-5" /> Novo Orçamento pelo WhatsApp
          </a>
        </div>

        <p className="text-center text-xs text-slate-400 mt-10 print:mt-8 print:text-slate-400">
          Este orçamento é válido por 7 dias. Discibra Distribuidora — Ribeirão Preto, SP.
        </p>

        {/* Rodapé de impressão com campo de assinatura */}
        <div className="print:block hidden mt-12 pt-8 border-t border-[#E2E8F0]">
          <p className="text-xs text-slate-500 text-center mb-6 print:text-slate-500">
            Proposta emitida por Discibra Distribuidora da Construção · www.discibradistribuidora.com
          </p>
          <div className="flex justify-between items-end max-w-md mx-auto">
            <div className="flex-1 border-b border-slate-300 pb-1 pr-4 print:border-b print:border-slate-300" />
            <p className="text-xs text-slate-500 px-4 print:text-slate-500">Aceite da Proposta:</p>
            <div className="flex-1 border-b border-slate-300 pb-1 pl-4 print:border-b print:border-slate-300" />
            <p className="text-xs text-slate-500 px-4 print:text-slate-500">Data: ___/___/______</p>
          </div>
        </div>
      </main>

      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            header, main, div, table, tr, td, th {
              visibility: visible !important;
            }
            .print\\:max-w-none {
              max-width: none !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
            .print\\:p-4 {
              padding: 1rem !important;
            }
            .print\\:border-0 {
              border: none !important;
            }
            .print\\:border-b-0 {
              border-bottom: none !important;
            }
            .print\\:bg-white {
              background: #ffffff !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:text-slate-400 {
              color: #94a3b8 !important;
            }
            .print\\:text-slate-900 {
              color: #0f172a !important;
            }
            .print\\:text-slate-600 {
              color: #475569 !important;
            }
            .print\\:text-\\[\\#15803D\\] {
              color: #15803D !important;
            }
            .print\\:text-\\[\\#111318\\] {
              color: #111318 !important;
            }
            .print\\:text-\\[\\#F1F5F9\\] {
              background-color: #f1f5f9 !important;
            }
            .print\\:text-emerald-800 {
              color: #065f46 !important;
            }
            .print\\:text-emerald-700 {
              color: #0f766e !important;
            }
            .print\\:text-emerald-600 {
              color: #059669 !important;
            }
            .print\\:border-\\[\\#E2E8F0\\] {
              border-color: #e2e8f0 !important;
            }
            .print\\:border-\\[\\#BBF7D0\\] {
              border-color: #bbf7d0 !important;
            }
            .print\\:border-t {
              border-top-width: 1px !important;
            }
            .print\\:bg-\\[\\#F0FDF4\\] {
              background-color: #f0fdf4 !important;
            }
            .print\\:bg-\\[\\#F8FAFC\\] {
              background-color: #f8fafc !important;
            }
            .print\\:divide-\\[\\#E2E8F0\\] > * + * {
              border-top-color: #e2e8f0 !important;
            }
            .print\\:border-collapse {
              border-collapse: collapse !important;
            }
          }
        `}
      </style>
    </div>
  )
}
