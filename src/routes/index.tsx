import { createFileRoute } from "@tanstack/react-router";
import { HojePage } from "@/components/hoje-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoje — Perfil Vivo" },
      {
        name: "description",
        content:
          "Sua agenda de hoje e amanhã, com os pedidos de reunião pendentes.",
      },
      { property: "og:title", content: "Hoje — Perfil Vivo" },
      {
        property: "og:description",
        content: "Seu dia, sua rotina e seus pedidos de reunião num só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <HojePage />;
}
