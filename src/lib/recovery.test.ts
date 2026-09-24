import { describe, expect, it } from "vitest";
import {
  MIN_ANSWER_LENGTH,
  RECOVERY_QUESTIONS,
  isPresetQuestion,
  isValidAnswer,
  isValidQuestion,
  normalizeAnswer,
} from "@/lib/recovery";

describe("normalizeAnswer", () => {
  it("ignora maiúsculas", () => {
    expect(normalizeAnswer("Escola Sao Jose")).toBe("escola sao jose");
  });

  it("remove acentos", () => {
    expect(normalizeAnswer("Escola São José")).toBe("escola sao jose");
  });

  it("colapsa espaços em excesso e apara as pontas", () => {
    expect(normalizeAnswer("  escola   sao   jose  ")).toBe("escola sao jose");
  });

  it("trata tabulação e quebra de linha como espaço", () => {
    expect(normalizeAnswer("escola\n\tSao Jose")).toBe("escola sao jose");
  });

  it("devolve vazio para entrada vazia", () => {
    expect(normalizeAnswer("   ")).toBe("");
  });
});

describe("isValidAnswer", () => {
  it("exige pelo menos o mínimo de caracteres úteis", () => {
    expect(isValidAnswer("a")).toBe(false);
    expect(isValidAnswer("ab")).toBe(true);
    expect(isValidAnswer("Escola Sao Jose")).toBe(true);
  });

  it("não conta espaços nas pontas como conteúdo", () => {
    expect(isValidAnswer("   a   ")).toBe(false);
  });

  it("respeita MIN_ANSWER_LENGTH", () => {
    const exact = "a".repeat(MIN_ANSWER_LENGTH);
    expect(isValidAnswer(exact)).toBe(true);
    expect(isValidAnswer("a".repeat(MIN_ANSWER_LENGTH - 1))).toBe(false);
  });
});

describe("isValidQuestion", () => {
  it("aceita as perguntas do catálogo", () => {
    for (const question of RECOVERY_QUESTIONS) {
      expect(isValidQuestion(question)).toBe(true);
    }
  });

  it("recusa pergunta curta demais", () => {
    expect(isValidQuestion("ab")).toBe(false);
  });

  it("recusa pergunta longa demais", () => {
    expect(isValidQuestion("a".repeat(121))).toBe(false);
  });
});

describe("isPresetQuestion", () => {
  it("reconhece pergunta do catálogo, com ou sem espaços", () => {
    expect(isPresetQuestion(RECOVERY_QUESTIONS[0])).toBe(true);
    expect(isPresetQuestion(`  ${RECOVERY_QUESTIONS[0]} `)).toBe(true);
  });

  it("não confunde pergunta autoral com pergunta do catálogo", () => {
    expect(isPresetQuestion("Qual o nome da minha primeira rua?")).toBe(false);
  });
});
