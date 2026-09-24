import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { stripAppPrompts } from "@/lib/life-story";
import { currentAccount } from "@/store/auth-store";
import {
  computeStatus,
  initialsOf,
  localRepository,
  newId,
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
// Fonte única de verdade para toda a UI.
// - Supabase configurado e usuário logado → lê/escreve nas tabelas SQL reais,
//   sempre com `user_id = auth.uid()` (a RLS reforça o isolamento no servidor).
// - Sem credenciais → repositório local persistente (mesma forma).
// Nenhum dado fictício: o app começa vazio e só mostra o que o dono escreveu.
// ---------------------------------------------------------------------------

/** Id do usuário no Supabase, ou null quando não há sessão remota. */
function remoteUid(): string | null {
  if (!isSupabaseConfigured || !supabase) return null;
  return currentAccount()?.id ?? null;
}

function remote(): { db: NonNullable<typeof supabase>; uid: string } | null {
  const uid = remoteUid();
  if (!uid || !supabase) return null;
  return { db: supabase, uid };
}

const EMPTY_PROFILE: Profile = {
  name: "",
  role: "",
  location: "",
  bio: "",
  initials: "?",
  birth_date: "",
  target_lifespan: 100,
  avatar_url: null,
  cover_url: null,
};

// ------------------------------------------------------------------ Profile

type ProfileRow = Record<string, unknown>;

function fromRemoteProfile(row: ProfileRow): Profile {
  const name = String(row["full_name"] ?? "");
  return {
    id: String(row["id"]),
    name,
    role: String(row["role"] ?? ""),
    location: String(row["location"] ?? ""),
    bio: String(row["bio"] ?? ""),
    initials: initialsOf(name),
    birth_date: String(row["birth_date"] ?? "").slice(0, 10),
    target_lifespan: Number(row["target_lifespan"] ?? 100),
    avatar_url: (row["avatar_url"] as string | null) ?? null,
    cover_url: (row["cover_url"] as string | null) ?? null,
  };
}

export async function getProfile(): Promise<Profile> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db.from("profiles").select("*").eq("id", r.uid).maybeSingle();
    if (error) throw error;
    return data ? fromRemoteProfile(data as ProfileRow) : { ...EMPTY_PROFILE, id: r.uid };
  }
  return localRepository.getProfile();
}

export async function updateProfile(patch: Partial<Omit<Profile, "id">>): Promise<Profile> {
  const r = remote();
  if (r) {
    const row: Record<string, unknown> = { id: r.uid };
    if (patch.name !== undefined) row["full_name"] = patch.name;
    if (patch.role !== undefined) row["role"] = patch.role;
    if (patch.location !== undefined) row["location"] = patch.location;
    if (patch.bio !== undefined) row["bio"] = patch.bio;
    if (patch.birth_date !== undefined) row["birth_date"] = patch.birth_date || null;
    if (patch.target_lifespan !== undefined) row["target_lifespan"] = patch.target_lifespan;
    if (patch.avatar_url !== undefined) row["avatar_url"] = patch.avatar_url;
    if (patch.cover_url !== undefined) row["cover_url"] = patch.cover_url;

    // upsert: cria a linha no primeiro salvamento e atualiza depois (nunca no-op).
    const { data, error } = await r.db
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return fromRemoteProfile(data as ProfileRow);
  }

  const normalized = {
    ...patch,
    ...(patch.name !== undefined && { initials: initialsOf(patch.name) }),
  } as Partial<Omit<Profile, "id">>;
  return localRepository.updateProfile(normalized);
}

// --------------------------------------------------------------- DailyLogs

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
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("daily_logs")
      .select("*")
      .eq("user_id", r.uid)
      .order("log_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteLog(row as Record<string, unknown>));
  }
  return localRepository.getDailyLogs();
}

export async function upsertDailyLog(log: DailyLog): Promise<DailyLog> {
  const r = remote();
  if (r) {
    // `status` e a trava de 24h são decididos pela trigger no banco — o cliente
    // apenas envia o conteúdo e lê de volta o registro oficial.
    const { data, error } = await r.db
      .from("daily_logs")
      .upsert(
        {
          user_id: r.uid,
          log_date: log.log_date,
          planned_text: log.planned_text,
          executed_text: log.executed_text,
          summary_text: log.summary_text,
        } as never,
        { onConflict: "user_id,log_date" },
      )
      .select()
      .single();
    if (error) throw error;
    return fromRemoteLog(data as Record<string, unknown>);
  }
  return localRepository.upsertDailyLog({ ...log, status: computeStatus(log) });
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
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("weekly_focus")
      .select("*")
      .eq("user_id", r.uid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteFocus(row as Record<string, unknown>));
  }
  return localRepository.getWeeklyFocus();
}

