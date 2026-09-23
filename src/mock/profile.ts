import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

// ---------------------------------------------------------------------------
// Seed local — usado enquanto as credenciais Supabase não estão configuradas.
// Mantém a mesma forma dos dados que virão das tabelas SQL (Fases 3 e 4).
// ---------------------------------------------------------------------------

const TODAY = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
};

const isoToday = iso(TODAY);
const isoMinus1 = iso(daysAgo(1));
const isoMinus2 = iso(daysAgo(2));
const isoMinus5 = iso(daysAgo(5));

const createdNow = new Date().toISOString();
const createdHoursAgo = (h: number) => {
  const d = new Date(TODAY);
  d.setHours(d.getHours() - h);
  return d.toISOString();
};

export const profile: Profile = {
  id: "local-profile",
  name: "Ana Costa",
  role: "Pesquisadora de futuros humanos",
  location: "São Paulo, Brasil",
  initials: "AC",
  bio: "Investigo como escolhas, memória e tecnologia transformam vidas ao longo do tempo.",
  birth_date: "1992-03-14",
  target_lifespan: 100,
  avatar_url: null,
  cover_url: null,
};

export const dailyLogs: DailyLog[] = [
  {
    id: "log-today",
    log_date: isoToday,
    planned_text: "Revisar pesquisa sobre longevidade\nCaminhar no parque às 17h",
    executed_text: "Entrevista com o grupo de pesquisa concluída",
    summary_text:
      "Um dia ainda em construção. A conversa da manhã abriu uma nova hipótese para o estudo.",
    status: "OPEN",
    locked_at: null,
    created_at: createdNow,
  },
  {
    id: "log-yesterday",
    log_date: isoMinus1,
    planned_text: "Escrever duas páginas\nLigar para minha mãe",
    executed_text: "Escrevi três páginas\nJantar em família",
    summary_text: "Produzi mais do que esperava e terminei o dia perto de quem importa.",
    status: "VALIDATING",
    locked_at: null,
    created_at: createdHoursAgo(20),
  },
  {
    id: "log-two-days",
    log_date: isoMinus2,
    planned_text: "Revisar referências do capítulo 2",
    executed_text: "Arquivo organizado; três referências novas incorporadas",
    summary_text: "Ritmo constante. O capítulo ganhou estrutura.",
    status: "LOCKED",
    locked_at: createdHoursAgo(30),
    created_at: createdHoursAgo(55),
  },
  {
    id: "log-five-days",
    log_date: isoMinus5,
    planned_text: "Apresentar o projeto Memória Viva",
    executed_text: "Apresentação concluída\nConvite para nova parceria",
    summary_text: "Um marco profissional: a pesquisa deixou o caderno e encontrou outras pessoas.",
    status: "LOCKED",
    locked_at: createdHoursAgo(100),
    created_at: createdHoursAgo(126),
  },
];

export const weeklyFocus: WeeklyFocus[] = [
  {
    id: "wf-1",
    title: "Publicar Atlas da Memória",
    description: "Enviar o capítulo final para revisão externa.",
    week_number: currentWeek(),
    year: TODAY.getFullYear(),
    progress_pct: 68,
  },
  {
    id: "wf-2",
    title: "Rotina de escrita diária",
    description: "Duas páginas toda manhã, sem exceção.",
    week_number: currentWeek(),
    year: TODAY.getFullYear(),
    progress_pct: 44,
  },
  {
    id: "wf-3",
    title: "Registrar histórias da família",
    description: "Duas entrevistas gravadas até domingo.",
    week_number: currentWeek(),
    year: TODAY.getFullYear(),
    progress_pct: 75,
  },
];

function currentWeek(): number {
  const start = new Date(TODAY.getFullYear(), 0, 1);
  const diff = Math.floor((TODAY.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

export const careerChapters: CareerChapter[] = [
  {
    id: "ch-resume-1",
    title: "Instituto Horizonte",
    period: "2022 — hoje",
    document_type: "EXPERIENCE",
    content: "Pesquisadora líder em futuros humanos.",
  },
  {
    id: "ch-resume-2",
    title: "Observatório Urbano",
    period: "2018 — 2022",
    document_type: "EXPERIENCE",
    content: "Pesquisadora e documentarista.",
  },
  {
    id: "ch-edu-1",
    title: "USP",
    period: "2022 — 2024",
    document_type: "EDUCATION",
    content: "Mestrado em Antropologia Social.",
  },
  {
    id: "ch-edu-2",
    title: "UFMG",
    period: "2013 — 2017",
    document_type: "EDUCATION",
    content: "Comunicação Social.",
  },
];

export const projects: Project[] = [
  {
    name: "Atlas da Memória",
    description: "Arquivo narrativo de histórias familiares e lugares.",
    status: "Em andamento",
    progress: 68,
    objective: "Preservar 120 relatos até dezembro",
  },
  {
    name: "Cartas para 2040",
    description: "Ensaio sobre escolhas presentes e futuros possíveis.",
    status: "Pesquisa",
    progress: 42,
    objective: "Concluir a primeira versão",
  },
  {
    name: "Casa de Dentro",
    description: "Documentário sobre identidade, casa e pertencimento.",
    status: "Planejado",
    progress: 15,
    objective: "Finalizar roteiro e entrevistas",
  },
];

export const milestones: Milestone[] = [
  {
    year: "2026",
    title: "Pesquisa selecionada",
    description: "Atlas da Memória entrou no programa internacional de futuros humanos.",
    category: "Pesquisa",
  },
  {
    year: "2024",
    title: "Mestrado concluído",
    description: "Defesa da dissertação sobre memória coletiva e cidades.",
    category: "Formação",
  },
  {
    year: "2021",
    title: "Primeira exposição",
    description: "Curadoria de 42 relatos de moradores do centro de São Paulo.",
    category: "Cultura",
  },
  {
    year: "2018",
    title: "Uma nova cidade",
    description: "Mudança para São Paulo e início da trajetória em pesquisa.",
    category: "Vida",
  },
];

export const lifePrologue = `Nasci em 1992, numa manhã de verão, em uma família que sempre guardou histórias à mesa. Cresci entre livros, fotografias e viagens curtas pelo interior. Aos dezessete anos, mudei de cidade para estudar e descobri que os lugares também vivem dentro da gente.

Trabalhei, errei, recomecei. Conheci pessoas que mudaram a direção da minha vida, viajei por cidades que ainda aparecem nos meus sonhos e aprendi a olhar para o tempo não como uma linha, mas como uma coleção de escolhas. Em 2018 cheguei a São Paulo. Em 2024 concluí meu mestrado. Hoje começo este registro para que os próximos dias não desapareçam sem deixar sentido.

Este relatório reúne, com honestidade, tudo que consigo lembrar dos anos anteriores. Não pretende ser uma cronologia perfeita; é o ponto de partida da minha memória consciente.`;
