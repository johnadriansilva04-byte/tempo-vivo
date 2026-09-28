import { Link } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useProfile } from "@/hooks/use-profile";
import { ProgressionChip } from "@/components/progression-chip";
import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/agenda", "Agenda", CalendarDays],
  ["/curriculo", "Currículo", BookOpen],
  ["/planejamento", "Planejamento", Flag],
  ["/realizacoes", "Realizações", Trophy],
  ["/projetos", "Projetos", FolderKanban],
  ["/sobre", "Sobre", CircleUserRound],
  ["/familia", "Família", Heart],
  ["/jogos", "Jogos", Gamepad2],
  ["/configuracoes", "Configurações", Settings],
] as const;

/**
 * Shell viewport-fit: nada rola na página — a tela tem a altura exata da
 * viewport e o conteúdo rola (quando precisa) dentro do main. Regra do
 * produto: o essencial fica visível e o resto se expande no lugar.
 */
export function SidebarNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
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
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="palette-trigger w-full"
            aria-label="Abrir paleta de comandos"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Buscar…</span>
            <kbd className="palette-kbd">⌘K</kbd>
          </button>
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
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="avatar-small">{profile?.initials ?? "··"}</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {profile?.name ?? "Carregando…"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Perfil privado
              </p>
            </div>
          </div>
          <div className="mt-3">
            <ProgressionChip />
          </div>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-overlay md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col md:pl-56">
        <div className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <span className="ml-3 text-sm font-semibold">Perfil Vivo</span>
        </div>
        <main className="page-enter mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col overflow-y-auto px-5 pb-6 pt-5 sm:px-8 sm:pt-7 lg:px-12">
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          {children}
        </main>
      </div>
    </div>
  );
}
