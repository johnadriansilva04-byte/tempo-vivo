import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeFirstRun } from "@/services/onboarding-service";
import { cycleForAge } from "@/lib/life-story";
import { useAuth } from "@/hooks/use-auth";
import type { StoryPreset } from "@/lib/life-story";

/** Primeira entrada: cria a história e a vida inicial antes de liberar o app. */
export function StartLifeFlow() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<StoryPreset | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;
  const cycle = cycleForAge(account.age);

  const start = async (preset: StoryPreset) => {
    setPending(preset);
    setError(null);
    try {
      await completeFirstRun(preset);
      if (preset === "guided") await navigate({ to: "/" });
      else await navigate({ to: "/configuracoes" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar sua história.");
      setPending(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16">
      <span className="status status-open w-fit">
        <Sparkles className="size-3" />
        Primeira entrada
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold text-foreground sm:text-4xl">
        Bem-vindo, {account.name.split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Você tem {account.age} anos e está no ciclo {cycle.index + 1} — {cycle.name} ({cycle.range}{" "}
        anos). Antes de abrir o app, vamos montar a base da sua história.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <article className="card-interactive flex flex-col">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-accent-foreground">
            Opção 1
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">Começar com uma história base</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
            Criamos um prólogo, a agenda de hoje, 3 metas da semana, capítulos de currículo, marcos
            e um projeto. Os trechos entre [ ] são espaços para você substituir pela sua vida real.
          </p>
          <Button
            className="mt-5 w-fit"
            onClick={() => start("guided")}
            disabled={pending !== null}
          >
            {pending === "guided" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Criar minha história
          </Button>
        </article>

        <article className="card-interactive flex flex-col">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Opção 2
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">Começar do zero</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
            Só o essencial: nome e data de nascimento já preenchidos. Você escreve cada parte no seu
            ritmo, começando pelas Configurações.
          </p>
          <Button
            variant="outline"
            className="mt-5 w-fit"
            onClick={() => start("blank")}
            disabled={pending !== null}
          >
            {pending === "blank" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <PenLine className="size-3.5" />
            )}
            Escrever do zero
          </Button>
        </article>
      </div>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      <p className="mt-8 flex items-center gap-2 text-xs text-faint">
        <ArrowRight className="size-3.5" />
        Você pode apagar ou reescrever tudo depois — nada aqui é definitivo.
      </p>
    </div>
  );
}
