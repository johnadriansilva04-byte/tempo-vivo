import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sunrise,
  Trophy,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { signOut } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Paleta de comando (⌘K / Ctrl+K).
// Navegar e agir sem tirar as mãos do teclado — atalho para quem vive no app.
// ---------------------------------------------------------------------------

const NAV = [
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRitual?: (phase: "manha" | "noite") => void;
};

export function CommandPalette({ open, onOpenChange, onRitual }: Props) {
  const navigate = useNavigate();

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Navegar, registrar ou buscar…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Ações do dia">
          <CommandItem
            value="ritual da manha intencao registrar"
            onSelect={() => {
              onOpenChange(false);
              onRitual?.("manha");
            }}
          >
            <Sunrise className="size-4" />
            Ritual da manhã — definir a intenção
          </CommandItem>
          <CommandItem
            value="ritual da noite fechar o dia resumo"
            onSelect={() => {
              onOpenChange(false);
              onRitual?.("noite");
            }}
          >
            <Moon className="size-4" />
            Ritual da noite — fechar o dia
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ir para">
          {NAV.map(([to, label, Icon]) => (
            <CommandItem key={to} value={`${label} ${to}`} onSelect={() => go(to)}>
              <Icon className="size-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Conta">
          <CommandItem
            value="sair da conta logout"
            onSelect={() => {
              onOpenChange(false);
              void signOut();
            }}
          >
            <LogOut className="size-4" />
            Sair da conta
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Botão visível do atalho, usado no cabeçalho mobile e na sidebar. */
export function CommandHint({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cmd-trigger">
      <Activity className="size-3.5" />
      <span className="hidden sm:inline">Buscar ou agir</span>
      <kbd className="kbd">⌘K</kbd>
    </button>
  );
}
