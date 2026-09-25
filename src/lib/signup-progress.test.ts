import { describe, expect, it } from "vitest";
import {
  isAccessComplete,
  isIdentityComplete,
  isRecoveryComplete,
  signupProgress,
} from "@/lib/signup-progress";
import type { SignupDraft } from "@/lib/signup-progress";

const base: SignupDraft = {
  name: "Maria Silva",
  age: "34",
  phone: "31988887777",
  password: "segredo",
  confirm: "segredo",
  question: "Cidade onde nasceu",
  answer: "Belo Horizonte",
};

describe("isIdentityComplete", () => {
  it("exige nome e idade juntos", () => {
    expect(isIdentityComplete(base)).toBe(true);
    expect(isIdentityComplete({ ...base, name: "   " })).toBe(false);
    expect(isIdentityComplete({ ...base, age: "" })).toBe(false);
  });

  it("recusa idade fora do horizonte do app", () => {
    expect(isIdentityComplete({ ...base, age: "0" })).toBe(false);
    expect(isIdentityComplete({ ...base, age: "121" })).toBe(false);
    expect(isIdentityComplete({ ...base, age: "120" })).toBe(true);
  });

  it("recusa idade fracionada", () => {
    expect(isIdentityComplete({ ...base, age: "34.5" })).toBe(false);
  });
});

describe("isAccessComplete", () => {
  it("exige telefone válido e senha confirmada", () => {
    expect(isAccessComplete(base)).toBe(true);
  });

  it("recusa telefone curto demais", () => {
    expect(isAccessComplete({ ...base, phone: "319888877" })).toBe(false);
  });

  it("recusa senha curta", () => {
    expect(isAccessComplete({ ...base, password: "abc", confirm: "abc" })).toBe(false);
  });

  it("recusa confirmação diferente", () => {
    expect(isAccessComplete({ ...base, confirm: "outra" })).toBe(false);
  });
});

describe("isRecoveryComplete", () => {
  it("exige pergunta e resposta", () => {
    expect(isRecoveryComplete(base)).toBe(true);
    expect(isRecoveryComplete({ ...base, question: "  " })).toBe(false);
    expect(isRecoveryComplete({ ...base, answer: "  " })).toBe(false);
  });
});

describe("signupProgress", () => {
  it("conta os blocos concluídos e libera quando os três estão prontos", () => {
    expect(signupProgress(base)).toMatchObject({ completed: 3, total: 3, ready: true });
  });

  it("um rascunho vazio não libera nada", () => {
    const empty = signupProgress({
      name: "",
      age: "",
      phone: "",
      password: "",
      confirm: "",
      question: "",
      answer: "",
    });
    expect(empty.completed).toBe(0);
    expect(empty.ready).toBe(false);
  });

  it("conta blocos parciais sem liberar o envio", () => {
    const partial = signupProgress({ ...base, phone: "" });
    expect(partial.identity).toBe(true);
    expect(partial.access).toBe(false);
    expect(partial.recovery).toBe(true);
    expect(partial.completed).toBe(2);
    expect(partial.ready).toBe(false);
  });
});
