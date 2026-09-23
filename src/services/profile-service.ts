import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  computeStatus,
  localRepository,
  staticMilestones,
  staticProjects,
  staticPrologue,
} from "@/repositories/profile-repository";
import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

// ---------------------------------------------------------------------------
// Service: fonte única de verdade para toda a UI.
// - Supabase configurado → lê/escreve nas tabelas SQL reais (Fases 3 e 4).
// - Sem credenciais      → repositório local persistente com a mesma forma.
// Nenhuma tela acessa dados por outro caminho.
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

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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
  if (isSupabaseConfigured) {
    const db = await requireSupabase();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row["full_name"] = patch.name;
    if (patch.role !== undefined) row["role"] = patch.role;
    if (patch.location !== undefined) row["location"] = patch.location;
    if (patch.bio !== undefined) row["bio"] = patch.bio;
    if (patch.birth_date !== undefined) row["birth_date"] = patch.birth_date;
    if (patch.target_lifespan !== undefined) row["target_lifespan"] = patch.target_lifespan;
    if (patch.avatar_url !== undefined) row["avatar_url"] = patch.avatar_url;
    if (patch.cover_url !== undefined) row["cover_url"] = patch.cover_url;
    const { error } = await db.from("profiles").update(row).eq("id", USER_ID);
    if (error) throw error;
    return fetchProfileRemote();
  }
  return localRepository.updateProfile(patch);
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
  // A regra de 24h é aplicada no banco (trigger) e espelhada localmente.
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

// ---------------------------------------------------- Estáticos (ainda mock)

export function getProjects(): Project[] {
  return staticProjects;
}
export function getMilestones(): Milestone[] {
  return staticMilestones;
}
export function getLifePrologue(): string {
  return staticPrologue;
}
