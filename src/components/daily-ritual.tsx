import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Moon, Sparkles, Sun, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUpsertDailyLog } from "@/hooks/use-daily-logs";
import type { DailyLog } from "@/types/profile";

// ---------------------------------------------------------------------------
// Ritual do dia — dois momentos, duas cerimônias.
//
// Manhã: definir a intenção (o que este dia precisa significar).
// Noite: reconhecer o que aconteceu e dar sentido (o resumo).
// Cada passo é curto de propósito: constância vence intensidade.
// ---------------------------------------------------------------------------

type Phase = "manha" | "noite";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log?: DailyLog | undefined;
  /** Força uma fase específica; `null` deixa o app escolher pelo estado do registro. */
  initialPhase?: Phase | null | undefined;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function phaseFor(log?: DailyLog): Phase {
  const hasSummary = Boolean(log?.summary_text.trim());
  const hasPlanned = Boolean(log?.planned_text.trim());
  if (hasPlanned && !hasSummary) return "noite";
  return "manha";
}

export function DailyRitual({ open, onOpenChange, log, initialPhase }: Props) {
  const upsert = useUpsertDailyLog();
  const [phase, setPhase] = useState<Phase>(initialPhase ?? "manha");
  const [step, setStep] = useState(0);
  const [planned, setPlanned] = useState("");
  const [executed, setExecuted] = useState("");
  const [summary, setSummary] = useState("");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Hidrata o rascunho com o registro existente (uma vez por abertura/fase).
  const key = `${open ? "open" : "closed"}:${log?.id ?? "novo"}:${initialPhase ?? "auto"}`;
  if (open && hydratedFor !== key) {
    setHydratedFor(key);
    setPhase(initialPhase ?? phaseFor(log));
    setStep(0);
    setPlanned(log?.planned_text ?? "");
    setExecuted(log?.executed_text ?? "");
    setSummary(log?.summary_text ?? "");
  }
  if (!open && hydratedFor !== null) setHydratedFor(null);

  const steps = useMemo(() => {
    if (phase === "manha") {
      return [
        {
          label: "A intenção",
          prompt: "O que este dia precisa significar?",
          hint: "Uma linha basta. O planejado orienta o resto do dia.",
          value: planned,
          set: setPlanned,
          placeholder: "Ex.: Avançar o capítulo 3 e ouvir alguém com atenção.",
        },
      ];
    }
    return [
      {
        label: "O que aconteceu",
        prompt: "O que de fato aconteceu hoje?",
        hint: "Sem julgamento — o executado documenta a vida real.",
        value: executed,
        set: setExecuted,
        placeholder: "Ex.: Escrevi duas páginas; a conversa rendeu uma ideia nova.",
      },
      {
        label: "O sentido",
        prompt: "O que este dia deixou?",
        hint: "Uma frase de interpretação. É isto que vira memória.",
        value: summary,
        set: setSummary,
        placeholder: "Ex.: Aprendi que começar pequeno sustenta o ritmo.",
      },
    ];
  }, [phase, planned, executed, summary]);

  const current = steps[Math.min(step, steps.length - 1)]!;
  const isLast = step === steps.length - 1;

  const save = () => {
    const base: DailyLog = log ?? {
      id: crypto.randomUUID(),
      log_date: todayIso(),
      planned_text: "",
      executed_text: "",
      summary_text: "",
      status: "OPEN",
      locked_at: null,
      created_at: new Date().toISOString(),
    };
    upsert.mutate(
      {
        ...base,
        planned_text: planned,
        executed_text: executed,
        summary_text: summary,
      },
      {
        onSuccess: () => {
          toast.success(
            phase === "manha" ? "Intenção registrada. Bom dia de trabalho." : "Dia preservado.",
          );
          onOpenChange(false);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Não foi possível salvar o registro."),
      },
    );
  };

  const advance = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    save();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atmosphere max-w-2xl gap-0 overflow-hidden p-0">
        <div className="border-b border-border px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className="status status-open">
              {phase === "manha" ? <Sun className="size-3" /> : <Moon className="size-3" />}
              {phase === "manha" ? "Ritual da manhã" : "Ritual da noite"}
            </span>
            <div className="ritual-track w-28">
              {steps.map((s, i) => (
                <span key={s.label} data-done={i < step} data-current={i === step} />
              ))}
            </div>
          </div>
          <DialogTitle className="mt-4 font-display text-2xl font-semibold text-foreground">
            {phase === "manha" ? "Começar o dia com intenção" : "Fechar o dia com sentido"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            {phase === "manha"
              ? "Uma pergunta. Depois você volta ao trabalho — o registro já está feito."
              : "Duas perguntas curtas transformam o dia em memória permanente."}
          </DialogDescription>
        </div>

        <div key={`${phase}-${step}`} className="reveal px-6 py-6 sm:px-8">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            {current.label}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
            {current.prompt}
          </h3>
          <p className="mt-1 text-xs text-faint">{current.hint}</p>
          <Textarea
            autoFocus
            value={current.value}
            onChange={(e) => current.set(e.target.value)}
            placeholder={current.placeholder}
            className="mt-4 min-h-28 text-sm leading-6"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) advance();
            }}
          />
          <p className="mt-2 text-[11px] text-faint">
            <kbd className="kbd">⌘</kbd> + <kbd className="kbd">Enter</kbd> para continuar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4 sm:px-8">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-3.5" />
              Voltar
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setPhase(phase === "manha" ? "noite" : "manha")}
              className="text-xs text-faint underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
            >
              {phase === "manha" ? "Já é noite? Fechar o dia →" : "Voltar para a manhã →"}
            </button>
          )}

          <Button className="ml-auto" onClick={advance} disabled={upsert.isPending}>
            {upsert.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isLast ? (
              <Check className="size-4" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {isLast ? (phase === "manha" ? "Registrar intenção" : "Preservar o dia") : "Continuar"}
          </Button>

          {!isLast && (
            <button
              type="button"
              onClick={advance}
              className="text-xs text-faint underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
            >
              Pular
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-6 py-3 text-[11px] text-faint sm:px-8">
          <Sparkles className="size-3" />
          Após salvar, o registro entra em validação e trava em 24h — vira história permanente.
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Convite sutil do topo do dashboard para abrir o ritual do dia. */
export function RitualInvite({
  log,
  onStart,
}: {
  log?: DailyLog | undefined;
  onStart: (p: Phase) => void;
}) {
  const hasPlanned = Boolean(log?.planned_text.trim());
  const hasSummary = Boolean(log?.summary_text.trim());

  const phase: Phase = hasPlanned && !hasSummary ? "noite" : "manha";
  const Icon = phase === "manha" ? Sunrise : Moon;

  return (
    <button
      type="button"
      onClick={() => onStart(phase)}
      className="card-interactive flex w-full items-center gap-4 text-left"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            {phase === "manha" ? "Ritual da manhã" : "Ritual da noite"}
          </span>
        </span>
        <span className="mt-1 block text-sm font-medium text-foreground">
          {phase === "manha"
            ? "Defina a intenção de hoje em uma frase"
            : "Feche o dia: o que aconteceu e o que ficou"}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-faint" />
    </button>
  );
}
