import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, Feather, FileText, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DailyLogCard } from "@/components/daily-log-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-kit";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { usePrologue, useSetPrologue } from "@/hooks/use-prologue";
import { openRitual } from "@/store/ritual-store";
import { StoryText } from "@/components/story-text";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Perfil Vivo" },
      {
        name: "description",
        content: "Livro de bordo cronológico com registros planejados, executados e resumos.",
      },
      { property: "og:title", content: "Agenda — Perfil Vivo" },
      { property: "og:description", content: "Uma memória cronológica confiável da vida real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaRoute,
});

function AgendaRoute() {
  const { logs, isLoading } = useDailyLogs();
  const { prologue, isLoading: prologueLoading } = usePrologue();
  const setPrologue = useSetPrologue();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const hasPrologue = prologue.trim() !== "";

  return (
    <>
      <PageHeader
        eyebrow="Livro de bordo"
        title="Agenda"
        description="Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido."
        action={
          <Button size="sm" onClick={() => openRitual(null)}>
            <Sunrise className="size-3.5" />
            Ritual do dia
          </Button>
        }
      />

      {/* Prólogo — o documento de origem. Escrito pelo dono, editável a qualquer momento. */}
      <section className="prologue rise-in">
        <div className="prologue-icon">
          <FileText />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status status-archive">Início</span>
            <span className="text-xs text-faint">Documento de origem • seu relato</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">Relatório dos anos anteriores</h2>

          {prologueLoading ? (
            <div className="mt-3 h-20 animate-pulse rounded-md border border-border bg-muted" />
          ) : editing ? (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escreva o resumo honesto dos anos que precedem o primeiro dia neste app. Ele fica
                afixado no topo da sua agenda.
              </p>
              <Textarea
                autoFocus
                className="mt-3 min-h-32 text-sm leading-6"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ex.: Nasci em… Cresci… Em … mudei para…, trabalhei…, recomecei… Hoje começo este registro para que os próximos dias deixem sentido."
              />
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={setPrologue.isPending}
                  onClick={() => setPrologue.mutate(draft, { onSuccess: () => setEditing(false) })}
                >
                  {setPrologue.isPending ? "Salvando…" : "Salvar prólogo"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : hasPrologue ? (
            <>
              <div className={`prologue-text ${expanded ? "expanded" : ""}`}>
                {prologue.split("\n").map((p: string, i: number) => (
                  <p key={i}>
                    <StoryText text={p} />
                  </p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronDown /> : <ChevronRight />}
                  {expanded ? "Recolher relatório" : "Ler relatório completo"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => {
                    setDraft(prologue);
                    setEditing(true);
                  }}
                >
                  <Feather className="size-3" />
                  Editar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Você ainda não escreveu o prólogo. É o relato dos anos que precedem este começo — o
                que explica onde você está hoje.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setDraft("");
                  setEditing(true);
                }}
              >
                <Feather className="size-3.5" />
                Escrever meu prólogo
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="timeline-line">
        <span>Daqui em diante, cada dia constrói a história</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Sunrise className="size-5" />}
          title="Sua agenda começa hoje"
          description="Ainda não há registros. Abra o ritual do dia, defina a intenção e, à noite, registre o que de fato aconteceu."
          actionLabel="Abrir o ritual de hoje"
          onAction={() => openRitual(null)}
        />
      ) : (
        <div className="reveal space-y-5">
          {logs.map((log) => (
            <DailyLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </>
  );
}
