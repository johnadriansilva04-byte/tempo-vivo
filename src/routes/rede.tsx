import { createFileRoute } from "@tanstack/react-router";
import { NetworkPage } from "@/components/public/network-page";

export const Route = createFileRoute("/rede")({
  head: () => ({
    meta: [
      { title: "Rede — Perfil Vivo" },
      {
        name: "description",
        content: "Todos os perfis públicos do Perfil Vivo, com agenda e conquistas.",
      },
      { property: "og:title", content: "Rede — Perfil Vivo" },
      {
        property: "og:description",
        content: "Encontre pessoas e abra o perfil público com a agenda de cada uma.",
      },
      { property: "og:type", content: "website" },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NetworkPage,
});
