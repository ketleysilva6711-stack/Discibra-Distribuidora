import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminServerConfigured()) return new NextResponse("Serviço indisponível", { status: 503 })
  const { id } = await params
  const supabase = createAdminClient()
  const { data: q, error } = await supabase
    .from("quotations")
    .select("*, quotation_leads(*), quotation_items(*)")
    .eq("id", id)
    .maybeSingle()
  if (error || !q) return new NextResponse("Orçamento não encontrado", { status: 404 })

  const items: any[] = (q.quotation_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  const lead: any = q.quotation_leads || {}
  const subtotalBruto = items.reduce((s: number, i: any) => s + Number(i.unit_price) * Number(i.qty), 0)
  const descontoItens = items.reduce(
    (s: number, i: any) => s + Number(i.unit_price) * Number(i.qty) * (Number(i.discount_pct) / 100),
    0,
  )
  const subtotalLiq = subtotalBruto - descontoItens
  const descontoGlobal = subtotalLiq * (Number(q.discount_pct) / 100)
  const frete = Number(q.shipping_value) || 0
  const total = subtotalLiq - descontoGlobal + frete

  const rowsHtml = items
    .map((i: any, idx: number) => {
      const subtotalItem = Number(i.unit_price) * Number(i.qty) * (1 - Number(i.discount_pct) / 100)
      return `
    <tr>
      <td style="text-align:center;padding:8px 6px;border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;color:#0f172a;">${i.product_name}</div>
        ${i.sku ? `<div style="font-size:11px;color:#64748b;">SKU: ${i.sku}</div>` : ""}
        ${i.notes ? `<div style="font-size:11px;color:#94a3b8;font-style:italic;">${i.notes}</div>` : ""}
      </td>
      <td style="text-align:center;padding:8px 6px;border-bottom:1px solid #e2e8f0;">${Number(i.qty).toLocaleString("pt-BR")}</td>
      <td style="text-align:center;padding:8px 6px;border-bottom:1px solid #e2e8f0;">${i.unit || "un"}</td>
      <td style="text-align:right;padding:8px 6px;border-bottom:1px solid #e2e8f0;">${brl(i.unit_price)}</td>
      <td style="text-align:center;padding:8px 6px;border-bottom:1px solid #e2e8f0;">${Number(i.discount_pct) > 0 ? Number(i.discount_pct).toFixed(1) + "%" : "—"}</td>
      <td style="text-align:right;padding:8px 6px;border-bottom:1px solid #e2e8f0;font-weight:600;">${brl(subtotalItem)}</td>
    </tr>`
    })
    .join("")

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial ${q.code} — Discibra Distribuidora</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C2410C; padding-bottom: 24px; margin-bottom: 28px; }
    .header-left { display: flex; flex-direction: column; gap: 6px; }
    .header-right { text-align: right; }
    .doc-title { font-size: 22px; font-weight: 800; color: #C2410C; letter-spacing: -0.5px; }
    .doc-code { font-size: 15px; font-weight: 700; color: #0f172a; }
    .doc-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
    .company-info { font-size: 11px; color: #475569; line-height: 1.6; }
    .company-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .block-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; }
    .block-row { display: flex; gap: 8px; margin-bottom: 4px; }
    .block-label { font-size: 11px; color: #64748b; min-width: 80px; }
    .block-value { font-size: 12px; font-weight: 600; color: #0f172a; }
    .validity-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid #fde68a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #0f172a; }
    thead th { color: #fff; padding: 10px 6px; font-size: 11px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.06em; }
    thead th:nth-child(2) { text-align: left; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-box { width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .totals-row:last-child { border-bottom: none; border-top: 2px solid #0f172a; margin-top: 4px; padding-top: 10px; }
    .totals-label { color: #64748b; }
    .totals-value { font-weight: 700; }
    .total-final { font-size: 16px; font-weight: 800; color: #C2410C; }
    .payment-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .payment-title { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .payment-options { display: flex; gap: 12px; flex-wrap: wrap; }
    .payment-tag { background: #fff; border: 1px solid #86efac; color: #166534; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
    .notes-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 28px; }
    .notes-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .footer-legal { font-size: 10px; color: #94a3b8; line-height: 1.6; max-width: 500px; }
    .footer-sign { text-align: center; }
    .sign-line { width: 200px; border-top: 1px solid #334155; margin: 0 auto 6px; padding-top: 8px; }
    .sign-name { font-size: 11px; font-weight: 700; color: #0f172a; }
    .sign-sub { font-size: 10px; color: #64748b; }
    .accent { color: #C2410C; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print" style="text-align:right;margin-bottom:20px;">
      <button onclick="window.print()" style="background:#C2410C;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
    <div class="header">
      <div class="header-left">
        <img src="/brand/logo-trim.png" alt="Discibra" style="height:52px;object-fit:contain;" />
        <div class="company-info" style="margin-top:8px;">
          <div class="company-name">Discibra Distribuidora</div>
          CNPJ: 59.566.414/0001-25<br>
          Rua Igarapava, 73 — Vila Albertina<br>
          Ribeirão Preto-SP — CEP 14.075-453<br>
          (16) 99644-7972 · contato@discibradistribuidora.com
        </div>
      </div>
      <div class="header-right">
        <div class="doc-title">PROPOSTA COMERCIAL</div>
        <div class="doc-code">${q.code}</div>
        <div class="doc-meta">Emissão: ${fmtDate(q.created_at)}</div>
        ${q.valid_until ? `<div style="margin-top:8px;"><span class="validity-badge">⏰ Válida até ${fmtDate(q.valid_until)}</span></div>` : ""}
      </div>
    </div>
    <div class="grid-2">
      <div class="block">
        <div class="block-title">📋 Dados do Cliente</div>
        <div class="block-row"><span class="block-label">Nome/Empresa:</span><span class="block-value">${lead.company || lead.name || "—"}</span></div>
        ${lead.cpf_cnpj ? `<div class="block-row"><span class="block-label">CPF/CNPJ:</span><span class="block-value">${lead.cpf_cnpj}</span></div>` : ""}
        ${lead.phone ? `<div class="block-row"><span class="block-label">WhatsApp:</span><span class="block-value">${lead.phone}</span></div>` : ""}
        ${lead.email ? `<div class="block-row"><span class="block-label">E-mail:</span><span class="block-value">${lead.email}</span></div>` : ""}
        ${lead.address_street ? `<div class="block-row"><span class="block-label">Endereço:</span><span class="block-value">${lead.address_street}${lead.address_number ? ", " + lead.address_number : ""} — ${lead.address_city || ""}/${lead.address_state || ""}</span></div>` : ""}
        ${lead.address_zip ? `<div class="block-row"><span class="block-label">CEP:</span><span class="block-value">${lead.address_zip}</span></div>` : ""}
      </div>
      <div class="block">
        <div class="block-title">🏢 Dados da Proposta</div>
        <div class="block-row"><span class="block-label">Número:</span><span class="block-value accent">${q.code}</span></div>
        <div class="block-row"><span class="block-label">Status:</span><span class="block-value">${q.status === "approved" ? "✅ Aprovado" : q.status === "sent" ? "📤 Enviado" : q.status === "draft" ? "📝 Rascunho" : q.status}</span></div>
        <div class="block-row"><span class="block-label">Validade:</span><span class="block-value">${q.valid_until ? fmtDate(q.valid_until) : "A combinar"}</span></div>
        <div class="block-row"><span class="block-label">Responsável:</span><span class="block-value">${q.created_by || "Discibra"}</span></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th style="text-align:left;">Descrição do Material</th>
          <th style="width:60px;">Qtd</th>
          <th style="width:50px;">Un</th>
          <th style="width:90px;">Preço Unit.</th>
          <th style="width:60px;">Desc%</th>
          <th style="width:100px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span class="totals-label">Subtotal dos itens:</span><span class="totals-value">${brl(subtotalBruto)}</span></div>
        ${descontoItens > 0 ? `<div class="totals-row"><span class="totals-label">Desconto nos itens:</span><span class="totals-value" style="color:#16a34a;">- ${brl(descontoItens)}</span></div>` : ""}
        ${Number(q.discount_pct) > 0 ? `<div class="totals-row"><span class="totals-label">Desconto geral (${q.discount_pct}%):</span><span class="totals-value" style="color:#16a34a;">- ${brl(descontoGlobal)}</span></div>` : ""}
        ${frete > 0 ? `<div class="totals-row"><span class="totals-label">Frete:</span><span class="totals-value">${brl(frete)}</span></div>` : `<div class="totals-row"><span class="totals-label">Frete:</span><span class="totals-value" style="color:#16a34a;">A calcular</span></div>`}
        <div class="totals-row"><span class="totals-label" style="font-size:14px;font-weight:700;">TOTAL FINAL:</span><span class="totals-value total-final">${brl(total)}</span></div>
      </div>
    </div>
    <div class="payment-section">
      <div class="payment-title">💳 Condições de Pagamento</div>
      <div class="payment-options">
        <span class="payment-tag">💵 PIX</span>
        <span class="payment-tag">💳 Parcelado em até 12x no cartão</span>
        <span class="payment-tag">🔗 Link de pagamento</span>
      </div>
      ${q.payment_terms && q.payment_terms !== "A definir pelo atendente" ? `<div style="margin-top:10px;font-size:12px;color:#166534;font-style:italic;">${q.payment_terms}</div>` : ""}
    </div>
    ${q.notes_client ? `<div class="notes-section"><div class="notes-title">📝 Observações</div><div style="font-size:12px;color:#475569;line-height:1.6;">${q.notes_client}</div></div>` : ""}
    <div class="footer">
      <div class="footer-legal">
        Esta proposta tem validade${q.valid_until ? ` até <strong>${fmtDate(q.valid_until)}</strong>` : " conforme combinado"}. Após esse prazo, os preços estão sujeitos à revisão sem aviso prévio.<br>
        Os preços expressos são em Reais (R$) e não incluem impostos adicionais salvo indicado.<br>
        <strong>Discibra Distribuidora</strong> — CNPJ 59.566.414/0001-25
      </div>
      <div class="footer-sign">
        <div class="sign-line">
          <div class="sign-name">Discibra Distribuidora</div>
          <div class="sign-sub">Responsável Comercial</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
