import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { birthDateFromAge, isValidPhone, normalizePhone, phoneToEmail } from "@/lib/identity";
import { isValidAnswer, isValidQuestion, normalizeAnswer } from "@/lib/recovery";
import type {
  Account,
  ActionOutcome,
  AuthResult,
  RecoveryChallenge,
  SignInInput,
  SignUpInput,
} from "@/types/auth";

// ---------------------------------------------------------------------------
// Autenticação do Perfil Vivo.
//
// Dois modos, mesma interface:
// - Supabase configurado → contas reais no Supabase Auth (e-mail sintético
//   derivado do telefone) e sessão persistida pelo próprio SDK. É o modo que
//   sincroniza entre dispositivos e é protegido por RLS.
// - Sem credenciais → contas locais no localStorage, com senha em hash + salt.
//   Serve para rodar e testar sem servidor; não sincroniza entre navegadores.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:auth:v1";

type LocalAuthDB = { accounts: LocalAccount[]; session: { user_id: string } | null };
type LocalAccount = Account & {
  password_hash: string;
  password_salt: string;
  recovery_question?: string;
  recovery_answer_hash?: string;
  recovery_answer_salt?: string;
};

export type AuthState = { account: Account | null; isLoading: boolean; ready: boolean };

const EMPTY_STATE: AuthState = { account: null, isLoading: false, ready: !isSupabaseConfigured };

let state: AuthState = EMPTY_STATE;
const listeners = new Set<() => void>();

function emit(next: AuthState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AuthState {
  return state;
}

export function getServerSnapshot(): AuthState {
  return EMPTY_STATE;
}

/** Conta logada — usada por serviços fora do React (ex.: onboarding). */
export function currentAccount(): Account | null {
  return state.account;
}

// --------------------------------------------------------------- modo local

function readLocal(): LocalAuthDB {
  if (typeof window === "undefined") return { accounts: [], session: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalAuthDB) : { accounts: [], session: null };
  } catch {
    return { accounts: [], session: null };
  }
}

function writeLocal(db: LocalAuthDB): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* storage indisponível: mantém apenas em memória */
    }
  }
}

function randomSalt(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2).padEnd(32, "0");
}

/** SHA-256(salt + senha). Não é Argon2, mas nunca guardamos a senha em claro. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== "undefined" && "subtle" in crypto) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0;
  const text = `${salt}:${password}`;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `weak-${(h >>> 0).toString(16)}`;
}

function localAccountFrom(db: LocalAuthDB): Account | null {
  if (!db.session) return null;
  return db.accounts.find((a) => a.id === db.session?.user_id) ?? null;
}

function publishLocal(): void {
  emit({ account: localAccountFrom(readLocal()), isLoading: false, ready: true });
}

// ------------------------------------------------------------- modo Supabase

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  age: number | null;
  birth_date: string | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
};

function accountFromProfile(row: ProfileRow): Account {
  return {
    id: row.id,
    name: row.full_name ?? "",
    phone: row.phone ?? "",
    age: row.age ?? 0,
    birth_date: (row.birth_date ?? "").slice(0, 10),
    onboarding_completed: Boolean(row.onboarding_completed),
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const db = supabase;
  if (!db) return null;
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

/** Garante que existe a linha de perfil do usuário autenticado. */
async function ensureProfileRow(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<ProfileRow> {
  const db = supabase;
  if (!db) throw new Error("Supabase não configurado");

  const existing = await fetchProfileRow(user.id);
  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const phone = normalizePhone(String(meta["phone"] ?? user.email?.split("@")[0] ?? ""));
  const rawAge = Number(meta["age"] ?? 0);
  const age = Number.isFinite(rawAge) && rawAge > 0 ? Math.round(rawAge) : null;
  const { data, error } = await db
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: String(meta["full_name"] ?? ""),
        phone: phone || null,
        age,
        birth_date: age !== null ? birthDateFromAge(age) : null,
      } as never,
      { onConflict: "id", ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

async function loadRemoteAccount(user?: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = supabase;
  if (!db) return;

  let target = user;
  if (!target) {
    const { data } = await db.auth.getSession();
    target = data.session?.user;
  }
  if (!target) {
    writeLocal({ accounts: [], session: null });
    emit({ account: null, isLoading: false, ready: true });
    return;
  }
  try {
    const row = await ensureProfileRow(target);
    // Escopo local alinhado ao usuário remoto (fallback offline por conta).
    writeLocal({ accounts: [], session: { user_id: target.id } });
    emit({ account: accountFromProfile(row), isLoading: false, ready: true });
  } catch (e) {
    // Falha transitória (rede/RLS) não pode derrubar uma sessão válida.
    console.warn("[auth] falha ao carregar perfil:", e);
    if (state.account) emit({ ...state, isLoading: false, ready: true });
    else emit({ account: null, isLoading: false, ready: true });
  }
}

let initialized = false;

/** Inicializa o modo (Supabase ou local) uma única vez por carga da página. */
export function initAuth(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (!isSupabaseConfigured || !supabase) {
    publishLocal();
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) publishLocal();
    });
    return;
  }

  emit({ account: null, isLoading: true, ready: false });
  void loadRemoteAccount();
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      writeLocal({ accounts: [], session: null });
      emit({ account: null, isLoading: false, ready: true });
      return;
    }
    if (event === "INITIAL_SESSION") {
      if (session?.user) void loadRemoteAccount(session.user);
      else emit({ account: null, isLoading: false, ready: true });
      return;
    }
    if (
      (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") &&
      session?.user
    ) {
      // Usa o usuário do próprio evento: chamar getSession() aqui trava o lock
      // interno do supabase-js e a sessão nunca é aplicada.
      void loadRemoteAccount(session.user);
    }
  });
}

