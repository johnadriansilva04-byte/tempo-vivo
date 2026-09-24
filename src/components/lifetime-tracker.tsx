import { LockKeyhole, Settings, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLifetime } from "@/hooks/use-lifetime";
import { Button } from "@/components/ui/button";

const R = 54;

function arcPath(startDeg: number, endDeg: number): string {
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x = (deg: number) => 60 + R * Math.cos(rad(deg));
  const y = (deg: number) => 60 + R * Math.sin(rad(deg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x(startDeg)} ${y(startDeg)} A ${R} ${R} 0 ${largeArc} 1 ${x(endDeg)} ${y(endDeg)}`;
}

type Slice = {
  index: number;
  range: string;
  name: string;
  state: "past" | "active" | "future";
  fillFrac: number;
};

function buildSlices(age: number): Slice[] {
  const active = Math.min(Math.floor(age / 25), 3);
  const fracInCycle = Math.min(Math.max((age - active * 25) / 25, 0), 1);
  const cycleNames = [
    "Aprendizado & Base",
    "Construção & Legado",
    "Consolidação & Mentoria",
    "Plenitude & Sabedoria",
  ];
  return [0, 1, 2, 3].map((index) => ({
    index,
    range: `${index * 25}–${(index + 1) * 25}`,
    name: cycleNames[index] ?? "",
    state: index < active ? "past" : index === active ? "active" : "future",
    fillFrac: index === active ? fracInCycle : index < active ? 1 : 0,
  }));
}

const GAP_DEG = 2.2;

export function LifetimeTracker({ compact = false }: { compact?: boolean }) {
  const life = useLifetime();
  const slices = buildSlices(life.age);

  // Sem data de nascimento → estado vazio com convite para preencher.
  if (!life.hasBirthDate) {
    return (
      <div className="life-panel gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Memento Mori
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            Defina o início da sua linha do tempo
          </p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Informe sua data de nascimento em{" "}
          <Link
            to="/configuracoes"
            className="font-semibold text-primary underline underline-offset-2"
          >
            Configurações
          </Link>{" "}
          para ver o horizonte de {life.target} anos e o ciclo em que você está.
        </p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link to="/configuracoes">
            <Settings className="size-3.5" /> Preencher agora
          </Link>
        </Button>
        <div className="grid grid-cols-4 gap-1.5 opacity-40">
          {["0–25", "25–50", "50–75", "75–100"].map((r) => (
            <div key={r} className="cycle-segment cycle-future">
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="life-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Memento Mori
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {life.isRecordBreaker
              ? "Além do horizonte"
              : `Ciclo ${life.cycleIndex + 1} · ${life.cycleName}`}
          </p>
        </div>
        {life.isRecordBreaker && (
          <span className="status status-open">
            <Sparkles className="size-3" />
            Recordista do Tempo
          </span>
        )}
      </div>

      <div className={`flex items-center gap-5 ${compact ? "flex-col items-start" : ""}`}>
        <div className="life-donut shrink-0">
          <svg
            viewBox="0 0 120 120"
            width="100%"
            height="100%"
            role="img"
            aria-label="Ciclos de vida em 4 blocos de 25 anos"
          >
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="9" />
            {slices.map((s) => {
              const start = s.index * 90 + GAP_DEG / 2;
              const end = (s.index + 1) * 90 - GAP_DEG / 2;
              const consumed =
                s.state === "past"
                  ? end - start
                  : s.state === "active"
                    ? (end - start) * s.fillFrac
                    : 0;
              return (
                <path
                  key={s.index}
                  d={arcPath(start, end)}
                  fill="none"
                  strokeWidth={s.state === "active" ? 9 : 8}
                  strokeLinecap="round"
                  stroke={
                    s.state === "past"
                      ? "color-mix(in oklab, var(--primary) 30%, var(--muted))"
                      : s.state === "active"
                        ? "var(--primary)"
                        : "transparent"
                  }
                  className={s.state === "active" ? "life-donut-glow" : undefined}
                  strokeDasharray={`${consumed} 360`}
                />
              );
            })}
          </svg>
          <div className="life-donut-center">
            <strong>{life.age}</strong>
            <span>anos</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-display text-xl font-semibold text-foreground">
            {life.pctConsumed.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            do horizonte de {life.target} anos consumido
          </p>
          <p className="flex items-center gap-1.5 pt-1 text-xs text-faint">
            <LockKeyhole className="size-3" />
            {Math.floor(life.yearsRemaining)} anos ·{" "}
            {Math.round(life.daysRemaining).toLocaleString("pt-BR")} dias restantes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {slices.map((s) => (
          <div
            key={s.index}
            title={`${s.range} anos · ${s.name}`}
            className={`cycle-segment ${s.state === "past" ? "cycle-past" : s.state === "active" ? "cycle-active" : "cycle-future"}`}
          >
            <span>{s.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
