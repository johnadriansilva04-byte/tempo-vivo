import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  recoveryQuestionFor,
  resetPasswordWithToken,
  signIn,
  signUp,
  verifyRecoveryAnswer,
} from "@/hooks/use-auth";
import { normalizePhone } from "@/lib/identity";
import { AuthError } from "@/components/auth/form";
import { PitchCompact, PitchPanel } from "@/components/auth/pitch-panel";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { RecoveryPanel } from "@/components/auth/recovery-panel";
import { useSignupDraft } from "@/components/auth/use-signup-draft";
import type { RecoveryStep } from "@/components/auth/recovery-panel";

type Mode = "entrar" | "criar" | "recuperar";

/**
 * Porta de entrada do app. Três caminhos — criar, entrar, recuperar — e nenhum
 * outro. A tela só orquestra: o cadastro vive em `useSignupDraft`, o login e a
 * recuperação têm seu próprio componente, e a apresentação é `PitchPanel`.
 *
 * Em telas largas tudo cabe na primeira dobra: apresentação à esquerda, entrada
 * à direita, sem rolagem. As abas ficam sempre no topo do cartão, então entrar e
 * criar conta continuam a um clique mesmo no meio da recuperação.
 */
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("criar");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useSignupDraft();
  const [password, setPassword] = useState("");

  // Recuperação: telefone → resposta → nova senha.
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("telefone");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState<string | null>(null);
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submitSignup = async () => {
    setPending(true);
    setError(null);
    try {
      if (draft.password !== draft.confirm) {
        setError("As senhas não conferem.");
        return;
      }
      const result = await signUp({
        name: draft.name,
        age: Number(draft.age),
        phone: draft.phone,
        password: draft.password,
        recovery_question: draft.chosenQuestion,
        recovery_answer: draft.answer,
      });
      if (!result.ok) setError(result.error);
    } finally {
      setPending(false);
    }
  };

  const submitSignin = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await signIn({ phone: draft.phone, password });
      if (!result.ok) setError(result.error);
    } finally {
      setPending(false);
    }
  };

  // ------------------------------------------------ recuperação, passo 1 de 3
  const findQuestion = async () => {
    setPending(true);
    setError(null);
    try {
      const found = await recoveryQuestionFor(recoveryPhone);
      if (!found) {
        setError("Não achamos essa conta. Confira o número ou crie a sua história.");
        return;
      }
      setRecoveryQuestion(found);
      setRecoveryStep("resposta");
    } finally {
      setPending(false);
    }
  };

  // ------------------------------------------------ recuperação, passo 2 de 3
  const checkAnswer = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await verifyRecoveryAnswer(recoveryPhone, recoveryAnswer);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecoveryToken(result.token);
      setRecoveryStep("nova-senha");
    } finally {
      setPending(false);
    }
  };

  // ------------------------------------------------ recuperação, passo 3 de 3
  const applyNewPassword = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await resetPasswordWithToken(recoveryToken, newPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Entra direto com a senha nova: a pessoa acabou de provar quem é.
      const signInResult = await signIn({ phone: recoveryPhone, password: newPassword });
      if (!signInResult.ok) {
        switchMode("entrar");
        draft.setPhone(recoveryPhone);
        setPassword(newPassword);
        setError("Senha trocada. Entre com a senha nova.");
      }
    } finally {
      setPending(false);
    }
  };

  const restartRecovery = () => {
    setRecoveryStep("telefone");
    setRecoveryQuestion(null);
    setRecoveryAnswer("");
    setRecoveryToken("");
    setNewPassword("");
    setError(null);
  };

  return (
    <div className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[1fr_1.15fr] lg:overflow-hidden">
      <PitchPanel />

      <section className="flex min-h-0 items-center justify-center overflow-y-auto px-5 py-6 sm:px-8 lg:py-8">
        <div className="flex w-full max-w-md flex-col" data-auth-card>
          <div className="mb-5 lg:hidden">
            <PitchCompact />
          </div>

          <Tabs
            value={mode === "recuperar" ? "entrar" : mode}
            onValueChange={(v) => switchMode(v as Mode)}
            className="mb-5"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "recuperar" ? (
            <RecoveryPanel
              step={recoveryStep}
              pending={pending}
              error={error}
              phone={recoveryPhone}
              question={recoveryQuestion}
              answer={recoveryAnswer}
              newPassword={newPassword}
              showPassword={draft.showPassword}
              onToggleShow={() => draft.setShowPassword((v) => !v)}
              onPhone={(v) => setRecoveryPhone(normalizePhone(v))}
              onAnswer={setRecoveryAnswer}
              onNewPassword={setNewPassword}
              onFindQuestion={() => void findQuestion()}
              onCheckAnswer={() => void checkAnswer()}
              onApplyPassword={() => void applyNewPassword()}
              onRestart={restartRecovery}
              onBackToLogin={() => switchMode("entrar")}
            />
          ) : mode === "criar" ? (
            <>
              <SignUpForm draft={draft} pending={pending} onSubmit={() => void submitSignup()} />
              {error && <AuthError message={error} />}
            </>
          ) : (
            <>
              <SignInForm
                phone={draft.phone}
                password={password}
                showPassword={draft.showPassword}
                pending={pending}
                onPhone={draft.setPhone}
                onPassword={setPassword}
                onTogglePassword={() => draft.setShowPassword((v) => !v)}
                onSubmit={() => void submitSignin()}
                onForgot={() => {
                  setRecoveryPhone(draft.phone);
                  switchMode("recuperar");
                }}
              />
              {error && <AuthError message={error} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
