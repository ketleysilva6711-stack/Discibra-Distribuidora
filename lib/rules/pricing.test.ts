import { describe, it, expect } from 'vitest';
import { calcularTipoPreco, calcularPrecoItem, calcularDescontoPix } from './pricing';

const produto = {
  preco_avulso: 33.90,
  preco_palete: 32.88,
  preco_carga_fechada: 31.53,
};

describe('calcularTipoPreco', () => {
  it('qty=1 → avulso', () => expect(calcularTipoPreco(1)).toBe('avulso'));
  it('qty=39 → avulso', () => expect(calcularTipoPreco(39)).toBe('avulso'));
  it('qty=40 → palete', () => expect(calcularTipoPreco(40)).toBe('palete'));
  it('qty=559 → palete', () => expect(calcularTipoPreco(559)).toBe('palete'));
  it('qty=560 → carga_fechada', () => expect(calcularTipoPreco(560)).toBe('carga_fechada'));
  it('qty=640 → carga_fechada', () => expect(calcularTipoPreco(640)).toBe('carga_fechada'));
  it('qty=641 → carga_fechada', () => expect(calcularTipoPreco(641)).toBe('carga_fechada'));
});

describe('calcularPrecoItem', () => {
  it('1 saco aplica preço avulso', () => {
    const r = calcularPrecoItem(produto, 1);
    expect(r.tipo).toBe('avulso');
    expect(r.precoAplicado).toBe(33.90);
    expect(r.faltaParaProximoNivel).toBe(39);
    expect(r.proximoNivelNome).toBe('Palete Fechado (40+ un)');
  });

  it('40 sacos aplica preço palete', () => {
    const r = calcularPrecoItem(produto, 40);
    expect(r.tipo).toBe('palete');
    expect(r.precoAplicado).toBe(32.88);
    expect(r.subtotal).toBe(32.88 * 40);
    expect(r.faltaParaProximoNivel).toBe(520);
  });

  it('560 sacos aplica preço carga fechada', () => {
    const r = calcularPrecoItem(produto, 560);
    expect(r.tipo).toBe('carga_fechada');
    expect(r.precoAplicado).toBe(31.53);
    expect(r.faltaParaProximoNivel).toBe(0);
    expect(r.proximoNivelNome).toBe(null);
  });

  it('559 sacos ainda é palete', () => {
    const r = calcularPrecoItem(produto, 559);
    expect(r.tipo).toBe('palete');
    expect(r.precoAplicado).toBe(32.88);
    expect(r.faltaParaProximoNivel).toBe(1);
  });
});

describe('calcularDescontoPix', () => {
  it('aplica 3% de desconto no PIX', () => {
    expect(calcularDescontoPix(1000, 'pix')).toBe(30);
    expect(calcularDescontoPix(2500, 'pix')).toBe(75);
  });

  it('0% de desconto no cartão', () => {
    expect(calcularDescontoPix(1000, 'cartao')).toBe(0);
    expect(calcularDescontoPix(0, 'cartao')).toBe(0);
  });
});
