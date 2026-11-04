"use client"

import Link from "next/link"
import { CheckCircle2, MessageCircle, Download, ExternalLink } from "lucide-react"
import { SITE, waLink } from "@/lib/site-config"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default function OrcamentoPublicoClient({
  orcamento,
}: {
  orcamento: any
}) {
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
    orcamento.forma_pagamento === "pix" ? "PIX (3% de desconto)" : "Cartão de crédito"

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
  const pdfUrl = `/api/orcamentos/${id}/pdf`

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900">
      {/* Cabeçalho timbrado */}
      <header className="bg-white border-b border-[#E5E5E3] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-tight text-[#111318]">DISCIBRA</span>
              <span className="text-xs font-bold text-[#15803D] uppercase tracking-widest">Distribuidora</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rua Igarapava, 73 — Vila Albertina
              </p>
              <p className="text-sm font-medium text-slate-900">Ribeirão Preto, SP · (16) 99644-7972</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Título e código */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#15803D] uppercase tracking-widest">Proposta Comercial</p>
            <h1 className="text-3xl font-black text-[#111318] tracking-tight">{codigo}</h1>
            <p className="text-sm text-slate-500 mt-1">Emitida em {fmtDate(orcamento.criado_em)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#15803D] bg-white px-3 py-1.5 text-xs font-bold text-[#15803D] hover:bg-[#15803D] hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Baixar PDF
            </a>
          </div>
        </div>

        {/* Dados do cliente */}
        {orcamento.cliente_nome && (
          <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-5 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dados do Cliente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Nome</p>
                <p className="font-semibold text-slate-900">{orcamento.cliente_nome}</p>
              </div>
              {orcamento.cliente_telefone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">WhatsApp</p>
                  <p className="font-semibold text-slate-900">{orcamento.cliente_telefone}</p>
                </div>
              )}
              {enderecoEntrega && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Endereço de entrega</p>
                  <p className="font-semibold text-slate-900">{enderecoEntrega}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Forma de pagamento</p>
                <p className="font-semibold text-slate-900">{formaPagamentoTexto}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de itens */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] overflow-hidden mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-5 py-3 border-b border-[#E5E5E3]">
            Itens
          </p>
          <div className="divide-y divide-[#E5E5E3]">
            {items.length > 0 ? (
              items.map((item: any) => {
                const sub = Number(item.preco_aplicado) * Number(item.quantidade)
                return (
                  <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{item.nome_produto}</p>
                      {item.sku && (
                        <p className="text-xs text-slate-500 mt-0.5">SKU: {item.sku}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {Number(item.quantidade).toLocaleString("pt-BR")} {item.unidade || "un"} × {brl(
                          item.preco_aplicado,
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900 text-right sm:text-right">{brl(sub)}</p>
                  </div>
                )
              })
            ) : (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum item adicionado.</div>
            )}
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E3] p-5 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo financeiro</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal de materiais</span>
              <span className="font-semibold">{brl(subtotalMateriais)}</span>
            </div>
            {descontoPix > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Desconto PIX</span>
                <span className="font-semibold">- {brl(descontoPix)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Frete</span>
              <span>{valorFrete === 0 ? "Grátis" : brl(valorFrete)}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E5E5E3] flex justify-between items-center">
            <span className="text-base font-bold text-slate-900">Total Final</span>
            <span className="text-2xl font-black text-[#15803D]">{brl(total)}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {!aprovado && (
            <a
              href={waLink(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-[4px] bg-[#15803D] text-white font-bold text-base flex items-center justify-center gap-2 transition hover:bg-[#166534] active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" /> Confirmar e Falar no WhatsApp
            </a>
          )}
          {aprovado && (
            <button
              className="w-full py-4 rounded-[4px] bg-[#15803D] text-white font-bold text-base flex items-center justify-center gap-2 transition hover:bg-[#166534] active:scale-[0.98]"
              disabled
            >
              <CheckCircle2 className="h-4 w-4" /> Aprovado
            </button>
          )}
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-[4px] border border-[#E5E5E3] text-[#111318] font-bold text-base flex items-center justify-center gap-2 transition hover:bg-[#FAFAF9]"
          >
            <ExternalLink className="h-4 w-4" /> Novo orçamento pelo WhatsApp
          </a>
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Este orçamento é válido por 7 dias. Discibra Distribuidora — Ribeirão Preto, SP.
        </p>
      </main>
    </div>
  )
}
