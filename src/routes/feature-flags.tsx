import { createFileRoute } from "@tanstack/react-router";
import { FeatureFlagsPage } from "@/components/feature-flags-page";

export const Route = createFileRoute("/feature-flags")({
  head: () => ({
    meta: [
      { title: "Feature Flags — Perfil Vivo" },
      { name: "description", content: "Gerencie recursos experimentais e funcionalidades." },
    ],
  }),
  component: FeatureFlags,
});

function FeatureFlags() {
  return <FeatureFlagsPage />;
}