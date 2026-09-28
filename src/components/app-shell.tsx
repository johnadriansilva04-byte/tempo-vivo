import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SupabaseHealthBanner } from "@/components/supabase-health-banner";
import { useProgressionWatcher } from "@/hooks/use-progression-watcher";

export function AppShell({ children }: { children: ReactNode }) {
  useProgressionWatcher();
  return (
    <SidebarNav>
      <SupabaseHealthBanner />
      {children}
    </SidebarNav>
  );
}
