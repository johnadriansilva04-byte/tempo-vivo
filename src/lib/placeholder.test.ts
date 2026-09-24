import { describe, expect, it } from "vitest";
import { isPlaceholderText, readableText, stripPlaceholderBrackets } from "@/lib/placeholder";

describe("isPlaceholderText", () => {
  it("reconhece convite entre colchetes", () => {
    expect(isPlaceholderText("Vive em [cidade]")).toBe(true);
    expect(isPlaceholderText("[O que você estudou, onde]")).toBe(true);
  });

  it("não marca texto do dono como placeholder", () => {
    expect(isPlaceholderText("Vive em Belo Horizonte")).toBe(false);
    expect(isPlaceholderText("")).toBe(false);
  });
});

describe("stripPlaceholderBrackets", () => {
  it("remove os colchetes preservando o conteúdo", () => {
    expect(stripPlaceholderBrackets("[cidade]")).toBe("cidade");
    expect(stripPlaceholderBrackets("Vive em [Belo Horizonte]")).toBe("Vive em Belo Horizonte");
  });

  it("remove múltiplos colchetes", () => {
    expect(stripPlaceholderBrackets("[a] e [b]")).toBe("a e b");
  });
});

describe("readableText", () => {
  it("limpa espaços duplicados deixados pela remoção", () => {
    expect(readableText("Vive em   [cidade]")).toBe("Vive em cidade");
  });

  it("remove espaço antes de pontuação", () => {
    expect(readableText("Belo Horizonte [município] .")).toBe("Belo Horizonte município.");
  });
});
