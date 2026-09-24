import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthScreen } from "@/components/auth-screen";
import { StartLifeFlow } from "@/components/start-life-flow";
import { useAuth } from "@/hooks/use-auth";

/** Porteiro do app: sem conta → entrada; primeiro acesso → criar a história. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const activeId = account?.id ?? "anonymous";
  const previousId = useRef(activeId);

  useEffect(() => {
    if (previousId.current === activeId) return;
    previousId.current = activeId;
    // Troca de conta: descarta o cache para não misturar histórias.
    queryClient.clear();
  }, [activeId, queryClient]);

  if (!account) return <AuthScreen />;
  if (!account.onboarding_completed) return <StartLifeFlow />;
  return <>{children}</>;
}
