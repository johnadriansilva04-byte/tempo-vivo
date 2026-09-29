import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOut, useAuth } from "@/hooks/use-auth";
import { useMeetingAlerts } from "@/hooks/use-meeting-alerts";

const links = [
  ["/", "Hoje", LayoutDashboard],
  ["/agenda", "Agenda", CalendarDays],
  ["/configuracoes", "Configurações", Settings],
] as const;

/**
 * Shell viewport-fit: a tela tem a altura exata da viewport e o conteúdo rola
 * dentro do main. O menu mostra só o que existe — hoje, agenda e ajustes.
 */
export function SidebarNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { account } = useAuth();
  const { pendingCount } = useMeetingAlerts();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Fecha o menu ao navegar — no celular o overlay precisa sumir sozinho.
  useEffect(() => setOpen(false), [pathname]);

  const displayName = account?.name?.trim() || "Sua conta";
  const initials =
    displayName === "Sua conta"
      ? "··"
      : displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("");

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="brand-mark">
              <CalendarDays className="size-4" />
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
              <span className="flex-1">{label}</span>
              {to === "/agenda" && pendingCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  <Inbox className="size-2.5" />
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="avatar-small">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {pendingCount > 0
                  ? `${pendingCount} pedido(s) de reunião`
                  : "Agenda privada"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-muted-foreground"
            onClick={() => void signOut()}
          >
            <UserRound className="size-3.5" />
            Sair da conta
          </Button>
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
          {children}
        </main>
      </div>
    </div>
  );
}
