import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { S as qk, d as getCareerChapters, n as Button, o as createCareerChapter } from "./button-PJRo-bhb.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as Textarea, i as Section, n as PageHeader, r as ProgressBar } from "./page-kit-BtGduzzZ.mjs";
import { D as Hourglass, I as Earth, J as BriefcaseBusiness, O as Heart, P as FileText, S as LockKeyhole, b as MapPin, f as Sparkles, i as Trophy, j as FolderKanban, k as GraduationCap } from "../_libs/lucide-react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as useProfile } from "./use-profile-CwIeOr50.mjs";
import { t as Input } from "./slider-BkYVZ81-.mjs";
import { t as Label } from "./label-CwsRTGFa.mjs";
import { a as useOpenCapsule, i as useMilestones, l as useUpsertProject, n as useCreateFocus, o as useProjects, r as useCreateMilestone, s as useTimeCapsules, t as useCreateCapsule } from "./use-weekly-focus-DscBeEtA.mjs";
import { n as FocusCard, t as EmptyState } from "./focus-card-DIT3IsQ1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pages-CNBNdNcK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useCareerChapters() {
	const query = useQuery({
		queryKey: qk.careerChapters(),
		queryFn: getCareerChapters,
		staleTime: 6e4
	});
	return {
		chapters: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useCreateCareerChapter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input) => createCareerChapter(input),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.careerChapters() })
	});
}
function ResumePage() {
	const { chapters, isLoading } = useCareerChapters();
	const create = useCreateCareerChapter();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)({
		title: "",
		period: "",
		document_type: "EXPERIENCE",
		content: ""
	});
	const byType = (t) => chapters.filter((c) => c.document_type === t);
	const experiences = byType("EXPERIENCE");
	const education = byType("EDUCATION");
	const submit = () => {
		if (!draft.title.trim()) return;
		create.mutate(draft, { onSuccess: () => {
			setDraft({
				title: "",
				period: "",
				document_type: "EXPERIENCE",
				content: ""
			});
			setOpen(false);
		} });
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-lg border border-border bg-card" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Trajetória profissional",
			title: "Currículo vivo",
			description: "Formação e experiências apresentadas como partes de uma história humana, prontas para compartilhar.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => setOpen((v) => !v),
				children: open ? "Fechar" : "Adicionar capítulo"
			})
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-lg border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Título",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.title,
							onChange: (e) => setDraft({
								...draft,
								title: e.target.value
							}),
							placeholder: "Cargo, formação ou produção"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Período",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.period,
							onChange: (e) => setDraft({
								...draft,
								period: e.target.value
							}),
							placeholder: "Ex.: 2022 — hoje"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Tipo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
							value: draft.document_type,
							onChange: (e) => setDraft({
								...draft,
								document_type: e.target.value
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "EXPERIENCE",
									children: "Experiência"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "EDUCATION",
									children: "Formação"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "PRODUCTION",
									children: "Produção"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "CERTIFICATE",
									children: "Certificado"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Conteúdo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: draft.content,
								onChange: (e) => setDraft({
									...draft,
									content: e.target.value
								}),
								placeholder: "Breve descrição",
								rows: 2
							})
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "mt-3",
				onClick: submit,
				disabled: !draft.title.trim() || create.isPending,
				children: "Salvar capítulo"
			})]
		}),
		chapters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, { className: "size-5" }),
			title: "Seu currículo vivo está vazio",
			description: "Adicione experiências, formações e produções acima. Tudo fica salvo e aparece aqui — nada é inventado."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-9 lg:grid-cols-[1fr_280px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-9",
				children: [experiences.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineSection, {
					icon: BriefcaseBusiness,
					title: "Experiência",
					rows: experiences.map((c) => [
						c.period,
						c.title,
						c.content
					])
				}), education.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineSection, {
					icon: GraduationCap,
					title: "Formação",
					rows: education.map((c) => [
						c.period,
						c.title,
						c.content
					])
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "space-y-7",
				children: experiences.length === 0 && education.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Preencha seu histórico para montar sua página."
				})
			})]
		})
	] });
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-xs font-semibold uppercase tracking-wide text-faint",
			children: label
		}), children]
	});
}
function PlanningPage() {
	const [input, setInput] = (0, import_react.useState)({
		title: "",
		description: ""
	});
	const create = useCreateFocus();
	const submit = () => {
		if (!input.title.trim()) return;
		const now = /* @__PURE__ */ new Date();
		const start = new Date(now.getFullYear(), 0, 1);
		const week = Math.ceil((Math.floor((now.getTime() - start.getTime()) / 864e5) + start.getDay() + 1) / 7);
		create.mutate({
			title: input.title.trim(),
			description: input.description.trim(),
			week_number: week,
			year: now.getFullYear()
		}, { onSuccess: () => setInput({
			title: "",
			description: ""
		}) });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Direção consciente",
			title: "Planejamento",
			description: "Objetivos que conectam intenção, ações e o futuro que está sendo construído."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			title: "Metas da semana",
			detail: "Progresso comprometido, não desejado",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusCard, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs font-semibold uppercase tracking-wide text-faint",
							children: "Nova meta"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: input.title,
							onChange: (e) => setInput({
								...input,
								title: e.target.value
							}),
							placeholder: "Título"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs font-semibold uppercase tracking-wide text-faint",
							children: "Descrição"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: input.description,
							onChange: (e) => setInput({
								...input,
								description: e.target.value
							}),
							placeholder: "Opcional"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: submit,
						disabled: !input.title.trim() || create.isPending,
						children: "Adicionar"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
			title: "Roadmap do ano",
			detail: "Quatro movimentos que conduzem 2026",
			className: "mt-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "roadmap",
				children: [
					"Investigar",
					"Documentar",
					"Compartilhar",
					"Preservar"
				].map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: i + 1 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: x })] }, x))
			})
		})
	] });
}
function AchievementsPage() {
	const { milestones, isLoading } = useMilestones();
	const create = useCreateMilestone();
	const [draft, setDraft] = (0, import_react.useState)({
		year: String((/* @__PURE__ */ new Date()).getFullYear()),
		title: "",
		description: "",
		category: "Vida"
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const submit = () => {
		if (!draft.title.trim()) return;
		create.mutate(draft, { onSuccess: () => setDraft({
			...draft,
			title: "",
			description: ""
		}) });
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-lg border border-border bg-card" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Marcos preservados",
			title: "Realizações",
			description: "Uma linha do tempo do que mudou sua história — grandes conquistas e viradas silenciosas.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => setOpen((v) => !v),
				children: open ? "Fechar" : "Registrar marco"
			})
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:flex-wrap",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Ano",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "w-24",
						value: draft.year,
						onChange: (e) => setDraft({
							...draft,
							year: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs font-semibold uppercase tracking-wide text-faint",
						children: "Título"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.title,
						onChange: (e) => setDraft({
							...draft,
							title: e.target.value
						}),
						placeholder: "O que aconteceu"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs font-semibold uppercase tracking-wide text-faint",
						children: "Categoria"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.category,
						onChange: (e) => setDraft({
							...draft,
							category: e.target.value
						}),
						placeholder: "Vida, Pesquisa…"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-[2] space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs font-semibold uppercase tracking-wide text-faint",
						children: "Descrição"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.description,
						onChange: (e) => setDraft({
							...draft,
							description: e.target.value
						}),
						placeholder: "Como isso mudou sua história"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: submit,
					disabled: !draft.title.trim() || create.isPending,
					children: "Salvar"
				})
			]
		}),
		milestones.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-5" }),
			title: "Nenhum marco preservado",
			description: "Registre o primeiro: uma conquista, virada ou aprendizado do seu percurso."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "achievement-list",
			children: milestones.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "achievement-year",
					children: m.year
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "achievement-dot" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "status status-neutral",
							children: m.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-xl font-semibold",
							children: m.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xl text-sm leading-6 text-muted-foreground",
							children: m.description
						})
					]
				})
			] }, m.title))
		})
	] });
}
function ProjectsPage() {
	const { projects, isLoading } = useProjects();
	const upsert = useUpsertProject();
	const [draft, setDraft] = (0, import_react.useState)({
		name: "",
		description: "",
		objective: "",
		status: "Planejado"
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const submit = () => {
		if (!draft.name.trim()) return;
		upsert.mutate({
			...draft,
			name: draft.name.trim(),
			progress: 0
		}, { onSuccess: () => setDraft({
			name: "",
			description: "",
			objective: "",
			status: "Planejado"
		}) });
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-lg border border-border bg-card" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Trabalho em movimento",
			title: "Projetos",
			description: "Iniciativas que conectam curiosidade, propósito e impacto ao longo do tempo.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => setOpen((v) => !v),
				children: open ? "Fechar" : "Novo projeto"
			})
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-lg border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Nome",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.name,
							onChange: (e) => setDraft({
								...draft,
								name: e.target.value
							}),
							placeholder: "Nome do projeto"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Status",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
							value: draft.status,
							onChange: (e) => setDraft({
								...draft,
								status: e.target.value
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Planejado",
									children: "Planejado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Em andamento",
									children: "Em andamento"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Pesquisa",
									children: "Pesquisa"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Concluído",
									children: "Concluído"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Descrição",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.description,
								onChange: (e) => setDraft({
									...draft,
									description: e.target.value
								}),
								placeholder: "Em poucas palavras"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Objetivo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.objective,
								onChange: (e) => setDraft({
									...draft,
									objective: e.target.value
								}),
								placeholder: "O que você quer alcançar"
							})
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "mt-3",
				onClick: submit,
				disabled: !draft.name.trim() || upsert.isPending,
				children: "Salvar projeto"
			})]
		}),
		projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderKanban, { className: "size-5" }),
			title: "Nada aqui ainda",
			description: "Seus projetos aparecerão aqui. Crie um acima para começar — tudo fica salvo."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "project-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "status status-neutral",
							children: p.status
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-medium",
							children: [p.progress, "%"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-6 font-display text-xl font-semibold",
						children: p.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-6 text-muted-foreground",
						children: p.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xs text-faint",
						children: "Objetivo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: p.objective
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressBar, { value: p.progress })
					})
				]
			}, p.name))
		})
	] });
}
function AboutPage() {
	const { profile } = useProfile();
	const isBlank = !profile || profile.name.trim() === "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Quem sou",
		title: isBlank ? "Sobre" : `Sobre ${profile.name.split(" ")[0]}`,
		description: "A pessoa por trás dos registros, seus vínculos e o sentido que atravessa sua trajetória."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 lg:grid-cols-[1.2fr_0.8fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl leading-relaxed text-foreground",
			children: "“Quero compreender como guardamos o que vivemos e como essas memórias podem orientar futuros mais humanos.”"
		}), isBlank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-5" }),
			title: "Complete seu perfil",
			description: "Sua apresentação e família aparecerão aqui quando você preencher suas informações.",
			actionLabel: "Abrir Configurações",
			onAction: () => window.location.href = "/configuracoes"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-6 text-sm leading-7 text-muted-foreground",
			children: [profile.bio || "Sua bio aparecerá aqui.", " Minha história é atravessada por cidades, relatos de família e pela vontade de transformar lembranças dispersas em conhecimento compartilhado."]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid grid-cols-2 gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmallFact, {
				icon: MapPin,
				label: "Vive em",
				value: profile.location || "—"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmallFact, {
				icon: Earth,
				label: "Nasceu em",
				value: "—"
			})]
		})] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "family-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-4 text-accent-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Núcleo familiar"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-6 text-muted-foreground",
					children: "Edite seus vínculos em Configurações para vê-los aqui. Seus dados não são uma rede social — são sua história."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 border-t border-border pt-4 text-xs leading-5 text-faint",
					children: "Vínculos preservados como parte da trajetória, não como conexões sociais."
				})
			]
		})]
	})] });
}
function GamesPage() {
	const { capsules, isLoading } = useTimeCapsules();
	const create = useCreateCapsule();
	const openCapsule = useOpenCapsule();
	const [open, setOpen] = (0, import_react.useState)(false);
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const defaultDate = new Date(Date.now() + 31536e6).toISOString().slice(0, 10);
	const [draft, setDraft] = (0, import_react.useState)({
		title: "",
		content: "",
		unlock_at: defaultDate
	});
	const sealed = capsules.filter((c) => c.unlock_at > today && !c.opened_at);
	const ready = capsules.filter((c) => c.unlock_at <= today || c.opened_at);
	const submit = () => {
		if (!draft.title.trim() || !draft.content.trim()) return;
		create.mutate({
			title: draft.title.trim(),
			content: draft.content.trim(),
			unlock_at: draft.unlock_at
		}, {
			onSuccess: () => {
				setDraft({
					title: "",
					content: "",
					unlock_at: defaultDate
				});
				setOpen(false);
				toast.success("Cápsula selada — ela abre em " + draft.unlock_at + ".");
			},
			onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível selar.")
		});
	};
	const daysUntil = (iso) => {
		const ms = (/* @__PURE__ */ new Date(`${iso}T00:00:00`)).getTime() - (/* @__PURE__ */ new Date(`${today}T00:00:00`)).getTime();
		return Math.max(0, Math.ceil(ms / 864e5));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Exploração & futuro",
			title: "Jogos",
			description: "A primeira experiência está viva: Cápsulas do Tempo — cartas para o seu eu futuro, seladas até a data que você escolher.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => setOpen((v) => !v),
				children: open ? "Fechar" : "Nova cápsula"
			})
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8 rounded-lg border border-border bg-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-[1fr_180px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Título da cápsula",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.title,
								onChange: (e) => setDraft({
									...draft,
									title: e.target.value
								}),
								placeholder: "Ex.: Para quando eu completar 40"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Abre em",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								min: today,
								value: draft.unlock_at,
								onChange: (e) => setDraft({
									...draft,
									unlock_at: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Sua carta",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 5,
									value: draft.content,
									onChange: (e) => setDraft({
										...draft,
										content: e.target.value
									}),
									placeholder: "Escreva para quem você vai ser. O que você espera? O que quer lembrar? Depois de selar, o conteúdo fica imutável — nem você pode editá-lo."
								})
							})
						})
					]
				}),
				create.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive",
					children: create.error instanceof Error ? create.error.message : String(create.error)
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					className: "mt-3",
					onClick: submit,
					disabled: !draft.title.trim() || !draft.content.trim() || !draft.unlock_at || draft.unlock_at <= today || create.isPending,
					children: create.isPending ? "Selando…" : "Selar cápsula"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] text-faint",
					children: "A integridade é garantida pelo banco: após selada, título, conteúdo e data não mudam."
				})
			]
		}),
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-lg border border-border bg-card" }) : capsules.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "games-stage",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "game-orbit",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hourglass, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "status status-open",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3" }), "Experiência ativa"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-5 font-display text-2xl font-semibold",
					children: "Cápsulas do Tempo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground",
					children: "Escreva uma carta para o seu eu futuro. Ela fica selada e imutável até a data de abertura — um recado atravessando o tempo."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					className: "mt-6",
					onClick: () => setOpen(true),
					children: "Selar a primeira cápsula"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid gap-3 sm:grid-cols-3",
					children: [["Mapa de memórias", "Linha do tempo jogável"].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "locked-game",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: x })]
					}, x)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "locked-game",
						"data-active": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hourglass, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cápsulas — você está aqui" })]
					})]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-8",
			children: [sealed.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Seladas",
				detail: "O tempo faz o resto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: sealed.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "capsule-card",
						"data-state": "sealed",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "status status-review",
									children: "Selada"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "capsule-countdown",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hourglass, { className: "size-3" }),
										daysUntil(c.unlock_at),
										" dias"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-5 font-display text-lg font-semibold",
								children: c.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "capsule-mask mt-3",
								children: "██████ ████ ███████ ██ █████ ████ █████"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-xs text-faint",
								children: ["Abre em ", c.unlock_at]
							})
						]
					}, c.id))
				})
			}), ready.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Prontas para abrir",
				detail: "O futuro chegou",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: ready.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "capsule-card",
						"data-state": "openable",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "status status-open",
									children: "Aberta"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-faint",
									children: c.unlock_at
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-5 font-display text-lg font-semibold",
								children: c.title
							}),
							c.opened_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "capsule-content mt-3",
								children: c.content
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "capsule-mask mt-3",
								children: "██████ ████ ███████ ██ █████"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "mt-4",
								disabled: openCapsule.isPending,
								onClick: () => openCapsule.mutate(c.id, {
									onSuccess: () => toast.success("Cápsula aberta — bem-vindo ao seu futuro."),
									onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao abrir.")
								}),
								children: "Abrir cápsula"
							})] })
						]
					}, c.id))
				})
			})]
		})
	] });
}
function TimelineSection({ icon: Icon, title, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
		title,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-6",
			children: rows.map(([date, place, role]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "icon-tile",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 text-sm font-semibold",
						children: place
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: role
					})
				] })]
			}, `${date}-${place}`))
		})
	});
}
function SmallFact({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "quiet-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-accent-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs text-faint",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm font-medium",
				children: value
			})
		]
	});
}
//#endregion
export { ProjectsPage as a, PlanningPage as i, AchievementsPage as n, ResumePage as o, GamesPage as r, AboutPage as t };
