import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
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
import { NAV_LINKS } from "@/components/nav-links";

// ---------------------------------------------------------------------------
// Paleta de comando (⌘K / Ctrl+K): navegar sem tirar as mãos do teclado.
// Os destinos vêm da mesma lista da sidebar (`nav-links.ts`).
// ---------------------------------------------------------------------------

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
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
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
