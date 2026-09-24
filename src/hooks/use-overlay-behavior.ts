import { useEffect } from "react";

/**
 * Comportamento comum a qualquer camada que cobre o conteúdo (menu mobile,
 * gaveta, painel). Enquanto aberta: ESC fecha, o fundo para de rolar e o foco
 * vai para o primeiro elemento interativo da camada. Ao fechar, a rolagem e o
 * foco voltam para onde estavam.
 */
export function useOverlayBehavior(
  open: boolean,
  onClose: () => void,
  container: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const first = container.current?.querySelector<HTMLElement>(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open, onClose, container]);
}
