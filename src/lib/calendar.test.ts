import { describe, expect, it } from "vitest";
import {
  addDays,
  dayLabel,
  fromIso,
  monthGrid,
  startOfWeek,
  toIso,
  weekDays,
} from "@/lib/calendar";

describe("toIso / fromIso", () => {
  it("ida e volta preserva a data", () => {
    expect(toIso(fromIso("2026-09-25"))).toBe("2026-09-25");
  });

  it("não desloca o dia por causa de fuso", () => {
    expect(fromIso("2026-01-01").getDate()).toBe(1);
    expect(toIso(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});

describe("addDays", () => {
  it("atravessa a virada de mês", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("aceita dias negativos", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("startOfWeek", () => {
  it("retorna a segunda-feira da semana", () => {
    // 2026-09-25 é uma sexta-feira.
    expect(startOfWeek("2026-09-25")).toBe("2026-09-21");
  });

  it("é idempotente numa segunda-feira", () => {
    expect(startOfWeek("2026-09-21")).toBe("2026-09-21");
  });

  it("trata domingo como fim da semana (segunda anterior)", () => {
    expect(startOfWeek("2026-09-27")).toBe("2026-09-21");
  });
});

describe("weekDays", () => {
  it("devolve 7 dias consecutivos", () => {
    expect(weekDays("2026-09-25")).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
  });
});

describe("monthGrid", () => {
  it("devolve 42 células começando num domingo", () => {
    const grid = monthGrid("2026-09-15");
    expect(grid).toHaveLength(42);
    expect(fromIso(grid[0]!.iso).getDay()).toBe(0);
  });

  it("marca os dias do mês e os das bordas", () => {
    const grid = monthGrid("2026-09-15");
    const firstOfMonth = grid.find((c) => c.iso === "2026-09-01");
    expect(firstOfMonth?.inMonth).toBe(true);
    const lastOfAugust = grid.find((c) => c.iso === "2026-08-31");
    expect(lastOfAugust?.inMonth).toBe(false);
  });

  it("cobre todo o mês sem lacunas", () => {
    const grid = monthGrid("2026-02-10");
    const inMonth = grid.filter((c) => c.inMonth).map((c) => c.day);
    expect(inMonth[0]).toBe(1);
    expect(inMonth.at(-1)).toBe(28);
  });
});

describe("dayLabel", () => {
  it("formata dia e mês em minúsculas", () => {
    expect(dayLabel("2026-09-25")).toBe("25 de setembro");
  });
});
