import type {
  AgendaEvent,
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import { DEFAULT_AVAILABILITY } from "@/types/profile";

// ---------------------------------------------------------------------------
// Seeds vazios — o app começa limpo. Nenhuma informação fictícia é exibida.
// O dono preenche tudo em /configuracoes, na agenda e nas demais páginas.
// Mantido apenas para tipagem e para o repositório local saber a forma dos dados.
// ---------------------------------------------------------------------------

export const profile: Profile = {
  id: "local-profile",
  name: "",
  role: "",
  location: "",
  initials: "?",
  bio: "",
  birth_date: "",
  target_lifespan: 100,
  avatar_url: null,
  cover_url: null,
  handle: "",
  availability: DEFAULT_AVAILABILITY,
};

export const dailyLogs: DailyLog[] = [];

export const agendaEvents: AgendaEvent[] = [];

export const weeklyFocus: WeeklyFocus[] = [];

export const careerChapters: CareerChapter[] = [];

export const projects: Project[] = [];

export const milestones: Milestone[] = [];

/** Texto de prólogo vazio — o usuário escreve o seu em /configuracoes ou na agenda. */
export const lifePrologue = "";
