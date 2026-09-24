import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingPage } from "@/components/loading-page";

const ExportPage = lazy(() => import("@/components/export-page").then(m => ({ default: m.ExportPage })));

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Exportar — Perfil Vivo" },
      { name: "description", content: "Exporte seus dados em JSON, PDF ou CSV." },
    ],
  }),
  component: Export,
});

function Export() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ExportPage />
    </Suspense>
  );
}