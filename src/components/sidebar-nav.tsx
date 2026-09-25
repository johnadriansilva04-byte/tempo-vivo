import { Link } from "@tanstack/react-router";
import { Activity, Command, LogOut, Menu, X } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useProfile } from "@/hooks/use-profile";
import { signOut, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/identity";
import { CommandPalette } from "@/components/command-palette";
import { useCommandShortcut } from "@/hooks/use-command-shortcut";
import { useOverlayBehavior } from "@/hooks/use-overlay-behavior";
import { NAV_LINKS } from "@/components/nav-links";

export function SidebarNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const { profile } = useProfile();
  const { account } = useAuth();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandShortcut(openPalette);
  const closeMenu = useCallback(() => setOpen(false), []);
  useOverlayBehavior(open, closeMenu, sidebarRef);

  return (
    <div className="min-h-screen bg-background">
      <aside
        ref={sidebarRef}
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5" onClick={closeMenu}>
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
            className="size-11 md:hidden"
            aria-label="Fechar menu"
            onClick={closeMenu}
          >
            <X />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              onClick={closeMenu}
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
              <p className="truncate text-xs text-muted-foreground">
                {account ? formatPhone(account.phone) : "Perfil privado"}
              </p>
            </div>
            {account && (
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label="Sair da conta"
                title="Sair da conta"
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-overlay md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      <div className="md:pl-56" inert={open || undefined}>
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
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

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
