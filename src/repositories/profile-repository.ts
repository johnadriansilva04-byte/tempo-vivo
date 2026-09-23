import type {
  CareerChapter,
  DailyLog,
  DailyLogStatus,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import {
  careerChapters,
  dailyLogs,
  lifePrologue,
  milestones,
  profile,
  projects,
  weeklyFocus,
} from "@/mock/profile";

// ---------------------------------------------------------------------------
// Repositório local persistente (localStorage) — começa VAZIO.
// Nenhuma informação fictícia: tudo que aparece no app foi digitado pelo dono.
// Quando `isSupabaseConfigured`, o service usa o banco real e este arquivo
// permanece apenas como fallback offline.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:db:v2";

type LocalDB = {
  profile: Profile;
  daily_logs: DailyLog[];
  weekly_focus: WeeklyFocus[];
  career_chapters: CareerChapter[];
  projects: Project[];
  milestones: Milestone[];
  prologue: string;
};

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
    prologue: lifePrologue,
  };
}

function load(): LocalDB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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

  getMilestones(): Milestone[] {
    return load().milestones;
  },
  upsertMilestone(milestone: Milestone): Milestone {
    const db = load();
    const idx = db.milestones.findIndex((m) => m.title === milestone.title);
    if (idx === -1) db.milestones.push(milestone);
    else db.milestones[idx] = milestone;
    save(db);
    return milestone;
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
};
