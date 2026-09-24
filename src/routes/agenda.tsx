import { createFileRoute } from "@tanstack/react-router";
import { DailyLogCard } from "@/components/daily-log-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download, FileText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-kit";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { usePrologue } from "@/hooks/use-prologue";
import { defaultAgendaView, type AgendaView } from "@/store/ui-store";

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
  const [view, setView] = useState<AgendaView>(defaultAgendaView);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Livro de bordo"
        title="Agenda"
        description="Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido."
        action={
          <div className="segmented">
            {(["Dia", "Semana", "Mês", "Ano"] as AgendaView[]).map((v) => (
              <button key={v} className={view === v ? "selected" : ""} onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
        }
      />

      <section className="prologue">
        <div className="prologue-icon">
          <FileText />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status status-archive">Início</span>
            <span className="text-xs text-faint">Documento de origem • PDF vivo</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">Relatório dos anos anteriores</h2>
          <div className={`prologue-text ${expanded ? "expanded" : ""}`}>
            {prologueLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : prologue.trim() === "" ? (
              <p className="text-muted-foreground">
                Seu prólogo aparecerá aqui quando você o escrever.
              </p>
            ) : (
              prologue.split("\n").map((p: string, i: number) => <p key={i}>{p}</p>)
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 -ml-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown /> : <ChevronRight />}
            {expanded ? "Recolher relatório" : "Ler relatório completo"}
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Baixar relatório"
          title="Baixar relatório"
        >
          <Download />
        </Button>
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
      ) : (
        <div className="space-y-5">
          {logs.map((log) => (
            <DailyLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </>
  );
}
