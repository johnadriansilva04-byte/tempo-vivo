import { useEffect, type ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SupabaseHealthBanner } from "@/components/supabase-health-banner";
import { useMeetingAlerts } from "@/hooks/use-meeting-alerts";
import { primeNotificationSound } from "@/lib/notification-sound";

/**
 * Casca do app autenticado. Cuida de duas coisas que precisam acontecer em
 * qualquer tela: vigiar pedidos de reunião (com som) e destravar o áudio do
 * navegador no primeiro toque/clique do dono.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useMeetingAlerts();

  useEffect(() => {
    const unlock = () => primeNotificationSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <SidebarNav>
      <SupabaseHealthBanner />
      {children}
    </SidebarNav>
  );
}
