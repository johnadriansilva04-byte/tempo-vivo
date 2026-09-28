import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Seção expansível do dashboard: o essencial fica na tela e o detalhe abre
 * "no lugar" — um painel central sobre a própria tela (regra do produto:
 * nada rola a página; clicar expande na tela principal).
 */
export function ExpandingSection({
  title,
  icon,
  summary,
  children,
  description,
}: {
  title: string;
  icon: ReactNode;
  /** Uma linha que aparece fechada — o estado do conteúdo, sem poluir. */
  summary: ReactNode;
  children: ReactNode;
  description?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="expand-card group"
          aria-haspopup="dialog"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="expand-icon">{icon}</span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold text-foreground">
                {title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {summary}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-faint transition-colors group-hover:text-primary">
            Expandir
            <ChevronDown className="size-3.5" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-base">
            <span className="expand-icon">{icon}</span>
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
