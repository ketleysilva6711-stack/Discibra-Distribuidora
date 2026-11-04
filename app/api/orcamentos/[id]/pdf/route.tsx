import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"

function brl(n: number) {
  return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1A202C",
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1A202C",
    paddingBottom: 12,
  },
  brand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
  },
  brandSub: {
    fontSize: 7.5,
    color: "#4A5568",
    marginTop: 2,
  },
  meta: {
    fontSize: 7.5,
    color: "#4A5568",
    marginTop: 2,
  },
  rightBlock: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  codigo: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#15803D",
    fontFamily: "Courier",
  },
  sectionTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  clienteBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#F7FAFC",
    marginBottom: 12,
  },
  clienteCol: {
    flex: 1,
  },
  clienteLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  clienteValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1A202C",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: "#F7FAFC",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1A202C",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableCell: {
    fontSize: 7.5,
    color: "#1A202C",
  },
  tableCellBold: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1A202C",
  },
  totals: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsCard: {
    width: 150,
    borderWidth: 1,
    borderColor: "#1A202C",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#F7FAFC",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 7.5,
    color: "#4A5568",
  },
  totalRowGrand: {
    borderTopWidth: 1,
    borderTopColor: "#1A202C",
    marginTop: 4,
    paddingTop: 6,
    fontSize: 9,
    fontWeight: "bold",
    color: "#15803D",
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    fontSize: 7,
    color: "#718096",
    textAlign: "center",
  },
})

function OrcamentoPDF({ q }: { q: any }) {
  const items: any[] = (q.orcamento_itens || []).sort(
    (a: any, b: any) => Number(a.ordem || 0) - Number(b.ordem || 0),
  )
  const subtotalMateriais = items.reduce(
    (s: number, i: any) => s + Number(i.preco_aplicado) * Number(i.quantidade),
    0,
  )
  const descontoPix = Number(q.desconto_pix) || 0
  const frete = Number(q.valor_frete) || 0
  const total = Number(q.total) || 0

  const enderecoEntrega =
    q.endereco_logradouro || q.endereco_bairro || q.endereco_cidade
      ? `${q.endereco_logradouro || ""}, ${q.endereco_numero || ""}${
          q.endereco_complemento ? ` - ${q.endereco_complemento}` : ""
        }${q.endereco_bairro ? `, ${q.endereco_bairro}` : ""}${
          q.endereco_cidade ? ` - ${q.endereco_cidade}/${q.endereco_uf}` : ""
        }`.trim()
      : "Não informado"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>DISCIBRA DISTRIBUIDORA</Text>
            <Text style={styles.brandSub}>
              Distribuição no Atacado — Cimentos, Argamassas e Materiais Básicos
            </Text>
            <Text style={styles.meta}>
              DISCIBRA DISTRIBUIDORA DA CONSTRUÇÃO LTDA · CNPJ 00.000.000/0001-00
            </Text>
            <Text style={styles.meta}>
              Centro de Distribuição: Rua Igarapava, 73 — Vila Albertina, Ribeirão Preto/SP
            </Text>
            <Text style={styles.meta}>Telefone: (16) 99644-7972</Text>
          </View>
          <View style={styles.rightBlock}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1A202C" }}>
              PROPOSTA COMERCIAL
            </Text>
            <Text style={styles.codigo}>{q.codigo}</Text>
            <Text style={styles.meta}>Emissão: <Text style={{ fontWeight: "bold" }}>{fmtDate(q.criado_em)}</Text></Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <View style={styles.clienteBox}>
          <View style={styles.clienteCol}>
            <Text style={styles.clienteLabel}>Nome</Text>
            <Text style={styles.clienteValue}>{q.cliente_nome || "Cliente"}</Text>
          </View>
          <View style={styles.clienteCol}>
            <Text style={styles.clienteLabel}>WhatsApp</Text>
            <Text style={styles.clienteValue}>{q.cliente_telefone || "Não informado"}</Text>
          </View>
          <View style={[styles.clienteCol, { flex: 2 }]}>
            <Text style={styles.clienteLabel}>Endereço de entrega</Text>
            <Text style={styles.clienteValue}>{enderecoEntrega}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Itens</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: 90 }]}>Produto</Text>
            <Text style={[styles.tableHeaderText, { width: 50, textAlign: "center" }]}>SKU</Text>
            <Text style={[styles.tableHeaderText, { width: 35, textAlign: "center" }]}>Qtd</Text>
            <Text style={[styles.tableHeaderText, { width: 60, textAlign: "right" }]}>Preço Unit.</Text>
            <Text style={[styles.tableHeaderText, { width: 70, textAlign: "right" }]}>Subtotal</Text>
          </View>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : undefined]}
            >
              <Text style={[styles.tableCell, { width: 90 }]}>{item.nome_produto}</Text>
              <Text style={[styles.tableCell, { width: 50, textAlign: "center" }]}>
                {item.sku || "—"}
              </Text>
              <Text style={[styles.tableCell, { width: 35, textAlign: "center" }]}>
                {Number(item.quantidade).toLocaleString("pt-BR")}
              </Text>
              <Text style={[styles.tableCell, { width: 60, textAlign: "right" }]}>
                {brl(item.preco_aplicado)}
              </Text>
              <Text style={[styles.tableCellBold, { width: 70, textAlign: "right" }]}>
                {brl(Number(item.preco_aplicado) * Number(item.quantidade))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{brl(subtotalMateriais)}</Text>
            </View>
            {descontoPix > 0 && (
              <View style={styles.totalRow}>
                <Text>Desconto PIX</Text>
                <Text>- {brl(descontoPix)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text>Frete</Text>
              <Text>{frete === 0 ? "Grátis" : brl(frete)}</Text>
            </View>
            <View style={styles.totalRowGrand}>
              <Text>Total Final</Text>
              <Text>{brl(total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Válido por 7 dias. Para confirmar, entre em contato pelo WhatsApp (16) 99644-7972.
        </Text>
      </Page>
    </Document>
  )
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isAdminServerConfigured()) {
    return new NextResponse("Servidor não configurado.", { status: 503 })
  }
  const supabase = createAdminClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let query = supabase.from("orcamentos").select("*, orcamento_itens(*)")
  if (isUuid) {
    query = query.eq("id", id)
  } else {
    query = query.eq("codigo", id.toUpperCase())
  }
  const { data: q, error } = await query.maybeSingle()
  if (error || !q) {
    return new NextResponse("Orçamento não encontrado.", { status: 404 })
  }

  const pdf = await renderToBuffer(<OrcamentoPDF q={q} />)

  const codigo = q.codigo
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Orcamento-${codigo}.pdf"`,
    },
  })
}
