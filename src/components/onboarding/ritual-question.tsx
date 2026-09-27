import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionStep } from "@/components/onboarding/copy";

// ---------------------------------------------------------------------------
// Uma pergunta do ritual. Campo, rótulo e ajuda — nada de regra de negócio.
// Trocar de pergunta é trocar o `QuestionStep`, nunca o componente.
// ---------------------------------------------------------------------------

export function RitualQuestion({
  step,
  value,
  onChange,
  onSubmitKey,
}: {
  step: QuestionStep;
  value: string;
  onChange: (v: string) => void;
  onSubmitKey: () => void;
}) {
  const Icon = step.icon;
  return (
    <div className="mt-8 max-w-2xl space-y-2">
      <Label className="flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        <Icon className="size-3.5" />
        {step.label}
      </Label>
      {step.multiline ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          className="min-h-32 text-sm leading-6"
        />
      ) : (
        <Input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          className="h-12 text-base"
          onKeyDown={(e) => e.key === "Enter" && onSubmitKey()}
        />
      )}
    </div>
  );
}
