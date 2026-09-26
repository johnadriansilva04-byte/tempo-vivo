import { describe, expect, it } from "vitest";
import {
  addMinutes,
  eventFromMeeting,
  freeSlots,
  isOpenDay,
  meetingTitle,
  nextOpenDates,
  openDays,
  openSlots,
} from "@/lib/meetings";
import {
  DEFAULT_AVAILABILITY,
  type MeetingAvailability,
  type MeetingRequest,
} from "@/types/profile";

// 2026-09-21 é segunda-feira.
const disponibilidade: MeetingAvailability = {
  ...DEFAULT_AVAILABILITY,
  days: [1, 3, 5],
  slots: ["14:00", "09:00", "10:00"],
};

describe("disponibilidade", () => {
  it("lista os dias abertos em ordem de semana (seg → dom)", () => {
    expect(openDays({ ...disponibilidade, days: [5, 0, 1] })).toEqual([1, 5, 0]);
  });

  it("ordena os horários e remove repetidos", () => {
    expect(openSlots({ ...disponibilidade, slots: ["14:00", "09:00", "09:00"] })).toEqual([
      "09:00",
      "14:00",
    ]);
  });

  it("reconhece dia aberto pelo dia da semana", () => {
    expect(isOpenDay(disponibilidade, "2026-09-21")).toBe(true); // segunda
    expect(isOpenDay(disponibilidade, "2026-09-22")).toBe(false); // terça
    expect(isOpenDay(disponibilidade, "2026-09-25")).toBe(true); // sexta
  });

  it("fechado não abre nenhum dia", () => {
    expect(nextOpenDates({ ...disponibilidade, enabled: false }, "2026-09-21")).toEqual([]);
    expect(isOpenDay({ ...disponibilidade, enabled: false }, "2026-09-21")).toBe(false);
  });
});

describe("nextOpenDates", () => {
  it("pula os dias fechados e devolve só os abertos", () => {
    // De segunda 21/09: segunda, quarta, sexta, segunda, quarta, sexta.
    expect(nextOpenDates(disponibilidade, "2026-09-21", 4)).toEqual([
      "2026-09-21",
      "2026-09-23",
      "2026-09-25",
      "2026-09-28",
    ]);
  });

  it("começa a contar de hoje quando hoje está aberto", () => {
    expect(nextOpenDates(disponibilidade, "2026-09-23", 1)).toEqual(["2026-09-23"]);
  });
});

describe("freeSlots", () => {
  it("remove o horário já ocupado por um evento único", () => {
    const events = [{ event_date: "2026-09-21", start_time: "09:00", end_time: "10:00" }];
    expect(freeSlots(disponibilidade, events, "2026-09-21")).toEqual(["10:00", "14:00"]);
  });

  it("considera a repetição: evento semanal ocupa todas as ocorrências", () => {
    const events = [
      {
        event_date: "2026-09-07",
        start_time: "14:00",
        end_time: "15:00",
        recurrence: { days: [1], until: "" },
      },
    ];
    expect(freeSlots(disponibilidade, events, "2026-09-21")).toEqual(["09:00", "10:00"]);
    // Numa terça (fechada) o evento não interfere.
    expect(freeSlots(disponibilidade, events, "2026-09-22")).toEqual([]);
  });

  it("respeita o fim da repetição", () => {
    const events = [
      {
        event_date: "2026-09-07",
        start_time: "09:00",
        end_time: "10:00",
        recurrence: { days: [1], until: "2026-09-14" },
      },
    ];
    expect(freeSlots(disponibilidade, events, "2026-09-21")).toEqual(["09:00", "10:00", "14:00"]);
  });
});

describe("eventFromMeeting", () => {
  const pedido: MeetingRequest = {
    id: "m1",
    host_handle: "joao-adrian",
    requester_name: "Maria Souza",
    requester_phone: "11999998888",
    subject: "Parceria",
    location: "Vídeo",
    notes: "Trazer proposta",
    meeting_date: "2026-09-23",
    meeting_time: "14:00",
    status: "PENDING",
    created_at: "2026-09-20T10:00:00.000Z",
  };

  it("cria um compromisso pontual (sem repetição) com contato nas notas", () => {
    const event = eventFromMeeting(pedido);
    expect(event.event_date).toBe("2026-09-23");
    expect(event.start_time).toBe("14:00");
    expect(event.end_time).toBe("14:30");
    expect(event.recurrence).toBeNull();
    expect(event.title).toBe("Reunião · Parceria");
    expect(event.notes).toContain("Maria Souza");
    expect(event.notes).toContain("11999998888");
    expect(event.notes).toContain("Trazer proposta");
  });

  it("usa o nome de quem pediu quando não há assunto", () => {
    expect(meetingTitle({ ...pedido, subject: "  " })).toBe("Reunião · Maria Souza");
  });

  it("soma minutos virando a hora", () => {
    expect(addMinutes("23:50", 30)).toBe("00:20");
    expect(addMinutes("09:00", 45)).toBe("09:45");
  });
});