// ------------------------------------------------------------------ cadastro

function invalidSignUp(input: SignUpInput): string | null {
  if (input.name.trim().length < 2) return "Informe seu nome completo.";
  if (!Number.isFinite(input.age) || input.age < 1 || input.age > 120)
    return "Informe uma idade entre 1 e 120 anos.";
  if (!isValidPhone(input.phone)) return "Informe um telefone com DDD válido.";
  if (input.password.length < 4) return "A senha precisa de ao menos 4 caracteres.";
  if (input.recovery_question !== undefined && !isValidQuestion(input.recovery_question))
    return "Escolha uma pergunta secreta (ou escreva a sua).";
  if (input.recovery_answer !== undefined && !isValidAnswer(input.recovery_answer))
    return "A resposta secreta precisa de ao menos 2 caracteres.";
  return null;
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const invalid = invalidSignUp(input);
  if (invalid) return { ok: false, error: invalid };

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const age = Math.round(input.age);

  if (isSupabaseConfigured && supabase) {
    emit({ ...state, isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password: input.password,
      options: { data: { full_name: name, phone, age } },
    });
    if (error) {
      emit({ ...state, isLoading: false });
      const duplicate = /already|registered|exists/i.test(error.message);
      return {
        ok: false,
        error: duplicate ? "Já existe uma conta com este telefone." : error.message,
      };
    }
    if (!data.session || !data.user) {
      emit({ ...state, isLoading: false });
      return {
        ok: false,
        error:
          "Conta criada, mas o login automático está desativado. Desative a confirmação de e-mail no Supabase Auth para entrar direto.",
      };
    }
    try {
      const row = await ensureProfileRow(data.user);
      writeLocal({ accounts: [], session: { user_id: data.user.id } });
      const account = accountFromProfile(row);
      emit({ account, isLoading: false, ready: true });
      // Pergunta secreta é o que sustenta o "esqueci a senha". Falhar aqui não
      // pode derrubar o cadastro — a pessoa define depois em Configurações.
      await saveRecoverySecret(input.recovery_question, input.recovery_answer);
      return { ok: true, account };
    } catch (e) {
      emit({ ...state, isLoading: false });
      return { ok: false, error: e instanceof Error ? e.message : "Falha ao criar o perfil." };
    }
  }

  const db = readLocal();
  if (db.accounts.some((a) => a.phone === phone))
    return { ok: false, error: "Já existe uma conta com este telefone." };

  const salt = randomSalt();
  const account: LocalAccount = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    phone,
    age,
    birth_date: birthDateFromAge(age),
    password_hash: await hashPassword(input.password, salt),
    password_salt: salt,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    ...(input.recovery_question && input.recovery_answer
      ? {
          recovery_question: input.recovery_question.trim(),
          recovery_answer_hash: await hashPassword(normalizeAnswer(input.recovery_answer), salt),
          recovery_answer_salt: salt,
        }
      : {}),
  };
  writeLocal({
    accounts: [...db.accounts, account],
    session: { user_id: account.id },
  });
  publishLocal();
  return { ok: true, account };
}

