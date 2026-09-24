import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/components/insights-page";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Perfil Vivo" },
      { name: "description", content: "Análise de padrões e sugestões personalizadas." },
    ],
  }),
  component: Insights,
});

function Insights() {
  return <InsightsPage />;
}