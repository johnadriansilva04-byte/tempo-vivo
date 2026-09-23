import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";

/** Shell da aplicação: delega toda a navegação ao componente SidebarNav (Fase 2). */
export function AppShell({ children }: { children: ReactNode }) {
  return <SidebarNav>{children}</SidebarNav>;
}
