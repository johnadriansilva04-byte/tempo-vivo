import { describe, expect, it } from "vitest";
import {
  deaccent,
  handleFromName,
  isValidHandle,
  normalizeHandle,
  resolveHandle,
  sameHandle,
} from "@/lib/handle";

describe("handleFromName", () => {
  it("cria um slug simples", () => {
    expect(handleFromName("John Adrian")).toBe("john-adrian");
    expect(handleFromName("Ana Costa")).toBe("ana-costa");
  });

  it("remove acentos e cedilha", () => {
    expect(handleFromName("João Adrián")).toBe("joao-adrian");
    expect(handleFromName("Conceição")).toBe("conceicao");
  });

  it("colapsa separadores e apara as pontas", () => {
    expect(handleFromName("  Maria   Clara  ")).toBe("maria-clara");
    expect(handleFromName("--Ana--")).toBe("ana");
  });

  it("devolve vazio quando não há letra ou número", () => {
    expect(handleFromName("!!!")).toBe("");
    expect(handleFromName("")).toBe("");
  });

  it("limita o tamanho a 30 caracteres", () => {
    expect(handleFromName("a".repeat(50)).length).toBe(30);
  });
});

describe("normalizeHandle", () => {
  it("aceita a forma com @", () => {
    expect(normalizeHandle("@johnadrian")).toBe("johnadrian");
  });
});

describe("isValidHandle", () => {
  it("aceita handles com letras, números e hífen", () => {
    expect(isValidHandle("john-adrian")).toBe(true);
    expect(isValidHandle("ana2")).toBe(true);
  });

  it("recusa handles curtos, vazios ou com hífen na ponta", () => {
    expect(isValidHandle("a")).toBe(false);
    expect(isValidHandle("-ana")).toBe(false);
    expect(isValidHandle("ana-")).toBe(false);
    expect(isValidHandle("Ana Costa")).toBe(false);
  });
});

describe("deaccent", () => {
  it("mantém texto sem acento intacto", () => {
    expect(deaccent("hello")).toBe("hello");
  });
});

describe("resolveHandle", () => {
  it("prefere o handle guardado", () => {
    expect(resolveHandle({ handle: "john-adrian", name: "João Adrián" })).toBe("john-adrian");
  });

  it("deriva do nome quando o handle está vazio", () => {
    expect(resolveHandle({ handle: "", name: "João Adrián" })).toBe("joao-adrian");
    expect(resolveHandle({ name: "Ana Teste" })).toBe("ana-teste");
  });

  it("normaliza o handle guardado (com @ e maiúsculas)", () => {
    expect(resolveHandle({ handle: "@John-Adrian", name: "Outro" })).toBe("john-adrian");
  });

  it("devolve vazio quando não há nome nem handle útil", () => {
    expect(resolveHandle({ name: "" })).toBe("");
    expect(resolveHandle({ handle: "!!!" })).toBe("");
  });
});

describe("sameHandle", () => {
  it("ignora @, caixa e acentos", () => {
    expect(sameHandle("@João-Adrian", "joao-adrian")).toBe(true);
    expect(sameHandle("Ana Costa", "ana-costa")).toBe(true);
  });

  it("não considera vazios equivalentes", () => {
    expect(sameHandle("", "")).toBe(false);
    expect(sameHandle("!!!", "!!!")).toBe(false);
  });

  it("recusa handles diferentes", () => {
    expect(sameHandle("ana", "bruno")).toBe(false);
  });
});
