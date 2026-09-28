import type {
  AvailabilityRule,
  CareerChapter,
  CommitmentException,
  DailyLog,
  DailyLogStatus,
  FamilyMember,
  MeetingRequest,
  Milestone,
  OneOffEvent,
  Profile,
  Project,
  RecurringCommitment,
  TimeCapsule,
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

const STORAGE_KEY = "perfil-vivo:db:v3";
const LEGACY_KEYS = ["perfil-vivo:db:v2", "perfil-vivo:db:v1"];

type LocalDB = {
  version: 3;
  profile: Profile;
  daily_logs: DailyLog[];
  weekly_focus: WeeklyFocus[];
  career_chapters: CareerChapter[];
  projects: Project[];
  milestones: Milestone[];
  time_capsules: TimeCapsule[];
  prologue: string;
  recurring_commitments: RecurringCommitment[];
  commitment_exceptions: CommitmentException[];
  one_off_events: OneOffEvent[];
  availability_rules: AvailabilityRule[];
  meeting_requests: MeetingRequest[];
  family_members: FamilyMember[];
};

// — helpers

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

/** Espelha a trigger `enforce_daily_log_temporal_integrity` no modo offline. */
export function computeStatus(
  log: Pick<DailyLog, "log_date" | "created_at" | "status">,
): DailyLogStatus {
  if (log.status === "LOCKED") return "LOCKED";
  if (!log.created_at) return log.status;
  const elapsedMs = Date.now() - new Date(log.created_at).getTime();
  if (elapsedMs > 24 * 60 * 60 * 1000) return "LOCKED";
  const dayOld =
    Date.now() - new Date(`${log.log_date}T00:00:00`).getTime() >
    24 * 60 * 60 * 1000;
  if (dayOld && log.status === "OPEN") return "VALIDATING";
  return log.status;
}

function seed(): LocalDB {
  return {
    version: 3,
    profile,
    daily_logs: dailyLogs,
    weekly_focus: weeklyFocus,
    career_chapters: careerChapters,
    projects,
    milestones,
    time_capsules: [],
    prologue: lifePrologue,
    recurring_commitments: [],
    commitment_exceptions: [],
    one_off_events: [],
    availability_rules: [],
    meeting_requests: [],
    family_members: [],
  };
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function load(): LocalDB {
  if (typeof window === "undefined") return seed();
  try {
    // migra v1/v2 → v3: carrega o legado, salva na nova chave e limpa a antiga
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
    const merged: LocalDB = {
      ...base,
      ...(parsed as object),
      profile: { ...base.profile, ...(parsed.profile as object | undefined) },
      daily_logs: asArray<DailyLog>(parsed.daily_logs),
      weekly_focus: asArray<WeeklyFocus>(parsed.weekly_focus),
      career_chapters: asArray<CareerChapter>(parsed.career_chapters),
      projects: asArray<Partial<Project>>(parsed.projects).map((p) => ({
        ...p,
        period: p.period ?? "",
        activities: p.activities ?? "",
        results: p.results ?? "",
        links: p.links ?? "",
      })) as Project[],
      milestones: asArray<Milestone>(parsed.milestones),
      time_capsules: asArray<TimeCapsule>(parsed.time_capsules),
      recurring_commitments: asArray<RecurringCommitment>(
        parsed.recurring_commitments,
      ),
      commitment_exceptions: asArray<CommitmentException>(
        parsed.commitment_exceptions,
      ),
      one_off_events: asArray<OneOffEvent>(parsed.one_off_events),
      availability_rules: asArray<AvailabilityRule>(parsed.availability_rules),
      meeting_requests: asArray<MeetingRequest>(parsed.meeting_requests),
      family_members: asArray<FamilyMember>(parsed.family_members),
      prologue: typeof parsed.prologue === "string" ? parsed.prologue : "",
    };
    merged.daily_logs = merged.daily_logs.map((l) => ({
      ...l,
      status: computeStatus(l),
    }));
    return merged;
  } catch {
    return seed();
  }
}

function save(db: LocalDB) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // quota excedida / storage indisponível — mantém em memória
  }
}

// — export / clear (usados pelo diagnóstico e por testes)

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

// — repositório

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

  getDailyLogs(): DailyLog[] {
    return [...load().daily_logs].sort((a, b) =>
      b.log_date.localeCompare(a.log_date),
    );
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
    const idx = db.milestones.findIndex((m) => m.title === milestone.title);
    if (idx === -1) db.milestones.push(milestone);
    else db.milestones[idx] = milestone;
    save(db);
    return milestone;
  },

  getTimeCapsules(): TimeCapsule[] {
    // Selagem local: conteúdo só sai do repositório quando a data chegou.
    const today = new Date().toISOString().slice(0, 10);
    return load().time_capsules.map((c) => ({
      ...c,
      content: c.unlock_at <= today || c.opened_at ? c.content : "",
    }));
  },
  upsertTimeCapsule(capsule: TimeCapsule): TimeCapsule {
    const db = load();
    const idx = db.time_capsules.findIndex((c) => c.id === capsule.id);
    // Nova cápsula nunca entra já aberta.
    const next: TimeCapsule =
      idx === -1 ? { ...capsule, opened_at: null } : { ...capsule };
    if (idx === -1) db.time_capsules.push(next);
    else db.time_capsules[idx] = next;
    save(db);
    return next;
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

  // ----------------------------------------------------------------- família
  getFamilyMembers(): FamilyMember[] {
    return load().family_members;
  },
  upsertFamilyMember(f: FamilyMember): FamilyMember {
    const db = load();
    const idx = db.family_members.findIndex((x) => x.id === f.id);
    if (idx === -1) db.family_members.push(f);
    else db.family_members[idx] = f;
    save(db);
    return f;
  },
  removeFamilyMember(id: string): void {
    const db = load();
    db.family_members = db.family_members.filter((x) => x.id !== id);
    save(db);
  },
};
