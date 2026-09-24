import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages";
export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Perfil Vivo" },
      { name: "description", content: "Biografia, objetivos e núcleo familiar da sua trajetória." },
      { property: "og:title", content: "Sobre — Perfil Vivo" },
      { property: "og:description", content: "A pessoa, sua história e seus vínculos essenciais." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});
