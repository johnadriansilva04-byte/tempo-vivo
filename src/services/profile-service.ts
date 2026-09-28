import { ApiError, mapUnknownError } from "@/lib/api-errors";
import type { Database } from "@/lib/database.types";
import { SINGLETON_USER_ID } from "@/lib/database.types";
import {
  checkSupabaseHealth,
  isSupabaseConfigured,
  requireSupabase,
  withRetry,
} from "@/lib/supabase";
import { clampInt, sanitizeText } from "@/lib/sanitize";
import {
  availabilityRuleSchema,
  careerChapterInputSchema,
  commitmentExceptionSchema,
  dailyLogSchema,
  familyMemberSchema,
  meetingDecisionSchema,
  meetingRequestSchema,
  milestoneSchema,
  oneOffEventSchema,
  profilePatchSchema,
  projectSchema,
  recurringCommitmentSchema,
  timeCapsuleSchema,
  weeklyFocusInputSchema,
} from "@/lib/validators";
import {
  computeStatus,
  exportLocalDB,
  initialsOf,
  localRepository,
  newId,
} from "@/repositories/profile-repository";
import {
  computeDaySlots,
  normalizePhone,
  occurrencesForDate,
  toMinutes,
  todayIso,
  addDaysIso,
  sliceSlotsForMeetings,
  slugify,
} from "@/lib/schedule";
import type {
  AvailabilityRule,
  CareerChapter,
  CommitmentException,
  DailyLog,
  DaySlot,
  FamilyMember,
  MeetingRequest,
  Milestone,
  OneOffEvent,
  Profile,
  Project,
  RecurringCommitment,
  ScheduleOccurrence,
  TimeCapsule,
  Weekday,
  WeeklyFocus,
} from "@/types/profile";

// — helpers internos

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  birth_date: string | null;
  target_lifespan: number | null;
  avatar_url: string | null;
  cover_url: string | null;
  slug: string | null;
  phone: string | null;
  presentation: string | null;
  is_public: boolean | null;
  show_schedule: boolean | null;
  show_projects: boolean | null;
  show_achievements: boolean | null;
  show_family: boolean | null;
  meetings_enabled: boolean | null;
  meeting_duration_min: number | null;
  meeting_buffer_min: number | null;
  meeting_max_per_day: number | null;
  meeting_requires_approval: boolean | null;
  meeting_requirements: string | null;
};

function profileRowToDomain(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: String(row.full_name ?? ""),
    role: String(row.role ?? ""),
    location: String(row.location ?? ""),
    bio: String(row.bio ?? ""),
    initials: initialsOf(String(row.full_name ?? "")),
    birth_date: String(row.birth_date ?? "").slice(0, 10),
    target_lifespan: Number(row.target_lifespan ?? 100),
    avatar_url: row.avatar_url ?? null,
    cover_url: row.cover_url ?? null,
    slug: String(row.slug ?? ""),
    phone: String(row.phone ?? ""),
    presentation: String(row.presentation ?? ""),
    is_public: row.is_public ?? true,
    show_schedule: row.show_schedule ?? true,
    show_projects: row.show_projects ?? true,
    show_achievements: row.show_achievements ?? true,
    show_family: row.show_family ?? true,
    meetings_enabled: row.meetings_enabled ?? false,
    meeting_duration_min: Number(row.meeting_duration_min ?? 30),
    meeting_buffer_min: Number(row.meeting_buffer_min ?? 15),
    meeting_max_per_day: Number(row.meeting_max_per_day ?? 2),
    meeting_requires_approval: row.meeting_requires_approval ?? true,
    meeting_requirements: String(row.meeting_requirements ?? ""),
  };
}

function toDisplayError(err: unknown): ApiError {
  const mapped = mapUnknownError(err);
  // Mensagens de UX — já humanizadas no mapper; só repassa
  return mapped;
}

// — Profile

export async function getProfile(): Promise<Profile> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("profiles")
          .select("*")
          .eq("id", SINGLETON_USER_ID)
          .maybeSingle(),
      );
      if (error) throw error;
      if (data) return profileRowToDomain(data);
      // seed não aplicado ainda: cria singleton vazio
      const { data: created, error: insErr } = await db
        .from("profiles")
        .upsert({ id: SINGLETON_USER_ID, full_name: "" }, { onConflict: "id" })
        .select()
        .single();
      if (insErr) throw insErr;
      return profileRowToDomain(created);
    } catch (e) {
      const err = mapUnknownError(e);
      if (
        err.code === "NOT_CONFIGURED" ||
        err.code === "NETWORK" ||
        err.code === "TIMEOUT"
      ) {
        console.warn("[profileService] fallback local:", err.message);
      } else {
        throw toDisplayError(e);
      }
    }
  }
  return localRepository.getProfile();
}

