/**
 * Regras de telefone — Discibra Distribuidora (B2C)
 * Validação e formatação de telefone brasileiro (DDD + 8/9 dígitos).
 */

/**
 * Remove todos os caracteres não numéricos e remove DDI 55 inicial se presente.
 */
export function normalizarTelefone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) {
    d = d.slice(2);
  }
  return d;
}

/**
 * Valida se o telefone tem DDD válido (11 a 99) e 8 ou 9 dígitos.
 * O primeiro dígito da parte local deve ser 9 quando tem 9 dígitos (celular).
 */
export function telefoneValido(v: string): boolean {
  const d = normalizarTelefone(v);
  if (d.length < 10 || d.length > 11) return false;

  const ddd = d.slice(0, 2);
  const dddNum = Number(ddd);
  if (dddNum < 11 || dddNum > 99) return false;

  const parteLocal = d.slice(2);
  if (parteLocal.length === 9) {
    // Celular: deve começar com 9
    return /^9[0-9]{8}$/.test(parteLocal);
  }
  // Fixo: 8 dígitos, começa com 2-5
  return /^[2-5][0-9]{7}$/.test(parteLocal);
}

/**
 * Formata o telefone para exibição: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 */
export function formatarTelefone(v: string): string {
  const d = normalizarTelefone(v);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return d;
}
