import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/agenda-page";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Perfil Vivo" },
      {
        name: "description",
        content:
          "Sua rotina recorrente, folgas pontuais e os pedidos de reunião que esperam resposta.",
      },
      { property: "og:title", content: "Agenda — Perfil Vivo" },
      {
        property: "og:description",
        content: "Compromissos fixos, exceções e reuniões a aprovar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPage,
});