export async function updateProfile(
  patch: Partial<Omit<Profile, "id">>,
): Promise<Profile> {
  const parsed = profilePatchSchema.safeParse(patch);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Dados inválidos",
    );
  const normalized = {
    ...parsed.data,
    ...(parsed.data.name !== undefined
      ? { initials: initialsOf(parsed.data.name) }
      : {}),
  } as Partial<Omit<Profile, "id">>;

  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];
      const row: ProfilesUpdate = { updated_at: new Date().toISOString() };
      if (normalized.name !== undefined)
        row.full_name = sanitizeText(normalized.name, 120);
      if (normalized.role !== undefined)
        row.role = sanitizeText(normalized.role, 120);
      if (normalized.location !== undefined)
        row.location = sanitizeText(normalized.location, 120);
      if (normalized.bio !== undefined)
        row.bio = sanitizeText(normalized.bio, 600);
      if (normalized.birth_date !== undefined)
        row.birth_date = normalized.birth_date || null;
      if (normalized.target_lifespan !== undefined)
        row.target_lifespan = clampInt(normalized.target_lifespan, 40, 150);
      if (normalized.avatar_url !== undefined)
        row.avatar_url = normalized.avatar_url;
      if (normalized.cover_url !== undefined)
        row.cover_url = normalized.cover_url;
      if (normalized.slug !== undefined)
        row.slug = normalized.slug.trim() === "" ? null : normalized.slug;
      if (normalized.phone !== undefined)
        row.phone = normalizePhone(normalized.phone) || null;
      if (normalized.presentation !== undefined)
        row.presentation = sanitizeText(normalized.presentation, 600);
      if (normalized.is_public !== undefined)
        row.is_public = normalized.is_public;
      if (normalized.show_schedule !== undefined)
        row.show_schedule = normalized.show_schedule;
      if (normalized.show_projects !== undefined)
        row.show_projects = normalized.show_projects;
      if (normalized.show_achievements !== undefined)
        row.show_achievements = normalized.show_achievements;
      if (normalized.show_family !== undefined)
        row.show_family = normalized.show_family;
      if (normalized.meetings_enabled !== undefined)
        row.meetings_enabled = normalized.meetings_enabled;
      if (normalized.meeting_duration_min !== undefined)
        row.meeting_duration_min = clampInt(
          normalized.meeting_duration_min,
          10,
          240,
        );
      if (normalized.meeting_buffer_min !== undefined)
        row.meeting_buffer_min = clampInt(
          normalized.meeting_buffer_min,
          0,
          120,
        );
      if (normalized.meeting_max_per_day !== undefined)
        row.meeting_max_per_day = clampInt(
          normalized.meeting_max_per_day,
          1,
          10,
        );
      if (normalized.meeting_requires_approval !== undefined)
        row.meeting_requires_approval = normalized.meeting_requires_approval;
      if (normalized.meeting_requirements !== undefined)
        row.meeting_requirements = sanitizeText(
          normalized.meeting_requirements,
          600,
        );
      const { error } = await db
        .from("profiles")
        .update(row)
        .eq("id", SINGLETON_USER_ID);
      if (error) throw error;
      const { data, error: selErr } = await db
        .from("profiles")
        .select("*")
        .eq("id", SINGLETON_USER_ID)
        .single();
      if (selErr) throw selErr;
      return profileRowToDomain(data);
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  return localRepository.updateProfile(normalized);
}

// — DailyLogs

function fromRemoteLog(row: {
  id: string;
  log_date: string;
  planned_text: string | null;
  executed_text: string | null;
  summary_text: string | null;
  status: DailyLog["status"];
  locked_at: string | null;
  created_at: string | null;
}): DailyLog {
  return {
    id: String(row.id),
    log_date: String(row.log_date).slice(0, 10),
    planned_text: String(row.planned_text ?? ""),
    executed_text: String(row.executed_text ?? ""),
    summary_text: String(row.summary_text ?? ""),
    status: row.status ?? "OPEN",
    locked_at: row.locked_at ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getDailyLogs(opts?: {
  limit?: number;
  offset?: number;
}): Promise<DailyLog[]> {
  const limit = opts?.limit != null ? clampInt(opts.limit, 1, 100) : 100;
  const offset = opts?.offset != null ? Math.max(0, opts.offset) : 0;
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("daily_logs")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("log_date", { ascending: false })
          .range(offset, offset + limit - 1),
      );
      if (error) throw error;
      return (data ?? []).map(fromRemoteLog);
    } catch (e) {
      const mapped = mapUnknownError(e);
      if (
        mapped.code === "NETWORK" ||
        mapped.code === "TIMEOUT" ||
        mapped.code === "NOT_CONFIGURED"
      ) {
        console.warn("[dailyLogs] fallback local:", mapped.message);
      } else throw toDisplayError(e);
    }
  }
  const all = localRepository.getDailyLogs();
  return all.slice(offset, offset + limit);
}

export async function upsertDailyLog(log: DailyLog): Promise<DailyLog> {
  const parsed = dailyLogSchema.safeParse(log);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Log inválido",
    );
  const normalized: DailyLog = {
    ...parsed.data,
    planned_text: sanitizeText(parsed.data.planned_text, 4000),
    executed_text: sanitizeText(parsed.data.executed_text, 4000),
    summary_text: sanitizeText(parsed.data.summary_text, 4000),
    status: computeStatus(parsed.data),
  };
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await db
        .from("daily_logs")
        .upsert(
          {
            id: normalized.id,
            user_id: SINGLETON_USER_ID,
            log_date: normalized.log_date,
            planned_text: normalized.planned_text,
            executed_text: normalized.executed_text,
            summary_text: normalized.summary_text,
            status: normalized.status,
            locked_at: normalized.locked_at,
            created_at: normalized.created_at,
          },
          { onConflict: "user_id,log_date" },
        )
        .select()
        .single();
      if (error) throw error;
      return fromRemoteLog(data);
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  return localRepository.upsertDailyLog(normalized);
}

// — WeeklyFocus

function fromRemoteFocus(row: {
  id: string;
  title: string | null;
  description: string | null;
  week_number: number | null;
  year: number | null;
  progress_pct: number | null;
}): WeeklyFocus {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    week_number: Number(row.week_number ?? 0),
    year: Number(row.year ?? 0),
    progress_pct: Number(row.progress_pct ?? 0),
  };
}

export async function getWeeklyFocus(): Promise<WeeklyFocus[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("weekly_focus")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      return (data ?? []).map(fromRemoteFocus);
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[weeklyFocus] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getWeeklyFocus();
}

