import { useState } from "react";
import { Activity, ArrowRight, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPhone, normalizePhone } from "@/lib/identity";

type Mode = "entrar" | "criar";

const pitch = [
  "Uma conta por telefone e senha — simples como deve ser.",
  "Nome e idade definem o ponto de partida da sua linha do tempo.",
  "Na primeira entrada, o app cria a base da sua história para você editar.",
];

/** Porta de entrada do app: entrar com telefone/senha ou criar conta nova. */
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

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      if (mode === "criar") {
        if (password !== confirm) {
          setError("As senhas não conferem.");
          return;
        }
        const result = await signUp({
          name,
          age: Number(age),
          phone,
          password,
        });
        if (!result.ok) setError(result.error);
      } else {
        const result = await signIn({ phone, password });
        if (!result.ok) setError(result.error);
      }
    } finally {
      setPending(false);
    }
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

          <h2 className="font-display text-2xl font-semibold text-foreground">
            {mode === "criar" ? "Criar sua conta" : "Entrar na sua conta"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "criar"
              ? "Telefone, senha, nome e idade. Depois criamos a base da sua história."
              : "Use o telefone e a senha cadastrados."}
          </p>

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setError(null);
            }}
            className="mt-6"
          >
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
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <p className="mt-6 text-xs leading-5 text-faint">
            {isSupabaseConfigured
              ? "Sua conta é criada no Supabase: a senha é gerenciada pelo serviço de autenticação e seus dados ficam isolados por usuário."
              : "A conta é local a este navegador: senha guardada como hash, nunca em texto puro."}
          </p>
        </div>
      </section>
    </div>
  );
}

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</Label>
      {children}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-faint transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}
