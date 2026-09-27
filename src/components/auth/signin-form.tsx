import { ArrowRight, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthField, PasswordInput } from "@/components/auth/form";
import { ENTRY_COPY, FIELD_HINTS } from "@/components/auth/copy";
import { formatPhone, normalizePhone } from "@/lib/identity";

// ---------------------------------------------------------------------------
// Entrar: o caminho de volta de quem já tem história. Só telefone e senha —
// não existe e-mail para digitar nem para lembrar.
// ---------------------------------------------------------------------------

export function SignInForm({
  phone,
  password,
  showPassword,
  pending,
  onPhone,
  onPassword,
  onTogglePassword,
  onSubmit,
  onForgot,
}: {
  phone: string;
  password: string;
  showPassword: boolean;
  pending: boolean;
  onPhone: (v: string) => void;
  onPassword: (v: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onForgot: () => void;
}) {
  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {ENTRY_COPY.signin.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{ENTRY_COPY.signin.subtitle}</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <AuthField label="Telefone">
          <Input
            value={formatPhone(phone)}
            onChange={(e) => onPhone(normalizePhone(e.target.value))}
            placeholder={FIELD_HINTS.phone}
            inputMode="tel"
            autoComplete="tel"
          />
        </AuthField>

        <AuthField label="Senha">
          <PasswordInput
            value={password}
            onChange={onPassword}
            show={showPassword}
            onToggle={onTogglePassword}
            placeholder="Sua senha"
            autoComplete="current-password"
          />
        </AuthField>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {ENTRY_COPY.signin.submit}
        </Button>

        <button
          type="button"
          onClick={onForgot}
          className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-foreground"
        >
          Esqueci minha senha
          <ArrowRight className="size-3" />
        </button>
      </form>
    </>
  );
}
