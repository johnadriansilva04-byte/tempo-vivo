import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import { isPlaceholderText } from "@/lib/placeholder";

// ---------------------------------------------------------------------------
// Progresso da história — derivado SEMPRE de dados reais.
//
// Cada passo só é dado como concluído quando existe conteúdo de verdade escrito
// pelo dono. O objetivo é dar direção (o que falta) sem inventar nada.
// ---------------------------------------------------------------------------

export type StoryStep = {
  id: string;
  title: string;
  hint: string;
  done: boolean;
  /** Rota para agir quando o passo está pendente. */
  to: string;
  /** Ação especial tratada fora da navegação (ex.: abrir o ritual). */
  action?: "ritual";
};

export type StoryProgress = {
  steps: StoryStep[];
  doneCount: number;
  total: number;
  pct: number;
  complete: boolean;
  /** Próximo passo pendente — o convite principal do painel. */
  nextStep: StoryStep | null;
};

/** Texto de convite ainda não substituído pelo dono (ex.: conteúdo genérico do onboarding). */
const PLACEHOLDER_HINTS = [
  "O que você estudou",
  "O que você fazia",
  "Projeto, texto, obra",
  "O que precisa estar pronto",
];

/** O texto é do dono — longo o bastante e sem convites/colchetes do onboarding. */
function hasOwnWords(text: string): boolean {
  const value = text.trim();
  if (value.length < 12) return false;
  if (isPlaceholderText(value)) return false;
  return !PLACEHOLDER_HINTS.some((hint) => value.startsWith(hint));
}

export function computeStoryProgress(input: {
  profile: Profile | null;
  prologue: string;
  logs: DailyLog[];
  focus: WeeklyFocus[];
  chapters: CareerChapter[];
  milestones: Milestone[];
  projects: Project[];
}): StoryProgress {
  const { profile, prologue, logs, focus, chapters, milestones, projects } = input;

  const logsWithSummary = logs.filter((l) => l.summary_text.trim() !== "").length;
  // O conteúdo é a substância: títulos do onboarding (ex.: "Formação ou aprendizado
  // fundador") são do app e não podem contar como palavra do dono.
  const ownChapters = chapters.filter((c) => hasOwnWords(c.content));
  const ownProjects = projects.filter((p) => hasOwnWords(p.objective));
  const ownMilestones = milestones.filter(
    (m) => hasOwnWords(m.title) || hasOwnWords(m.description),
  );

  const steps: StoryStep[] = [
    {
      id: "identity",
      title: "Sua identidade",
      hint: "Nome, papel e onde você vive.",
      done:
        Boolean(profile?.name.trim()) && Boolean(profile?.role.trim() || profile?.location.trim()),
      to: "/configuracoes",
    },
    {
      id: "prologue",
      title: "Seu prólogo",
      hint: "O relato dos anos que precedem este começo.",
      done: prologue.trim().length >= 60 && !isPlaceholderText(prologue),
      to: "/agenda",
    },
    {
      id: "ritual",
      title: "O primeiro dia registrado",
      hint: "Planeje e depois feche o dia com um resumo.",
      done: logsWithSummary >= 1,
      to: "/agenda",
      action: "ritual",
    },
    {
      id: "focus",
      title: "Uma meta da semana",
      hint: "Compromisso concreto, com progresso visível.",
      done: focus.length > 0,
      to: "/planejamento",
    },
    {
      id: "chapter",
      title: "Um capítulo do currículo",
      hint: "Experiência, formação ou produção com as suas palavras.",
      done: ownChapters.length > 0,
      to: "/curriculo",
    },
    {
      id: "milestone",
      title: "Um marco preservado",
      hint: "Uma virada que mudou a sua história.",
      done: ownMilestones.length > 0,
      to: "/realizacoes",
    },
    {
      id: "project",
      title: "Um projeto com objetivo claro",
      hint: "O que precisa estar pronto para considerar concluído.",
      done: ownProjects.length > 0,
      to: "/projetos",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;

  return {
    steps,
    doneCount,
    total,
    pct: Math.round((doneCount / total) * 100),
    complete: doneCount === total,
    nextStep: steps.find((s) => !s.done) ?? null,
  };
}
