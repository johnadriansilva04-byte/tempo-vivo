import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { stripAppPrompts } from "@/lib/life-story";
import { normalizeHandle, resolveHandle, sameHandle } from "@/lib/handle";
import { toIso } from "@/lib/calendar";
import { currentAccount } from "@/store/auth-store";
import {
  computeStatus,
  initialsOf,
  localRepository,
  newId,
} from "@/repositories/profile-repository";
import type {
  AgendaEvent,
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  Recurrence,
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
  handle: "",
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
    handle: String(row["handle"] ?? ""),
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
    if (patch.handle !== undefined) row["handle"] = patch.handle;

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

export async function deleteCareerChapter(id: string): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("career_chapters").delete().eq("id", id).eq("user_id", r.uid);
    if (error) throw error;
    return;
  }
  localRepository.removeCareerChapter(id);
}

// ----------------------------------------------------------------- Projects

function fromRemoteProject(row: Record<string, unknown>): Project {
  return {
    name: String(row["name"] ?? ""),
    description: String(row["description"] ?? ""),
    status: String(row["status"] ?? "Planejado"),
    progress: Number(row["progress"] ?? 0),
    objective: String(row["objective"] ?? ""),
    link: String(row["link"] ?? ""),
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
        link: project.link,
      } as never,
      { onConflict: "user_id,name" },
    );
    if (error) throw error;
    return;
  }
  localRepository.upsertProject(project);
}

/** Remove um projeto pela identidade lógica (user_id, name). */
export async function deleteProject(name: string): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("projects").delete().eq("user_id", r.uid).eq("name", name);
    if (error) throw error;
    return;
  }
  localRepository.removeProject(name);
}

// --------------------------------------------------------------- Milestones

function fromRemoteMilestone(row: Record<string, unknown>): Milestone {
  return {
    id: String(row["id"]),
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
      .order("year", { ascending: true });
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

export async function deleteMilestone(id: string): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("milestones").delete().eq("id", id).eq("user_id", r.uid);
    if (error) throw error;
    return;
  }
  localRepository.removeMilestone(id);
}

// ------------------------------------------------------------- AgendaEvents

/** Lê a coluna jsonb `recurrence`, tolerando null e formatos antigos. */
function parseRecurrence(value: unknown): Recurrence | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { days?: unknown; until?: unknown; skip?: unknown };
  const days = Array.isArray(raw.days)
    ? raw.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  if (days.length === 0) return null;
  const skip = Array.isArray(raw.skip)
    ? [
        ...new Set(
          raw.skip.filter((d): d is string => typeof d === "string").map((d) => d.slice(0, 10)),
        ),
      ]
    : [];
  return {
    days: [...new Set(days)].sort((a, b) => a - b),
    until: typeof raw.until === "string" ? raw.until.slice(0, 10) : "",
    ...(skip.length > 0 ? { skip: skip.sort() } : {}),
  };
}

function fromRemoteEvent(row: Record<string, unknown>): AgendaEvent {
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    event_date: String(row["event_date"] ?? "").slice(0, 10),
    start_time: String(row["start_time"] ?? "09:00").slice(0, 5),
    end_time: String(row["end_time"] ?? "").slice(0, 5),
    location: String(row["location"] ?? ""),
    notes: String(row["notes"] ?? ""),
    recurrence: parseRecurrence(row["recurrence"]),
  };
}

/** Colunas antigas sem `recurrence` (banco ainda não migrado) geram erro 42703.
 *  Reenviar sem a coluna mantém o app salvando enquanto a migration não roda. */
function isMissingRecurrenceColumn(error: { code?: string; message?: string }): boolean {
  const text = `${error.code ?? ""} ${error.message ?? ""}`;
  return error.code === "42703" || (error.code === "PGRST204" && /recurrence/i.test(text));
}

export async function getAgendaEvents(): Promise<AgendaEvent[]> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db
      .from("agenda_events")
      .select("*")
      .eq("user_id", r.uid)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => fromRemoteEvent(row as Record<string, unknown>));
  }
  return localRepository.getAgendaEvents();
}