export async function createWeeklyFocus(
  input: Pick<WeeklyFocus, "title" | "description" | "week_number" | "year">,
): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("weekly_focus").upsert(
      {
        user_id: r.uid,
        title: input.title,
        description: input.description,
        week_number: input.week_number,
        year: input.year,
        progress_pct: 0,
      } as never,
      { onConflict: "user_id,year,week_number,title" },
    );
    if (error) throw error;
    return;
  }
  localRepository.upsertWeeklyFocus({ id: newId(), progress_pct: 0, ...input });
}

export async function updateWeeklyFocusProgress(id: string, progress_pct: number): Promise<void> {
  const clamped = Math.max(0, Math.min(100, Math.round(progress_pct)));
  const r = remote();
  if (r) {
    const { error } = await r.db
      .from("weekly_focus")
      .update({ progress_pct: clamped })
      .eq("id", id)
      .eq("user_id", r.uid);
    if (error) throw error;
    return;
  }
  const current = localRepository.getWeeklyFocus().find((f) => f.id === id);
  if (current) localRepository.upsertWeeklyFocus({ ...current, progress_pct: clamped });
}

export async function deleteWeeklyFocus(id: string): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("weekly_focus").delete().eq("id", id).eq("user_id", r.uid);
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
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("career_chapters")
      .select("*")
      .eq("user_id", r.uid)
      .neq("document_type", "PROLOGUE")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteChapter(row as Record<string, unknown>));
  }
  return localRepository.getCareerChapters();
}

export async function createCareerChapter(input: Omit<CareerChapter, "id">): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("career_chapters").insert({
      id: newId(),
      user_id: r.uid,
      title: input.title,
      period: input.period,
      document_type: input.document_type,
      content: input.content,
    } as never);
    if (error) throw error;
    return;
  }
  localRepository.upsertCareerChapter({ id: newId(), ...input });
}

// ----------------------------------------------------------------- Projects

function fromRemoteProject(row: Record<string, unknown>): Project {
  return {
    name: String(row["name"] ?? ""),
    description: String(row["description"] ?? ""),
    status: String(row["status"] ?? "Planejado"),
    progress: Number(row["progress"] ?? 0),
    objective: String(row["objective"] ?? ""),
  };
}

export async function getProjects(): Promise<Project[]> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("projects")
      .select("*")
      .eq("user_id", r.uid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteProject(row as Record<string, unknown>));
  }
  return localRepository.getProjects();
}

export async function upsertProject(project: Project): Promise<void> {
  const r = remote();
  if (r) {
    // `id` é uuid gerado pelo banco; a identidade lógica é (user_id, name).
    const { error } = await r.db.from("projects").upsert(
      {
        user_id: r.uid,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        objective: project.objective,
      } as never,
      { onConflict: "user_id,name" },
    );
    if (error) throw error;
    return;
  }
  localRepository.upsertProject(project);
}

// --------------------------------------------------------------- Milestones

function fromRemoteMilestone(row: Record<string, unknown>): Milestone {
  return {
    year: String(row["year"] ?? ""),
    title: String(row["title"] ?? ""),
    description: String(row["description"] ?? ""),
    category: String(row["category"] ?? "Vida"),
  };
}

export async function getMilestones(): Promise<Milestone[]> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("milestones")
      .select("*")
      .eq("user_id", r.uid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteMilestone(row as Record<string, unknown>));
  }
  return localRepository.getMilestones();
}

export async function createMilestone(item: Milestone): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("milestones").upsert(
      {
        user_id: r.uid,
        year: item.year,
        title: item.title,
        description: item.description,
        category: item.category,
      } as never,
      { onConflict: "user_id,title" },
    );
    if (error) throw error;
    return;
  }
  localRepository.upsertMilestone(item);
}

// ------------------------------------------------------------------ Prologue

export async function getLifePrologue(): Promise<string> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("career_chapters")
      .select("content")
      .eq("user_id", r.uid)
      .eq("document_type", "PROLOGUE")
      .maybeSingle();
    if (error) throw error;
    return data ? stripAppPrompts(String((data as Record<string, unknown>)["content"] ?? "")) : "";
  }
  return stripAppPrompts(localRepository.getPrologue());
}

export async function setLifePrologue(text: string): Promise<void> {
  const clean = stripAppPrompts(text);
  const r = remote();
  if (r) {
    const { data, error: selectError } = await r.db
      .from("career_chapters")
      .select("id")
      .eq("user_id", r.uid)
      .eq("document_type", "PROLOGUE")
      .maybeSingle();
    if (selectError) throw selectError;

    if (data) {
      const { error } = await r.db
        .from("career_chapters")
        .update({ content: clean, title: "Prólogo" })
        .eq("id", (data as Record<string, unknown>)["id"] as string)
        .eq("user_id", r.uid);
      if (error) throw error;
    } else {
      const { error } = await r.db.from("career_chapters").insert({
        id: newId(),
        user_id: r.uid,
        title: "Prólogo",
        period: "",
        document_type: "PROLOGUE",
        content: clean,
      } as never);
      if (error) throw error;
    }
    return;
  }
  localRepository.setPrologue(clean);
}
