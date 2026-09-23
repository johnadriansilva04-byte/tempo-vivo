import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { computeStatus, initialsOf, localRepository } from "@/repositories/profile-repository";
import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

// ---------------------------------------------------------------------------
// Fonte única de verdade para toda a UI.
// - Supabase configurado → lê/escreve nas tabelas SQL reais.
// - Sem credenciais      → repositório local persistente (mesma forma).
// O produto começa VAZIO: nenhum registro fictício é retornado até o dono
// escrever o próprio conteúdo.
// ---------------------------------------------------------------------------

const USER_ID = "00000000-0000-0000-0000-000000000001"; // singleton local até haver auth

async function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

// ------------------------------------------------------------------ Profile

async function fetchProfileRemote(): Promise<Profile> {
  const db = await requireSupabase();
  const { data, error } = await db.from("profiles").select("*").eq("id", USER_ID).maybeSingle();
  if (error) throw error;
  if (!data) return localRepository.getProfile();
  return {
    id: data.id,
    name: String(data["full_name"] ?? ""),
    role: String(data["role"] ?? ""),
    location: String(data["location"] ?? ""),
    bio: String(data["bio"] ?? ""),
    initials: initialsOf(String(data["full_name"] ?? "")),
    birth_date: String(data["birth_date"] ?? "").slice(0, 10),
    target_lifespan: Number(data["target_lifespan"] ?? 100),
    avatar_url: (data["avatar_url"] as string | null) ?? null,
    cover_url: (data["cover_url"] as string | null) ?? null,
  };
}

function initials(name: string): string {
  return initialsOf(name);
}

export async function getProfile(): Promise<Profile> {
  if (isSupabaseConfigured) {
    try {
      return await fetchProfileRemote();
    } catch (e) {
      console.warn("[profileService] fallback local:", e);
    }
  }
  return localRepository.getProfile();
}

export async function updateProfile(patch: Partial<Omit<Profile, "id">>): Promise<Profile> {
  const normalized = {
    ...patch,
    ...(patch.name !== undefined && { initials: initials(patch.name) }),
  } as Partial<Omit<Profile, "id">>;

  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const row: Record<string, unknown> = {};
    if (normalized.name !== undefined) row["full_name"] = normalized.name;
    if (normalized.role !== undefined) row["role"] = normalized.role;
    if (normalized.location !== undefined) row["location"] = normalized.location;
    if (normalized.bio !== undefined) row["bio"] = normalized.bio;
    if (normalized.birth_date !== undefined) row["birth_date"] = normalized.birth_date;
    if (normalized.target_lifespan !== undefined)
      row["target_lifespan"] = normalized.target_lifespan;
    if (normalized.avatar_url !== undefined) row["avatar_url"] = normalized.avatar_url;
    if (normalized.cover_url !== undefined) row["cover_url"] = normalized.cover_url;
    const { error } = await db.from("profiles").update(row).eq("id", USER_ID);
    if (error) throw error;
    return fetchProfileRemote();
  }
  return localRepository.updateProfile(normalized);
}

// --------------------------------------------------------------- DailyLogs

function toRemoteLog(log: DailyLog) {
  return {
    id: log.id,
    user_id: USER_ID,
    log_date: log.log_date,
    planned_text: log.planned_text,
    executed_text: log.executed_text,
    summary_text: log.summary_text,
    status: log.status,
    locked_at: log.locked_at,
    created_at: log.created_at,
  };
}

function fromRemoteLog(row: Record<string, unknown>): DailyLog {
  return {
    id: String(row["id"]),
    log_date: String(row["log_date"]).slice(0, 10),
    planned_text: String(row["planned_text"] ?? ""),
    executed_text: String(row["executed_text"] ?? ""),
    summary_text: String(row["summary_text"] ?? ""),
    status: (row["status"] as DailyLog["status"]) ?? "OPEN",
    locked_at: (row["locked_at"] as string | null) ?? null,
    created_at: String(row["created_at"] ?? new Date().toISOString()),
  };
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db
        .from("daily_logs")
        .select("*")
        .eq("user_id", USER_ID)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(fromRemoteLog);
    } catch (e) {
      console.warn("[profileService] fallback local:", e);
    }
  }
  return localRepository.getDailyLogs();
}

export async function upsertDailyLog(log: DailyLog): Promise<DailyLog> {
  const normalized: DailyLog = { ...log, status: computeStatus(log) };
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { data, error } = await db
      .from("daily_logs")
      .upsert(toRemoteLog(normalized))
      .select()
      .single();
    if (error) throw error;
    return fromRemoteLog(data);
  }
  return localRepository.upsertDailyLog(normalized);
}

// ------------------------------------------------------------- WeeklyFocus

function fromRemoteFocus(row: Record<string, unknown>): WeeklyFocus {
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    description: String(row["description"] ?? ""),
    week_number: Number(row["week_number"] ?? 0),
    year: Number(row["year"] ?? 0),
    progress_pct: Number(row["progress_pct"] ?? 0),
  };
}

