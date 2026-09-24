import { createFileRoute } from "@tanstack/react-router";
import { IntelligenceDashboardPage } from "@/components/intelligence-dashboard-page";

export const Route = createFileRoute("/intelligence-dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de Inteligência — Perfil Vivo" },
      { name: "description", content: "IA local combinando predição, sentimento e recomendações." },
    ],
  }),
  component: IntelligenceDashboard,
});

function IntelligenceDashboard() {
  return <IntelligenceDashboardPage />;
}