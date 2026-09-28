/** Tipos do domínio — espelham as migrations SQL (fonte: supabase/migrations). */

// ---------------------------------------------------------------- persistidos

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
  /** Período do projeto — ex.: 2024 — hoje. */
  period: string;
  /** Atividades (uma por linha). */
  activities: string;
  /** Resultados (um por linha). */
  results: string;
  /** Links (uma URL por linha). */
  links: string;
};
export type Milestone = {
  year: string;
  title: string;
  description: string;
  category: string;
};

/** Cápsula do tempo: carta selada até unlock_at; content só é legível após abrir. */
export type TimeCapsule = {
  id: string;
  title: string;
  /** Só preenchido quando a cápsula foi aberta (unlock_at <= hoje). */
  content: string;
  unlock_at: string; // ISO date
  opened_at: string | null;
  created_at: string;
};

export type ProfilePrivacy = "PUBLIC" | "FAMILY" | "PRIVATE";

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
  // Identidade pública (fase 2)
  slug: string;
  phone: string;
  presentation: string;
  is_public: boolean;
  show_schedule: boolean;
  show_projects: boolean;
  show_achievements: boolean;
  show_family: boolean;
  meetings_enabled: boolean;
  meeting_duration_min: number;
  meeting_buffer_min: number;
  meeting_max_per_day: number;
  meeting_requires_approval: boolean;
  meeting_requirements: string;
};

// ------------------------------------------------------------------ agenda --

/** Dia da semana 0=domingo … 6=sábado (mesma convenção de Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Compromisso fixo recorrente — a rotina é gerada a partir da regra. */
export type RecurringCommitment = {
  id: string;
  title: string;
  category: string;
  /** 'HH:MM'. end < start significa que cruza a meia-noite. */
  start_time: string;
  end_time: string;
  /** Vazio = todos os dias. */
  weekdays: number[];
  note: string;
  is_active: boolean;
  created_at: string;
};

/** Exceção pontual: altera só a ocorrência da regra naquele date. */
export type CommitmentException = {
  id: string;
  commitment_id: string;
  exception_date: string; // ISO date
  mode: "cancelled" | "edited";
  title: string;
  start_time: string;
  end_time: string;
  note: string;
};

export type OneOffEvent = {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  title: string;
  note: string;
  source: "manual" | "meeting";
  meeting_request_id: string | null;
};

export type AvailabilityRule = {
  weekday: Weekday;
  is_available: boolean;
  start_time: string;
  end_time: string;
};

export type MeetingStatus =
  "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";

export type MeetingRequest = {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  requester_name: string;
  requester_contact: string;
  reason: string;
  status: MeetingStatus;
  counter_event_date: string | null;
  counter_start_time: string | null;
  counter_end_time: string | null;
  counter_note: string;
  created_at: string;
};

export type FamilyRelation =
  | "mae"
  | "pai"
  | "filho"
  | "filha"
  | "irmao"
  | "irma"
  | "avo"
  | "avo_f"
  | "tio"
  | "tia"
  | "primo"
  | "prima"
  | "conjuge"
  | "outro";

export type FamilyInviteStatus = "PENDING" | "LINKED" | "DECLINED" | "REMOVED";

export type FamilyMember = {
  id: string;
  display_name: string;
  /** Número normalizado (só dígitos) — mecanismo de descoberta/convite. */
  phone: string;
  relation: FamilyRelation;
  /** Conta vinculada quando o número já pertence a outro Perfil Vivo. */
  member_user_id: string | null;
  invite_status: FamilyInviteStatus;
  privacy: ProfilePrivacy;
  note: string;
  created_at: string;
};

// ------------------------------------------------------- derivados (client) --

/** Ocorrência concreta de um dia — regra aplicada + exceção + eventos. */
export type ScheduleOccurrence = {
  id: string;
  /** 'recurring' | 'exception' | 'event' */
  kind: "recurring" | "event";
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  note: string;
  source: "manual" | "meeting";
};

export type DaySlot = {
  start_time: string;
  end_time: string;
};
