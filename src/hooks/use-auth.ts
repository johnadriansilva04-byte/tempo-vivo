import { useEffect, useSyncExternalStore } from "react";
import {
  completeOnboarding,
  getServerSnapshot,
  getSnapshot,
  initAuth,
  signIn,
  signOut,
  signUp,
  subscribe,
  updateAccount,
} from "@/store/auth-store";
import type { Account } from "@/types/auth";

export type AuthState = {
  account: Account | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** `false` enquanto a sessão persistida ainda está sendo restaurada. */
  ready: boolean;
};

/** Estado de autenticação reativo (Supabase Auth ou store local). */
export function useAuth(): AuthState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    initAuth();
  }, []);

  return {
    account: snapshot.account,
    isAuthenticated: snapshot.account !== null,
    isLoading: snapshot.isLoading,
    ready: snapshot.ready,
  };
}

export { completeOnboarding, signIn, signOut, signUp, updateAccount };
