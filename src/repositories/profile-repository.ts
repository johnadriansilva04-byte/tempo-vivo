import type {
  AgendaEvent,
  CareerChapter,
  DailyLog,
  DailyLogStatus,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import {
  agendaEvents,
  careerChapters,
  dailyLogs,
  lifePrologue,
  milestones,
  profile,
  projects,
  weeklyFocus,
} from "@/mock/profile";
import { normalizeHandle } from "@/lib/handle";

// ---------------------------------------------------------------------------
// Repositório local persistente (localStorage) — começa VAZIO.
// Nenhuma informação fictícia: tudo que aparece no app foi digitado pelo dono.
// Este arquivo é o caminho de dados quando o Supabase não está configurado;
// com Supabase, o service usa o banco real e este vira apenas o fallback.
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "perfil-vivo:db:v3";
const ANONYMOUS_SCOPE = "anonymous";
const AUTH_KEY = "perfil-vivo:auth:v1";

/** Id da conta logada (lido direto do storage para evitar ciclo de imports). */
function currentLocalUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { session?: { user_id?: string } | null };
    return parsed.session?.user_id ?? null;
  } catch {
    return null;
  }
}

/** Cada conta tem seu próprio banco local: a história de um nunca vaza no outro. */
function storageKey(): string {
  return `${STORAGE_PREFIX}:${currentLocalUserId() ?? ANONYMOUS_SCOPE}`;
}

type LocalDB = {
  profile: Profile;
  daily_logs: DailyLog[];
  weekly_focus: WeeklyFocus[];
  career_chapters: CareerChapter[];
  projects: Project[];
  milestones: Milestone[];
  agenda_events: AgendaEvent[];
  prologue: string;
};

/** Diretório local de perfis públicos. Sem Supabase não há RLS: cada perfil
 *  publicado grava uma cópia aqui para que /rede e /@handle possam encontrá-lo. */
type NetworkDB = Record<string, NetworkEntry>;

export type NetworkEntry = {
  handle: string;
  slug: string;
  profile: Profile;
  milestones: Milestone[];
  projects: Project[];
  chapters: CareerChapter[];
  weekly_focus: WeeklyFocus[];
  agenda_events: AgendaEvent[];
};

const NETWORK_KEY = "perfil-vivo:network:v1";

function readNetwork(): NetworkDB {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NETWORK_KEY);
    return raw ? (JSON.parse(raw) as NetworkDB) : {};
  } catch {
    return {};
  }
}

function writeNetwork(db: NetworkDB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NETWORK_KEY, JSON.stringify(db));
  } catch {
    /* storage indisponível */
  }
}

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Regra de Integridade Temporal (espelha a trigger `enforce_daily_log_lock`):
 *  registros com mais de 24h são travados permanentemente. */
export function computeStatus(
  log: Pick<DailyLog, "log_date" | "created_at" | "status">,
): DailyLogStatus {
  if (log.status === "LOCKED") return "LOCKED";
  if (!log.created_at) return log.status;
  const elapsedMs = Date.now() - new Date(log.created_at).getTime();
  if (elapsedMs > 24 * 60 * 60 * 1000) return "LOCKED";
  const dayOld = Date.now() - new Date(`${log.log_date}T00:00:00`).getTime() > 24 * 60 * 60 * 1000;
  if (dayOld && log.status === "OPEN") return "VALIDATING";
  return log.status;
}

function seed(): LocalDB {
  return {
    profile,
    daily_logs: dailyLogs,
    weekly_focus: weeklyFocus,
    career_chapters: careerChapters,
    projects,
    milestones,
    agenda_events: agendaEvents,
    prologue: lifePrologue,
  };
}

function load(): LocalDB {
  if (typeof window === "undefined") return seed();
  try {
    const key = storageKey();
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(key, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as LocalDB;
    // Reavalia travas de 24h a cada leitura (o tempo passa mesmo sem uso).
    parsed.daily_logs = (parsed.daily_logs ?? []).map((l) => ({ ...l, status: computeStatus(l) }));
    return { ...seed(), ...parsed };
  } catch {
    return seed();
  }
}

function save(db: LocalDB) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(db));
  } catch {
    /* storage cheio/indisponível: mantém apenas em memória */
  }
}

