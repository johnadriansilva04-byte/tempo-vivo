import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { S as qk, a as cn, n as Button, r as checkSupabaseHealth, y as isSupabaseConfigured } from "./button-PJRo-bhb.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as useQuery, r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { A as Gamepad2, H as CircleUserRound, M as Flame, N as Flag, R as Database, Y as BookOpen, Z as Activity, a as TriangleAlert, i as Trophy, j as FolderKanban, m as Search, n as X, p as Settings, q as CalendarDays, t as Zap, w as LayoutDashboard, y as Menu } from "../_libs/lucide-react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as useProfile } from "./use-profile-CwIeOr50.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useRouter, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useGamification } from "./use-gamification-DQhcp0YU.mjs";
import { t as _e } from "../_libs/cmdk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Csr4acml.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-C4gJO0J_.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
/**
* Chip compacto de progressão para a sidebar: nível + XP até o próximo
* + chama de streak. Clicável, leva ao Dashboard.
*/
function ProgressionChip() {
	const g = useGamification();
	if (g.totalXp === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: "/",
		className: "progression-chip",
		title: `Nível ${g.level} · ${g.levelTitle}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "chip-level",
			children: g.level
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center justify-between gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1 text-[10px] font-semibold text-primary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-2.5" }),
						g.xpIntoLevel,
						"/",
						g.xpForNextLevel,
						" XP"
					]
				}), g.streak > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "streak-num flex items-center gap-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-2.5" }), g.streak]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "xp-chip-bar mt-1 block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "xp-bar-fill",
					style: { width: `${g.levelProgressPct}%` }
				})
			})]
		})]
	});
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Command$1 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = _e.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "overflow-hidden p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command$1, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
var NAV = [
	{
		to: "/",
		label: "Dashboard",
		icon: LayoutDashboard,
		keywords: "início home resumo"
	},
	{
		to: "/agenda",
		label: "Agenda",
		icon: CalendarDays,
		keywords: "diário livro de bordo registro dia"
	},
	{
		to: "/curriculo",
		label: "Currículo",
		icon: BookOpen,
		keywords: "trajetória experiência formação"
	},
	{
		to: "/planejamento",
		label: "Planejamento",
		icon: Flag,
		keywords: "metas semana foco"
	},
	{
		to: "/realizacoes",
		label: "Realizações",
		icon: Trophy,
		keywords: "marcos conquistas troféu"
	},
	{
		to: "/projetos",
		label: "Projetos",
		icon: FolderKanban,
		keywords: "trabalho iniciativas"
	},
	{
		to: "/sobre",
		label: "Sobre",
		icon: CircleUserRound,
		keywords: "quem sou bio família"
	},
	{
		to: "/jogos",
		label: "Jogos",
		icon: Gamepad2,
		keywords: "exploração futuro"
	},
	{
		to: "/configuracoes",
		label: "Configurações",
		icon: Settings,
		keywords: "perfil ajustes nome foto banner"
	}
];
/** Paleta de comandos — ⌘K / Ctrl+K ou botão "Buscar…" (estilo Linear/Vercel). */
function CommandPalette({ open, onOpenChange }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const down = (e) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, onOpenChange]);
	const go = (to) => {
		onOpenChange(false);
		router.navigate({ to });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandDialog, {
		open,
		onOpenChange,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, { placeholder: "Navegar… (digite um destino ou ação)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: "Nenhum resultado." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Páginas",
				children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: `${item.label} ${item.keywords}`,
					onSelect: () => go(item.to),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), item.label]
				}, item.to))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
				heading: "Ações rápidas",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: "abrir registro de hoje hoje agenda novo",
					onSelect: () => go("/agenda"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4" }), "Abrir registro de hoje"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: "editar perfil configuracoes nome visual",
					onSelect: () => go("/configuracoes"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" }), "Editar meu perfil"]
				})]
			})
		] })]
	});
}
var links = [
	[
		"/",
		"Dashboard",
		LayoutDashboard
	],
	[
		"/agenda",
		"Agenda",
		CalendarDays
	],
	[
		"/curriculo",
		"Currículo",
		BookOpen
	],
	[
		"/planejamento",
		"Planejamento",
		Flag
	],
	[
		"/realizacoes",
		"Realizações",
		Trophy
	],
	[
		"/projetos",
		"Projetos",
		FolderKanban
	],
	[
		"/sobre",
		"Sobre",
		CircleUserRound
	],
	[
		"/jogos",
		"Jogos",
		Gamepad2
	],
	[
		"/configuracoes",
		"Configurações",
		Settings
	]
];
function SidebarNav({ children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [paletteOpen, setPaletteOpen] = (0, import_react.useState)(false);
	const { profile } = useProfile();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `sidebar ${open ? "sidebar-open" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-16 items-center justify-between border-b border-sidebar-border px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-2.5",
							onClick: () => setOpen(false),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "brand-mark",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-sm font-semibold text-sidebar-foreground",
								children: "Perfil Vivo"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "md:hidden",
							"aria-label": "Fechar menu",
							onClick: () => setOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 pt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setPaletteOpen(true),
							className: "palette-trigger w-full",
							"aria-label": "Abrir paleta de comandos",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3.5" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 text-left",
									children: "Buscar…"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
									className: "palette-kbd",
									children: "⌘K"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex-1 space-y-1 overflow-y-auto p-3",
						children: links.map(([to, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to,
							activeOptions: { exact: to === "/" },
							onClick: () => setOpen(false),
							className: "nav-item",
							activeProps: { className: "nav-item nav-item-active" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[17px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
						}, to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-sidebar-border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "avatar-small",
								children: profile?.initials ?? "··"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-xs font-semibold text-sidebar-foreground",
									children: profile?.name ?? "Carregando…"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Perfil privado"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressionChip, {})
						})]
					})
				]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 bg-overlay md:hidden",
				onClick: () => setOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "md:pl-56",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/90 px-4 backdrop-blur md:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Abrir menu",
						onClick: () => setOpen(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-3 text-sm font-semibold",
						children: "Perfil Vivo"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "page-enter mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-10 lg:px-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
						open: paletteOpen,
						onOpenChange: setPaletteOpen
					}), children]
				})]
			})
		]
	});
}
function useSupabaseHealth() {
	const query = useQuery({
		queryKey: qk.health(),
		queryFn: checkSupabaseHealth,
		staleTime: 6e4,
		refetchOnWindowFocus: true,
		retry: 1
	});
	return {
		health: query.data ?? "not-configured",
		isLoading: query.isLoading
	};
}
function SupabaseHealthBanner() {
	const { health } = useSupabaseHealth();
	if (isSupabaseConfigured && health === "ok") return null;
	if (!isSupabaseConfigured) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-amber-900 dark:text-amber-200",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Modo local" }),
				" — sem banco. Seus dados ficam no navegador. Configure",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "rounded bg-amber-500/20 px-1",
					children: "VITE_SUPABASE_URL"
				}),
				" e",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "rounded bg-amber-500/20 px-1",
					children: "VITE_SUPABASE_ANON_KEY"
				}),
				" para persistir no Supabase.",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/configuracoes",
					className: "underline underline-offset-2",
					children: "Ver instruções"
				}),
				"."
			]
		})]
	});
	if (health === "offline") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs leading-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-3.5 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-destructive",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sem conexão com o banco." }), " Você está no modo local até a conexão voltar."]
		})]
	});
	return null;
}
/**
* Observa a progressão e comemora uma única vez:
* - Conquista desbloqueada → toast com nome/descrição.
* - Subida de nível → toast especial.
* Estado persistido em localStorage para não repetir celebrações.
* Primeira execução adota o estado atual silenciosamente (sem spam).
*/
var KEY = "perfil-vivo:progression:v1";
function loadStored() {
	if (typeof window === "undefined") return {
		achievements: [],
		level: 0
	};
	try {
		const raw = window.localStorage.getItem(KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
				level: typeof parsed.level === "number" ? parsed.level : 0
			};
		}
	} catch {}
	return {
		achievements: [],
		level: 0
	};
}
function saveStored(s) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify(s));
	} catch {}
}
function useProgressionWatcher() {
	const g = useGamification();
	const storedRef = (0, import_react.useRef)(null);
	if (storedRef.current === null) storedRef.current = loadStored();
	(0, import_react.useEffect)(() => {
		const stored = storedRef.current;
		if (!stored) return;
		if (stored.achievements.length === 0 && stored.level === 0) {
			stored.achievements = g.achievements.filter((a) => a.unlocked).map((a) => a.id);
			stored.level = g.level;
			saveStored(stored);
			storedRef.current = stored;
			return;
		}
		if (g.level > stored.level) {
			toast.success(`Nível ${g.level} — ${g.levelTitle}`, {
				description: `Você acumulou ${g.totalXp} XP na sua história.`,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-4 text-primary" }),
				duration: 6e3
			});
			stored.level = g.level;
			saveStored(stored);
			storedRef.current = stored;
		} else if (g.level < stored.level) {
			stored.level = g.level;
			saveStored(stored);
			storedRef.current = stored;
		}
		const unlocked = g.achievements.filter((a) => a.unlocked).map((a) => a.id);
		const fresh = unlocked.filter((id) => !stored.achievements.includes(id));
		if (fresh.length > 0) {
			for (const id of fresh) {
				const a = g.achievements.find((x) => x.id === id);
				if (a) toast.success(`Conquista desbloqueada: ${a.label}`, {
					description: a.description,
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4 text-primary" }),
					duration: 6e3
				});
			}
			stored.achievements = unlocked;
			saveStored(stored);
			storedRef.current = stored;
		}
	}, [g]);
}
function AppShell({ children }) {
	useProgressionWatcher();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarNav, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupabaseHealthBanner, {}), children] });
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$9 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "author",
				content: "Perfil Vivo"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Manrope:wght@500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$9.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) })
	});
}
var $$splitComponentImporter$8 = () => import("./routes-B3G6gtfo.mjs");
var Route$8 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Dashboard — Perfil Vivo" },
		{
			name: "description",
			content: "Visão geral da sua trajetória viva."
		},
		{
			property: "og:title",
			content: "Dashboard — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Objetivos, memórias, projetos e ciclos de uma trajetória viva."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./agenda-CvCdiINl.mjs");
var Route$7 = createFileRoute("/agenda")({
	head: () => ({ meta: [
		{ title: "Agenda — Perfil Vivo" },
		{
			name: "description",
			content: "Livro de bordo cronológico com registros planejados, executados e resumos."
		},
		{
			property: "og:title",
			content: "Agenda — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Uma memória cronológica confiável da vida real."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./configuracoes-isItVW7P.mjs");
var Route$6 = createFileRoute("/configuracoes")({
	head: () => ({ meta: [
		{ title: "Configurações — Perfil Vivo" },
		{
			name: "description",
			content: "Edite seu perfil: nome, cargo, dados de tempo de vida e visual."
		},
		{
			property: "og:title",
			content: "Configurações — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Configure o seu perfil vivo — de demonstração para seu perfil real."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./curriculo-D5QZaMkv.mjs");
var Route$5 = createFileRoute("/curriculo")({
	head: () => ({ meta: [
		{ title: "Currículo — Perfil Vivo" },
		{
			name: "description",
			content: "Formação, experiências e produções da sua trajetória."
		},
		{
			property: "og:title",
			content: "Currículo — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Uma trajetória profissional humana e compartilhável."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./jogos-Dk9rI9Qu.mjs");
var Route$4 = createFileRoute("/jogos")({
	head: () => ({ meta: [
		{ title: "Jogos — Perfil Vivo" },
		{
			name: "description",
			content: "Experiências futuras para explorar memória e autoconhecimento."
		},
		{
			property: "og:title",
			content: "Jogos — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Novas formas de explorar uma trajetória viva."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./planejamento-XFhg68lD.mjs");
var Route$3 = createFileRoute("/planejamento")({
	head: () => ({ meta: [
		{ title: "Planejamento — Perfil Vivo" },
		{
			name: "description",
			content: "Objetivos, metas e progresso da sua trajetória."
		},
		{
			property: "og:title",
			content: "Planejamento — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Planos conectados às ações e ao futuro."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./projetos-UScUbGEN.mjs");
var Route$2 = createFileRoute("/projetos")({
	head: () => ({ meta: [
		{ title: "Projetos — Perfil Vivo" },
		{
			name: "description",
			content: "Projetos ativos, objetivos e histórico da sua trajetória."
		},
		{
			property: "og:title",
			content: "Projetos — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Iniciativas que conectam curiosidade, propósito e impacto."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./realizacoes-Bi4KCh6a.mjs");
var Route$1 = createFileRoute("/realizacoes")({
	head: () => ({ meta: [
		{ title: "Realizações — Perfil Vivo" },
		{
			name: "description",
			content: "Linha do tempo de marcos importantes da sua vida."
		},
		{
			property: "og:title",
			content: "Realizações — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "Marcos preservados ao longo de uma trajetória viva."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./sobre-Bm8LrV4I.mjs");
var Route = createFileRoute("/sobre")({
	head: () => ({ meta: [
		{ title: "Sobre — Perfil Vivo" },
		{
			name: "description",
			content: "Biografia, objetivos e núcleo familiar da sua trajetória."
		},
		{
			property: "og:title",
			content: "Sobre — Perfil Vivo"
		},
		{
			property: "og:description",
			content: "A pessoa, sua história e seus vínculos essenciais."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AgendaRoute: Route$7.update({
		id: "/agenda",
		path: "/agenda",
		getParentRoute: () => Route$9
	}),
	ConfiguracoesRoute: Route$6.update({
		id: "/configuracoes",
		path: "/configuracoes",
		getParentRoute: () => Route$9
	}),
	CurriculoRoute: Route$5.update({
		id: "/curriculo",
		path: "/curriculo",
		getParentRoute: () => Route$9
	}),
	JogosRoute: Route$4.update({
		id: "/jogos",
		path: "/jogos",
		getParentRoute: () => Route$9
	}),
	PlanejamentoRoute: Route$3.update({
		id: "/planejamento",
		path: "/planejamento",
		getParentRoute: () => Route$9
	}),
	ProjetosRoute: Route$2.update({
		id: "/projetos",
		path: "/projetos",
		getParentRoute: () => Route$9
	}),
	RealizacoesRoute: Route$1.update({
		id: "/realizacoes",
		path: "/realizacoes",
		getParentRoute: () => Route$9
	}),
	SobreRoute: Route.update({
		id: "/sobre",
		path: "/sobre",
		getParentRoute: () => Route$9
	})
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
