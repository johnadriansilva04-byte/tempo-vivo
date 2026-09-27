import { createFileRoute } from "@tanstack/react-router";
import { CreateProfilePage } from "@/components/create-profile-page";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Criar Perfil — Perfil Vivo" },
      { name: "description", content: "Crie seu perfil para começar sua jornada no Perfil Vivo." },
      { property: "og:title", content: "Criar Perfil — Perfil Vivo" },
      { property: "og:description", content: "Transforme sua vida diária em uma trajetória significativa." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateProfile,
});

function CreateProfile() {
  return <CreateProfilePage />;
}
