import { formatPhone } from "@/lib/identity";
import { isSupabaseConfigured } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Copy da porta de entrada.
//
// Voz de marketing: fala de benefício, não de recurso. Nada de nome de tabela,
// nome de serviço de autenticação ou promessa que o app não cumpre. Cada texto
// existe uma única vez — se a mesma ideia aparecer em dois lugares, um deles
// está sobrando.
// ---------------------------------------------------------------------------

/** Promessa central, no painel de apresentação. */
export const BRAND_PROMISE = "Seu dia organizado — e só quem você quiser vê.";

/** Selo de confiança. Promete só o que o armazenamento atual consegue entregar. */
export const PRIVACY_NOTE = isSupabaseConfigured
  ? "Sua agenda é privada por conta: ninguém além de você entra. Nem por engano."
  : "Sua agenda fica neste navegador, sob sua senha. Nada é publicado em lugar nenhum.";

export const ENTRY_COPY = {
  signup: {
    title: "Crie sua agenda",
    subtitle: "Três passos rápidos. Depois você monta seus horários.",
    submit: "Criar minha agenda",
  },
  signin: {
    title: "Bem-vindo de volta",
    subtitle: "Entre para continuar de onde parou.",
    submit: "Entrar",
  },
} as const;

/** Blocos do cadastro, do que a pessoa é até como ela volta. */
export const SIGNUP_BLOCKS = {
  identity: {
    title: "Quem é você",
    description: "Seu nome e a idade que identificam a sua conta.",
    empty: "É o primeiro dado da sua conta.",
  },
  access: {
    title: "Como você entra",
    description: "Telefone e senha — sem e-mail, sem burocracia.",
    empty: "O telefone é o seu login. A senha é só sua.",
  },
  recovery: {
    title: "Como você volta",
    description:
      "Sem e-mail, esta pergunta devolve a sua conta se a senha falhar.",
    empty: "Escolha algo que só você sabe de cor.",
  },
} as const;

export type SignupBlockId = keyof typeof SIGNUP_BLOCKS;

export const BLOCK_SEQUENCE: SignupBlockId[] = [
  "identity",
  "access",
  "recovery",
];

/** Rótulos e ajudas de campo. Curtos: o rótulo já diz o essencial. */
export const FIELD_HINTS = {
  name: "Como você quer ser chamado",
  age: "Ex.: 34",
  phone: "(11) 98765-4321",
  password: "Mínimo de 4 caracteres",
  confirm: "Repita a senha",
  answer: "Algo que você não esquece",
  customQuestion: "Ex.: Qual o nome da minha primeira rua?",
} as const;

/** Textos que resumem cada bloco fechado — o estado sem abrir nada. */
export function identitySummary(
  name: string,
  age: string,
  done: boolean,
): string {
  return done ? `${name.trim()} · ${age} anos` : SIGNUP_BLOCKS.identity.empty;
}

export function accessSummary(
  phone: string,
  password: string,
  done: boolean,
): string {
  if (phone === "") return SIGNUP_BLOCKS.access.empty;
  const formatted = formatPhone(phone);
  if (password === "") return `${formatted} · falta a senha`;
  return done
    ? `${formatted} · senha definida`
    : `${formatted} · confira a senha`;
}

export function recoverySummary(question: string, done: boolean): string {
  return done ? question : SIGNUP_BLOCKS.recovery.empty;
}
