import type { Account } from "@/types/auth";
import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import { newId } from "@/repositories/profile-repository";

// ---------------------------------------------------------------------------
// Gerador de "história inicial".
//
// Usado no fluxo de primeira entrada: cria uma vida navegável (prólogo, agenda,
// metas, capítulos, marcos e um projeto) para que o dono percorra o app inteiro
// desde o primeiro minuto. Todo texto é um ESQUELETO com trechos entre [ ] —
// nada de fatos inventados sobre a pessoa; ela edita e substitui.
// ---------------------------------------------------------------------------

type Cycle = { index: number; range: string; name: string; intent: string };

const CYCLES: Cycle[] = [
  {
    index: 0,
    range: "0–25",
    name: "Aprendizado & Base",
    intent: "formação, descobertas e as primeiras escolhas que definem direção",
  },
  {
    index: 1,
    range: "25–50",
    name: "Construção & Legado",
    intent: "construir carreira, vínculos, projetos e reputação",
  },
  {
    index: 2,
    range: "50–75",
    name: "Consolidação & Mentoria",
    intent: "consolidar o que foi construído e devolver experiência a outros",
  },
  {
    index: 3,
    range: "75–100",
    name: "Plenitude & Sabedoria",
    intent: "revisitar a própria história e transformá-la em legado",
  },
];

export function cycleForAge(age: number): Cycle {
  return CYCLES[Math.min(Math.floor(age / 25), 3)] as Cycle;
}

export type StoryPreset = "guided" | "blank";

export type StarterLife = {
  profile: Partial<Profile>;
  prologue: string;
  dailyLog: DailyLog;
  focus: WeeklyFocus[];
  chapters: CareerChapter[];
  milestones: Milestone[];
  projects: Project[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentWeek(): { week: number; year: number } {
  const date = new Date();
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return { week, year: date.getFullYear() };
}

/** Metas da semana adaptadas ao propósito do ciclo de vida atual. */
function focusFor(cycle: Cycle): WeeklyFocus[] {
  const { week, year } = currentWeek();
  const items: Array<[string, string]> = [
    [`Definir a direção de ${cycle.name}`, "O que os próximos 12 meses precisam significar"],
    ["Registrar 5 dias seguidos", "Constância no livro de bordo antes de qualquer perfeição"],
    ["Concluir a primeira entrega do projeto ativo", "Tirar algo da intenção e colocar no mundo"],
  ];
  return items.map(([title, description]) => ({
    id: newId(),
    title,
    description,
    week_number: week,
    year,
    progress_pct: 0,
  }));
}

export function buildStarterLife(account: Account, preset: StoryPreset): StarterLife {
  const firstName = account.name.split(/\s+/)[0] ?? account.name;
  const cycle = cycleForAge(account.age);
  const birthYear = new Date(`${account.birth_date}T00:00:00`).getFullYear();

  const profile: Partial<Profile> = {
    name: account.name,
    birth_date: account.birth_date,
    role: "",
    location: "",
    bio: "",
  };

  if (preset === "blank") {
    return {
      profile,
      prologue: "",
      dailyLog: {
        id: newId(),
        log_date: todayIso(),
        planned_text: "",
        executed_text: "",
        summary_text: "",
        status: "OPEN",
        locked_at: null,
        created_at: new Date().toISOString(),
      },
      focus: [],
      chapters: [],
      milestones: [],
      projects: [],
    };
  }

  const prologue = [
    `Este é o primeiro registro do meu Perfil Vivo. Meu nome é ${firstName} e nasci em ${birthYear}.`,
    `Tenho ${account.age} anos e estou no ciclo ${cycle.index + 1} — ${cycle.name} (${cycle.range} anos), que trata de ${cycle.intent}.`,
    "Antes deste app: [escreva aqui, em poucas linhas, os anos que precedem este primeiro dia].",
    "O que me trouxe até aqui: [cite as pessoas, lugares e decisões que explicam onde você está].",
    "O que quero construir daqui em diante: [defina o sentido que os próximos ciclos devem ter].",
  ].join("\n\n");

  const dailyLog: DailyLog = {
    id: newId(),
    log_date: todayIso(),
    planned_text: [
      "Escolher a primeira frente de trabalho real deste ciclo",
      "Separar 30 minutos para registrar memória e intenção do dia",
      "Falar com alguém que ainda não sabe deste recomeço",
    ].join("\n"),
    executed_text: "",
    summary_text: "",
    status: "OPEN",
    locked_at: null,
    created_at: new Date().toISOString(),
  };

  const chapters: CareerChapter[] = [
    {
      id: newId(),
      title: "[Formação ou aprendizado fundador]",
      period: `[ano] — [ano]`,
      document_type: "EDUCATION",
      content: "[O que você estudou, onde, e o que isso mudou no seu jeito de pensar]",
    },
    {
      id: newId(),
      title: "[Experiência que mais te formou]",
      period: "[ano] — hoje",
      document_type: "EXPERIENCE",
      content: "[O que você fazia, com quem, e o resultado concreto que gerou]",
    },
    {
      id: newId(),
      title: "[Produção de que você se orgulha]",
      period: "[ano]",
      document_type: "PRODUCTION",
      content: "[Projeto, texto, obra, sistema ou pesquisa que continua de pé]",
    },
  ];

  const milestones: Milestone[] = [
    {
      year: String(birthYear),
      title: "O começo de tudo",
      description: `Nasci em [cidade]. Foi aqui que esta história começou.`,
      category: "Vida",
    },
    {
      year: String(new Date().getFullYear()),
      title: "Primeiro dia no Perfil Vivo",
      description:
        "Decidi parar de perder minha própria trajetória e começar a registrá-la dia a dia.",
      category: "Vida",
    },
    {
      year: "[ano]",
      title: "[Marco que você quer alcançar]",
      description: "[Descreva a virada que você está construindo agora]",
      category: cycle.name,
    },
  ];

  const projects: Project[] = [
    {
      name: "[Projeto que está recebendo sua energia]",
      description: "[Em poucas palavras, o que é e por que importa]",
      status: "Em andamento",
      progress: 0,
      objective: "[O que precisa estar pronto para você considerar concluído]",
    },
    {
      name: "Registro diário por 30 dias",
      description: "Transformar o hábito de registrar em parte da rotina.",
      status: "Planejado",
      progress: 0,
      objective: "30 dias consecutivos com resumo escrito.",
    },
  ];

  return { profile, prologue, dailyLog, focus: focusFor(cycle), chapters, milestones, projects };
}
