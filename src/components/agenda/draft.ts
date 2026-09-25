import { newId } from "@/repositories/profile-repository";
import type { AgendaEvent, Recurrence } from "@/types/profile";

/** Rascunho de compromisso: um evento ainda sem id definido e com repetição rascunho. */
export type EventDraft = Omit<AgendaEvent, "id" | "recurrence"> & {
  id?: string;
  /** Dias marcados; vazio = evento único. */
  repeatDays: number[];
  /** Data-limite da repetição (yyyy-mm-dd); vazio = sem fim. */
  repeatUntil: string;
  /** Datas fora da série (folgas) preservadas ao editar um repetido. */
  repeatSkip: string[];
};

export function emptyEventDraft(event_date: string): EventDraft {
  return {
    title: "",
    event_date,
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    notes: "",
    repeatDays: [],
    repeatUntil: "",
    repeatSkip: [],
  };
}

export function draftFromEvent(event: AgendaEvent): EventDraft {
  const { recurrence, ...rest } = event;
  return {
    ...rest,
    repeatDays: recurrence?.days ?? [],
    repeatUntil: recurrence?.until ?? "",
    repeatSkip: recurrence?.skip ?? [],
  };
}

/** Dias da semana, na ordem em que aparecem no formulário (segunda a domingo). */
export const WEEKDAY_OPTIONS: [number, string][] = [
  [1, "Seg"],
  [2, "Ter"],
  [3, "Qua"],
  [4, "Qui"],
  [5, "Sex"],
  [6, "Sáb"],
  [0, "Dom"],
];

/** Atalhos de repetição: preenchem os dias de uma vez. */
export const REPEAT_PRESETS: [string, number[]][] = [
  ["Todo dia", [0, 1, 2, 3, 4, 5, 6]],
  ["Dias úteis", [1, 2, 3, 4, 5]],
  ["Fim de semana", [0, 6]],
];

function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((d, i) => d === [...b].sort()[i]);
}

function toRecurrence(draft: EventDraft): Recurrence | null {
  if (draft.repeatDays.length === 0) return null;
  return {
    days: [...draft.repeatDays].sort((a, b) => a - b),
    until: draft.repeatUntil,
    ...(draft.repeatSkip.length > 0 ? { skip: [...draft.repeatSkip].sort() } : {}),
  };
}

/** Gera um evento novo a partir do rascunho. Sem data válida, lança. */
export function eventFromDraft(draft: EventDraft): AgendaEvent {
  if (draft.event_date.trim() === "") {
    throw new Error("Todo compromisso precisa de uma data.");
  }
  return {
    id: draft.id ?? newId(),
    title: draft.title.trim(),
    event_date: draft.event_date,
    start_time: draft.start_time || "09:00",
    end_time: draft.end_time || "",
    location: draft.location.trim(),
    notes: draft.notes.trim(),
    recurrence: toRecurrence(draft),
  };
}

export { sameDays };
