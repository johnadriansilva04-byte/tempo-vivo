import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime, n as CollapsibleTrigger$1, r as Root, t as CollapsibleContent$1 } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as cn, n as Button } from "./button-PJRo-bhb.mjs";
import { t as useDailyLogs } from "./use-daily-logs-Bg1aw7Kp.mjs";
import { i as Section, t as Metric } from "./page-kit-BtGduzzZ.mjs";
import { B as Clock3, E as ImagePlus, G as ChevronDown, M as Flame, T as Inbox, U as CircleCheck, V as Circle, X as ArrowRight, Y as BookOpen, Z as Activity, b as MapPin, c as Sunset, d as Star, f as Sparkles, g as Pencil, i as Trophy, j as FolderKanban, l as Sunrise, n as X, s as Target, t as Zap, u as Sun, v as Moon, x as Lock } from "../_libs/lucide-react.mjs";
import { t as DailyLogCard } from "./daily-log-card-DqskypWE.mjs";
import { n as useUpdateProfile, t as useProfile } from "./use-profile-CwIeOr50.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as LifetimeTracker } from "./lifetime-tracker-BxtRPwfE.mjs";
import { t as Input } from "./slider-BkYVZ81-.mjs";
import { i as useMilestones, o as useProjects } from "./use-weekly-focus-DscBeEtA.mjs";
import { n as FocusCard, t as EmptyState } from "./focus-card-DIT3IsQ1.mjs";
import { t as useGamification } from "./use-gamification-DQhcp0YU.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { i as Trigger$1, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B3G6gtfo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function levelFor(summaryLen, executedLen) {
	if (summaryLen > 0 && executedLen > 0) return 4;
	if (summaryLen > 0 || executedLen > 0) return 2;
	return 1;
}
/**
* Heatmap de consistência: últimas 20 semanas (140 dias), estilo GitHub.
* Nível derivado do que foi realmente registrado no dia.
*/
function useConsistency(weeks = 20) {
	const { logs } = useDailyLogs();
	return (0, import_react.useMemo)(() => {
		const byDate = new Map(logs.map((l) => [l.log_date, l]));
		const msDay = 864e5;
		const today = /* @__PURE__ */ new Date(`${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}T00:00:00`);
		const grid = [];
		let activeDays = 0;
		const totalDays = weeks * 7;
		const start = /* @__PURE__ */ new Date(today.getTime() - (totalDays - 1) * msDay);
		start.setDate(start.getDate() - start.getDay());
		for (let w = 0; w < weeks; w++) {
			const col = [];
			for (let d = 0; d < 7; d++) {
				const iso = new Date(start.getTime() + (w * 7 + d) * msDay).toISOString().slice(0, 10);
				const log = byDate.get(iso);
				if (log) {
					const lvl = levelFor(log.summary_text.trim().length, log.executed_text.trim().length);
					if (lvl >= 1) activeDays += 1;
					col.push({
						date: iso,
						level: lvl
					});
				} else col.push({
					date: iso,
					level: 0
				});
			}
			grid.push(col);
		}
		return {
			grid,
			activeDays
		};
	}, [logs, weeks]);
}
var TooltipProvider = Provider;
var Tooltip = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
var MONTHS = [
	"jan",
	"fev",
	"mar",
	"abr",
	"mai",
	"jun",
	"jul",
	"ago",
	"set",
	"out",
	"nov",
	"dez"
];
/** Heatmap de consistência (20 semanas) — cada célula é um dia registrado. */
function ConsistencyHeatmap() {
	const { grid, activeDays } = useConsistency(20);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-3.5" }), "Consistência"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					className: "text-primary",
					children: activeDays
				}), " dias ativos · 20 semanas"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
			delayDuration: 120,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "heatmap-scroll flex gap-[3px]",
				children: grid.map((week, wi) => {
					const firstOfMonth = week.find((c) => (/* @__PURE__ */ new Date(`${c.date}T00:00:00`)).getDate() === 1);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-[3px]",
						children: [wi === 0 || firstOfMonth ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "heatmap-month",
							children: firstOfMonth ? MONTHS[(/* @__PURE__ */ new Date(`${firstOfMonth.date}T00:00:00`)).getMonth()] : ""
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-month" }), week.map((cell) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `heatmap-cell ${cell.level > 0 ? `heatmap-l${cell.level}` : ""}` })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, {
							side: "top",
							className: "px-2 py-1 text-[10px]",
							children: [
								cell.level === 0 ? "sem registro" : `nível ${cell.level}`,
								" · ",
								cell.date
							]
						})] }, cell.date))]
					}, wi);
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex items-center justify-end gap-1 text-[10px] text-faint",
			children: [
				"menos",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-cell" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-cell heatmap-l1" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-cell heatmap-l2" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-cell heatmap-l3" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "heatmap-cell heatmap-l4" }),
				"mais"
			]
		})
	] });
}
function moment(date) {
	const h = date.getHours();
	if (h < 5) return {
		label: "Boa madrugada",
		Icon: Moon
	};
	if (h < 12) return {
		label: "Bom dia",
		Icon: Sunrise
	};
	if (h < 18) return {
		label: "Boa tarde",
		Icon: Sun
	};
	return {
		label: "Boa noite",
		Icon: Sunset
	};
}
/** Saudação contextual: momento do dia + nome real + streak vivo. */
function DayGreeting() {
	const { profile } = useProfile();
	const g = useGamification();
	const now = /* @__PURE__ */ new Date();
	const { label, Icon } = moment(now);
	const firstName = profile?.name.trim() ? profile.name.trim().split(/\s+/)[0] : null;
	const date = now.toLocaleDateString("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex flex-wrap items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "greeting-icon",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-display text-xl font-semibold text-foreground",
				children: [
					label,
					firstName ? `, ${firstName}` : "",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: "."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs capitalize text-muted-foreground",
				children: [date, g.streak > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-primary",
					children: [g.streak, " dias seguidos"]
				})] })]
			})]
		})]
	});
}
var ICONS = {
	flame: Flame,
	trophy: Trophy,
	target: Target,
	book: BookOpen,
	star: Star,
	lock: Lock
};
function Badge({ a }) {
	const Icon = ICONS[a.icon] ?? Star;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "badge-tile",
		"data-locked": a.unlocked ? "false" : "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "badge-icon",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "badge-label block truncate",
				children: a.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "badge-desc block truncate",
				children: a.description
			})]
		})]
	});
}
/** Painel de progressão: nível, XP, streak e conquistas — tudo derivado de dados reais. */
function GamificationPanel() {
	const g = useGamification();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "gamification-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "level-ring",
					children: g.level
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-display text-sm font-semibold text-foreground",
								children: g.levelTitle
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-xs font-semibold text-primary",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3" }),
									g.totalXp,
									" XP"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "xp-bar mt-2.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "xp-bar-fill",
								style: { width: `${g.levelProgressPct}%` },
								role: "progressbar",
								"aria-valuenow": g.levelProgressPct,
								"aria-valuemin": 0,
								"aria-valuemax": 100
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1.5 text-[11px] text-faint",
							children: [
								g.xpIntoLevel,
								"/",
								g.xpForNextLevel,
								" XP para o nível ",
								g.level + 1
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-3 border-t border-border pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `streak-flame ${g.streak > 0 ? "streak-active" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: g.streak > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "streak-num",
								children: g.streak
							}),
							g.streak === 1 ? " dia seguido" : " dias seguidos",
							" de registro"
						] }) : "Registre hoje para acender o fogo"
					}),
					g.bestStreak > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-auto text-[11px] text-faint",
						children: ["Recorde: ", g.bestStreak]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 border-t border-border pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.12em] text-faint",
						children: "Conquistas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[11px] font-semibold text-primary",
						children: [
							g.unlockedCount,
							"/",
							g.achievements.length
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2 sm:grid-cols-2",
					children: g.achievements.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { a }, a.id))
				})]
			})
		]
	});
}
/**
* Medidor "Perfil completo": mostra o quanto o dono já preencheu
* e o que falta — puxa para concluir o cadastro de forma não intrusiva.
*/
var CHECKS = [
	{
		id: "name",
		label: "Nome",
		test: (p) => p.name.trim() !== ""
	},
	{
		id: "role",
		label: "Ocupação",
		test: (p) => p.role.trim() !== ""
	},
	{
		id: "bio",
		label: "Bio",
		test: (p) => p.bio.trim() !== ""
	},
	{
		id: "birth",
		label: "Nascimento",
		test: (p) => p.birth_date !== ""
	},
	{
		id: "avatar",
		label: "Foto",
		test: (p) => !!p.avatar_url
	},
	{
		id: "cover",
		label: "Banner",
		test: (p) => !!p.cover_url
	}
];
function ProfileCompleteness() {
	const { profile } = useProfile();
	if (!profile) return null;
	const done = CHECKS.filter((c) => c.test(profile));
	const pct = Math.round(done.length / CHECKS.length * 100);
	const missing = CHECKS.filter((c) => !c.test(profile));
	if (pct === 100) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.12em] text-faint",
					children: "Perfil completo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-display text-sm font-bold text-foreground",
					children: [pct, "%"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "focus-bar mt-2.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "profile-meter-fill",
					style: { width: `${pct}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-wrap gap-x-3 gap-y-1.5",
				children: CHECKS.map((c) => {
					const ok = c.test(profile);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: `flex items-center gap-1 text-[11px] ${ok ? "text-muted-foreground" : "text-faint"}`,
						children: [ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-3" }), c.label]
					}, c.id);
				})
			}),
			missing.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/configuracoes",
				className: "mt-3 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline",
				children: "Completar em Configurações →"
			})
		]
	});
}
/** Cabeçalho do perfil: avatar, nome, cargo, banner personalizável e o donut de finitude. */
function ProfileHeader() {
	const { profile } = useProfile();
	const updateProfile = useUpdateProfile();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [bannerUrlOpen, setBannerUrlOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)({
		name: "",
		role: "",
		location: ""
	});
	const fileRef = (0, import_react.useRef)(null);
	const isBlank = profile?.name.trim() === "" || (profile?.name ?? "") === "";
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-44 animate-pulse rounded-lg border border-border bg-card" });
	const startEdit = () => {
		setDraft({
			name: profile.name,
			role: profile.role,
			location: profile.location
		});
		setEditing(true);
	};
	const saveEdit = () => {
		updateProfile.mutate(draft);
		setEditing(false);
	};
	const setBanner = (url) => updateProfile.mutate({ cover_url: url });
	const onPickFile = (file) => {
		const reader = new FileReader();
		reader.onload = () => setBanner(String(reader.result));
		reader.readAsDataURL(file);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "profile-header",
		children: [
			profile.cover_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "profile-banner",
				style: { backgroundImage: `url(${profile.cover_url})` }
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "profile-banner-default" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "profile-banner-toggle",
				"aria-label": "Personalizar banner",
				onClick: () => {
					if (profile.cover_url) {
						setBanner(null);
						setBannerUrlOpen(false);
					} else setBannerUrlOpen((v) => !v);
				},
				children: profile.cover_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-3.5" })
			}),
			bannerUrlOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 top-12 z-30 w-72 rounded-lg border border-border bg-popover p-3 shadow-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-foreground",
						children: "Paisagem de fundo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] text-faint",
						children: "Cole a URL de uma imagem ou envie um arquivo."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						autoFocus: true,
						placeholder: "https://…",
						className: "mt-2 h-8 text-xs",
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								const value = e.target.value.trim();
								setBanner(value || null);
								setBannerUrlOpen(false);
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							className: "h-7 flex-1 text-xs",
							onClick: () => fileRef.current?.click(),
							children: "Enviar"
						}), profile.cover_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							className: "h-7 flex-1 text-xs",
							onClick: () => {
								setBanner(null);
								setBannerUrlOpen(false);
							},
							children: "Remover"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/*",
						className: "hidden",
						onChange: (e) => {
							const file = e.target.files?.[0];
							if (file) onPickFile(file);
							setBannerUrlOpen(false);
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "profile-header-body",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "avatar-main",
						children: profile.initials
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0",
						children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.name,
									onChange: (e) => setDraft({
										...draft,
										name: e.target.value
									}),
									className: "h-8 text-sm",
									placeholder: "Nome"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.role,
									onChange: (e) => setDraft({
										...draft,
										role: e.target.value
									}),
									className: "h-8 text-sm",
									placeholder: "Cargo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.location,
									onChange: (e) => setDraft({
										...draft,
										location: e.target.value
									}),
									className: "h-8 text-sm",
									placeholder: "Localização"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										className: "h-7 text-xs",
										onClick: saveEdit,
										disabled: updateProfile.isPending,
										children: "Salvar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										className: "h-7 text-xs",
										onClick: () => setEditing(false),
										children: "Cancelar"
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group/header",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mb-1 flex items-center gap-1.5 text-xs font-medium text-accent-foreground",
									children: ["Trajetória viva", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "Editar perfil",
										className: "opacity-0 transition-opacity group-hover/header:opacity-60 hover:!opacity-100",
										onClick: startEdit,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-3xl font-semibold text-foreground",
									children: isBlank ? "Seu nome" : profile.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: isBlank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/configuracoes",
										className: "underline decoration-dotted underline-offset-4",
										children: "Preencha seu perfil em Configurações →"
									}) : profile.role
								}),
								!isBlank && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 flex items-center gap-1.5 text-xs text-faint",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), profile.location]
								})
							]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifetimeTracker, {})]
			})
		]
	});
}
var Collapsible = Root;
var CollapsibleTrigger = CollapsibleTrigger$1;
var CollapsibleContent = CollapsibleContent$1;
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger$1, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger$1.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function DashboardPage() {
	const { logs } = useDailyLogs();
	const { projects } = useProjects();
	const { milestones } = useMilestones();
	const latest = milestones[0];
	const [showAllLogs, setShowAllLogs] = (0, import_react.useState)(false);
	const openLogs = logs.filter((l) => l.status !== "LOCKED");
	const visibleLogs = (showAllLogs ? logs : openLogs.slice(0, 2)).slice(0, 4);
	const daysWithSummary = logs.filter((l) => l.summary_text.trim() !== "").length;
	const summaryPct = logs.length === 0 ? 0 : Math.round(daysWithSummary / logs.length * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileHeader, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayGreeting, {})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 lg:grid-cols-[1.45fr_0.85fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-9",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "agora",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "bg-muted/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "agora",
									children: "Agora"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "agenda",
									children: "Agenda"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "metas",
									children: "Metas da semana"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "agora",
							className: "mt-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
								title: "Agora",
								detail: "O que está recebendo sua energia",
								children: projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderKanban, { className: "size-5" }),
									title: "Nenhum projeto ainda",
									description: "Crie seu primeiro projeto em Projetos e acompanhe o avanço aqui.",
									actionLabel: "Ir para Projetos",
									onAction: () => window.location.href = "/projetos"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-3 sm:grid-cols-2",
									children: projects.slice(0, 2).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/projetos",
										className: "card-interactive",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "status status-neutral",
													children: p.status
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-faint" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "mt-5 font-display text-base font-semibold",
												children: p.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-sm leading-6 text-muted-foreground",
												children: p.description
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-5 h-1.5 overflow-hidden rounded-full bg-muted",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full rounded-full bg-primary transition-all",
													style: { width: `${p.progress}%` }
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-2 text-xs text-faint",
												children: [p.progress, "% concluído"]
											})
										]
									}, p.name))
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "agenda",
							className: "mt-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
								title: "Próximos registros",
								detail: "Livro de bordo — dias vivos",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [visibleLogs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { className: "size-5" }),
										title: "Nenhum registro vivo",
										description: "O dia de hoje é o próximo. Abra o registro e descreva sua intenção.",
										actionLabel: "Abrir Agenda",
										onAction: () => window.location.href = "/agenda"
									}), visibleLogs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DailyLogCard, { log }, log.id))]
								}), !showAllLogs && logs.length > visibleLogs.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									size: "sm",
									className: "mt-4 -ml-3 text-xs text-muted-foreground",
									onClick: () => setShowAllLogs(true),
									children: ["Ver histórico completo ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5" })]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "metas",
							className: "mt-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
								title: "Metas da semana",
								detail: "Progresso comprometido, não desejado",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusCard, {})
							})
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-9",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GamificationPanel, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileCompleteness, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg border border-border bg-card p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsistencyHeatmap, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Em números",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-x-4 gap-y-7 border-y border-border py-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									value: String(logs.length),
									label: "Dias registrados"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									value: String(milestones.length),
									label: "Marcos preservados"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									value: String(projects.filter((p) => p.status === "Concluído").length),
									label: "Projetos concluídos"
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, { ...logs.length === 0 ? {
									detail: "sem dados",
									value: `${summaryPct}%`,
									label: "Dias com resumo"
								} : {
									value: `${summaryPct}%`,
									label: "Dias com resumo"
								} })
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Collapsible, {
						defaultOpen: true,
						className: "group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
							title: "Última realização",
							className: "",
							children: [
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										className: "-ml-3 gap-1 text-xs text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5 transition-transform duration-200 group-data-[state=closed]:-rotate-90" }), "Detalhes"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleContent, { children: latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "quiet-panel",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs font-medium text-accent-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), latest.category]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mt-4 font-display text-lg font-semibold",
											children: latest.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm leading-6 text-muted-foreground",
											children: latest.description
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-5 flex items-center gap-2 text-xs text-faint",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }),
												"Preservado em ",
												latest.year
											]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5" }),
									title: "Nenhum marco ainda",
									description: "Seu primeiro marco vai brilhar aqui. Registre uma realização em Realizações."
								}) })
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs text-faint",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cada registro fortalece a sua história." })]
					})
				]
			})]
		})
	] });
}
function Index() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardPage, {});
}
//#endregion
export { Index as component };
