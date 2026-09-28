import { createFileRoute } from "@tanstack/react-router";
import { PublicProfilePage } from "@/components/public-profile-page";

export const Route = createFileRoute("/u/$slug")({
  head: () => ({
    meta: [
      { title: "Perfil Vivo" },
      {
        name: "description",
        content:
          "Janela pública: quem é, o que faz, hoje, amanhã, projetos e disponibilidade.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const { slug } = Route.useParams();
  return <PublicProfilePage slug={slug} />;
}
