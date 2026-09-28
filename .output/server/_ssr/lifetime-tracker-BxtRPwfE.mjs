import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as Button } from "./button-PJRo-bhb.mjs";
import { S as LockKeyhole, f as Sparkles, p as Settings } from "../_libs/lucide-react.mjs";
import { t as useProfile } from "./use-profile-CwIeOr50.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lifetime-tracker-BxtRPwfE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CYCLE_NAMES = [
	"Aprendizado & Base",
	"Construção & Legado",
	"Consolidação & Mentoria",
	"Plenitude & Sabedoria"
];
function computeLifetime(birthDate, target, now = /* @__PURE__ */ new Date()) {
	const birth = /* @__PURE__ */ new Date(`${birthDate}T00:00:00`);
	if (!(birthDate !== "" && !Number.isNaN(birth.getTime()) && birth.getTime() <= now.getTime())) return {
		hasBirthDate: false,
		age: 0,
		ageDecimal: 0,
		target,
		cycleIndex: 0,
		cycleLabel: "—",
		cycleName: "Defina sua data",
		pctConsumed: 0,
		daysLived: 0,
		yearsRemaining: target,
		daysRemaining: Math.round(target * 365.2425),
		isRecordBreaker: false,
		isFinalCycle: false
	};
	const daysLived = Math.floor((now.getTime() - birth.getTime()) / 864e5);
	const ageDecimal = daysLived / 365.2425;
	const age = Math.floor(ageDecimal);
	const targetDays = Math.round(target * 365.2425);
	const pct = Math.min(100, daysLived / targetDays * 100);
	const cycleIndex = Math.min(Math.floor(age / 25), 3);
	return {
		hasBirthDate: true,
		age,
		ageDecimal,
		target,
		cycleIndex,
		cycleLabel: `${cycleIndex * 25}–${(cycleIndex + 1) * 25}`,
		cycleName: CYCLE_NAMES[cycleIndex] ?? "",
		pctConsumed: pct,
		daysLived,
		yearsRemaining: Math.max(0, target - ageDecimal),
		daysRemaining: Math.max(0, targetDays - daysLived),
		isRecordBreaker: age >= target,
		isFinalCycle: cycleIndex === 3
	};
}
/** Cronômetro vivo: recalcula a cada minuto (o tempo passa enquanto a página está aberta). */
function useLifetime() {
	const { profile } = useProfile();
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
		return () => window.clearInterval(id);
	}, []);
	return computeLifetime(profile?.birth_date ?? "", profile?.target_lifespan ?? 100, now);
}
var R = 54;
function arcPath(startDeg, endDeg) {
	const rad = (deg) => (deg - 90) * Math.PI / 180;
	const x = (deg) => 60 + R * Math.cos(rad(deg));
	const y = (deg) => 60 + R * Math.sin(rad(deg));
	const largeArc = endDeg - startDeg > 180 ? 1 : 0;
	return `M ${x(startDeg)} ${y(startDeg)} A ${R} ${R} 0 ${largeArc} 1 ${x(endDeg)} ${y(endDeg)}`;
}
function buildSlices(age) {
	const active = Math.min(Math.floor(age / 25), 3);
	const fracInCycle = Math.min(Math.max((age - active * 25) / 25, 0), 1);
	const cycleNames = [
		"Aprendizado & Base",
		"Construção & Legado",
		"Consolidação & Mentoria",
		"Plenitude & Sabedoria"
	];
	return [
		0,
		1,
		2,
		3
	].map((index) => ({
		index,
		range: `${index * 25}–${(index + 1) * 25}`,
		name: cycleNames[index] ?? "",
		state: index < active ? "past" : index === active ? "active" : "future",
		fillFrac: index === active ? fracInCycle : index < active ? 1 : 0
	}));
}
var GAP_DEG = 2.2;
function LifetimeTracker({ compact = false }) {
	const life = useLifetime();
	const slices = buildSlices(life.age);
	if (!life.hasBirthDate) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "life-panel gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-faint",
				children: "Memento Mori"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-sm font-medium text-foreground",
				children: "Defina o início da sua linha do tempo"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm leading-6 text-muted-foreground",
				children: [
					"Informe sua data de nascimento em",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/configuracoes",
						className: "font-semibold text-primary underline underline-offset-2",
						children: "Configurações"
					}),
					" ",
					"para ver o horizonte de ",
					life.target,
					" anos e o ciclo em que você está."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "w-fit",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/configuracoes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-3.5" }), " Preencher agora"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-4 gap-1.5 opacity-40",
				children: [
					"0–25",
					"25–50",
					"50–75",
					"75–100"
				].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "cycle-segment cycle-future",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r })
				}, r))
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "life-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-faint",
					children: "Memento Mori"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-sm font-medium text-foreground",
					children: life.isRecordBreaker ? "Além do horizonte" : `Ciclo ${life.cycleIndex + 1} · ${life.cycleName}`
				})] }), life.isRecordBreaker && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "status status-open",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3" }), "Recordista do Tempo"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center gap-5 ${compact ? "flex-col items-start" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "life-donut shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 120 120",
						width: "100%",
						height: "100%",
						role: "img",
						"aria-label": "Ciclos de vida em 4 blocos de 25 anos",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "60",
							cy: "60",
							r: R,
							fill: "none",
							stroke: "var(--muted)",
							strokeWidth: "9"
						}), slices.map((s) => {
							const start = s.index * 90 + GAP_DEG / 2;
							const end = (s.index + 1) * 90 - GAP_DEG / 2;
							const consumed = s.state === "past" ? end - start : s.state === "active" ? (end - start) * s.fillFrac : 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: arcPath(start, end),
								fill: "none",
								strokeWidth: s.state === "active" ? 9 : 8,
								strokeLinecap: "round",
								stroke: s.state === "past" ? "color-mix(in oklab, var(--primary) 30%, var(--muted))" : s.state === "active" ? "var(--primary)" : "transparent",
								className: s.state === "active" ? "life-donut-glow" : void 0,
								strokeDasharray: `${consumed} 360`
							}, s.index);
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "life-donut-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: life.age }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "anos" })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-xl font-semibold text-foreground",
							children: [life.pctConsumed.toFixed(1), "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"do horizonte de ",
								life.target,
								" anos consumido"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5 pt-1 text-xs text-faint",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "size-3" }),
								Math.floor(life.yearsRemaining),
								" anos ·",
								" ",
								Math.round(life.daysRemaining).toLocaleString("pt-BR"),
								" dias restantes"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-4 gap-1.5",
				children: slices.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					title: `${s.range} anos · ${s.name}`,
					className: `cycle-segment ${s.state === "past" ? "cycle-past" : s.state === "active" ? "cycle-active" : "cycle-future"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.range })
				}, s.index))
			})
		]
	});
}
//#endregion
export { LifetimeTracker as t };
