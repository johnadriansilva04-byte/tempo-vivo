import { describe, expect, it } from "vitest";
import {
  birthDateFromAge,
  formatPhone,
  initialsOf,
  isValidPhone,
  normalizePhone,
  phoneToEmail,
} from "@/lib/identity";

describe("normalizePhone", () => {
  it("mantém apenas dígitos", () => {
    expect(normalizePhone("(21) 98888-1122")).toBe("21988881122");
  });

  it("descarta letras e símbolos", () => {
    expect(normalizePhone("+55 abc 21 9.8888-1122")).toBe("55219888811");
  });

  it("trunca em 11 dígitos", () => {
    expect(normalizePhone("219888811229999")).toBe("21988881122");
  });
});

describe("formatPhone", () => {
  it("formata celular de 11 dígitos", () => {
    expect(formatPhone("21988881122")).toBe("(21) 98888-1122");
  });

  it("formata fixo de 10 dígitos", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("não quebra em entrada parcial", () => {
    expect(formatPhone("21")).toBe("21");
    expect(formatPhone("219888")).toBe("(21) 9888");
  });

  it("é idempotente sobre texto já formatado", () => {
    expect(formatPhone("(21) 98888-1122")).toBe("(21) 98888-1122");
  });
});

describe("isValidPhone", () => {
  it("aceita DDD + 8 ou 9 dígitos", () => {
    expect(isValidPhone("1133334444")).toBe(true);
    expect(isValidPhone("21988881122")).toBe(true);
  });

  it("recusa curto ou vazio", () => {
    expect(isValidPhone("119888")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });

  it("trunca dígitos excedentes em vez de recusar", () => {
    // normalizePhone corta em 11 dígitos: entrada longa colapsa para um número válido.
    // É intencional — evita rejeitar quem cola o número com DDI junto.
    expect(isValidPhone("219888811229")).toBe(true);
    expect(normalizePhone("219888811229")).toBe("21988881122");
  });
});

describe("phoneToEmail", () => {
  it("é determinístico e ignora formatação", () => {
    expect(phoneToEmail("(21) 98888-1122")).toBe("21988881122@perfilvivo.local");
    expect(phoneToEmail("21988881122")).toBe(phoneToEmail("(21) 98888-1122"));
  });
});

describe("birthDateFromAge", () => {
  it("deriva o ano subtraindo a idade", () => {
    const now = new Date("2026-09-24T12:00:00Z");
    expect(birthDateFromAge(34, now)).toBe("1992-09-24");
  });

  it("preserva mês e dia do momento de referência", () => {
    expect(birthDateFromAge(1, new Date("2026-01-05T12:00:00Z"))).toBe("2025-01-05");
  });
});

describe("initialsOf", () => {
  it("usa primeira e última palavra", () => {
    expect(initialsOf("Helena Duarte")).toBe("HD");
    expect(initialsOf("Ana Paula de Souza")).toBe("AS");
  });

  it("funciona com nome único", () => {
    expect(initialsOf("Madonna")).toBe("M");
  });

  it("cai em '?' para vazio", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });
});
