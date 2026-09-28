import { z } from "zod";

/** Validadores usados antes de persistir (local ou Supabase) — UI nunca envia lixo ao banco. */

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser yyyy-mm-dd")
  .refine(
    (s) => !Number.isNaN(new Date(`${s}T00:00:00`).getTime()),
    "Data inválida",
  );

// Aceita URL http(s) ou data-URL de imagem (upload local de arquivo).
// Sem max: data-URLs de arquivo legítimas passam de 2048 caracteres.
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
  bio: z.string().max(600).optional(),
  birth_date: z.union([z.literal(""), isoDateSchema]).optional(),
  target_lifespan: z.number().int().min(40).max(150).optional(),
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
  show_projects: z.boolean().optional(),
  show_achievements: z.boolean().optional(),
  show_family: z.boolean().optional(),
  meetings_enabled: z.boolean().optional(),
  meeting_duration_min: z.number().int().min(10).max(240).optional(),
  meeting_buffer_min: z.number().int().min(0).max(120).optional(),
  meeting_max_per_day: z.number().int().min(1).max(10).optional(),
  meeting_requires_approval: z.boolean().optional(),
  meeting_requirements: z.string().max(600).optional(),
});

export const dailyLogSchema = z.object({
  id: z.string().min(1),
  log_date: isoDateSchema,
  planned_text: z.string().max(4000),
  executed_text: z.string().max(4000),
  summary_text: z.string().max(4000),
  status: z.enum(["OPEN", "VALIDATING", "LOCKED"]),
  locked_at: z.string().nullable(),
  created_at: z.string().min(1),
});

export const weeklyFocusInputSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(140),
  description: z.string().max(600),
  week_number: z.number().int().min(1).max(53),
  year: z.number().int().min(2000).max(2100),
});

export const careerChapterInputSchema = z.object({
  title: z.string().trim().min(1).max(140),
  period: z.string().max(80),
  document_type: z.enum([
    "PROLOGUE",
    "RESUME",
    "EXPERIENCE",
    "EDUCATION",
    "CERTIFICATE",
    "SKILL",
    "LANGUAGE",
    "PRODUCTION",
  ]),
  content: z.string().max(6000),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1200),
  status: z.enum(["Em andamento", "Pesquisa", "Planejado", "Concluído"]),
  progress: z.number().int().min(0).max(100),
  objective: z.string().max(1200),
  // Dumps antigos (sem estes campos) ainda passam — default vazio.
  period: z.string().max(80).default(""),
  activities: z.string().max(4000).default(""),
  results: z.string().max(4000).default(""),
  links: z.string().max(2000).default(""),
});

export const milestoneSchema = z.object({
  year: z.string().trim().min(4).max(20),
  title: z.string().trim().min(1).max(140),
  description: z.string().max(1200),
  category: z.string().max(60),
});

export const timeCapsuleSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(140),
  content: z.string().trim().min(1, "Escreva a carta").max(8000),
  unlock_at: isoDateSchema.refine(
    (d) => new Date(`${d}T00:00:00`).getTime() > Date.now(),
    "A data de abertura deve ser no futuro",
  ),
});

// -------------------------------------------------------------- agenda (fase 2)

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

export const FAMILY_RELATIONS = [
  "mae",
  "pai",
  "filho",
  "filha",
  "irmao",
  "irma",
  "avo",
  "avo_f",
  "tio",
  "tia",
  "primo",
  "prima",
  "conjuge",
  "outro",
] as const;

export const FAMILY_RELATION_LABELS: Record<
  (typeof FAMILY_RELATIONS)[number],
  string
> = {
  mae: "Mãe",
  pai: "Pai",
  filho: "Filho",
  filha: "Filha",
  irmao: "Irmão",
  irma: "Irmã",
  avo: "Avô",
  avo_f: "Avó",
  tio: "Tio",
  tia: "Tia",
  primo: "Primo",
  prima: "Prima",
  conjuge: "Cônjuge",
  outro: "Outro",
};

export const familyMemberSchema = z.object({
  display_name: z.string().trim().min(1, "Nome obrigatório").max(120),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  relation: z.enum(FAMILY_RELATIONS),
  privacy: z.enum(["PUBLIC", "FAMILY", "PRIVATE"]).default("FAMILY"),
  note: z.string().max(600),
});

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type DailyLogInput = z.infer<typeof dailyLogSchema>;
