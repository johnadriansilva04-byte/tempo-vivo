import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/identity";
import { AuthError, AuthField, PasswordInput } from "@/components/auth/form";

/** Etapas da recuperação: identificar o telefone, responder, definir a senha. */
export type RecoveryStep = "telefone" | "resposta" | "nova-senha";

// ---------------------------------------------------------------------------
// Recuperação de senha em três passos, guiada por telefone + pergunta secreta.
// O componente é burro de propósito: recebe estado e callbacks, não chama API.
// ---------------------------------------------------------------------------
export function RecoveryPanel({
  step,
  pending,
  error,
  phone,
  question,
  answer,
  newPassword,
  showPassword,
  onToggleShow,
  onPhone,
  onAnswer,
  onNewPassword,
  onFindQuestion,
  onCheckAnswer,
  onApplyPassword,
  onRestart,
  onBackToLogin,
}: {
  step: RecoveryStep;
  pending: boolean;
  error: string | null;
  phone: string;
  question: string | null;
  answer: string;
  newPassword: string;
  showPassword: boolean;
  onToggleShow: () => void;
  onPhone: (v: string) => void;
  onAnswer: (v: string) => void;
  onNewPassword: (v: string) => void;
  onFindQuestion: () => void;
  onCheckAnswer: () => void;
  onApplyPassword: () => void;
  onRestart: () => void;
  onBackToLogin: () => void;
}) {
  const stepIndex = step === "telefone" ? 0 : step === "resposta" ? 1 : 2;

  return (
    <>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
        <KeyRound className="size-3.5" /> Recuperar acesso
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
        {step === "telefone" && "Vamos achar sua conta"}
        {step === "resposta" && "Responda sua pergunta"}
        {step === "nova-senha" && "Escolha a nova senha"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {step === "telefone" &&
          "Informe o telefone cadastrado. A pergunta secreta que você escolheu vai aparecer em seguida."}
        {step === "resposta" &&
          "Não precisa acertar maiúsculas, acentos ou espaços — só o conteúdo."}
        {step === "nova-senha" &&
          "Sua identidade foi confirmada. Defina uma senha nova para voltar à sua história."}
      </p>

      <div className="mt-5 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "telefone") onFindQuestion();
          else if (step === "resposta") onCheckAnswer();
          else onApplyPassword();
        }}
      >
        {step === "telefone" && (
          <AuthField label="Telefone">
            <Input
              value={formatPhone(phone)}
              onChange={(e) => onPhone(e.target.value)}
              placeholder="(11) 98765-4321"
              inputMode="tel"
              autoComplete="tel"
            />
          </AuthField>
        )}

        {step === "resposta" && (
          <>
            <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
              {question}
            </div>
            <AuthField label="Sua resposta">
              <Input
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                placeholder="Escreva a resposta que você cadastrou"
                autoComplete="off"
              />
            </AuthField>
          </>
        )}

        {step === "nova-senha" && (
          <AuthField label="Nova senha">
            <PasswordInput
              value={newPassword}
              onChange={onNewPassword}
              show={showPassword}
              onToggle={onToggleShow}
              placeholder="Mínimo de 4 caracteres"
              autoComplete="new-password"
            />
          </AuthField>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : step === "nova-senha" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {step === "telefone" && "Continuar"}
          {step === "resposta" && "Confirmar resposta"}
          {step === "nova-senha" && "Salvar senha e entrar"}
        </Button>
      </form>

      {error && <AuthError message={error} />}

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={step === "telefone" ? onBackToLogin : onRestart}
          className="flex items-center gap-1.5 font-medium text-faint transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {step === "telefone" ? "Voltar para o login" : "Começar de novo"}
        </button>
        <button
          type="button"
          onClick={onBackToLogin}
          className="font-medium text-primary transition-colors hover:text-foreground"
        >
          Entrar
        </button>
      </div>
    </>
  );
}
