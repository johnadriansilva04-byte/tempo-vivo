// ---------------------------------------------------------------------------
// Reuniões públicas — lógica pura, sem React e sem rede.
//
// O dono abre dias e horários; o visitante escolhe um deles. Aqui ficam as
// regras: quais dias estão abertos, quais horários ainda cabem e como um
// pedido aceito vira compromisso na agenda do dono.
// ---------------------------------------------------------------------------

import { addDays, fromIso, toIso } from "@/lib/calendar";
import type { AgendaEvent, MeetingAvailability, MeetingRequest, Recurrence } from "@/types/profile";

export const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Rótulos na ordem em que o dono configura (segunda → domingo). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekdayName(day: number): string {
  return WEEKDAY_NAMES[day] ?? "";
}

/** Dias abertos, na ordem de configuração e sem repetição. */
export function openDays(availability: MeetingAvailability): number[] {
  const set = new Set(availability.days);
  return WEEKDAY_ORDER.filter((day) => set.has(day));
}

/** Horários oferecidos, em ordem cronológica e sem repetição. */
export function openSlots(availability: MeetingAvailability): string[] {
  return [...new Set(availability.slots)].sort();
}

export function isOpenDay(availability: MeetingAvailability, iso: string): boolean {
  return availability.enabled && availability.days.includes(fromIso(iso).getDay());
}

/**
 * Próximas datas abertas a partir de `from` (inclusive), para o visitante
 * escolher sem ver um calendário inteiro. Pula dias fechados e datas passadas.
 */
export function nextOpenDates(
  availability: MeetingAvailability,
  from: string,
  count = 6,
  horizonDays = 90,
): string[] {
  if (!availability.enabled) return [];
  const out: string[] = [];
  for (let i = 0; i <= horizonDays && out.length < count; i += 1) {
    const iso = addDays(from, i);
    if (isOpenDay(availability, iso)) out.push(iso);
  }
  return out;
}

/** Horários livres num dia: vazio se o dia é fechado; senão tira o ocupado. */
export function freeSlots(
  availability: MeetingAvailability,
  events: Pick<AgendaEvent, "event_date" | "start_time" | "end_time" | "recurrence">[],
  iso: string,
): string[] {
  if (!isOpenDay(availability, iso)) return [];
  const taken = busyIntervals(events, iso);
  return openSlots(availability).filter((slot) => !taken.includes(slot));
}

/** Horários de início já ocupados naquele dia (considera repetição). */
function busyIntervals(
  events: Pick<AgendaEvent, "event_date" | "start_time" | "end_time" | "recurrence">[],
  iso: string,
): string[] {
  return events.filter((event) => occursOnDate(event, iso)).map((event) => event.start_time);
}

function occursOnDate(
  event: Pick<AgendaEvent, "event_date" | "start_time" | "end_time" | "recurrence">,
  iso: string,
): boolean {
  const days = event.recurrence?.days ?? [];
  if (days.length === 0) return event.event_date === iso;
  if (iso < event.event_date) return false;
  const until = event.recurrence?.until ?? "";
  if (until && iso > until) return false;
  if ((event.recurrence?.skip ?? []).includes(iso)) return false;
  return days.includes(fromIso(iso).getDay());
}

/**
 * Um pedido aceito vira um compromisso único na agenda do dono.
 * Fica fora da série (sem repetição): é um encontro pontual.
 */
export function eventFromMeeting(request: MeetingRequest): AgendaEvent {
  const recurrence: Recurrence | null = null;
  return {
    id: request.id,
    title: meetingTitle(request),
    event_date: request.meeting_date,
    start_time: request.meeting_time,
    end_time: addMinutes(request.meeting_time, 30),
    location: request.location,
    notes: meetingNotes(request),
    recurrence,
  };
}

/** Título do compromisso: "Reunião · Assunto". */
export function meetingTitle(request: MeetingRequest): string {
  const subject = request.subject.trim();
  return subject ? `Reunião · ${subject}` : `Reunião · ${request.requester_name}`;
}

function meetingNotes(request: MeetingRequest): string {
  const parts = [`Pedido por ${request.requester_name}`];
  if (request.requester_phone.trim()) parts.push(request.requester_phone.trim());
  if (request.notes.trim()) parts.push(request.notes.trim());
  return parts.join(" · ");
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Um pedido ainda pode ser aceito/recusado? */
export function isPending(request: MeetingRequest): boolean {
  return request.status === "PENDING";
}

export function formatDayMonth(iso: string): string {
  const d = fromIso(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

export function todayIso(): string {
  return toIso(new Date());
}
