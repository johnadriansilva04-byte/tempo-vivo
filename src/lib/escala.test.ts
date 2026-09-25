import { describe, expect, it } from "vitest";
import { SCALE_TEMPLATES, escalaPlan } from "@/lib/escala";

describe("escalaPlan", () => {
  it("o modelo da noite vira a escala completa do ano", () => {
    const noite = SCALE_TEMPLATES.find((t) => t.id === "noite")!;
    expect(escalaPlan(noite, "2026-09-25", "ano")).toEqual({
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      repeatUntil: "2026-12-31",
    });
  });

  it("a janela do mês termina no último dia do mês", () => {
    const comercial = SCALE_TEMPLATES.find((t) => t.id === "comercial")!;
    expect(escalaPlan(comercial, "2026-02-10", "mes")).toEqual({
      repeatDays: [1, 2, 3, 4, 5],
      repeatUntil: "2026-02-28",
    });
  });

  it("sem fim devolve limite vazio", () => {
    const segunda = SCALE_TEMPLATES.find((t) => t.id === "segunda")!;
    expect(escalaPlan(segunda, "2026-09-25", "sempre").repeatUntil).toBe("");
  });

  it("a escala 12x36 não repete dias seguidos", () => {
    const doze = SCALE_TEMPLATES.find((t) => t.id === "escala12x36")!;
    expect(doze.days).toEqual([1, 3, 5]);
  });

  it("todos os modelos têm começo antes do fim", () => {
    for (const t of SCALE_TEMPLATES) {
      expect(t.start_time < t.end_time).toBe(true);
      expect(t.days.length).toBeGreaterThan(0);
    }
  });
});
