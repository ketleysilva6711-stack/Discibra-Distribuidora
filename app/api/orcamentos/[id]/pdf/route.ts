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
  const rowsHtml = items
    .map((i: any, idx: number) => {
      const subtotalItem = Number(i.unit_price) * Number(i.qty)
      return `
    <tr>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;color:#6B7280;">${idx + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:12px;color:#111318;">
        <div style="font-weight:700;">${i.product_name}</div>
        ${i.sku ? `<div style="font-size:10px;color:#6B7280;">SKU: ${i.sku}</div>` : ""}
      </td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;color:#111318;">${i.unit || "un"}</td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;font-weight:700;color:#111318;">${Number(i.qty).toLocaleString("pt-BR")}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;color:#111318;font-family:monospace;">${brl(i.unit_price)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E5E3;font-size:11px;font-weight:700;color:#111318;font-family:monospace;">${brl(subtotalItem)}</td>
    </tr>`
    })
    .join("")
  const waApprovalText = encodeURIComponent(
    `Olá! Recebi a Proposta Comercial ${q.code} da Discibra no valor de ${brl(total)} e confirmo a aprovação para faturamento e entrega!`,
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
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: none;
    }
    .btn-approve { background: #15803D; color: #fff; }
    .btn-approve:hover { background: #166534; }
    .btn-print { background: #27272A; color: #fff; border: 1px solid #3F3F46; }
    .btn-print:hover { background: #3F3F46; }
    .page {
      max-width: 860px;
      margin: 24px auto 40px auto;
      padding: 40px;
      background: #fff;
      border: 1px solid #E5E5E3;
      border-radius: 4px;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { padding: 0; margin: 0; border: none; max-width: 100%; }
    }
    .header-table { width: 100%; border-bottom: 2px solid #111318; padding-bottom: 16px; margin-bottom: 24px; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111318; letter-spacing: -0.5px; }
    .brand-subtitle { font-size: 11px; color: #6B7280; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { border: 1px solid #E5E5E3; border-radius: 4px; padding: 14px; background: #FAFAF9; }
    .info-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; letter-spacing: 0.5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
    .info-label { color: #6B7280; }
    .info-val { font-weight: 700; color: #111318; }
    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items-table th { background: #111318; color: #fff; padding: 9px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    .totals-area { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-card { width: 320px; border: 1px solid #E5E5E3; border-radius: 4px; padding: 14px; background: #FAFAF9; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #6B7280; }
    .total-row.grand { border-top: 2px solid #111318; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 800; color: #15803D; }
    .terms-box { border: 1px solid #E5E5E3; border-radius: 4px; padding: 14px; background: #FAFAF9; font-size: 11px; color: #6B7280; line-height: 1.5; }
    .terms-box strong { color: #111318; }
  </style>
</head>
<body>
  <!-- Barra Superior -->
  <div class="action-bar no-print">
    <div class="action-bar-inner">
      <div style="color:#fff;">
        <span style="color:#9CA3AF;font-size:11px;">PROPOSTA:</span> <strong>${q.code}</strong>
        <span style="margin:0 8px;color:#4B5563;">|</span>
        <span style="color:#34D399;font-weight:800;font-size:14px;">${brl(total)}</span>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="https://wa.me/5516996447972?text=${waApprovalText}" target="_blank" class="btn-act btn-approve">
          ✓ Aprovar no WhatsApp
        </a>
        <button onclick="window.print()" class="btn-act btn-print">
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  </div>
  <div class="page">
    <!-- Cabeçalho Timbrado -->
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">DISCIBRA DISTRIBUIDORA</div>
          <div class="brand-subtitle">Materiais Básicos, Cimentos e Ferragens no Atacado Direto da Fábrica</div>
          <div style="font-size:10px;color:#6B7280;margin-top:4px;">
            DISCIPRA DISTRIBUIDORA DA CONSTRUÇÃO LTDA · CNPJ: 59.566.414/0001-25<br>
            CD Logístico: Rua Igarapava, 73 — Vila Albertina, Ribeirão Preto/SP
          </div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:18px;font-weight:800;color:#111318;">PROPOSTA COMERCIAL</div>
          <div style="font-size:13px;font-weight:800;font-family:monospace;color:#15803D;">${q.code}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px;">Emissão: ${fmtDate(q.created_at)}</div>
          <div style="font-size:10px;font-weight:700;color:#C2410C;">Validade: ${fmtDate(q.valid_until)}</div>
        </td>
      </tr>
    </table>
    <!-- Dados do Cliente e Condições -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-title">DADOS DO CLIENTE / OBRA</div>
        <div class="info-row">
          <span class="info-label">Cliente:</span>
          <span class="info-val">${lead?.name || "Cliente Final"}</span>
        </div>
        ${lead?.company ? `<div class="info-row"><span class="info-label">Empresa:</span><span class="info-val">${lead.company}</span></div>` : ""}
        ${lead?.cpf_cnpj ? `<div class="info-row"><span class="info-label">CPF/CNPJ:</span><span class="info-val">${lead.cpf_cnpj}</span></div>` : ""}
        <div class="info-row">
          <span class="info-label">WhatsApp:</span>
          <span class="info-val">${lead?.phone || "Não informado"}</span>
        </div>
      </div>
      <div class="info-box">
        <div class="info-title">LOGÍSTICA E FORNECEDOR</div>
        <div class="info-row">
          <span class="info-label">Distribuidora:</span>
          <span class="info-val">Discibra Distribuidora</span>
        </div>
        <div class="info-row">
          <span class="info-label">Entrega:</span>
          <span class="info-val">Frota Própria com Descarga</span>
        </div>
        <div class="info-row">
          <span class="info-label">Condições:</span>
          <span class="info-val">${q.payment_terms || "À vista PIX / Faturado"}</span>
        </div>
      </div>
    </div>
    <!-- Tabela de Produtos -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">#</th>
          <th style="text-align:left;">Descrição do Material</th>
          <th style="width:50px;text-align:center;">Un.</th>
          <th style="width:60px;text-align:center;">Qtd</th>
          <th style="width:100px;text-align:right;">Preço Unit.</th>
          <th style="width:110px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <!-- Totais -->
    <div class="totals-area">
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
          <span style="color:#111318;">Total Geral:</span>
          <span style="font-family:monospace;">${brl(total)}</span>
        </div>
      </div>
    </div>
    <!-- Termos e Chave PIX Oficial -->
    <div class="terms-box">
      <strong>Condições Comerciais e Informações de Pagamento:</strong><br>
      • Chave PIX Oficial (CNPJ): <strong>59.566.414/0001-25</strong> — Discipra Distribuidora da Construção LTDA.<br>
      • Todas as cargas acompanham Nota Fiscal Eletrônica (NF-e) e Laudo de Conformidade Técnica ABNT NBR 16697.<br>
      • Para faturamento a prazo no CNPJ, a liberação está sujeita à análise prévia de crédito.<br>
      • Descarga paletizada realizada com caminhão munck onde as condições de acesso da obra permitirem.
    </div>
    <div style="margin-top:24px;text-align:center;font-size:10px;color:#9CA3AF;">
      Discibra Distribuidora da Construção LTDA · Tel/WhatsApp: (16) 99644-7972 · www.discibradistribuidora.com
    </div>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
