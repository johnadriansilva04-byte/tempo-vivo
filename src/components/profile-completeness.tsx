import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";

/**
 * Medidor "Perfil completo": mostra o quanto o dono já preencheu
 * e o que falta — puxa para concluir o cadastro de forma não intrusiva.
 */
const CHECKS = [
  {
    id: "name",
    label: "Nome",
    test: (p: { name: string }) => p.name.trim() !== "",
  },
  {
    id: "role",
    label: "Ocupação",
    test: (p: { role: string }) => p.role.trim() !== "",
  },
  {
    id: "bio",
    label: "Bio",
    test: (p: { bio: string }) => p.bio.trim() !== "",
  },
  {
    id: "birth",
    label: "Nascimento",
    test: (p: { birth_date: string }) => p.birth_date !== "",
  },
  {
    id: "avatar",
    label: "Foto",
    test: (p: { avatar_url: string | null }) => !!p.avatar_url,
  },
  {
    id: "cover",
    label: "Banner",
    test: (p: { cover_url: string | null }) => !!p.cover_url,
  },
] as const;

export function ProfileCompleteness() {
  const { profile } = useProfile();
  if (!profile) return null;

  const done = CHECKS.filter((c) => c.test(profile));
  const pct = Math.round((done.length / CHECKS.length) * 100);
  const missing = CHECKS.filter((c) => !c.test(profile));

  if (pct === 100) return null; // completo não precisa de nudge

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
          Perfil completo
        </p>
        <span className="font-display text-sm font-bold text-foreground">
          {pct}%
        </span>
      </div>
      <div className="focus-bar mt-2.5">
        <div className="profile-meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {CHECKS.map((c) => {
          const ok = c.test(profile);
          return (
            <li
              key={c.id}
              className={`flex items-center gap-1 text-[11px] ${ok ? "text-muted-foreground" : "text-faint"}`}
            >
              {ok ? (
                <CheckCircle2 className="size-3 text-primary" />
              ) : (
                <Circle className="size-3" />
              )}
              {c.label}
            </li>
          );
        })}
      </ul>
      {missing.length > 0 && (
        <Link
          to="/configuracoes"
          className="mt-3 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline"
        >
          Completar em Configurações →
        </Link>
      )}
    </div>
  );
}
