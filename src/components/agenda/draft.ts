import { newId } from "@/repositories/profile-repository";
import type { AgendaEvent } from "@/types/profile";

/** Rascunho de compromisso: um evento ainda sem id definido. */
export type EventDraft = Omit<AgendaEvent, "id"> & { id?: string };

export function emptyEventDraft(event_date: string): EventDraft {
  return {
    title: "",
    event_date,
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    notes: "",
  };
}

export function draftFromEvent(event: AgendaEvent): EventDraft {
  return { ...event };
}

/** Gera um evento novo a partir do rascunho. */
export function eventFromDraft(draft: EventDraft): AgendaEvent {
  return {
    id: draft.id ?? newId(),
    title: draft.title.trim(),
    event_date: draft.event_date,
    start_time: draft.start_time || "09:00",
    end_time: draft.end_time || "",
    location: draft.location.trim(),
    notes: draft.notes.trim(),
  };
}
