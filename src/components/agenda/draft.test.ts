import { describe, expect, it } from "vitest";
import { draftFromEvent, emptyEventDraft, eventFromDraft } from "@/components/agenda/draft";

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
