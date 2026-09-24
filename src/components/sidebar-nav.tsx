import { Link } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Command,
  Flag,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sunrise,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useProfile } from "@/hooks/use-profile";
import { signOut, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/identity";
import { CommandPalette } from "@/components/command-palette";
import { useCommandShortcut } from "@/hooks/use-command-shortcut";
import { DailyRitual } from "@/components/daily-ritual";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { openRitual, setRitualOpen, useRitual } from "@/store/ritual-store";
import type { RitualPhase } from "@/store/ritual-store";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/agenda", "Agenda", CalendarDays],
  ["/curriculo", "Currículo", BookOpen],
  ["/planejamento", "Planejamento", Flag],
  ["/realizacoes", "Realizações", Trophy],
  ["/projetos", "Projetos", FolderKanban],
  ["/sobre", "Sobre", CircleUserRound],
  ["/jogos", "Jogos", Gamepad2],
  ["/configuracoes", "Configurações", Settings],
] as const;

export function SidebarNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { profile } = useProfile();
  const { account } = useAuth();
  const { logs } = useDailyLogs();
  const ritual = useRitual();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandShortcut(openPalette);

  // O registro de hoje alimenta o ritual (fase sugerida e conteúdo existente).
  const todayLog = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.find((l) => l.log_date === today);
  }, [logs]);

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

        {/* Atalho do ritual: o gesto mais repetido do app, sempre a um clique. */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openRitual(
                todayLog?.planned_text.trim() && !todayLog.summary_text.trim() ? "noite" : "manha",
              );
            }}
            className="nav-item w-full justify-between bg-sidebar-accent/60 text-sidebar-accent-foreground"
          >
            <span className="flex items-center gap-2.5">
              <Sunrise className="size-[17px]" />
              <span>Ritual do dia</span>
            </span>
            <span className="live-dot" />
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
        <div className="space-y-3 border-t border-sidebar-border p-4">
          <button
            type="button"
            onClick={openPalette}
            className="cmd-trigger w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Command className="size-3.5" />
              Buscar ou agir
            </span>
            <kbd className="kbd">⌘K</kbd>
          </button>
          <div className="flex items-center gap-3">
            <div className="avatar-small">{profile?.initials ?? "··"}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {profile?.name || account?.name || "Carregando…"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {account ? formatPhone(account.phone) : "Perfil privado"}
              </p>
            </div>
            {account && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Sair da conta"
                title="Sair da conta"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                <LogOut className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setOpen(false)} />
      )}
      <div className="md:pl-56">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <span className="text-sm font-semibold">Perfil Vivo</span>
          <button
            type="button"
            onClick={openPalette}
            className="cmd-trigger ml-auto"
            aria-label="Buscar ou agir"
          >
            <Command className="size-3.5" />
          </button>
        </div>
        <main className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRitual={(phase: RitualPhase) => openRitual(phase)}
      />
      <DailyRitual
        open={ritual.open}
        onOpenChange={setRitualOpen}
        log={todayLog}
        initialPhase={ritual.phase}
      />
    </div>
  );
}