export async function createWeeklyFocus(
  input: Pick<WeeklyFocus, "title" | "description" | "week_number" | "year">,
): Promise<void> {
  const parsed = weeklyFocusInputSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Foco inválido",
    );
  const title = sanitizeText(parsed.data.title, 140);
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("weekly_focus").insert({
        user_id: SINGLETON_USER_ID,
        title,
        description: sanitizeText(parsed.data.description, 600),
        week_number: parsed.data.week_number,
        year: parsed.data.year,
        progress_pct: 0,
      });
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertWeeklyFocus({
    id: `wf-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title,
    description: sanitizeText(parsed.data.description, 600),
    week_number: parsed.data.week_number,
    year: parsed.data.year,
    progress_pct: 0,
  });
}

export async function updateWeeklyFocusProgress(
  id: string,
  progress_pct: number,
): Promise<void> {
  const clamped = clampInt(progress_pct, 0, 100);
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("weekly_focus")
        .update({ progress_pct: clamped })
        .eq("id", id);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const current = localRepository.getWeeklyFocus().find((f) => f.id === id);
  if (current)
    localRepository.upsertWeeklyFocus({ ...current, progress_pct: clamped });
}

export async function deleteWeeklyFocus(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("weekly_focus").delete().eq("id", id);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeWeeklyFocus(id);
}

// — CareerChapters

function fromRemoteChapter(row: {
  id: string;
  title: string | null;
  period: string | null;
  document_type: string | null;
  content: string | null;
}): CareerChapter {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    period: String(row.period ?? ""),
    document_type: String(row.document_type ?? "EXPERIENCE"),
    content: String(row.content ?? ""),
  };
}

export async function getCareerChapters(): Promise<CareerChapter[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("career_chapters")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      return (data ?? []).map(fromRemoteChapter);
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[careerChapters] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getCareerChapters();
}

export async function createCareerChapter(
  input: Omit<CareerChapter, "id">,
): Promise<void> {
  const parsed = careerChapterInputSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Capítulo inválido",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("career_chapters").insert({
        user_id: SINGLETON_USER_ID,
        title: sanitizeText(parsed.data.title, 140),
        period: sanitizeText(parsed.data.period, 80),
        document_type: parsed.data.document_type,
        content: sanitizeText(parsed.data.content, 6000),
      });
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertCareerChapter({
    id: `ch-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: sanitizeText(parsed.data.title, 140),
    period: sanitizeText(parsed.data.period, 80),
    document_type: parsed.data.document_type,
    content: sanitizeText(parsed.data.content, 6000),
  });
}

// — Projects

