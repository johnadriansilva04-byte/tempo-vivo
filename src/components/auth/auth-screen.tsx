import { useState } from "react";
import { Activity, ArrowRight, Loader2, LogIn, ShieldQuestion, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  recoveryQuestionFor,
  resetPasswordWithToken,
  signIn,
  signUp,
  verifyRecoveryAnswer,
} from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPhone, normalizePhone } from "@/lib/identity";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { AuthError, AuthField, PasswordInput } from "@/components/auth/form";
import { RecoveryPanel } from "@/components/auth/recovery-panel";
import type { RecoveryStep } from "@/components/auth/recovery-panel";

type Mode = "entrar" | "criar" | "recuperar";

const pitch = [
  "Uma conta por telefone e senha — simples como deve ser.",
  "Nome e idade definem o ponto de partida da sua linha do tempo.",
  "Na primeira entrada, o app cria a base da sua história para você editar.",
];

/** Porta de entrada do app: entrar, criar conta ou recuperar a senha. */
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("criar");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [question, setQuestion] = useState<string>(RECOVERY_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // Recuperação
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

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      if (mode === "criar") {
        if (password !== confirm) {
          setError("As senhas não conferem.");
          return;
        }
        const chosen = customQuestion.trim() || question;
        const result = await signUp({
          name,
          age: Number(age),
          phone,
          password,
          recovery_question: chosen,
          recovery_answer: answer,
        });
        if (!result.ok) setError(result.error);
      } else if (mode === "entrar") {
        const result = await signIn({ phone, password });
        if (!result.ok) setError(result.error);
      }
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
        setError(
          "Não encontramos uma pergunta secreta para este telefone. Confira o número ou crie sua conta.",
        );
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
        setPhone(recoveryPhone);
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Apresentação */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:p-14">
        <div className="profile-banner-default absolute inset-0 opacity-60" />
        <div className="relative flex items-center gap-2.5">
          <span className="brand-mark">
            <Activity className="size-4" />
          </span>
          <span className="font-display text-sm font-semibold text-foreground">Perfil Vivo</span>
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
            Trajetória viva
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground">
            A sua vida registrada dia a dia — e sempre sua.
          </h1>
          <ul className="mt-8 space-y-4">
            {pitch.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs leading-5 text-faint">
          {isSupabaseConfigured
            ? "Sua conta e sua história ficam no seu banco Supabase, isoladas por usuário. Nada é compartilhado com outras contas."
            : "Seus registros ficam no seu próprio navegador enquanto o app roda sem servidor configurado. Nada é publicado."}
        </p>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="brand-mark">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold text-foreground">Perfil Vivo</span>
          </div>

          {mode === "recuperar" ? (
            <RecoveryPanel
              step={recoveryStep}
              pending={pending}
              error={error}
              phone={recoveryPhone}
              question={recoveryQuestion}
              answer={recoveryAnswer}
              newPassword={newPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              onPhone={(v) => setRecoveryPhone(normalizePhone(v))}
              onAnswer={setRecoveryAnswer}
              onNewPassword={setNewPassword}
              onFindQuestion={() => void findQuestion()}
              onCheckAnswer={() => void checkAnswer()}
              onApplyPassword={() => void applyNewPassword()}
              onRestart={restartRecovery}
              onBackToLogin={() => switchMode("entrar")}
            />
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {mode === "criar" ? "Criar sua conta" : "Entrar na sua conta"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "criar"
                  ? "Telefone, senha, nome e idade. Depois criamos a base da sua história."
                  : "Use o telefone e a senha cadastrados."}
              </p>

              <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)} className="mt-6">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="criar">Criar conta</TabsTrigger>
                  <TabsTrigger value="entrar">Entrar</TabsTrigger>
                </TabsList>

                <TabsContent value="criar" className="mt-6">
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit();
                    }}
                  >
                    <AuthField label="Nome completo">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como você quer ser chamado"
                        autoComplete="name"
                      />
                    </AuthField>
                    <AuthField label="Idade">
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Ex.: 34"
                        autoComplete="off"
                      />
                    </AuthField>
                    <AuthField label="Telefone">
                      <Input
                        value={formatPhone(phone)}
                        onChange={(e) => setPhone(normalizePhone(e.target.value))}
                        placeholder="(11) 98765-4321"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </AuthField>
                    <AuthField label="Senha">
                      <PasswordInput
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        placeholder="Mínimo de 4 caracteres"
                        autoComplete="new-password"
                      />
                    </AuthField>
                    <AuthField label="Confirmar senha">
                      <PasswordInput
                        value={confirm}
                        onChange={setConfirm}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                      />
                    </AuthField>

                    {/* A pergunta secreta é o que permite recuperar a senha
                        depois, já que não há e-mail no cadastro. */}
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-faint">
                        <ShieldQuestion className="size-3.5" /> Senha de segurança
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Se um dia você esquecer a senha, é esta pergunta que devolve o acesso — sem
                        depender de e-mail.
                      </p>
                      <div className="mt-3 space-y-3">
                        <AuthField label="Pergunta secreta">
                          <select
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
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
                        {question === "" && (
                          <Input
                            value={customQuestion}
                            onChange={(e) => setCustomQuestion(e.target.value)}
                            placeholder="Ex.: Qual o nome da minha primeira rua?"
                          />
                        )}
                        <AuthField label="Resposta secreta">
                          <Input
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Algo que você não esquece"
                            autoComplete="off"
                          />
                        </AuthField>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserPlus className="size-4" />
                      )}
                      Criar conta e começar
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="entrar" className="mt-6">
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit();
                    }}
                  >
                    <AuthField label="Telefone">
                      <Input
                        value={formatPhone(phone)}
                        onChange={(e) => setPhone(normalizePhone(e.target.value))}
                        placeholder="(11) 98765-4321"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </AuthField>
                    <AuthField label="Senha">
                      <PasswordInput
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        placeholder="Sua senha"
                        autoComplete="current-password"
                      />
                    </AuthField>
                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LogIn className="size-4" />
                      )}
                      Entrar
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryPhone(phone);
                        switchMode("recuperar");
                      }}
                      className="w-full text-center text-xs font-medium text-primary transition-colors hover:text-foreground"
                    >
                      Esqueci minha senha
                    </button>
                  </form>
                </TabsContent>
              </Tabs>

              {error && <AuthError message={error} />}

              <p className="mt-6 text-xs leading-5 text-faint">
                {isSupabaseConfigured
                  ? "Sua conta é criada no Supabase: a senha é gerenciada pelo serviço de autenticação e seus dados ficam isolados por usuário."
                  : "A conta é local a este navegador: senha guardada como hash, nunca em texto puro."}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
