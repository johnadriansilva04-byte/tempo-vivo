import { describe, expect, it } from "vitest";
import {
  addDays,
  conflictsFor,
  dayLabel,
  eventsByDayInRange,
  fromIso,
  isValidTimeRange,
  monthGrid,
  nextEventAt,
  occursOn,
  occurrencesInRange,
  recurrenceLabel,
  skipOccurrence,
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

describe("nextEventAt", () => {
  const ev = (event_date: string, start_time: string, end_time: string) => ({
    event_date,
    start_time,
    end_time,
  });

  const today = [
    ev("2026-09-25", "06:00", "14:00"),
    ev("2026-09-25", "16:00", "17:00"),
    ev("2026-09-25", "20:00", "22:00"),
    ev("2026-09-26", "14:00", "15:00"),
  ];

  it("pula eventos de hoje cujo fim já passou", () => {
    // 06:00–14:00 e 16:00–17:00 já terminaram às 17:30.
    expect(nextEventAt(today, "2026-09-25", "17:30")?.start_time).toBe("20:00");
  });

  it("durante um evento em andamento, ele ainda é o próximo", () => {
    expect(nextEventAt(today, "2026-09-25", "16:30")?.start_time).toBe("16:00");
  });

  it("quando o dia acabou, salta para o dia seguinte mais cedo", () => {
    expect(nextEventAt(today, "2026-09-25", "23:50")?.event_date).toBe("2026-09-26");
  });

  it("ignora o passado e escolhe o mais cedo do próximo dia", () => {
    expect(nextEventAt(today, "2026-09-27", "08:00")).toBeNull();
  });

  it("sem horário de fim, o evento termina ao começar", () => {
    const semFim = [ev("2026-09-25", "16:00", "")];
    expect(nextEventAt(semFim, "2026-09-25", "16:01")).toBeNull();
    expect(nextEventAt(semFim, "2026-09-25", "15:59")).not.toBeNull();
  });

  it("devolve null quando não há nada adiante", () => {
    expect(nextEventAt([], "2026-09-25", "10:00")).toBeNull();
  });
});

describe("repetição", () => {
  // 2026-09-21 é uma segunda-feira.
  const trabalho = {
    event_date: "2026-09-21",
    start_time: "18:00",
    end_time: "23:00",
    recurrence: { days: [1, 2, 3, 4, 5], until: "" },
  };

  it("ocorre nos dias marcados, a partir da data inicial", () => {
    expect(occursOn(trabalho, "2026-09-21")).toBe(true); // segunda
    expect(occursOn(trabalho, "2026-09-23")).toBe(true); // quarta
    expect(occursOn(trabalho, "2026-09-26")).toBe(false); // sábado
  });

  it("não ocorre antes da data inicial nem depois do limite", () => {
    expect(occursOn(trabalho, "2026-09-18")).toBe(false); // sexta anterior
    const comFim = { ...trabalho, recurrence: { days: [1], until: "2026-10-05" } };
    expect(occursOn(comFim, "2026-09-28")).toBe(true);
    expect(occursOn(comFim, "2026-10-12")).toBe(false);
  });

  it("expande as datas dentro de um intervalo", () => {
    expect(occurrencesInRange(trabalho, "2026-09-21", "2026-09-27")).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
    ]);
  });

  it("todo dia, o ano inteiro, gera uma ocorrência por dia", () => {
    const diario = { ...trabalho, recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" } };
    const ano = occurrencesInRange(diario, "2027-01-01", "2027-12-31");
    expect(ano).toHaveLength(365);
    expect(ano[0]).toBe("2027-01-01");
    expect(ano[ano.length - 1]).toBe("2027-12-31");
  });

  it("evento único não se repete", () => {
    const unico = { event_date: "2026-09-25", start_time: "16:00", end_time: "17:00" };
    expect(occurrencesInRange(unico, "2026-09-01", "2026-09-30")).toEqual(["2026-09-25"]);
  });

  it("eventsByDayInRange coloca o repetido em cada dia, ordenado por hora", () => {
    const almoco = {
      event_date: "2026-09-21",
      start_time: "12:00",
      end_time: "13:00",
      recurrence: { days: [1], until: "" },
    };
    const map = eventsByDayInRange([trabalho, almoco], "2026-09-21", "2026-09-28");
    expect(map.get("2026-09-21")?.map((e) => e.start_time)).toEqual(["12:00", "18:00"]);
    expect(map.get("2026-09-22")?.map((e) => e.start_time)).toEqual(["18:00"]);
    expect(map.get("2026-09-26")).toBeUndefined();
  });

  it("nextEventAt enxerga a próxima ocorrência de um repetido", () => {
    // Sábado 26/09: o trabalho de segunda a sexta só volta na segunda 28/09.
    expect(nextEventAt([trabalho], "2026-09-26", "10:00")?.start_time).toBe("18:00");
    expect(nextEventAt([trabalho], "2026-09-28", "12:00")?.start_time).toBe("18:00");
  });

  it("nextEventAt ignora a ocorrência de hoje já encerrada", () => {
    // Segunda 21/09 às 23:30: hoje acabou, volta na terça.
    expect(nextEventAt([trabalho], "2026-09-21", "23:30")).not.toBeNull();
    expect(nextEventAt([trabalho], "2026-09-25", "23:30")?.start_time).toBe("18:00");
  });

  it("trabalho 18h–23h de janeiro a dezembro aparece em todos os dias úteis", () => {
    const escala = {
      event_date: "2026-01-01",
      start_time: "18:00",
      end_time: "23:00",
      recurrence: { days: [1, 2, 3, 4, 5], until: "2026-12-31" },
    };
    // 2026 tem 365 dias; a escala cobre exatamente os dias úteis do ano.
    const ano = occurrencesInRange(escala, "2026-01-01", "2026-12-31");
    const uteis = ano.filter((iso) => {
      const d = fromIso(iso).getDay();
      return d >= 1 && d <= 5;
    });
    expect(ano).toHaveLength(uteis.length);
    expect(ano).not.toContain("2026-01-03"); // sábado
    expect(ano).not.toContain("2026-01-04"); // domingo
    expect(ano[0]).toBe("2026-01-01"); // quinta, primeiro dia útil do ano
    expect(ano[ano.length - 1]).toBe("2026-12-31"); // quinta, último dia do ano
    // Fora do intervalo definido, não ocorre.
    expect(occursOn(escala, "2027-01-04")).toBe(false);
  });

  it("'todo dia' de segunda a domingo cobre todos os dias do mês", () => {
    const diario = {
      event_date: "2026-01-01",
      start_time: "18:00",
      end_time: "23:00",
      recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
    };
    const fev = occurrencesInRange(diario, "2026-02-01", "2026-02-28");
    expect(fev).toHaveLength(28);
  });
});

