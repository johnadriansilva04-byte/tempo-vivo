import type { ReactNode } from "react";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/page-kit";
import { StoryText } from "@/components/story-text";
import { isPlaceholderText } from "@/lib/placeholder";

// ---------------------------------------------------------------------------
// Peças pequenas reaproveitadas pelas páginas de conteúdo. Antes viviam todas
// dentro de um pages.tsx único; aqui cada página importa só o que usa.
// ---------------------------------------------------------------------------

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</Label>
      {children}
    </div>
  );
}

export function TimelineSection({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof BriefcaseBusiness;
  title: string;
  rows: string[][];
}) {
  return (
    <Section title={title}>
      <div className="space-y-6">
        {rows.map(([date = "", place = "", role = ""]) => (
          <div className="flex gap-4" key={`${date}-${place}`}>
            <div className="icon-tile">
              <Icon />
            </div>
            <div>
              {date.trim() !== "" && !isPlaceholderText(date) && (
                <p className="text-xs text-faint">{date}</p>
              )}
              <h3 className="mt-1 text-sm font-semibold">
                <StoryText text={place} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <StoryText text={role} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function SmallFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="quiet-panel">
      <Icon className="size-4 text-accent-foreground" />
      <p className="mt-4 text-xs text-faint">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
