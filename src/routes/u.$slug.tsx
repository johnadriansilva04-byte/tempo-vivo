import { createFileRoute } from "@tanstack/react-router";
import { PublicProfilePage } from "@/components/public-profile-page";

export const Route = createFileRoute("/u/$slug")({
  head: () => ({
    meta: [
      { title: "Perfil Vivo" },
      {
        name: "description",
        content:
          "Página pública: quem é, seu dia e os horários para marcar uma reunião.",
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
