import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as Button } from "./button-PJRo-bhb.mjs";
import { n as useUpsertDailyLog } from "./use-daily-logs-Bg1aw7Kp.mjs";
import { a as Textarea } from "./page-kit-BtGduzzZ.mjs";
import { C as LoaderCircle, K as Check, S as LockKeyhole, f as Sparkles, g as Pencil, z as CloudOff } from "../_libs/lucide-react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/daily-log-card-DqskypWE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Textarea inteligente:
* - Rascunho salvo automaticamente no localStorage por label (nunca se perde).
* - Contador de caracteres com limite visual.
* - ⌘Enter / Ctrl+Enter salva.
* - Estado visual de commit (salvando / salvo) sem bloquear a digitação.
*/
function SmartTextarea({ value, onChange, onCommit, placeholder, rows = 2, label, max = 4e3 }) {
	const draftKey = `perfil-vivo:draft:${label}`;
	const [state, setState] = (0, import_react.useState)("idle");
	const restoredRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (restoredRef.current) return;
		restoredRef.current = true;
		if (value.trim() === "") try {
			const draft = window.localStorage.getItem(draftKey);
			if (draft) onChange(draft);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => {
			try {
				if (value.trim() === "") window.localStorage.removeItem(draftKey);
				else window.localStorage.setItem(draftKey, value);
			} catch {}
		}, 300);
		return () => window.clearTimeout(id);
	}, [value, draftKey]);
	const commit = async () => {
		if (value.trim() === "") return;
		setState("saving");
		try {
			await onCommit();
			setState("saved");
			try {
				window.localStorage.removeItem(draftKey);
			} catch {}
			window.setTimeout(() => setState("idle"), 1800);
		} catch {
			setState("error");
			window.setTimeout(() => setState("idle"), 2600);
		}
	};
	const over = value.length > max;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "smart-field",
		"data-state": state,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "record-label",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "smart-state",
				"aria-live": "polite",
				children: [
					state === "saving" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3 animate-spin" }),
					state === "saving" && "salvando…",
					state === "saved" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }),
					state === "saved" && "salvo",
					state === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudOff, { className: "size-3" }),
					state === "error" && "falhou — tente de novo"
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "smart-shell",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				rows,
				className: "smart-textarea",
				value,
				placeholder,
				onChange: (e) => onChange(e.target.value),
				onKeyDown: (e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
						e.preventDefault();
						commit();
					}
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `smart-count ${over ? "smart-count-over" : ""}`,
				children: [
					value.length,
					"/",
					max
				]
			})]
		})]
	});
}
var statusMeta = {
	OPEN: {
		label: "Aberto",
		className: "status-open",
		editable: true
	},
	VALIDATING: {
		label: "Em validação",
		className: "status-review",
		editable: false
	},
	LOCKED: {
		label: "Travado",
		className: "status-archive",
		editable: false
	}
};
function formatDay(isoDate) {
	const d = /* @__PURE__ */ new Date(`${isoDate}T00:00:00`);
	const day = d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "short"
	}).replace(".", "").toUpperCase();
	const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
	return {
		day,
		weekday: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) === isoDate ? "Hoje" : weekday.charAt(0).toUpperCase() + weekday.slice(1)
	};
}
/** Um dia do livro de bordo: Planejado, Executado e Resumo — com trava de 24h. */
function DailyLogCard({ log }) {
	const upsert = useUpsertDailyLog();
	const meta = statusMeta[log.status];
	const { day, weekday } = formatDay(log.log_date);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)({
		planned_text: log.planned_text,
		executed_text: log.executed_text,
		summary_text: log.summary_text
	});
	const summaryWasEmpty = (0, import_react.useRef)(log.summary_text.trim() === "");
	const save = async () => {
		await upsert.mutateAsync({
			...log,
			...draft
		});
		setEditing(false);
		if (summaryWasEmpty.current && draft.summary_text.trim() !== "") {
			toast.success("+25 XP — a história de hoje foi registrada ✨", { icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-primary" }) });
			summaryWasEmpty.current = false;
		}
	};
	const lines = (text) => text.split("\n").filter(Boolean);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `day-record ${log.status === "LOCKED" ? "day-locked" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "day-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl font-semibold",
					children: day
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: weekday
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [meta.editable && !editing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						className: "h-7 gap-1.5 text-xs text-muted-foreground",
						onClick: () => setEditing(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3" }), " Registrar"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `status ${meta.className}`,
						children: [log.status === "LOCKED" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "size-3" }), meta.label]
					})]
				})]
			}),
			editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartTextarea, {
						label: "Planejado",
						value: draft.planned_text,
						onChange: (v) => setDraft({
							...draft,
							planned_text: v
						}),
						onCommit: save,
						placeholder: "Intenção do dia…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartTextarea, {
						label: "Executado",
						value: draft.executed_text,
						onChange: (v) => setDraft({
							...draft,
							executed_text: v
						}),
						onCommit: save,
						placeholder: "O que de fato aconteceu…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartTextarea, {
						label: "Resumo",
						value: draft.summary_text,
						onChange: (v) => setDraft({
							...draft,
							summary_text: v
						}),
						onCommit: save,
						placeholder: "Interpretação do dia…",
						rows: 3
					}),
					upsert.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive",
						children: upsert.error instanceof Error ? upsert.error.message : String(upsert.error)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => void save(),
								disabled: upsert.isPending,
								children: upsert.isPending ? "Salvando…" : "Salvar registro"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setEditing(false),
								children: "Cancelar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto self-center text-[10px] text-faint",
								children: "⌘Enter salva"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-faint",
						children: "Após salvar, este registro entra em validação e trava em 24h — vira história permanente."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "record-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block, {
						title: "Planejado",
						items: lines(log.planned_text),
						empty: "Nada planejado."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block, {
						title: "Executado",
						items: lines(log.executed_text),
						empty: "Ainda sem execução registrada."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "record-label",
						children: "Resumo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6 text-muted-foreground",
						children: log.summary_text || "—"
					})] })
				]
			}),
			log.status === "VALIDATING" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "validation-note",
				children: "Correções disponíveis até o fechamento das 24h"
			}),
			log.status === "LOCKED" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "archive-note",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {}), "Registro Histórico • somente leitura"]
			})
		]
	});
}
function Block({ title, items, empty }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "record-label",
		children: title
	}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-faint",
		children: empty
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: items.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex gap-2 text-sm leading-6 text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-1 size-3.5 shrink-0 text-accent-foreground" }), x]
		}, x))
	})] });
}
//#endregion
export { DailyLogCard as t };
