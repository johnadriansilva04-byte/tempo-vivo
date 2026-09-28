import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/pages";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Perfil Vivo" },
      {
        name: "description",
        content:
          "Núcleo do sistema: compromissos recorrentes, exceções, disponibilidade, reuniões e histórico permanente.",
      },
      { property: "og:title", content: "Agenda — Perfil Vivo" },
      {
        property: "og:description",
        content:
          "HOJE, AMANHÃ e a rotina real — mais o histórico que não se reescreve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPage,
});
