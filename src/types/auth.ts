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
  /** Pergunta secreta escolhida no cadastro — sustenta o "esqueci a senha". */
  recovery_question?: string;
  recovery_answer?: string;
};

export type SignInInput = { phone: string; password: string };

/** Resultado de conferir a resposta secreta: o ticket autoriza trocar a senha. */
export type RecoveryChallenge = { ok: true; token: string } | { ok: false; error: string };

/** Retorno simples de uma ação sem payload. */
export type ActionOutcome = { ok: true } | { ok: false; error: string };

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string };
