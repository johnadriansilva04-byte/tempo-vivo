import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { S as qk, n as Button, p as getLifePrologue } from "./button-PJRo-bhb.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as useDailyLogs } from "./use-daily-logs-Bg1aw7Kp.mjs";
import { n as PageHeader } from "./page-kit-BtGduzzZ.mjs";
import { G as ChevronDown, L as Download, P as FileText, W as ChevronRight } from "../_libs/lucide-react.mjs";
import { t as DailyLogCard } from "./daily-log-card-DqskypWE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agenda-CvCdiINl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function usePrologue() {
	const query = useQuery({
		queryKey: qk.prologue(),
		queryFn: getLifePrologue,
		staleTime: 6e4
	});
	return {
		prologue: query.data ?? "",
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function AgendaRoute() {
	const { logs, isLoading } = useDailyLogs();
	const { prologue, isLoading: prologueLoading } = usePrologue();
	const [view, setView] = (0, import_react.useState)("Dia");
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Livro de bordo",
			title: "Agenda",
			description: "Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "segmented",
				children: [
					"Dia",
					"Semana",
					"Mês",
					"Ano"
				].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: view === v ? "selected" : "",
					onClick: () => setView(v),
					children: v
				}, v))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "prologue",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "prologue-icon",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "status status-archive",
								children: "Início"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-faint",
								children: "Documento de origem • PDF vivo"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-xl font-semibold",
							children: "Relatório dos anos anteriores"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `prologue-text ${expanded ? "expanded" : ""}`,
							children: prologueLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: "Carregando…"
							}) : prologue.trim() === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: "Seu prólogo aparecerá aqui quando você o escrever."
							}) : prologue.split("\n").map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							className: "mt-3 -ml-3",
							onClick: () => setExpanded(!expanded),
							children: [expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {}), expanded ? "Recolher relatório" : "Ler relatório completo"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "icon",
					"aria-label": "Baixar relatório",
					title: "Baixar relatório",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "timeline-line",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Daqui em diante, cada dia constrói a história" })
		}),
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4",
			children: [
				0,
				1,
				2
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-lg border border-border bg-card" }, i))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-5",
			children: logs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DailyLogCard, { log }, log.id))
		})
	] });
}
//#endregion
export { AgendaRoute as component };
