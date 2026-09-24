import { describe, expect, it } from "vitest";
import { computeStatus, initialsOf, newId } from "@/repositories/profile-repository";

// computeStatus lê o relógio real (Date.now()); os fixtures são relativos a ele.
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const isoDay = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * HOUR).toISOString().slice(0, 10);

describe("computeStatus — Regra de Integridade Temporal", () => {
  it("mantém LOCKED para sempre, nunca destrava", () => {
    expect(
      computeStatus({
        log_date: isoDay(30),
        created_at: ago(30 * 24),
        status: "LOCKED",
      }),
    ).toBe("LOCKED");
    expect(computeStatus({ log_date: isoDay(0), created_at: ago(0), status: "LOCKED" })).toBe(
      "LOCKED",
    );
  });

  it("um registro recém-criado permanece OPEN", () => {
    expect(
      computeStatus({
        log_date: isoDay(0),
        created_at: ago(0.017),
        status: "OPEN",
      }),
    ).toBe("OPEN");
  });

  it("travos após 24h de criado, independente do dia", () => {
    expect(
      computeStatus({
        log_date: isoDay(2),
        created_at: ago(25),
        status: "OPEN",
      }),
    ).toBe("LOCKED");
  });

  it("passa OPEN de dia anterior para VALIDATING dentro da janela de 24h", () => {
    // Criado agora, mas referente a ontem: ainda aberto para correção, aguardando validação.
    expect(
      computeStatus({
        log_date: isoDay(1),
        created_at: ago(0),
        status: "OPEN",
      }),
    ).toBe("VALIDATING");
  });

  it("preserva VALIDATING já registrado", () => {
    expect(
      computeStatus({
        log_date: isoDay(0),
        created_at: ago(1),
        status: "VALIDATING",
      }),
    ).toBe("VALIDATING");
  });

  it("não inventa status quando falta created_at", () => {
    expect(computeStatus({ log_date: isoDay(0), created_at: "", status: "OPEN" })).toBe("OPEN");
  });
});

describe("newId", () => {
  it("gera identificadores únicos e não vazios", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });
});

describe("initialsOf (repositório)", () => {
  it("espelha a regra de iniciais do app", () => {
    expect(initialsOf("Helena Duarte")).toBe("HD");
    expect(initialsOf("")).toBe("?");
  });
});
