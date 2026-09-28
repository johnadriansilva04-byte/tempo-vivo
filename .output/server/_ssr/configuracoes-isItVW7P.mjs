import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as requireSupabase, b as mapUnknownError, i as clearLocalDB, n as Button, t as ApiError, u as exportLocalDB } from "./button-PJRo-bhb.mjs";
import { a as Textarea, n as PageHeader } from "./page-kit-BtGduzzZ.mjs";
import { E as ImagePlus, F as Eye, L as Download, h as Save, o as Trash2, r as Upload } from "../_libs/lucide-react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { n as useUpdateProfile, t as useProfile } from "./use-profile-CwIeOr50.mjs";
import { t as LifetimeTracker } from "./lifetime-tracker-BxtRPwfE.mjs";
import { n as Slider, t as Input } from "./slider-BkYVZ81-.mjs";
import { t as Label } from "./label-CwsRTGFa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/configuracoes-isItVW7P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Upload de avatar/banner para o bucket `avatars` (migration 3).
* Se o bucket não estiver configurado cai no fallback data-URL local.
* Retorna a URL pública (ou data-URL se offline).
*/
async function uploadAvatar(file, prefix = "avatar") {
	if (file.size > 4194304) throw new ApiError("VALIDATION", "Imagem muito grande (máx. 4 MB).");
	if (!file.type.startsWith("image/")) throw new ApiError("VALIDATION", "Só imagens são aceitas.");
	try {
		const db = requireSupabase();
		const ext = file.name.split(".").pop() ?? "jpg";
		const path = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}.${ext}`;
		const { error } = await db.storage.from("avatars").upload(path, file, {
			upsert: false,
			contentType: file.type
		});
		if (error) throw error;
		const { data } = db.storage.from("avatars").getPublicUrl(path);
		return data.publicUrl;
	} catch (e) {
		const mapped = mapUnknownError(e);
		if (mapped.code === "NOT_CONFIGURED" || mapped.code === "NETWORK" || mapped.code === "TIMEOUT") return await fileToDataUrl(file);
		throw mapped;
	}
}
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(String(r.result));
		r.onerror = () => reject(new ApiError("UNKNOWN", "Falha ao ler imagem."));
		r.readAsDataURL(file);
	});
}
var empty = {
	name: "",
	role: "",
	location: "",
	bio: "",
	birth_date: "",
	target_lifespan: 100,
	avatar_url: "",
	cover_url: ""
};
function initialsOf(name) {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
function ConfigPage() {
	const { profile } = useProfile();
	const update = useUpdateProfile();
	const [draft, setDraft] = (0, import_react.useState)(empty);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const fileAvatarRef = (0, import_react.useRef)(null);
	const fileCoverRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!profile || touched) return;
		setDraft({
			name: profile.name,
			role: profile.role,
			location: profile.location,
			bio: profile.bio,
			birth_date: profile.birth_date,
			target_lifespan: profile.target_lifespan,
			avatar_url: profile.avatar_url ?? "",
			cover_url: profile.cover_url ?? ""
		});
	}, [profile, touched]);
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-40 animate-pulse rounded bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-lg border border-border bg-card" })]
	});
	const set = (key, value) => {
		setTouched(true);
		setDraft((d) => ({
			...d,
			[key]: value
		}));
	};
	const incomplete = profile.name.trim() === "";
	const save = () => {
		const payload = {
			name: draft.name.trim() || "",
			role: draft.role.trim(),
			location: draft.location.trim(),
			bio: draft.bio.trim(),
			birth_date: draft.birth_date || "",
			target_lifespan: Math.max(40, Math.min(150, draft.target_lifespan)),
			avatar_url: draft.avatar_url.trim() || null,
			cover_url: draft.cover_url.trim() || null
		};
		update.mutate(payload, {
			onSuccess: () => {
				toast.success("Perfil salvo. Suas alterações já estão visíveis em todo o app.");
				setTouched(false);
			},
			onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar.")
		});
	};
	const clearLocal = () => {
		clearLocalDB();
		window.location.reload();
	};
	const onExport = () => {
		const db = exportLocalDB();
		const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `perfil-vivo-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Exportado — guarde o JSON como backup.");
	};
	const onPick = async (file, field) => {
		try {
			const url = await uploadAvatar(file, field === "avatar_url" ? "avatar" : "cover");
			set(field, url);
			toast.success(field === "avatar_url" ? "Foto enviada." : "Banner enviado.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Falha no upload.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Ajustes",
			title: "Configurações",
			description: "Defina quem é você no Perfil Vivo. Todos os dados ficam salvos — no seu banco quando Supabase está configurado, ou localmente até lá.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: save,
				disabled: update.isPending,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }), " Salvar"]
			})
		}),
		incomplete && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-primary",
				children: "Complete seu perfil"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs leading-5 text-muted-foreground",
				children: "Preencha seu nome e demais dados abaixo. O app começa vazio — só o que você escrever vai aparecer."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[1.7fr_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-card p-5 sm:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint",
							children: "Identidade"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Nome completo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.name,
										onChange: (e) => set("name", e.target.value),
										placeholder: "Seu nome",
										autoComplete: "name"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "O que você faz",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.role,
										onChange: (e) => set("role", e.target.value),
										placeholder: "Ex.: Pesquisadora, engenheiro, artista…"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Onde vive",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.location,
										onChange: (e) => set("location", e.target.value),
										placeholder: "Ex.: São Paulo, Brasil",
										autoComplete: "address-level2"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Data de nascimento",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: draft.birth_date,
										onChange: (e) => set("birth_date", e.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "sm:col-span-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Bio curta",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											rows: 3,
											value: draft.bio,
											onChange: (e) => set("bio", e.target.value),
											placeholder: "Uma frase que resume sua trajetória…"
										})
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-card p-5 sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint",
								children: "Tempo de vida"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Ajusta o horizonte do donut Memento Mori e os 4 ciclos de 25 anos."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold uppercase tracking-wide text-faint",
											children: "Horizonte alvo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-display text-sm font-bold text-primary",
											children: [draft.target_lifespan, " anos"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										className: "mt-3",
										value: [draft.target_lifespan],
										min: 40,
										max: 150,
										step: 1,
										onValueChange: (arr) => set("target_lifespan", arr[0] ?? 100)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-[11px] text-faint",
										children: "40–150 anos. Padrão: 100."
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-card p-5 sm:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-sm font-semibold uppercase tracking-[0.12em] text-faint",
							children: "Visual"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Foto do perfil (URL)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: draft.avatar_url,
											onChange: (e) => set("avatar_url", e.target.value),
											placeholder: "https://… ou deixe vazio para usar iniciais"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "secondary",
											size: "sm",
											className: "shrink-0",
											onClick: () => fileAvatarRef.current?.click(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-3.5" }), " Arquivo"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: fileAvatarRef,
											type: "file",
											accept: "image/*",
											className: "hidden",
											onChange: (e) => {
												const f = e.target.files?.[0];
												if (f) onPick(f, "avatar_url");
											}
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Banner de fundo (URL)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: draft.cover_url,
											onChange: (e) => set("cover_url", e.target.value),
											placeholder: "https://… — aparece no topo do Dashboard"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "secondary",
											size: "sm",
											className: "shrink-0",
											onClick: () => fileCoverRef.current?.click(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-3.5" }), " Arquivo"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: fileCoverRef,
											type: "file",
											accept: "image/*",
											className: "hidden",
											onChange: (e) => {
												const f = e.target.files?.[0];
												if (f) onPick(f, "cover_url");
											}
										})
									]
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 border-t border-border pt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: save,
								disabled: update.isPending,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Salvar alterações"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: onExport,
								className: "gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), " Exportar JSON"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
									" Importar JSON",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "application/json",
										className: "hidden",
										onChange: async (e) => {
											const f = e.target.files?.[0];
											if (!f) return;
											try {
												const text = await f.text();
												const parsed = JSON.parse(text);
												window.localStorage.setItem("perfil-vivo:db:v2", JSON.stringify({
													...parsed,
													version: 2
												}));
												toast.success("Importado — recarregando.");
												setTimeout(() => window.location.reload(), 400);
											} catch {
												toast.error("JSON inválido.");
											}
										}
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								onClick: clearLocal,
								className: "gap-1.5 text-xs text-faint",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Limpar dados locais e recarregar"]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" }), " Preview do perfil"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-hidden rounded-lg border border-border bg-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-28",
								children: [draft.cover_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 bg-cover bg-center",
									style: { backgroundImage: `url(${draft.cover_url})` }
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-card to-transparent" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-4 p-5 pt-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "-mt-8 grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-card bg-primary text-sm font-bold text-primary-foreground shadow-lg",
									children: draft.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: draft.avatar_url,
										alt: "",
										className: "size-full object-cover"
									}) : initialsOf(draft.name || "?")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate font-display text-base font-semibold text-foreground",
											children: draft.name || "Seu nome"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-xs text-muted-foreground",
											children: draft.role || "Sua ocupação"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-faint",
											children: draft.location || "Sua cidade"
										}),
										draft.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-3 text-xs leading-5 text-muted-foreground",
											children: draft.bio
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-t border-border p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewLifetime, {
									birth_date: draft.birth_date,
									target_lifespan: draft.target_lifespan
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-5 text-faint",
						children: "Suas alterações aparecem em todo o app imediatamente. Quando o Supabase estiver configurado, ficam persistidas no banco para o usuário logado."
					})
				]
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
function PreviewLifetime({ birth_date, target_lifespan }) {
	const now = /* @__PURE__ */ new Date();
	const birth = /* @__PURE__ */ new Date(`${birth_date}T00:00:00`);
	if (!(birth_date !== "" && !Number.isNaN(birth.getTime()) && birth.getTime() <= now.getTime())) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-faint",
		children: "Informe uma data de nascimento válida para ver o Memento Mori."
	});
	const daysLived = Math.floor((now.getTime() - birth.getTime()) / 864e5);
	const age = Math.floor(daysLived / 365.2425);
	const targetDays = Math.round(target_lifespan * 365.2425);
	const pct = Math.min(100, daysLived / targetDays * 100);
	const idx = Math.min(Math.floor(age / 25), 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "size-20 shrink-0 rounded-full border border-border bg-muted p-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifetimeTracker, { compact: true })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-semibold text-foreground",
				children: [
					age,
					" anos · ",
					pct.toFixed(1),
					"% de ",
					target_lifespan
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted-foreground",
				children: [
					"Ciclo ",
					idx + 1,
					" · ",
					[
						"Aprendizado",
						"Construção",
						"Consolidação",
						"Plenitude"
					][idx]
				]
			})]
		})]
	});
}
var SplitComponent = ConfigPage;
//#endregion
export { SplitComponent as component };
