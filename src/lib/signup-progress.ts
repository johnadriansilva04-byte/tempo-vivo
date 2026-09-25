import { isValidPhone } from "@/lib/identity";

// ---------------------------------------------------------------------------
// Completude dos três blocos do cadastro: identidade, acesso e recuperação.
//
// Vive fora do componente porque é a única regra do cadastro verificável sem
// DOM — e é ela que diz à pessoa, bloco fechado, o que falta para começar.
// ---------------------------------------------------------------------------

export type SignupDraft = {
  name: string;
  age: string;
  phone: string;
  password: string;
  confirm: string;
  question: string;
  answer: string;
};

/** Nome preenchido e idade dentro do horizonte do app (1–120 anos). */
export function isIdentityComplete(draft: Pick<SignupDraft, "name" | "age">): boolean {
  const age = Number(draft.age);
  return draft.name.trim() !== "" && Number.isInteger(age) && age >= 1 && age <= 120;
}

/** Telefone válido, senha com tamanho mínimo e confirmação batendo. */
export function isAccessComplete(
  draft: Pick<SignupDraft, "phone" | "password" | "confirm">,
): boolean {
  return (
    isValidPhone(draft.phone) && draft.password.length >= 4 && draft.password === draft.confirm
  );
}

/** Pergunta escolhida e resposta escrita — a porta de volta da conta. */
export function isRecoveryComplete(draft: Pick<SignupDraft, "question" | "answer">): boolean {
  return draft.question.trim() !== "" && draft.answer.trim() !== "";
}

export type SignupProgress = {
  identity: boolean;
  access: boolean;
  recovery: boolean;
  /** Blocos concluídos, para o selo "1/3" do cabeçalho. */
  completed: number;
  total: number;
  /** Cadastro pronto para enviar. */
  ready: boolean;
};

export function signupProgress(draft: SignupDraft): SignupProgress {
  const identity = isIdentityComplete(draft);
  const access = isAccessComplete(draft);
  const recovery = isRecoveryComplete(draft);
  const flags = [identity, access, recovery];
  return {
    identity,
    access,
    recovery,
    completed: flags.filter(Boolean).length,
    total: flags.length,
    ready: flags.every(Boolean),
  };
}
