import { notFound } from "next/navigation"
import { createAdminClient, isAdminServerConfigured } from "@/lib/supabase/admin"
import OrcamentoPublicoClient from "./OrcamentoPublicoClient"

export const dynamic = "force-dynamic"

async function getQuotationByToken(token: string) {
  if (!isAdminServerConfigured()) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("quotations")
    .select("*, quotation_leads(*), quotation_items(*)")
    .eq("token", token)
    .maybeSingle()
  return data
}

export default async function OrcamentoPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const quotation = await getQuotationByToken(token)
  if (!quotation) notFound()
  return <OrcamentoPublicoClient quotation={quotation} />
}
