import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingPage } from "@/components/loading-page";

const GamificationPage = lazy(() => import("@/components/gamification-page").then(m => ({ default: m.GamificationPage })));

export const Route = createFileRoute("/gamification")({
  head: () => ({
    meta: [
      { title: "Gamificação — Perfil Vivo" },
      { name: "description", content: "Conquistas, streaks e seu progresso pessoal." },
    ],
  }),
  component: Gamification,
});

function Gamification() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <GamificationPage />
    </Suspense>
  );
}