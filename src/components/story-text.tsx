import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { isPlaceholderText, readableText } from "@/lib/placeholder";

type Props = {
  /** Texto como está no banco (pode conter [colchetes] de contas antigas). */
  text: string;
  /** Como o dono vê: relato final, ou convite a completar. */
  variant?: "inline" | "panel";
  className?: string;
  children?: ReactNode;
};

/**
 * Renderiza texto que pode ser um convite do onboarding.
 * - Texto do dono → normal.
 * - Texto com [colchetes] → convite em tom suave, sem expor o colchete.
 */
export function StoryText({ text, variant = "inline", className = "", children }: Props) {
  if (text.trim() === "") return null;

  if (!isPlaceholderText(text)) {
    return <span className={className}>{text}</span>;
  }

  const readable = readableText(text);

  if (variant === "panel") {
    return (
      <div
        className={`flex gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3 ${className}`}
      >
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" />
        <div className="min-w-0">
          <p className="text-xs leading-5 text-muted-foreground">{readable}</p>
          {children}
        </div>
      </div>
    );
  }

  return <span className={`italic text-faint ${className}`}>{readable}</span>;
}
