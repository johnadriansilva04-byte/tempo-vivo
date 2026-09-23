import { createFileRoute } from "@tanstack/react-router";
import { GamesPage } from "@/components/pages";
export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "Jogos — Perfil Vivo" },
      {
        name: "description",
        content: "Experiências futuras para explorar memória e autoconhecimento.",
      },
      { property: "og:title", content: "Jogos — Perfil Vivo" },
      { property: "og:description", content: "Novas formas de explorar uma trajetória viva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});
