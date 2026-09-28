import { useEffect, useRef, useState } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => Promise<unknown> | unknown;
  placeholder?: string;
  rows?: number;
  label: string;
  max?: number;
};

/**
 * Textarea inteligente:
 * - Rascunho salvo automaticamente no localStorage por label (nunca se perde).
 * - Contador de caracteres com limite visual.
 * - ⌘Enter / Ctrl+Enter salva.
 * - Estado visual de commit (salvando / salvo) sem bloquear a digitação.
 */
export function SmartTextarea({
  value,
  onChange,
  onCommit,
  placeholder,
  rows = 2,
  label,
  max = 4000,
}: Props) {
  const draftKey = `perfil-vivo:draft:${label}`;
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const restoredRef = useRef(false);

  // Restaura rascunho uma única vez na montagem (se o campo estava vazio).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (value.trim() === "") {
      try {
        const draft = window.localStorage.getItem(draftKey);
        if (draft) onChange(draft);
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva o rascunho a cada alteração (debounce leve).
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        if (value.trim() === "") window.localStorage.removeItem(draftKey);
        else window.localStorage.setItem(draftKey, value);
      } catch {
        // ignore
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [value, draftKey]);

  const commit = async () => {
    if (value.trim() === "") return;
    setState("saving");
    try {
      await onCommit();
      setState("saved");
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2600);
    }
  };

  const over = value.length > max;

  return (
    <div className="smart-field" data-state={state}>
      <div className="flex items-center justify-between">
        <p className="record-label">{label}</p>
        <span className="smart-state" aria-live="polite">
          {state === "saving" && <Loader2 className="size-3 animate-spin" />}
          {state === "saving" && "salvando…"}
          {state === "saved" && <Check className="size-3" />}
          {state === "saved" && "salvo"}
          {state === "error" && <CloudOff className="size-3" />}
          {state === "error" && "falhou — tente de novo"}
        </span>
      </div>
      <div className="smart-shell">
        <Textarea
          rows={rows}
          className="smart-textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
          }}
        />
        <span className={`smart-count ${over ? "smart-count-over" : ""}`}>
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}