// -------------------------------------------------------------------- login

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const phone = normalizePhone(input.phone);

  if (isSupabaseConfigured && supabase) {
    emit({ ...state, isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: input.password,
    });
    if (error) {
      emit({ ...state, isLoading: false });
      return { ok: false, error: "Telefone ou senha incorretos." };
    }
    try {
      const row = await ensureProfileRow(data.user);
      writeLocal({ accounts: [], session: { user_id: data.user.id } });
      const account = accountFromProfile(row);
      emit({ account, isLoading: false, ready: true });
      return { ok: true, account };
    } catch (e) {
      emit({ ...state, isLoading: false });
      return { ok: false, error: e instanceof Error ? e.message : "Falha ao carregar o perfil." };
    }
  }

  const db = readLocal();
  const account = db.accounts.find((a) => a.phone === phone);
  if (!account) return { ok: false, error: "Não encontramos uma conta com este telefone." };
  const hash = await hashPassword(input.password, account.password_salt);
  if (hash !== account.password_hash) return { ok: false, error: "Senha incorreta." };

  writeLocal({ ...db, session: { user_id: account.id } });
  publishLocal();
  return { ok: true, account };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    writeLocal({ accounts: [], session: null });
    emit({ account: null, isLoading: false, ready: true });
    return;
  }
  const db = readLocal();
  writeLocal({ ...db, session: null });
  publishLocal();
}

// ---------------------------------------------------------------- pós-login

/** Marca a conta logada como "história iniciada". */
export async function completeOnboarding(): Promise<void> {
  const account = state.account;
  if (!account) return;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", account.id);
    if (error) throw error;
    emit({ ...state, account: { ...account, onboarding_completed: true } });
    return;
  }

  const db = readLocal();
  writeLocal({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === account.id ? { ...a, onboarding_completed: true } : a,
    ),
  });
  publishLocal();
}

/** Atualiza nome/idade na conta — mantém perfil e credenciais coerentes. */
export async function updateAccount(
  userId: string,
  patch: Partial<Pick<Account, "name" | "age">>,
): Promise<void> {
  const age = patch.age !== undefined ? Math.round(patch.age) : undefined;

  if (isSupabaseConfigured && supabase) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row["full_name"] = patch.name;
    if (age !== undefined) {
      row["age"] = age;
      row["birth_date"] = birthDateFromAge(age);
    }
    if (Object.keys(row).length > 0) {
      const { error } = await supabase.from("profiles").update(row).eq("id", userId);
      if (error) throw error;
    }
    if (state.account?.id === userId) {
      emit({
        ...state,
        account: {
          ...state.account,
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(age !== undefined ? { age, birth_date: birthDateFromAge(age) } : {}),
        },
      });
    }
    return;
  }

  const db = readLocal();
  writeLocal({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === userId
        ? {
            ...a,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(age !== undefined ? { age, birth_date: birthDateFromAge(age) } : {}),
          }
        : a,
    ),
  });
  publishLocal();
}

// ------------------------------------------------------- recuperar senha

/**
 * Defere a confirmação da resposta ao banco quando há Supabase: é lá que o
 * hash vive e onde a comparação acontece. O cliente manda a resposta em claro
 * (é o que a pessoa digitou), nunca recebe o hash de volta.
 */
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T | null> {
  const db = supabase;
  if (!db) return null;
  const { data, error } = await db.rpc(name, args);
  if (error) throw error;
  return (data as T) ?? null;
}