export async function saveAgendaEvent(event: AgendaEvent): Promise<void> {
  const r = remote();
  if (r) {
    const base = {
      id: event.id || newId(),
      user_id: r.uid,
      title: event.title,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      notes: event.notes,
    };
    const withRecurrence = { ...base, recurrence: event.recurrence ?? null };
    const { error } = await r.db
      .from("agenda_events")
      .upsert(withRecurrence as never, { onConflict: "id" });
    if (!error) return;
    if (!isMissingRecurrenceColumn(error)) throw error;
    // Banco sem a coluna: grava o essencial para não perder o compromisso.
    const retry = await r.db.from("agenda_events").upsert(base as never, { onConflict: "id" });
    if (retry.error) throw retry.error;
    return;
  }
  localRepository.upsertAgendaEvent(event);
}

export async function deleteAgendaEvent(id: string): Promise<void> {
  const r = remote();
  if (r) {
    const { error } = await r.db.from("agenda_events").delete().eq("id", id).eq("user_id", r.uid);
    if (error) throw error;
    return;
  }
  localRepository.removeAgendaEvent(id);
}

// ----------------------------------------------------------- Public profile

export type PublicProfile = {
  handle: string;
  profile: Profile;
  milestones: Milestone[];
  projects: Project[];
  chapters: CareerChapter[];
  /** Agenda pública: compromissos do dono, já com as repetições declaradas. */
  agenda: AgendaEvent[];
  /** Foco declarado (metas da semana). */
  focus: WeeklyFocus[];
};

/** Resumo de um perfil para o diretório da rede (/rede). */
export type PublicProfileSummary = {
  handle: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  avatar_url: string | null;
  /** Total de itens públicos — conquistas + projetos + marcos. */
  items: number;
  /** Próximo compromisso (yyyy-mm-dd) ou null. */
  next_event: string | null;
};

function summaryOf(entry: {
  handle: string;
  profile: Profile;
  milestones: Milestone[];
  projects: Project[];
  chapters: CareerChapter[];
  agenda: AgendaEvent[];
}): PublicProfileSummary {
  const today = toIso(new Date());
  const dates = entry.agenda
    .map((e) => e.event_date)
    .filter((d) => d !== "")
    .sort();
  const upcoming = dates.find((d) => d >= today) ?? dates[0] ?? null;
  return {
    handle: entry.handle,
    name: entry.profile.name,
    role: entry.profile.role,
    location: entry.profile.location,
    initials: entry.profile.initials,
    avatar_url: entry.profile.avatar_url,
    items: entry.milestones.length + entry.projects.length + entry.chapters.length,
    next_event: upcoming,
  };
}

/**
 * Handle público do dono, criado a partir do nome quando ainda não existe.
 * É o que faz o link perfilvivo.com/@nome funcionar sem o dono configurar nada.
 */
export async function ensurePublicHandle(): Promise<string> {
  const profile = await getProfile();
  const desired = resolveHandle(profile);
  if (!desired) return "";
  if (normalizeHandle(profile.handle) === desired) return desired;
  await updateProfile({ handle: desired });
  return desired;
}

