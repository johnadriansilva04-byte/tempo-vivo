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
  commitmentExceptionSchema,
  meetingDecisionSchema,
  meetingRequestSchema,
  oneOffEventSchema,
  profilePatchSchema,
  recurringCommitmentSchema,
} from "@/lib/validators";
import {
  exportLocalDB,
  initialsOf,
  localRepository,
  newId,
  clearLocalDB,
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
  CommitmentException,
  DaySlot,
  MeetingRequest,
  OneOffEvent,
  Profile,
  ProfilePrivacy,
  RecurringCommitment,
  ScheduleOccurrence,
  Weekday,
} from "@/types/profile";

// — helpers internos

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  location: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  slug: string | null;
  phone: string | null;
  presentation: string | null;
  is_public: boolean | null;
  show_schedule: boolean | null;
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
    presentation: String(row.presentation ?? ""),
    initials: initialsOf(String(row.full_name ?? "")),
    birth_date: String(row.birth_date ?? "").slice(0, 10),
    avatar_url: row.avatar_url ?? null,
    cover_url: row.cover_url ?? null,
    slug: String(row.slug ?? ""),
    phone: String(row.phone ?? ""),
    is_public: row.is_public ?? true,
    show_schedule: row.show_schedule ?? true,
    meetings_enabled: row.meetings_enabled ?? false,
    meeting_duration_min: Number(row.meeting_duration_min ?? 30),
    meeting_buffer_min: Number(row.meeting_buffer_min ?? 15),
    meeting_max_per_day: Number(row.meeting_max_per_day ?? 2),
    meeting_requires_approval: row.meeting_requires_approval ?? true,
    meeting_requirements: String(row.meeting_requirements ?? ""),
  };
}

function toDisplayError(err: unknown): ApiError {
  return mapUnknownError(err);
}

function isFallbackable(code: string): boolean {
  return code === "NETWORK" || code === "TIMEOUT" || code === "NOT_CONFIGURED";
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
      // linha ainda não existe: cria uma vazia para o singleton
      const { data: created, error: insErr } = await db
        .from("profiles")
        .upsert({ id: SINGLETON_USER_ID, full_name: "" }, { onConflict: "id" })
        .select()
        .single();
      if (insErr) throw insErr;
      return profileRowToDomain(created);
    } catch (e) {
      const err = mapUnknownError(e);
      if (isFallbackable(err.code)) {
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
      if (normalized.birth_date !== undefined)
        row.birth_date = normalized.birth_date || null;
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

// ============================================================================
// Agenda — compromissos fixos, exceções e eventos pontuais
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
      if (isFallbackable(m.code)) {
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
      if (isFallbackable(m.code)) {
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
      if (isFallbackable(m.code)) {
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
// Disponibilidade pública (decidida MANUALMENTE pelo dono)
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
      if (isFallbackable(m.code)) {
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

/** Fatias de reunião dos próximos N dias — base do "Disponível para reuniões". */
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
// Solicitações de reunião (visitante → dono)
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
      if (isFallbackable(m.code)) {
        console.warn("[meetings] fallback local:", m.message);
      } else throw toDisplayError(e);
    }
  }
  return localRepository.getMeetingRequests();
}

/** Visitante envia solicitação via link público. */
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
  // O horário precisa continuar livre no momento do envio.
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
          .select(
            "event_date, start_time, end_time, requester_name, counter_event_date, counter_start_time, counter_end_time",
          )
          .eq("id", id)
          .maybeSingle();
        const r = row as {
          event_date: string;
          start_time: string;
          end_time: string;
          requester_name: string;
          counter_event_date: string | null;
          counter_start_time: string | null;
          counter_end_time: string | null;
        } | null;
        if (r) {
          // Aceitar uma contraproposta agenda no horário proposto, não no original.
          const eventDate = r.counter_event_date ?? r.event_date;
          const start = r.counter_start_time ?? r.start_time;
          const end = r.counter_end_time ?? r.end_time;
          const { error: evErr } = await db.from("one_off_events").insert({
            user_id: SINGLETON_USER_ID,
            event_date: eventDate,
            start_time: start,
            end_time: end,
            title: `Reunião — ${r.requester_name}`,
            source: "meeting",
            meeting_request_id: id,
          });
          if (evErr) throw evErr;
        }
      }
      if (decision.status === "CANCELLED") {
        // Cancelou depois de aceita: tira a reunião da agenda (o horário volta a ficar livre).
        await db.from("one_off_events").delete().eq("meeting_request_id", id);
      }
      return;
    } catch (e) {
      throw toDisplayError(e);
    }
  }
  const current = localRepository.getMeetingRequests().find((m) => m.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "Solicitação não encontrada.");
  const updated: MeetingRequest = {
    ...current,
    status: decision.status,
    counter_event_date:
      decision.counter_event_date ?? current.counter_event_date,
    counter_start_time:
      decision.counter_start_time ?? current.counter_start_time,
    counter_end_time: decision.counter_end_time ?? current.counter_end_time,
    counter_note: sanitizeText(decision.counter_note ?? "", 600),
  };
  localRepository.upsertMeetingRequest(updated);
  if (decision.status === "ACCEPTED") {
    // Aceitar uma contraproposta agenda no horário proposto, não no original.
    localRepository.upsertOneOffEvent({
      id: newId("ev"),
      event_date: updated.counter_event_date ?? updated.event_date,
      start_time: updated.counter_start_time ?? updated.start_time,
      end_time: updated.counter_end_time ?? updated.end_time,
      title: `Reunião — ${updated.requester_name}`,
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
}

// — Health exposto ao hook de banner

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

// ============================================================================
// Perfil público — a janela que o visitante vê em /u/:slug
// ============================================================================

export type PublicProfileBundle = {
  profile: Profile;
};

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
      return owner.is_public ? { profile: owner } : null;
    } catch (e) {
      const m = mapUnknownError(e);
      if (!isFallbackable(m.code)) throw toDisplayError(e);
    }
  }
  // Modo local: o link público aponta para o próprio singleton.
  const local = localRepository.getProfile();
  if (local.slug !== clean || !local.is_public) return null;
  return { profile: local };
}

