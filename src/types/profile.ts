export type AgendaState = "Aberto" | "Em validação" | "Travado";

/** Status espelha a regra de Integridade Temporal do banco (daily_logs.status). */
export type DailyLogStatus = "OPEN" | "VALIDATING" | "LOCKED";

export type DailyLog = {
  id: string;
  log_date: string; // ISO date (yyyy-mm-dd)
  planned_text: string;
  executed_text: string;
  summary_text: string;
  status: DailyLogStatus;
  locked_at: string | null;
  created_at: string;
};

export type WeeklyFocus = {
  id: string;
  title: string;
  description: string;
  week_number: number;
  year: number;
  progress_pct: number;
};

export type CareerChapter = {
  id: string;
  title: string;
  period: string;
  document_type: string; // "PROLOGUE" | "RESUME" | "CERTIFICATE" | ...
  content: string;
};

export type Project = {
  name: string;
  description: string;
  status: string;
  progress: number;
  objective: string;
  /** Link externo do projeto (repositório, site, documento). */
  link: string;
};

export type Milestone = {
  id?: string;
  year: string;
  title: string;
  description: string;
  category: string;
};

/** Compromisso da agenda: algo com data e hora para fazer. */

/**
 * Repetição de um compromisso. Ausente (null/undefined) = evento único.
 *
 * - `days`: dias da semana (0=domingo) em que o evento ocorre.
 * - `until`: última data em que ele pode ocorrer (yyyy-mm-dd). Vazio = sem fim.
 * - `skip`: datas (yyyy-mm-dd) removidas da série — as folgas de uma escala.
 */
export type Recurrence = {
  days: number[];
  until: string;
  skip?: string[];
};

export type AgendaEvent = {
  id: string;
  title: string;
  event_date: string; // ISO date (yyyy-mm-dd) — primeira ocorrência
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  location: string;
  notes: string;
  recurrence?: Recurrence | null;
};

export type Profile = {
  id?: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  initials: string;
  birth_date: string; // ISO date
  target_lifespan: number; // default 100
  avatar_url: string | null;
  cover_url: string | null;
  /** Identificador público para perfilvivo.com/@handle. */
  handle: string;
  /** Como o visitante pode pedir uma reunião. */
  availability: MeetingAvailability;
};

/** Disponibilidade pública para reuniões: quais dias e horários o dono abre. */
export type MeetingAvailability = {
  /** Dias da semana abertos (0=domingo). */
  days: number[];
  /** Horários oferecidos, em HH:mm. */
  slots: string[];
  /** Duração informativa de cada reunião, em minutos. */
  duration_min: number;
  /** Recado curto mostrado a quem vai pedir a reunião. */
  note: string;
  /** Fechado = o perfil não aceita pedidos no momento. */
  enabled: boolean;
};

export type MeetingStatus = "PENDING" | "CONFIRMED" | "DECLINED";

/**
 * Pedido de reunião feito por um visitante no perfil público.
 * Nasce PENDING; o dono aceita (vira compromisso na agenda) ou recusa.
 */
export type MeetingRequest = {
  id: string;
  host_handle: string;
  requester_name: string;
  requester_phone: string;
  subject: string;
  location: string;
  notes: string;
  meeting_date: string; // yyyy-mm-dd
  meeting_time: string; // HH:mm
  status: MeetingStatus;
  created_at: string;
};

export const DEFAULT_AVAILABILITY: MeetingAvailability = {
  days: [1, 3, 5],
  slots: ["09:00", "10:00", "14:00", "15:00", "16:00"],
  duration_min: 30,
  note: "",
  enabled: true,
};

/** Compat: entradas antigas da agenda derivam de DailyLog quando necessário. */
export type AgendaEntry = {
  date: string;
  weekday: string;
  state: AgendaState;
  planned: string[];
  executed: string[];
  summary: string;
};
