import { PageHeader } from "@/components/page-kit";
import { AgendaPlanner } from "@/components/agenda-planner";
import { MeetingRequestsPanel } from "@/components/meeting-requests-panel";

/**
 * Agenda — o coração do app: a rotina recorrente, as exceções pontuais e os
 * pedidos de reunião que aguardam decisão.
 */
export function AgendaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Agenda"
        description="Monte sua rotina fixa, marque folgas pontuais e responda aos pedidos de reunião."
      />
      <MeetingRequestsPanel />
      <div className="mt-10">
        <AgendaPlanner />
      </div>
    </>
  );
}
