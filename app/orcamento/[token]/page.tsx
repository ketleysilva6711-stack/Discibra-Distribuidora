import { notFound, redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import OrcamentoPublicoClient from "./OrcamentoPublicoClient"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

async function getOrcamentoByCodigo(codigo: string, tokenAcesso: string | null) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*, orcamento_itens(*)")
    .eq("codigo", codigo)
    .maybeSingle()
  if (error || !data) return null
  if (!tokenAcesso || data.token_acesso !== tokenAcesso) return null
  return data
}

export default async function OrcamentoPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { token } = await params
  const { t } = await searchParams

  const orcamento = await getOrcamentoByCodigo(token, t ?? null)
  if (!orcamento) redirect("/404")

  return <OrcamentoPublicoClient orcamento={orcamento} />
}
