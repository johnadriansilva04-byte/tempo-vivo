import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Settings,
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
// Paleta de comando (⌘K / Ctrl+K): navegar sem tirar as mãos do teclado.
// ---------------------------------------------------------------------------

const NAV = [
  ["/", "Hoje", LayoutDashboard],
  ["/agenda", "Agenda", CalendarDays],
  ["/curriculo", "Currículo", BookOpen],
  ["/realizacoes", "Realizações", Trophy],
  ["/projetos", "Projetos", FolderKanban],
  ["/planejamento", "Planejamento", Flag],
  ["/sobre", "Perfil público", CircleUserRound],
  ["/jogos", "Jogos", Gamepad2],
  ["/configuracoes", "Configurações", Settings],
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Navegar…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

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