export async function getProjects(): Promise<Project[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("projects")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      return (data as unknown as Project[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[projects] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getProjects();
}

export async function upsertProject(project: Project): Promise<void> {
  const parsed = projectSchema.safeParse(project);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Projeto inválido",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const p = parsed.data;
      const { error } = await db.from("projects").upsert(
        {
          user_id: SINGLETON_USER_ID,
          name: sanitizeText(p.name, 120),
          description: sanitizeText(p.description, 1200),
          status: p.status,
          progress: clampInt(p.progress, 0, 100),
          objective: sanitizeText(p.objective, 1200),
          period: sanitizeText(p.period, 80),
          activities: sanitizeText(p.activities, 4000),
          results: sanitizeText(p.results, 4000),
          links: sanitizeText(p.links, 2000),
        },
        { onConflict: "user_id,name" },
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertProject(parsed.data);
}

export async function deleteProject(name: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("projects")
        .delete()
        .eq("user_id", SINGLETON_USER_ID)
        .eq("name", name);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeProject(name);
}

// — Milestones

export async function getMilestones(): Promise<Milestone[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("milestones")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("year", { ascending: false }),
      );
      if (error) throw error;
      return (data as unknown as Milestone[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[milestones] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getMilestones();
}

export async function createMilestone(item: Milestone): Promise<void> {
  const parsed = milestoneSchema.safeParse(item);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Marco inválido",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("milestones").insert({
        user_id: SINGLETON_USER_ID,
        year: sanitizeText(parsed.data.year, 20),
        title: sanitizeText(parsed.data.title, 140),
        description: sanitizeText(parsed.data.description, 1200),
        category: sanitizeText(parsed.data.category, 60),
      });
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertMilestone(parsed.data);
}

// — TimeCapsules (Cápsulas do Tempo)

function fromRemoteCapsule(row: {
  id: string;
  title: string;
  content: string;
  unlock_at: string;
  opened_at: string | null;
  created_at: string;
}): TimeCapsule {
  const today = new Date().toISOString().slice(0, 10);
  const unlock = String(row.unlock_at).slice(0, 10);
  const opened = row.opened_at != null;
  // Selagem em camada de leitura: conteúdo só sai se aberta ou se a data chegou.
  const sealed = unlock > today && !opened;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    content: sealed ? "" : String(row.content ?? ""),
    unlock_at: unlock,
    opened_at: row.opened_at ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getTimeCapsules(): Promise<TimeCapsule[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("time_capsules")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("unlock_at", { ascending: true }),
      );
      if (error) throw error;
      return (data ?? []).map(fromRemoteCapsule);
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[timeCapsules] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getTimeCapsules();
}

export async function createTimeCapsule(input: {
  title: string;
  content: string;
  unlock_at: string;
}): Promise<void> {
  const parsed = timeCapsuleSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Cápsula inválida",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("time_capsules").insert({
        user_id: SINGLETON_USER_ID,
        title: sanitizeText(parsed.data.title, 140),
        content: sanitizeText(parsed.data.content, 8000),
        unlock_at: parsed.data.unlock_at,
      });
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertTimeCapsule({
    id: `caps-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: sanitizeText(parsed.data.title, 140),
    content: sanitizeText(parsed.data.content, 8000),
    unlock_at: parsed.data.unlock_at,
    opened_at: null,
    created_at: new Date().toISOString(),
  });
}

export async function openTimeCapsule(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error: selErr } = await db
        .from("time_capsules")
        .select("unlock_at, opened_at")
        .eq("id", id)
        .maybeSingle();
      if (selErr) throw selErr;
      if (!data) throw new ApiError("NOT_FOUND", "Cápsula não encontrada.");
      if (data.opened_at) return; // já aberta — idempotente
      const unlock = String(data.unlock_at).slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (unlock > today) {
        throw new ApiError(
          "LOCKED",
          `Esta cápsula só abre em ${unlock}. Ainda faltam dias.`,
        );
      }
      const { error } = await db
        .from("time_capsules")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const current = localRepository
    .getTimeCapsules()
    // busca no rep inclui seladas com content="" — precisa da versão crua;
    // mas opened_at/unlock_at não são selados, então dá para validar aqui.
    .find((c) => c.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "Cápsula não encontrada.");
  if (current.opened_at) return; // já aberta — idempotente
  const today = new Date().toISOString().slice(0, 10);
  if (current.unlock_at > today) {
    throw new ApiError(
      "LOCKED",
      `Esta cápsula só abre em ${current.unlock_at}.`,
    );
  }
  // Rep recusa cápsulas novas já abertas; para abrir uma existente, atualizamos
  // apenas opened_at preservando título/conteúdo/unlock (regra do SQL).
  const raw = exportLocalDB().time_capsules.find((c) => c.id === id);
  if (!raw) throw new ApiError("NOT_FOUND", "Cápsula não encontrada.");
  localRepository.upsertTimeCapsule({
    ...raw,
    opened_at: new Date().toISOString(),
  });
}

// — Prologue (via RPC quando disponível, com fallback)

export async function getLifePrologue(): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("career_chapters")
          .select("content")
          .eq("user_id", SINGLETON_USER_ID)
          .eq("document_type", "PROLOGUE")
          .limit(1)
          .maybeSingle(),
      );
      if (
        !error &&
        data &&
        typeof (data as { content?: unknown }).content === "string"
      ) {
        return String((data as { content: string }).content);
      }
      if (error) throw error;
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        // fallback local
      } else {
        console.warn("[prologue] fallback local:", m.message);
      }
    }
  }
  return localRepository.getPrologue();
}

export async function setLifePrologue(text: string): Promise<void> {
  const clean = sanitizeText(text, 6000);
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      // Tenta RPC idempotente (migration 3). Fallback manual se ainda não aplicada.
      const { error: rpcErr } = await (
        db.rpc as unknown as (
          name: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: unknown }>
      )("upsert_prologue", { p_user_id: SINGLETON_USER_ID, p_content: clean });
      if (!rpcErr) return;
      // Fallback: upsert manual por (user_id, document_type) único
      const { data, error: selErr } = await db
        .from("career_chapters")
        .select("id")
        .eq("user_id", SINGLETON_USER_ID)
        .eq("document_type", "PROLOGUE")
        .maybeSingle();
      if (selErr) throw selErr;
      if (data) {
        const { error } = await db
          .from("career_chapters")
          .update({ content: clean, title: "Prólogo" })
          .eq("id", (data as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await db.from("career_chapters").insert({
          user_id: SINGLETON_USER_ID,
          title: "Prólogo",
          period: "",
          document_type: "PROLOGUE",
          content: clean,
        });
        if (error) throw error;
      }
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.setPrologue(clean);
}

// — Health exposto ao hook de banner

// ============================================================================
// FASE 2 — Agenda real (recorrências + exceções + eventos)
// ============================================================================

export async function getRecurringCommitments(): Promise<
  RecurringCommitment[]
> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("recurring_commitments")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      return (data as unknown as RecurringCommitment[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[commitments] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getRecurringCommitments();
}

export async function upsertRecurringCommitment(
  input: Omit<RecurringCommitment, "id" | "created_at"> & { id?: string },
): Promise<void> {
  const parsed = recurringCommitmentSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Compromisso inválido",
    );
  const p = parsed.data;
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        user_id: SINGLETON_USER_ID,
        title: sanitizeText(p.title, 120),
        category: sanitizeText(p.category || "Geral", 60),
        start_time: p.start_time,
        end_time: p.end_time,
        weekdays: p.weekdays,
        note: sanitizeText(p.note, 600),
        is_active: p.is_active ?? true,
      };
      const { error } = await db.from("recurring_commitments").upsert(payload);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const id = input.id ?? newId("rc");
  const existing = localRepository
    .getRecurringCommitments()
    .find((c) => c.id === id);
  localRepository.upsertRecurringCommitment({
    id,
    title: sanitizeText(p.title, 120),
    category: sanitizeText(p.category || "Geral", 60),
    start_time: p.start_time,
    end_time: p.end_time,
    weekdays: p.weekdays,
    note: sanitizeText(p.note, 600),
    is_active: p.is_active ?? true,
    created_at: existing?.created_at ?? new Date().toISOString(),
  });
}

export async function deleteRecurringCommitment(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("recurring_commitments")
        .delete()
        .eq("id", id)
        .eq("user_id", SINGLETON_USER_ID);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeRecurringCommitment(id);
}

export async function getCommitmentExceptions(): Promise<
  CommitmentException[]
> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("commitment_exceptions")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("exception_date", { ascending: true }),
      );
      if (error) throw error;
      return (data as unknown as CommitmentException[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[exceptions] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getCommitmentExceptions();
}

export async function upsertCommitmentException(
  input: Omit<CommitmentException, "id">,
): Promise<void> {
  const parsed = commitmentExceptionSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Exceção inválida",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const p = parsed.data;
      const { error } = await db.from("commitment_exceptions").upsert(
        {
          user_id: SINGLETON_USER_ID,
          commitment_id: p.commitment_id,
          exception_date: p.exception_date,
          mode: p.mode,
          title: sanitizeText(p.title, 120),
          start_time: p.start_time ?? "",
          end_time: p.end_time ?? "",
          note: sanitizeText(p.note, 600),
        },
        { onConflict: "commitment_id,exception_date" },
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertCommitmentException({
    id: newId("ex"),
    commitment_id: parsed.data.commitment_id,
    exception_date: parsed.data.exception_date,
    mode: parsed.data.mode,
    title: sanitizeText(parsed.data.title, 120),
    start_time: parsed.data.start_time ?? "",
    end_time: parsed.data.end_time ?? "",
    note: sanitizeText(parsed.data.note, 600),
  });
}

export async function deleteCommitmentException(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("commitment_exceptions")
        .delete()
        .eq("id", id)
        .eq("user_id", SINGLETON_USER_ID);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeCommitmentException(id);
}

export async function getOneOffEvents(): Promise<OneOffEvent[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("one_off_events")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("event_date", { ascending: true }),
      );
      if (error) throw error;
      return (data as unknown as OneOffEvent[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[events] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getOneOffEvents();
}

export async function upsertOneOffEvent(
  input: Omit<OneOffEvent, "id" | "source" | "meeting_request_id"> & {
    id?: string;
    source?: "manual" | "meeting";
    meeting_request_id?: string | null;
  },
): Promise<void> {
  const parsed = oneOffEventSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Evento inválido",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const p = parsed.data;
      const { error } = await db.from("one_off_events").upsert(
        {
          ...(input.id ? { id: input.id } : {}),
          user_id: SINGLETON_USER_ID,
          event_date: p.event_date,
          start_time: p.start_time,
          end_time: p.end_time,
          title: sanitizeText(p.title, 120),
          note: sanitizeText(p.note, 600),
          source: input.source ?? "manual",
          meeting_request_id: input.meeting_request_id ?? null,
        },
        input.id ? { onConflict: "id" } : undefined,
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const id = input.id ?? newId("ev");
  localRepository.upsertOneOffEvent({
    id,
    event_date: parsed.data.event_date,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
    title: sanitizeText(parsed.data.title, 120),
    note: sanitizeText(parsed.data.note, 600),
    source: input.source ?? "manual",
    meeting_request_id: input.meeting_request_id ?? null,
  });
}

export async function deleteOneOffEvent(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("one_off_events")
        .delete()
        .eq("id", id)
        .eq("user_id", SINGLETON_USER_ID);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeOneOffEvent(id);
}

// ============================================================================
// FASE 2 — Disponibilidade pública (decidida MANUALMENTE pelo dono)
// ============================================================================

export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("availability_rules")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("weekday", { ascending: true }),
      );
      if (error) throw error;
      return (data as unknown as AvailabilityRule[]) ?? [];
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[availability] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getAvailabilityRules();
}

export async function upsertAvailabilityRule(
  rule: AvailabilityRule,
): Promise<void> {
  const parsed = availabilityRuleSchema.safeParse(rule);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Regra inválida",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("availability_rules").upsert(
        {
          user_id: SINGLETON_USER_ID,
          weekday: parsed.data.weekday,
          is_available: parsed.data.is_available,
          start_time: parsed.data.start_time,
          end_time: parsed.data.end_time,
        },
        { onConflict: "user_id,weekday" },
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertAvailabilityRule(parsed.data as AvailabilityRule);
}

/**
 * Slots livres de um dia: disponibilidade declarada MENOS compromissos fixos,
 * eventuais e reuniões já aceitas. Retorna janelas contínuas e, quando útil,
 * fatias de reunião (duração + intervalo). O sistema nunca decide sozinho: só
 * calcula a partir das regras que o dono configurou.
 */
export async function getFreeSlotsForDate(dateIso: string): Promise<{
  window: DaySlot[];
  free: DaySlot[];
  slices: DaySlot[];
}> {
  const [rules, commitments, exceptions, events, profile] = await Promise.all([
    getAvailabilityRules(),
    getRecurringCommitments(),
    getCommitmentExceptions(),
    getOneOffEvents(),
    getProfile(),
  ]);
  const rule = rules.find(
    (r) => r.weekday === (new Date(`${dateIso}T00:00:00`).getDay() as Weekday),
  );
  const occurrences = occurrencesForDate(
    dateIso,
    commitments,
    exceptions,
    events,
  );
  const computed = computeDaySlots(dateIso, rule, occurrences);
  // Limite de reuniões por dia: slots restantes = máximo − já aceitas hoje.
  const acceptedToday = events.filter(
    (e) => e.event_date === dateIso && e.source === "meeting",
  ).length;
  const maxRemaining = Math.max(0, profile.meeting_max_per_day - acceptedToday);
  const slices = sliceSlotsForMeetings(
    computed.free,
    profile.meeting_duration_min,
    profile.meeting_buffer_min,
  ).slice(0, maxRemaining);
  return { window: computed.window, free: computed.free, slices };
}

/** Slides de reunião dos próximos N dias — base do "Disponível para reuniões". */
export async function getUpcomingMeetingSlots(
  days = 7,
): Promise<Array<{ date: string; slices: DaySlot[]; free: DaySlot[] }>> {
  const base = todayIso();
  const out: Array<{ date: string; slices: DaySlot[]; free: DaySlot[] }> = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysIso(base, i);
    const { free, slices } = await getFreeSlotsForDate(date);
    out.push({ date, free, slices });
  }
  return out;
}

// ============================================================================
// FASE 2 — Solicitações de reunião (visitante → dono)
// ============================================================================

type MeetingRow = {
  id?: unknown;
  event_date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  requester_name?: unknown;
  requester_contact?: unknown;
  reason?: unknown;
  status?: unknown;
  counter_event_date?: unknown;
  counter_start_time?: unknown;
  counter_end_time?: unknown;
  counter_note?: unknown;
  created_at?: unknown;
};

function meetingRowToDomain(row: MeetingRow): MeetingRequest {
  return {
    id: String(row.id ?? ""),
    event_date: String(row.event_date ?? "").slice(0, 10),
    start_time: String(row.start_time ?? ""),
    end_time: String(row.end_time ?? ""),
    requester_name: String(row.requester_name ?? ""),
    requester_contact: String(row.requester_contact ?? ""),
    reason: String(row.reason ?? ""),
    status: (row.status as MeetingRequest["status"]) ?? "PENDING",
    counter_event_date: row.counter_event_date
      ? String(row.counter_event_date).slice(0, 10)
      : null,
    counter_start_time: row.counter_start_time
      ? String(row.counter_start_time)
      : null,
    counter_end_time: row.counter_end_time
      ? String(row.counter_end_time)
      : null,
    counter_note: String(row.counter_note ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getMeetingRequests(): Promise<MeetingRequest[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("meeting_requests")
          .select("*")
          .eq("owner_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: false }),
      );
      if (error) throw error;
      return (data ?? []).map((r) => meetingRowToDomain(r as MeetingRow));
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[meetings] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getMeetingRequests();
}

/**
 * Visitante envia solicitação via link público.
 */
export async function createMeetingRequest(
  input: Omit<
    MeetingRequest,
    | "id"
    | "status"
    | "counter_event_date"
    | "counter_start_time"
    | "counter_end_time"
    | "counter_note"
    | "created_at"
  >,
): Promise<void> {
  const parsed = meetingRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Solicitação inválida",
    );
  const profile = await getProfile();
  if (!profile.meetings_enabled)
    throw new ApiError(
      "FORBIDDEN",
      "Este perfil não está recebendo solicitações de reunião.",
    );
  // O slot precisa continuar livre no momento do envio.
  const { free } = await getFreeSlotsForDate(parsed.data.event_date);
  const overlapsFree = free.some(
    (s) =>
      toMinutes(parsed.data.start_time) >= toMinutes(s.start_time) &&
      toMinutes(parsed.data.end_time) <= toMinutes(s.end_time),
  );
  if (!overlapsFree)
    throw new ApiError(
      "CONFLICT",
      "Este horário acabou de ficar ocupado. Escolha outro.",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("meeting_requests").insert({
        owner_id: SINGLETON_USER_ID,
        event_date: parsed.data.event_date,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        requester_name: sanitizeText(parsed.data.requester_name, 120),
        requester_contact: sanitizeText(parsed.data.requester_contact, 160),
        reason: sanitizeText(parsed.data.reason, 1200),
      });
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertMeetingRequest({
    ...parsed.data,
    requester_name: sanitizeText(parsed.data.requester_name, 120),
    requester_contact: sanitizeText(parsed.data.requester_contact, 160),
    reason: sanitizeText(parsed.data.reason, 1200),
    id: newId("mr"),
    status: "PENDING",
    counter_event_date: null,
    counter_start_time: null,
    counter_end_time: null,
    counter_note: "",
    created_at: new Date().toISOString(),
  });
}

/**
 * Decisão do dono. ACEITAR cria o evento na agenda (source='meeting') — o
 * horário deixa de estar disponível para outras pessoas automaticamente.
 */
export async function decideMeetingRequest(
  id: string,
  decision: {
    status: "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";
    counter_event_date?: string | null;
    counter_start_time?: string | null;
    counter_end_time?: string | null;
    counter_note?: string;
  },
): Promise<void> {
  const parsed = meetingDecisionSchema.safeParse(decision);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Decisão inválida",
    );
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("meeting_requests")
        .update({
          status: decision.status,
          counter_event_date: decision.counter_event_date ?? null,
          counter_start_time: decision.counter_start_time ?? null,
          counter_end_time: decision.counter_end_time ?? null,
          counter_note: sanitizeText(decision.counter_note ?? "", 600),
        })
        .eq("id", id)
        .eq("owner_id", SINGLETON_USER_ID);
      if (error) throw error;
      if (decision.status === "ACCEPTED") {
        const { data: row } = await db
          .from("meeting_requests")
          .select("event_date, start_time, end_time, requester_name")
          .eq("id", id)
          .maybeSingle();
        const r = row as {
          event_date: string;
          start_time: string;
          end_time: string;
          requester_name: string;
        } | null;
        if (r) {
          const { error: evErr } = await db.from("one_off_events").insert({
            user_id: SINGLETON_USER_ID,
            event_date: r.event_date,
            start_time: r.start_time,
            end_time: r.end_time,
            title: `Reunião — ${r.requester_name}`,
            source: "meeting",
            meeting_request_id: id,
          });
          if (evErr) throw evErr;
        }
      }
      if (decision.status === "CANCELLED") {
        // Cancelou depois de aceita: tira a reunião da agenda (slot volta a ficar livre).
        await db.from("one_off_events").delete().eq("meeting_request_id", id);
      }
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const current = localRepository.getMeetingRequests().find((m) => m.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "Solicitação não encontrada.");
  localRepository.upsertMeetingRequest({
    ...current,
    status: decision.status,
    counter_event_date:
      decision.counter_event_date ?? current.counter_event_date,
    counter_start_time:
      decision.counter_start_time ?? current.counter_start_time,
    counter_end_time: decision.counter_end_time ?? current.counter_end_time,
    counter_note: sanitizeText(decision.counter_note ?? "", 600),
  });
  if (decision.status === "ACCEPTED") {
    localRepository.upsertOneOffEvent({
      id: newId("ev"),
      event_date: current.event_date,
      start_time: current.start_time,
      end_time: current.end_time,
      title: `Reunião — ${current.requester_name}`,
      note: "",
      source: "meeting",
      meeting_request_id: id,
    });
  }
  if (decision.status === "CANCELLED") {
    // Cancelou depois de aceita: remove o evento — o horário volta a ficar livre.
    for (const ev of localRepository.getOneOffEvents()) {
      if (ev.meeting_request_id === id)
        localRepository.removeOneOffEvent(ev.id);
    }
  }
} // ============================================================================
// FASE 2 — Família (continuidade digital, convite por telefone)
// ============================================================================

type FamilyRow = {
  id?: unknown;
  display_name?: unknown;
  phone?: unknown;
  relation?: unknown;
  member_user_id?: unknown;
  invite_status?: unknown;
  privacy?: unknown;
  note?: unknown;
  created_at?: unknown;
};

function familyRowToDomain(row: FamilyRow): FamilyMember {
  return {
    id: String(row.id ?? ""),
    display_name: String(row.display_name ?? ""),
    phone: String(row.phone ?? ""),
    relation: (row.relation as FamilyMember["relation"]) ?? "outro",
    member_user_id: row.member_user_id ? String(row.member_user_id) : null,
    invite_status:
      (row.invite_status as FamilyMember["invite_status"]) ?? "LINKED",
    privacy: (row.privacy as FamilyMember["privacy"]) ?? "FAMILY",
    note: String(row.note ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db
          .from("family_members")
          .select("*")
          .eq("user_id", SINGLETON_USER_ID)
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      return (data ?? []).map((r) => familyRowToDomain(r as FamilyRow));
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code === "NETWORK" ||
        m.code === "TIMEOUT" ||
        m.code === "NOT_CONFIGURED"
      ) {
        console.warn("[family] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getFamilyMembers();
}

/** Upsert bruto de solicitação de reunião (usado pelo import de backup). */
export async function upsertMeetingRequest(m: MeetingRequest): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("meeting_requests").upsert(
        {
          id: m.id,
          owner_id: SINGLETON_USER_ID,
          event_date: m.event_date,
          start_time: m.start_time,
          end_time: m.end_time,
          requester_name: m.requester_name,
          requester_contact: m.requester_contact,
          reason: m.reason,
          status: m.status,
          counter_start_time: m.counter_start_time,
          counter_end_time: m.counter_end_time,
          counter_event_date: m.counter_event_date,
          counter_note: m.counter_note,
          created_at: m.created_at,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.upsertMeetingRequest(m);
}

/** Upsert bruto de familiar (usado pelo import de backup). */
export async function upsertFamilyMember(f: FamilyMember): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("family_members").upsert(
        {
          id: f.id,
          user_id: SINGLETON_USER_ID,
          display_name: f.display_name,
          phone: f.phone,
          relation: f.relation,
          member_user_id: f.member_user_id,
          invite_status: f.invite_status,
          privacy: f.privacy,
          note: f.note,
          created_at: f.created_at,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const existing = localRepository
    .getFamilyMembers()
    .find((x) => x.id === f.id);
  localRepository.upsertFamilyMember({
    ...f,
    created_at: existing?.created_at ?? f.created_at,
  });
}

/**
 * Adiciona familiar por NÚMERO DE CELULAR. Se o número já pertence a outra
 * conta do Perfil Vivo, a relação é vinculada ao ID único daquela conta.
 * Se não existe conta, a relação fica PENDING (convite) — nunca conta falsa.
 */
export async function addFamilyMember(
  input: Omit<
    FamilyMember,
    "id" | "member_user_id" | "invite_status" | "created_at" | "phone"
  >,
): Promise<{ linked: boolean }> {
  const parsed = familyMemberSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Familiar inválido",
    );
  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 10)
    throw new ApiError("VALIDATION", "Telefone inválido — inclua DDD.");

  // Descoberta de conta: procura perfil já existente com esse telefone.
  let memberUserId: string | null = null;
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data } = await db
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .neq("id", SINGLETON_USER_ID)
        .limit(1);
      memberUserId =
        data && data.length > 0 ? String((data[0] as { id: string }).id) : null;
    } catch {
      // sem descoberta agora — segue como convite
    }
  }
  const inviteStatus: FamilyMember["invite_status"] = memberUserId
    ? "LINKED"
    : "PENDING";

  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db.from("family_members").upsert(
        {
          user_id: SINGLETON_USER_ID,
          display_name: sanitizeText(parsed.data.display_name, 120),
          phone,
          relation: parsed.data.relation,
          privacy: parsed.data.privacy,
          note: sanitizeText(parsed.data.note, 600),
          member_user_id: memberUserId,
          invite_status: inviteStatus,
        },
        { onConflict: "user_id,phone" },
      );
      if (error) throw error;
      return { linked: inviteStatus === "LINKED" };
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const existing = localRepository
    .getFamilyMembers()
    .find((f) => f.phone === phone);
  localRepository.upsertFamilyMember({
    id: existing?.id ?? newId("fm"),
    display_name: sanitizeText(parsed.data.display_name, 120),
    phone,
    relation: parsed.data.relation,
    member_user_id: memberUserId,
    invite_status: inviteStatus,
    privacy: parsed.data.privacy,
    note: sanitizeText(parsed.data.note, 600),
    created_at: existing?.created_at ?? new Date().toISOString(),
  });
  return { linked: inviteStatus === "LINKED" };
}

export async function updateFamilyMember(
  id: string,
  patch: Pick<FamilyMember, "privacy"> &
    Partial<Pick<FamilyMember, "display_name" | "note" | "relation">>,
): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      type FamilyUpdate =
        Database["public"]["Tables"]["family_members"]["Update"];
      const row: FamilyUpdate = {};
      if (patch.privacy !== undefined) row.privacy = patch.privacy;
      if (patch.display_name !== undefined)
        row.display_name = sanitizeText(patch.display_name, 120);
      if (patch.note !== undefined) row.note = sanitizeText(patch.note, 600);
      if (patch.relation !== undefined) row.relation = patch.relation;
      const { error } = await db
        .from("family_members")
        .update(row)
        .eq("id", id)
        .eq("user_id", SINGLETON_USER_ID);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const current = localRepository.getFamilyMembers().find((f) => f.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "Familiar não encontrado.");
  localRepository.upsertFamilyMember({ ...current, ...patch });
}

export async function removeFamilyMember(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { error } = await db
        .from("family_members")
        .delete()
        .eq("id", id)
        .eq("user_id", SINGLETON_USER_ID);
      if (error) throw error;
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  localRepository.removeFamilyMember(id);
}

// ============================================================================
// FASE 2 — Perfil público (link único /u/:slug)
// ============================================================================

export type PublicProfileBundle = {
  profile: Profile;
  occurrencesToday: ScheduleOccurrence[];
  occurrencesTomorrow: ScheduleOccurrence[];
  freeSlotsToday: DaySlot[];
  freeSlotsTomorrow: DaySlot[];
  availability: AvailabilityRule[];
  projects: Project[];
  milestones: Milestone[];
  family: Array<Pick<FamilyMember, "display_name" | "relation" | "privacy">>;
  prologue: string;
};

/**
 * Janela pública do visitante: HOJE e AMANHÃ, projetos, realizações,
 * disponibilidade e família — respeitando as camadas de privacidade.
 */
export async function getPublicProfileBySlug(
  slug: string,
): Promise<PublicProfileBundle | null> {
  const clean = slugify(slug);
  if (clean === "") return null;

  if (isSupabaseConfigured) {
    try {
      const db = requireSupabase();
      const { data, error } = await withRetry(() =>
        db.from("profiles").select("*").eq("slug", clean).maybeSingle(),
      );
      if (error) throw error;
      if (!data) return null;
      const owner = profileRowToDomain(data as ProfileRow);
      return await buildPublicBundle(owner);
    } catch (e) {
      const m = mapUnknownError(e);
      if (
        m.code !== "NETWORK" &&
        m.code !== "TIMEOUT" &&
        m.code !== "NOT_CONFIGURED"
      )
        throw toDisplayError(e);
    }
  }
  // Modo local: o link público aponta para o próprio singleton.
  const local = localRepository.getProfile();
  if (local.slug !== clean || !local.is_public) return null;
  return await buildPublicBundle(local);
}

async function buildPublicBundle(
  owner: Profile,
): Promise<PublicProfileBundle | null> {
  if (!owner.is_public) return null;
  const [commitments, exceptions, events, rules] = await Promise.all([
    getRecurringCommitments(),
    getCommitmentExceptions(),
    getOneOffEvents(),
    getAvailabilityRules(),
  ]);
  const today = todayIso();
  const tomorrow = addDaysIso(today, 1);
  const todayWd = new Date(`${today}T00:00:00`).getDay() as Weekday;
  const tomorrowWd = new Date(`${tomorrow}T00:00:00`).getDay() as Weekday;

  const occurrencesToday = occurrencesForDate(
    today,
    commitments,
    exceptions,
    events,
  );
  const occurrencesTomorrow = occurrencesForDate(
    tomorrow,
    commitments,
    exceptions,
    events,
  );
  const slotsToday = computeDaySlots(
    today,
    rules.find((r) => r.weekday === todayWd),
    occurrencesToday,
  );
  const slotsTomorrow = computeDaySlots(
    tomorrow,
    rules.find((r) => r.weekday === tomorrowWd),
    occurrencesTomorrow,
  );

  const [projects, milestones, allFamily, prologue] = await Promise.all([
    owner.show_projects ? getProjects() : Promise.resolve([]),
    owner.show_achievements ? getMilestones() : Promise.resolve([]),
    owner.show_family
      ? getFamilyMembers().then((fams) =>
          fams
            .filter((f) => f.privacy === "PUBLIC")
            .map((f) => ({
              display_name: f.display_name,
              relation: f.relation,
              privacy: f.privacy,
            })),
        )
      : Promise.resolve([]),
    getLifePrologue(),
  ]);

  return {
    profile: owner,
    occurrencesToday: owner.show_schedule ? occurrencesToday : [],
    occurrencesTomorrow: owner.show_schedule ? occurrencesTomorrow : [],
    freeSlotsToday: owner.show_schedule ? slotsToday.free : [],
    freeSlotsTomorrow: owner.show_schedule ? slotsTomorrow.free : [],
    availability: owner.show_schedule
      ? rules.filter((r) => r.is_available)
      : [],
    projects,
    milestones,
    family: allFamily,
    prologue,
  };
}

// — Health exposto ao hook de banner
export { checkSupabaseHealth };

// — Export / Import (usa as tabelas SQL quando configurado; local caso contrário)

export type ExportDump = {
  exported_at: string;
  mode: "supabase" | "local";
  profile: Partial<Profile>;
  prologue: string;
  daily_logs: DailyLog[];
  weekly_focus: WeeklyFocus[];
  career_chapters: CareerChapter[];
  projects: Project[];
  milestones: Milestone[];
  time_capsules: TimeCapsule[];
  recurring_commitments: RecurringCommitment[];
  commitment_exceptions: CommitmentException[];
  one_off_events: OneOffEvent[];
  availability_rules: AvailabilityRule[];
  meeting_requests: MeetingRequest[];
  family_members: FamilyMember[];
};

export async function exportAllData(): Promise<ExportDump> {
  const [
    profile,
    prologue,
    daily_logs,
    weekly_focus,
    career_chapters,
    projects,
    milestones,
    time_capsules,
    recurring_commitments,
    commitment_exceptions,
    one_off_events,
    availability_rules,
    meeting_requests,
    family_members,
  ] = await Promise.all([
    getProfile(),
    getLifePrologue(),
    getDailyLogs({ limit: 1000 }),
    getWeeklyFocus(),
    getCareerChapters(),
    getProjects(),
    getMilestones(),
    getTimeCapsules(),
    getRecurringCommitments(),
    getCommitmentExceptions(),
    getOneOffEvents(),
    getAvailabilityRules(),
    getMeetingRequests(),
    getFamilyMembers(),
  ]);
  const { id: _profileId, initials: _initials, ...profileRest } = profile;
  return {
    exported_at: new Date().toISOString(),
    mode: isSupabaseConfigured ? "supabase" : "local",
    profile: profileRest,
    prologue,
    daily_logs,
    weekly_focus,
    career_chapters,
    projects,
    milestones,
    time_capsules,
    recurring_commitments,
    commitment_exceptions,
    one_off_events,
    availability_rules,
    meeting_requests,
    family_members,
  };
}

/**
 * Importa um dump criado por exportAllData. No modo Supabase grava linha a linha
 * nas tabelas reais; no modo local escreve o repositório persistente.
 * Registros travados (>24h) falharão na trigger — são ignorados com aviso.
 */
export async function importAllData(
  dump: Partial<ExportDump>,
): Promise<{ imported: number }> {
  let imported = 0;

  if (dump.profile) {
    await updateProfile(dump.profile);
    imported += 1;
  }
  if (typeof dump.prologue === "string" && dump.prologue.trim() !== "") {
    await setLifePrologue(dump.prologue);
    imported += 1;
  }
  for (const log of dump.daily_logs ?? []) {
    try {
      await upsertDailyLog(log);
      imported += 1;
    } catch {
      // Registro provavelmente travado pela trigger de 24h — segue com os demais.
    }
  }
  for (const f of dump.weekly_focus ?? []) {
    try {
      await createWeeklyFocus({
        title: f.title,
        description: f.description,
        week_number: f.week_number,
        year: f.year,
      });
      imported += 1;
    } catch {
      // duplicado ou inválido — segue
    }
  }
  for (const c of dump.career_chapters ?? []) {
    if (c.document_type === "PROLOGUE") continue; // já importado via setLifePrologue
    try {
      await createCareerChapter(c);
      imported += 1;
    } catch {
      // duplicado — segue
    }
  }
  for (const p of dump.projects ?? []) {
    try {
      await upsertProject(p);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const m of dump.milestones ?? []) {
    try {
      await createMilestone(m);
      imported += 1;
    } catch {
      // duplicado — segue
    }
  }
  // Cápsulas NÃO são importadas por design: o conteúdo é selado pelo banco e
  // importar romperia a integridade temporal.
  for (const rc of dump.recurring_commitments ?? []) {
    try {
      await upsertRecurringCommitment(rc);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const ex of dump.commitment_exceptions ?? []) {
    try {
      await upsertCommitmentException(ex);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const ev of dump.one_off_events ?? []) {
    try {
      await upsertOneOffEvent(ev);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const rule of dump.availability_rules ?? []) {
    try {
      await upsertAvailabilityRule(rule);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const mr of dump.meeting_requests ?? []) {
    try {
      await upsertMeetingRequest(mr);
      imported += 1;
    } catch {
      // segue
    }
  }
  for (const fm of dump.family_members ?? []) {
    try {
      await upsertFamilyMember(fm);
      imported += 1;
    } catch {
      // segue
    }
  }
  return { imported };
}
