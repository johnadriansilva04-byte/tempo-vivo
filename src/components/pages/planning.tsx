import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { PageHeader, Section } from "@/components/page-kit";
import { FocusCard } from "@/components/focus-card";
import { Disclosure } from "@/components/ui/disclosure";
import { useCreateFocus } from "@/hooks/use-weekly-focus";
import { useAuth } from "@/hooks/use-auth";
import { CYCLES, cycleForAge } from "@/lib/life-story";

// --------------------------------------------------------------- PlanningPage

export function PlanningPage() {
  const [input, setInput] = useState({ title: "", description: "" });
  const [open, setOpen] = useState(false);
  const create = useCreateFocus();
  const { account } = useAuth();
  const cycle = cycleForAge(account?.age ?? 0);
  const submit = () => {
    if (!input.title.trim()) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      (Math.floor((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7,
    );
    create.mutate(
      {
        title: input.title.trim(),
        description: input.description.trim(),
        week_number: week,
        year: now.getFullYear(),
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
        eyebrow="Direção consciente"
        title="Planejamento"
        mark="III"
        description="Objetivos que conectam intenção, ações e o futuro que está sendo construído."
        lede="Semana sem direção vira semana perdida. Aqui a intenção vira compromisso visível."
      />
      <Section title="Metas da semana" detail="Progresso comprometido, não desejado">
        <FocusCard />
        <Disclosure
          icon={Plus}
          title="Nova meta da semana"
          description="Um título e, se quiser, uma linha de contexto."
          summary={
            input.title.trim() ? input.title : "Abra para comprometer mais uma frente da semana."
          }
          open={open}
          onOpenChange={setOpen}
          className="mt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Título
              </label>
              <Input
                value={input.title}
                onChange={(e) => setInput({ ...input, title: e.target.value })}
                placeholder="O que você quer cumprir"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Descrição
              </label>
              <Input
                value={input.description}
                onChange={(e) => setInput({ ...input, description: e.target.value })}
                placeholder="Opcional"
              />
            </div>
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
      </Section>

      <Section
        title="Horizonte do ciclo"
        detail={`${cycle.index + 1}º ciclo · ${cycle.name} — ${cycle.range} anos`}
        className="mt-10"
      >
        <p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Seu ciclo atual trata de {cycle.intent}. As metas da semana são o que transforma esse
          propósito em movimento.
        </p>
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
