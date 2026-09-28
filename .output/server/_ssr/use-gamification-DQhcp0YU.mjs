import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as useDailyLogs } from "./use-daily-logs-Bg1aw7Kp.mjs";
import { i as useMilestones, o as useProjects, s as useTimeCapsules, u as useWeeklyFocus } from "./use-weekly-focus-DscBeEtA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-gamification-DQhcp0YU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var LEVEL_TITLES = [
	"Semente",
	"Aprendiz do Tempo",
	"Guardião de Dias",
	"Contador de Histórias",
	"Arquiteto da Memória",
	"Mestre do Legado"
];
function levelFromXp(xp) {
	let level = 1;
	let accumulated = 0;
	while (true) {
		const need = Math.round(80 * Math.pow(level, 1.35));
		if (accumulated + need > xp) return {
			level,
			xpIntoLevel: xp - accumulated,
			xpForNextLevel: need
		};
		accumulated += need;
		level += 1;
		if (level > 99) return {
			level: 99,
			xpIntoLevel: 0,
			xpForNextLevel: need
		};
	}
}
function computeStreak(dates) {
	const sorted = [...new Set(dates)].sort();
	if (sorted.length === 0) return {
		streak: 0,
		best: 0
	};
	const msDay = 864e5;
	let best = 1;
	let run = 1;
	for (let i = 1; i < sorted.length; i++) {
		const prev = (/* @__PURE__ */ new Date(`${sorted[i - 1] ?? ""}T00:00:00`)).getTime();
		if ((/* @__PURE__ */ new Date(`${sorted[i] ?? ""}T00:00:00`)).getTime() - prev === msDay) {
			run += 1;
			best = Math.max(best, run);
		} else run = 1;
	}
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const yesterday = (/* @__PURE__ */ new Date(Date.now() - msDay)).toISOString().slice(0, 10);
	const last = sorted[sorted.length - 1] ?? "";
	let current = 0;
	if (last === today || last === yesterday) {
		current = 1;
		for (let i = sorted.length - 1; i > 0; i--) {
			const prev = (/* @__PURE__ */ new Date(`${sorted[i - 1] ?? ""}T00:00:00`)).getTime();
			if ((/* @__PURE__ */ new Date(`${sorted[i] ?? ""}T00:00:00`)).getTime() - prev === msDay) current += 1;
			else break;
		}
	}
	return {
		streak: current,
		best
	};
}
function useGamification() {
	const { logs } = useDailyLogs();
	const { projects } = useProjects();
	const { milestones } = useMilestones();
	const { focus } = useWeeklyFocus();
	const { capsules } = useTimeCapsules();
	return (0, import_react.useMemo)(() => {
		const daysWithSummary = logs.filter((l) => l.summary_text.trim() !== "");
		const xpLogs = daysWithSummary.length * 25;
		const xpMilestones = milestones.length * 60;
		const xpProjects = projects.filter((p) => p.status === "Concluído").length * 80;
		const xpGoals = focus.filter((f) => f.progress_pct === 100).length * 40;
		const xpCapsules = capsules.length * 50;
		const totalXp = xpLogs + xpMilestones + xpProjects + xpGoals + xpCapsules;
		const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(totalXp);
		const { streak, best } = computeStreak(logs.map((l) => l.log_date));
		const achievements = [
			{
				id: "first-day",
				label: "Primeiro Dia",
				description: "Registre seu primeiro dia na agenda",
				unlocked: logs.length >= 1,
				icon: "book"
			},
			{
				id: "storyteller",
				label: "Contador de Histórias",
				description: "Escreva o resumo de 7 dias",
				unlocked: daysWithSummary.length >= 7,
				icon: "star"
			},
			{
				id: "streak-3",
				label: "Fogo Aceso",
				description: "3 dias consecutivos de registro",
				unlocked: best >= 3,
				icon: "flame"
			},
			{
				id: "first-goal",
				label: "Alvo Cumprido",
				description: "Complete uma meta semanal (100%)",
				unlocked: focus.some((f) => f.progress_pct === 100),
				icon: "target"
			},
			{
				id: "first-milestone",
				label: "Marco Zero",
				description: "Preserve sua primeira realização",
				unlocked: milestones.length >= 1,
				icon: "trophy"
			},
			{
				id: "shipper",
				label: "Entregador",
				description: "Conclua um projeto",
				unlocked: projects.some((p) => p.status === "Concluído"),
				icon: "lock"
			},
			{
				id: "messenger",
				label: "Mensageiro do Futuro",
				description: "Sele sua primeira cápsula do tempo",
				unlocked: capsules.length >= 1,
				icon: "star"
			}
		];
		return {
			totalXp,
			level,
			levelTitle: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Semente",
			xpIntoLevel,
			xpForNextLevel,
			levelProgressPct: Math.min(100, Math.round(xpIntoLevel / xpForNextLevel * 100)),
			streak,
			bestStreak: best,
			achievements,
			unlockedCount: achievements.filter((a) => a.unlocked).length
		};
	}, [
		logs,
		projects,
		milestones,
		focus,
		capsules
	]);
}
//#endregion
export { useGamification as t };
