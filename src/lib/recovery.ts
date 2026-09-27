// ---------------------------------------------------------------------------
// Recuperação de senha: perguntas secretas.
//
// O app entra só com telefone + senha, sem e-mail, então não existe link de
// "esqueci minha senha". A saída é a pergunta secreta: a pessoa escolhe uma,
// responde quando precisa e define uma senha nova.
//
// Aqui vive só a parte pura — normalização, validação e o catálogo de
// perguntas. Quem confere a resposta é o Supabase (função SECURITY DEFINER);
// o cliente nunca vê o hash.
// ---------------------------------------------------------------------------

/** Perguntas prontas para quem não quer inventar. Todas fáceis de recordar. */
export const RECOVERY_QUESTIONS = [
  "Qual o nome da sua primeira escola?",
  "Qual o nome do seu primeiro animal de estimação?",
  "Em que cidade você nasceu?",
  "Qual o apelido de infância que só a família usava?",
  "Qual foi o seu primeiro emprego?",
  "Qual o nome do seu melhor amigo de infância?",
] as const;

export const MIN_ANSWER_LENGTH = 2;
const MAX_QUESTION_LENGTH = 120;

/**
 * Normaliza a resposta do mesmo jeito que o banco: minúsculas, sem acento e
 * com espaços colapsados. É o que permite a pessoa digitar "Escola São José"
 * no cadastro e "escola sao jose" na recuperação e ainda acertar.
 *
 * O banco repete esta regra em private.normalize_answer; as duas precisam
 * concordar.
 */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function isValidQuestion(question: string): boolean {
  return question.trim().length >= 3 && question.trim().length <= MAX_QUESTION_LENGTH;
}

export function isValidAnswer(answer: string): boolean {
  return normalizeAnswer(answer).length >= MIN_ANSWER_LENGTH;
}

/** Diz se a pergunta veio do catálogo pronto (e não foi escrita pela pessoa). */
export function isPresetQuestion(question: string): boolean {
  return (RECOVERY_QUESTIONS as readonly string[]).includes(question.trim());
}
