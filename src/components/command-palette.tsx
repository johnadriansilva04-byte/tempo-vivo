import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gamepad2,
  Heart,
  LayoutDashboard,
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

const NAV = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: "início home resumo",
  },
  {
    to: "/agenda",
    label: "Agenda",
    icon: CalendarDays,
    keywords: "diário livro de bordo registro dia",
  },
  {
    to: "/curriculo",
    label: "Currículo",
    icon: BookOpen,
    keywords: "trajetória experiência formação",
  },
  {
    to: "/planejamento",
    label: "Planejamento",
    icon: Flag,
    keywords: "metas semana foco",
  },
  {
    to: "/realizacoes",
    label: "Realizações",
    icon: Trophy,
    keywords: "marcos conquistas troféu",
  },
  {
    to: "/projetos",
    label: "Projetos",
    icon: FolderKanban,
    keywords: "trabalho iniciativas",
  },
  {
    to: "/sobre",
    label: "Sobre",
    icon: CircleUserRound,
    keywords: "quem sou bio apresentação",
  },
  {
    to: "/familia",
    label: "Família",
    icon: Heart,
    keywords: "familiar convite telefone relação privacidade",
  },
  {
    to: "/jogos",
    label: "Jogos",
    icon: Gamepad2,
    keywords: "exploração futuro",
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    keywords: "perfil ajustes nome foto banner",
  },
] as const;

/** Paleta de comandos — ⌘K / Ctrl+K ou botão "Buscar…" (estilo Linear/Vercel). */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    void router.navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Navegar… (digite um destino ou ação)" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {NAV.map((item) => (
            <CommandItem
              key={item.to}
              value={`${item.label} ${item.keywords}`}
              onSelect={() => go(item.to)}
            >
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações rápidas">
          <CommandItem
            value="abrir registro de hoje hoje agenda novo"
            onSelect={() => go("/agenda")}
          >
            <CalendarDays className="size-4" />
            Abrir registro de hoje
          </CommandItem>
          <CommandItem
            value="editar perfil configuracoes nome visual"
            onSelect={() => go("/configuracoes")}
          >
            <Settings className="size-4" />
            Editar meu perfil
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
