import { isSupabaseConfigured } from "@/lib/supabase";
import { currentAccount } from "@/store/auth-store";

// ---------------------------------------------------------------------------
// Onde os dados vivem, agora.
//
// Sem Supabase configurado, tudo é local (localStorage). Com Supabase, os dados
// moram no banco e são protegidos por RLS — EXCETO para o convidado: a sessão de
// convidado não tem identidade no banco, então gravar com o id do convidado
// violaria as políticas. Por isso o convidado sempre usa o armazenamento local,
// mesmo com o Supabase ligado. É uma decisão de segurança, não um atalho.
// ---------------------------------------------------------------------------

/** `true` quando a leitura/escrita deve usar o armazenamento local. */
export function isLocalMode(): boolean {
  if (!isSupabaseConfigured) return true;
  return currentAccount()?.is_guest === true;
}
