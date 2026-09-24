/** Conta local do Perfil Vivo (fluxo de entrada sem servidor de autenticação). */
export type Account = {
  id: string;
  name: string;
  /** Telefone normalizado (somente dígitos, com DDD). */
  phone: string;
  age: number;
  /** Derivada da idade informada no cadastro. */
  birth_date: string;
  password_hash: string;
  password_salt: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type Session = { user_id: string; started_at: string };

export type SignUpInput = {
  name: string;
  age: number;
  phone: string;
  password: string;
};

export type SignInInput = { phone: string; password: string };
