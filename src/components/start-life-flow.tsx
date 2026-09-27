import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Feather, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeFirstRun } from "@/services/onboarding-service";
import { buildStarterLife, cycleForAge, EMPTY_ANSWERS } from "@/lib/life-story";
import { useAuth } from "@/hooks/use-auth";
import {
  COPY,
  GUIDED_STEPS,
  ROMAN_BY_INDEX,
  fieldForStep,
  questionStepFor,
} from "@/components/onboarding/copy";
import { RitualQuestion } from "@/components/onboarding/ritual-question";
import { SealPreview } from "@/components/onboarding/seal-preview";
import { Threshold } from "@/components/onboarding/threshold";
import type { StoryAnswers } from "@/lib/life-story";

// ---------------------------------------------------------------------------
// "Primeiro capítulo" — o ritual de primeira entrada.
//
// Seis telas: o limiar, quatro perguntas e o selo. Cada tela é uma decisão.
// Esta função só conduz o percurso: qual pergunta mostrar, o que guardar e
// quando selar. O texto mora em `copy.ts`, as telas em seus próprios arquivos.
// ---------------------------------------------------------------------------

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

  const next = () => setStepIndex((i) => Math.min(i + 1, GUIDED_STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));
  const skip = () => {
    const field = fieldForStep(step);
    if (field) set(field, "");
    next();
  };

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

  const question = questionStepFor(step);
  const copy = COPY[step];
  const roman = ROMAN_BY_INDEX[stepIndex] ?? "";

  return (
    <div className="atmosphere min-h-screen">
      <div className="ritual-stage">
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
            {roman !== "" && <span className="chapter-mark">{roman}</span>}
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              {copy.eyebrow}
            </p>
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            {copy.title(firstName)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{copy.help}</p>

          {step === "limiar" && (
            <Threshold
              firstName={firstName}
              age={account.age}
              cycle={cycle}
              pending={pending}
              onGuided={next}
              onBlank={() => void run("blank")}
            />
          )}

          {question && (
            <RitualQuestion
              step={question}
              value={answers[question.field]}
              onChange={(v) => set(question.field, v)}
              onSubmitKey={next}
            />
          )}

          {step === "selar" && preview && (
            <SealPreview intention={answers.intention} preview={preview} />
          )}

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

          {step !== "limiar" && (
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button variant="ghost" size="sm" onClick={back} disabled={pending !== null}>
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>

              {step === "selar" ? (
                <Button onClick={() => void run("guided")} disabled={pending !== null}>
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
