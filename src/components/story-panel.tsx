import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useWeeklyFocus } from "@/hooks/use-weekly-focus";
import { useCareerChapters } from "@/hooks/use-career-chapters";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { usePrologue } from "@/hooks/use-prologue";
import { computeStoryProgress } from "@/lib/story-progress";

const R = 26;
const CIRC = 2 * Math.PI * R;

/** Anel de progresso: quanto da história já existe de verdade no banco. */
function StoryRing({ pct }: { pct: number }) {
  return (
    <div className="story-ring">
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        className="story-ring-svg"
        role="img"
        aria-label={`${pct}% da história preenchida`}
      >
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--muted)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC - (CIRC * pct) / 100}
          transform="rotate(-90 32 32)"
          style={{
            filter: "drop-shadow(0 0 5px color-mix(in oklab, var(--primary) 45%, transparent))",
          }}
        />
      </svg>
      <div className="story-ring-center">
        <strong>{pct}%</strong>
        <span>história</span>
      </div>
    </div>
  );
}

/**
 * Painel "Monte sua história": mostra o que já foi escrito e o que falta.
 * Cada passo é derivado de dados reais — nada aqui é decorativo.
 */
export function StoryPanel({ onStartRitual }: { onStartRitual?: () => void }) {
  const { profile } = useProfile();
  const { logs } = useDailyLogs();
  const { focus } = useWeeklyFocus();
  const { chapters } = useCareerChapters();
  const { milestones } = useMilestones();
  const { projects } = useProjects();
  const { prologue } = usePrologue();

  const progress = computeStoryProgress({
    profile,
    prologue,
    logs,
    focus,
    chapters,
    milestones,
    projects,
  });

  const next = progress.nextStep;
  if (progress.complete) {
    return (
      <div className="quiet-panel sweep-once">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Sua história está completa
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Todos os fundamentos existem. Daqui em diante, é manter o registro vivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-5">
        <StoryRing pct={progress.pct} />
        <div className="min-w-0 flex-1">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            Monte sua história
          </p>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">
            {progress.doneCount} de {progress.total} fundamentos
          </h3>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Cada parte é escrita por você. Comece pelo próximo passo — leva menos de um minuto.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {progress.steps.map((s) => {
          const isNext = next?.id === s.id;
          const content = (
            <>
              <span
                className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-transparent"
                }`}
              >
                {s.done ? <Check className="size-2.5" /> : <Circle className="size-2.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    s.done
                      ? "text-muted-foreground line-through decoration-border"
                      : "text-foreground"
                  }`}
                >
                  {s.title}
                </span>
                {!s.done && <span className="mt-0.5 block text-xs text-faint">{s.hint}</span>}
              </span>
              {isNext && <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />}
            </>
          );

          if (s.done) {
            return (
              <li key={s.id}>
                <div className="story-step story-step-done">{content}</div>
              </li>
            );
          }

          if (s.action === "ritual" && onStartRitual) {
            return (
              <li key={s.id}>
                <button type="button" onClick={onStartRitual} className="story-step">
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={s.id}>
              <Link to={s.to} className="story-step">
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
