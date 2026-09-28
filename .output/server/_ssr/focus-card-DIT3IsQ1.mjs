import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as Button } from "./button-PJRo-bhb.mjs";
import { _ as PartyPopper, s as Target } from "../_libs/lucide-react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { n as Slider } from "./slider-BkYVZ81-.mjs";
import { c as useUpdateFocusProgress, u as useWeeklyFocus } from "./use-weekly-focus-DscBeEtA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/focus-card-DIT3IsQ1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ icon, title, description, actionLabel, onAction }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center",
		children: [
			icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 rounded-full bg-muted p-3 text-faint",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-sm font-semibold text-foreground",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground",
				children: description
			}),
			actionLabel && onAction && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "mt-5",
				onClick: onAction,
				children: actionLabel
			})
		]
	});
}
function FocusCardItem({ item }) {
	const update = useUpdateFocusProgress();
	const [value, setValue] = (0, import_react.useState)(item.progress_pct);
	const wasComplete = (0, import_react.useRef)(item.progress_pct === 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-semibold text-foreground",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: item.description
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-display text-lg font-semibold text-primary",
					children: [value, "%"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "focus-bar mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "focus-bar-fill",
					style: { width: `${value}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					value: [value],
					min: 0,
					max: 100,
					step: 5,
					onValueChange: (arr) => setValue(arr[0] ?? 0),
					onValueCommit: (arr) => {
						const next = arr[0] ?? 0;
						update.mutate({
							id: item.id,
							progress_pct: next
						}, { onSuccess: () => {
							if (next === 100 && !wasComplete.current) {
								toast.success(`Meta concluída: ${item.title} · +40 XP`, { icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyPopper, { className: "size-4 text-primary" }) });
								wasComplete.current = true;
							} else if (next < 100) wasComplete.current = false;
						} });
					}
				})
			})
		]
	});
}
/** Metas semanais com barra de progresso em % (editável inline). */
function FocusCard() {
	const { focus, isLoading } = useWeeklyFocus();
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-lg border border-border bg-card" });
	if (focus.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-dashed border-border p-6 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "mx-auto size-5 text-faint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted-foreground",
			children: "Sem metas para esta semana."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
		children: focus.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusCardItem, { item }, item.id))
	});
}
//#endregion
export { FocusCard as n, EmptyState as t };
