/**
 * Regras de frete — Discibra Distribuidora (B2C)
 * Endereço base: Rua Igarapava, 73, Vila Albertina, Ribeirão Preto/SP (CEP 14060-000)
 */

export interface ConfiguracaoFrete {
  km_max: number;
  km_faixa_anterior: number;
  valor_base: number;
  valor_km_adicional: number;
  valor_minimo_frete_gratis: number | null;
  taxa_munck: number;
}

export interface ResultadoFrete {
  valorFrete: number;
  freteAConfirmar: boolean;
  requerMunck: boolean;
  sugerirRetirada: boolean;
  faixaUsada: string;
}

/**
 * Calcula o frete com base nas 6 faixas reais de distância.
 *
 * Regras:
 * - Retirada: frete sempre 0.
 * - Acima de 90 km: frete a confirmar (valor 0), sugestão de retirada.
 * - Seleção da faixa: km_max >= distanciaKp, a menor faixa que cobre.
 * - Frete grátis: se subtotal >= valor_minimo_frete_gratis da faixa.
 *   (frete grátis usa subtotal APÓS desconto de volume e ANTES do desconto PIX)
 * - Munck: obrigatório se totalKg > 4000 (acima de ~80 sacos de 50kg). +R$ 250.
 * - Fórmula: valor_base + valor_km_adicional * MAX(0, km - km_faixa_anterior).
 * - Sugestão de retirada: se valorFrete > 12% do subtotal.
 */
export function calcularFrete(params: {
  subtotal: number;
  distanciaKm: number;
  totalKg: number;
  metodoEntrega: 'entrega' | 'retirada';
  configuracoes: ConfiguracaoFrete[];
}): ResultadoFrete {
  const { subtotal, distanciaKm, totalKg, metodoEntrega, configuracoes } = params;

  if (metodoEntrega === 'retirada') {
    return {
      valorFrete: 0,
      freteAConfirmar: false,
      requerMunck: false,
      sugerirRetirada: false,
      faixaUsada: 'retirada',
    };
  }

  const requerMunck = totalKg > 4000; // acima de ~80 sacos de 50 kg

  // Acima de 90 km: frete sob consulta
  if (distanciaKm > 90) {
    return {
      valorFrete: 0,
      freteAConfirmar: true,
      requerMunck,
      sugerirRetirada: true,
      faixaUsada: '>90km',
    };
  }

  // Seleciona a menor faixa que cobre a distância
  const config = configuracoes
    .filter((c) => distanciaKm <= c.km_max)
    .sort((a, b) => a.km_max - b.km_max)[0];

  if (!config) {
    return {
      valorFrete: 0,
      freteAConfirmar: true,
      requerMunck,
      sugerirRetirada: true,
      faixaUsada: 'sem_config',
    };
  }

  // Frete grátis por valor mínimo da faixa (munck ainda incide se exigido)
  if (
    config.valor_minimo_frete_gratis !== null &&
    subtotal >= config.valor_minimo_frete_gratis
  ) {
    const valorMunck = requerMunck ? config.taxa_munck : 0;
    return {
      valorFrete: valorMunck,
      freteAConfirmar: false,
      requerMunck,
      sugerirRetirada: false,
      faixaUsada: `${config.km_max}km`,
    };
  }

  // Cálculo por faixa: valor_base + valor_km_adicional * excedente sobre faixa anterior
  const kmAdicional = Math.max(0, distanciaKm - config.km_faixa_anterior);
  let valorFrete = config.valor_base + config.valor_km_adicional * kmAdicional;

  if (requerMunck) {
    valorFrete += config.taxa_munck;
  }

  const sugerirRetirada = valorFrete > subtotal * 0.12;

  return {
    valorFrete: Math.round(valorFrete * 100) / 100,
    freteAConfirmar: false,
    requerMunck,
    sugerirRetirada,
    faixaUsada: `${config.km_max}km`,
  };
}
