import { ArrowRight, LogIn, ShieldQuestion, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disclosure } from "@/components/ui/disclosure";
import { AuthField, PasswordInput } from "@/components/auth/form";
import {
  FIELD_HINTS,
  NEXT_BLOCK_LABEL,
  SIGNUP_BLOCKS,
  accessSummary,
  identitySummary,
  recoverySummary,
} from "@/components/auth/copy";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { formatPhone, normalizePhone } from "@/lib/identity";
import type { SignupDraftState } from "@/components/auth/use-signup-draft";

// ---------------------------------------------------------------------------
// Os três blocos do cadastro. Cada um é burro: recebe o rascunho e devolve
// mudanças. Fechado, cada bloco ainda conta o que já foi preenchido — a tela
// mostra a estrutura da história antes de mostrar o formulário.
// ---------------------------------------------------------------------------

type BlockProps = {
  draft: SignupDraftState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvance: () => void;
};

function advanceButton(onClick: () => void, label: string) {
  return (
    <Button type="button" variant="secondary" size="sm" className="w-full" onClick={onClick}>
      {label}
      <ArrowRight className="size-3.5" />
    </Button>
  );
}

export function IdentityBlock({ draft, open, onOpenChange, onAdvance }: BlockProps) {
  const done = draft.progress.identity;
  return (
    <Disclosure
      icon={UserPlus}
      title={SIGNUP_BLOCKS.identity.title}
      description={SIGNUP_BLOCKS.identity.description}
      badge={done ? "Pronto" : "1/3"}
      summary={identitySummary(draft.name, draft.age, done)}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
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
        {advanceButton(onAdvance, NEXT_BLOCK_LABEL.identity)}
      </div>
    </Disclosure>
  );
}

export function AccessBlock({ draft, open, onOpenChange, onAdvance }: BlockProps) {
  const done = draft.progress.access;
  const mismatch = draft.confirm !== "" && draft.password !== draft.confirm;
  return (
    <Disclosure
      icon={LogIn}
      title={SIGNUP_BLOCKS.access.title}
      description={SIGNUP_BLOCKS.access.description}
      badge={done ? "Pronto" : "2/3"}
      summary={accessSummary(draft.phone, draft.password, done)}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        <AuthField label="Telefone">
          <Input
            value={formatPhone(draft.phone)}
            onChange={(e) => draft.setPhone(normalizePhone(e.target.value))}
            placeholder={FIELD_HINTS.phone}
            inputMode="tel"
            autoComplete="tel"
          />
        </AuthField>
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
        {mismatch && <p className="text-xs text-destructive">As senhas não conferem.</p>}
        {advanceButton(onAdvance, NEXT_BLOCK_LABEL.access)}
      </div>
    </Disclosure>
  );
}

export function RecoveryBlock({ draft, open, onOpenChange }: BlockProps) {
  const done = draft.progress.recovery;
  return (
    <Disclosure
      icon={ShieldQuestion}
      title={SIGNUP_BLOCKS.recovery.title}
      description={SIGNUP_BLOCKS.recovery.description}
      badge={done ? "Pronto" : "3/3"}
      summary={recoverySummary(draft.chosenQuestion, done)}
      open={open}
      onOpenChange={onOpenChange}
    >
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
    </Disclosure>
  );
}
