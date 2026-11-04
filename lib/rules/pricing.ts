/**
 * Regras de precificação — Discibra Distribuidora (B2C)
 * Regras puras, sem efeitos colaterais. Todo preço é derivado do banco de dados.
 */

export type TipoPreco = 'avulso' | 'palete' | 'carga_fechada';

export interface PrecosProduto {
  preco_avulso: number;
  preco_palete: number;
  preco_carga_fechada: number;
}

export interface ItemCalculo {
  tipo: TipoPreco;
  precoTabela: number;
  precoAplicado: number;
  subtotal: number;
  pesoTotalKg: number;
  faltaParaProximoNivel: number;
  proximoNivelNome: string | null;
}

/**
 * Determina a faixa de preço com base na quantidade.
 * Regras de volume:
 *   qty < 40  → avulso
 *   40 <= qty <= 559 → palete
 *   qty >= 560 → carga_fechada
 *   qty > 640 → múltiplos de 640 em carga fechada + excedente pela regra padrão
 */
export function calcularTipoPreco(quantidade: number): TipoPreco {
  if (quantidade >= 560) return 'carga_fechada';
  if (quantidade >= 40) return 'palete';
  return 'avulso';
}

/**
 * Calcula o preço do item com base na escada de preços do produto.
 * Retorna tipo, preço de tabela (referência avulso), preço aplicado,
 * subtotal, peso total e indicação do próximo nível de desconto.
 */
export function calcularPrecoItem(
  produto: PrecosProduto,
  quantidade: number,
  pesoUnitarioKg: number = 1
): ItemCalculo {
  const tipo = calcularTipoPreco(quantidade);

  const map: Record<TipoPreco, number> = {
    avulso: produto.preco_avulso,
    palete: produto.preco_palete,
    carga_fechada: produto.preco_carga_fechada,
  };

  const precoTabela = produto.preco_avulso;
  const precoAplicado = map[tipo];
  const subtotal = precoAplicado * quantidade;
  const pesoTotalKg = pesoUnitarioKg * quantidade;

  // Indica quanto falta para o próximo nível de desconto
  let faltaParaProximoNivel: number;
  let proximoNivelNome: string | null;

  if (tipo === 'avulso') {
    faltaParaProximoNivel = 40 - quantidade;
    proximoNivelNome = 'Palete Fechado (40+ un)';
  } else if (tipo === 'palete') {
    faltaParaProximoNivel = 560 - quantidade;
    proximoNivelNome = 'Carga Fechada (560+ un)';
  } else {
    faltaParaProximoNivel = 0;
    proximoNivelNome = null;
  }

  return {
    tipo,
    precoTabela,
    precoAplicado,
    subtotal,
    pesoTotalKg,
    faltaParaProximoNivel,
    proximoNivelNome,
  };
}

/**
 * Calcula o desconto de pagamento (PIX 3% ou cartão 0%).
 * Subtotal líquido = subtotal de materiais já com desconto de volume embutido.
 */
export function calcularDescontoPix(
  subtotal: number,
  formaPagamento: 'pix' | 'cartao'
): number {
  if (formaPagamento !== 'pix') return 0;
  return Math.round(subtotal * 0.03 * 100) / 100;
}
