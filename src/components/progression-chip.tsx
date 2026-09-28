import { Flame, Zap } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";

/**
 * Chip compacto de progressão para a sidebar: nível + XP até o próximo
 * + chama de streak. Clicável, leva ao Dashboard.
 */
export function ProgressionChip() {
  const g = useGamification();
  if (g.totalXp === 0) return null;

  return (
    <a
      href="/"
      className="progression-chip"
      title={`Nível ${g.level} · ${g.levelTitle}`}
    >
      <span className="chip-level">{g.level}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
            <Zap className="size-2.5" />
            {g.xpIntoLevel}/{g.xpForNextLevel} XP
          </span>
          {g.streak > 0 && (
            <span className="streak-num flex items-center gap-0.5">
              <Flame className="size-2.5" />
              {g.streak}
            </span>
          )}
        </span>
        <span className="xp-chip-bar mt-1 block">
          <span
            className="xp-bar-fill"
            style={{ width: `${g.levelProgressPct}%` }}
          />
        </span>
      </span>
    </a>
  );
}
