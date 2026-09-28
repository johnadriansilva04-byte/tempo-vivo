import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as Slot, g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { a as objectType, i as numberType, n as literalType, o as stringType, r as nullType, s as unionType, t as enumType } from "../_libs/zod.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-PJRo-bhb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ApiError = class extends Error {
	code;
	cause_;
	constructor(code, message, cause) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.cause_ = cause;
	}
};
var PG_CODE_MAP = {
	"23505": "CONFLICT",
	"23503": "CONFLICT",
	"23514": "VALIDATION",
	P0001: "LOCKED",
	"42501": "FORBIDDEN"
};
function mapSupabaseError(err) {
	const pgMapped = PG_CODE_MAP[err.code ?? ""];
	if (pgMapped) return new ApiError(pgMapped, humanMessage(err.message, pgMapped), err);
	const msg = (err.message ?? "").toLowerCase();
	if (msg.includes("jwt") || msg.includes("not authenticated")) return new ApiError("UNAUTHENTICATED", "Sessão expirada. Faça login novamente.", err);
	if (err.code === "PGRST116") return new ApiError("NOT_FOUND", "Registro não encontrado.", err);
	return new ApiError("UNKNOWN", err.message || "Erro inesperado ao falar com o banco.", err);
}
function mapUnknownError(err) {
	if (err instanceof ApiError) return err;
	if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) return new ApiError("NETWORK", "Sem conexão. Tente novamente em instantes.", err);
	if (err instanceof DOMException && err.name === "AbortError") return new ApiError("TIMEOUT", "Tempo esgotado ao falar com o banco.", err);
	if (typeof err === "object" && err !== null && "code" in err && "message" in err) return mapSupabaseError(err);
	return new ApiError("UNKNOWN", err instanceof Error ? err.message : String(err ?? "Erro desconhecido"), err);
}
function humanMessage(pgMessage, code) {
	if (code === "LOCKED") return pgMessage || "Este dia foi travado (24 h) e não pode ser alterado.";
	if (code === "CONFLICT") return "Registro duplicado — já existe um item com esses dados.";
	if (code === "VALIDATION") return pgMessage || "Dados inválidos.";
	if (code === "FORBIDDEN") return "Sem permissão para esta operação.";
	return pgMessage;
}
/** Chaves react-query centralizadas — evita string solta e facilita invalidação. */
var qk = {
	profile: () => ["profile"],
	dailyLogs: () => ["daily-logs"],
	prologue: () => ["prologue"],
	weeklyFocus: () => ["weekly-focus"],
	careerChapters: () => ["career-chapters"],
	projects: () => ["projects"],
	milestones: () => ["milestones"],
	timeCapsules: () => ["time-capsules"],
	health: () => ["supabase-health"]
};
var SINGLETON_USER_ID = "00000000-0000-0000-0000-000000000001";
var url = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_SUPABASE_URL"];
var anonKey = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/"
}["VITE_SUPABASE_ANON_KEY"];
var isSupabaseConfigured = Boolean(url && anonKey);
var supabase = isSupabaseConfigured ? createClient(url, anonKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	},
	db: { schema: "public" }
}) : null;
function requireSupabase() {
	if (!supabase) throw new ApiError("NOT_CONFIGURED", "Supabase não configurado — usando modo local.");
	return supabase;
}
async function checkSupabaseHealth() {
	if (!isSupabaseConfigured || !supabase) return "not-configured";
	try {
		const { error } = await supabase.from("profiles").select("id").limit(1);
		if (error) throw error;
		return "ok";
	} catch (e) {
		const mapped = mapUnknownError(e);
		if (mapped.code === "NETWORK" || mapped.code === "TIMEOUT") return "offline";
		return "ok";
	}
}
/** Retry apenas para falhas transitórias de rede. Aceita PostgrestBuilder (thenable). */
async function withRetry(fn, attempts = 2) {
	let last;
	for (let i = 0; i < attempts; i++) try {
		return await fn();
	} catch (e) {
		last = e;
		const mapped = mapUnknownError(e);
		if (!(mapped.code === "NETWORK" || mapped.code === "TIMEOUT") || i === attempts - 1) throw e;
		await new Promise((r) => setTimeout(r, 300 * (i + 1)));
	}
	throw last;
}
/** Pico de sanitização — trim + clamp básico antes do Zod. */
function sanitizeText(s, max) {
	return s.trim().slice(0, max);
}
function clampInt(n, min, max) {
	return Math.max(min, Math.min(max, Math.round(n)));
}
/** Validadores usados antes de persistir (local ou Supabase) — UI nunca envia lixo ao banco. */
var isoDateSchema = stringType().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser yyyy-mm-dd").refine((s) => !Number.isNaN((/* @__PURE__ */ new Date(`${s}T00:00:00`)).getTime()), "Data inválida");
var urlOrEmptySchema = stringType().max(2048).refine((v) => {
	if (v.trim() === "") return true;
	try {
		const u = new URL(v);
		return u.protocol === "http:" || u.protocol === "https:" || v.startsWith("data:image/");
	} catch {
		return false;
	}
}, "URL inválida");
var profilePatchSchema = objectType({
	name: stringType().max(120).optional(),
	role: stringType().max(120).optional(),
	location: stringType().max(120).optional(),
	bio: stringType().max(600).optional(),
	birth_date: unionType([literalType(""), isoDateSchema]).optional(),
	target_lifespan: numberType().int().min(40).max(150).optional(),
	avatar_url: unionType([nullType(), urlOrEmptySchema]).optional(),
	cover_url: unionType([nullType(), urlOrEmptySchema]).optional()
});
var dailyLogSchema = objectType({
	id: stringType().min(1),
	log_date: isoDateSchema,
	planned_text: stringType().max(4e3),
	executed_text: stringType().max(4e3),
	summary_text: stringType().max(4e3),
	status: enumType([
		"OPEN",
		"VALIDATING",
		"LOCKED"
	]),
	locked_at: stringType().nullable(),
	created_at: stringType().min(1)
});
var weeklyFocusInputSchema = objectType({
	title: stringType().trim().min(1, "Título obrigatório").max(140),
	description: stringType().max(600),
	week_number: numberType().int().min(1).max(53),
	year: numberType().int().min(2e3).max(2100)
});
var careerChapterInputSchema = objectType({
	title: stringType().trim().min(1).max(140),
	period: stringType().max(80),
	document_type: enumType([
		"PROLOGUE",
		"RESUME",
		"EXPERIENCE",
		"EDUCATION",
		"CERTIFICATE",
		"SKILL",
		"LANGUAGE",
		"PRODUCTION"
	]),
	content: stringType().max(6e3)
});
var projectSchema = objectType({
	name: stringType().trim().min(1).max(120),
	description: stringType().max(1200),
	status: enumType([
		"Em andamento",
		"Pesquisa",
		"Planejado",
		"Concluído"
	]),
	progress: numberType().int().min(0).max(100),
	objective: stringType().max(1200)
});
var milestoneSchema = objectType({
	year: stringType().trim().min(4).max(20),
	title: stringType().trim().min(1).max(140),
	description: stringType().max(1200),
	category: stringType().max(60)
});
var timeCapsuleSchema = objectType({
	title: stringType().trim().min(1, "Título obrigatório").max(140),
	content: stringType().trim().min(1, "Escreva a carta").max(8e3),
	unlock_at: isoDateSchema.refine((d) => (/* @__PURE__ */ new Date(`${d}T00:00:00`)).getTime() > Date.now(), "A data de abertura deve ser no futuro")
});
var profile = {
	id: "local-profile",
	name: "",
	role: "",
	location: "",
	initials: "?",
	bio: "",
	birth_date: "",
	target_lifespan: 100,
	avatar_url: null,
	cover_url: null
};
var dailyLogs = [];
var weeklyFocus = [];
var careerChapters = [];
var projects = [];
var milestones = [];
var STORAGE_KEY = "perfil-vivo:db:v2";
var LEGACY_KEY = "perfil-vivo:db:v1";
function initialsOf(name) {
	const parts = name.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase() || "?";
}
/** Espelha a trigger `enforce_daily_log_temporal_integrity` no modo offline. */
function computeStatus(log) {
	if (log.status === "LOCKED") return "LOCKED";
	if (!log.created_at) return log.status;
	if (Date.now() - new Date(log.created_at).getTime() > 864e5) return "LOCKED";
	if (Date.now() - (/* @__PURE__ */ new Date(`${log.log_date}T00:00:00`)).getTime() > 864e5 && log.status === "OPEN") return "VALIDATING";
	return log.status;
}
function seed() {
	return {
		version: 2,
		profile,
		daily_logs: dailyLogs,
		weekly_focus: weeklyFocus,
		career_chapters: careerChapters,
		projects,
		milestones,
		time_capsules: [],
		prologue: ""
	};
}
function load() {
	if (typeof window === "undefined") return seed();
	try {
		if (window.localStorage.getItem(LEGACY_KEY)) window.localStorage.removeItem(LEGACY_KEY);
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const fresh = seed();
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
			return fresh;
		}
		const parsed = JSON.parse(raw);
		const merged = {
			...seed(),
			...parsed,
			profile: {
				...seed().profile,
				...parsed.profile
			},
			daily_logs: Array.isArray(parsed.daily_logs) ? parsed.daily_logs : [],
			weekly_focus: Array.isArray(parsed.weekly_focus) ? parsed.weekly_focus : [],
			career_chapters: Array.isArray(parsed.career_chapters) ? parsed.career_chapters : [],
			projects: Array.isArray(parsed.projects) ? parsed.projects : [],
			milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
			time_capsules: Array.isArray(parsed.time_capsules) ? parsed.time_capsules : [],
			prologue: typeof parsed.prologue === "string" ? parsed.prologue : ""
		};
		merged.daily_logs = merged.daily_logs.map((l) => ({
			...l,
			status: computeStatus(l)
		}));
		return merged;
	} catch {
		return seed();
	}
}
function save(db) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
	} catch {}
}
function exportLocalDB() {
	return load();
}
function clearLocalDB() {
	const fresh = seed();
	if (typeof window !== "undefined") try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
		window.localStorage.removeItem(LEGACY_KEY);
	} catch {}
	return fresh;
}
var localRepository = {
	getProfile() {
		return load().profile;
	},
	updateProfile(patch) {
		const db = load();
		const merged = {
			...db.profile,
			...patch
		};
		db.profile = {
			...merged,
			initials: initialsOf(merged.name)
		};
		save(db);
		return db.profile;
	},
	getDailyLogs() {
		return [...load().daily_logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
	},
	upsertDailyLog(log) {
		const db = load();
		const next = {
			...log,
			status: computeStatus(log)
		};
		const idx = db.daily_logs.findIndex((l) => l.id === next.id);
		if (idx === -1) db.daily_logs.push(next);
		else db.daily_logs[idx] = next;
		save(db);
		return next;
	},
	getWeeklyFocus() {
		return load().weekly_focus;
	},
	upsertWeeklyFocus(focus) {
		const db = load();
		const idx = db.weekly_focus.findIndex((f) => f.id === focus.id);
		if (idx === -1) db.weekly_focus.push(focus);
		else db.weekly_focus[idx] = focus;
		save(db);
		return focus;
	},
	removeWeeklyFocus(id) {
		const db = load();
		db.weekly_focus = db.weekly_focus.filter((f) => f.id !== id);
		save(db);
	},
	getCareerChapters() {
		return load().career_chapters;
	},
	upsertCareerChapter(chapter) {
		const db = load();
		const idx = db.career_chapters.findIndex((c) => c.id === chapter.id);
		if (idx === -1) db.career_chapters.push(chapter);
		else db.career_chapters[idx] = chapter;
		save(db);
		return chapter;
	},
	removeCareerChapter(id) {
		const db = load();
		db.career_chapters = db.career_chapters.filter((c) => c.id !== id);
		save(db);
	},
	getProjects() {
		return load().projects;
	},
	upsertProject(project) {
		const db = load();
		const idx = db.projects.findIndex((p) => p.name === project.name);
		if (idx === -1) db.projects.push(project);
		else db.projects[idx] = project;
		save(db);
		return project;
	},
	removeProject(name) {
		const db = load();
		db.projects = db.projects.filter((p) => p.name !== name);
		save(db);
	},
	getMilestones() {
		return load().milestones;
	},
	upsertMilestone(milestone) {
		const db = load();
		const idx = db.milestones.findIndex((m) => m.title === milestone.title);
		if (idx === -1) db.milestones.push(milestone);
		else db.milestones[idx] = milestone;
		save(db);
		return milestone;
	},
	getTimeCapsules() {
		const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		return load().time_capsules.map((c) => ({
			...c,
			content: c.unlock_at <= today ? c.content : ""
		}));
	},
	upsertTimeCapsule(capsule) {
		const db = load();
		const idx = db.time_capsules.findIndex((c) => c.id === capsule.id);
		if (idx === -1) db.time_capsules.push(capsule);
		else db.time_capsules[idx] = capsule;
		save(db);
		return capsule;
	},
	getPrologue() {
		return load().prologue;
	},
	setPrologue(text) {
		const db = load();
		db.prologue = text;
		save(db);
		return text;
	}
};
function profileRowToDomain(row) {
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
		cover_url: row.cover_url ?? null
	};
}
function toDisplayError(err) {
	return mapUnknownError(err);
}
async function getProfile() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("profiles").select("*").eq("id", SINGLETON_USER_ID).maybeSingle());
		if (error) throw error;
		if (data) return profileRowToDomain(data);
		const { data: created, error: insErr } = await db.from("profiles").upsert({
			id: SINGLETON_USER_ID,
			full_name: ""
		}, { onConflict: "id" }).select().single();
		if (insErr) throw insErr;
		return profileRowToDomain(created);
	} catch (e) {
		const err = mapUnknownError(e);
		if (err.code === "NOT_CONFIGURED" || err.code === "NETWORK" || err.code === "TIMEOUT") console.warn("[profileService] fallback local:", err.message);
		else throw toDisplayError(e);
	}
	return localRepository.getProfile();
}
async function updateProfile(patch) {
	const parsed = profilePatchSchema.safeParse(patch);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Dados inválidos");
	const normalized = {
		...parsed.data,
		...parsed.data.name !== void 0 ? { initials: initialsOf(parsed.data.name) } : {}
	};
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const row = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
		if (normalized.name !== void 0) row.full_name = sanitizeText(normalized.name, 120);
		if (normalized.role !== void 0) row.role = sanitizeText(normalized.role, 120);
		if (normalized.location !== void 0) row.location = sanitizeText(normalized.location, 120);
		if (normalized.bio !== void 0) row.bio = sanitizeText(normalized.bio, 600);
		if (normalized.birth_date !== void 0) row.birth_date = normalized.birth_date || null;
		if (normalized.target_lifespan !== void 0) row.target_lifespan = clampInt(normalized.target_lifespan, 40, 150);
		if (normalized.avatar_url !== void 0) row.avatar_url = normalized.avatar_url;
		if (normalized.cover_url !== void 0) row.cover_url = normalized.cover_url;
		const { error } = await db.from("profiles").update(row).eq("id", SINGLETON_USER_ID);
		if (error) throw error;
		const { data, error: selErr } = await db.from("profiles").select("*").eq("id", SINGLETON_USER_ID).single();
		if (selErr) throw selErr;
		return profileRowToDomain(data);
	} catch (e) {
		throw toDisplayError(e);
	}
	return localRepository.updateProfile(normalized);
}
function fromRemoteLog(row) {
	return {
		id: String(row.id),
		log_date: String(row.log_date).slice(0, 10),
		planned_text: String(row.planned_text ?? ""),
		executed_text: String(row.executed_text ?? ""),
		summary_text: String(row.summary_text ?? ""),
		status: row.status ?? "OPEN",
		locked_at: row.locked_at ?? null,
		created_at: String(row.created_at ?? (/* @__PURE__ */ new Date()).toISOString())
	};
}
async function getDailyLogs(opts) {
	const limit = opts?.limit != null ? clampInt(opts.limit, 1, 100) : 100;
	const offset = opts?.offset != null ? Math.max(0, opts.offset) : 0;
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("daily_logs").select("*").eq("user_id", SINGLETON_USER_ID).order("log_date", { ascending: false }).range(offset, offset + limit - 1));
		if (error) throw error;
		return (data ?? []).map(fromRemoteLog);
	} catch (e) {
		const mapped = mapUnknownError(e);
		if (mapped.code === "NETWORK" || mapped.code === "TIMEOUT" || mapped.code === "NOT_CONFIGURED") console.warn("[dailyLogs] fallback local:", mapped.message);
		else throw toDisplayError(e);
	}
	return localRepository.getDailyLogs().slice(offset, offset + limit);
}
async function upsertDailyLog(log) {
	const parsed = dailyLogSchema.safeParse(log);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Log inválido");
	const normalized = {
		...parsed.data,
		planned_text: sanitizeText(parsed.data.planned_text, 4e3),
		executed_text: sanitizeText(parsed.data.executed_text, 4e3),
		summary_text: sanitizeText(parsed.data.summary_text, 4e3),
		status: computeStatus(parsed.data)
	};
	if (isSupabaseConfigured) try {
		const { data, error } = await requireSupabase().from("daily_logs").upsert({
			id: normalized.id,
			user_id: SINGLETON_USER_ID,
			log_date: normalized.log_date,
			planned_text: normalized.planned_text,
			executed_text: normalized.executed_text,
			summary_text: normalized.summary_text,
			status: normalized.status,
			locked_at: normalized.locked_at,
			created_at: normalized.created_at
		}, { onConflict: "user_id,log_date" }).select().single();
		if (error) throw error;
		return fromRemoteLog(data);
	} catch (e) {
		throw toDisplayError(e);
	}
	return localRepository.upsertDailyLog(normalized);
}
function fromRemoteFocus(row) {
	return {
		id: String(row.id),
		title: String(row.title ?? ""),
		description: String(row.description ?? ""),
		week_number: Number(row.week_number ?? 0),
		year: Number(row.year ?? 0),
		progress_pct: Number(row.progress_pct ?? 0)
	};
}
async function getWeeklyFocus() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("weekly_focus").select("*").eq("user_id", SINGLETON_USER_ID).order("created_at", { ascending: true }));
		if (error) throw error;
		return (data ?? []).map(fromRemoteFocus);
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") console.warn("[weeklyFocus] fallback local:", m.message);
		else throw toDisplayError(e);
	}
	return localRepository.getWeeklyFocus();
}
async function createWeeklyFocus(input) {
	const parsed = weeklyFocusInputSchema.safeParse(input);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Foco inválido");
	const title = sanitizeText(parsed.data.title, 140);
	if (isSupabaseConfigured) try {
		const { error } = await requireSupabase().from("weekly_focus").insert({
			user_id: SINGLETON_USER_ID,
			title,
			description: sanitizeText(parsed.data.description, 600),
			week_number: parsed.data.week_number,
			year: parsed.data.year,
			progress_pct: 0
		});
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	localRepository.upsertWeeklyFocus({
		id: `wf-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
		title,
		description: sanitizeText(parsed.data.description, 600),
		week_number: parsed.data.week_number,
		year: parsed.data.year,
		progress_pct: 0
	});
}
async function updateWeeklyFocusProgress(id, progress_pct) {
	const clamped = clampInt(progress_pct, 0, 100);
	if (isSupabaseConfigured) try {
		const { error } = await requireSupabase().from("weekly_focus").update({ progress_pct: clamped }).eq("id", id);
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	const current = localRepository.getWeeklyFocus().find((f) => f.id === id);
	if (current) localRepository.upsertWeeklyFocus({
		...current,
		progress_pct: clamped
	});
}
function fromRemoteChapter(row) {
	return {
		id: String(row.id),
		title: String(row.title ?? ""),
		period: String(row.period ?? ""),
		document_type: String(row.document_type ?? "EXPERIENCE"),
		content: String(row.content ?? "")
	};
}
async function getCareerChapters() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("career_chapters").select("*").eq("user_id", SINGLETON_USER_ID).order("created_at", { ascending: true }));
		if (error) throw error;
		return (data ?? []).map(fromRemoteChapter);
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") console.warn("[careerChapters] fallback local:", m.message);
		else throw toDisplayError(e);
	}
	return localRepository.getCareerChapters();
}
async function createCareerChapter(input) {
	const parsed = careerChapterInputSchema.safeParse(input);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Capítulo inválido");
	if (isSupabaseConfigured) try {
		const { error } = await requireSupabase().from("career_chapters").insert({
			user_id: SINGLETON_USER_ID,
			title: sanitizeText(parsed.data.title, 140),
			period: sanitizeText(parsed.data.period, 80),
			document_type: parsed.data.document_type,
			content: sanitizeText(parsed.data.content, 6e3)
		});
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	localRepository.upsertCareerChapter({
		id: `ch-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
		title: sanitizeText(parsed.data.title, 140),
		period: sanitizeText(parsed.data.period, 80),
		document_type: parsed.data.document_type,
		content: sanitizeText(parsed.data.content, 6e3)
	});
}
async function getProjects() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("projects").select("*").eq("user_id", SINGLETON_USER_ID).order("created_at", { ascending: true }));
		if (error) throw error;
		return data ?? [];
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") console.warn("[projects] fallback local:", m.message);
		else throw toDisplayError(e);
	}
	return localRepository.getProjects();
}
async function upsertProject(project) {
	const parsed = projectSchema.safeParse(project);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Projeto inválido");
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const p = parsed.data;
		const { error } = await db.from("projects").upsert({
			user_id: SINGLETON_USER_ID,
			name: sanitizeText(p.name, 120),
			description: sanitizeText(p.description, 1200),
			status: p.status,
			progress: clampInt(p.progress, 0, 100),
			objective: sanitizeText(p.objective, 1200)
		}, { onConflict: "user_id,name" });
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	localRepository.upsertProject(parsed.data);
}
async function getMilestones() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("milestones").select("*").eq("user_id", SINGLETON_USER_ID).order("year", { ascending: false }));
		if (error) throw error;
		return data ?? [];
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") console.warn("[milestones] fallback local:", m.message);
		else throw toDisplayError(e);
	}
	return localRepository.getMilestones();
}
async function createMilestone(item) {
	const parsed = milestoneSchema.safeParse(item);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Marco inválido");
	if (isSupabaseConfigured) try {
		const { error } = await requireSupabase().from("milestones").insert({
			user_id: SINGLETON_USER_ID,
			year: sanitizeText(parsed.data.year, 20),
			title: sanitizeText(parsed.data.title, 140),
			description: sanitizeText(parsed.data.description, 1200),
			category: sanitizeText(parsed.data.category, 60)
		});
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	localRepository.upsertMilestone(parsed.data);
}
function fromRemoteCapsule(row) {
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const unlock = String(row.unlock_at).slice(0, 10);
	const opened = row.opened_at != null;
	const sealed = unlock > today && !opened;
	return {
		id: String(row.id),
		title: String(row.title ?? ""),
		content: sealed ? "" : String(row.content ?? ""),
		unlock_at: unlock,
		opened_at: row.opened_at ?? null,
		created_at: String(row.created_at ?? (/* @__PURE__ */ new Date()).toISOString())
	};
}
async function getTimeCapsules() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("time_capsules").select("*").eq("user_id", SINGLETON_USER_ID).order("unlock_at", { ascending: true }));
		if (error) throw error;
		return (data ?? []).map(fromRemoteCapsule);
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") console.warn("[timeCapsules] fallback local:", m.message);
		else throw toDisplayError(e);
	}
	return localRepository.getTimeCapsules();
}
async function createTimeCapsule(input) {
	const parsed = timeCapsuleSchema.safeParse(input);
	if (!parsed.success) throw new ApiError("VALIDATION", parsed.error.issues[0]?.message ?? "Cápsula inválida");
	if (isSupabaseConfigured) try {
		const { error } = await requireSupabase().from("time_capsules").insert({
			user_id: SINGLETON_USER_ID,
			title: sanitizeText(parsed.data.title, 140),
			content: sanitizeText(parsed.data.content, 8e3),
			unlock_at: parsed.data.unlock_at
		});
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	localRepository.upsertTimeCapsule({
		id: `caps-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
		title: sanitizeText(parsed.data.title, 140),
		content: sanitizeText(parsed.data.content, 8e3),
		unlock_at: parsed.data.unlock_at,
		opened_at: null,
		created_at: (/* @__PURE__ */ new Date()).toISOString()
	});
}
async function openTimeCapsule(id) {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error: selErr } = await db.from("time_capsules").select("unlock_at, opened_at").eq("id", id).maybeSingle();
		if (selErr) throw selErr;
		if (!data) throw new ApiError("NOT_FOUND", "Cápsula não encontrada.");
		if (data.opened_at) return;
		const unlock = String(data.unlock_at).slice(0, 10);
		if (unlock > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) throw new ApiError("LOCKED", `Esta cápsula só abre em ${unlock}. Ainda faltam dias.`);
		const { error } = await db.from("time_capsules").update({ opened_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
		if (error) throw error;
		return;
	} catch (e) {
		throw toDisplayError(e);
	}
	const current = localRepository.getTimeCapsules().find((c) => c.id === id);
	if (!current) throw new ApiError("NOT_FOUND", "Cápsula não encontrada.");
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	if (current.unlock_at > today) throw new ApiError("LOCKED", `Esta cápsula só abre em ${current.unlock_at}.`);
	localRepository.upsertTimeCapsule({
		...current,
		opened_at: (/* @__PURE__ */ new Date()).toISOString()
	});
}
async function getLifePrologue() {
	if (isSupabaseConfigured) try {
		const db = requireSupabase();
		const { data, error } = await withRetry(() => db.from("career_chapters").select("content").eq("user_id", SINGLETON_USER_ID).eq("document_type", "PROLOGUE").limit(1).maybeSingle());
		if (!error && data && typeof data.content === "string") return String(data.content);
		if (error) throw error;
	} catch (e) {
		const m = mapUnknownError(e);
		if (m.code === "NETWORK" || m.code === "TIMEOUT" || m.code === "NOT_CONFIGURED") {} else console.warn("[prologue] fallback local:", m.message);
	}
	return localRepository.getPrologue();
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
export { requireSupabase as C, upsertProject as D, upsertDailyLog as E, qk as S, updateWeeklyFocusProgress as T, getTimeCapsules as _, cn as a, mapUnknownError as b, createTimeCapsule as c, getCareerChapters as d, getDailyLogs as f, getProjects as g, getProfile as h, clearLocalDB as i, createWeeklyFocus as l, getMilestones as m, Button as n, createCareerChapter as o, getLifePrologue as p, checkSupabaseHealth as r, createMilestone as s, ApiError as t, exportLocalDB as u, getWeeklyFocus as v, updateProfile as w, openTimeCapsule as x, isSupabaseConfigured as y };
