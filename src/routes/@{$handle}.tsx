import { createFileRoute } from "@tanstack/react-router";
import { PublicProfilePage } from "@/components/public/public-profile-page";

export const Route = createFileRoute("/@{$handle}")({
  head: () => ({
    meta: [
      { title: "Perfil público — Perfil Vivo" },
      {
        name: "description",
        content: "Trajetória, conquistas e projetos de quem vive no Perfil Vivo.",
      },
      { property: "og:title", content: "Perfil público — Perfil Vivo" },
      {
        property: "og:description",
        content: "Trajetória, conquistas e projetos de quem vive no Perfil Vivo.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const { handle } = Route.useParams();
  return <PublicProfilePage handle={handle} />;
}
