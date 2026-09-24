import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Feather,
  Loader2,
  MapPin,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeFirstRun } from "@/services/onboarding-service";
import { buildStarterLife, cycleForAge, EMPTY_ANSWERS } from "@/lib/life-story";
import { plural } from "@/lib/utils";
import type { StoryAnswers } from "@/lib/life-story";
import { useAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// "Primeiro Capítulo" — o ritual de primeira entrada.
//
// Em vez de criar um esqueleto cheio de [colchetes], o app faz quatro perguntas
// e escreve a primeira página com as palavras do próprio dono. Quem prefere
// silêncio pode pular cada passo ou começar do zero.
// ---------------------------------------------------------------------------

type StepId = "limiar" | "origem" | "caminho" | "sentido" | "frente" | "selar";

const GUIDED_STEPS: StepId[] = ["limiar", "origem", "caminho", "sentido", "frente", "selar"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const FIELD_FOR: Record<StepId, keyof StoryAnswers | null> = {
  limiar: null,
  origem: "origin",
  caminho: "journey",
  sentido: "intention",
  frente: "focus",
  selar: null,
};

const COPY: Record<StepId, { eyebrow: string; title: (name: string) => string; help: string }> = {
  limiar: {
    eyebrow: "Prólogo",
    title: (name) => `Bem-vindo, ${name}.`,
    help: "Antes de abrir o app, vamos escrever a primeira página da sua história. São quatro perguntas curtas — você pode pular qualquer uma e reescrever depois.",
  },
  origem: {
    eyebrow: "Capítulo I",
    title: () => "Onde a sua história começou?",
    help: "A cidade ou o território que viu os seus primeiros anos. É o marco zero da sua linha do tempo.",
  },
  caminho: {
    eyebrow: "Capítulo II",
    title: () => "O que te trouxe até aqui?",
    help: "Em poucas linhas: as pessoas, os lugares e as decisões que explicam onde você está hoje.",
  },
  sentido: {
    eyebrow: "Capítulo III",
    title: () => "O que você quer construir daqui em diante?",
    help: "Uma frase que define o sentido dos próximos ciclos. Ela vira a epígrafe do seu perfil.",
  },
  frente: {
    eyebrow: "Capítulo IV",
    title: () => "Qual frente recebe sua energia primeiro?",
    help: "A primeira coisa que você quer colocar em movimento. Ela vira um projeto e a meta da semana.",
  },
  selar: {
    eyebrow: "Selar",
    title: () => "Sua história está pronta para começar.",
    help: "É isto que vai existir no seu Perfil Vivo a partir de agora. Tudo é editável — nada é definitivo.",
  },
};

export function StartLifeFlow() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<StoryAnswers>(EMPTY_ANSWERS);
  const [pending, setPending] = useState<"guided" | "blank" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = GUIDED_STEPS[stepIndex] ?? "limiar";

  const preview = useMemo(() => {
    if (!account) return null;
    return buildStarterLife(account, "guided", answers);
  }, [account, answers]);

  if (!account) return null;
  const cycle = cycleForAge(account.age);
  const firstName = account.name.split(" ")[0] ?? account.name;

  const set = (key: keyof StoryAnswers, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const run = async (preset: "guided" | "blank") => {
    setPending(preset);
    setError(null);
    try {
      await completeFirstRun(preset, preset === "guided" ? answers : EMPTY_ANSWERS);
      await navigate({ to: preset === "guided" ? "/" : "/configuracoes" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar sua história.");
      setPending(null);
    }
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, GUIDED_STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));
  const skip = () => {
    const field = FIELD_FOR[step];
    if (field) set(field, "");
    next();
  };

  return (
    <div className="atmosphere min-h-screen">
      <div className="ritual-stage">
        {/* Cabeçalho do ritual */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="brand-mark">
              <Feather className="size-4" />
            </span>
            <span className="font-ui text-sm font-semibold text-foreground">Perfil Vivo</span>
          </div>
          <div className="ritual-track w-40 sm:w-56">
            {GUIDED_STEPS.map((s, i) => (
              <span
                key={s}
                data-done={i < stepIndex}
                data-current={i === stepIndex}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div key={step} className="reveal">
          <div className="flex items-center gap-3">
            {step !== "limiar" && <span className="chapter-mark">{ROMAN[stepIndex - 1]}</span>}
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              {COPY[step].eyebrow}
            </p>
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            {COPY[step].title(firstName)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            {COPY[step].help}
          </p>

          {step === "limiar" && (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-faint">
                <span className="status status-open">
                  <Sparkles className="size-3" />
                  Ciclo {cycle.index + 1} · {cycle.name}
                </span>
                <span>
                  {account.age} anos · {cycle.range} anos
                </span>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <article className="card-interactive flex flex-col">
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-accent-foreground">
                    Recomendado
                  </span>
                  <h2 className="mt-3 font-display text-lg font-semibold">
                    Escrever minha primeira página
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                    Quatro perguntas curtas e o app monta seu prólogo, sua agenda, suas metas,
                    capítulos, marcos e o primeiro projeto — com as suas palavras.
                  </p>
                  <Button className="mt-5 w-fit" onClick={next}>
                    <Feather className="size-3.5" />
                    Começar o ritual
                  </Button>
                </article>

                <article className="card-interactive flex flex-col">
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                    Sem pressa
                  </span>
                  <h2 className="mt-3 font-display text-lg font-semibold">Começar do zero</h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                    Só o essencial: seu nome e a data de nascimento. Você escreve cada parte no seu
                    ritmo, quando quiser.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5 w-fit"
                    onClick={() => run("blank")}
                    disabled={pending !== null}
                  >
                    {pending === "blank" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <PenLine className="size-3.5" />
                    )}
                    Escrever do zero
                  </Button>
                </article>
              </div>
            </>
          )}

          {step === "origem" && (
            <RitualField icon={MapPin} label="Cidade de origem">
              <Input
                autoFocus
                value={answers.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder="Ex.: Recife, Pernambuco"
                className="h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
            </RitualField>
          )}

          {step === "caminho" && (
            <RitualField icon={Compass} label="Sua trajetória até aqui">
              <Textarea
                autoFocus
                value={answers.journey}
                onChange={(e) => set("journey", e.target.value)}
                placeholder="Ex.: Cresci entre mudanças de cidade. Aos 20 fui trabalhar com…, e foi ali que aprendi…"
                className="min-h-32 text-sm leading-6"
              />
            </RitualField>
          )}

          {step === "sentido" && (
            <RitualField icon={Target} label="Seu sentido">
              <Textarea
                autoFocus
                value={answers.intention}
                onChange={(e) => set("intention", e.target.value)}
                placeholder="Ex.: Tornar o cuidado próximo e legível para quem mais precisa."
                className="min-h-24 text-sm leading-6"
              />
            </RitualField>
          )}

          {step === "frente" && (
            <RitualField icon={BookOpen} label="Primeira frente">
              <Input
                autoFocus
                value={answers.focus}
                onChange={(e) => set("focus", e.target.value)}
                placeholder="Ex.: Escrever o primeiro capítulo do livro"
                className="h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
            </RitualField>
          )}

          {step === "selar" && preview && (
            <div className="mt-8 space-y-6">
              {answers.intention.trim() !== "" && (
                <blockquote className="epigraph">“{answers.intention.trim()}”</blockquote>
              )}

              <div className="rounded-lg border border-border bg-card p-5">
                <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                  Seu prólogo
                </p>
                <div className="mt-3 space-y-3">
                  {preview.prologue.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="text-sm leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SealCount
                  value={preview.focus.length}
                  label={plural(preview.focus.length, "meta da semana", "metas da semana")}
                />
                <SealCount
                  value={preview.chapters.length}
                  label={plural(
                    preview.chapters.length,
                    "capítulo de currículo",
                    "capítulos de currículo",
                  )}
                />
                <SealCount
                  value={preview.milestones.length}
                  label={plural(
                    preview.milestones.length,
                    "marco na linha do tempo",
                    "marcos na linha do tempo",
                  )}
                />
              </div>
              <p className="text-xs text-faint">
                Mais a agenda de hoje,{" "}
                {plural(
                  preview.projects.length,
                  "1 projeto",
                  `${preview.projects.length} projetos`,
                )}{" "}
                e o seu perfil — tudo editável a qualquer momento.
              </p>
            </div>
          )}

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

          {/* Controles do ritual */}
          {step !== "limiar" && (
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button variant="ghost" size="sm" onClick={back} disabled={pending !== null}>
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>

              {step === "selar" ? (
                <Button onClick={() => run("guided")} disabled={pending !== null}>
                  {pending === "guided" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Abrir meu Perfil Vivo
                </Button>
              ) : (
                <Button onClick={next} disabled={pending !== null}>
                  Continuar
                  <ArrowRight className="size-3.5" />
                </Button>
              )}

              {step !== "selar" && (
                <button
                  type="button"
                  onClick={skip}
                  className="ml-auto text-xs text-faint underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
                >
                  Pular esta pergunta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RitualField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 max-w-2xl space-y-2">
      <Label className="flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        <Icon className="size-3.5" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function SealCount({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <p className="ink-number text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