describe("folgas (skip)", () => {
  const escala = {
    event_date: "2026-01-01",
    start_time: "18:00",
    end_time: "23:00",
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
  };

  it("ocorre normalmente antes de marcar a folga", () => {
    expect(occursOn(escala, "2026-03-10")).toBe(true);
  });

  it("a folga tira só aquele dia, sem afetar vizinhos", () => {
    const comFolga = skipOccurrence(escala, "2026-03-10");
    expect(occursOn(comFolga, "2026-03-10")).toBe(false);
    expect(occursOn(comFolga, "2026-03-09")).toBe(true);
    expect(occursOn(comFolga, "2026-03-11")).toBe(true);
  });

  it("acumula folgas distintas sem duplicar", () => {
    let e = skipOccurrence(escala, "2026-03-10");
    e = skipOccurrence(e, "2026-03-11");
    e = skipOccurrence(e, "2026-03-10");
    expect(e.recurrence?.skip).toEqual(["2026-03-10", "2026-03-11"]);
  });

  it("a folga não some do evento único", () => {
    const unico = { event_date: "2026-03-10", start_time: "10:00", end_time: "11:00" };
    expect(skipOccurrence(unico, "2026-03-10")).toBe(unico);
  });

  it("ocorrências e contagem respeitam as folgas", () => {
    const comFolga = skipOccurrence(escala, "2026-03-10");
    const marco = occurrencesInRange(comFolga, "2026-03-01", "2026-03-31");
    expect(marco).toHaveLength(30); // 31 dias menos a folga
    expect(marco).not.toContain("2026-03-10");
  });
});

describe("recurrenceLabel", () => {
  it("reconhece os atalhos conhecidos", () => {
    expect(recurrenceLabel({ days: [0, 1, 2, 3, 4, 5, 6] })).toBe("Todo dia");
    expect(recurrenceLabel({ days: [1, 2, 3, 4, 5] })).toBe("Dias úteis");
    expect(recurrenceLabel({ days: [0, 6] })).toBe("Fim de semana");
  });

  it("descreve um ou poucos dias", () => {
    expect(recurrenceLabel({ days: [1] })).toBe("Toda segunda");
    expect(recurrenceLabel({ days: [1, 3] })).toBe("Segunda e Quarta");
  });

  it("é vazio sem repetição", () => {
    expect(recurrenceLabel(null)).toBe("");
    expect(recurrenceLabel({ days: [] })).toBe("");
  });
});

describe("isValidTimeRange", () => {
  it("aceita fim depois do início", () => {
    expect(isValidTimeRange("18:00", "23:00")).toBe(true);
  });

  it("recusa fim antes ou igual ao início", () => {
    expect(isValidTimeRange("23:00", "18:00")).toBe(false);
    expect(isValidTimeRange("18:00", "18:00")).toBe(false);
  });

  it("não trava quando falta um horário", () => {
    expect(isValidTimeRange("", "23:00")).toBe(true);
    expect(isValidTimeRange("18:00", "")).toBe(true);
  });
});

describe("conflictsFor", () => {
  const base = { start_time: "18:00", end_time: "23:00" };

  it("sinaliza eventos que se sobrepõem no mesmo dia", () => {
    const a = { id: "a", event_date: "2026-09-21", ...base };
    const b = {
      id: "b",
      event_date: "2026-09-21",
      start_time: "20:00",
      end_time: "21:00",
    };
    expect(
      conflictsFor([a, b], "2026-09-21")
        .map((e) => e.id)
        .sort(),
    ).toEqual(["a", "b"]);
  });

  it("não sinaliza horários que só se tocam", () => {
    const a = { id: "a", event_date: "2026-09-21", start_time: "18:00", end_time: "20:00" };
    const b = { id: "b", event_date: "2026-09-21", start_time: "20:00", end_time: "21:00" };
    expect(conflictsFor([a, b], "2026-09-21")).toEqual([]);
  });

  it("um repetido conflita com evento do dia em que cai", () => {
    const escala = {
      id: "escala",
      event_date: "2026-09-21",
      start_time: "18:00",
      end_time: "23:00",
      recurrence: { days: [1], until: "" },
    };
    const dentista = {
      id: "dentista",
      event_date: "2026-09-28",
      start_time: "19:00",
      end_time: "20:00",
    };
    // Segunda 28/09: a escala cai e colide com o dentista.
    expect(
      conflictsFor([escala, dentista], "2026-09-28")
        .map((e) => e.id)
        .sort(),
    ).toEqual(["dentista", "escala"]);
    // Terça: nada colide.
    expect(conflictsFor([escala, dentista], "2026-09-29")).toEqual([]);
  });
});
