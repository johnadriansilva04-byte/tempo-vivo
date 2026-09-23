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
// Repositório local persistente (localStorage).
// Usado enquanto as credenciais Supabase não estão configuradas — mesma forma
// dos dados que virão das tabelas SQL (Fase 3). Quando `isSupabaseConfigured`,
// o service passa a consultar o banco real e este arquivo vira fallback.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:db:v1";

type LocalDB = {
  profile: Profile;
  daily_logs: DailyLog[];
  weekly_focus: WeeklyFocus[];
  career_chapters: CareerChapter[];
};

/** Regra de Integridade Temporal (espelha a trigger `enforce_daily_log_lock`):
 *  registros com mais de 24h são travados permanentemente. */
export function computeStatus(
  log: Pick<DailyLog, "log_date" | "created_at" | "status">,
): DailyLogStatus {
  if (log.status === "LOCKED") return "LOCKED";
  const anchor = new Date(log.created_at).getTime();
  const elapsedMs = Date.now() - anchor;
  if (elapsedMs > 24 * 60 * 60 * 1000) return "LOCKED";
  const dayOld = Date.now() - new Date(`${log.log_date}T00:00:00`).getTime() > 24 * 60 * 60 * 1000;
  if (dayOld && log.status === "OPEN") return "VALIDATING";
  return log.status;
}

function seed(): LocalDB {
  return {
    profile,
    daily_logs: dailyLogs.map((l) => ({ ...l, status: computeStatus(l) })),
    weekly_focus: weeklyFocus,
    career_chapters: careerChapters,
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
    parsed.daily_logs = parsed.daily_logs.map((l) => ({ ...l, status: computeStatus(l) }));
    return parsed;
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
    db.profile = { ...db.profile, ...patch };
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
  getCareerChapters(): CareerChapter[] {
    return load().career_chapters;
  },
};

// Estáticos (sem persistência ainda — permanecem no mock até as tabelas existirem)
export const staticProjects: Project[] = projects;
export const staticMilestones: Milestone[] = milestones;
export const staticPrologue: string = lifePrologue;
