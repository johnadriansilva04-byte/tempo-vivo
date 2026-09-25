import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/agenda/agenda-page";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Perfil Vivo" },
      {
        name: "description",
        content: "Calendário com seus compromissos do mês, da semana e do dia.",
      },
      { property: "og:title", content: "Agenda — Perfil Vivo" },
      { property: "og:description", content: "Seus compromissos em um calendário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPage,
});
