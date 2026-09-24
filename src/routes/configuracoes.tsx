import { createFileRoute } from "@tanstack/react-router";
import { ConfigPage } from "@/components/config-page";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Perfil Vivo" },
      {
        name: "description",
        content: "Edite seu perfil: nome, cargo, dados de tempo de vida e visual.",
      },
      { property: "og:title", content: "Configurações — Perfil Vivo" },
      {
        property: "og:description",
        content: "Configure o seu perfil vivo — de demonstração para seu perfil real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfigPage,
});
