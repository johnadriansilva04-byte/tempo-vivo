import { createFileRoute } from "@tanstack/react-router";
import { GamesPage } from "@/components/pages";
export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "Jogos — Perfil Vivo" },
      {
        name: "description",
        content:
          "A pracinha de jogos do Perfil Vivo: teste de QI, clássicos de tabuleiro e o Campus da Cidadela do Pracinha.",
      },
      { property: "og:title", content: "Jogos — Perfil Vivo" },
      {
        property: "og:description",
        content:
          "Teste de QI, clássicos de estratégia e campus numa pracinha ligada ao seu perfil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});
