import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"
import { createPublicClient } from "@/lib/supabase/public"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isAdminServer = isAdminServerConfigured()
  const supabase = isAdminServer ? createAdminClient() : createPublicClient()

  // Reconhecer código amigável ORC-XXXXXX ou UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let query = supabase.from("quotations").select("*, quotation_leads(*), quotation_items(*)")
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    query = query.eq("code", id.toUpperCase())
  }

  const { data: q, error } = await query.maybeSingle()
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
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#475569;">${idx + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#1e293b;">
        <div style="font-weight:700;color:#0f172a;">${i.product_name}</div>
        ${i.sku ? `<div style="font-size:10px;color:#64748b;">Cód./SKU: ${i.sku}</div>` : ""}
        ${i.notes ? `<div style="font-size:10px;color:#94a3b8;font-style:italic;">${i.notes}</div>` : ""}
      </td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#475569;">${i.unit || "un"}</td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#475569;">${Number(i.qty).toLocaleString("pt-BR")}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#475569;">${brl(i.unit_price)}</td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;color:#475569;">${Number(i.discount_pct) > 0 ? Number(i.discount_pct).toFixed(1) + "%" : "—"}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #CBD5E1;font-size:11px;font-weight:700;color:#0f172a;">${brl(subtotalItem)}</td>
    </tr>`
    })
    .join("")

  const waApprovalText = encodeURIComponent(
    `Olá! Recebi a Proposta Comercial ${q.code} no valor de ${brl(total)} e gostaria de confirmar a aprovação para faturamento e agendamento da entrega.`
  )
  const waContactText = encodeURIComponent(
    `Olá! Estou com uma dúvida sobre a Proposta Comercial ${q.code}. Poderia me orientar?`
  )

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial ${q.code} — Discibra Distribuidora</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #f1f5f9; }
    .page { max-width: 900px; margin: 0 auto 40px auto; padding: 30px 40px; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    @media print {
      body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { padding: 0; margin: 0; box-shadow: none; max-width: 100%; }
    }
    /* Barra de Ação Flutuante */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0F172A;
      border-bottom: 2px solid #15803D;
      padding: 12px 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .action-bar-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .action-info { display: flex; align-items: baseline; gap: 8px; color: #fff; }
    .action-code { color: #94A3B8; font-weight: 600; font-size: 12px; }
    .action-total { color: #34D399; font-size: 16px; font-weight: 800; }
    .action-btns { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .btn-action {
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    .btn-approve { background: #15803D; color: #fff; }
    .btn-approve:hover { background: #166534; }
    .btn-print { background: #334155; color: #fff; }
    .btn-print:hover { background: #475569; }
    .btn-doubt { background: transparent; color: #CBD5E1; border: 1px solid #475569; }
    .btn-doubt:hover { background: #1E293B; color: #fff; }

    /* Tarja superior corporativa */
    .top-strip {
      background: #0F172A;
      color: #fff;
      padding: 18px 24px;
      border-radius: 4px 4px 0 0;
      margin-bottom: 24px;
    }
    .top-strip-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .top-strip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-strip-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .top-strip-logo img { height: 40px; width: auto; object-fit: contain; }
    .top-strip-brand { font-weight: 800; font-size: 13px; letter-spacing: -0.5px; }
    .top-strip-brand span { color: #C2410C; }
    .top-strip-meta {
      display: flex;
      gap: 24px;
      font-size: 10px;
      color: #94a3b8;
      text-align: right;
    }
    .top-strip-meta div { line-height: 1.4; }
    .top-strip-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #334155;
      padding-top: 12px;
    }
    .doc-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 2px; }
    .doc-subtitle { font-size: 11px; color: #CBD5E1; font-weight: 500; }
    .doc-meta { font-size: 11px; color: #94a3b8; margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
    .doc-meta strong { color: #fff; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; }
    .block-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 10px; }
    .block-row { display: flex; gap: 12px; margin-bottom: 5px; }
    .block-label { font-size: 10px; color: #64748b; min-width: 110px; font-weight: 600; }
    .block-value { font-size: 11px; color: #0f172a; font-weight: 600; }
    .code-highlight { color: #C2410C; font-weight: 800; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #0F172A; }
    thead th { color: #fff; padding: 10px 8px; font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.06em; }
    thead th:nth-child(2) { text-align: left; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #CBD5E1; }
    tbody tr:nth-child(even) { background: #f8fafc; }

    .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-box { width: 320px; background: #F8FAFC; border: 2px solid #0F172A; border-radius: 4px; padding: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .totals-row:last-child { border-bottom: none; border-top: 2px solid #0F172A; margin-top: 4px; padding-top: 10px; }
    .totals-label { color: #64748b; font-size: 10px; }
    .totals-value { font-weight: 700; color: #0f172a; font-size: 11px; }
    .total-final { font-size: 15px; font-weight: 800; color: #15803D; }

    .commercial-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 18px; margin-bottom: 24px; }
    .commercial-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 14px; }
    .commercial-row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 11px; }
    .commercial-label { font-weight: 600; color: #64748b; min-width: 130px; }
    .commercial-value { color: #0f172a; font-weight: 500; flex: 1; }

    .footer { border-top: 2px solid #0F172A; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-start; margin-top: 24px; gap: 20px; }
    .footer-legal { font-size: 9px; color: #64748b; line-height: 1.6; max-width: 520px; }
    .footer-sign { display: flex; flex-direction: column; align-items: flex-end; }
    .sign-line { width: 200px; border-top: 1px solid #334155; margin-bottom: 8px; padding-top: 6px; }
    .sign-label { font-size: 10px; font-weight: 700; color: #0f172a; text-align: center; }
    .sign-sub { font-size: 9px; color: #64748b; text-align: center; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <div class="action-bar-inner">
      <div class="action-info">
        <span class="action-code">Proposta: <strong>${q.code}</strong></span>
        <span class="action-total">${brl(total)}</span>
      </div>
      <div class="action-btns">
        <a href="https://wa.me/5516996447972?text=${waApprovalText}" target="_blank" rel="noopener noreferrer" class="btn-action btn-approve">
          ✅ Aprovar no WhatsApp
        </a>
        <button onclick="window.print()" class="btn-action btn-print">
          🖨️ Baixar / Imprimir PDF
        </button>
        <a href="https://wa.me/5516996447972?text=${waContactText}" target="_blank" rel="noopener noreferrer" class="btn-action btn-doubt">
          💬 Falar com o Consultor
        </a>
      </div>
    </div>
  </div>

  <div class="page">
    <div class="top-strip">
      <div class="top-strip-inner">
        <div class="top-strip-top">
          <div class="top-strip-logo">
            <img src="/brand/logo-trim.png" alt="Discibra Distribuidora" />
            <div class="top-strip-brand">Discibra<span> Distribuidora</span></div>
          </div>
          <div class="top-strip-meta">
            <div><strong>CNPJ:</strong> 59.566.414/0001-25<br><strong>IE:</strong> 297.444.454.114</div>
            <div><strong>CD Logístico:</strong> Ribeirão Preto - SP<br><strong>Tel:</strong> (16) 99644-7972</div>
            <div><strong>E-mail:</strong> contato@discibradistribuidora.com</div>
          </div>
        </div>
        <div class="top-strip-bottom">
          <div>
            <div class="doc-title">PROPOSTA COMERCIAL &amp; ORÇAMENTO TÉCNICO</div>
            <div class="doc-subtitle">Discibra Distribuidora — Materiais de Construção</div>
          </div>
          <div class="doc-meta">
            <div><strong>Código:</strong> <span class="code-highlight">${q.code}</span></div>
            <div><strong>Emissão:</strong> ${fmtDate(q.created_at)}</div>
            <div><strong>Validade:</strong> ${q.valid_until ? fmtDate(q.valid_until) : "A combinar"}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="block">
        <div class="block-title">Dados do Cliente / Faturamento</div>
        <div class="block-row"><span class="block-label">Nome / Empresa:</span><span class="block-value">${lead.company || lead.name || "—"}</span></div>
        ${lead.cpf_cnpj ? `<div class="block-row"><span class="block-label">CPF / CNPJ:</span><span class="block-value">${lead.cpf_cnpj}</span></div>` : ""}
        ${lead.phone ? `<div class="block-row"><span class="block-label">WhatsApp:</span><span class="block-value">${lead.phone}</span></div>` : ""}
        ${lead.email ? `<div class="block-row"><span class="block-label">E-mail:</span><span class="block-value">${lead.email}</span></div>` : ""}
      </div>
      <div class="block">
        <div class="block-title">Endereço de Entrega da Obra</div>
        ${lead.address_street ? `<div class="block-row"><span class="block-label">Rua:</span><span class="block-value">${lead.address_street}${lead.address_number ? ", " + lead.address_number : ""}</span></div>` : ""}
        ${lead.address_neighborhood ? `<div class="block-row"><span class="block-label">Bairro:</span><span class="block-value">${lead.address_neighborhood}</span></div>` : ""}
        ${lead.address_city || lead.address_state ? `<div class="block-row"><span class="block-label">Cidade / UF:</span><span class="block-value">${lead.address_city || ""} / ${lead.address_state || ""}</span></div>` : ""}
        ${lead.address_zip ? `<div class="block-row"><span class="block-label">CEP:</span><span class="block-value">${lead.address_zip}</span></div>` : ""}
      </div>
      <div class="block">
        <div class="block-title">Dados da Proposta</div>
        <div class="block-row"><span class="block-label">Número:</span><span class="block-value code-highlight">${q.code}</span></div>
        <div class="block-row"><span class="block-label">Status:</span><span class="block-value">${q.status === "approved" ? "Aprovado" : q.status === "sent" ? "Enviado" : q.status === "draft" ? "Rascunho" : q.status}</span></div>
        <div class="block-row"><span class="block-label">Validade:</span><span class="block-value">${q.valid_until ? fmtDate(q.valid_until) : "A combinar"}</span></div>
        <div class="block-row"><span class="block-label">Consultor Comercial:</span><span class="block-value">${q.created_by ? `Proposta elaborada por: ${q.created_by} · Consultor Técnico Discibra` : "Discibra"}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:30px;">#</th>
          <th style="width:90px;">CÓD. / SKU</th>
          <th style="text-align:left;">DESCRIÇÃO DO MATERIAL</th>
          <th style="width:50px;">UNID</th>
          <th style="width:70px;">QTD</th>
          <th style="width:110px;">PREÇO UNIT. (R$)</th>
          <th style="width:60px;">DESC %</th>
          <th style="width:110px;">SUBTOTAL (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span class="totals-label">Subtotal dos Itens:</span><span class="totals-value">${brl(subtotalBruto)}</span></div>
        ${descontoItens > 0 ? `<div class="totals-row"><span class="totals-label">Desconto nos Itens:</span><span class="totals-value" style="color:#C2410C;">- ${brl(descontoItens)}</span></div>` : ""}
        ${Number(q.discount_pct) > 0 ? `<div class="totals-row"><span class="totals-label">Desconto Global (${q.discount_pct}%):</span><span class="totals-value" style="color:#C2410C;">- ${brl(descontoGlobal)}</span></div>` : ""}
        ${frete > 0 ? `<div class="totals-row"><span class="totals-label">Frete / Descarga:</span><span class="totals-value">${brl(frete)}</span></div>` : `<div class="totals-row"><span class="totals-label">Frete / Descarga:</span><span class="totals-value" style="color:#64748b;">A calcular</span></div>`}
        <div class="totals-row"><span class="totals-label">VALOR TOTAL DA PROPOSTA:</span><span class="totals-value total-final">${brl(total)}</span></div>
      </div>
    </div>

    <div class="commercial-section">
      <div class="commercial-title">Condições Comerciais</div>
      <div class="commercial-row"><span class="commercial-label">Formas de Pagamento:</span><span class="commercial-value">PIX à vista · Parcelamento em até 12x no Cartão · Link de Pagamento Faturado</span></div>
      <div class="commercial-row"><span class="commercial-label">Entrega:</span><span class="commercial-value">Caminhão com Munck / Paletizado no endereço indicado</span></div>
      <div class="commercial-row"><span class="commercial-label">Validade da Proposta:</span><span class="commercial-value">${q.valid_until ? fmtDate(q.valid_until) : "Conforme combinado"}</span></div>
      <div class="commercial-row"><span class="commercial-label">Observações:</span><span class="commercial-value">${q.notes_client || "Conforme orçamento apresentado."}</span></div>
    </div>

    <div class="footer">
      <div class="footer-legal">
        Esta proposta comercial tem validade${q.valid_until ? ` até <strong>${fmtDate(q.valid_until)}</strong>` : " conforme combinado"}. Após esse prazo, os preços estão sujeitos à revisão sem aviso prévio.<br>
        <strong>Preços garantidos por 24 horas</strong> a contar da data de emissão, sujeitos à confirmação de estoque e fila de carregamento no Centro de Distribuição.<br>
        <strong>Discibra Distribuidora</strong> — CNPJ 59.566.414/0001-25 · CD Logístico Ribeirão Preto - SP
      </div>
      <div class="footer-sign">
        <div class="sign-line"></div>
        <div class="sign-label">Discibra Distribuidora</div>
        <div class="sign-sub">Responsável Comercial</div>
        <div style="margin-top:24px;"></div>
        <div class="sign-line"></div>
        <div class="sign-label">Aceite do Cliente</div>
        <div class="sign-sub">Nome, CPF/CNPJ, Data e Assinatura</div>
      </div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
