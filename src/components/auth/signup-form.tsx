import { ArrowLeft, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AccessFields,
  IdentityFields,
  RecoveryFields,
  StepHeader,
} from "@/components/auth/signup-blocks";
import {
  BLOCK_SEQUENCE,
  ENTRY_COPY,
  SIGNUP_BLOCKS,
  accessSummary,
  identitySummary,
  recoverySummary,
  type SignupBlockId,
} from "@/components/auth/copy";
import type { SignupDraftState } from "@/components/auth/use-signup-draft";

// ---------------------------------------------------------------------------
// Criar conta: os três passos ficam visíveis o tempo todo, com o resumo do que
// já foi preenchido. Só o passo atual abre os campos, então a altura da tela
// não muda conforme a pessoa avança. Quem guarda o rascunho é `useSignupDraft`.
// ---------------------------------------------------------------------------

const STEP_INDEX: Record<SignupBlockId, number> = { identity: 1, access: 2, recovery: 3 };

export function SignUpForm({
  draft,
  pending,
  onSubmit,
}: {
  draft: SignupDraftState;
  pending: boolean;
  onSubmit: () => void;
}) {
  const step = draft.step;
  const position = BLOCK_SEQUENCE.indexOf(step);
  const isLast = position === BLOCK_SEQUENCE.length - 1;

  const summaries: Record<SignupBlockId, string> = {
    identity: identitySummary(draft.name, draft.age, draft.progress.identity),
    access: accessSummary(draft.phone, draft.password, draft.progress.access),
    recovery: recoverySummary(draft.chosenQuestion, draft.progress.recovery),
  };

  // Enter no formulário avança o passo em vez de enviar um cadastro incompleto.
  const handleSubmit = () => {
    if (isLast) {
      onSubmit();
      return;
    }
    draft.setStep(BLOCK_SEQUENCE[position + 1] ?? step);
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {ENTRY_COPY.signup.title}
        </h2>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-faint">
          {draft.progress.completed} de {draft.progress.total}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{ENTRY_COPY.signup.subtitle}</p>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="entry-steps">
          {BLOCK_SEQUENCE.map((id) => {
            const block = SIGNUP_BLOCKS[id];
            const current = step === id;
            return (
              <div key={id} className={current ? "entry-step entry-step-current" : "entry-step"}>
                <button
                  type="button"
                  className="entry-step-button"
                  onClick={() => draft.setStep(id)}
                  aria-current={current ? "step" : undefined}
                >
                  <StepHeader
                    index={STEP_INDEX[id]}
                    title={block.title}
                    value={summaries[id]}
                    done={draft.progress[id]}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="entry-step-fields">
          <p className="mb-3 text-xs leading-5 text-faint">{SIGNUP_BLOCKS[step].description}</p>
          {step === "identity" && <IdentityFields draft={draft} />}
          {step === "access" && <AccessFields draft={draft} />}
          {step === "recovery" && <RecoveryFields draft={draft} />}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {position > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => draft.setStep(BLOCK_SEQUENCE[position - 1] ?? step)}
            >
              <ArrowLeft className="size-3.5" />
              Voltar
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isLast ? (
              <UserPlus className="size-4" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {isLast ? ENTRY_COPY.signup.submit : "Continuar"}
          </Button>
        </div>
      </form>
    </>
  );
}