/** Grava (ou troca) a pergunta secreta da conta logada. */
export async function saveRecoverySecret(
  question?: string,
  answer?: string,
): Promise<ActionOutcome> {
  if (question === undefined || answer === undefined) return { ok: true };
  if (!isValidQuestion(question)) return { ok: false, error: "Escolha uma pergunta secreta." };
  if (!isValidAnswer(answer)) return { ok: false, error: "A resposta secreta é muito curta." };

  const account = state.account;
  if (!account) return { ok: false, error: "Entre na sua conta para salvar isso." };

  if (isSupabaseConfigured && supabase) {
    try {
      await rpc("recovery_set_secret", {
        p_question: question.trim(),
        p_answer: answer,
      });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Não foi possível salvar a pergunta secreta.",
      };
    }
  }

  const db = readLocal();
  const salt = randomSalt();
  const answerHash = await hashPassword(normalizeAnswer(answer), salt);
  writeLocal({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === account.id
        ? {
            ...a,
            recovery_question: question.trim(),
            recovery_answer_hash: answerHash,
            recovery_answer_salt: salt,
          }
        : a,
    ),
  });
  return { ok: true };
}

/** Pergunta ativa da conta logada (só a pergunta — nunca a resposta). */
export async function myRecoverySecret(): Promise<{ set: boolean; question: string | null }> {
  const account = state.account;
  if (!account) return { set: false, question: null };

  if (isSupabaseConfigured && supabase) {
    try {
      const data = await rpc<{ set: boolean; question: string | null }>("recovery_my_secret", {});
      return data ?? { set: false, question: null };
    } catch {
      return { set: false, question: null };
    }
  }

  const local = readLocal().accounts.find((a) => a.id === account.id);
  return local?.recovery_question
    ? { set: true, question: local.recovery_question }
    : { set: false, question: null };
}

/** Passo 1: mostra a pergunta cadastrada para aquele telefone. */
export async function recoveryQuestionFor(phone: string): Promise<string | null> {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      return await rpc<string | null>("recovery_hint", { p_phone: normalized });
    } catch {
      return null;
    }
  }

  const account = readLocal().accounts.find((a) => a.phone === normalized);
  return account?.recovery_question ?? null;
}

/** Passo 2: confere a resposta e, se certa, devolve o comprovante. */
export async function verifyRecoveryAnswer(
  phone: string,
  answer: string,
): Promise<RecoveryChallenge> {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return { ok: false, error: "Telefone inválido." };
  if (!isValidAnswer(answer))
    return { ok: false, error: "A resposta precisa de ao menos 2 caracteres." };

  if (isSupabaseConfigured && supabase) {
    try {
      const token = await rpc<string | null>("recovery_verify", {
        p_phone: normalized,
        p_answer: answer,
      });
      if (!token) return { ok: false, error: "Resposta secreta incorreta." };
      return { ok: true, token };
    } catch {
      return { ok: false, error: "Não foi possível conferir a resposta agora." };
    }
  }

  const db = readLocal();
  const account = db.accounts.find((a) => a.phone === normalized);
  if (!account?.recovery_answer_hash || !account.recovery_answer_salt)
    return { ok: false, error: "Esta conta não tem pergunta secreta cadastrada." };
  const candidate = await hashPassword(normalizeAnswer(answer), account.recovery_answer_salt);
  if (candidate !== account.recovery_answer_hash)
    return { ok: false, error: "Resposta secreta incorreta." };
  return { ok: true, token: account.id };
}

/** Passo 3: define a nova senha usando o comprovante obtido no passo 2. */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<ActionOutcome> {
  if (newPassword.length < 4)
    return { ok: false, error: "A senha precisa de ao menos 4 caracteres." };

  if (isSupabaseConfigured && supabase) {
    try {
      const done = await rpc<boolean>("recovery_reset", {
        p_token: token,
        p_new_password: newPassword,
      });
      if (!done) return { ok: false, error: "O prazo da recuperação expirou. Comece de novo." };
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Não foi possível trocar a senha.",
      };
    }
  }

  const db = readLocal();
  const account = db.accounts.find((a) => a.id === token);
  if (!account) return { ok: false, error: "Recuperação inválida." };
  const salt = randomSalt();
  const hash = await hashPassword(newPassword, salt);
  writeLocal({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === account.id ? { ...a, password_hash: hash, password_salt: salt } : a,
    ),
  });
  return { ok: true };
}
