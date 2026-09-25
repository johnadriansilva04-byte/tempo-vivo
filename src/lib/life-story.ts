import type { Account } from "@/types/auth";
import type {
  AgendaEvent,
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";
import { newId } from "@/repositories/profile-repository";
import { handleFromName } from "@/lib/handle";

// ---------------------------------------------------------------------------
// Gerador de "história inicial".
//
// Usado no fluxo de primeira entrada: cria uma vida navegável (prólogo, agenda,
// metas, capítulos, marcos e um projeto) para que o dono percorra o app inteiro
// desde o primeiro minuto. Todo texto é um ESQUELETO com trechos entre [ ] —
// nada de fatos inventados sobre a pessoa; ela edita e substitui.
// ---------------------------------------------------------------------------

export type Cycle = { index: number; range: string; name: string; intent: string };

export const CYCLES: Cycle[] = [
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

/**
 * Respostas do ritual de primeira entrada. São as palavras do próprio dono —
 * nada aqui é inventado pelo app; é o que ele escreve que vira a história.
 */
export type StoryAnswers = {
  /** Onde a história começou (cidade/território). */
  origin: string;
  /** O que trouxe a pessoa até aqui: pessoas, lugares, decisões. */
  journey: string;
  /** O sentido que os próximos ciclos devem ter. */
  intention: string;
  /** A primeira frente que vai receber energia. */
  focus: string;
};

export const EMPTY_ANSWERS: StoryAnswers = {
  origin: "",
  journey: "",
  intention: "",
  focus: "",
};

export type StarterLife = {
  profile: Partial<Profile>;
  prologue: string;
  dailyLog: DailyLog;
  agendaEvent: AgendaEvent | null;
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
function focusFor(cycle: Cycle, primaryFocus: string): WeeklyFocus[] {
  const { week, year } = currentWeek();
  const items: Array<[string, string]> = [
    [
      primaryFocus.trim() || "Dar o primeiro passo da frente que escolhi",
      "Tirar a intenção do papel e colocar no mundo nesta semana",
    ],
    [`Definir a direção de ${cycle.name}`, "O que os próximos 12 meses precisam significar"],
    ["Registrar 5 dias seguidos", "Constância no livro de bordo antes de qualquer perfeição"],
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

/** Convite gentil quando um trecho do ritual fica em branco — nunca um colchete cru. */
const OPENING = {
  origin: (city: string) => (city.trim() ? `Nasci em ${city.trim()}.` : "Nasci e cresci."),
  focus: (text: string) => text.trim(),
};

/**
 * Limpa prólogos gravados por versões antigas do onboarding.
 *
 * Aquelas versões gravavam, junto com o relato do dono, linhas de instrução do
 * app — sempre iniciadas por um rótulo fixo seguido de um trecho entre [ ].
 * Só essas linhas conhecidas são removidas; todo o resto é preservado intacto,
 * inclusive escritos do dono que porventura usem colchetes.
 */
const LEGACY_PROMPT_PREFIXES = [
  "Antes deste app:",
  "O que me trouxe até aqui:",
  "O que quero construir daqui em diante:",
];

export function stripAppPrompts(prologue: string): string {
  const kept = prologue
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed.includes("[")) return true;
      return !LEGACY_PROMPT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
    })
    .join("\n");

  return kept.replace(/\n{3,}/g, "\n\n").trim();
}

export function buildStarterLife(
  account: Account,
  preset: StoryPreset,
  answers: StoryAnswers = EMPTY_ANSWERS,
): StarterLife {
  const firstName = account.name.split(/\s+/)[0] ?? account.name;
  const cycle = cycleForAge(account.age);
  const birthYear = new Date(`${account.birth_date}T00:00:00`).getFullYear();
  const thisYear = new Date().getFullYear();

  const profile: Partial<Profile> = {
    name: account.name,
    birth_date: account.birth_date,
    role: "",
    handle: handleFromName(account.name),
    // A resposta de origem é do dono: vira o "onde você vive" do perfil, em vez
    // de ficar só no prólogo e deixar a página Sobre em branco.
    location: answers.origin.trim(),
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
      agendaEvent: null,
      focus: [],
      chapters: [],
      milestones: [],
      projects: [],
    };
  }

  // O prólogo é montado com as palavras do dono: identidade + contexto + sentido.
  // Trechos em branco são OMITIDOS — o app nunca escreve no lugar dele.
  const prologue = [
    `Este é o primeiro registro do meu Perfil Vivo. Meu nome é ${firstName} e nasci em ${birthYear}.`,
    `Tenho ${account.age} anos e estou no ciclo ${cycle.index + 1} — ${cycle.name} (${cycle.range} anos), que trata de ${cycle.intent}.`,
    OPENING.origin(answers.origin),
    answers.journey.trim(),
    answers.intention.trim(),
  ]
    .filter((line) => line.trim() !== "")
    .join("\n\n");

  const dailyLog: DailyLog = {
    id: newId(),
    log_date: todayIso(),
    planned_text: [
      answers.focus.trim() || "Escolher a primeira frente de trabalho real deste ciclo",
      "Separar 30 minutos para registrar memória e intenção do dia",
      "Contar a alguém que este recomeço começou",
    ].join("\n"),
    executed_text: "",
    summary_text: "",
    status: "OPEN",
    locked_at: null,
    created_at: new Date().toISOString(),
  };

  // Capítulos viram convites para escrever. Colchetes = texto do app; a exibição
  // remove os colchetes e mostra em tom de convite até o dono escrever o relato.
  const chapters: CareerChapter[] = [
    {
      id: newId(),
      title: "Formação ou aprendizado fundador",
      period: "",
      document_type: "EDUCATION",
      content: "[O que você estudou, onde, e o que isso mudou no seu jeito de pensar.]",
    },
    {
      id: newId(),
      title: "A experiência que mais me formou",
      period: "",
      document_type: "EXPERIENCE",
      content: "[O que você fazia, com quem, e o resultado concreto que gerou.]",
    },
    {
      id: newId(),
      title: "Uma produção de que me orgulho",
      period: "",
      document_type: "PRODUCTION",
      content: "[Projeto, texto, obra, sistema ou pesquisa que continua de pé depois de você.]",
    },
  ];

  const milestones: Milestone[] = [
    {
      year: String(birthYear),
      title: "O começo de tudo",
      description: OPENING.origin(answers.origin),
      category: "Vida",
    },
    {
      year: String(thisYear),
      title: "Primeiro dia no Perfil Vivo",
      description:
        "Decidi parar de perder minha própria trajetória e começar a registrá-la dia a dia.",
      category: "Vida",
    },
    {
      year: String(thisYear + 1),
      title: answers.intention.trim() || "[A virada que estou construindo agora]",
      description: `Dentro de ${cycle.name}: ${cycle.intent}.`,
      category: cycle.name,
    },
  ];

  const projects: Project[] = [
    {
      name: OPENING.focus(answers.focus) || "[A frente que quero colocar em movimento]",
      description: "A frente que está recebendo minha energia neste ciclo.",
      status: "Em andamento",
      progress: 0,
      objective: "[O que precisa estar pronto para eu considerar esta frente concluída.]",
      link: "",
    },
    {
      name: "Registro diário por 30 dias",
      description: "Transformar o hábito de registrar em parte da rotina.",
      status: "Planejado",
      progress: 0,
      objective: "30 dias consecutivos com resumo escrito.",
      link: "",
    },
  ];

  // O primeiro compromisso da agenda: a frente escolhida vira um bloco no dia.
  const agendaEvent: AgendaEvent = {
    id: newId(),
    title: answers.focus.trim() || "Primeiro passo da frente escolhida",
    event_date: todayIso(),
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    notes: "",
  };

  return {
    profile,
    prologue,
    dailyLog,
    agendaEvent,
    focus: focusFor(cycle, answers.focus),
    chapters,
    milestones,
    projects,
  };
}
