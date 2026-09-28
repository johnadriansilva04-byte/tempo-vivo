import { useEffect, useState } from "react";
import { Activity, BookOpen, Heart, Hourglass } from "lucide-react";
import { BRAND_PROMISE, PRIVACY_NOTE } from "@/components/auth/copy";

// ---------------------------------------------------------------------------
// Painel de apresentação da porta de entrada (metade esquerda, telas grandes).
// Marketing vivo: quase nenhum texto — um relógio batendo, os quatro ciclos de
// vida acendendo em sequência e três chips de valor. A história conta-se sozinha.
// ---------------------------------------------------------------------------

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="brand-mark">
        <Activity className="size-4" />
      </span>
      <span className="font-display text-sm font-semibold text-foreground">
        Perfil Vivo
      </span>
    </span>
  );
}

/** O agora, literalmente — prova de que o app respira. */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-display font-semibold tabular-nums text-foreground">
      {now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

const LIFE_CYCLES = [
  { short: "0–25", name: "Aprendizado & Base" },
  { short: "25–50", name: "Construção & Legado" },
  { short: "50–75", name: "Consolidação & Mentoria" },
  { short: "75+", name: "Plenitude & Sabedoria" },
] as const;

const HIGHLIGHTS = [
  { Icon: BookOpen, label: "História em um só lugar" },
  { Icon: Hourglass, label: "Tempo em números reais" },
  { Icon: Heart, label: "Legado para quem fica" },
] as const;

export function PitchPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:p-14">
      {/* Fundo vivo: orbes que flutuam sozinhas */}
      <span
        className="auth-orb size-72 bg-primary/25"
        style={{ top: "-4rem", left: "-3rem" }}
      />
      <span
        className="auth-orb size-80 bg-chart-2/20"
        style={{ bottom: "-6rem", right: "-4rem", animationDelay: "-6s" }}
      />
      <span
        className="auth-orb size-56 bg-accent/20"
        style={{ top: "42%", right: "18%", animationDelay: "-11s" }}
      />

      <div className="relative flex items-center justify-between">
        <BrandMark />
        <span className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <span className="auth-live-dot" />
          <LiveClock />
        </span>
      </div>

      <div className="relative max-w-md animate-fade-in">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
          Trajetória viva
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground">
          {BRAND_PROMISE}
        </h1>

        {/* Os quatro ciclos — acendem um a um, sem parar */}
        <div className="mt-8 grid grid-cols-4 gap-2">
          {LIFE_CYCLES.map((c, i) => (
            <span
              key={c.short}
              className="auth-cycle-seg"
              style={{ animationDelay: `${i * -2}s` }}
              title={c.name}
            >
              {c.short}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          A vida em quatro ciclos de 25 anos.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {HIGHLIGHTS.map(({ Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="relative flex items-center gap-2 text-xs leading-5 text-faint">
        <span className="auth-live-dot" />
        Sua página de hoje está sendo escrita agora · {PRIVACY_NOTE}
      </p>
    </section>
  );
}

/** A mesma entrada em telas estreitas: três linhas e um sinal de vida. */
export function PitchCompact() {
  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <BrandMark />
        <span className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <span className="auth-live-dot" />
          <LiveClock />
        </span>
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold leading-snug text-foreground">
        {BRAND_PROMISE}
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] leading-4 text-faint">
        <span className="auth-live-dot" />
        {PRIVACY_NOTE}
      </p>
    </div>
  );
}
