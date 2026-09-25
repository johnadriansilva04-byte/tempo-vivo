import { Feather, Loader2, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/components/onboarding/copy";
import type { Cycle } from "@/lib/life-story";

// ---------------------------------------------------------------------------
// Limiar: a bifurcação da primeira entrada.
//
// Dois caminhos, dois botões. Quem tem tempo escolhe o ritual; quem não tem
// escreve do zero. A diferença é dita em termos do que a pessoa recebe.
// ---------------------------------------------------------------------------

export function Threshold({
  firstName,
  age,
  cycle,
  pending,
  onGuided,
  onBlank,
}: {
  firstName: string;
  age: number;
  cycle: Cycle;
  pending: "guided" | "blank" | null;
  onGuided: () => void;
  onBlank: () => void;
}) {
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-faint">
        <span className="status status-open">
          <Sparkles className="size-3" />
          Ciclo {cycle.index + 1} · {cycle.name}
        </span>
        <span>
          {age} anos · {cycle.range} anos
        </span>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <PathCard
          badge={PATHS.guided.badge}
          badgeTone="accent"
          title={PATHS.guided.title}
          body={PATHS.guided.body}
          action={
            <Button className="mt-5 w-fit" onClick={onGuided}>
              <Feather className="size-3.5" />
              {PATHS.guided.cta}
            </Button>
          }
        />

        <PathCard
          badge={PATHS.blank.badge}
          badgeTone="faint"
          title={PATHS.blank.title}
          body={PATHS.blank.body}
          action={
            <Button
              variant="outline"
              className="mt-5 w-fit"
              onClick={onBlank}
              disabled={pending !== null}
            >
              {pending === "blank" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PenLine className="size-3.5" />
              )}
              {PATHS.blank.cta}
            </Button>
          }
        />
      </div>

      <p className="mt-6 text-xs text-faint">
        {firstName}, os dois caminhos levam ao mesmo Perfil Vivo. Um chega mais rápido.
      </p>
    </>
  );
}

function PathCard({
  badge,
  badgeTone,
  title,
  body,
  action,
}: {
  badge: string;
  badgeTone: "accent" | "faint";
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <article className="card-interactive flex flex-col">
      <span
        className={`font-display text-xs font-semibold uppercase tracking-[0.12em] ${
          badgeTone === "accent" ? "text-accent-foreground" : "text-faint"
        }`}
      >
        {badge}
      </span>
      <h2 className="mt-3 font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{body}</p>
      {action}
    </article>
  );
}
