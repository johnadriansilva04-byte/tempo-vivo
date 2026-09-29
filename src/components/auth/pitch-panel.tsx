import { useEffect, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CalendarCheck2,
  EyeOff,
  Link2,
} from "lucide-react";
import { BRAND_PROMISE, PRIVACY_NOTE } from "@/components/auth/copy";

// ---------------------------------------------------------------------------
// Painel de apresentação da porta de entrada (metade esquerda, telas grandes).
//
// Mostra o que o app faz, em três passos: monte sua rotina, compartilhe o link,
// receba e aprove pedidos de reunião. Um relógio batendo dá o sinal de vida.
// ---------------------------------------------------------------------------

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="brand-mark">
        <CalendarDays className="size-4" />
      </span>
      <span className="font-display text-sm font-semibold text-foreground">
        Perfil Vivo
      </span>
    </span>
  );
}

/** O agora, literalmente — prova de que o app respira. */
function LiveClock() {
  // O horário só entra depois da hidratação: renderizá-lo no servidor faria a
  // marcação divergir do cliente a cada segundo.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-display font-semibold tabular-nums text-foreground">
      {now
        ? now.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "--:--:--"}
    </span>
  );
}

const STEPS = [
  { Icon: CalendarDays, short: "1", name: "Monte sua rotina e suas folgas" },
  { Icon: Link2, short: "2", name: "Compartilhe seu link" },
  { Icon: BellRing, short: "3", name: "Aprove os pedidos de reunião" },
] as const;

const HIGHLIGHTS = [
  { Icon: CalendarCheck2, label: "Pedidos no seu horário" },
  { Icon: BellRing, label: "Aviso sonoro na hora" },
  { Icon: EyeOff, label: "Você quem decide o que aparece" },
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
          Sua agenda digital
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground">
          {BRAND_PROMISE}
        </h1>

        {/* Os três passos — acendem um a um, sem parar */}
        <div className="mt-8 space-y-2">
          {STEPS.map((c, i) => (
            <span
              key={c.short}
              className="auth-cycle-seg justify-start gap-2 px-3"
              style={{ animationDelay: `${i * -2}s` }}
              title={c.name}
            >
              <c.Icon className="size-3.5 shrink-0" />
              {c.name}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Você define os dias e horários; ninguém vê o resto.
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
        Sua agenda de hoje está pronta · {PRIVACY_NOTE}
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
