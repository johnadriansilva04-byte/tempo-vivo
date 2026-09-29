import type {
  AvailabilityRule,
  CommitmentException,
  MeetingRequest,
  OneOffEvent,
  Profile,
  ProfilePrivacy,
  RecurringCommitment,
} from "@/types/profile";

// ---------------------------------------------------------------------------
// Persistência local (modo sem servidor).
//
// Guarda tudo o que o aplicativo usa: o perfil, a rotina recorrente, as
// exceções, os compromissos pontuais, a disponibilidade e os pedidos de
// reunião. Com o Supabase configurado, nada disto é usado — o
// `profile-service` fala direto com o banco.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:db:v4";
const LEGACY_KEYS = [
  "perfil-vivo:db:v3",
  "perfil-vivo:db:v2",
  "perfil-vivo:db:v1",
];

type LocalDB = {
  version: 4;
  profile: Profile;
  recurring_commitments: RecurringCommitment[];
  commitment_exceptions: CommitmentException[];
  one_off_events: OneOffEvent[];
  availability_rules: AvailabilityRule[];
  meeting_requests: MeetingRequest[];
};

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const EMPTY_PROFILE: Profile = {
  id: "local-profile",
  name: "",
  role: "",
  location: "",
  presentation: "",
  initials: "?",
  birth_date: "",
  avatar_url: null,
  cover_url: null,
  slug: "",
  phone: "",
  is_public: true,
  show_schedule: true,
  meetings_enabled: false,
  meeting_duration_min: 30,
  meeting_buffer_min: 15,
  meeting_max_per_day: 2,
  meeting_requires_approval: true,
  meeting_requirements: "",
};

function seed(): LocalDB {
  return {
    version: 4,
    profile: EMPTY_PROFILE,
    recurring_commitments: [],
    commitment_exceptions: [],
    one_off_events: [],
    availability_rules: [],
    meeting_requests: [],
  };
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function load(): LocalDB {
  if (typeof window === "undefined") return seed();
  try {
    // Migra versões anteriores copiando a chave antiga para a nova.
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy && !window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
      }
      window.localStorage.removeItem(key);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<LocalDB> &
      Record<string, unknown>;
    const base = seed();
    return {
      ...base,
      ...(parsed as object),
      profile: { ...base.profile, ...(parsed.profile as object | undefined) },
      recurring_commitments: asArray<RecurringCommitment>(
        parsed.recurring_commitments,
      ),
      commitment_exceptions: asArray<CommitmentException>(
        parsed.commitment_exceptions,
      ),
      one_off_events: asArray<OneOffEvent>(parsed.one_off_events),
      availability_rules: asArray<AvailabilityRule>(parsed.availability_rules),
      meeting_requests: asArray<MeetingRequest>(parsed.meeting_requests),
    };
  } catch {
    return seed();
  }
}

function save(db: LocalDB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // quota excedida / storage indisponível — mantém em memória
  }
}

export function exportLocalDB(): LocalDB {
  return load();
}

export function clearLocalDB(): LocalDB {
  const fresh = seed();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  return fresh;
}

export const localRepository = {
  getProfile(): Profile {
    return load().profile;
  },
  updateProfile(patch: Partial<Omit<Profile, "id">>): Profile {
    const db = load();
    const merged = { ...db.profile, ...patch };
    db.profile = { ...merged, initials: initialsOf(merged.name) };
    save(db);
    return db.profile;
  },

  // ------------------------------------------------------ agenda recorrente
  getRecurringCommitments(): RecurringCommitment[] {
    return load().recurring_commitments;
  },
  upsertRecurringCommitment(c: RecurringCommitment): RecurringCommitment {
    const db = load();
    const idx = db.recurring_commitments.findIndex((x) => x.id === c.id);
    if (idx === -1) db.recurring_commitments.push(c);
    else db.recurring_commitments[idx] = c;
    save(db);
    return c;
  },
  removeRecurringCommitment(id: string): void {
    const db = load();
    db.recurring_commitments = db.recurring_commitments.filter(
      (x) => x.id !== id,
    );
    // Exceções de uma regra removida não fazem sentido — removidas em cascata.
    db.commitment_exceptions = db.commitment_exceptions.filter(
      (x) => x.commitment_id !== id,
    );
    save(db);
  },

  getCommitmentExceptions(): CommitmentException[] {
    return load().commitment_exceptions;
  },
  upsertCommitmentException(e: CommitmentException): CommitmentException {
    const db = load();
    const idx = db.commitment_exceptions.findIndex(
      (x) =>
        x.commitment_id === e.commitment_id &&
        x.exception_date === e.exception_date,
    );
    if (idx === -1) db.commitment_exceptions.push(e);
    else db.commitment_exceptions[idx] = e;
    save(db);
    return e;
  },
  removeCommitmentException(id: string): void {
    const db = load();
    db.commitment_exceptions = db.commitment_exceptions.filter(
      (x) => x.id !== id,
    );
    save(db);
  },

  // -------------------------------------------------------- eventos pontuais
  getOneOffEvents(): OneOffEvent[] {
    return load().one_off_events;
  },
  upsertOneOffEvent(e: OneOffEvent): OneOffEvent {
    const db = load();
    const idx = db.one_off_events.findIndex((x) => x.id === e.id);
    if (idx === -1) db.one_off_events.push(e);
    else db.one_off_events[idx] = e;
    save(db);
    return e;
  },
  removeOneOffEvent(id: string): void {
    const db = load();
    db.one_off_events = db.one_off_events.filter((x) => x.id !== id);
    save(db);
  },

  // -------------------------------------------------------- disponibilidade
  getAvailabilityRules(): AvailabilityRule[] {
    return load().availability_rules;
  },
  upsertAvailabilityRule(rule: AvailabilityRule): AvailabilityRule {
    const db = load();
    const idx = db.availability_rules.findIndex(
      (r) => r.weekday === rule.weekday,
    );
    if (idx === -1) db.availability_rules.push(rule);
    else db.availability_rules[idx] = rule;
    save(db);
    return rule;
  },

  // ---------------------------------------------------------------- reuniões
  getMeetingRequests(): MeetingRequest[] {
    return load().meeting_requests;
  },
  upsertMeetingRequest(m: MeetingRequest): MeetingRequest {
    const db = load();
    const idx = db.meeting_requests.findIndex((x) => x.id === m.id);
    if (idx === -1) db.meeting_requests.push(m);
    else db.meeting_requests[idx] = m;
    save(db);
    return m;
  },
  removeMeetingRequest(id: string): void {
    const db = load();
    db.meeting_requests = db.meeting_requests.filter((x) => x.id !== id);
    save(db);
  },
};

export type { ProfilePrivacy };
