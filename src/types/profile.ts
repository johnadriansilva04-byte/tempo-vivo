/** Tipos do domínio — espelham as migrations SQL (fonte: supabase/migrations). */

// ---------------------------------------------------------------- persistidos

export type Profile = {
  id?: string;
  name: string;
  /** Ocupação exibida no cabeçalho do link público e da agenda. */
  role: string;
  /** Cidade — aparece no cabeçalho do link público. */
  location: string;
  /** Texto curto exibido acima da agenda no link público. */
  presentation: string;
  initials: string;
  birth_date: string; // ISO date
  avatar_url: string | null;
  cover_url: string | null;
  // Identidade pública
  slug: string;
  phone: string;
  is_public: boolean;
  show_schedule: boolean;
  // Reuniões
  meetings_enabled: boolean;
  meeting_duration_min: number;
  meeting_buffer_min: number;
  meeting_max_per_day: number;
  meeting_requires_approval: boolean;
  meeting_requirements: string;
};

export type ProfilePrivacy = "PUBLIC" | "FAMILY" | "PRIVATE";

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
