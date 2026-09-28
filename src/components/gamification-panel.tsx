import { BookOpen, Flame, Lock, Star, Target, Trophy, Zap } from "lucide-react";
import { useGamification, type Achievement } from "@/hooks/use-gamification";

const ICONS = {
  flame: Flame,
  trophy: Trophy,
  target: Target,
  book: BookOpen,
  star: Star,
  lock: Lock,
} as const;

function Badge({ a }: { a: Achievement }) {
  const Icon = ICONS[a.icon] ?? Star;
  return (
    <div className="badge-tile" data-locked={a.unlocked ? "false" : "true"}>
      <span className="badge-icon">
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="badge-label block truncate">{a.label}</span>
        <span className="badge-desc block truncate">{a.description}</span>
      </span>
    </div>
  );
}

/** Painel de progressão: nível, XP, streak e conquistas — tudo derivado de dados reais. */
export function GamificationPanel() {
  const g = useGamification();

  return (
    <div className="gamification-card">
      {/* Nível + XP */}
      <div className="flex items-center gap-4">
        <div className="level-ring">{g.level}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-sm font-semibold text-foreground">
              {g.levelTitle}
            </p>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Zap className="size-3" />
              {g.totalXp} XP
            </span>
          </div>
          <div className="xp-bar mt-2.5">
            <div
              className="xp-bar-fill"
              style={{ width: `${g.levelProgressPct}%` }}
              role="progressbar"
              aria-valuenow={g.levelProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-faint">
            {g.xpIntoLevel}/{g.xpForNextLevel} XP para o nível {g.level + 1}
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        <span className={`streak-flame ${g.streak > 0 ? "streak-active" : ""}`}>
          <Flame />
        </span>
        <p className="text-xs text-muted-foreground">
          {g.streak > 0 ? (
            <>
              <span className="streak-num">{g.streak}</span>
              {g.streak === 1 ? " dia seguido" : " dias seguidos"} de registro
            </>
          ) : (
            "Registre hoje para acender o fogo"
          )}
        </p>
        {g.bestStreak > 0 && (
          <span className="ml-auto text-[11px] text-faint">
            Recorde: {g.bestStreak}
          </span>
        )}
      </div>

      {/* Conquistas */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Conquistas
          </p>
          <span className="text-[11px] font-semibold text-primary">
            {g.unlockedCount}/{g.achievements.length}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {g.achievements.map((a) => (
            <Badge key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
