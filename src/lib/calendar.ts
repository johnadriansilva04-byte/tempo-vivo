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

// ----------------------------------------------------------- repetição ------
//
// Um compromisso pode repetir (trabalho 18h–23h toda semana, por exemplo). A
// regra é pura: guardamos os dias da semana e uma data-limite opcional, e a
// expansão em datas concretas é calculada aqui — não no banco nem na UI.

/** Forma mínima da repetição que o cálculo precisa enxergar. */
export type RecurrenceLike = { days: number[]; until: string; skip?: string[] };

type Recurring = {
  event_date: string;
  start_time: string;
  recurrence?: RecurrenceLike | null | undefined;
};

/** O evento se repete? (precisa de dias marcados) */
export function isRecurring(event: Recurring): boolean {
  return (event.recurrence?.days.length ?? 0) > 0;
}

/** O evento acontece em `iso`? Eventos únicos valem só na própria data. */
export function occursOn(event: Recurring, iso: string): boolean {
  if (!isRecurring(event)) return iso === event.event_date;
  if (iso < event.event_date) return false;
  const until = event.recurrence?.until ?? "";
  if (until && iso > until) return false;
  if (event.recurrence?.skip?.includes(iso)) return false;
  return (event.recurrence?.days ?? []).includes(fromIso(iso).getDay());
}

/**
 * As datas em que o evento ocorre dentro de `[from, to]` (inclusive).
 *
 * Varre dia a dia: os intervalos pedidos são curtos (um mês, uma semana, um
 * dia), então a simplicidade vale mais que otimização.
 */
export function occurrencesInRange(event: Recurring, from: string, to: string): string[] {
  if (to < from) return [];
  if (!isRecurring(event)) {
    return occursOn(event, event.event_date) && event.event_date >= from && event.event_date <= to
      ? [event.event_date]
      : [];
  }
  const out: string[] = [];
  for (let iso = from; iso <= to; iso = addDays(iso, 1)) {
    if (occursOn(event, iso)) out.push(iso);
  }
  return out;
}

/**
 * Agrupa os eventos por dia, expandindo as repetições no intervalo `[from, to]`.
 * Um evento repetido aparece em cada dia em que acontece.
 */
export function eventsByDayInRange<T extends Recurring>(
  events: T[],
  from: string,
  to: string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const event of events) {
    for (const iso of occurrencesInRange(event, from, to)) {
      const list = map.get(iso) ?? [];
      list.push(event);
      map.set(iso, list);
    }
  }
  for (const [iso, list] of map) map.set(iso, byStartTime(list));
  return map;
}

/** "HH:mm" → minutos desde a meia-noite; valor inválido conta como 0. */
export function minutesOf(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h)) return 0;
  return (h ?? 0) * 60 + (Number.isFinite(m) ? (m ?? 0) : 0);
}

/** Nome curto do dia da semana (0=domingo) para frases como "toda segunda". */
const WEEKDAY_NAMES = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

/** O intervalo tem fim depois do início? Horários vazios não geram pendência. */
export function isValidTimeRange(start: string, end: string): boolean {
  if (start === "" || end === "") return true;
  return minutesOf(end) > minutesOf(start);
}

/**
 * Frase curta do padrão de repetição — "Toda segunda", "Dias úteis",
 * "Seg e Qua". Vazio quando o evento não se repete.
 */
export function recurrenceLabel(recurrence: { days: number[] } | null | undefined): string {
  const days = [...new Set(recurrence?.days ?? [])].sort((a, b) => a - b);
  if (days.length === 0) return "";
  if (days.length === 7) return "Todo dia";
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Dias úteis";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Fim de semana";
  const names = days.map((d) => WEEKDAY_NAMES[d] ?? "").map(capitalize);
  if (days.length === 1) return `Toda ${names[0]?.toLowerCase() ?? ""}`;
  const last = names[names.length - 1] ?? "";
  return [...names.slice(0, -1), last].join(" e ");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Devolve uma cópia do evento com `iso` fora da série (uma folga).
 * Sem repetição não há o que pular — devolve o próprio evento.
 */
export function skipOccurrence<T extends Recurring>(
  event: T,
  iso: string,
): Omit<T, "recurrence"> & { recurrence: RecurrenceLike } {
  if (!isRecurring(event)) return event as Omit<T, "recurrence"> & { recurrence: RecurrenceLike };
  const rec = event.recurrence ?? { days: [], until: "" };
  const skip = [...new Set([...(rec.skip ?? []), iso])].sort();
  return { ...event, recurrence: { ...rec, skip } };
}

type Timed = {
  event_date: string;
  start_time: string;
  end_time: string;
  recurrence?: { days: number[]; until: string } | null | undefined;
};

/** Horizonte de busca de repetições: cobre bem mais de um ano. */
const RECURRENCE_HORIZON_DAYS = 400;

/**
 * O compromisso que ainda está por vir, a partir de `nowIso`/`nowTime`.
 *
 * Regras, em ordem:
 * 1. No dia de hoje, um evento só termina quando seu horário de fim passa —
 *    durante ele, ainda é "o próximo". Sem fim, usa a hora de início.
 * 2. Um evento de hoje cujo fim já passou não conta.
 * 3. Eventos repetidos contam na próxima data em que caem; os únicos, na
 *    própria data.
 *
 * Devolve `null` quando não há nada adiante.
 */
export function nextEventAt<T extends Timed>(
  events: T[],
  nowIso: string,
  nowTime: string,
): T | null {
  const nowMin = minutesOf(nowTime);
  const horizon = addDays(nowIso, RECURRENCE_HORIZON_DAYS);
  const candidates: { date: string; event: T }[] = [];

  for (const event of events) {
    const from = isRecurring(event) ? nowIso : event.event_date;
    for (const date of occurrencesInRange(event, from, horizon)) {
      if (date < nowIso) continue;
      if (date === nowIso) {
        // Ocorrência de hoje: só conta se ainda não terminou.
        const ends = event.end_time ? minutesOf(event.end_time) : minutesOf(event.start_time);
        if (ends < nowMin) continue;
      }
      candidates.push({ date, event });
      break;
    }
  }

  // Ordena por DIA e depois por hora — ordenar só pela hora misturaria dias
  // (um evento das 14:00 de amanhã viria antes do das 16:00 de hoje).
  candidates.sort(
    (a, b) => a.date.localeCompare(b.date) || a.event.start_time.localeCompare(b.event.start_time),
  );
  return candidates[0]?.event ?? null;
}

/**
 * Compromissos que disputam o mesmo horário num dia.
 *
 * Dois eventos colidem quando um começa antes de o outro terminar — sem fim
 * declarado, o evento ocupa só o instante de início. Repetidos entram pelo dia
 * em que caem, então um evento de hoje pode colidir com uma escala.
 */
export function conflictsFor<T extends Timed>(events: T[], iso: string): T[] {
  const timed = events.filter((event) => occursOn(event, iso));
  const conflicts = new Set<T>();
  for (let i = 0; i < timed.length; i += 1) {
    for (let j = i + 1; j < timed.length; j += 1) {
      const a = timed[i]!;
      const b = timed[j]!;
      const aStart = minutesOf(a.start_time);
      const aEnd = a.end_time ? minutesOf(a.end_time) : aStart;
      const bStart = minutesOf(b.start_time);
      const bEnd = b.end_time ? minutesOf(b.end_time) : bStart;
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.add(a);
        conflicts.add(b);
      }
    }
  }
  return [...conflicts];
}
