import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Shell da aplicação: delega toda a navegação ao componente SidebarNav (Fase 2). */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Só redireciona para auth se Supabase estiver configurado
  if (isSupabaseConfigured && !isLoading && !isAuthenticated && !window.location.pathname.includes("/auth")) {
    navigate({ to: "/auth", replace: true });
    return null;
  }

  return <SidebarNav>{children}</SidebarNav>;
}
