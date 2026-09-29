import { createFileRoute } from "@tanstack/react-router";
import { ConfigPage } from "@/components/config-page";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Perfil Vivo" },
      {
        name: "description",
        content: "Seu link, seus horários e as regras das suas reuniões.",
      },
      { property: "og:title", content: "Configurações — Perfil Vivo" },
      {
        property: "og:description",
        content:
          "Ajuste o link público, a disponibilidade e as regras de reunião.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfigPage,
});
