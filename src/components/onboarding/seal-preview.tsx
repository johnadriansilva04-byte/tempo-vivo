import { plural } from "@/lib/utils";
import type { StarterLife } from "@/lib/life-story";

// ---------------------------------------------------------------------------
// O selo: o que a pessoa vê antes de abrir o app pela primeira vez.
//
// Prova concreta do que acabou de nascer — a epígrafe que ela escreveu, o
// prólogo que o app montou e os números do que já existe. Nada além disso.
// ---------------------------------------------------------------------------

export function SealPreview({ intention, preview }: { intention: string; preview: StarterLife }) {
  return (
    <div className="mt-8 space-y-6">
      {intention.trim() !== "" && (
        <blockquote className="epigraph">“{intention.trim()}”</blockquote>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-faint">
          Seu prólogo
        </p>
        <div className="mt-3 space-y-3">
          {preview.prologue.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SealCount
          value={preview.focus.length}
          label={plural(preview.focus.length, "meta da semana", "metas da semana")}
        />
        <SealCount
          value={preview.chapters.length}
          label={plural(preview.chapters.length, "capítulo de currículo", "capítulos de currículo")}
        />
        <SealCount
          value={preview.milestones.length}
          label={plural(
            preview.milestones.length,
            "marco na linha do tempo",
            "marcos na linha do tempo",
          )}
        />
      </div>

      <p className="text-xs text-faint">
        Mais a agenda de hoje,{" "}
        {plural(preview.projects.length, "1 projeto", `${preview.projects.length} projetos`)} e o
        seu perfil — tudo editável a qualquer momento.
      </p>
    </div>
  );
}

function SealCount({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <p className="ink-number text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
