/**
 * Motor de agenda — funções puras, sem I/O.
 * Converte regras recorrentes + exceções + eventos + reuniões aceitas em
 * ocorrências concretas de um dia e calcula os horários realmente livres
 * considerando a disponibilidade pública configurada pelo dono.
 */

import type {
  AvailabilityRule,
  CommitmentException,
  DaySlot,
  OneOffEvent,
  RecurringCommitment,
  ScheduleOccurrence,
} from "@/types/profile";

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const WEEKDAY_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h ?? 0) || 0) * 60 + (Number(m ?? 0) || 0);
}

export function fromMinutes(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} — ${end}`;
}

/** Data ISO local (yyyy-mm-dd) sem depender de timezone do toISOString. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00`).getDay();
}

export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// ------------------------------------------------------------- ocorrências --

/**
 * Ocorrências de um dia = regras recorrentes do weekday (com exceção daquele
 * date aplicada) + eventos eventuais + reuniões aceitas.
 */
export function occurrencesForDate(
  dateIso: string,
  commitments: RecurringCommitment[],
  exceptions: CommitmentException[],
  events: OneOffEvent[],
): ScheduleOccurrence[] {
  const wd = weekdayOf(dateIso);
  const byCommitment = new Map<string, CommitmentException>();
  for (const ex of exceptions) {
    if (ex.exception_date === dateIso) byCommitment.set(ex.commitment_id, ex);
  }

  const out: ScheduleOccurrence[] = [];

  for (const c of commitments) {
    if (!c.is_active) continue;
    if (c.weekdays.length > 0 && !c.weekdays.includes(wd)) continue;
    const ex = byCommitment.get(c.id);
    if (ex?.mode === "cancelled") continue; // folga — só aquela ocorrência
    out.push({
      id: ex ? `ex-${ex.id}` : `rc-${c.id}`,
      kind: "recurring",
      title: ex?.mode === "edited" && ex.title ? ex.title : c.title,
      category: c.category,
      start_time:
        ex?.mode === "edited" && ex.start_time ? ex.start_time : c.start_time,
      end_time: ex?.mode === "edited" && ex.end_time ? ex.end_time : c.end_time,
      note: ex?.note || c.note,
      source: "manual",
    });
  }

  for (const ev of events) {
    if (ev.event_date !== dateIso) continue;
    out.push({
      id: `ev-${ev.id}`,
      kind: "event",
      title: ev.title,
      category: ev.source === "meeting" ? "Reunião" : "Compromisso",
      start_time: ev.start_time,
      end_time: ev.end_time,
      note: ev.note,
      source: ev.source,
    });
  }

  return out.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
}

// ------------------------------------------------------------------- slots --

/** Intersecta [aStart,aEnd) com [bStart,bEnd) (minutos). null se vazio. */
function intersect(
  aS: number,
  aE: number,
  bS: number,
  bE: number,
): DaySlot | null {
  const s = Math.max(aS, bS);
  const e = Math.min(aE, bE);
  return e > s
    ? { start_time: fromMinutes(s), end_time: fromMinutes(e) }
    : null;
}

function subtractSegments(
  base: DaySlot[],
  busy: { start: number; end: number }[],
): DaySlot[] {
  let segments = base.map((s) => ({
    start: toMinutes(s.start_time),
    end: toMinutes(s.end_time),
  }));
  for (const b of busy) {
    const next: { start: number; end: number }[] = [];
    for (const seg of segments) {
      if (b.end <= seg.start || b.start >= seg.end) {
        next.push(seg); // sem sobreposição
        continue;
      }
      if (b.start > seg.start) next.push({ start: seg.start, end: b.start });
      if (b.end < seg.end) next.push({ start: b.end, end: seg.end });
    }
    segments = next;
  }
  return segments
    .filter((s) => s.end > s.start)
    .map((s) => ({
      start_time: fromMinutes(s.start),
      end_time: fromMinutes(s.end),
    }));
}

export type SlotComputation = {
  /** Janela de disponibilidade declarada para o dia ([] se dono não abriu). */
  window: DaySlot[];
  /** Janela menos compromissos/eventos/reuniões aceitas. */
  free: DaySlot[];
  /** Compromissos que bloqueiam o dia (para exibição honesta). */
  busy: ScheduleOccurrence[];
};

/**
 * Slots realmente livres = COMPROMISSOS FIXOS + EVENTUAIS + REUNIÕES ACEITAS
 * + REGRAS DE DISPONIBILIDADE → janelas livres.
 */
export function computeDaySlots(
  dateIso: string,
  availability: AvailabilityRule | undefined,
  occurrences: ScheduleOccurrence[],
): SlotComputation {
  if (!availability || !availability.is_available) {
    return { window: [], free: [], busy: occurrences };
  }
  const window: DaySlot[] = [
    { start_time: availability.start_time, end_time: availability.end_time },
  ];
  const busy = occurrences.map((o) => ({
    start: toMinutes(o.start_time),
    end: toMinutes(o.end_time),
  }));
  return { window, free: subtractSegments(window, busy), busy: occurrences };
}

/** Quebra slots largos em janelas de reunião (duração + intervalo). */
export function sliceSlotsForMeetings(
  slots: DaySlot[],
  durationMin: number,
  bufferMin: number,
): DaySlot[] {
  const step = durationMin + bufferMin;
  const out: DaySlot[] = [];
  for (const s of slots) {
    let cursor = toMinutes(s.start_time);
    const end = toMinutes(s.end_time);
    while (cursor + durationMin <= end) {
      out.push({
        start_time: fromMinutes(cursor),
        end_time: fromMinutes(cursor + durationMin),
      });
      cursor += step;
    }
  }
  return out;
}

// ---------------------------------------------------------------- telefone --

/** Normaliza telefone para descoberta de conta: só dígitos, últimos 11. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 11 ? digits.slice(-11) : digits;
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

// -------------------------------------------------------------------- slug --

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}