export const localRepository = {
  getProfile(): Profile {
    return load().profile;
  },
  updateProfile(patch: Partial<Omit<Profile, "id">>): Profile {
    const db = load();
    const merged = { ...db.profile, ...patch };
    // Iniciais sempre derivadas do nome — nunca hardcoded.
    db.profile = { ...merged, initials: initialsOf(merged.name) };
    save(db);
    return db.profile;
  },

  getDailyLogs(): DailyLog[] {
    return [...load().daily_logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  },
  upsertDailyLog(log: DailyLog): DailyLog {
    const db = load();
    const next: DailyLog = { ...log, status: computeStatus(log) };
    const idx = db.daily_logs.findIndex((l) => l.id === next.id);
    if (idx === -1) db.daily_logs.push(next);
    else db.daily_logs[idx] = next;
    save(db);
    return next;
  },

  getWeeklyFocus(): WeeklyFocus[] {
    return load().weekly_focus;
  },
  upsertWeeklyFocus(focus: WeeklyFocus): WeeklyFocus {
    const db = load();
    const idx = db.weekly_focus.findIndex((f) => f.id === focus.id);
    if (idx === -1) db.weekly_focus.push(focus);
    else db.weekly_focus[idx] = focus;
    save(db);
    return focus;
  },
  removeWeeklyFocus(id: string): void {
    const db = load();
    db.weekly_focus = db.weekly_focus.filter((f) => f.id !== id);
    save(db);
  },

  getCareerChapters(): CareerChapter[] {
    return load().career_chapters;
  },
  upsertCareerChapter(chapter: CareerChapter): CareerChapter {
    const db = load();
    const idx = db.career_chapters.findIndex((c) => c.id === chapter.id);
    if (idx === -1) db.career_chapters.push(chapter);
    else db.career_chapters[idx] = chapter;
    save(db);
    return chapter;
  },
  removeCareerChapter(id: string): void {
    const db = load();
    db.career_chapters = db.career_chapters.filter((c) => c.id !== id);
    save(db);
  },

  getProjects(): Project[] {
    return load().projects;
  },
  upsertProject(project: Project): Project {
    const db = load();
    const idx = db.projects.findIndex((p) => p.name === project.name);
    if (idx === -1) db.projects.push(project);
    else db.projects[idx] = project;
    save(db);
    return project;
  },
  removeProject(name: string): void {
    const db = load();
    db.projects = db.projects.filter((p) => p.name !== name);
    save(db);
  },

  getMilestones(): Milestone[] {
    return load().milestones;
  },
  upsertMilestone(milestone: Milestone): Milestone {
    const db = load();
    const next: Milestone = { ...milestone, id: milestone.id ?? newId() };
    const idx = db.milestones.findIndex((m) => m.id === next.id || m.title === next.title);
    if (idx === -1) db.milestones.push(next);
    else db.milestones[idx] = next;
    save(db);
    return next;
  },
  removeMilestone(id: string): void {
    const db = load();
    db.milestones = db.milestones.filter((m) => m.id !== id);
    save(db);
  },

  getAgendaEvents(): AgendaEvent[] {
    return [...load().agenda_events].sort(
      (a, b) =>
        a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time),
    );
  },
  upsertAgendaEvent(event: AgendaEvent): AgendaEvent {
    const db = load();
    const next: AgendaEvent = { ...event, id: event.id || newId() };
    const idx = db.agenda_events.findIndex((e) => e.id === next.id);
    if (idx === -1) db.agenda_events.push(next);
    else db.agenda_events[idx] = next;
    save(db);
    return next;
  },
  removeAgendaEvent(id: string): void {
    const db = load();
    db.agenda_events = db.agenda_events.filter((e) => e.id !== id);
    save(db);
  },

  getPrologue(): string {
    return load().prologue;
  },
  setPrologue(text: string): string {
    const db = load();
    db.prologue = text;
    save(db);
    return text;
  },

  // ------------------------------------------------------------- rede local

  /** Publica (ou atualiza) o perfil atual no diretório da rede. */
  publishToNetwork(entry: NetworkEntry): void {
    const db = readNetwork();
    db[entry.slug] = entry;
    writeNetwork(db);
  },

  /** Remove o perfil atual do diretório da rede. */
  unpublishFromNetwork(slug: string): void {
    const db = readNetwork();
    delete db[slug];
    writeNetwork(db);
  },

  /** Todos os perfis publicados, em ordem alfabética pelo nome. */
  listNetwork(): NetworkEntry[] {
    return Object.values(readNetwork())
      .filter((e) => e && e.handle !== "" && e.profile?.name?.trim() !== "")
      .sort((a, b) => a.profile.name.localeCompare(b.profile.name, "pt-BR"));
  },

  /** Perfil público por handle ou slug (tolerante a @, caixa e acentos). */
  findNetworkEntry(handle: string): NetworkEntry | null {
    const clean = normalizeHandle(handle);
    if (!clean) return null;
    const db = readNetwork();
    if (db[clean]) return db[clean];
    return (
      Object.values(db).find(
        (e) => normalizeHandle(e.handle) === clean || normalizeHandle(e.slug) === clean,
      ) ?? null
    );
  },
};
