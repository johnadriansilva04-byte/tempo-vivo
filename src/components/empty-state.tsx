import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      {icon && <div className="mb-3 rounded-full bg-muted p-3 text-faint">{icon}</div>}
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
