import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingPage } from "@/components/loading-page";

const AnalyticsPage = lazy(() => import("@/components/analytics-page").then(m => ({ default: m.AnalyticsPage })));

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Perfil Vivo" },
      { name: "description", content: "Insights avançados sobre sua produtividade e padrões." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AnalyticsPage />
    </Suspense>
  );
}