// — Health exposto ao hook de banner
export { checkSupabaseHealth };

// — Export / Import (usa as tabelas SQL quando configurado; local caso contrário)

export type ExportDump = {
  exported_at: string;
  mode: "supabase" | "local";
  profile: Partial<Profile>;
  recurring_commitments: RecurringCommitment[];
  commitment_exceptions: CommitmentException[];
  one_off_events: OneOffEvent[];
  availability_rules: AvailabilityRule[];
  meeting_requests: MeetingRequest[];
};

export async function exportAllData(): Promise<ExportDump> {
  const [
    profile,
    recurring_commitments,
    commitment_exceptions,
    one_off_events,
    availability_rules,
    meeting_requests,
  ] = await Promise.all([
    getProfile(),
    getRecurringCommitments(),
    getCommitmentExceptions(),
    getOneOffEvents(),
    getAvailabilityRules(),
    getMeetingRequests(),
  ]);
  const { id: _profileId, initials: _initials, ...profileRest } = profile;
  return {
    exported_at: new Date().toISOString(),
    mode: isSupabaseConfigured ? "supabase" : "local",
    profile: profileRest,
    recurring_commitments,
    commitment_exceptions,
    one_off_events,
    availability_rules,
    meeting_requests,
  };
}

/** Importa um dump criado por exportAllData — local ou Supabase. */
export async function importAllData(
  dump: Partial<ExportDump>,
): Promise<{ imported: number }> {
  let imported = 0;
  const step = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      imported += 1;
    } catch {
      // item inválido ou duplicado — segue com os demais
    }
  };

  if (dump.profile) {
    await step(() =>
      updateProfile(dump.profile as Partial<Omit<Profile, "id">>),
    );
  }
  for (const rc of dump.recurring_commitments ?? [])
    await step(() => upsertRecurringCommitment(rc));
  for (const ex of dump.commitment_exceptions ?? [])
    await step(() => upsertCommitmentException(ex));
  for (const ev of dump.one_off_events ?? [])
    await step(() => upsertOneOffEvent(ev));
  for (const rule of dump.availability_rules ?? [])
    await step(() => upsertAvailabilityRule(rule));
  for (const mr of dump.meeting_requests ?? [])
    await step(() => upsertMeetingRequest(mr));
  return { imported };
}

// Reexportado para Configurações (limpar dados locais) e diagnóstico.
export { exportLocalDB, clearLocalDB };
export type { ProfilePrivacy };
