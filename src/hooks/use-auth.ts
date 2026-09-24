import { useSyncExternalStore } from "react";
import {
  completeOnboarding,
  currentAccount,
  getServerSnapshot,
  getSnapshot,
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
};

/** Estado de autenticação reativo sobre o store local (sincroniza entre abas). */
export function useAuth(): AuthState {
  const db = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const account = currentAccount(db);
  return { account, isAuthenticated: account !== null, isLoading: false };
}

export { completeOnboarding, signIn, signOut, signUp, updateAccount };
