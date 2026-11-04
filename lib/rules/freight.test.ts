import { describe, it, expect } from 'vitest';
import { calcularFrete } from './freight';

const configs = [
  { km_max: 20, km_faixa_anterior: 0, valor_base: 60, valor_km_adicional: 0, valor_minimo_frete_gratis: 2500, taxa_munck: 250 },
  { km_max: 50, km_faixa_anterior: 20, valor_base: 130, valor_km_adicional: 0, valor_minimo_frete_gratis: 4000, taxa_munck: 250 },
  { km_max: 70, km_faixa_anterior: 50, valor_base: 240, valor_km_adicional: 3, valor_minimo_frete_gratis: null, taxa_munck: 250 },
  { km_max: 90, km_faixa_anterior: 70, valor_base: 320, valor_km_adicional: 4, valor_minimo_frete_gratis: null, taxa_munck: 250 },
];

describe('calcularFrete', () => {
  it('15 km, subtotal R$ 2.600 → frete grátis (faixa até 20 km)', () => {
    const r = calcularFrete({
      subtotal: 2600,
      distanciaKm: 15,
      totalKg: 2000,
      metodoEntrega: 'entrega',
      configuracoes: configs,
    });
    expect(r.valorFrete).toBe(0);
    expect(r.freteAConfirmar).toBe(false);
    expect(r.faixaUsada).toBe('20km');
  });

  it('35 km, subtotal R$ 3.500 → cobrado (sem gratuidade na faixa até 50 km)', () => {
    const r = calcularFrete({
      subtotal: 3500,
      distanciaKm: 35,
      totalKg: 2000,
      metodoEntrega: 'entrega',
      configuracoes: configs,
    });
    expect(r.valorFrete).toBeGreaterThan(0);
    expect(r.faixaUsada).toBe('50km');
  });

  it('81 sacos (4.050 kg > 4.000) → requer munck +R$ 250', () => {
    const r = calcularFrete({
      subtotal: 5000,
      distanciaKm: 10,
      totalKg: 4050,
      metodoEntrega: 'entrega',
      configuracoes: configs,
    });
    expect(r.requerMunck).toBe(true);
    // Grátis na faixa até 20 km (subtotal >= 2500), mas munck é cobrado
    expect(r.valorFrete).toBe(250);
  });

  it('95 km → frete_a_confirmar e sugerir retirada', () => {
    const r = calcularFrete({
      subtotal: 10000,
      distanciaKm: 95,
      totalKg: 1000,
      metodoEntrega: 'entrega',
      configuracoes: configs,
    });
    expect(r.freteAConfirmar).toBe(true);
    expect(r.sugerirRetirada).toBe(true);
    expect(r.valorFrete).toBe(0);
  });

  it('retirada → R$ 0 sempre, sem sugestão', () => {
    const r = calcularFrete({
      subtotal: 100,
      distanciaKm: 100,
      totalKg: 5000,
      metodoEntrega: 'retirada',
      configuracoes: configs,
    });
    expect(r.valorFrete).toBe(0);
    expect(r.sugerirRetirada).toBe(false);
    expect(r.freteAConfirmar).toBe(false);
  });

  it('frete > 12% do subtotal → sugere retirada', () => {
    const r = calcularFrete({
      subtotal: 500,
      distanciaKm: 70,
      totalKg: 1000,
      metodoEntrega: 'entrega',
      configuracoes: configs,
    });
    expect(r.sugerirRetirada).toBe(true);
  });
});
