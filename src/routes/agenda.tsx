import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Feather, FileText, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Textarea } from "@/components/ui/textarea";
import { DailyLogCard } from "@/components/daily-log-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSkeleton } from "@/components/page-kit";
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
      { property: "twitter:card", content: "summary_large_image" },
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
        mark="I"
        description="Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido."
        lede="A vida só vira história quando alguém a registra. Este é o seu livro de bordo."
        action={
          <Button size="sm" onClick={() => openRitual(null)}>
            <Sunrise className="size-3.5" />
            Ritual do dia
          </Button>
        }
      />

      <div className="timeline-line">
        <span>Daqui em diante, cada dia constrói a história</span>
      </div>

      {isLoading ? (
        <PageSkeleton lines={2} rows={3} />
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

      {/* Prólogo — o documento de origem. Fecha a leitura: o passado explica o presente. */}
      <Disclosure
        icon={FileText}
        title="Relatório dos anos anteriores"
        description="Documento de origem • seu relato"
        badge={hasPrologue ? "Escrito" : "Em aberto"}
        summary={
          hasPrologue
            ? prologue
                .split("\n")
                .find((line) => line.trim() !== "")
                ?.trim()
            : "O resumo honesto dos anos que precedem o primeiro dia neste app."
        }
        open={expanded || editing}
        onOpenChange={(v) => setExpanded(v)}
        action={
          hasPrologue && !editing ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setDraft(prologue);
                setEditing(true);
              }}
            >
              <Feather className="size-3" />
              Editar
            </Button>
          ) : undefined
        }
      >
        {prologueLoading ? (
          <div className="skeleton h-20" />
        ) : editing ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
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
          <div className="prologue-text expanded">
            {prologue.split("\n").map((p: string, i: number) => (
              <p key={i}>
                <StoryText text={p} />
              </p>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
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
      </Disclosure>
    </>
  );
}
