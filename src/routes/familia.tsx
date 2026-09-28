import { createFileRoute } from "@tanstack/react-router";
import { FamilyManager } from "@/components/family-manager";

export const Route = createFileRoute("/familia")({
  head: () => ({
    meta: [
      { title: "Família — Perfil Vivo" },
      {
        name: "description",
        content:
          "Continuidade digital da família: relações por telefone confirmado, graus e privacidade em camadas.",
      },
      { property: "og:title", content: "Família — Perfil Vivo" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  return <FamilyManager />;
}
