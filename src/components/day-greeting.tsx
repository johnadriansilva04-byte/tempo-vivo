import { Moon, Sunrise, Sun, Sunset } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGamification } from "@/hooks/use-gamification";

function moment(date: Date): { label: string; Icon: typeof Sun } {
  const h = date.getHours();
  if (h < 5) return { label: "Boa madrugada", Icon: Moon };
  if (h < 12) return { label: "Bom dia", Icon: Sunrise };
  if (h < 18) return { label: "Boa tarde", Icon: Sun };
  return { label: "Boa noite", Icon: Sunset };
}

/** Saudação contextual: momento do dia + nome real + streak vivo. */
export function DayGreeting() {
  const { profile } = useProfile();
  const g = useGamification();
  const now = new Date();
  const { label, Icon } = moment(now);

  const firstName = profile?.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : null;
  const date = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <span className="greeting-icon">
        <Icon />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-semibold text-foreground">
          {label}
          {firstName ? `, ${firstName}` : ""}
          <span className="text-primary">.</span>
        </p>
        <p className="text-xs capitalize text-muted-foreground">
          {date}
          {g.streak > 1 && (
            <>
              {" · "}
              <span className="text-primary">{g.streak} dias seguidos</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
