import { Activity, ArrowRight } from "lucide-react";
import { BRAND_PILLARS, BRAND_PROMISE, PRIVACY_NOTE } from "@/components/auth/copy";

// ---------------------------------------------------------------------------
// Painel de apresentação da porta de entrada (metade esquerda, telas grandes).
// Só desenha: a promessa, o que a pessoa ganha e o compromisso de privacidade.
// ---------------------------------------------------------------------------

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="brand-mark">
        <Activity className="size-4" />
      </span>
      <span className="font-display text-sm font-semibold text-foreground">Perfil Vivo</span>
    </span>
  );
}

export function PitchPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex xl:p-14">
      <div className="profile-banner-default absolute inset-0 opacity-60" />

      <div className="relative">
        <BrandMark />
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
          Trajetória viva
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground">
          {BRAND_PROMISE}
        </h1>
        <ul className="mt-8 space-y-4">
          {BRAND_PILLARS.map((pillar) => (
            <li key={pillar} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
              {pillar}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs leading-5 text-faint">{PRIVACY_NOTE}</p>
    </section>
  );
}
