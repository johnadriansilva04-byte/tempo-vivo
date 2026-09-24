import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bloco expansível — a peça que substitui a parede de campos por uma leitura
 * em camadas. Fechado, ele ainda conta o essencial (ícone, título, resumo do
 * que está preenchido) num único olhar; aberto, revela os campos por edição.
 * Assim a tela mostra primeiro a estrutura da história, não o formulário.
 */

type DisclosureProps = {
  icon?: LucideIcon | undefined;
  title: string;
  /** Linha de apoio sempre visível: o que este bloco guarda. */
  description?: string | undefined;
  /** Estado do preenchimento, lido pelo dono sem precisar abrir. */
  summary?: ReactNode | undefined;
  /** Selo curto no cabeçalho (ex.: "2 de 5"). */
  badge?: ReactNode | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Ação à direita do cabeçalho, fora do gatilho. */
  action?: ReactNode | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
};

export function Disclosure({
  icon: Icon,
  title,
  description,
  summary,
  badge,
  open,
  onOpenChange,
  children,
  action,
  className,
  disabled,
}: DisclosureProps) {
  return (
    <CollapsiblePrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      {...(disabled !== undefined ? { disabled } : {})}
      className={cn("disclosure", open && "disclosure-open", className)}
    >
      <div className="disclosure-head">
        <CollapsiblePrimitive.Trigger
          className="disclosure-trigger"
          {...(disabled !== undefined ? { disabled } : {})}
        >
          {Icon && (
            <span className="disclosure-icon">
              <Icon />
            </span>
          )}
          <span className="disclosure-heading">
            <span className="disclosure-title-row">
              <span className="disclosure-title">{title}</span>
              {badge !== undefined && <span className="disclosure-badge">{badge}</span>}
            </span>
            {description && <span className="disclosure-description">{description}</span>}
            {summary !== undefined && <span className="disclosure-preview">{summary}</span>}
          </span>
          <ChevronDown className="disclosure-chevron" aria-hidden="true" />
        </CollapsiblePrimitive.Trigger>
        {action && <div className="disclosure-action">{action}</div>}
      </div>

      <CollapsiblePrimitive.Content className="disclosure-content">
        <div className="disclosure-body">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
