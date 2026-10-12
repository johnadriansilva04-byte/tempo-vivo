import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Perfil Vivo" },
      {
        name: "description",
        content:
          "Seus projetos por fases sequenciais, com bloqueios, registros imutáveis e histórico completo.",
      },
      { property: "og:title", content: "Projetos — Perfil Vivo" },
      {
        property: "og:description",
        content:
          "Cada projeto é uma trajetória: fases, bloqueios e histórico inviolável.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
