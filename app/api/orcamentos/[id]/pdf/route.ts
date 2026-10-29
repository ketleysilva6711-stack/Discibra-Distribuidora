import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"
import { createPublicClient } from "@/lib/supabase/public"
import { SITE } from "@/lib/site-config"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isAdminServer = isAdminServerConfigured()
  const supabase = isAdminServer ? createAdminClient() : createPublicClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("quotations").select("*, quotation_leads(*), quotation_items(*)")
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    query = query.eq("code", id.toUpperCase())
  }
  const { data: q, error } = await query.maybeSingle()
  if (error || !q) return new NextResponse("Orçamento não encontrado.", { status: 404 })
  const items: any[] = (q.quotation_items || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
  const lead: any = q.quotation_leads || {}
  const subtotalMateriais = items.reduce((s: number, i: any) => s + Number(i.unit_price) * Number(i.qty), 0)
  const frete = Number(q.shipping_value) || 0
  const total = subtotalMateriais + frete
  // Cálculo de peso da carga
  let totalKg = 0
  items.forEach((i: any) => {
    const name = (i.product_name || "").toLowerCase()
    const qty = Number(i.qty) || 1
    const match = name.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/)
    if (match) {
      totalKg += parseFloat(match[1].replace(",", ".")) * qty
    } else if (i.unit === "sc" || i.unit === "saco" || name.includes("cimento")) {
      totalKg += 50 * qty
    } else if (name.includes("argamassa")) {
      totalKg += 20 * qty
    }
  })
  const rowsHtml = items
    .map((i: any, idx: number) => {
      const subtotalItem = Number(i.unit_price) * Number(i.qty)
      return `
    <tr>
      <td style="text-align:center;padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;color:#6B7280;">${String(idx + 1).padStart(2, '0')}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:12px;color:#111318;">
        <div style="font-weight:700;">${i.product_name}</div>
        ${i.sku ? `<div style="font-size:10px;color:#6B7280;margin-top:2px;">Código Ref: ${i.sku}</div>` : ""}
      </td>
      <td style="text-align:center;padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;color:#111318;font-weight:600;">${i.unit || "un"}</td>
      <td style="text-align:center;padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:12px;font-weight:800;color:#111318;">${Number(i.qty).toLocaleString("pt-BR")}</td>
      <td style="text-align:right;padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:12px;color:#111318;font-family:monospace;">${brl(i.unit_price)}</td>
      <td style="text-align:right;padding:12px 8px;border-bottom:1px solid #E5E5E3;font-size:12px;font-weight:800;color:#111318;font-family:monospace;">${brl(subtotalItem)}</td>
    </tr>`
    })
    .join("")
  const isPaymentReleased = q.status === "approved" || q.status === "awaiting_payment"
  const customPixKey = q.notes_client && q.notes_client.includes("PIX:") ? q.notes_client.replace("PIX:", "").trim() : null
  const waApprovalText = encodeURIComponent(
    `Olá! Sou ${lead?.name || "cliente"} e formalizo a APROVAÇÃO da Proposta Comercial ${q.code} (Valor: ${brl(total)}). Solicito o procedimento seguro e a chave PIX desta transação para liquidação e reserva da frota.`,
  )
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial ${q.code} — Discibra Distribuidora</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #111318; background: #F5F5F4; }
    
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #111318;
      border-bottom: 2px solid #15803D;
      padding: 12px 20px;
    }
    .action-bar-inner {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-act {
      text-decoration: none;
      padding: 9px 16px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: none;
      transition: background 0.15s;
    }
    .btn-approve { background: #15803D; color: #fff; }
    .btn-approve:hover { background: #166534; }
    .btn-print { background: #27272A; color: #fff; border: 1px solid #3F3F46; }
    .btn-print:hover { background: #3F3F46; }
    .page {
      max-width: 860px;
      margin: 24px auto 40px auto;
      padding: 44px;
      background: #fff;
      border: 1px solid #E5E5E3;
      border-radius: 4px;
      position: relative;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { padding: 0; margin: 0; border: none; max-width: 100%; }
    }
    .header-table { width: 100%; border-bottom: 2px solid #111318; padding-bottom: 18px; margin-bottom: 24px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #111318; letter-spacing: -0.5px; }
    .brand-subtitle { font-size: 11px; color: #6B7280; font-weight: 600; margin-top: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { border: 1px solid #E5E5E3; border-radius: 4px; padding: 14px 16px; background: #FAFAF9; }
    .info-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; letter-spacing: 0.5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
    .info-label { color: #6B7280; }
    .info-val { font-weight: 700; color: #111318; }
    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items-table th { background: #111318; color: #fff; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    
    .totals-area { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 20px; }
    .logistics-card { flex: 1; border: 1px solid #E5E5E3; border-radius: 4px; padding: 14px; background: #FAFAF9; font-size: 11px; }
    .totals-card { width: 340px; border: 2px solid #111318; border-radius: 4px; padding: 16px; background: #FAFAF9; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #6B7280; }
    .total-row.grand { border-top: 2px solid #111318; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #15803D; }
    .security-notice {
      border: 1px solid #E5E5E3;
      border-left: 4px solid #111318;
      border-radius: 4px;
      padding: 16px;
      background: #FAFAF9;
      margin-bottom: 24px;
      font-size: 11px;
      line-height: 1.6;
      color: #4B5563;
    }
    .payment-protocol {
      border: 2px solid #15803D;
      border-radius: 4px;
      padding: 18px;
      background: #F0FDF4;
      margin-bottom: 24px;
    }
    .seal-stamp {
      display: inline-block;
      border: 2px solid #111318;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #111318;
    }
  </style>
</head>
<body>
  <!-- Barra Superior de Ações -->
  <div class="action-bar no-print">
    <div class="action-bar-inner">
      <div style="color:#fff;">
        <span style="color:#9CA3AF;font-size:11px;">PROPOSTA OFICIAL:</span> <strong>${q.code}</strong>
        <span style="margin:0 8px;color:#4B5563;">|</span>
        <span style="color:#34D399;font-weight:800;font-size:15px;">${brl(total)}</span>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="https://wa.me/5516996447972?text=${waApprovalText}" target="_blank" class="btn-act btn-approve">
          🔒 Aprovar Proposta e Solicitar Dados
        </a>
        <button onclick="window.print()" class="btn-act btn-print">
          🖨️ Imprimir / Baixar PDF
        </button>
      </div>
    </div>
  </div>
  <div class="page">
    <!-- Cabeçalho Timbrado Oficial -->
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">DISCIBRA DISTRIBUIDORA</div>
          <div class="brand-subtitle">Distribuição no Atacado — Cimentos, Argamassas e Materiais Básicos</div>
          <div style="font-size:10px;color:#6B7280;margin-top:5px;line-height:1.4;">
            DISCIPRA DISTRIBUIDORA DA CONSTRUÇÃO LTDA · CNPJ: 59.566.414/0001-25<br>
            Centro de Distribuição: Rua Igarapava, 73 — Vila Albertina, Ribeirão Preto/SP · CEP 14060-000
          </div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:16px;font-weight:800;color:#111318;letter-spacing:-0.5px;">PROPOSTA COMERCIAL</div>
          <div style="font-size:14px;font-weight:800;font-family:monospace;color:#15803D;margin-top:2px;">${q.code}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:4px;">Emissão: <strong>${fmtDate(q.created_at)}</strong></div>
          <div style="font-size:10px;color:#C2410C;font-weight:700;">Validade: ${fmtDate(q.valid_until)}</div>
        </td>
      </tr>
    </table>
    <!-- Informações do Cliente e da Operação -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-title">1. Identificação do Cliente / Obra</div>
        <div class="info-row">
          <span class="info-label">Destinatário / Obra:</span>
          <span class="info-val">${lead?.name || "Cliente Final"}</span>
        </div>
        ${lead?.company ? `<div class="info-row"><span class="info-label">Empresa / Razão Social:</span><span class="info-val">${lead.company}</span></div>` : ""}
        ${lead?.cpf_cnpj ? `<div class="info-row"><span class="info-label">CPF / CNPJ:</span><span class="info-val">${lead.cpf_cnpj}</span></div>` : ""}
        <div class="info-row">
          <span class="info-label">Contato WhatsApp:</span>
          <span class="info-val">${lead?.phone || "Não informado"}</span>
        </div>
      </div>
      <div class="info-box">
        <div class="info-title">2. Condições da Distribuidora</div>
        <div class="info-row">
          <span class="info-label">Fornecedor:</span>
          <span class="info-val">Discibra Distribuidora</span>
        </div>
        <div class="info-row">
          <span class="info-label">Logística / Entrega:</span>
          <span class="info-val">Frota Própria com Descarga</span>
        </div>
        <div class="info-row">
          <span class="info-label">Faturamento:</span>
          <span class="info-val">${q.payment_terms || "À vista na autorização / Faturado PJ"}</span>
        </div>
      </div>
    </div>
    <!-- Tabela de Materiais -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">#</th>
          <th style="text-align:left;">Descrição Técnica do Material</th>
          <th style="width:50px;text-align:center;">Un.</th>
          <th style="width:70px;text-align:center;">Qtd</th>
          <th style="width:110px;text-align:right;">Preço Unit.</th>
          <th style="width:120px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <!-- Totais e Logística -->
    <div class="totals-area">
      <div class="logistics-card">
        <p style="font-weight:800;color:#111318;margin-bottom:4px;text-transform:uppercase;font-size:10px;">Especificação da Carga:</p>
        <p style="color:#4B5563;margin-bottom:2px;">
          • Peso Total Estimado: <strong>${totalKg >= 1000 ? (totalKg/1000).toFixed(1) + ' toneladas' : totalKg.toLocaleString('pt-BR') + ' kg'}</strong>
        </p>
        <p style="color:#4B5563;margin-bottom:2px;">• Modalidade: Descarga Paletizada inclusa no local de descarga indicado pela obra.</p>
        <p style="color:#4B5563;">• Conformidade: Material normatizado ABNT NBR 16697 com laudo de qualidade emitido pelo fabricante.</p>
      </div>
      <div class="totals-card">
        <div class="total-row">
          <span>Subtotal dos Materiais:</span>
          <span style="font-family:monospace;font-weight:700;color:#111318;">${brl(subtotalMateriais)}</span>
        </div>
        <div class="total-row">
          <span>Frete e Descarga na Obra:</span>
          <span style="font-family:monospace;font-weight:700;color:#111318;">${frete > 0 ? brl(frete) : "Incluso na Carga"}</span>
        </div>
        <div class="total-row grand">
          <span style="color:#111318;">Total da Proposta:</span>
          <span style="font-family:monospace;">${brl(total)}</span>
        </div>
      </div>
    </div>
    <!-- BLOCO DE SEGURANÇA E PAGAMENTO DINÂMICO -->
    ${isPaymentReleased && customPixKey ? `
      <div class="payment-protocol">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#15803D;letter-spacing:0.5px;">
            ✓ PROTOCOLO SEGURO DE LIQUIDAÇÃO LIBERADO
          </span>
          <span class="seal-stamp" style="border-color:#15803D;color:#15803D;">LOTE RESERVADO NO CD</span>
        </div>
        <p style="font-size:11px;color:#166534;margin-bottom:8px;">
          Os dados de faturamento para esta transação específica foram autorizados pelo Departamento Financeiro da Discibra:
        </p>
        <div style="background:#fff;border:1px solid #BBF7D0;border-radius:4px;padding:12px;margin-bottom:10px;">
          <div style="font-size:10px;color:#6B7280;margin-bottom:2px;">CHAVE PIX EXCLUSIVA PARA ESTA OPERAÇÃO:</div>
          <div style="font-size:14px;font-family:monospace;font-weight:800;color:#111318;user-select:all;" id="pixKeyText">${customPixKey}</div>
        </div>
        <p style="font-size:10px;color:#4B5563;">
          Após a efetivação, anexe o comprovante pelo botão superior ou diretamente no WhatsApp do atendente responsável para emissão de NF-e e agendamento da frota.
        </p>
      </div>
    ` : `
      <div class="security-notice">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="color:#111318;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;">
            Procedimento Seguro de Faturamento &amp; Bloqueio de Lote:
          </strong>
          <span class="seal-stamp">COTADO PELO CD</span>
        </div>
        <p style="margin-bottom:6px;">
          • Por política de segurança patrimonial e conformidade fiscal, <strong>a Discibra não disponibiliza dados bancários públicos nem chaves estáticas</strong> em orçamentos prévios.
        </p>
        <p style="margin-bottom:6px;">
          • A chave PIX ou o boleto faturado para esta operação é gerado e validado individualmente pelo Departamento Financeiro <strong>exclusivamente após a autorização formal desta proposta pelo cliente</strong>.
        </p>
        <p>
          • Para confirmar o pedido e solicitar os dados de liquidação com reserva física da carga, utilize o botão <strong>"Aprovar Proposta e Solicitar Dados"</strong> acima.
        </p>
      </div>
    `}
    <!-- Rodapé Institucional -->
    <div style="border-top:1px solid #E5E5E3;padding-top:16px;text-align:center;font-size:10px;color:#9CA3AF;">
      DISCIPRA DISTRIBUIDORA DA CONSTRUÇÃO LTDA · Central de Televendas: (16) 99644-7972 · Ribeirão Preto/SP<br>
      Este documento possui validade comercial até ${fmtDate(q.valid_until)} ou término dos lotes disponíveis no Centro de Distribuição.
    </div>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
