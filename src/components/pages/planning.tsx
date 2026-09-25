import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { PageHeader, Section } from "@/components/page-kit";
import { FocusCard } from "@/components/focus-card";
import { Disclosure } from "@/components/ui/disclosure";
import { useCreateFocus, useWeeks } from "@/hooks/use-weekly-focus";
import { useAuth } from "@/hooks/use-auth";
import { CYCLES, cycleForAge } from "@/lib/life-story";

// --------------------------------------------------------------- PlanningPage

export function PlanningPage() {
  const [input, setInput] = useState({ title: "", description: "" });
  const [open, setOpen] = useState(false);
  const create = useCreateFocus();
  const { week, year } = useWeeks();
  const { account } = useAuth();
  const cycle = cycleForAge(account?.age ?? 0);

  const submit = () => {
    if (!input.title.trim()) return;
    create.mutate(
      {
        title: input.title.trim(),
        description: input.description.trim(),
        week_number: week,
        year,
      },
      {
        onSuccess: () => {
          setInput({ title: "", description: "" });
          setOpen(false);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Planejamento"
        detail={`Semana ${week} · ${year}`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Meta
          </Button>
        }
      />

      <Section title="Metas da semana">
        <FocusCard />
      </Section>

      <Disclosure
        icon={Plus}
        title="Nova meta"
        description="Um título e, se quiser, uma linha de contexto."
        summary={input.title.trim() ? input.title : "Adicionar uma meta para esta semana."}
        open={open}
        onOpenChange={setOpen}
        className="mt-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={input.title}
            onChange={(e) => setInput({ ...input, title: e.target.value })}
            placeholder="O que você quer cumprir"
          />
          <Input
            value={input.description}
            onChange={(e) => setInput({ ...input, description: e.target.value })}
            placeholder="Contexto (opcional)"
          />
        </div>
        <Button
          size="sm"
          className="mt-4"
          onClick={submit}
          disabled={!input.title.trim() || create.isPending}
        >
          Adicionar meta
        </Button>
      </Disclosure>

      <Section
        title="Ciclo de vida"
        detail={`${cycle.index + 1}º ciclo · ${cycle.name} — ${cycle.range} anos`}
        className="mt-10"
      >
        <div className="roadmap">
          {CYCLES.map((c) => (
            <div key={c.index} data-current={c.index === cycle.index}>
              <span>{c.range}</span>
              <p>{c.name}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
