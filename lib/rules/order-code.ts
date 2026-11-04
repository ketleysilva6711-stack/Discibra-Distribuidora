/**
 * Geração de código de orçamento não sequencial: ORC-XXXXXX
 * Charset limpo: exclui I, O, 0, 1 para evitar ambiguidade visual.
 */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarCodigo(): string {
  return (
    'ORC-' +
    Array.from({ length: 6 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('')
  );
}

/**
 * Tenta inserir um registro com código único, fazendo retry em caso de
 * violação de UNIQUE (condição de corrida). Código 23505 = unique_violation no Postgres.
 */
export async function inserirComRetryCodigo<T>(
  inserirFn: (codigo: string) => Promise<{ data: T | null; error: any }>,
  maxTentativas = 5
): Promise<{ data: T | null; codigo: string }> {
  let ultimoErro: any = null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const codigo = gerarCodigo();
    const { data, error } = await inserirFn(codigo);

    if (!error) {
      return { data, codigo };
    }

    ultimoErro = error;

    const isConflict =
      error?.code === '23505' ||
      error?.message?.includes('violates unique constraint') ||
      error?.message?.includes('already exists');

    if (!isConflict || tentativa === maxTentativas) {
      throw error;
    }
  }

  throw ultimoErro ?? new Error(`Falha ao inserir registro com código único após ${maxTentativas} tentativas`);
}