export async function getWeeklyFocus(): Promise<WeeklyFocus[]> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db
        .from("weekly_focus")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(fromRemoteFocus);
    } catch (e) {
      console.warn("[profileService] fallback local:", e);
    }
  }
  return localRepository.getWeeklyFocus();
}

export async function createWeeklyFocus(
  input: Pick<WeeklyFocus, "title" | "description" | "week_number" | "year">,
): Promise<void> {
  const item: WeeklyFocus = { id: `wf-${Date.now()}`, progress_pct: 0, ...input };
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db.from("weekly_focus").insert({
      id: item.id,
      user_id: USER_ID,
      title: item.title,
      description: item.description,
      week_number: item.week_number,
      year: item.year,
      progress_pct: 0,
    } as never);
    if (error) throw error;
    return;
  }
  localRepository.upsertWeeklyFocus(item);
}

export async function updateWeeklyFocusProgress(id: string, progress_pct: number): Promise<void> {
  const clamped = Math.max(0, Math.min(100, Math.round(progress_pct)));
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db.from("weekly_focus").update({ progress_pct: clamped }).eq("id", id);
    if (error) throw error;
    return;
  }
  const current = localRepository.getWeeklyFocus().find((f) => f.id === id);
  if (current) localRepository.upsertWeeklyFocus({ ...current, progress_pct: clamped });
}

export async function deleteWeeklyFocus(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db.from("weekly_focus").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  localRepository.removeWeeklyFocus(id);
}

// ----------------------------------------------------------- CareerChapters

function fromRemoteChapter(row: Record<string, unknown>): CareerChapter {
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    period: String(row["period"] ?? ""),
    document_type: String(row["document_type"] ?? "EXPERIENCE"),
    content: String(row["content"] ?? ""),
  };
}

export async function getCareerChapters(): Promise<CareerChapter[]> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db
        .from("career_chapters")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(fromRemoteChapter);
    } catch (e) {
      console.warn("[profileService] fallback local:", e);
    }
  }
  return localRepository.getCareerChapters();
}

export async function createCareerChapter(input: Omit<CareerChapter, "id">): Promise<void> {
  const item: CareerChapter = { id: `ch-${Date.now()}`, ...input };
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db.from("career_chapters").insert({
      id: item.id,
      user_id: USER_ID,
      title: item.title,
      period: item.period,
      document_type: item.document_type,
      content: item.content,
    } as never);
    if (error) throw error;
    return;
  }
  localRepository.upsertCareerChapter(item);
}

// ------------------------------------------------ Projects (persiste local; colunas no banco vêm no migration 2)

export async function getProjects(): Promise<Project[]> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db.from("projects").select("*").eq("user_id", USER_ID);
      if (error) throw error;
      return (data as unknown as Project[]) ?? [];
    } catch (e) {
      console.warn("[projects] fallback local:", e);
    }
  }
  return localRepository.getProjects();
}

export async function upsertProject(project: Project): Promise<void> {
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db
      .from("projects")
      .upsert({ id: project.name, user_id: USER_ID, ...project } as never);
    if (error) throw error;
    return;
  }
  localRepository.upsertProject(project);
}

// -------------------------------------------- Milestones (persiste local; tabela no migration 2)

export async function getMilestones(): Promise<Milestone[]> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db
        .from("milestones")
        .select("*")
        .eq("user_id", USER_ID)
        .order("year", { ascending: false });
      if (error) throw error;
      return (data as unknown as Milestone[]) ?? [];
    } catch (e) {
      console.warn("[milestones] fallback local:", e);
    }
  }
  return localRepository.getMilestones();
}

export async function createMilestone(item: Milestone): Promise<void> {
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const { error } = await db.from("milestones").insert({ user_id: USER_ID, ...item } as never);
    if (error) throw error;
    return;
  }
  localRepository.upsertMilestone(item);
}

// ------------------------------------------------------------------ Prologue

export async function getLifePrologue(): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const db = await requireSupabase();
      const { data, error } = await db
        .from("career_chapters")
        .select("content")
        .eq("user_id", USER_ID)
        .eq("document_type", "PROLOGUE")
        .maybeSingle();
      if (!error && data?.["content"] !== undefined) return String(data["content"]);
    } catch {
      // fallback local
    }
  }
  return localRepository.getPrologue();
}

export async function setLifePrologue(text: string): Promise<void> {
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    // Upsert do prólogo como um capítulo PROLOGUE único.
    const { error: selError, data } = await db
      .from("career_chapters")
      .select("id")
      .eq("user_id", USER_ID)
      .eq("document_type", "PROLOGUE")
      .maybeSingle();
    if (selError) throw selError;
    if (data) {
      const { error } = await db
        .from("career_chapters")
        .update({ content: text, title: "Prólogo" })
        .eq("id", data["id"]);
      if (error) throw error;
    } else {
      const { error } = await db.from("career_chapters").insert({
        id: `ch-prologue-${Date.now()}`,
        user_id: USER_ID,
        title: "Prólogo",
        period: "",
        document_type: "PROLOGUE" as unknown as never,
        content: text,
      } as never);
      if (error) throw error;
    }
    return;
  }
  localRepository.setPrologue(text);
}
