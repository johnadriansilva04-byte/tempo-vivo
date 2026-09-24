/** Conta do Perfil Vivo (Supabase Auth ou modo local sem servidor). */
export type Account = {
  id: string;
  name: string;
  /** Telefone normalizado (somente dígitos, com DDD). */
  phone: string;
  age: number;
  /** Derivada da idade informada no cadastro. */
  birth_date: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type SignUpInput = {
  name: string;
  age: number;
  phone: string;
  password: string;
};

export type SignInInput = { phone: string; password: string };

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string };
