import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/agenda/agenda-page";

/** `?dia=yyyy-mm-dd` abre a agenda já naquele dia (vindo do Hoje, por ex.). */
type AgendaSearch = { dia?: string };

export const Route = createFileRoute("/agenda")({
  validateSearch: (search: Record<string, unknown>): AgendaSearch => {
    const dia = typeof search["dia"] === "string" ? search["dia"].slice(0, 10) : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? { dia } : {};
  },
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
