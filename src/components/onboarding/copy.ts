import { BookOpen, Compass, MapPin, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StoryAnswers } from "@/lib/life-story";

// ---------------------------------------------------------------------------
// Copy e estrutura do primeiro capítulo.
//
// Quatro perguntas, e o app escreve a primeira página. O texto promete o que a
// pessoa ganha (uma história que já existe no minuto seguinte) e nunca descreve
// a mecânica interna. As perguntas vivem num mapa data-driven: acrescentar uma
// etapa é acrescentar uma entrada aqui, não um bloco de JSX.
// ---------------------------------------------------------------------------

export type StepId = "limiar" | "origem" | "caminho" | "sentido" | "frente" | "selar";

export const GUIDED_STEPS: StepId[] = ["limiar", "origem", "caminho", "sentido", "frente", "selar"];

/** Numeral romano de cada capítulo; o limiar e o selo não têm. */
export const ROMAN_BY_INDEX = ["", "I", "II", "III", "IV", ""];

export type StepCopy = {
  eyebrow: string;
  title: (firstName: string) => string;
  help: string;
};

export const COPY: Record<StepId, StepCopy> = {
  limiar: {
    eyebrow: "Primeiro capítulo",
    title: (name) => `Bem-vindo, ${name}.`,
    help: "Sua história começa agora. Quatro perguntas curtas e o app escreve a primeira página — com as suas palavras, no seu ritmo.",
  },
  origem: {
    eyebrow: "Capítulo I",
    title: () => "Onde a sua história começou?",
    help: "A cidade ou o território dos seus primeiros anos. É o marco zero da sua linha do tempo.",
  },
  caminho: {
    eyebrow: "Capítulo II",
    title: () => "O que te trouxe até aqui?",
    help: "As pessoas, os lugares e as decisões que explicam onde você está hoje.",
  },
  sentido: {
    eyebrow: "Capítulo III",
    title: () => "O que você quer construir daqui em diante?",
    help: "Uma frase. Ela vira a epígrafe do seu perfil.",
  },
  frente: {
    eyebrow: "Capítulo IV",
    title: () => "Qual frente recebe sua energia primeiro?",
    help: "A primeira coisa que você quer colocar em movimento. Vira um projeto e a meta da semana.",
  },
  selar: {
    eyebrow: "Selar",
    title: () => "Sua história está pronta para começar.",
    help: "É isto que passa a existir no seu Perfil Vivo. Tudo editável — nada definitivo.",
  },
};

/** Definição de uma pergunta: o campo e o que ele vira na história. */
export type QuestionStep = {
  id: Extract<StepId, "origem" | "caminho" | "sentido" | "frente">;
  field: keyof StoryAnswers;
  icon: LucideIcon;
  label: string;
  placeholder: string;
  multiline: boolean;
};

export const QUESTION_STEPS: QuestionStep[] = [
  {
    id: "origem",
    field: "origin",
    icon: MapPin,
    label: "Cidade de origem",
    placeholder: "Ex.: Recife, Pernambuco",
    multiline: false,
  },
  {
    id: "caminho",
    field: "journey",
    icon: Compass,
    label: "Sua trajetória até aqui",
    placeholder:
      "Ex.: Cresci entre mudanças de cidade. Aos 20 fui trabalhar com…, e foi ali que aprendi…",
    multiline: true,
  },
  {
    id: "sentido",
    field: "intention",
    icon: Target,
    label: "Seu sentido",
    placeholder: "Ex.: Tornar o cuidado próximo e legível para quem mais precisa.",
    multiline: true,
  },
  {
    id: "frente",
    field: "focus",
    icon: BookOpen,
    label: "Primeira frente",
    placeholder: "Ex.: Escrever o primeiro capítulo do livro",
    multiline: false,
  },
];

export function questionStepFor(step: StepId): QuestionStep | undefined {
  return QUESTION_STEPS.find((q) => q.id === step);
}

export function fieldForStep(step: StepId): keyof StoryAnswers | null {
  return questionStepFor(step)?.field ?? null;
}

/** Os dois caminhos do limiar, com o que cada um entrega. */
export const PATHS = {
  guided: {
    badge: "Recomendado",
    title: "Escrever minha primeira página",
    body: "Quatro perguntas e o app monta seu prólogo, sua agenda, suas metas, capítulos, marcos e o primeiro projeto — com as suas palavras.",
    cta: "Começar o ritual",
    loading: "Montando sua história…",
  },
  blank: {
    badge: "Sem pressa",
    title: "Começar do zero",
    body: "Só o essencial: seu nome e a data de nascimento. Você escreve cada parte no seu ritmo.",
    cta: "Escrever do zero",
    loading: "Preparando o essencial…",
  },
} as const;
