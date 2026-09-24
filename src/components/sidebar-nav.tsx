import { Link } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Settings,
  Star,
  X,
  BarChart3,
  Award,
  Download,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth, useSignOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/agenda", "Agenda", CalendarDays],
  ["/analytics", "Analytics", BarChart3],
  ["/gamification", "Gamificação", Award],
  ["/insights", "Insights", Lightbulb],
  ["/export", "Exportar", Download],
  ["/curriculo", "Currículo", BookOpen],
  ["/planejamento", "Planejamento", Flag],
  ["/realizacoes", "Realizações", Star],
  ["/projetos", "Projetos", FolderKanban],
  ["/sobre", "Sobre", CircleUserRound],
  ["/jogos", "Jogos", Gamepad2],
  ["/configuracoes", "Configurações", Settings],
] as const;

export function SidebarNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();
  const { user } = useAuth();
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-background">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="brand-mark">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold text-sidebar-foreground">
              Perfil Vivo
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(([to, label, Icon]) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              onClick={() => setOpen(false)}
              className="nav-item"
              activeProps={{ className: "nav-item nav-item-active" }}
            >
              <Icon className="size-[17px]" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="avatar-small">{profile?.initials ?? "··"}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {profile?.name ?? user?.email ?? "Carregando…"}
              </p>
              <p className="text-[11px] text-muted-foreground">Perfil privado</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Sair"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setOpen(false)} />
      )}
      <div className="md:pl-56">
        <div className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <span className="ml-3 text-sm font-semibold">Perfil Vivo</span>
        </div>
        <main className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
