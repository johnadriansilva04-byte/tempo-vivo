import { z } from "zod";

/** Validadores usados antes de persistir (local ou Supabase) — a UI nunca envia lixo ao banco. */

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser yyyy-mm-dd")
  .refine(
    (s) => !Number.isNaN(new Date(`${s}T00:00:00`).getTime()),
    "Data inválida",
  );

// Aceita URL http(s) ou data-URL de imagem (upload local de arquivo).
const urlOrEmptySchema = z.string().refine((v) => {
  if (v.trim() === "") return true;
  if (v.startsWith("data:image/")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}, "URL inválida");

export const profilePatchSchema = z.object({
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  birth_date: z.union([z.literal(""), isoDateSchema]).optional(),
  avatar_url: z.union([z.null(), urlOrEmptySchema]).optional(),
  cover_url: z.union([z.null(), urlOrEmptySchema]).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Use apenas letras minúsculas, números e hífen")
    .max(40)
    .optional(),
  phone: z.string().max(20).optional(),
  presentation: z.string().max(600).optional(),
  is_public: z.boolean().optional(),
  show_schedule: z.boolean().optional(),
  meetings_enabled: z.boolean().optional(),
  meeting_duration_min: z.number().int().min(10).max(240).optional(),
  meeting_buffer_min: z.number().int().min(0).max(120).optional(),
  meeting_max_per_day: z.number().int().min(1).max(10).optional(),
  meeting_requires_approval: z.boolean().optional(),
  meeting_requirements: z.string().max(600).optional(),
});

// ------------------------------------------------------------------ agenda --

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário deve ser HH:MM");

export const recurringCommitmentSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  category: z.string().trim().max(60),
  start_time: timeSchema,
  end_time: timeSchema,
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  note: z.string().max(600),
  is_active: z.boolean().optional(),
});

export const commitmentExceptionSchema = z.object({
  commitment_id: z.string().min(1),
  exception_date: isoDateSchema,
  mode: z.enum(["cancelled", "edited"]),
  title: z.string().max(120),
  start_time: z.union([z.literal(""), timeSchema]).optional(),
  end_time: z.union([z.literal(""), timeSchema]).optional(),
  note: z.string().max(600),
});

export const oneOffEventSchema = z.object({
  event_date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  title: z.string().trim().min(1, "Título obrigatório").max(120),
  note: z.string().max(600),
});

export const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  is_available: z.boolean(),
  start_time: timeSchema,
  end_time: timeSchema,
});

export const meetingRequestSchema = z.object({
  event_date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  requester_name: z.string().trim().min(1, "Informe seu nome").max(120),
  requester_contact: z.string().trim().min(1, "Informe um contato").max(160),
  reason: z.string().trim().min(1, "Conte o motivo da reunião").max(1200),
});

export const meetingDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "CANCELLED", "RESCHEDULED"]),
  counter_event_date: isoDateSchema.nullable().optional(),
  counter_start_time: z.string().nullable().optional(),
  counter_end_time: z.string().nullable().optional(),
  counter_note: z.string().max(600).optional(),
});

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
