import { useEffect, useRef } from "react";
import { Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { useGamification } from "@/hooks/use-gamification";

/**
 * Observa a progressão e comemora uma única vez:
 * - Conquista desbloqueada → toast com nome/descrição.
 * - Subida de nível → toast especial.
 * Estado persistido em localStorage para não repetir celebrações.
 * Primeira execução adota o estado atual silenciosamente (sem spam).
 */
const KEY = "perfil-vivo:progression:v1";

type Stored = { achievements: string[]; level: number };

function loadStored(): Stored {
  if (typeof window === "undefined") return { achievements: [], level: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>;
      return {
        achievements: Array.isArray(parsed.achievements)
          ? parsed.achievements
          : [],
        level: typeof parsed.level === "number" ? parsed.level : 0,
      };
    }
  } catch {
    // localStorage indisponível — segue sem persistir
  }
  return { achievements: [], level: 0 };
}

function saveStored(s: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function useProgressionWatcher() {
  const g = useGamification();
  const storedRef = useRef<Stored | null>(null);
  if (storedRef.current === null) storedRef.current = loadStored();

  useEffect(() => {
    const stored = storedRef.current;
    if (!stored) return;

    // Primeira execução: adota o estado atual sem celebrar (evita rajada de toasts)
    if (stored.achievements.length === 0 && stored.level === 0) {
      stored.achievements = g.achievements
        .filter((a) => a.unlocked)
        .map((a) => a.id);
      stored.level = g.level;
      saveStored(stored);
      storedRef.current = stored;
      return;
    }

    // Level-up
    if (g.level > stored.level) {
      toast.success(`Nível ${g.level} — ${g.levelTitle}`, {
        description: `Você acumulou ${g.totalXp} XP na sua história.`,
        icon: <Zap className="size-4 text-primary" />,
        duration: 6000,
      });
      stored.level = g.level;
      saveStored(stored);
      storedRef.current = stored;
    } else if (g.level < stored.level) {
      // dados foram limpos — ressincroniza sem celebrar
      stored.level = g.level;
      saveStored(stored);
      storedRef.current = stored;
    }

    // Conquistas recém-desbloqueadas
    const unlocked = g.achievements.filter((a) => a.unlocked).map((a) => a.id);
    const fresh = unlocked.filter((id) => !stored.achievements.includes(id));
    if (fresh.length > 0) {
      for (const id of fresh) {
        const a = g.achievements.find((x) => x.id === id);
        if (a) {
          toast.success(`Conquista desbloqueada: ${a.label}`, {
            description: a.description,
            icon: <Trophy className="size-4 text-primary" />,
            duration: 6000,
          });
        }
      }
      stored.achievements = unlocked;
      saveStored(stored);
      storedRef.current = stored;
    }
  }, [g]);
}
