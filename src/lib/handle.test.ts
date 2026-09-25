import { describe, expect, it } from "vitest";
import { deaccent, handleFromName, isValidHandle, normalizeHandle } from "@/lib/handle";

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
