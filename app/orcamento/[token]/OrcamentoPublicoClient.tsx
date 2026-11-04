"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Printer, CheckCircle2, ExternalLink } from "lucide-react"
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

  // Auto-impressão quando a URL contém ?print=true (acessada via endpoint /pdf)
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
                Rua Igarapava, 73 — Vila Albertina, Ribeirão Preto - SP | CNPJ: 50.840.428/0001-90
              </p>
              <p className="text-sm font-medium text-slate-900">
                Atendimento: (16) 99644-7972 | contato@discibradistribuidora.com
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 print:max-w-none print:p-4 print:bg-white print:shadow-none print:border-0">
        {/* Linha superior: código + botão imprimir */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-[#15803D] uppercase tracking-widest print:text-[#15803D]">
              Proposta Comercial
            </p>
            <h1 className="text-3xl font-black text-[#111318] tracking-tight print:text-[#111318]">
              {codigo}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Emitida em {fmtDate(orcamento.criado_em)}</span>
              <span className="text-[#15803D] font-bold">· Válido por 7 dias</span>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#15803D] bg-white px-3 py-1.5 text-xs font-bold text-[#15803D] hover:bg-[#15803D] hover:text-white transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Baixar PDF / Imprimir
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-5 py-3 border-b border-[#E5E5E3] bg-[#F1F5F9] print:bg-[#F1F5F9] print:border-[#E2E8F0]">
            Materiais
          </p>
          <div className="divide-y divide-[#E5E5E3] print:divide-[#E2E8F0]">
            {items.length > 0 ? (
              items.map((item: any, idx: number) => {
                const sub = Number(item.preco_aplicado) * Number(item.quantidade)
                return (
                  <div
                    key={item.id}
                    className={`px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ${
                      idx % 2 === 1 ? "bg-[#F8FAFC]" : ""
                    } print:bg-white`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{item.nome_produto}</p>
                      {item.sku && (
                        <p className="text-xs text-slate-500 mt-0.5 print:text-slate-500">
                          SKU: {item.sku}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 print:text-slate-500">
                        {Number(item.quantidade).toLocaleString("pt-BR")} {item.unidade || "un"} ×{" "}
                        {brl(item.preco_aplicado)}
                      </p>
                    </div>
                    <p className="font-bold text-slate-800 text-right sm:text-right font-mono text-sm">
                      {brl(sub)}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum item adicionado.</div>
            )}
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-5 mb-8 print:bg-white print:border-[#E2E8F0]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 print:text-slate-400">
            Resumo Financeiro
          </p>
          <div className="space-y-3 text-sm print:space-y-2">
            <div className="flex justify-between text-slate-600 print:text-slate-600">
              <span>Subtotal dos Materiais</span>
              <span className="font-semibold">{brl(subtotalMateriais)}</span>
            </div>
            {descontoPix > 0 && (
              <div className="flex justify-between text-[#15803D] print:text-[#15803D]">
                <span>Desconto PIX</span>
                <span className="font-semibold">- {brl(descontoPix)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 print:text-slate-600">
              <span>Frete</span>
              <span>{valorFrete === 0 ? "Grátis" : brl(valorFrete)}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E5E5E3] print:border-t print:border-[#E2E8F0] flex justify-between items-center">
            <span className="text-base font-bold text-slate-900 print:text-slate-900">Total Final</span>
            <span className="text-2xl font-black text-[#15803D] print:text-[#15803D]">{brl(total)}</span>
          </div>
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
            onClick={() => window.print()}
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
          <p className="text-xs text-slate-500 text-center mb-6">
            Proposta emitida por Discibra Distribuidora da Construção · www.discibradistribuidora.com
          </p>
          <div className="flex justify-between items-end max-w-md mx-auto">
            <div className="flex-1 border-b border-slate-300 pb-1 pr-4" />
            <p className="text-xs text-slate-500 px-4">De acordo:</p>
            <div className="flex-1 border-b border-slate-300 pb-1 pl-4" />
            <p className="text-xs text-slate-500 px-4">Data: ___/___/______</p>
          </div>
        </div>
      </main>

      <style>
        {`
          @media print {
            body * { visibility: hidden !important; }
            body, html { background: #ffffff !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            #__next, #__next > div, body > div { visibility: visible !important; position: static !important; width: 100% !important; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:max-w-none { max-width: none !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:p-4 { padding: 1rem !important; }
            .print\\:border-0 { border: none !important; }
            .print\\:border-b-0 { border-bottom: none !important; }
            .print\\:bg-white { background: #ffffff !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:text-slate-400 { color: #94a3b8 !important; }
            .print\\:text-slate-900 { color: #0f172a !important; }
            .print\\:text-slate-600 { color: #475569 !important; }
            .print\\:text-\\[\\#15803D\\] { color: #15803D !important; }
            .print\\:text-\\[\\#111318\\] { color: #111318 !important; }
            .print\\:text-\\[\\#F1F5F9\\] { background-color: #f1f5f9 !important; }
            .print\\:border-\\[\\#E2E8F0\\] { border-color: #e2e8f0 !important; }
            .print\\:border-t { border-top-width: 1px !important; }
            .print\\:border-t-print { border-top-width: 1px !important; }
            .print\\:bg-\\[\\#F8FAFC\\] { background-color: #f8fafc !important; }
            .print\\:divide-\\[\\#E2E8F0\\] > * + * { border-top-color: #e2e8f0 !important; }
            @page { size: A4; margin: 12mm; }
          }
        `}
      </style>
    </div>
  )
}
