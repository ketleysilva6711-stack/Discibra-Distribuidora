import { describe, it, expect } from "vitest";
import { normalizarTelefone, telefoneValido, formatarTelefone } from "./phone";

describe("normalizarTelefone", () => {
  it("remove máscara e DDI 55", () => {
    expect(normalizarTelefone("(16) 99999-9999")).toBe("16999999999");
    expect(normalizarTelefone("+55 16 99999-9999")).toBe("16999999999");
    expect(normalizarTelefone("5516999999999")).toBe("16999999999");
  });

  it("mantém telefone fixo sem DDI", () => {
    expect(normalizarTelefone("(16) 3333-4444")).toBe("1633334444");
  });
});

describe("telefoneValido", () => {
  it("aceita celular 9 dígitos com DDD válido", () => {
    expect(telefoneValido("16999999999")).toBe(true);
    expect(telefoneValido("(16) 99999-9999")).toBe(true);
  });

  it("aceita celular com DDI 55", () => {
    expect(telefoneValido("+55 16 99999-9999")).toBe(true);
    expect(telefoneValido("5516999999999")).toBe(true);
  });

  it("aceita telefone fixo 8 dígitos", () => {
    expect(telefoneValido("1633334444")).toBe(true);
    expect(telefoneValido("(16) 3333-4444")).toBe(true);
  });

  it("rejeita DDD inválido (00)", () => {
    expect(telefoneValido("00999999999")).toBe(false);
  });

  it("rejeita celular que não começa com 9", () => {
    expect(telefoneValido("16899999999")).toBe(false);
  });

  it("rejeita telefone muito curto", () => {
    expect(telefoneValido("169999999")).toBe(false);
    expect(telefoneValido("99999999")).toBe(false);
  });

  it("rejeita telefone muito longo", () => {
    expect(telefoneValido("169999999999")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(telefoneValido("")).toBe(false);
  });
});

describe("formatarTelefone", () => {
  it("formata celular", () => {
    expect(formatarTelefone("16999999999")).toBe("(16) 99999-9999");
  });

  it("formata fixo", () => {
    expect(formatarTelefone("1633334444")).toBe("(16) 3333-4444");
  });

  it("mantém telefone inválido inalterado", () => {
    expect(formatarTelefone("123")).toBe("123");
  });
});
