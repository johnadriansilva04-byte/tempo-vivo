import {
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Um destino do app: caminho, rótulo e ícone. */
export type NavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Fonte única da navegação. Sidebar e paleta de comando leem daqui — assim um
 * destino novo aparece nos dois lugares e nunca desalinha.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { to: "/", label: "Hoje", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/curriculo", label: "Currículo", icon: BookOpen },
  { to: "/realizacoes", label: "Realizações", icon: Trophy },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/planejamento", label: "Planejamento", icon: Flag },
  { to: "/sobre", label: "Perfil público", icon: CircleUserRound },
  { to: "/rede", label: "Rede", icon: Users },
  { to: "/jogos", label: "Jogos", icon: Gamepad2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;
