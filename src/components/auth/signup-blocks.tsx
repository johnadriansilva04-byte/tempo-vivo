import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AuthField, PasswordInput } from "@/components/auth/form";
import { FIELD_HINTS } from "@/components/auth/copy";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { formatPhone, normalizePhone } from "@/lib/identity";
import type { SignupDraftState } from "@/components/auth/use-signup-draft";

// ---------------------------------------------------------------------------
// Os três passos do cadastro, em duas camadas.
//
// `StepHeader` é a linha que fica sempre visível: número, título, o que aquele
// passo guarda e o resumo do que já foi preenchido. `*Fields` são os campos,
// montados só no passo atual. Separar as duas coisas é o que permite mostrar os
// três passos de uma vez sem que a tela cresça — o texto aparece, o campo espera.
// ---------------------------------------------------------------------------

/** Cabeçalho comum: número do passo, título e resumo do que já foi preenchido. */
export function StepHeader({
  index,
  title,
  value,
  done,
}: {
  index: number;
  title: string;
  value: string;
  done: boolean;
}) {
  return (
    <>
      <span className={done ? "entry-step-index entry-step-done" : "entry-step-index"}>
        {done ? <Check className="size-3" /> : index}
      </span>
      <span className="entry-step-heading">
        <span className="entry-step-title">{title}</span>
        <span className="entry-step-value">{value}</span>
      </span>
    </>
  );
}

export function IdentityFields({ draft }: { draft: SignupDraftState }) {
  return (
    <div className="space-y-3">
      <AuthField label="Nome completo">
        <Input
          value={draft.name}
          onChange={(e) => draft.setName(e.target.value)}
          placeholder={FIELD_HINTS.name}
          autoComplete="name"
        />
      </AuthField>
      <AuthField label="Idade">
        <Input
          type="number"
          min={1}
          max={120}
          value={draft.age}
          onChange={(e) => draft.setAge(e.target.value)}
          placeholder={FIELD_HINTS.age}
          autoComplete="off"
        />
      </AuthField>
    </div>
  );
}

export function AccessFields({ draft }: { draft: SignupDraftState }) {
  const mismatch = draft.confirm !== "" && draft.password !== draft.confirm;
  return (
    <div className="space-y-3">
      <AuthField label="Telefone">
        <Input
          value={formatPhone(draft.phone)}
          onChange={(e) => draft.setPhone(normalizePhone(e.target.value))}
          placeholder={FIELD_HINTS.phone}
          inputMode="tel"
          autoComplete="tel"
        />
      </AuthField>
      <div className="grid gap-3 sm:grid-cols-2">
        <AuthField label="Senha">
          <PasswordInput
            value={draft.password}
            onChange={draft.setPassword}
            show={draft.showPassword}
            onToggle={() => draft.setShowPassword((v) => !v)}
            placeholder={FIELD_HINTS.password}
            autoComplete="new-password"
          />
        </AuthField>
        <AuthField label="Confirmar senha">
          <PasswordInput
            value={draft.confirm}
            onChange={draft.setConfirm}
            show={draft.showPassword}
            onToggle={() => draft.setShowPassword((v) => !v)}
            placeholder={FIELD_HINTS.confirm}
            autoComplete="new-password"
          />
        </AuthField>
      </div>
      {mismatch && <p className="text-xs text-destructive">As senhas não conferem.</p>}
    </div>
  );
}

export function RecoveryFields({ draft }: { draft: SignupDraftState }) {
  return (
    <div className="space-y-3">
      <AuthField label="Pergunta secreta">
        <select
          value={draft.question}
          onChange={(e) => draft.setQuestion(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {RECOVERY_QUESTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
          <option value="">Escrever a minha própria…</option>
        </select>
      </AuthField>
      {draft.question === "" && (
        <Input
          value={draft.customQuestion}
          onChange={(e) => draft.setCustomQuestion(e.target.value)}
          placeholder={FIELD_HINTS.customQuestion}
        />
      )}
      <AuthField label="Resposta secreta">
        <Input
          value={draft.answer}
          onChange={(e) => draft.setAnswer(e.target.value)}
          placeholder={FIELD_HINTS.answer}
          autoComplete="off"
        />
      </AuthField>
    </div>
  );
}
