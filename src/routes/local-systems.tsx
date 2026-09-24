import { createFileRoute } from "@tanstack/react-router";
import { LocalSystemsPage } from "@/components/local-systems-page";

export const Route = createFileRoute("/local-systems")({
  head: () => ({
    meta: [
      { title: "Sistemas Locais — Perfil Vivo" },
      { name: "description", content: "10 sistemas 100% self-hosted, zero custo." },
    ],
  }),
  component: LocalSystems,
});

function LocalSystems() {
  return <LocalSystemsPage />;
}