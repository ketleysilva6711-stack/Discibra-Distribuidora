"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, Copy, FileText, MessageCircle, Printer, Package, Truck, User, CreditCard, MessageCircle as MsgCircle, Pencil, Plus, Trash2, Search, Save, X as XIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const supabase = createClient()

const brl = (n: number) =>
  "R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  negociando: "Negociando",
  aprovado: "Aprovado",
  separando: "Separando",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "rascunho", label: "Rascunho", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "enviado", label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "negociando", label: "Negociando", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "aprovado", label: "Aprovado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "separando", label: "Separando", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "em_transporte", label: "Em Transporte", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "entregue", label: "Entregue", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
]

export default function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const router = useRouter()
  const [codigo, setCodigo] = useState<string>("")

  const [orcamento, setOrcamento] = useState<any>(null)
  const [orcamentoId, setOrcamentoId] = useState<string>("");
  const [itens, setItens] = useState<any[]>([])
  const [auditoria, setAuditoria] = useState<any[]>([])
  const [clienteFicha, setClienteFicha] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [observacao, setObservacao] = useState("")
  const [modoEdicao, setModoEdicao] = useState(false)
  const [itensEditados, setItensEditados] = useState<any[]>([])
  const [freteEditado, setFreteEditado] = useState("")
  const [descontoPixManual, setDescontoPixManual] = useState("")
  const [buscaProduto, setBuscaProduto] = useState("")
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([])
  const [buscandoProduto, setBuscandoProduto] = useState(false)

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  useEffect(() => {
    params.then((p) => setCodigo(p.codigo))
  }, [])

  useEffect(() => {
    if (!codigo) return
    if (codigo.toLowerCase() === "novo") {
      router.replace("/admin/orcamentos")
      return
    }
    fetchOrcamento()
  }, [codigo])

  async function fetchOrcamento() {
    setLoading(true)
    try {
      const isUuid = UUID_REGEX.test(codigo)
      const oRes = await supabase
        .from("orcamentos")
        .select("*, clientes(*)")
        .eq(isUuid ? "id" : "codigo", codigo.toUpperCase())
        .maybeSingle()

      if (oRes.error) throw oRes.error
      if (!oRes.data) {
        setOrcamento(null)
        setItens([])
        setAuditoria([])
        setClienteFicha(null)
        setStatus("")
        setPixKey("")
        setLoading(false)
        return
      }

      const orcamentoData = oRes.data
      const [iRes, aRes] = await Promise.all([
        supabase
          .from("orcamento_itens")
          .select("*")
          .eq("orcamento_id", orcamentoData.id)
          .order("ordem", { ascending: true }),
        supabase
          .from("orcamento_auditoria")
          .select("*")
          .eq("orcamento_id", orcamentoData.id)
          .order("criado_em", { ascending: true }),
      ])

      if (iRes.error) throw iRes.error
      if (aRes.error) throw aRes.error

      setOrcamento(orcamentoData)
      setOrcamentoId(orcamentoData.id)
      setItens(iRes.data || [])
      setAuditoria(aRes.data || [])
      setStatus(orcamentoData.status || "")
      setPixKey(orcamentoData.pix_key || "")
      setClienteFicha(orcamentoData.clientes?.[0] || null)
      setItensEditados((iRes.data || []).map((i: any) => ({ ...i })))
      setFreteEditado(String(orcamentoData.valor_frete || 0))
      setDescontoPixManual(String(orcamentoData.desconto_pix || 0))
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar orçamento")
    } finally {
      setLoading(false)
    }
  }

  const itensParaExibir = modoEdicao ? itensEditados : itens
  const totalItens = itensParaExibir.reduce((s, i) => s + Number(i.preco_aplicado) * Number(i.quantidade), 0)
  const pesoTotalKg = itensParaExibir.reduce((s, i) => s + Number(i.peso_total_kg || 0), 0)
  const pesoTons = pesoTotalKg >= 1000 ? `${(pesoTotalKg / 1000).toFixed(1)} t` : `${pesoTotalKg.toLocaleString("pt-BR")} kg`

  const valorFreteDisplay = modoEdicao ? Number(freteEditado || 0) : Number(orcamento.valor_frete || 0)
  const descontoPixDisplay = modoEdicao ? Number(descontoPixManual || 0) : Number(orcamento.desconto_pix || 0)
  const totalGeralDisplay = modoEdicao ? totalItens - descontoPixDisplay + valorFreteDisplay : Number(orcamento.total || 0)

  async function handleSaveStatus() {
    setSaving(true)
    try {
      if (!orcamentoId) throw new Error("Orçamento não carregado")

      const { error: uErr } = await supabase
        .from("orcamentos")
        .update({ status })
        .eq("id", orcamentoId)
      if (uErr) throw uErr

      const { error: aErr } = await supabase.from("orcamento_auditoria").insert({
        orcamento_id: orcamentoId,
        status_anterior: orcamento?.status || null,
        status_novo: status,
        observacao: observacao.trim() || null,
      })
      if (aErr) throw aErr

      toast.success("Status atualizado com auditoria registrada")
      setObservacao("")
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar status")
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePix() {
    setSaving(true)
    try {
      if (!orcamentoId) throw new Error("Orçamento não carregado")

      const { error } = await supabase
        .from("orcamentos")
        .update({ pix_key: pixKey.trim() || null })
        .eq("id", orcamentoId)
      if (error) throw error
      toast.success("Chave PIX atualizada")
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar PIX")
    } finally {
      setSaving(false)
    }
  }

  async function handleAssumir() {
    setSaving(true)
    try {
      if (!orcamentoId) throw new Error("Orçamento não carregado")

      const { error } = await supabase
        .from("orcamentos")
        .update({
          status: "negociando",
          atendente_id: (await supabase.auth.getUser()).data.user?.id || null,
          assumido_em: new Date().toISOString(),
        })
        .eq("id", orcamentoId)
      if (error) throw error

      toast.success("Orçamento assumido")
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao assumir orçamento")
    } finally {
      setSaving(false)
    }
  }

  async function handlePrimeiraResposta() {
    setSaving(true)
    try {
      if (!orcamentoId) throw new Error("Orçamento não carregado")

      const agora = new Date().toISOString()
      const criadoEm = orcamento?.criado_em
      const tempoMin = criadoEm
        ? Math.round((new Date(agora).getTime() - new Date(criadoEm).getTime()) / 60000)
        : 0

      const { error } = await supabase
        .from("orcamentos")
        .update({
          primeira_resposta_em: agora,
          tempo_resposta_min: tempoMin,
          status: "negociando",
        })
        .eq("id", orcamentoId)
      if (error) throw error

      const { error: aErr } = await supabase.from("orcamento_auditoria").insert({
        orcamento_id: orcamentoId,
        status_anterior: orcamento?.status || null,
        status_novo: "negociando",
        observacao: `Primeira resposta em ${tempoMin} min`,
      })
      if (aErr) throw aErr

      toast.success(`Primeira resposta registrada (${tempoMin} min)`)
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar resposta")
    } finally {
      setSaving(false)
    }
  }

  // ── Buscar produtos para adicionar ao orçamento ──
  useEffect(() => {
    if (!buscaProduto.trim()) {
      setResultadosBusca([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscandoProduto(true)
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, sku, price, preco_avulso, unit, stock")
          .ilike("name", `%${buscaProduto.trim()}%`)
          .eq("active", true)
          .limit(10)
        if (error) throw error
        setResultadosBusca(data || [])
      } catch {
        setResultadosBusca([])
      } finally {
        setBuscandoProduto(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [buscaProduto])

  async function adicionarProdutoAoOrcamento(p: any) {
    const jaExiste = itensEditados.find((i) => i.produto_id === p.id)
    if (jaExiste) {
      setItensEditados(itensEditados.map((i) =>
        i.produto_id === p.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ))
    } else {
      const preco = Number(p.preco_avulso || p.price || 0)
      setItensEditados([...itensEditados, {
        id: crypto.randomUUID(),
        produto_id: p.id,
        nome_produto: p.name,
        sku: p.sku || null,
        quantidade: 1,
        preco_aplicado: preco,
        preco_tabela: preco,
        tipo_preco: "avulso",
        ordem: itensEditados.length + 1,
        unidade: p.unit || "sc",
        peso_unitario_kg: 1,
        peso_total_kg: preco > 0 ? 0 : 0,
      }])
    }
    setBuscaProduto("")
    setResultadosBusca([])
  }

  // ── Salvar alterações de materiais, frete e desconto ──
  async function handleSaveItens() {
    setSaving(true)
    try {
      if (!orcamentoId) throw new Error("Orçamento não carregado")

      const subtotalMateriais = itensEditados.reduce(
        (s, i) => s + Number(i.preco_aplicado) * Number(i.quantidade), 0)
      const valorFrete = Number(freteEditado || 0)
      const descontoPix = Number(descontoPixManual || 0)
      const total = subtotalMateriais - descontoPix + valorFrete

      // Atualiza orçamento
      const { error: uErr } = await supabase
        .from("orcamentos")
        .update({ subtotal: subtotalMateriais, desconto_pix: descontoPix, valor_frete: valorFrete, total })
        .eq("id", orcamentoId)
      if (uErr) throw uErr

      // Remove itens antigos e insere novos
      const { error: dErr } = await supabase
        .from("orcamento_itens")
        .delete()
        .eq("orcamento_id", orcamentoId)
      if (dErr) throw dErr

      const itensParaInserir = itensEditados.map((i, idx) => ({
        id: crypto.randomUUID(),
        orcamento_id: orcamentoId,
        produto_id: i.produto_id,
        sku: i.sku || null,
        nome_produto: i.nome_produto,
        unidade: i.unidade || "sc",
        quantidade: Number(i.quantidade) || 1,
        preco_tabela: Number(i.preco_tabela || i.preco_aplicado || 0),
        preco_aplicado: Number(i.preco_aplicado || 0),
        tipo_preco: i.tipo_preco || "avulso",
        ordem: idx + 1,
        peso_unitario_kg: Number(i.peso_unitario_kg || 1),
        peso_total_kg: (Number(i.quantidade || 1) * Number(i.peso_unitario_kg || 1)),
      }))
      const { error: iErr } = await supabase
        .from("orcamento_itens")
        .insert(itensParaInserir)
      if (iErr) throw iErr

      // Auditoria
      await supabase.from("orcamento_auditoria").insert({
        orcamento_id: orcamentoId,
        status_anterior: orcamento?.status || null,
        status_novo: orcamento?.status || null,
        observacao: "Materiais e valores ajustados manualmente pelo operador",
      })

      toast.success("Orçamento atualizado com sucesso!")
      setModoEdicao(false)
      fetchOrcamento()
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Clock className="h-8 w-8 animate-spin text-slate-400 mb-2" />
        <p className="text-slate-500">Carregando orçamento...</p>
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] p-10 inline-block">
          <Clock className="h-10 w-10 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Orçamento não encontrado</h2>
          <p className="text-slate-500 mb-6">O código especificado não existe ou foi removido.</p>
          <Link
            href="/admin/orcamentos"
            className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#15803D] px-4 py-2 text-sm font-bold text-white hover:bg-[#166534] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para Orçamentos
          </Link>
        </div>
      </div>
    )
  }

  const statusBadge = STATUS_OPTIONS.find((s) => s.value === orcamento.status) || STATUS_OPTIONS[0]
  const jaAssumido = !!orcamento.atendente_id
  const jaRespondeu = !!orcamento.primeira_resposta_em
  const tempoResposta = orcamento.tempo_resposta_min
    ? ` em ${orcamento.tempo_resposta_min} min`
    : ""

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E3] pb-4 bg-white p-6 rounded-[4px]">
        <div className="flex items-center gap-3">
          <Link href="/admin/orcamentos" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] border border-[#E5E5E3] bg-[#FAFAF9]">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orçamento</span>
            <span className="text-sm font-bold text-[#111318]">{orcamento.codigo}</span>
          </div>
          <span className={`px-3 py-0.5 rounded-[4px] text-[10px] font-bold ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {jaAssumido ? (
            <button disabled className="flex items-center gap-2 rounded-[4px] bg-[#15803D] px-4 py-2 text-xs font-bold text-white">
              <User className="h-3.5 w-3.5" /> Assumido
            </button>
          ) : (
            <button
              onClick={handleAssumir}
              disabled={saving}
              className="flex items-center gap-2 rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60"
            >
              <User className="h-3.5 w-3.5" /> Assumir Orçamento
            </button>
          )}
          {jaRespondeu ? (
            <button disabled className="flex items-center gap-2 rounded-[4px] bg-emerald-100 text-emerald-700 px-4 py-2 text-xs font-bold">
              <MsgCircle className="h-3.5 w-3.5" /> Respondido{tempoResposta}
            </button>
          ) : (
            <button
              onClick={handlePrimeiraResposta}
              disabled={!jaAssumido || saving}
              className="flex items-center gap-2 rounded-[4px] bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <MsgCircle className="h-3.5 w-3.5" /> Primeira Resposta WhatsApp
            </button>
          )}
          <a
            href={`/orcamento/${orcamento.codigo}?t=${orcamento.token_acesso}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[4px] border border-[#E5E5E3] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#FAFAF9] transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Visualizar Proposta
          </a>
          <Link
            href={`/admin/orcamentos/novo?cloneFrom=${orcamento.codigo}`}
            className="flex items-center gap-2 rounded-[4px] border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#FAFAF9] transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicar / Ajustar Orçamento
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Dados do Cliente e Entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Nome</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_nome}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_telefone || "—"}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">E-mail</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.cliente_email || "—"}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Logradouro</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_logradouro || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Número</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_numero || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Complemento</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_complemento || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Bairro</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_bairro || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Cidade / UF</p>
                <p className="text-sm font-medium text-slate-900">
                  {orcamento.endereco_cidade || "—"} / {orcamento.endereco_uf || "—"}
                </p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">CEP</p>
                <p className="text-sm font-medium text-slate-900">{orcamento.endereco_cep || "—"}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E5E5E3]">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Modalidade</p>
              <p className="text-sm text-slate-700">
                {orcamento.metodo_entrega === "retirada" ? "Retirada no CD (Ribeirão Preto/SP)" : "Entrega no endereço informado"}
                {orcamento.requer_munck ? " · Munck necessário" : ""}
              </p>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#E5E5E3] bg-white overflow-hidden">
            <div className="border-b border-[#E5E5E3] bg-[#FAFAF9] px-5 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Materiais Cotados</h2>
              </div>
              {modoEdicao ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModoEdicao(false)}
                    className="flex items-center gap-2 rounded-[4px] border border-[#E5E5E3] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#FAFAF9] transition-colors"
                  >
                    <XIcon className="h-3.5 w-3.5" /> Cancelar
                  </button>
                  <button
                    onClick={handleSaveItens}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" /> Salvar Alterações
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setModoEdicao(true)
                    setItensEditados(itens.map((i) => ({ ...i })))
                    setFreteEditado(String(orcamento.valor_frete || 0))
                    setDescontoPixManual(String(orcamento.desconto_pix || 0))
                  }}
                  className="flex items-center gap-2 rounded-[4px] border border-[#15803D] text-[#15803D] px-3 py-1.5 text-xs font-bold hover:bg-[#15803D] hover:text-white transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar Itens / Valores
                </button>
              )}
            </div>
            <div className="p-4">
              {modoEdicao ? (
                <>
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                      placeholder="Buscar produto para adicionar..."
                      className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#15803D]"
                    />
                    {buscandoProduto && <p className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">Buscando...</p>}
                  </div>
                  {resultadosBusca.length > 0 && (
                    <div className="mb-4 absolute left-0 right-0 z-20 max-h-60 overflow-y-auto rounded-[4px] border border-[#E5E5E3] bg-white shadow-xl divide-y divide-[#E5E5E3]">
                      {resultadosBusca.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => adicionarProdutoAoOrcamento(p)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#FAFAF9] border-b border-[#E5E5E3] last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.sku || "Sem SKU"} · {p.unit || "un"} · Estoque: {p.stock}</div>
                          </div>
                          <Plus className="h-4 w-4 text-[#15803D]" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E5E3] text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-2.5">Produto</th>
                          <th className="px-4 py-2.5 w-16 text-center">SKU</th>
                          <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                          <th className="px-4 py-2.5 w-20 text-right">Preço Unit.</th>
                          <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                          <th className="px-4 py-2.5 w-12 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E3]">
                        {itensEditados.map((i, idx) => {
                          const sub = Number(i.preco_aplicado) * Number(i.quantidade)
                          return (
                            <tr key={i.id} className="hover:bg-[#FAFAF9]">
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-800">{i.nome_produto}</div>
                                {i.sku && <div className="text-[10px] text-slate-500 mt-0.5">SKU: {i.sku}</div>}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">{i.sku || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      const nova = Math.max(1, Number(i.quantidade) - 1)
                                      setItensEditados(itensEditados.map((x) => x.id === i.id ? { ...x, quantidade: nova } : x))
                                    }}
                                    className="p-1 text-slate-600 hover:text-[#C2410C]"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                  <span className="w-8 text-center font-mono font-bold text-slate-800">
                                    {Number(i.quantidade).toLocaleString("pt-BR")}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setItensEditados(itensEditados.map((x) => x.id === i.id ? { ...x, quantidade: Number(x.quantidade) + 1 } : x))
                                    }}
                                    className="p-1 text-slate-600 hover:text-[#15803D]"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  value={Number(i.preco_aplicado)}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 0
                                    setItensEditados(itensEditados.map((x) => x.id === i.id ? { ...x, preco_aplicado: v } : x))
                                  }}
                                  className="w-full h-8 rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-2 text-xs font-mono text-right text-slate-900 outline-none focus:border-[#15803D]"
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium">{brl(sub)}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setItensEditados(itensEditados.filter((x) => x.id !== i.id))}
                                  className="p-1 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E5E5E3] grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frete</label>
                      <input
                        type="number"
                        value={freteEditado}
                        onChange={(e) => setFreteEditado(e.target.value)}
                        placeholder="0,00"
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desconto PIX</label>
                      <input
                        type="number"
                        value={descontoPixManual}
                        onChange={(e) => setDescontoPixManual(e.target.value)}
                        placeholder="0,00"
                        className="w-full h-10 rounded-[4px] border border-[#E5E5E3] bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E5E3] text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2.5">Produto</th>
                      <th className="px-4 py-2.5 w-16 text-center">SKU</th>
                      <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                      <th className="px-4 py-2.5 w-20 text-right">Preço Unit.</th>
                      <th className="px-4 py-2.5 w-20 text-center">Tipo</th>
                      <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                      <th className="px-4 py-2.5 w-16 text-center">Peso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E3]">
                    {itensParaExibir.map((i) => {
                      const sub = Number(i.preco_aplicado) * Number(i.quantidade)
                      const tipoLabel = i.tipo_preco === "palete" ? "Palete" : i.tipo_preco === "carga_fechada" ? "Carga Fechada" : "Avulso"
                      return (
                        <tr key={i.id} className="hover:bg-[#FAFAF9]">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{i.nome_produto}</div>
                            {i.sku && <div className="text-[10px] text-slate-500 mt-0.5">{i.sku}</div>}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">{i.sku || "—"}</td>
                          <td className="px-4 py-3 text-center">{Number(i.quantidade).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right">{brl(Number(i.preco_aplicado))}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[9px] font-bold ${i.tipo_preco === "palete" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : i.tipo_preco === "carga_fechada" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-[#FAFAF9] text-slate-600 border-[#E5E5E3]"}`}>
                              {tipoLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{brl(sub)}</td>
                          <td className="px-4 py-3 text-center text-slate-600 font-mono">{Number(i.peso_total_kg || 0).toLocaleString("pt-BR")} kg</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Resumo Financeiro</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal Materiais</span>
                <span className="font-medium text-slate-900">{brl(totalItens)}</span>
              </div>
              {descontoPixDisplay > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto PIX</span>
                  <span className="font-semibold">- {brl(descontoPixDisplay)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frete</span>
                <span className="font-medium text-slate-900">{valorFreteDisplay === 0 ? "Grátis" : brl(valorFreteDisplay)}</span>
              </div>
              <div className="border-t border-[#E5E5E3] pt-3 mt-2 flex justify-between font-bold">
                <span className="text-sm">TOTAL GERAL</span>
                <span className="text-base font-black text-[#C2410C]">{brl(totalGeralDisplay)}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E5E5E3] rounded-[4px] border border-amber-100 bg-amber-50 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Chave PIX da Transação</h3>
              <div className="flex items-center gap-2">
                <input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="ex: financeiro@discibra.com" className="flex-1 rounded-[4px] border border-amber-200 px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-[#15803D]" />
                <button onClick={handleSavePix} disabled={saving} className="rounded-[4px] bg-[#15803D] px-3 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60 transition-colors">{saving ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Alterar Status</h2>
            <div className="space-y-3">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2.5 text-sm outline-none focus:border-[#15803D]">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observação</label>
                <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} className="w-full rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-sm outline-none focus:border-[#15803D]" placeholder="Ex: Pagamento confirmado via PIX" />
              </div>
              <button onClick={handleSaveStatus} disabled={saving || status === orcamento.status} className="w-full rounded-[4px] bg-[#15803D] hover:bg-[#166534] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed">{saving ? "Salvando..." : "Salvar Status"}</button>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Linha do Tempo de Auditoria</h2>
            <div className="space-y-3">
              {auditoria.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sem alterações de status registradas.</p>
              ) : (
                auditoria.slice().reverse().map((a, i) => (
                  <div key={i} className="relative pl-4 pb-3">
                    <div className="absolute left-0 top-1 w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold ${a.status_novo === "entregue" ? "bg-green-100 text-green-700" : a.status_novo === "cancelado" ? "bg-red-100 text-red-700" : a.status_novo === "aprovado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[a.status_novo] || a.status_novo}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(a.criado_em).toLocaleString("pt-BR")}</span>
                    </div>
                    {a.status_anterior !== null && <p className="text-xs text-slate-500 ml-6">De: <span className="font-medium">{STATUS_LABELS[a.status_anterior] || a.status_anterior}</span></p>}
                    {a.observacao && <p className="text-xs text-slate-700 ml-6 italic">"{a.observacao}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {clienteFicha && (
            <div className="rounded-[4px] border border-[#E5E5E3] bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Ficha do Cliente</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total de Orçamentos</span>
                  <span className="font-medium text-slate-900">{clienteFicha.total_orcamentos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Aprovados</span>
                  <span className="font-medium text-emerald-600">{clienteFicha.total_aprovados}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Receita Total</span>
                  <span className="font-medium text-[#111318]">{brl(clienteFicha.receita_total || 0)}</span>
                </div>
                {clienteFicha.primeira_compra_em && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Primeira Compra</span>
                    <span className="font-medium text-slate-600">{new Date(clienteFicha.primeira_compra_em).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                {clienteFicha.ultima_compra_em && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Última Compra</span>
                    <span className="font-medium text-slate-600">{new Date(clienteFicha.ultima_compra_em).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                {clienteFicha.bloqueado && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-bold text-xs">BLOQUEADO</span>
                    <span className="font-medium">{clienteFicha.motivo_bloqueio || "Sem motivo informado"}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