/** Perfis visíveis para o visitante, na rede. */
export async function listPublicProfiles(): Promise<PublicProfileSummary[]> {
  const r = remote();
  if (r) {
    const { data, error } = await r.db.from("public_profiles").select("*");
    if (error) throw error;
    return (data ?? [])
      .map((row) => {
        const record = row as Record<string, unknown>;
        return summaryOf({
          handle: String(record["handle"] ?? ""),
          profile: fromRemoteProfile({
            ...(record["profile_data"] as Record<string, unknown>),
            id: record["id"],
            handle: record["handle"],
          }),
          milestones: ((record["milestones"] as unknown[]) ?? []).map((m) =>
            fromRemoteMilestone(m as Record<string, unknown>),
          ),
          projects: ((record["projects"] as unknown[]) ?? []).map((p) =>
            fromRemoteProject(p as Record<string, unknown>),
          ),
          chapters: ((record["chapters"] as unknown[]) ?? []).map((c) =>
            fromRemoteChapter(c as Record<string, unknown>),
          ),
          agenda: ((record["agenda"] as unknown[]) ?? []).map((a) =>
            fromRemoteEvent(a as Record<string, unknown>),
          ),
        });
      })
      .filter((s) => s.handle !== "" && s.name.trim() !== "")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  return localRepository
    .listNetwork()
    .map((entry) => summaryOf({ ...entry, agenda: entry.agenda_events }));
}

/**
 * Perfil público: os dados que o dono expôs, sem expor a conta.
 * O handle guardado é uma foto do nome — a busca tolera os dois formatos, então
 * compartilhar o link nunca cai em "não encontrado" só por falta de cadastro.
 */
export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  const clean = normalizeHandle(handle);
  if (!clean) return null;
  const r = remote();

  if (r) {
    // 1. Handle gravado. 2. Handle derivado do nome (contas antigas).
    const byHandle = await r.db
      .from("public_profiles")
      .select("*")
      .eq("handle", clean)
      .maybeSingle();
    if (byHandle.error) throw byHandle.error;
    let row = (byHandle.data as Record<string, unknown> | null) ?? null;
    if (!row) {
      const all = await r.db.from("public_profiles").select("*");
      if (all.error) throw all.error;
      row =
        ((all.data ?? []) as Record<string, unknown>[]).find(
          (candidate) => normalizeHandle(String(candidate["handle"] ?? "")) === clean,
        ) ?? null;
    }
    if (!row) return null;
    return {
      handle: clean,
      profile: fromRemoteProfile({
        ...(row["profile_data"] as Record<string, unknown>),
        id: row["id"],
        handle: row["handle"],
      }),
      milestones: ((row["milestones"] as unknown[]) ?? []).map((m) =>
        fromRemoteMilestone(m as Record<string, unknown>),
      ),
      projects: ((row["projects"] as unknown[]) ?? []).map((p) =>
        fromRemoteProject(p as Record<string, unknown>),
      ),
      chapters: ((row["chapters"] as unknown[]) ?? []).map((c) =>
        fromRemoteChapter(c as Record<string, unknown>),
      ),
      agenda: ((row["agenda"] as unknown[]) ?? []).map((a) =>
        fromRemoteEvent(a as Record<string, unknown>),
      ),
      focus: ((row["focus"] as unknown[]) ?? []).map((f) =>
        fromRemoteFocus(f as Record<string, unknown>),
      ),
    };
  }

  // 1. Diretório local (perfis publicados). 2. O próprio dono.
  const entry = localRepository.findNetworkEntry(clean);
  if (entry) {
    return {
      handle: clean,
      profile: entry.profile,
      milestones: entry.milestones,
      projects: entry.projects,
      chapters: entry.chapters,
      agenda: entry.agenda_events,
      focus: entry.weekly_focus,
    };
  }

  const own = localRepository.getProfile();
  if (!sameHandle(resolveHandle(own), clean)) return null;
  return {
    handle: clean,
    profile: own,
    milestones: localRepository.getMilestones(),
    projects: localRepository.getProjects(),
    chapters: localRepository.getCareerChapters(),
    agenda: localRepository.getAgendaEvents(),
    focus: localRepository.getWeeklyFocus(),
  };
}

/**
 * Espelha o perfil atual no diretório da rede (modo local). Com Supabase quem
 * publica é a view `public_profiles`; aqui só espelhamos para /rede funcionar.
 */
export async function publishToNetwork(): Promise<void> {
  if (remote()) return;
  const entry = localRepository.getProfile();
  const handle = resolveHandle(entry);
  if (!handle || entry.name.trim() === "") {
    if (handle) localRepository.unpublishFromNetwork(handle);
    return;
  }
  localRepository.publishToNetwork({
    handle,
    slug: handle,
    profile: { ...entry, handle, initials: initialsOf(entry.name) },
    milestones: localRepository.getMilestones(),
    projects: localRepository.getProjects(),
    chapters: localRepository.getCareerChapters(),
    weekly_focus: localRepository.getWeeklyFocus(),
    agenda_events: localRepository.getAgendaEvents(),
  });
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
