import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Perfil Vivo" },
      { name: "description", content: "Visão geral da trajetória viva de Ana Costa." },
      { property: "og:title", content: "Dashboard — Perfil Vivo" },
      {
        property: "og:description",
        content: "Objetivos, memórias, projetos e ciclos de uma trajetória viva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <DashboardPage />;
}
