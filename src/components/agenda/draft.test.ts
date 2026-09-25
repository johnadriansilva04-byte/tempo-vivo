import { describe, expect, it } from "vitest";
import {
  draftFromEvent,
  emptyEventDraft,
  eventFromDraft,
  sameDays,
} from "@/components/agenda/draft";

describe("eventFromDraft", () => {
  it("recusa um rascunho sem data", () => {
    expect(() => eventFromDraft(emptyEventDraft(""))).toThrow(/data/i);
  });

  it("preenche hora de início padrão e normaliza espaços", () => {
    const event = eventFromDraft({
      ...emptyEventDraft("2026-09-25"),
      title: "  Reunião  ",
      start_time: "",
      location: "  Sala 2 ",
      notes: "  Levar notebook ",
    });
    expect(event.title).toBe("Reunião");
    expect(event.start_time).toBe("09:00");
    expect(event.location).toBe("Sala 2");
    expect(event.notes).toBe("Levar notebook");
  });

  it("preserva o id ao editar um evento existente", () => {
    const original = {
      id: "ev-1",
      title: "Dentista",
      event_date: "2026-09-25",
      start_time: "16:00",
      end_time: "17:00",
      location: "",
      notes: "",
    };
    expect(eventFromDraft(draftFromEvent(original)).id).toBe("ev-1");
  });
});

describe("repetição no rascunho", () => {
  it("sem dias marcados, o evento é único", () => {
    expect(eventFromDraft(emptyEventDraft("2026-09-25")).recurrence).toBeNull();
  });

  it("com dias marcados, gera a repetição ordenada", () => {
    const draft = {
      ...emptyEventDraft("2026-09-21"),
      title: "Trabalho",
      start_time: "18:00",
      end_time: "23:00",
      repeatDays: [5, 1, 3],
      repeatUntil: "2027-12-31",
    };
    expect(eventFromDraft(draft).recurrence).toEqual({
      days: [1, 3, 5],
      until: "2027-12-31",
    });
  });

  it("ida e volta preserva a repetição", () => {
    const event = eventFromDraft({
      ...emptyEventDraft("2026-09-21"),
      title: "Trabalho",
      repeatDays: [1, 2, 3, 4, 5, 6, 0],
      repeatUntil: "",
    });
    expect(draftFromEvent(event).repeatDays.sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(draftFromEvent(event).repeatUntil).toBe("");
  });

  it("sameDays compara conjuntos, não a ordem", () => {
    expect(sameDays([1, 2, 3], [3, 2, 1])).toBe(true);
    expect(sameDays([1, 2], [1, 2, 3])).toBe(false);
  });
});
