import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/projects/projects-page";

export const Route = createFileRoute("/projetos/")({
  component: ProjectsPage,
});
