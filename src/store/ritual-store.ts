import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Estado do ritual do dia.
//
// O ritual é global: a paleta de comando, o dashboard e a agenda precisam abrir
// o mesmo diálogo. Um store externo simples evita prop-drilling e mantém o
// diálogo montado uma única vez, no shell da aplicação.
// ---------------------------------------------------------------------------

export type RitualPhase = "manha" | "noite";

export type RitualState = { open: boolean; phase: RitualPhase | null };

let state: RitualState = { open: false, phase: null };
const listeners = new Set<() => void>();

function emit(next: RitualState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): RitualState {
  return state;
}

const SERVER_SNAPSHOT: RitualState = { open: false, phase: null };
function getServerSnapshot(): RitualState {
  return SERVER_SNAPSHOT;
}

/** Abre o ritual do dia. Sem fase definida, o app escolhe pela hora do registro. */
export function openRitual(phase: RitualPhase | null = null): void {
  emit({ open: true, phase });
}

export function setRitualOpen(open: boolean): void {
  emit({ ...state, open });
}

export function useRitual(): RitualState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
