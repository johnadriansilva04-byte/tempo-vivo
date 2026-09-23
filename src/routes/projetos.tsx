import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/pages";
export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Perfil Vivo" },
      { name: "description", content: "Projetos ativos, objetivos e histórico da sua trajetória." },
      { property: "og:title", content: "Projetos — Perfil Vivo" },
      {
        property: "og:description",
        content: "Iniciativas que conectam curiosidade, propósito e impacto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});
