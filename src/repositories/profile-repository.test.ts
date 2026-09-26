import { describe, expect, it } from "vitest";
import {
  computeStatus,
  initialsOf,
  localRepository,
  newId,
} from "@/repositories/profile-repository";
import { DEFAULT_AVAILABILITY } from "@/types/profile";

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

describe("load — perfis salvos antes de campos novos", () => {
  it("preenche a disponibilidade ausente com o padrão, sem perder o resto", () => {
    const store = new Map<string, string>();
    const fakeWindow = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
    const original = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = fakeWindow;
    try {
      store.set(
        "perfil-vivo:db:v3:anonymous",
        JSON.stringify({
          profile: { id: "u1", name: "Conta Antiga", role: "Pesquisadora" },
          daily_logs: [],
        }),
      );
      const profile = localRepository.getProfile();
      expect(profile.name).toBe("Conta Antiga");
      expect(profile.role).toBe("Pesquisadora");
      expect(profile.availability).toEqual(DEFAULT_AVAILABILITY);
    } finally {
      (globalThis as { window?: unknown }).window = original;
    }
  });
});
