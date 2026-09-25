// ---------------------------------------------------------------------------
// Grade do calendário — lógica pura, testável, sem React.
//
// A semana começa no domingo (padrão pt-BR). A grade do mês começa no domingo
// que antecede o dia 1 e termina no sábado que fecha a última semana.
// ---------------------------------------------------------------------------

export type CalendarCell = {
  /** Data no formato yyyy-mm-dd. */
  iso: string;
  day: number;
  /** O dia pertence ao mês exibido? (dias das bordas aparecem apagados) */
  inMonth: boolean;
};

export const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;
export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

/** Data local (yyyy-mm-dd) sem depender do fuso do ISO/UTC. */
export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Segunda-feira da semana de `iso` (semana de segunda a domingo). */
export function startOfWeek(iso: string): string {
  const d = fromIso(iso);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toIso(d);
}

/** Domingo que abre a semana de `iso` — o calendário mensal começa no domingo. */
export function startOfCalendarWeek(iso: string): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() - d.getDay());
  return toIso(d);
}

/** Os 7 dias (segunda a domingo) da semana que contém `iso`. */
export function weekDays(iso: string): string[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Grade de 6 semanas (42 células) para o mês de `iso`.
 * Inclui os dias das bordas para completar a primeira e a última semana.
 */
export function monthGrid(iso: string): CalendarCell[] {
  const base = fromIso(iso);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const start = fromIso(startOfCalendarWeek(toIso(first)));
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      iso: toIso(date),
      day: date.getDate(),
      inMonth: date.getMonth() === base.getMonth(),
    };
  });
}

/** "25 de setembro" — rótulo curto do dia. */
export function dayLabel(iso: string): string {
  const d = fromIso(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]?.toLowerCase() ?? ""}`;
}

export function timeLabel(time: string): string {
  return time.slice(0, 5);
}

/** Ordena por horário de início (string HH:mm já ordena). */
export function byStartTime<T extends { start_time: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/** "HH:mm" → minutos desde a meia-noite; valor inválido conta como 0. */
export function minutesOf(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h)) return 0;
  return (h ?? 0) * 60 + (Number.isFinite(m) ? (m ?? 0) : 0);
}

type Timed = { event_date: string; start_time: string; end_time: string };

/**
 * O compromisso que ainda está por vir, a partir de `nowIso`/`nowTime`.
 *
 * Regras, em ordem:
 * 1. No dia de hoje, um evento só termina quando seu horário de fim passa —
 *    durante ele, ainda é "o próximo". Sem fim, usa a hora de início.
 * 2. Um evento de hoje cujo fim já passou não conta.
 * 3. Dias futuros contam, com o evento mais cedo primeiro.
 *
 * Devolve `null` quando não há nada adiante.
 */
export function nextEventAt<T extends Timed>(
  events: T[],
  nowIso: string,
  nowTime: string,
): T | null {
  const nowMin = minutesOf(nowTime);
  // Ordena por DIA e depois por hora — ordenar só pela hora misturaria dias
  // (um evento das 14:00 de amanhã viria antes do das 16:00 de hoje).
  const ordered = [...events].sort(
    (a, b) => a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time),
  );
  const upcoming = ordered.filter((e) => {
    if (e.event_date > nowIso) return true;
    if (e.event_date < nowIso) return false;
    const ends = e.end_time ? minutesOf(e.end_time) : minutesOf(e.start_time);
    return ends >= nowMin;
  });
  return upcoming[0] ?? null;
}
