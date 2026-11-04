/**
 * Regras de cliente — Discibra Distribuidora (B2C)
 * Obtém ou cria cliente com deduplicação por telefone e verificação de bloqueio.
 */

import { createAdminClient } from "@/lib/supabase/admin";

type ClienteInput = {
  telefone: string;
  nome?: string | null;
  email?: string | null;
  consentimentoLgpd?: boolean;
};

type ClienteSaida = {
  id: string;
  telefone: string;
  nome: string | null;
  bloqueado: boolean;
};

/**
 * Obtém um cliente existente por telefone ou cria um novo.
 * Se o cliente estiver bloqueado, lança Error('CLIENTE_BLOQUEADO').
 */
export async function obterOuCriarCliente(
  supabase: ReturnType<typeof createAdminClient>,
  input: ClienteInput
): Promise<ClienteSaida> {
  const telefone = input.telefone.replace(/\D/g, "");

  // Verificar se cliente já existe
  const { data: existente } = await supabase
    .from("clientes")
    .select("*")
    .eq("telefone", telefone)
    .maybeSingle();

  if (existente) {
    if (existente.bloqueado) {
      throw new Error("CLIENTE_BLOQUEADO");
    }

    // Atualizar nome se fornecido e incrementar total de orçamentos
    const updates: Record<string, unknown> = {
      total_orcamentos: (existente.total_orcamentos || 0) + 1,
      atualizado_em: new Date().toISOString(),
    };
    if (input.nome) updates.nome = input.nome;
    if (input.email) updates.email = input.email;
    if (input.consentimentoLgpd) updates.consentimento_lgpd_em = new Date().toISOString();

    await supabase.from("clientes").update(updates).eq("id", existente.id);

    return {
      id: existente.id,
      telefone: existente.telefone,
      nome: existente.nome,
      bloqueado: existente.bloqueado,
    };
  }

  // Criar novo cliente
  const { data: novo, error: createErr } = await supabase
    .from("clientes")
    .insert({
      telefone,
      nome: input.nome || null,
      email: input.email || null,
      aceita_whatsapp: true,
      consentimento_lgpd_em: input.consentimentoLgpd ? new Date().toISOString() : null,
      bloqueado: false,
      total_orcamentos: 1,
      total_aprovados: 0,
      receita_total: 0,
    })
    .select("id, telefone, nome, bloqueado")
    .single();

  if (createErr) throw createErr;

  return {
    id: novo.id,
    telefone: novo.telefone,
    nome: novo.nome,
    bloqueado: novo.bloqueado,
  };
}
