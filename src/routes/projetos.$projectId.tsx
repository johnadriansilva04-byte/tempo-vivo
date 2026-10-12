import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetail } from "@/components/projects/project-detail";

export const Route = createFileRoute("/projetos/$projectId")({
  head: () => ({
    meta: [
      { title: "Projeto — Perfil Vivo" },
      {
        name: "description",
        content:
          "Trajetória do projeto: resumo, fases sequenciais, missões e histórico.",
      },
      { property: "og:title", content: "Projeto — Perfil Vivo" },
      {
        property: "og:description",
        content: "Resumo, fases, bloqueios, missões e registros congelados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  return <ProjectDetail projectId={projectId} />;
}
