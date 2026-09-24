import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Autenticação — Perfil Vivo" },
      { name: "description", content: "Entre ou crie sua conta no Perfil Vivo." },
    ],
  }),
  component: Auth,
});

function Auth() {
  return <AuthPage />;
}